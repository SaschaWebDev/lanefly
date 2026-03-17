import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchCardsQuery } from '../api/search-cards';
import styles from './search-bar.module.css';

interface SearchBarProps {
  boardId: string;
}

export function SearchBar({ boardId }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: results } = useSearchCardsQuery(boardId, debouncedQuery, {});

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

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <span className={styles.icon}>&#128269;</span>
      <input
        className={styles.input}
        value={query}
        onChange={handleChange}
        onFocus={() => setShowResults(true)}
        placeholder="Search cards..."
        aria-label="Search cards"
      />
      {showResults && debouncedQuery && (
        <div className={styles.results}>
          {results?.length ? (
            results.map((card) => (
              <button key={card.id} className={styles.resultItem}>
                {card.title}
              </button>
            ))
          ) : (
            <div className={styles.noResults}>No results found</div>
          )}
        </div>
      )}
    </div>
  );
}
