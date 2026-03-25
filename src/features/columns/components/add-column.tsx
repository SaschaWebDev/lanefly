import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import styles from './add-column.module.css';

interface AddColumnProps {
  onAdd: (title: string, laneId?: string) => void;
  laneId?: string;
}

export function AddColumn({ onAdd, laneId }: AddColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = title.trim();
      if (!trimmed) return;
      onAdd(trimmed, laneId);
      setTitle('');
      inputRef.current?.focus();
    },
    [title, onAdd],
  );

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setTitle('');
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleCancel],
  );

  if (!isEditing) {
    return (
      <button className={styles.trigger} onClick={() => setIsEditing(true)}>
        +
      </button>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        className={styles.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter title..."
      />
      <div className={styles.actions}>
        <Button type="submit" size="sm">
          Add list
        </Button>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={handleCancel}
          aria-label="Cancel"
        >
          &#x2715;
        </button>
      </div>
    </form>
  );
}
