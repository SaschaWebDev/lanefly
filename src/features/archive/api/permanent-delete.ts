import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { permanentDeleteDemoColumn, permanentDeleteDemoCard } from '@/features/columns/api/demo-store';
import { permanentDeleteDemoLane } from '@/features/lanes/api/demo-store';

interface PermanentDeleteInput {
  boardId: string;
  type: 'lane' | 'column' | 'card';
  id: string;
}

async function permanentDelete({ boardId, type, id }: PermanentDeleteInput) {
  if (isDemoMode) {
    if (type === 'lane') {
      permanentDeleteDemoLane(boardId, id);
    } else if (type === 'column') {
      permanentDeleteDemoColumn(boardId, id);
    } else {
      permanentDeleteDemoCard(boardId, id);
    }
    return;
  }

  if (type === 'lane') {
    // Delete all columns in the lane (cascade deletes cards via FK)
    const { data: laneCols, error: fetchErr } = await supabase
      .from('columns')
      .select('id')
      .eq('lane_id', id);

    if (fetchErr) handleSupabaseError(fetchErr);

    for (const col of laneCols) {
      const { error: cardErr } = await supabase
        .from('cards')
        .delete()
        .eq('column_id', col.id);
      if (cardErr) handleSupabaseError(cardErr);
    }

    if (laneCols.length > 0) {
      const { error: colErr } = await supabase
        .from('columns')
        .delete()
        .eq('lane_id', id);
      if (colErr) handleSupabaseError(colErr);
    }

    const { error } = await supabase.from('lanes').delete().eq('id', id);
    if (error) handleSupabaseError(error);
  } else if (type === 'column') {
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
      void queryClient.invalidateQueries({ queryKey: ['lanes', variables.boardId] });
    },
  });
}
