import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { restoreDemoColumn } from '@/features/columns/api/demo-store';
import { handleSupabaseError } from '@/lib/api-client';

interface RestoreColumnInput {
  boardId: string;
  columnId: string;
}

async function restoreColumn({ boardId, columnId }: RestoreColumnInput) {
  if (isDemoMode) {
    restoreDemoColumn(boardId, columnId);
    return;
  }

  const { error: colErr } = await supabase
    .from('columns')
    .update({ archived_at: null })
    .eq('id', columnId);

  if (colErr) handleSupabaseError(colErr);

  const { error: cardErr } = await supabase
    .from('cards')
    .update({ archived_at: null, archived_with_column: false })
    .eq('column_id', columnId)
    .eq('archived_with_column', true);

  if (cardErr) handleSupabaseError(cardErr);
}

export function useRestoreColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreColumn,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['columns', variables.boardId] });
      void queryClient.invalidateQueries({ queryKey: ['archived', variables.boardId] });
    },
  });
}
