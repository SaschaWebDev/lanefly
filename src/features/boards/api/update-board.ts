import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { updateDemoBoard } from './demo-store';

interface UpdateBoardInput {
  boardId: string;
  title?: string;
  background?: string | null;
}

async function updateBoard({ boardId, ...updates }: UpdateBoardInput) {
  if (isDemoMode) {
    updateDemoBoard(boardId, updates);
    return;
  }

  const { error } = await supabase
    .from('boards')
    .update(updates)
    .eq('id', boardId);

  if (error) handleSupabaseError(error);
}

export function useUpdateBoardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBoard,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
      void queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}
