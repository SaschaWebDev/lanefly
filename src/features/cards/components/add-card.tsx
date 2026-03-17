import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useCreateCardMutation } from '../api/create-card';
import type { Card } from '@/types/common';
import styles from './add-card.module.css';

interface AddCardProps {
  boardId: string;
  columnId: string;
  cards: Card[];
}

export function AddCard({ boardId, columnId, cards }: AddCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createCard = useCreateCardMutation();

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
    }
  }, [isEditing]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = title.trim();
      if (!trimmed) return;
      const lastPos = cards.length
        ? Math.max(...cards.map((c) => c.position))
        : 0;
      createCard.mutate({
        boardId,
        columnId,
        title: trimmed,
        position: lastPos + 1024,
      });
      setTitle('');
      textareaRef.current?.focus();
    },
    [title, boardId, columnId, cards, createCard],
  );

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setTitle('');
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const el = e.currentTarget;
        const form = el.closest('form');
        if (form) {
          form.requestSubmit();
        }
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleCancel],
  );

  if (!isEditing) {
    return (
      <button className={styles.trigger} onClick={() => setIsEditing(true)}>
        + Add a card
      </button>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter a title for this card..."
        rows={2}
      />
      <div className={styles.actions}>
        <Button type="submit" size="sm">
          Add card
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
