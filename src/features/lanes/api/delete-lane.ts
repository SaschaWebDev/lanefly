import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { updateDemoLane } from './demo-store';
import { getDemoColumns, updateDemoColumn } from '@/features/columns/api/demo-store';

interface DeleteLaneInput {
  boardId: string;
  laneId: string;
}

async function deleteLane({ boardId, laneId }: DeleteLaneInput) {
  const archivedAt = new Date().toISOString();

  if (isDemoMode) {
    updateDemoLane(boardId, laneId, { archived_at: archivedAt });
    // Cascade: archive columns in this lane
    const cols = getDemoColumns(boardId);
    for (const col of cols) {
      if (col.lane_id === laneId) {
        updateDemoColumn(boardId, col.id, { archived_at: archivedAt });
      }
    }
    return;
  }

  // Archive all columns in this lane (which also cascades to cards via the column archive pattern)
  const { data: laneCols, error: colFetchErr } = await supabase
    .from('columns')
    .select('id')
    .eq('lane_id', laneId)
    .is('archived_at', null);

  if (colFetchErr) handleSupabaseError(colFetchErr);

  for (const col of laneCols) {
    // Archive cards in this column
    const { error: cardErr } = await supabase
      .from('cards')
      .update({ archived_at: archivedAt, archived_with_column: true })
      .eq('column_id', col.id)
      .is('archived_at', null);

    if (cardErr) handleSupabaseError(cardErr);
  }

  // Archive the columns
  if (laneCols.length > 0) {
    const { error: colErr } = await supabase
      .from('columns')
      .update({ archived_at: archivedAt })
      .eq('lane_id', laneId)
      .is('archived_at', null);

    if (colErr) handleSupabaseError(colErr);
  }

  // Archive the lane
  const { error } = await supabase
    .from('lanes')
    .update({ archived_at: archivedAt })
    .eq('id', laneId);

  if (error) handleSupabaseError(error);
}

export function useDeleteLaneMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLane,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['lanes', variables.boardId] });
      void queryClient.invalidateQueries({ queryKey: ['columns', variables.boardId] });
    },
  });
}
