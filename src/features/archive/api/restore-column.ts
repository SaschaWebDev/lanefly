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

  // Check if the column's lane is archived — if so, clear lane_id
  const { data: col, error: fetchErr } = await supabase
    .from('columns')
    .select('lane_id')
    .eq('id', columnId)
    .single();

  if (fetchErr) handleSupabaseError(fetchErr);

  let clearLaneId = false;
  if (col.lane_id) {
    const { data: lane, error: laneErr } = await supabase
      .from('lanes')
      .select('archived_at')
      .eq('id', col.lane_id)
      .single();

    if (laneErr) handleSupabaseError(laneErr);
    if (lane.archived_at) clearLaneId = true;
  }

  const updateData: { archived_at: null; lane_id?: null } = { archived_at: null };
  if (clearLaneId) updateData.lane_id = null;

  const { error: colErr } = await supabase
    .from('columns')
    .update(updateData)
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
