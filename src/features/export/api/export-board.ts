import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { downloadBlob } from '@/lib/download';

interface ExportColumn {
  title: string;
  cards: Array<{
    title: string;
    description: string | null;
    status: string;
    due_date: string | null;
  }>;
}

async function fetchBoardData(boardId: string): Promise<{ title: string; columns: ExportColumn[] }> {
  if (isDemoMode) {
    return { title: 'Demo Board', columns: [] };
  }

  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('title')
    .eq('id', boardId)
    .single();

  if (boardError) handleSupabaseError(boardError);

  const { data: columns, error: colError } = await supabase
    .from('columns')
    .select('title, cards(title, description, status, due_date)')
    .eq('board_id', boardId)
    .is('archived_at', null)
    .order('position', { ascending: true });

  if (colError) handleSupabaseError(colError);

  return {
    title: board.title,
    columns: columns.map((col) => ({
      title: col.title,
      cards: col.cards,
    })),
  };
}

export async function exportBoardToJson(boardId: string): Promise<void> {
  const data = await fetchBoardData(boardId);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, `${data.title}.json`);
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportBoardToCsv(boardId: string): Promise<void> {
  const data = await fetchBoardData(boardId);
  const rows: string[] = ['Column,Title,Description,Status,Due Date'];

  for (const col of data.columns) {
    for (const card of col.cards) {
      rows.push([
        escapeCSV(col.title),
        escapeCSV(card.title),
        escapeCSV(card.description ?? ''),
        escapeCSV(card.status),
        escapeCSV(card.due_date ?? ''),
      ].join(','));
    }
  }

  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `${data.title}.csv`);
}
