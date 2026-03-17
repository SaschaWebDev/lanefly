import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SafeHtml } from '@/components/ui/safe-html';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useUpdateCardMutation } from '../api/update-card';
import { useDeleteCardMutation } from '../api/delete-card';
import { usePermanentDeleteMutation } from '@/features/archive/api/permanent-delete';
import type { Card } from '@/types/common';
import type { BoardRole } from '@/types/database';
import { usePermission } from '@/features/permissions/hooks/use-permission';
import styles from './card-editor-modal.module.css';

interface CardEditorModalProps {
  card: Card;
  boardId: string;
  role: BoardRole;
  open: boolean;
  onClose: () => void;
}

export function CardEditorModal({ card, boardId, role, open, onClose }: CardEditorModalProps) {
  const { can } = usePermission(role);
  const updateCard = useUpdateCardMutation();
  const deleteCard = useDeleteCardMutation();
  const permanentDelete = usePermanentDeleteMutation();

  const [title, setTitle] = useState(card.title);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState(card.description ?? '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description ?? '');
  }, [card.title, card.description]);

  const handleTitleBlur = useCallback(() => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== card.title) {
      updateCard.mutate({ boardId, cardId: card.id, title: trimmed });
    } else {
      setTitle(card.title);
    }
  }, [title, card.title, card.id, boardId, updateCard]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        titleRef.current?.blur();
      } else if (e.key === 'Escape') {
        setTitle(card.title);
        titleRef.current?.blur();
      }
    },
    [card.title],
  );

  const handleDescSave = useCallback(() => {
    setIsEditingDesc(false);
    if (description !== (card.description ?? '')) {
      updateCard.mutate({
        boardId,
        cardId: card.id,
        description: description || null,
      });
    }
  }, [description, card.description, card.id, boardId, updateCard]);

  const handleToggleStatus = useCallback(() => {
    updateCard.mutate({
      boardId,
      cardId: card.id,
      status: card.status === 'done' ? 'active' : 'done',
    });
  }, [boardId, card.id, card.status, updateCard]);

  const handleDelete = useCallback(() => {
    deleteCard.mutate({ boardId, cardId: card.id });
    onClose();
  }, [boardId, card.id, deleteCard, onClose]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const modal = createPortal(
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={card.title}
      >
        <div className={styles.header}>
          {can('card:update') ? (
            <input
              ref={titleRef}
              className={styles.titleInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              aria-label="Card title"
            />
          ) : (
            <h2 className={styles.titleInput} style={{ cursor: 'default' }}>
              {card.title}
            </h2>
          )}
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            &#x2715;
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.main}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Description</h3>
              {isEditingDesc && can('card:update') ? (
                <div>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a more detailed description..."
                    autoResize
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    <Button size="sm" onClick={handleDescSave}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setIsEditingDesc(false);
                      setDescription(card.description ?? '');
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={styles.description}
                  onClick={() => can('card:update') && setIsEditingDesc(true)}
                >
                  {card.description ? (
                    <SafeHtml html={card.description} />
                  ) : (
                    'Add a more detailed description...'
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.sidebarSection}>
              <span className={styles.sidebarLabel}>Status</span>
              <button
                className={card.status === 'done' ? styles.statusDone : styles.statusActive}
                onClick={can('card:update') ? handleToggleStatus : undefined}
              >
                {card.status === 'done' ? 'Done' : 'Active'}
              </button>
            </div>

            {card.due_date && (
              <div className={styles.sidebarSection}>
                <span className={styles.sidebarLabel}>Due date</span>
                <span style={{ fontSize: 'var(--text-sm)' }}>
                  {new Date(card.due_date).toLocaleDateString()}
                </span>
              </div>
            )}

            {can('card:delete') && (
              <div className={styles.sidebarSection}>
                <Button variant="danger" size="sm" onClick={handleDelete} fullWidth>
                  Archive
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  fullWidth
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );

  return (
    <>
      {modal}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete card"
        message={`Are you sure you want to permanently delete "${card.title}"? This cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          permanentDelete.mutate({ boardId, type: 'card', id: card.id });
          setShowDeleteConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        loading={permanentDelete.isPending}
      />
    </>
  );
}
