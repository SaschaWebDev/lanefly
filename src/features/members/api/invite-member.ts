import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import type { BoardRole } from '@/types/database';

interface InviteMemberInput {
  boardId: string;
  userId: string;
  role: BoardRole;
}

async function inviteMember({ boardId, userId, role }: InviteMemberInput) {
  if (isDemoMode) return;

  const { error } = await supabase
    .from('board_members')
    .insert({ board_id: boardId, user_id: userId, role });

  if (error) handleSupabaseError(error);
}

export function useInviteMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inviteMember,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['board-members', variables.boardId] });
    },
  });
}
