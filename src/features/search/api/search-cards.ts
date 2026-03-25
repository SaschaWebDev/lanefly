import { useQuery } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { getDemoColumns } from '@/features/columns/api/demo-store';
import type { Card } from '@/types/common';

interface SearchFilters {
  assigneeId?: string;
  status?: 'active' | 'done';
}

async function searchCards(boardId: string, query: string, filters: SearchFilters): Promise<Card[]> {
  if (isDemoMode) {
    const columns = getDemoColumns(boardId);
    let cards = columns.flatMap((col) => col.cards);
    if (query) {
      const lower = query.toLowerCase();
      cards = cards.filter((c) =>
        c.title.toLowerCase().includes(lower) ||
        c.description?.toLowerCase().includes(lower)
      );
    }
    if (filters.assigneeId) {
      cards = cards.filter((c) => c.assignee_id === filters.assigneeId);
    }
    if (filters.status) {
      cards = cards.filter((c) => c.status === filters.status);
    }
    return cards.slice(0, 50);
  }

  let builder = supabase
    .from('cards')
    .select('id, column_id, board_id, title, description, status, position, assignee_id, due_date, created_at, updated_at, archived_at, archived_with_column')
    .eq('board_id', boardId)
    .is('archived_at', null);

  if (query) {
    builder = builder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  }
  if (filters.assigneeId) {
    builder = builder.eq('assignee_id', filters.assigneeId);
  }
  if (filters.status) {
    builder = builder.eq('status', filters.status);
  }

  const { data, error } = await builder.order('updated_at', { ascending: false }).limit(50);

  if (error) handleSupabaseError(error);
  return data;
}

export function useSearchCardsQuery(boardId: string | undefined, query: string, filters: SearchFilters) {
  return useQuery({
    queryKey: ['search', boardId, query, filters],
    queryFn: () => {
      if (!boardId) throw new Error('boardId is required');
      return searchCards(boardId, query, filters);
    },
    enabled: !!boardId && (!!query || !!filters.assigneeId || !!filters.status),
  });
}
