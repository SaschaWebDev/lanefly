import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { updateDemoColumn } from './demo-store';

interface DeleteColumnInput {
  boardId: string;
  columnId: string;
}

async function deleteColumn({ boardId, columnId }: DeleteColumnInput) {
  const archivedAt = new Date().toISOString();

  if (isDemoMode) {
    updateDemoColumn(boardId, columnId, { archived_at: archivedAt });
    return;
  }

  const { error: cardError } = await supabase
    .from('cards')
    .update({ archived_at: archivedAt, archived_with_column: true })
    .eq('column_id', columnId)
    .is('archived_at', null);

  if (cardError) handleSupabaseError(cardError);

  const { error } = await supabase
    .from('columns')
    .update({ archived_at: archivedAt })
    .eq('id', columnId);

  if (error) handleSupabaseError(error);
}

export function useDeleteColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteColumn,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['columns', variables.boardId] });
    },
  });
}
