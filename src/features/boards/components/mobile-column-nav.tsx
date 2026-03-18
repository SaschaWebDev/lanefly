import { useState, useRef, useCallback, useEffect } from 'react';
import type { ColumnWithCards } from '@/features/columns/types';
import type { Lane } from '@/types/common';
import { CardItem } from '@/features/cards/components/card-item';
import { AddCard } from '@/features/cards/components/add-card';
import styles from './mobile-column-nav.module.css';

interface MobileColumnNavProps {
  boardId: string;
  columns: ColumnWithCards[];
  lanes?: Lane[];
  canEdit: boolean;
  canCreateLane?: boolean;
  onAddLane?: (title: string) => void;
}

function ColumnCarousel({ boardId, columns, canEdit }: { boardId: string; columns: ColumnWithCards[]; canEdit: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollTo = useCallback(
    (index: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const width = el.clientWidth;
      el.scrollTo({ left: width * index, behavior: 'smooth' });
      setActiveIndex(index);
    },
    [],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const width = el.clientWidth;
      if (width === 0) return;
      const index = Math.round(el.scrollLeft / width);
      setActiveIndex(index);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div ref={scrollRef} className={styles.scrollWrapper}>
        {columns.map((col) => (
          <div key={col.id} className={styles.columnSlide}>
            <div className={styles.columnTitle}>
              {col.title} ({col.cards.length})
            </div>
            {col.cards.map((card) => (
              <div key={card.id} style={{ marginBottom: 'var(--space-2)' }}>
                <CardItem card={card} boardId={boardId} />
              </div>
            ))}
            {canEdit && (
              <AddCard boardId={boardId} columnId={col.id} cards={col.cards} />
            )}
          </div>
        ))}
      </div>
      {columns.length > 1 && (
        <div className={styles.nav}>
          <button
            className={styles.navButton}
            onClick={() => scrollTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Previous column"
          >
            &#8592;
          </button>
          <div className={styles.dots}>
            {columns.map((col, i) => (
              <button
                key={col.id}
                className={i === activeIndex ? styles.dotActive : styles.dot}
                onClick={() => scrollTo(i)}
                aria-label={`Go to ${col.title}`}
              />
            ))}
          </div>
          <button
            className={styles.navButton}
            onClick={() => scrollTo(activeIndex + 1)}
            disabled={activeIndex === columns.length - 1}
            aria-label="Next column"
          >
            &#8594;
          </button>
        </div>
      )}
    </>
  );
}

export function MobileColumnNav({ boardId, columns, lanes, canEdit, canCreateLane, onAddLane }: MobileColumnNavProps) {
  const [expandedLaneId, setExpandedLaneId] = useState<string | null>(null);
  const hasLanes = lanes && lanes.length > 0;

  // No lanes — original flat carousel
  if (!hasLanes) {
    return (
      <div className={styles.container}>
        <ColumnCarousel boardId={boardId} columns={columns} canEdit={canEdit} />
      </div>
    );
  }

  // Lane accordion
  return (
    <div className={styles.container}>
      <div className={styles.accordionContainer}>
        {lanes.map((lane) => {
          const laneCols = columns
            .filter((c) => c.lane_id === lane.id)
            .sort((a, b) => a.position - b.position);
          const isExpanded = expandedLaneId === lane.id;

          return (
            <div key={lane.id} className={styles.accordionItem}>
              <button
                className={styles.accordionHeader}
                onClick={() => setExpandedLaneId(isExpanded ? null : lane.id)}
              >
                <span className={styles.accordionArrow}>{isExpanded ? '\u25BC' : '\u25B6'}</span>
                <span className={styles.accordionTitle}>{lane.title}</span>
                <span className={styles.accordionBadge}>{laneCols.length} lists</span>
              </button>
              {isExpanded && laneCols.length > 0 && (
                <ColumnCarousel boardId={boardId} columns={laneCols} canEdit={canEdit} />
              )}
              {isExpanded && laneCols.length === 0 && (
                <div className={styles.emptyLane}>No lists in this lane</div>
              )}
            </div>
          );
        })}
        {canCreateLane && onAddLane && (
          <button
            className={styles.addLaneButton}
            onClick={() => {
              const title = prompt('Lane title:');
              if (title?.trim()) onAddLane(title.trim());
            }}
          >
            + Add a new lane
          </button>
        )}
      </div>
    </div>
  );
}
