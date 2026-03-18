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

interface ExportLane {
  title: string;
  columns: ExportColumn[];
}

interface ExportData {
  title: string;
  lanes?: ExportLane[];
  columns: ExportColumn[];
}

async function fetchBoardData(boardId: string): Promise<ExportData> {
  if (isDemoMode) {
    return { title: 'Demo Board', columns: [] };
  }

  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('title')
    .eq('id', boardId)
    .single();

  if (boardError) handleSupabaseError(boardError);

  // Fetch lanes
  const { data: lanes, error: laneError } = await supabase
    .from('lanes')
    .select('id, title')
    .eq('board_id', boardId)
    .is('archived_at', null)
    .order('position', { ascending: true });

  if (laneError) handleSupabaseError(laneError);

  const { data: columns, error: colError } = await supabase
    .from('columns')
    .select('id, title, lane_id, cards(title, description, status, due_date)')
    .eq('board_id', boardId)
    .is('archived_at', null)
    .order('position', { ascending: true });

  if (colError) handleSupabaseError(colError);

  const mapColumn = (col: typeof columns[number]): ExportColumn => ({
    title: col.title,
    cards: col.cards,
  });

  if (lanes.length > 0) {
    const exportLanes: ExportLane[] = lanes.map((lane) => ({
      title: lane.title,
      columns: columns
        .filter((c) => c.lane_id === lane.id)
        .map(mapColumn),
    }));

    // Include unassigned columns at top level
    const unassigned = columns.filter((c) => !c.lane_id).map(mapColumn);

    return {
      title: board.title,
      lanes: exportLanes,
      columns: unassigned,
    };
  }

  return {
    title: board.title,
    columns: columns.map(mapColumn),
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
  const hasLanes = data.lanes && data.lanes.length > 0;
  const headers = hasLanes
    ? 'Lane,Column,Title,Description,Status,Due Date'
    : 'Column,Title,Description,Status,Due Date';
  const rows: string[] = [headers];

  if (hasLanes && data.lanes) {
    for (const lane of data.lanes) {
      for (const col of lane.columns) {
        for (const card of col.cards) {
          rows.push([
            escapeCSV(lane.title),
            escapeCSV(col.title),
            escapeCSV(card.title),
            escapeCSV(card.description ?? ''),
            escapeCSV(card.status),
            escapeCSV(card.due_date ?? ''),
          ].join(','));
        }
      }
    }
    // Unassigned columns
    for (const col of data.columns) {
      for (const card of col.cards) {
        rows.push([
          escapeCSV(''),
          escapeCSV(col.title),
          escapeCSV(card.title),
          escapeCSV(card.description ?? ''),
          escapeCSV(card.status),
          escapeCSV(card.due_date ?? ''),
        ].join(','));
      }
    }
  } else {
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
  }

  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `${data.title}.csv`);
}
