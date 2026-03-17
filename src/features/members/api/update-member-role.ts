import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import type { BoardRole } from '@/types/database';

interface UpdateRoleInput {
  boardId: string;
  memberId: string;
  role: BoardRole;
}

async function updateMemberRole({ memberId, role }: UpdateRoleInput) {
  if (isDemoMode) return;

  const { error } = await supabase
    .from('board_members')
    .update({ role })
    .eq('id', memberId);

  if (error) handleSupabaseError(error);
}

export function useUpdateMemberRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMemberRole,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['board-members', variables.boardId] });
    },
  });
}
