import { useCallback, type ReactNode } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  closestCenter,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ColumnWithCards } from '@/features/columns/types';
import { useBoardDnd } from './use-board-dnd';
import { BoardDragOverlay } from './drag-overlay';

interface BoardDndContextProps {
  boardId: string;
  columns: ColumnWithCards[];
  children: ReactNode;
}

export function BoardDndContext({ boardId, columns, children }: BoardDndContextProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  const {
    activeCard,
    activeColumn,
    type: dragType,
    handleDragStart,
    handleDragEnd,
  } = useBoardDnd(boardId, columns);

  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      if (dragType === 'column') {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (container) => container.data.current?.type === 'column',
          ),
        });
      }
      return closestCorners(args);
    },
    [dragType],
  );

  const columnIds = columns.map((c) => c.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
        {children}
      </SortableContext>
      <BoardDragOverlay activeCard={activeCard} activeColumn={activeColumn} />
    </DndContext>
  );
}
