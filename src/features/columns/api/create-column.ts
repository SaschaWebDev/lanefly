import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { createDemoColumn } from './demo-store';

interface CreateColumnInput {
  boardId: string;
  title: string;
  position: number;
  laneId?: string | null;
}

async function createColumn({ boardId, title, position, laneId }: CreateColumnInput) {
  if (isDemoMode) {
    return createDemoColumn(boardId, title, position, laneId);
  }

  const insertData: { board_id: string; title: string; position: number; lane_id?: string } = {
    board_id: boardId,
    title,
    position,
  };
  if (laneId) insertData.lane_id = laneId;

  const { data, error } = await supabase
    .from('columns')
    .insert(insertData)
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
