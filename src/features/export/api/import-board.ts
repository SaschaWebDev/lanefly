import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { createDemoColumn, createDemoCard, getDemoColumns } from '@/features/columns/api/demo-store';

interface ImportColumn {
  title: string;
  cards: Array<{
    title: string;
    description?: string | null;
    status?: string;
    due_date?: string | null;
  }>;
}

interface ImportResult {
  columns: number;
  cards: number;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field);
        field = '';
        i++;
      } else if (ch === '\r') {
        if (i + 1 < text.length && text[i + 1] === '\n') {
          i++;
        }
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        i++;
      } else if (ch === '\n') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

async function getMaxColumnPosition(boardId: string): Promise<number> {
  if (isDemoMode) {
    const cols = getDemoColumns(boardId);
    if (cols.length === 0) return 0;
    return Math.max(...cols.map((c) => c.position));
  }

  const { data, error } = await supabase
    .from('columns')
    .select('position')
    .eq('board_id', boardId)
    .is('archived_at', null)
    .order('position', { ascending: false })
    .limit(1);

  if (error) handleSupabaseError(error);
  if (!data || data.length === 0) return 0;
  const first = data[0];
  if (!first) return 0;
  return first.position;
}

async function insertColumns(
  boardId: string,
  columns: ImportColumn[],
  startPosition: number,
): Promise<ImportResult> {
  let totalCards = 0;

  if (isDemoMode) {
    for (const [i, colData] of columns.entries()) {
      const colPos = startPosition + (i + 1) * 1024;
      const col = createDemoColumn(boardId, colData.title, colPos);

      for (const [j, cardData] of colData.cards.entries()) {
        createDemoCard(boardId, col.id, cardData.title, (j + 1) * 1024);
        totalCards++;
      }
    }
    return { columns: columns.length, cards: totalCards };
  }

  for (const [i, colData] of columns.entries()) {
    const colPos = startPosition + (i + 1) * 1024;

    const { data: col, error: colError } = await supabase
      .from('columns')
      .insert({ board_id: boardId, title: colData.title, position: colPos })
      .select('id')
      .single();

    if (colError) handleSupabaseError(colError);

    if (colData.cards.length > 0) {
      const cardRows = colData.cards.map((card, j) => ({
        column_id: col.id,
        board_id: boardId,
        title: card.title,
        description: card.description ?? null,
        status: card.status === 'done' ? ('done' as const) : ('active' as const),
        due_date: card.due_date ?? null,
        position: (j + 1) * 1024,
      }));

      const { error: cardError } = await supabase.from('cards').insert(cardRows);
      if (cardError) handleSupabaseError(cardError);
      totalCards += cardRows.length;
    }
  }

  return { columns: columns.length, cards: totalCards };
}

export async function importBoardFromJson(boardId: string, file: File): Promise<ImportResult> {
  const text = await file.text();
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON file');
  }

  if (typeof parsed !== 'object' || parsed === null || !('columns' in parsed)) {
    throw new Error('Invalid format: missing "columns" array');
  }

  const obj = parsed as { columns: unknown };
  if (!Array.isArray(obj.columns)) {
    throw new Error('Invalid format: "columns" must be an array');
  }

  const columns: ImportColumn[] = [];
  for (const col of obj.columns) {
    if (typeof col !== 'object' || col === null || typeof col.title !== 'string') {
      throw new Error('Invalid format: each column must have a "title" string');
    }
    const cards: ImportColumn['cards'] = [];
    if (Array.isArray(col.cards)) {
      for (const card of col.cards) {
        if (typeof card !== 'object' || card === null || typeof card.title !== 'string') {
          throw new Error('Invalid format: each card must have a "title" string');
        }
        cards.push({
          title: card.title,
          description: typeof card.description === 'string' ? card.description : null,
          status: typeof card.status === 'string' ? card.status : 'active',
          due_date: typeof card.due_date === 'string' ? card.due_date : null,
        });
      }
    }
    columns.push({ title: col.title, cards });
  }

  if (columns.length === 0) {
    throw new Error('No columns found in file');
  }

  const maxPos = await getMaxColumnPosition(boardId);
  return insertColumns(boardId, columns, maxPos);
}

export async function importBoardFromCsv(boardId: string, file: File): Promise<ImportResult> {
  const text = await file.text();
  const rows = parseCSV(text);

  if (rows.length < 2) {
    throw new Error('CSV file must have a header row and at least one data row');
  }

  const headerRow = rows[0];
  if (!headerRow) {
    throw new Error('CSV file is empty');
  }
  const header = headerRow.map((h) => h.trim().toLowerCase());
  const colIdx = header.indexOf('column');
  const titleIdx = header.indexOf('title');

  if (colIdx === -1 || titleIdx === -1) {
    throw new Error('CSV must have "Column" and "Title" headers');
  }

  const descIdx = header.indexOf('description');
  const statusIdx = header.indexOf('status');
  const dueIdx = header.indexOf('due date');

  const columnMap = new Map<string, ImportColumn>();
  const columnOrder: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const colName = row[colIdx]?.trim();
    const cardTitle = row[titleIdx]?.trim();

    if (!colName || !cardTitle) continue;

    if (!columnMap.has(colName)) {
      columnMap.set(colName, { title: colName, cards: [] });
      columnOrder.push(colName);
    }

    columnMap.get(colName)?.cards.push({
      title: cardTitle,
      description: descIdx !== -1 ? (row[descIdx]?.trim() || null) : null,
      status: statusIdx !== -1 ? (row[statusIdx]?.trim() || 'active') : 'active',
      due_date: dueIdx !== -1 ? (row[dueIdx]?.trim() || null) : null,
    });
  }

  const columns = columnOrder.map((name) => columnMap.get(name)).filter(Boolean) as ImportColumn[];

  if (columns.length === 0) {
    throw new Error('No valid data found in CSV');
  }

  const maxPos = await getMaxColumnPosition(boardId);
  return insertColumns(boardId, columns, maxPos);
}
