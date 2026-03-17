import { useQuery } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { unwrapResult } from '@/lib/api-client';
import type { BoardWithRole } from '../types';
import { getDemoBoard } from './demo-store';

async function fetchBoard(boardId: string): Promise<BoardWithRole> {
  if (isDemoMode) {
    const board = getDemoBoard(boardId);
    if (!board) {
      throw new Error('Board not found');
    }
    return board;
  }

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('boards')
    .select('id, title, background, owner_id, created_at, updated_at, archived_at, board_members!inner(role)')
    .eq('id', boardId)
    .is('archived_at', null)
    .single();

  const board = unwrapResult(data, error);
  const member = board.board_members[0];
  if (!member) throw new Error('Board member not found');

  const { data: favData } = await supabase
    .from('board_favorites')
    .select('id')
    .eq('board_id', boardId)
    .eq('user_id', authUser.id);

  return {
    id: board.id,
    title: board.title,
    background: board.background,
    owner_id: board.owner_id,
    created_at: board.created_at,
    updated_at: board.updated_at,
    archived_at: board.archived_at,
    role: member.role,
    is_favorite: (favData?.length ?? 0) > 0,
  };
}

export function useBoardQuery(boardId: string | undefined) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: () => {
      if (!boardId) throw new Error('boardId is required');
      return fetchBoard(boardId);
    },
    enabled: !!boardId,
  });
}
