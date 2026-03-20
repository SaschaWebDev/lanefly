import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { createDemoCard } from '@/features/columns/api/demo-store';
import type { CardStatus } from '@/types/database';
import type { ColumnWithCards } from '@/features/columns/types';

interface CreateCardInput {
  boardId: string;
  columnId: string;
  title: string;
  position: number;
  description?: string | null;
  status?: CardStatus;
  assignee_id?: string | null;
  due_date?: string | null;
}

async function createCard({ boardId, columnId, title, position, description, status, assignee_id, due_date }: CreateCardInput) {
  if (isDemoMode) {
    return createDemoCard(boardId, columnId, title, position);
  }

  const { data, error } = await supabase
    .from('cards')
    .insert({
      board_id: boardId,
      column_id: columnId,
      title,
      position,
      ...(description != null && { description }),
      ...(status != null && { status }),
      ...(assignee_id != null && { assignee_id }),
      ...(due_date != null && { due_date }),
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data;
}

export function useCreateCardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCard,
    onMutate: (variables) => {
      void queryClient.cancelQueries({ queryKey: ['columns', variables.boardId] });

      const previous = queryClient.getQueryData<ColumnWithCards[]>(['columns', variables.boardId]);

      queryClient.setQueryData<ColumnWithCards[]>(
        ['columns', variables.boardId],
        (old) => {
          if (!old) return old;

          const now = new Date().toISOString();

          return old.map((col) => {
            if (col.id !== variables.columnId) return col;

            return {
              ...col,
              cards: [
                ...col.cards,
                {
                  id: `temp-${Date.now()}`,
                  board_id: variables.boardId,
                  column_id: variables.columnId,
                  title: variables.title,
                  position: variables.position,
                  description: variables.description ?? null,
                  status: variables.status ?? 'active',
                  assignee_id: variables.assignee_id ?? null,
                  due_date: variables.due_date ?? null,
                  created_at: now,
                  updated_at: now,
                  archived_at: null,
                  archived_with_column: false,
                },
              ].sort((a, b) => a.position - b.position),
            };
          });
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
