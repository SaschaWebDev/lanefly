import { useQuery } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { getDemoArchivedColumns, getDemoArchivedCards } from '@/features/columns/api/demo-store';
import { handleSupabaseError } from '@/lib/api-client';
import type { Column, Card } from '@/types/common';

interface ArchivedItems {
  columns: Column[];
  cards: Card[];
}

async function fetchArchived(boardId: string): Promise<ArchivedItems> {
  if (isDemoMode) {
    return { columns: getDemoArchivedColumns(boardId), cards: getDemoArchivedCards(boardId) };
  }

  const { data: cols, error: colErr } = await supabase
    .from('columns')
    .select('id, board_id, title, position, created_at, updated_at, archived_at')
    .eq('board_id', boardId)
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false });

  if (colErr) handleSupabaseError(colErr);

  const { data: cards, error: cardErr } = await supabase
    .from('cards')
    .select('id, column_id, board_id, title, description, status, position, assignee_id, due_date, created_at, updated_at, archived_at, archived_with_column')
    .eq('board_id', boardId)
    .not('archived_at', 'is', null)
    .eq('archived_with_column', false)
    .order('archived_at', { ascending: false });

  if (cardErr) handleSupabaseError(cardErr);

  return {
    columns: cols,
    cards: cards,
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
