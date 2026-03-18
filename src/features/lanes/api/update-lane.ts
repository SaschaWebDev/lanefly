import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import type { Lane } from '@/types/common';
import { updateDemoLane } from './demo-store';

interface UpdateLaneInput {
  boardId: string;
  laneId: string;
  title: string;
}

async function updateLane({ boardId, laneId, title }: UpdateLaneInput) {
  if (isDemoMode) {
    updateDemoLane(boardId, laneId, { title });
    return;
  }

  const { error } = await supabase
    .from('lanes')
    .update({ title })
    .eq('id', laneId);

  if (error) handleSupabaseError(error);
}

export function useUpdateLaneMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLane,
    onMutate: (variables) => {
      void queryClient.cancelQueries({ queryKey: ['lanes', variables.boardId] });
      const previous = queryClient.getQueryData<Lane[]>(['lanes', variables.boardId]);

      queryClient.setQueryData<Lane[]>(
        ['lanes', variables.boardId],
        (old) => old?.map((lane) =>
          lane.id === variables.laneId ? { ...lane, title: variables.title } : lane,
        ),
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
