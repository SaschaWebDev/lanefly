import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { restoreDemoLane } from '@/features/lanes/api/demo-store';
import { restoreDemoColumn } from '@/features/columns/api/demo-store';
import { getDemoColumns } from '@/features/columns/api/demo-store';
import { handleSupabaseError } from '@/lib/api-client';

interface RestoreLaneInput {
  boardId: string;
  laneId: string;
}

async function restoreLane({ boardId, laneId }: RestoreLaneInput) {
  if (isDemoMode) {
    restoreDemoLane(boardId, laneId);
    // Also restore columns that belong to this lane
    const allCols = getDemoColumns(boardId);
    for (const col of allCols) {
      if (col.lane_id === laneId && col.archived_at) {
        restoreDemoColumn(boardId, col.id);
      }
    }
    return;
  }

  // Restore the lane
  const { error: laneErr } = await supabase
    .from('lanes')
    .update({ archived_at: null })
    .eq('id', laneId);

  if (laneErr) handleSupabaseError(laneErr);

  // Restore columns in this lane
  const { error: colErr } = await supabase
    .from('columns')
    .update({ archived_at: null })
    .eq('lane_id', laneId)
    .not('archived_at', 'is', null);

  if (colErr) handleSupabaseError(colErr);

  // Restore cards that were archived with their columns
  const { data: restoredCols, error: fetchErr } = await supabase
    .from('columns')
    .select('id')
    .eq('lane_id', laneId);

  if (fetchErr) handleSupabaseError(fetchErr);

  for (const col of restoredCols) {
    const { error: cardErr } = await supabase
      .from('cards')
      .update({ archived_at: null, archived_with_column: false })
      .eq('column_id', col.id)
      .eq('archived_with_column', true);

    if (cardErr) handleSupabaseError(cardErr);
  }
}

export function useRestoreLaneMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreLane,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['lanes', variables.boardId] });
      void queryClient.invalidateQueries({ queryKey: ['columns', variables.boardId] });
      void queryClient.invalidateQueries({ queryKey: ['archived', variables.boardId] });
    },
  });
}
