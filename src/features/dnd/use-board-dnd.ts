import { useState, useCallback, useRef } from 'react';
import type { DragStartEvent, DragEndEvent, DragOverEvent, DragCancelEvent } from '@dnd-kit/core';
import type { Card } from '@/types/common';
import type { ColumnWithCards } from '@/features/columns/types';
import type { LaneWithColumns } from '@/features/lanes/types';
import type { Lane } from '@/types/common';
import { useMoveCardMutation } from '@/features/cards/api/move-card';
import { useReorderColumnMutation } from '@/features/columns/api/reorder-columns';
import { useReorderLaneMutation } from '@/features/lanes/api/reorder-lanes';
import { useMoveColumnToLaneMutation } from '@/features/lanes/api/move-column-to-lane';
import { computePosition } from '@/lib/position';

export type DragItemType = 'card' | 'column' | 'lane';

interface DragState {
  activeCard: Card | null;
  activeColumn: ColumnWithCards | null;
  activeLane: LaneWithColumns | null;
  type: DragItemType | null;
}

function getDragType(data: Record<string, unknown> | undefined): DragItemType | null {
  if (!data) return null;
  const type = data['type'];
  if (type === 'card' || type === 'column' || type === 'lane') return type;
  return null;
}

function getDragId(id: string | number): string {
  return String(id);
}

export interface CardDragOverride {
  card: Card;
  fromColumnId: string;
  toColumnId: string;
  insertIndex: number;
}

