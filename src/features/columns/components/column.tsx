import { useMemo, useRef } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePermission } from '@/features/permissions/hooks/use-permission';
import type { BoardRole } from '@/types/database';
import type { ColumnWithCards } from '../types';
import { ColumnHeader } from './column-header';
import { SortableCard } from '@/features/dnd/sortable-card';
import { AddCard } from '@/features/cards/components/add-card';
import { useCardDragOverride } from '@/features/dnd/dnd-context';
import styles from './column.module.css';

interface ColumnProps {
  column: ColumnWithCards;
  boardId: string;
  role: BoardRole;
  isDragging?: boolean;
}

const ESTIMATED_CARD_HEIGHT = 80;
const OVERSCAN = 5;

export function Column({ column, boardId, role, isDragging }: ColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { can } = usePermission(role);
  const cardDragOverride = useCardDragOverride();

  const effectiveCards = useMemo(() => {
    if (!cardDragOverride) return column.cards;

    if (cardDragOverride.fromColumnId === column.id) {
      return column.cards.filter((c) => c.id !== cardDragOverride.card.id);
    }

    if (cardDragOverride.toColumnId === column.id) {
      const cards = [...column.cards];
      const idx = Math.min(cardDragOverride.insertIndex, cards.length);
      cards.splice(idx, 0, cardDragOverride.card);
      return cards;
    }

    return column.cards;
  }, [column.cards, column.id, cardDragOverride]);

  const virtualizer = useVirtualizer({
    count: effectiveCards.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_CARD_HEIGHT,
    overscan: OVERSCAN,
    gap: 6,
  });

  const cardIds = effectiveCards.map((c) => c.id);

  return (
    <div data-column-id={column.id} className={`${styles.column} ${isDragging ? styles.dragging : ''}`}>
      <ColumnHeader
        column={column}
        boardId={boardId}
        role={role}
      />
      <div ref={scrollRef} className={styles.cardList}>
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const card = effectiveCards[virtualRow.index];
              if (!card) return null;
              return (
                <div
                  key={card.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  ref={virtualizer.measureElement}
                  data-index={virtualRow.index}
                >
                  <SortableCard card={card} boardId={boardId} role={role} />
                </div>
              );
            })}
          </div>
        </SortableContext>
      </div>
      {can('card:create') && (
        <div className={styles.footer}>
          <AddCard boardId={boardId} columnId={column.id} cards={column.cards} />
        </div>
      )}
    </div>
  );
}
