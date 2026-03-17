import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { createDemoLabel } from './demo-store';

interface CreateLabelInput {
  boardId: string;
  name: string;
  color: string;
}

async function createLabel({ boardId, name, color }: CreateLabelInput) {
  if (isDemoMode) {
    return createDemoLabel(boardId, name, color);
  }

  const { data, error } = await supabase
    .from('labels')
    .insert({ board_id: boardId, name, color })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data;
}

export function useCreateLabelMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLabel,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['labels', variables.boardId] });
    },
  });
}
