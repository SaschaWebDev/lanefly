import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { toggleDemoCardLabel } from './demo-store';

interface ToggleCardLabelInput {
  cardId: string;
  labelId: string;
  boardId: string;
  isActive: boolean;
}

async function toggleCardLabel({ cardId, labelId, isActive }: ToggleCardLabelInput) {
  if (isDemoMode) {
    toggleDemoCardLabel(cardId, labelId);
    return;
  }

  if (isActive) {
    const { error } = await supabase
      .from('card_labels')
      .delete()
      .eq('card_id', cardId)
      .eq('label_id', labelId);
    if (error) handleSupabaseError(error);
  } else {
    const { error } = await supabase
      .from('card_labels')
      .insert({ card_id: cardId, label_id: labelId });
    if (error) handleSupabaseError(error);
  }
}

export function useToggleCardLabelMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleCardLabel,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['card', variables.cardId] });
      void queryClient.invalidateQueries({ queryKey: ['columns', variables.boardId] });
    },
  });
}
