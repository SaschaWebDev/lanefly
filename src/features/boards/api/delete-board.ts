import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';

interface DeleteBoardInput {
  boardId: string;
}

async function deleteBoard({ boardId }: DeleteBoardInput) {
  if (isDemoMode) return;

  const { error } = await supabase
    .from('boards')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', boardId);

  if (error) handleSupabaseError(error);
}

export function useDeleteBoardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBoard,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}
