import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import type { ColumnWithCards } from '@/features/columns/types';
import { updateDemoCard } from '@/features/columns/api/demo-store';

interface MoveCardInput {
  boardId: string;
  cardId: string;
  columnId: string;
  position: number;
}

async function moveCard({ boardId, cardId, columnId, position }: MoveCardInput) {
  if (isDemoMode) {
    updateDemoCard(boardId, cardId, { column_id: columnId, position });
    return;
  }

  const { error } = await supabase
    .from('cards')
    .update({ column_id: columnId, position })
    .eq('id', cardId);

  if (error) handleSupabaseError(error);
}

export function useMoveCardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: moveCard,
    onMutate: (variables) => {
      void queryClient.cancelQueries({ queryKey: ['columns', variables.boardId] });
      const previous = queryClient.getQueryData<ColumnWithCards[]>(['columns', variables.boardId]);

      queryClient.setQueryData<ColumnWithCards[]>(
        ['columns', variables.boardId],
        (old) => {
          if (!old) return old;

          // Find the card across all columns
          let sourceCard: ColumnWithCards['cards'][number] | undefined;
          for (const col of old) {
            const found = col.cards.find((c) => c.id === variables.cardId);
            if (found) {
              sourceCard = found;
              break;
            }
          }
          if (!sourceCard) return old;

          const updated = {
            ...sourceCard,
            column_id: variables.columnId,
            position: variables.position,
          };

          return old.map((col) => {
            const withoutCard = col.cards.filter((c) => c.id !== variables.cardId);
            if (col.id === variables.columnId) {
              return {
                ...col,
                cards: [...withoutCard, updated].sort((a, b) => a.position - b.position),
              };
            }
            return { ...col, cards: withoutCard };
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
