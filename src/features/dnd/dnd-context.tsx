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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ColumnWithCards } from '@/features/columns/types';
import type { Lane } from '@/types/common';
import { useBoardDnd } from './use-board-dnd';
import { BoardDragOverlay } from './drag-overlay';

interface BoardDndContextProps {
  boardId: string;
  columns: ColumnWithCards[];
  lanes?: Lane[];
  onColumnLaneChange?: (override: { columnId: string; targetLaneId: string } | null) => void;
  children: ReactNode;
}

export function BoardDndContext({ boardId, columns, lanes, onColumnLaneChange, children }: BoardDndContextProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  const {
    activeCard,
    activeColumn,
    activeLane,
    type: dragType,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragCancel,
  } = useBoardDnd(boardId, columns, lanes, onColumnLaneChange);

  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      if (dragType === 'lane') {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (container) => container.data.current?.type === 'lane',
          ),
        });
      }
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

  const hasLanes = lanes && lanes.length > 0;
  const laneIds = hasLanes ? lanes.map((l) => l.id) : [];
  const columnIds = columns.map((c) => c.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {hasLanes ? (
        <SortableContext items={laneIds} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      ) : (
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          {children}
        </SortableContext>
      )}
      <BoardDragOverlay activeCard={activeCard} activeColumn={activeColumn} activeLane={activeLane} />
    </DndContext>
  );
}
