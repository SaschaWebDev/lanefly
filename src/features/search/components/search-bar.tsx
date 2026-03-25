import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useSearchCardsQuery } from '../api/search-cards';
import { useColumnsQuery } from '@/features/columns/api/get-columns';
import { useLanesQuery } from '@/features/lanes/api/get-lanes';
import { CardEditorModal } from '@/features/cards/components/card-editor-modal';
import type { Card } from '@/types/common';
import type { BoardRole } from '@/types/database';
import styles from './search-bar.module.css';

interface SearchBarProps {
  boardId: string;
  role?: BoardRole;
}

function scrollAndPulse(selector: string) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  el.classList.add('search-pulse');
  el.addEventListener('animationend', () => el.classList.remove('search-pulse'), { once: true });
}

function getSnippet(text: string, query: string): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 40);
  const start = Math.max(0, idx - 20);
  const end = Math.min(text.length, idx + query.length + 20);
  return text.slice(start, end);
}

export function SearchBar({ boardId, role }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: results } = useSearchCardsQuery(boardId, debouncedQuery, {});
  const { data: columns } = useColumnsQuery(boardId);
  const { data: lanes } = useLanesQuery(boardId);

  const matchingColumns = useMemo(() => {
    if (!debouncedQuery || !columns) return [];
    const lower = debouncedQuery.toLowerCase();
    return columns.filter((c) => c.title.toLowerCase().includes(lower));
  }, [debouncedQuery, columns]);

  const matchingLanes = useMemo(() => {
    if (!debouncedQuery || !lanes) return [];
    const lower = debouncedQuery.toLowerCase();
    return lanes.filter((l) => l.title.toLowerCase().includes(lower));
  }, [debouncedQuery, lanes]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCardClick = useCallback((card: Card) => {
    setSelectedCard(card);
    setShowResults(false);
  }, []);

  const handleColumnClick = useCallback((columnId: string) => {
    setShowResults(false);
    scrollAndPulse(`[data-column-id="${columnId}"]`);
  }, []);

  const handleLaneClick = useCallback((laneId: string) => {
    setShowResults(false);
    scrollAndPulse(`[data-lane-id="${laneId}"]`);
  }, []);

  const hasResults = (results?.length ?? 0) > 0 || matchingColumns.length > 0 || matchingLanes.length > 0;

  return (
    <>
      <div ref={wrapperRef} className={styles.wrapper}>
        <span className={styles.icon}>&#128269;</span>
        <input
          className={styles.input}
          value={query}
          onChange={handleChange}
          onFocus={() => setShowResults(true)}
          placeholder="Search..."
          aria-label="Search cards, columns, and lanes"
        />
        {showResults && debouncedQuery && (
          <div className={styles.results}>
            {hasResults ? (
              <>
                {matchingLanes.length > 0 && (
                  <div className={styles.resultSection}>
                    <div className={styles.resultSectionLabel}>Lanes</div>
                    {matchingLanes.map((lane) => (
                      <button
                        key={lane.id}
                        className={styles.resultItem}
                        onClick={() => handleLaneClick(lane.id)}
                      >
                        {lane.title}
                      </button>
                    ))}
                  </div>
                )}
                {matchingColumns.length > 0 && (
                  <div className={styles.resultSection}>
                    <div className={styles.resultSectionLabel}>Columns</div>
                    {matchingColumns.map((col) => (
                      <button
                        key={col.id}
                        className={styles.resultItem}
                        onClick={() => handleColumnClick(col.id)}
                      >
                        {col.title}
                        <span className={styles.resultItemSubtext}>
                          {col.cards.length} {col.cards.length === 1 ? 'card' : 'cards'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {results && results.length > 0 && (
                  <div className={styles.resultSection}>
                    <div className={styles.resultSectionLabel}>Cards</div>
                    {results.map((card) => (
                      <button
                        key={card.id}
                        className={styles.resultItem}
                        onClick={() => handleCardClick(card)}
                      >
                        {card.title}
                        {card.description && !card.title.toLowerCase().includes(debouncedQuery.toLowerCase()) && (
                          <span className={styles.resultItemSubtext}>
                            ...{getSnippet(card.description, debouncedQuery)}...
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noResults}>No results found</div>
            )}
          </div>
        )}
      </div>
      {selectedCard && role && (
        <CardEditorModal
          card={selectedCard}
          boardId={boardId}
          role={role}
          open={!!selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </>
  );
}
