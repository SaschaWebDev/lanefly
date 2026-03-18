import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { createDemoColumn, createDemoCard, getDemoColumns } from '@/features/columns/api/demo-store';
import { createDemoLane, getDemoLanes } from '@/features/lanes/api/demo-store';


interface ImportColumn {
  title: string;
  cards: Array<{
    title: string;
    description?: string | null;
    status?: string;
    due_date?: string | null;
  }>;
}

interface ImportLane {
  title: string;
  columns: ImportColumn[];
}

interface ImportResult {
  lanes: number;
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

async function getMaxLanePosition(boardId: string): Promise<number> {
  if (isDemoMode) {
    const lanes = getDemoLanes(boardId);
    if (lanes.length === 0) return 0;
    return Math.max(...lanes.map((l) => l.position));
  }

  const { data, error } = await supabase
    .from('lanes')
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
  laneId?: string,
): Promise<{ columns: number; cards: number }> {
  let totalCards = 0;

  if (isDemoMode) {
    for (const [i, colData] of columns.entries()) {
      const colPos = startPosition + (i + 1) * 1024;
      const col = createDemoColumn(boardId, colData.title, colPos, laneId);

      for (const [j, cardData] of colData.cards.entries()) {
        createDemoCard(boardId, col.id, cardData.title, (j + 1) * 1024);
        totalCards++;
      }
    }
    return { columns: columns.length, cards: totalCards };
  }

  for (const [i, colData] of columns.entries()) {
    const colPos = startPosition + (i + 1) * 1024;

    const insertData: { board_id: string; title: string; position: number; lane_id?: string } = {
      board_id: boardId,
      title: colData.title,
      position: colPos,
    };
    if (laneId) insertData.lane_id = laneId;

    const { data: col, error: colError } = await supabase
      .from('columns')
      .insert(insertData)
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

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid format: expected JSON object');
  }

  const obj = parsed as { columns?: unknown; lanes?: unknown };

  // Handle lanes if present
  let totalLanes = 0;
  let totalColumns = 0;
  let totalCards = 0;

  if (Array.isArray(obj.lanes) && obj.lanes.length > 0) {
    const importLanes: ImportLane[] = [];
    for (const lane of obj.lanes) {
      if (typeof lane !== 'object' || lane === null || typeof lane.title !== 'string') {
        throw new Error('Invalid format: each lane must have a "title" string');
      }
      const columns: ImportColumn[] = [];
      if (Array.isArray(lane.columns)) {
        for (const col of lane.columns) {
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
      }
      importLanes.push({ title: lane.title, columns });
    }

    let lanePos = await getMaxLanePosition(boardId);

    for (const laneData of importLanes) {
      lanePos += 1024;

      let laneId: string;
      if (isDemoMode) {
        const lane = createDemoLane(boardId, laneData.title, lanePos);
        laneId = lane.id;
      } else {
        const { data: lane, error } = await supabase
          .from('lanes')
          .insert({ board_id: boardId, title: laneData.title, position: lanePos })
          .select('id')
          .single();
        if (error) handleSupabaseError(error);
        laneId = lane.id;
      }

      totalLanes++;
      const result = await insertColumns(boardId, laneData.columns, 0, laneId);
      totalColumns += result.columns;
      totalCards += result.cards;
    }
  }

  // Handle top-level columns (unassigned or flat boards)
  if (Array.isArray(obj.columns) && obj.columns.length > 0) {
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

    const maxPos = await getMaxColumnPosition(boardId);
    const result = await insertColumns(boardId, columns, maxPos);
    totalColumns += result.columns;
    totalCards += result.cards;
  }

  if (totalLanes === 0 && totalColumns === 0) {
    throw new Error('No columns or lanes found in file');
  }

  return { lanes: totalLanes, columns: totalColumns, cards: totalCards };
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

  const laneIdx = header.indexOf('lane');
  const colIdx = header.indexOf('column');
  const titleIdx = header.indexOf('title');

  if (colIdx === -1 || titleIdx === -1) {
    throw new Error('CSV must have "Column" and "Title" headers');
  }

  const descIdx = header.indexOf('description');
  const statusIdx = header.indexOf('status');
  const dueIdx = header.indexOf('due date');

  const hasLaneColumn = laneIdx !== -1;

  // Group by lane then column
  const laneMap = new Map<string, Map<string, ImportColumn>>();
  const laneOrder: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const laneName = hasLaneColumn ? (row[laneIdx]?.trim() ?? '') : '';
    const colName = row[colIdx]?.trim();
    const cardTitle = row[titleIdx]?.trim();

    if (!colName || !cardTitle) continue;

    if (!laneMap.has(laneName)) {
      laneMap.set(laneName, new Map());
      laneOrder.push(laneName);
    }

    const columnMap = laneMap.get(laneName)!;
    if (!columnMap.has(colName)) {
      columnMap.set(colName, { title: colName, cards: [] });
    }

    columnMap.get(colName)?.cards.push({
      title: cardTitle,
      description: descIdx !== -1 ? (row[descIdx]?.trim() || null) : null,
      status: statusIdx !== -1 ? (row[statusIdx]?.trim() || 'active') : 'active',
      due_date: dueIdx !== -1 ? (row[dueIdx]?.trim() || null) : null,
    });
  }

  let totalLanes = 0;
  let totalColumns = 0;
  let totalCards = 0;

  // Check if there are actual lane names (not just empty string)
  const namedLanes = laneOrder.filter((name) => name !== '');

  if (namedLanes.length > 0) {
    let lanePos = await getMaxLanePosition(boardId);

    for (const laneName of laneOrder) {
      const columnMap = laneMap.get(laneName);
      if (!columnMap) continue;
      const columns = Array.from(columnMap.values());

      if (laneName === '') {
        // Unassigned columns
        const maxPos = await getMaxColumnPosition(boardId);
        const result = await insertColumns(boardId, columns, maxPos);
        totalColumns += result.columns;
        totalCards += result.cards;
      } else {
        lanePos += 1024;
        let laneId: string;

        if (isDemoMode) {
          const lane = createDemoLane(boardId, laneName, lanePos);
          laneId = lane.id;
        } else {
          const { data: lane, error } = await supabase
            .from('lanes')
            .insert({ board_id: boardId, title: laneName, position: lanePos })
            .select('id')
            .single();
          if (error) handleSupabaseError(error);
          laneId = lane.id;
        }

        totalLanes++;
        const result = await insertColumns(boardId, columns, 0, laneId);
        totalColumns += result.columns;
        totalCards += result.cards;
      }
    }
  } else {
    // No lane column or all empty — flat import
    const columnMap = laneMap.get('');
    if (!columnMap) throw new Error('No valid data found in CSV');
    const columns = Array.from(columnMap.values());

    if (columns.length === 0) {
      throw new Error('No valid data found in CSV');
    }

    const maxPos = await getMaxColumnPosition(boardId);
    const result = await insertColumns(boardId, columns, maxPos);
    totalColumns = result.columns;
    totalCards = result.cards;
  }

  if (totalColumns === 0) {
    throw new Error('No valid data found in CSV');
  }

  return { lanes: totalLanes, columns: totalColumns, cards: totalCards };
}
