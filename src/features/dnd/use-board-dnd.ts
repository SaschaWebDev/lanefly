import { useState, useCallback } from 'react';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import type { Card } from '@/types/common';
import type { ColumnWithCards } from '@/features/columns/types';
import { useMoveCardMutation } from '@/features/cards/api/move-card';
import { useReorderColumnMutation } from '@/features/columns/api/reorder-columns';
import { computePosition } from '@/lib/position';

export type DragItemType = 'card' | 'column';

interface DragState {
  activeCard: Card | null;
  activeColumn: ColumnWithCards | null;
  type: DragItemType | null;
}

function getDragType(data: Record<string, unknown> | undefined): DragItemType | null {
  if (!data) return null;
  const type = data['type'];
  if (type === 'card' || type === 'column') return type;
  return null;
}

function getDragId(id: string | number): string {
  return String(id);
}

export function useBoardDnd(boardId: string, columns: ColumnWithCards[]) {
  const [dragState, setDragState] = useState<DragState>({
    activeCard: null,
    activeColumn: null,
    type: null,
  });

  const moveCard = useMoveCardMutation();
  const reorderColumn = useReorderColumnMutation();

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const type = getDragType(active.data.current);
      const id = getDragId(active.id);

      if (type === 'card') {
        const card = findCard(columns, id);
        setDragState({ activeCard: card, activeColumn: null, type: 'card' });
      } else if (type === 'column') {
        const col = columns.find((c) => c.id === id);
        setDragState({ activeCard: null, activeColumn: col ?? null, type: 'column' });
      }
    },
    [columns],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setDragState({ activeCard: null, activeColumn: null, type: null });

      if (!over || active.id === over.id) return;

      const type = getDragType(active.data.current);
      const activeId = getDragId(active.id);
      const overId = getDragId(over.id);

      if (type === 'column') {
        let targetColumnId = overId;
        const overType = getDragType(over.data.current);
        if (overType !== 'column') {
          const overCard = findCard(columns, overId);
          if (!overCard) return;
          targetColumnId = overCard.column_id;
          if (targetColumnId === activeId) return;
        }

        const activeIndex = columns.findIndex((c) => c.id === activeId);
        const overIndex = columns.findIndex((c) => c.id === targetColumnId);
        if (activeIndex === -1 || overIndex === -1) return;

        const overCol = columns[overIndex];
        if (!overCol) return;
        const leftCol = overIndex > 0 ? columns[overIndex - 1] : undefined;
        const rightCol = overIndex < columns.length - 1 ? columns[overIndex + 1] : undefined;
        const leftPos = leftCol?.position ?? null;
        const rightPos = rightCol?.position ?? null;
        const newPos = activeIndex < overIndex
          ? computePosition(overCol.position, rightPos)
          : computePosition(leftPos, overCol.position);

        reorderColumn.mutate({
          boardId,
          columnId: activeId,
          position: newPos,
        });
      }

      if (type === 'card') {
        const overType = getDragType(over.data.current);

        let targetColumnId: string;
        let targetCards: Card[];

        if (overType === 'column') {
          targetColumnId = overId;
          const targetCol = columns.find((c) => c.id === targetColumnId);
          targetCards = targetCol?.cards ?? [];
        } else {
          const overCard = findCard(columns, overId);
          if (!overCard) return;
          targetColumnId = overCard.column_id;
          const targetCol = columns.find((c) => c.id === targetColumnId);
          targetCards = targetCol?.cards ?? [];
        }

        const isSameColumn = targetCards.some((c) => c.id === activeId);
        const filteredCards = isSameColumn
          ? targetCards.filter((c) => c.id !== activeId)
          : targetCards;

        const overIndex = filteredCards.findIndex((c) => c.id === overId);
        let newPosition: number;

        if (overType === 'column' || overIndex === -1) {
          const lastCard = filteredCards.length > 0 ? filteredCards[filteredCards.length - 1] : undefined;
          const lastPos = lastCard?.position ?? 0;
          newPosition = lastPos + 1024;
        } else if (isSameColumn) {
          const activeIndex = targetCards.findIndex((c) => c.id === activeId);
          const originalOverIndex = targetCards.findIndex((c) => c.id === overId);
          const draggingDown = activeIndex < originalOverIndex;

          if (draggingDown) {
            const overCard = filteredCards[overIndex];
            const nextCard = overIndex < filteredCards.length - 1 ? filteredCards[overIndex + 1] : undefined;
            newPosition = computePosition(overCard?.position ?? null, nextCard?.position ?? null);
          } else {
            const overCard = filteredCards[overIndex];
            const prevCard = overIndex > 0 ? filteredCards[overIndex - 1] : undefined;
            newPosition = computePosition(prevCard?.position ?? null, overCard?.position ?? null);
          }
        } else {
          const overCard = filteredCards[overIndex];
          const prevCard = overIndex > 0 ? filteredCards[overIndex - 1] : undefined;
          const leftPos = prevCard?.position ?? null;
          newPosition = computePosition(leftPos, overCard?.position ?? 1024);
        }

        moveCard.mutate({
          boardId,
          cardId: activeId,
          columnId: targetColumnId,
          position: newPosition,
        });
      }
    },
    [boardId, columns, moveCard, reorderColumn],
  );

  return {
    ...dragState,
    handleDragStart,
    handleDragEnd,
  };
}

function findCard(columns: ColumnWithCards[], cardId: string): Card | null {
  for (const col of columns) {
    const card = col.cards.find((c) => c.id === cardId);
    if (card) return card;
  }
  return null;
}
