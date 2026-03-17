import { useState, useCallback } from 'react';
import type { Card } from '@/types/common';
import type { BoardRole } from '@/types/database';
import { useUpdateCardMutation } from '../api/update-card';
import { CardEditorModal } from './card-editor-modal';
import styles from './card-item.module.css';

interface CardItemProps {
  card: Card;
  boardId: string;
  role?: BoardRole;
  isDragging?: boolean;
}

export function CardItem({ card, boardId, role, isDragging }: CardItemProps) {
  const updateCard = useUpdateCardMutation();
  const [showEditor, setShowEditor] = useState(false);

  const handleToggleStatus = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      updateCard.mutate({
        boardId,
        cardId: card.id,
        status: card.status === 'done' ? 'active' : 'done',
      });
    },
    [boardId, card.id, card.status, updateCard],
  );

  return (
    <>
      <div
        className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
        onClick={() => setShowEditor(true)}
        tabIndex={0}
        data-card-id={card.id}
        role="button"
      >
        <div className={styles.title}>{card.title}</div>

        {card.due_date && (
          <div className={styles.meta}>
            <span
              className={
                new Date(card.due_date) < new Date()
                  ? styles.dueDateOverdue
                  : styles.dueDate
              }
            >
              {new Date(card.due_date).toLocaleDateString()}
            </span>
          </div>
        )}

        <button
          className={card.status === 'done' ? styles.todoToggleDone : styles.todoToggle}
          onClick={handleToggleStatus}
          aria-label={card.status === 'done' ? 'Mark as active' : 'Mark as done'}
        >
          {card.status === 'done' ? '\u2713' : ''}
        </button>
      </div>

      {role && (
        <CardEditorModal
          card={card}
          boardId={boardId}
          role={role}
          open={showEditor}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
}
