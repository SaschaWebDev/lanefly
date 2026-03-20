import { useQuery } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { getDemoArchivedColumnsWithCounts, getDemoArchivedCards, getDemoArchivedLanesWithCounts } from '@/features/columns/api/demo-store';
import { handleSupabaseError } from '@/lib/api-client';
import type { Column, Card, Lane } from '@/types/common';

export interface ArchivedLaneWithCount extends Lane {
  columnCount: number;
}
export interface ArchivedColumnWithCount extends Column {
  cardCount: number;
}
interface ArchivedItems {
  lanes: ArchivedLaneWithCount[];
  columns: ArchivedColumnWithCount[];
  cards: Card[];
}

async function fetchArchived(boardId: string): Promise<ArchivedItems> {
  if (isDemoMode) {
    return {
      lanes: getDemoArchivedLanesWithCounts(boardId),
      columns: getDemoArchivedColumnsWithCounts(boardId),
      cards: getDemoArchivedCards(boardId),
    };
  }

  const { data: lanes, error: laneErr } = await supabase
    .from('lanes')
    .select('id, board_id, title, position, created_at, updated_at, archived_at')
    .eq('board_id', boardId)
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false });

  if (laneErr) handleSupabaseError(laneErr);

  const archivedLaneIds = (lanes ?? []).map((l) => l.id);
  let laneColCounts: Record<string, number> = {};
  if (archivedLaneIds.length > 0) {
    const { data: colCountRows, error: lcErr } = await supabase
      .from('columns').select('lane_id').in('lane_id', archivedLaneIds);
    if (lcErr) handleSupabaseError(lcErr);
    for (const row of colCountRows ?? []) {
      if (row.lane_id) laneColCounts[row.lane_id] = (laneColCounts[row.lane_id] ?? 0) + 1;
    }
  }
  const enrichedLanes = (lanes ?? []).map((lane) => ({ ...lane, columnCount: laneColCounts[lane.id] ?? 0 }));

  const { data: cols, error: colErr } = await supabase
    .from('columns')
    .select('id, board_id, lane_id, title, position, created_at, updated_at, archived_at')
    .eq('board_id', boardId)
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false });

  if (colErr) handleSupabaseError(colErr);

  const archivedColIds = (cols ?? []).map((c) => c.id);
  let colCardCounts: Record<string, number> = {};
  if (archivedColIds.length > 0) {
    const { data: cardCountRows, error: ccErr } = await supabase
      .from('cards').select('column_id').in('column_id', archivedColIds);
    if (ccErr) handleSupabaseError(ccErr);
    for (const row of cardCountRows ?? []) {
      colCardCounts[row.column_id] = (colCardCounts[row.column_id] ?? 0) + 1;
    }
  }
  const enrichedCols = (cols ?? []).map((col) => ({ ...col, cardCount: colCardCounts[col.id] ?? 0 }));

  const { data: cards, error: cardErr } = await supabase
    .from('cards')
    .select('id, column_id, board_id, title, description, status, position, assignee_id, due_date, created_at, updated_at, archived_at, archived_with_column')
    .eq('board_id', boardId)
    .not('archived_at', 'is', null)
    .eq('archived_with_column', false)
    .order('archived_at', { ascending: false });

  if (cardErr) handleSupabaseError(cardErr);

  return {
    lanes: enrichedLanes,
    columns: enrichedCols,
    cards: cards ?? [],
  };
}

export function useArchivedItemsQuery(boardId: string | undefined) {
  return useQuery({
    queryKey: ['archived', boardId],
    queryFn: () => {
      if (!boardId) throw new Error('boardId is required');
      return fetchArchived(boardId);
    },
    enabled: !!boardId,
  });
}
