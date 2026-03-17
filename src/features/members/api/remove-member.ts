import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';

interface RemoveMemberInput {
  boardId: string;
  memberId: string;
}

async function removeMember({ memberId }: RemoveMemberInput) {
  if (isDemoMode) return;

  const { error } = await supabase
    .from('board_members')
    .delete()
    .eq('id', memberId);

  if (error) handleSupabaseError(error);
}

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeMember,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['board-members', variables.boardId] });
    },
  });
}
