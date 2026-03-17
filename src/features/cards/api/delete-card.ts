import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { deleteDemoCard } from '@/features/columns/api/demo-store';

interface DeleteCardInput {
  boardId: string;
  cardId: string;
}

async function deleteCard({ boardId, cardId }: DeleteCardInput) {
  if (isDemoMode) {
    deleteDemoCard(boardId, cardId);
    return;
  }

  const { error } = await supabase
    .from('cards')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', cardId);

  if (error) handleSupabaseError(error);
}

export function useDeleteCardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCard,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['columns', variables.boardId] });
    },
  });
}
