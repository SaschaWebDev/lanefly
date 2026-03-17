import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { permanentDeleteDemoColumn, permanentDeleteDemoCard } from '@/features/columns/api/demo-store';

interface PermanentDeleteInput {
  boardId: string;
  type: 'column' | 'card';
  id: string;
}

async function permanentDelete({ boardId, type, id }: PermanentDeleteInput) {
  if (isDemoMode) {
    if (type === 'column') {
      permanentDeleteDemoColumn(boardId, id);
    } else {
      permanentDeleteDemoCard(boardId, id);
    }
    return;
  }

  if (type === 'column') {
    const { error: cardErr } = await supabase
      .from('cards')
      .delete()
      .eq('column_id', id);
    if (cardErr) handleSupabaseError(cardErr);

    const { error } = await supabase.from('columns').delete().eq('id', id);
    if (error) handleSupabaseError(error);
  } else {
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) handleSupabaseError(error);
  }
}

export function usePermanentDeleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: permanentDelete,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['archived', variables.boardId] });
      void queryClient.invalidateQueries({ queryKey: ['columns', variables.boardId] });
    },
  });
}
