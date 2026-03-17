import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import type { CardStatus } from '@/types/database';
import { updateDemoCard } from '@/features/columns/api/demo-store';

interface UpdateCardInput {
  boardId: string;
  cardId: string;
  title?: string;
  description?: string | null;
  status?: CardStatus;
  assignee_id?: string | null;
  due_date?: string | null;
}

async function updateCard({ boardId, cardId, ...updates }: UpdateCardInput) {
  if (isDemoMode) {
    updateDemoCard(boardId, cardId, updates);
    return;
  }

  const { error } = await supabase
    .from('cards')
    .update(updates)
    .eq('id', cardId);

  if (error) handleSupabaseError(error);
}

export function useUpdateCardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCard,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['columns', variables.boardId] });
    },
  });
}
