import { useQuery } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import type { BoardWithMembership } from '../types';
import type { BoardRole } from '@/types/database';
import { getDemoBoards } from './demo-store';

async function fetchBoards(userId: string): Promise<BoardWithMembership[]> {
  if (isDemoMode) {
    return getDemoBoards();
  }

  const { data, error } = await supabase
    .from('boards')
    .select(
      'id, title, background, owner_id, created_at, updated_at, archived_at, board_members!inner(role)',
    )
    .eq('board_members.user_id', userId)
    .is('archived_at', null)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!data) return [];

  const { data: favorites } = await supabase
    .from('board_favorites')
    .select('board_id')
    .eq('user_id', userId);

  const favoriteIds = new Set(favorites?.map((f) => f.board_id));

  return data.map((b) => ({
    id: b.id,
    title: b.title,
    background: b.background,
    owner_id: b.owner_id,
    created_at: b.created_at,
    updated_at: b.updated_at,
    archived_at: b.archived_at,
    board_members: b.board_members.map((m) => ({
      role: m.role as BoardRole,
    })),
    is_favorite: favoriteIds.has(b.id),
  }));
}

export function useBoardsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['boards', userId],
    queryFn: () => fetchBoards(userId!),
    enabled: !!userId,
  });
}
