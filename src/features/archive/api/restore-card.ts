import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { updateDemoCard } from '@/features/columns/api/demo-store';
import { handleSupabaseError } from '@/lib/api-client';

interface RestoreCardInput {
  boardId: string;
  cardId: string;
}

async function restoreCard({ boardId, cardId }: RestoreCardInput) {
  if (isDemoMode) {
    updateDemoCard(boardId, cardId, { archived_at: null });
    return;
  }

  const { error } = await supabase
    .from('cards')
    .update({ archived_at: null, archived_with_column: false })
    .eq('id', cardId);

  if (error) handleSupabaseError(error);
}

export function useRestoreCardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreCard,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['columns', variables.boardId] });
      void queryClient.invalidateQueries({ queryKey: ['archived', variables.boardId] });
    },
  });
}
