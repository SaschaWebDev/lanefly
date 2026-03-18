import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import type { Lane } from '@/types/common';
import { updateDemoLane } from './demo-store';

interface ReorderLaneInput {
  boardId: string;
  laneId: string;
  position: number;
}

async function reorderLane({ boardId, laneId, position }: ReorderLaneInput) {
  if (isDemoMode) {
    updateDemoLane(boardId, laneId, { position });
    return;
  }

  const { error } = await supabase
    .from('lanes')
    .update({ position })
    .eq('id', laneId);

  if (error) handleSupabaseError(error);
}

export function useReorderLaneMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderLane,
    onMutate: (variables) => {
      void queryClient.cancelQueries({ queryKey: ['lanes', variables.boardId] });
      const previous = queryClient.getQueryData<Lane[]>(['lanes', variables.boardId]);

      queryClient.setQueryData<Lane[]>(
        ['lanes', variables.boardId],
        (old) => {
          if (!old) return old;
          return old
            .map((lane) =>
              lane.id === variables.laneId
                ? { ...lane, position: variables.position }
                : lane,
            )
            .sort((a, b) => a.position - b.position);
        },
      );

      return { previous };
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['lanes', variables.boardId], context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['lanes', variables.boardId] });
    },
  });
}
