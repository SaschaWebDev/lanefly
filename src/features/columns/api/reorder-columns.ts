import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import type { ColumnWithCards } from '../types';
import { updateDemoColumn } from './demo-store';

interface ReorderColumnInput {
  boardId: string;
  columnId: string;
  position: number;
}

async function reorderColumn({ boardId, columnId, position }: ReorderColumnInput) {
  if (isDemoMode) {
    updateDemoColumn(boardId, columnId, { position });
    return;
  }

  const { error } = await supabase
    .from('columns')
    .update({ position })
    .eq('id', columnId);

  if (error) handleSupabaseError(error);
}

export function useReorderColumnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderColumn,
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
                ? { ...col, position: variables.position }
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
