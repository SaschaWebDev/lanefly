import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import type { ColumnWithCards } from '../types';
import { updateDemoColumn } from './demo-store';

interface UpdateColumnInput {
  boardId: string;
  columnId: string;
  title: string;
}

async function updateColumn({ boardId, columnId, title }: UpdateColumnInput) {
  if (isDemoMode) {
    updateDemoColumn(boardId, columnId, { title });
    return;
  }

  const { error } = await supabase
    .from('columns')
    .update({ title })
    .eq('id', columnId);

  if (error) handleSupabaseError(error);
}

export function useUpdateColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateColumn,
    onMutate: (variables) => {
      void queryClient.cancelQueries({ queryKey: ['columns', variables.boardId] });
      const previous = queryClient.getQueryData<ColumnWithCards[]>(['columns', variables.boardId]);

      queryClient.setQueryData<ColumnWithCards[]>(
        ['columns', variables.boardId],
        (old) => old?.map((col) =>
          col.id === variables.columnId ? { ...col, title: variables.title } : col,
        ),
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