export function useBoardDnd(
  boardId: string,
  columns: ColumnWithCards[],
  lanes?: Lane[],
  onColumnLaneChange?: (override: { columnId: string; targetLaneId: string } | null) => void,
) {
  const [dragState, setDragState] = useState<DragState>({
    activeCard: null,
    activeColumn: null,
    activeLane: null,
    type: null,
  });

  const [cardDragOverride, setCardDragOverride] = useState<CardDragOverride | null>(null);

  const activeDragLaneRef = useRef<{
    columnId: string;
    originalLaneId: string;
    currentLaneId: string;
  } | null>(null);

  const moveCard = useMoveCardMutation();
  const reorderColumn = useReorderColumnMutation();
  const reorderLane = useReorderLaneMutation();
  const moveColumnToLane = useMoveColumnToLaneMutation();

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const type = getDragType(active.data.current);
      const id = getDragId(active.id);

      if (type === 'card') {
        const card = findCard(columns, id);
        setDragState({ activeCard: card, activeColumn: null, activeLane: null, type: 'card' });
      } else if (type === 'column') {
        const col = columns.find((c) => c.id === id);
        setDragState({ activeCard: null, activeColumn: col ?? null, activeLane: null, type: 'column' });
        if (col?.lane_id) {
          activeDragLaneRef.current = {
            columnId: id,
            originalLaneId: col.lane_id,
            currentLaneId: col.lane_id,
          };
        }
      } else if (type === 'lane' && lanes) {
        const lane = lanes.find((l) => l.id === id);
        if (lane) {
          const laneCols = columns.filter((c) => c.lane_id === lane.id);
          const laneWithCols: LaneWithColumns = { ...lane, columns: laneCols };
          setDragState({ activeCard: null, activeColumn: null, activeLane: laneWithCols, type: 'lane' });
        }
      }
    },
    [columns, lanes],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const dragLaneInfo = activeDragLaneRef.current;
      const currentCardOverride = cardDragOverride;
      activeDragLaneRef.current = null;
      onColumnLaneChange?.(null);
      setDragState({ activeCard: null, activeColumn: null, activeLane: null, type: null });
      setCardDragOverride(null);

      if (!over) return;
      if (active.id === over.id && !currentCardOverride) return;

      const type = getDragType(active.data.current);
      const activeId = getDragId(active.id);
      const overId = getDragId(over.id);

      if (type === 'lane' && lanes) {
        const activeIndex = lanes.findIndex((l) => l.id === activeId);
        const overIndex = lanes.findIndex((l) => l.id === overId);
        if (activeIndex === -1 || overIndex === -1) return;

        const overLane = lanes[overIndex];
        if (!overLane) return;
        const leftLane = overIndex > 0 ? lanes[overIndex - 1] : undefined;
        const rightLane = overIndex < lanes.length - 1 ? lanes[overIndex + 1] : undefined;
        const leftPos = leftLane?.position ?? null;
        const rightPos = rightLane?.position ?? null;
        const newPos = activeIndex < overIndex
          ? computePosition(overLane.position, rightPos)
          : computePosition(leftPos, overLane.position);

        reorderLane.mutate({
          boardId,
          laneId: activeId,
          position: newPos,
        });
        return;
      }

      if (type === 'column') {
        // Use the ref's original lane, not active.data.current which may have been remounted
        const activeLaneId = dragLaneInfo?.originalLaneId ?? (active.data.current?.['laneId'] as string | undefined) ?? null;
        const overData = over.data.current;
        const overType = getDragType(overData);

        // Determine target lane
        let targetLaneId: string | null = null;
        if (overType === 'column') {
          targetLaneId = (overData?.['laneId'] as string | undefined) ?? null;
        } else if (overType === 'lane') {
          targetLaneId = overId;
        } else {
          // Dropped on a card — find its column's lane
          const overCard = findCard(columns, overId);
          if (!overCard) return;
          const overCol = columns.find((c) => c.id === overCard.column_id);
          targetLaneId = overCol?.lane_id ?? null;
        }

        // Get columns in the target lane (excluding the active column)
        const targetColumns = lanes
          ? columns.filter((c) => c.lane_id === targetLaneId && c.id !== activeId).sort((a, b) => a.position - b.position)
          : columns;

        if (activeLaneId !== targetLaneId && targetLaneId !== null) {
          // Cross-lane column move — compute exact position based on drop target
          let newPos: number;

          if (overType === 'column') {
            const overIndex = targetColumns.findIndex((c) => c.id === overId);
            if (overIndex !== -1) {
              // Determine before/after based on translated rect position
              const activeRect = active.rect.current.translated;
              const overRect = over.rect;
              const activeCenterX = activeRect ? activeRect.left + activeRect.width / 2 : 0;
              const overCenterX = overRect.left + overRect.width / 2;

              if (activeCenterX < overCenterX) {
                // Insert before the over column
                const prevCol = overIndex > 0 ? targetColumns[overIndex - 1] : undefined;
                newPos = computePosition(prevCol?.position ?? null, targetColumns[overIndex]!.position);
              } else {
                // Insert after the over column
                const nextCol = overIndex < targetColumns.length - 1 ? targetColumns[overIndex + 1] : undefined;
                newPos = computePosition(targetColumns[overIndex]!.position, nextCol?.position ?? null);
              }
            } else {
              // over column not found in target — append
              const lastPos = targetColumns.length > 0
                ? Math.max(...targetColumns.map((c) => c.position))
                : 0;
              newPos = lastPos + 1024;
            }
          } else {
            // Dropped on lane or card — append to end
            const lastPos = targetColumns.length > 0
              ? Math.max(...targetColumns.map((c) => c.position))
              : 0;
            newPos = lastPos + 1024;
          }

          moveColumnToLane.mutate({
            boardId,
            columnId: activeId,
            laneId: targetLaneId,
            position: newPos,
          });
          return;
        }

        // Same-lane column reorder (or flat mode)
        // Re-fetch target columns including active for index calculation
        const sameTargetColumns = lanes
          ? columns.filter((c) => c.lane_id === targetLaneId).sort((a, b) => a.position - b.position)
          : columns;

        let targetColumnId = overId;
        if (overType !== 'column') {
          const overCard = findCard(columns, overId);
          if (!overCard) return;
          targetColumnId = overCard.column_id;
          if (targetColumnId === activeId) return;
        }

        const activeIndex = sameTargetColumns.findIndex((c) => c.id === activeId);
        const overIndex = sameTargetColumns.findIndex((c) => c.id === targetColumnId);
        if (activeIndex === -1 || overIndex === -1) return;

        const overCol = sameTargetColumns[overIndex];
        if (!overCol) return;
        const leftCol = overIndex > 0 ? sameTargetColumns[overIndex - 1] : undefined;
        const rightCol = overIndex < sameTargetColumns.length - 1 ? sameTargetColumns[overIndex + 1] : undefined;
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
        if (currentCardOverride) {
          // Cross-column move — position from override (matches preview)
          const targetCol = columns.find((c) => c.id === currentCardOverride.toColumnId);
          const targetCards = targetCol?.cards ?? [];
          const idx = currentCardOverride.insertIndex;
          const prevCard = idx > 0 ? targetCards[idx - 1] : undefined;
          const nextCard = idx < targetCards.length ? targetCards[idx] : undefined;
          const newPosition = computePosition(prevCard?.position ?? null, nextCard?.position ?? null);
          moveCard.mutate({
            boardId,
            cardId: activeId,
            columnId: currentCardOverride.toColumnId,
            position: newPosition,
          });
        } else {
          // Within-column move
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
      }
    },
    [boardId, columns, lanes, moveCard, reorderColumn, reorderLane, moveColumnToLane, onColumnLaneChange, cardDragOverride],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const type = getDragType(active.data.current);

      if (type === 'card') {
        const activeId = getDragId(active.id);
        const overId = getDragId(over.id);

        // Ignore hovering over self (happens when card is optimistically in target)
        if (overId === activeId) return;

        const overType = getDragType(over.data.current);
        const activeCard = findCard(columns, activeId);
        if (!activeCard) return;
        const sourceColumnId = activeCard.column_id;

        // Determine target column
        let targetColumnId: string;
        if (overType === 'column') {
          targetColumnId = overId;
        } else {
          const overCard = findCard(columns, overId);
          if (!overCard) return;
          targetColumnId = overCard.column_id;
        }

        // Back in source column → clear override
        if (targetColumnId === sourceColumnId) {
          if (cardDragOverride) setCardDragOverride(null);
          return;
        }

        // Cross-column → compute insertion index using cursor position
        const targetCol = columns.find((c) => c.id === targetColumnId);
        if (!targetCol) return;

        let insertIndex: number;
        if (overType === 'column') {
          insertIndex = targetCol.cards.length;
        } else {
          const overIndex = targetCol.cards.findIndex((c) => c.id === overId);
          if (overIndex === -1) {
            insertIndex = targetCol.cards.length;
          } else {
            const activeRect = active.rect.current.translated;
            const overRect = over.rect;
            if (activeRect) {
              const activeCenterY = activeRect.top + activeRect.height / 2;
              const overCenterY = overRect.top + overRect.height / 2;
              insertIndex = activeCenterY > overCenterY ? overIndex + 1 : overIndex;
            } else {
              insertIndex = overIndex;
            }
          }
        }

        // Only update state if something changed
        if (
          !cardDragOverride ||
          cardDragOverride.toColumnId !== targetColumnId ||
          cardDragOverride.insertIndex !== insertIndex
        ) {
          setCardDragOverride({
            card: activeCard,
            fromColumnId: sourceColumnId,
            toColumnId: targetColumnId,
            insertIndex,
          });
        }
        return;
      }

      if (!lanes || !activeDragLaneRef.current) return;
      if (type !== 'column') return;

      const targetLaneId = (over.data.current?.['laneId'] as string | undefined) ?? null;
      if (!targetLaneId) return;

      const dragInfo = activeDragLaneRef.current;
      if (targetLaneId === dragInfo.currentLaneId) return;

      dragInfo.currentLaneId = targetLaneId;
      onColumnLaneChange?.({ columnId: dragInfo.columnId, targetLaneId });
    },
    [lanes, onColumnLaneChange, columns, cardDragOverride],
  );

  const handleDragCancel = useCallback(
    (_event: DragCancelEvent) => {
      activeDragLaneRef.current = null;
      onColumnLaneChange?.(null);
      setCardDragOverride(null);
      setDragState({ activeCard: null, activeColumn: null, activeLane: null, type: null });
    },
    [onColumnLaneChange],
  );

  return {
    ...dragState,
    cardDragOverride,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragCancel,
  };
}

function findCard(columns: ColumnWithCards[], cardId: string): Card | null {
  for (const col of columns) {
    const card = col.cards.find((c) => c.id === cardId);
    if (card) return card;
  }
  return null;
}
