import { useQuery } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import type { ColumnWithCards } from '../types';
import { getDemoColumns } from './demo-store';

async function fetchColumns(boardId: string): Promise<ColumnWithCards[]> {
  if (isDemoMode) {
    return getDemoColumns(boardId)
      .sort((a, b) => a.position - b.position)
      .map((col) => ({
        ...col,
        cards: [...col.cards].sort((a, b) => a.position - b.position),
      }));
  }

  const { data, error } = await supabase
    .from('columns')
    .select('id, board_id, lane_id, title, position, created_at, updated_at, archived_at, cards(id, column_id, board_id, title, description, status, position, assignee_id, due_date, created_at, updated_at, archived_at, archived_with_column)')
    .eq('board_id', boardId)
    .is('archived_at', null)
    .order('position', { ascending: true });

  if (error) handleSupabaseError(error);

  return data.map((col) => ({
    id: col.id,
    board_id: col.board_id,
    lane_id: col.lane_id,
    title: col.title,
    position: col.position,
    created_at: col.created_at,
    updated_at: col.updated_at,
    archived_at: col.archived_at,
    cards: col.cards
      .filter((c) => !c.archived_at)
      .sort((a, b) => a.position - b.position),
  }));
}

export function useColumnsQuery(boardId: string | undefined) {
  return useQuery({
    queryKey: ['columns', boardId],
    queryFn: () => {
      if (!boardId) throw new Error('boardId is required');
      return fetchColumns(boardId);
    },
    enabled: !!boardId,
  });
}
