import { DragOverlay as DndKitDragOverlay } from '@dnd-kit/core';
import type { Card } from '@/types/common';
import type { ColumnWithCards } from '@/features/columns/types';
import styles from './drag-overlay.module.css';

interface BoardDragOverlayProps {
  activeCard: Card | null;
  activeColumn: ColumnWithCards | null;
}

export function BoardDragOverlay({ activeCard, activeColumn }: BoardDragOverlayProps) {
  return (
    <DndKitDragOverlay dropAnimation={null}>
      {activeCard && (
        <div className={styles.cardGhost}>{activeCard.title}</div>
      )}
      {activeColumn && (
        <div className={styles.columnGhost}>
          {activeColumn.title} ({activeColumn.cards.length})
        </div>
      )}
    </DndKitDragOverlay>
  );
}
