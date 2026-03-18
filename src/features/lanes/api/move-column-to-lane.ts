import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import type { ColumnWithCards } from '@/features/columns/types';
import { updateDemoColumn } from '@/features/columns/api/demo-store';

interface MoveColumnToLaneInput {
  boardId: string;
  columnId: string;
  laneId: string;
  position: number;
}

async function moveColumnToLane({ boardId, columnId, laneId, position }: MoveColumnToLaneInput) {
  if (isDemoMode) {
    updateDemoColumn(boardId, columnId, { lane_id: laneId, position });
    return;
  }

  const { error } = await supabase
    .from('columns')
    .update({ lane_id: laneId, position })
    .eq('id', columnId);

  if (error) handleSupabaseError(error);
}

export function useMoveColumnToLaneMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: moveColumnToLane,
    onMutate: (variables) => {
      void queryClient.cancelQueries({ queryKey: ['columns', variables.boardId] });
      const previous = queryClient.getQueryData<ColumnWithCards[]>(['columns', variables.boardId]);

      queryClient.setQueryData<ColumnWithCards[]>(
        ['columns', variables.boardId],
        (old) => {
          if (!old) return old;
          return old
            .map((col) =>
              col.id === variables.columnId
                ? { ...col, lane_id: variables.laneId, position: variables.position }
                : col,
            )
            .sort((a, b) => a.position - b.position);
        },
      );

      return { previous };
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['columns', variables.boardId], context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['columns', variables.boardId] });
    },
  });
}
