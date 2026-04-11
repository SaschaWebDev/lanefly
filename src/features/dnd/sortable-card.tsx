import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import type { AnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CardWithLabels } from '@/features/columns/types';
import type { BoardRole } from '@/types/database';
import { CardItem } from '@/features/cards/components/card-item';

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  if (wasDragging && !isSorting) return false;
  return defaultAnimateLayoutChanges(args);
};

interface SortableCardProps {
  card: CardWithLabels;
  boardId: string;
  role?: BoardRole;
}

export function SortableCard({ card, boardId, role }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: 'card' },
    animateLayoutChanges,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardItem
        card={card}
        boardId={boardId}
        role={role}
        isDragging={isDragging}
        labels={card.labels}
      />
    </div>
  );
}
