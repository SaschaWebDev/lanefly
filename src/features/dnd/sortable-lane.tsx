import type { ReactNode } from 'react';
import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import type { AnimateLayoutChanges } from '@dnd-kit/sortable';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { CSS } from '@dnd-kit/utilities';
import type { LaneWithColumns } from '@/features/lanes/types';

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  if (wasDragging && !isSorting) return false;
  return defaultAnimateLayoutChanges(args);
};

interface SortableLaneProps {
  lane: LaneWithColumns;
  children: (props: { listeners: SyntheticListenerMap | undefined; isDragging: boolean }) => ReactNode;
}

export function SortableLane({ lane, children }: SortableLaneProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lane.id,
    data: { type: 'lane' },
    animateLayoutChanges,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children({ listeners, isDragging })}
    </div>
  );
}
