import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import type { Card } from '@/types/common';
import type { ColumnWithCards } from '../types';
import type { CardSortAction } from '../types';
import { sortCards } from '../utils/sort-cards';
import { updateDemoCard } from './demo-store';

interface SortColumnCardsInput {
  boardId: string;
  columnId: string;
  action: CardSortAction;
  cards: Card[];
}

async function sortColumnCards({ boardId, cards, action }: SortColumnCardsInput) {
  const sorted = sortCards(cards, action);
  const updates = sorted.map((card, index) => ({
    id: card.id,
    position: (index + 1) * 1024,
  }));

  if (isDemoMode) {
    for (const { id, position } of updates) {
      updateDemoCard(boardId, id, { position });
    }
    return;
  }

  await Promise.all(
    updates.map(async ({ id, position }) => {
      const { error } = await supabase
        .from('cards')
        .update({ position })
        .eq('id', id);
      if (error) handleSupabaseError(error);
    }),
  );
}

export function useSortColumnCardsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sortColumnCards,
    onMutate: (variables) => {
      void queryClient.cancelQueries({ queryKey: ['columns', variables.boardId] });
      const previous = queryClient.getQueryData<ColumnWithCards[]>(['columns', variables.boardId]);

      queryClient.setQueryData<ColumnWithCards[]>(
        ['columns', variables.boardId],
        (old) => {
          if (!old) return old;

          return old.map((col) => {
            if (col.id !== variables.columnId) return col;

            const sorted = sortCards(col.cards, variables.action);
            return {
              ...col,
              cards: sorted.map((card, index) => ({
                ...card,
                position: (index + 1) * 1024,
              })),
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
