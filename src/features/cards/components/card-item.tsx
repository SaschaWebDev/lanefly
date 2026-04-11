import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Card } from '@/types/common';
import type { BoardRole } from '@/types/database';
import type { ColumnWithCards } from '@/features/columns/types';
import { generateCopyName } from '@/lib/copy-name';
import { useUpdateCardMutation } from '../api/update-card';
import { useCreateCardMutation } from '../api/create-card';
import { useCardSelection } from './card-selection-context';
import { CardEditorModal } from './card-editor-modal';
import { CardContextMenu } from './card-context-menu';
import styles from './card-item.module.css';

interface CardItemProps {
  card: Card;
  boardId: string;
  role?: BoardRole;
  isDragging?: boolean;
  labels?: Array<{ id: string; name: string; color: string }>;
  checklistTotal?: number;
  checklistDone?: number;
  assigneeName?: string | null;
}

export function CardItem({
  card,
  boardId,
  role,
  isDragging,
  labels,
  checklistTotal,
  checklistDone,
  assigneeName,
}: CardItemProps) {
  const queryClient = useQueryClient();
  const updateCard = useUpdateCardMutation();
  const createCard = useCreateCardMutation();
  const [showEditor, setShowEditor] = useState(false);

  const selection = useCardSelection();

  const isSelected = selection?.isSelected(card.id) ?? false;

  const handleToggleStatus = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      updateCard.mutate({
        boardId,
        cardId: card.id,
        status: card.status === 'done' ? 'active' : 'done',
      });
    },
    [boardId, card.id, card.status, updateCard],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (selection && (e.ctrlKey || e.metaKey || e.shiftKey)) {
        e.preventDefault();
        selection.toggle(card.id, e.ctrlKey || e.metaKey);
        return;
      }
      setShowEditor(true);
    },
    [card.id, selection],
  );

  const handleDuplicate = useCallback(() => {
    const allColumns = queryClient.getQueryData<ColumnWithCards[]>(['columns', boardId]);
    const column = allColumns?.find(c => c.id === card.column_id);
    const siblingTitles = (column?.cards ?? []).map(c => c.title);
    const copyTitle = generateCopyName(card.title, siblingTitles);

    createCard.mutate({
      boardId,
      columnId: card.column_id,
      title: copyTitle,
      description: card.description,
      status: card.status,
      assignee_id: card.assignee_id,
      due_date: card.due_date,
      position: card.position + 1,
    });
  }, [boardId, card, createCard, queryClient]);

  const dueDateClass = card.due_date
    ? new Date(card.due_date) < new Date()
      ? styles.dueDateOverdue
      : styles.dueDate
    : '';

  return (
    <>
      <div
        className={`${styles.card} ${isDragging ? styles.dragging : ''} ${isSelected ? styles.selected : ''}`}
        onClick={handleClick}
        tabIndex={0}
        data-card-id={card.id}
        role="button"
      >
        {/* Labels */}
        {labels && labels.length > 0 && (
          <div className={styles.labels}>
            {labels.map((l) => (
              <span
                key={l.id}
                className={styles.labelDot}
                style={{ backgroundColor: l.color }}
                title={l.name}
              />
            ))}
          </div>
        )}

        <div className={styles.titleRow}>
          <button
            className={card.status === 'done' ? styles.todoToggleDone : styles.todoToggle}
            onClick={handleToggleStatus}
            aria-label={card.status === 'done' ? 'Mark as ongoing' : 'Mark as done'}
          >
            {card.status === 'done' ? '\u2713' : ''}
          </button>

          <div className={styles.title}>{card.title}</div>

          {role && (
            <div className={styles.contextMenu} onClick={(e) => e.stopPropagation()}>
              <CardContextMenu card={card} boardId={boardId} labels={labels} onDuplicate={handleDuplicate} onToggleStatus={handleToggleStatus}>
                &#x22EF;
              </CardContextMenu>
            </div>
          )}
        </div>

        <div className={styles.meta}>
          {card.due_date && (
            <span className={dueDateClass}>
              {new Date(card.due_date).toLocaleDateString()}
            </span>
          )}

          {checklistTotal !== undefined && checklistTotal > 0 && (
            <span className={checklistDone === checklistTotal ? styles.checklistBadgeDone : styles.checklistBadge}>
              &#9744; {checklistDone}/{checklistTotal}
            </span>
          )}

          {assigneeName && (
            <span className={styles.assigneeBadge} title={assigneeName}>
              {assigneeName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
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
