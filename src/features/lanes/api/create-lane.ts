import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { createDemoLane } from './demo-store';
import { getDemoColumns } from '@/features/columns/api/demo-store';
import { updateDemoColumn } from '@/features/columns/api/demo-store';

interface CreateLaneInput {
  boardId: string;
  title: string;
  position: number;
}

async function createLane({ boardId, title, position }: CreateLaneInput) {
  if (isDemoMode) {
    // First-lane bootstrapping: move existing unassigned columns into a Default lane
    const existingColumns = getDemoColumns(boardId);
    const unassignedCols = existingColumns.filter((c) => !c.lane_id);

    if (unassignedCols.length > 0) {
      const defaultLane = createDemoLane(boardId, 'Default', 1024);
      for (const col of unassignedCols) {
        updateDemoColumn(boardId, col.id, { lane_id: defaultLane.id });
      }
      // The user's lane comes after the default
      return createDemoLane(boardId, title, 2048);
    }

    return createDemoLane(boardId, title, position);
  }

  // Check if this is the first lane — need to bootstrap existing columns
  const { data: existingLanes, error: laneCheckErr } = await supabase
    .from('lanes')
    .select('id')
    .eq('board_id', boardId)
    .limit(1);

  if (laneCheckErr) handleSupabaseError(laneCheckErr);

  if (existingLanes.length === 0) {
    // Check for unassigned columns
    const { data: unassignedCols, error: colCheckErr } = await supabase
      .from('columns')
      .select('id')
      .eq('board_id', boardId)
      .is('lane_id', null)
      .is('archived_at', null);

    if (colCheckErr) handleSupabaseError(colCheckErr);

    if (unassignedCols.length > 0) {
      // Create a Default lane and assign existing columns to it
      const { data: defaultLane, error: defaultErr } = await supabase
        .from('lanes')
        .insert({ board_id: boardId, title: 'Default', position: 1024 })
        .select('id')
        .single();

      if (defaultErr) handleSupabaseError(defaultErr);

      const { error: assignErr } = await supabase
        .from('columns')
        .update({ lane_id: defaultLane.id })
        .eq('board_id', boardId)
        .is('lane_id', null)
        .is('archived_at', null);

      if (assignErr) handleSupabaseError(assignErr);

      // Create the user's lane after the default
      const { data, error } = await supabase
        .from('lanes')
        .insert({ board_id: boardId, title, position: 2048 })
        .select()
        .single();

      if (error) handleSupabaseError(error);
      return data;
    }
  }

  const { data, error } = await supabase
    .from('lanes')
    .insert({ board_id: boardId, title, position })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data;
}

export function useCreateLaneMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLane,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['lanes', variables.boardId] });
      void queryClient.invalidateQueries({ queryKey: ['columns', variables.boardId] });
    },
  });
}
