import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import styles from './add-lane.module.css';

interface AddLaneProps {
  onAdd: (title: string) => void;
}

export function AddLane({ onAdd }: AddLaneProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    function handleClickOutside(e: MouseEvent) {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setIsEditing(false);
        setTitle('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = title.trim();
      if (!trimmed) return;
      onAdd(trimmed);
      setTitle('');
      setIsEditing(false);
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
    <div className={styles.formWrapper} ref={formRef}>
      <div className={styles.formTriggerActive}>+</div>
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
            Add lane
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
    </div>
  );
}
