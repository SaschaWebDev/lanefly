import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { createDemoColumn } from './demo-store';

interface CreateColumnInput {
  boardId: string;
  title: string;
  position: number;
}

async function createColumn({ boardId, title, position }: CreateColumnInput) {
  if (isDemoMode) {
    return createDemoColumn(boardId, title, position);
  }

  const { data, error } = await supabase
    .from('columns')
    .insert({ board_id: boardId, title, position })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data;
}

export function useCreateColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createColumn,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['columns', variables.boardId] });
    },
  });
}
