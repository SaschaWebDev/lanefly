import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import type { AnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ColumnWithCards } from '@/features/columns/types';
import type { BoardRole } from '@/types/database';
import { Column } from '@/features/columns/components/column';

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  if (wasDragging && !isSorting) return false;
  return defaultAnimateLayoutChanges(args);
};

interface SortableColumnProps {
  column: ColumnWithCards;
  boardId: string;
  role: BoardRole;
  laneId?: string;
}

export function SortableColumn({ column, boardId, role, laneId }: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: 'column', laneId },
    animateLayoutChanges,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    maxHeight: '100%',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Column
        column={column}
        boardId={boardId}
        role={role}
        isDragging={isDragging}
      />
    </div>
  );
}
