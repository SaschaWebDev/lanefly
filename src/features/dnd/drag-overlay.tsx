import { DragOverlay as DndKitDragOverlay } from '@dnd-kit/core';
import type { Card } from '@/types/common';
import type { ColumnWithCards } from '@/features/columns/types';
import type { LaneWithColumns } from '@/features/lanes/types';
import styles from './drag-overlay.module.css';

interface BoardDragOverlayProps {
  activeCard: Card | null;
  activeColumn: ColumnWithCards | null;
  activeLane?: LaneWithColumns | null;
}

export function BoardDragOverlay({ activeCard, activeColumn, activeLane }: BoardDragOverlayProps) {
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
      {activeLane && (
        <div className={styles.laneGhost}>
          {activeLane.title} ({activeLane.columns.length} lists)
        </div>
      )}
    </DndKitDragOverlay>
  );
}
