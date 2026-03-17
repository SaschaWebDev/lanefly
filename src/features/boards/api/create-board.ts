import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import type { Board } from '@/types/common';
import { createDemoBoard } from './demo-store';

interface CreateBoardInput {
  title: string;
  background?: string;
  ownerId: string;
}

async function createBoard({
  title,
  background,
  ownerId,
}: CreateBoardInput): Promise<Board> {
  if (isDemoMode) {
    return createDemoBoard(title, background ?? null);
  }

  const { data: board, error: boardError } = await supabase
    .from('boards')
    .insert({ title, background: background ?? null, owner_id: ownerId })
    .select(
      'id, title, background, owner_id, created_at, updated_at, archived_at',
    )
    .single();

  if (boardError) throw new Error(boardError.message);

  const { error: memberError } = await supabase
    .from('board_members')
    .insert({ board_id: board.id, user_id: ownerId, role: 'admin' });

  if (memberError) throw new Error(memberError.message);

  return board;
}

export function useCreateBoardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBoard,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}
