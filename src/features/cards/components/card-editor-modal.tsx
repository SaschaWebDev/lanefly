import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { SafeHtml } from '@/components/ui/safe-html';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { MarkdownEditor, markdownToHtml } from '@/components/ui/markdown-editor';
import { MemberPicker } from '@/features/members/components/member-picker';
import { LabelPicker } from '@/features/labels/components/label-picker';
import { ChecklistSection } from './checklist';
import { CommentFeed } from '@/features/comments/components/comment-feed';
import { ActivityFeed } from '@/features/activity/components/activity-feed';
import { useUpdateCardMutation } from '../api/update-card';
import { useDeleteCardMutation } from '../api/delete-card';
import { usePermanentDeleteMutation } from '@/features/archive/api/permanent-delete';
import { useCardQuery } from '../api/get-card';
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

  // Fetch full card detail for labels/checklists
  const { data: cardDetail } = useCardQuery(open ? card.id : undefined);

  const [title, setTitle] = useState(card.title);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState(card.description ?? '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showAssignee, setShowAssignee] = useState(false);
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
    const html = markdownToHtml(description);
    if (description !== (card.description ?? '')) {
      updateCard.mutate({
        boardId,
        cardId: card.id,
        description: description ? html : null,
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

  const handleDueDateChange = useCallback(
    (date: string | null) => {
      updateCard.mutate({ boardId, cardId: card.id, due_date: date });
    },
    [boardId, card.id, updateCard],
  );

  const handleAssigneeChange = useCallback(
    (userId: string | null) => {
      updateCard.mutate({ boardId, cardId: card.id, assignee_id: userId });
      setShowAssignee(false);
    },
    [boardId, card.id, updateCard],
  );

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const activeLabelIds = cardDetail?.labels?.map((l) => l.id) ?? [];

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

        {/* Labels display */}
        {cardDetail?.labels && cardDetail.labels.length > 0 && (
          <div className={styles.labelsRow}>
            {cardDetail.labels.map((l) => (
              <span key={l.id} className={styles.labelBadge} style={{ backgroundColor: l.color }}>
                {l.name}
              </span>
            ))}
          </div>
        )}

        <div className={styles.body}>
          <div className={styles.main}>
            {/* Description */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Description</h3>
              {isEditingDesc && can('card:update') ? (
                <MarkdownEditor
                  value={description}
                  onChange={setDescription}
                  onSave={handleDescSave}
                  onCancel={() => {
                    setIsEditingDesc(false);
                    setDescription(card.description ?? '');
                  }}
                />
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

            {/* Checklists */}
            <ChecklistSection
              cardId={card.id}
              boardId={boardId}
              canEdit={can('card:update')}
            />

            {/* Comments */}
            <CommentFeed
              cardId={card.id}
              boardId={boardId}
              canComment={can('card:update')}
            />

            {/* Activity */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Activity</h3>
              <ActivityFeed cardId={card.id} />
            </div>
          </div>

          <div className={styles.sidebar}>
            {/* Status */}
            <div className={styles.sidebarSection}>
              <span className={styles.sidebarLabel}>Status</span>
              <button
                className={card.status === 'done' ? styles.statusDone : styles.statusActive}
                onClick={can('card:update') ? handleToggleStatus : undefined}
              >
                {card.status === 'done' ? 'Done' : 'Active'}
              </button>
            </div>

            {/* Due Date */}
            <div className={styles.sidebarSection}>
              <span className={styles.sidebarLabel}>Due date</span>
              {can('card:update') ? (
                <DatePicker
                  value={card.due_date}
                  onChange={handleDueDateChange}
                />
              ) : (
                <span style={{ fontSize: 'var(--text-sm)' }}>
                  {card.due_date
                    ? new Date(card.due_date).toLocaleDateString()
                    : 'None'}
                </span>
              )}
            </div>

            {/* Assignee */}
            <div className={styles.sidebarSection}>
              <span className={styles.sidebarLabel}>Assignee</span>
              {can('card:update') ? (
                <>
                  <button
                    className={styles.sidebarButton}
                    onClick={() => setShowAssignee(!showAssignee)}
                  >
                    {card.assignee_id ? 'Change' : 'Assign member'}
                  </button>
                  {showAssignee && (
                    <MemberPicker
                      boardId={boardId}
                      selectedUserId={card.assignee_id}
                      onSelect={handleAssigneeChange}
                    />
                  )}
                </>
              ) : (
                <span style={{ fontSize: 'var(--text-sm)' }}>
                  {card.assignee_id ? 'Assigned' : 'Unassigned'}
                </span>
              )}
            </div>

            {/* Labels */}
            <div className={styles.sidebarSection}>
              <span className={styles.sidebarLabel}>Labels</span>
              {can('card:update') ? (
                <>
                  <button
                    className={styles.sidebarButton}
                    onClick={() => setShowLabels(!showLabels)}
                  >
                    {showLabels ? 'Hide labels' : 'Edit labels'}
                  </button>
                  {showLabels && (
                    <LabelPicker
                      boardId={boardId}
                      cardId={card.id}
                      activeLabelIds={activeLabelIds}
                    />
                  )}
                </>
              ) : null}
            </div>

            {/* Danger zone */}
            {can('card:delete') && (
              <div className={styles.sidebarSection}>
                <Button variant="danger" size="sm" onClick={() => setShowArchiveConfirm(true)} fullWidth>
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
        open={showArchiveConfirm}
        title="Archive card"
        message={`Are you sure you want to archive "${card.title}"?`}
        variant="danger"
        confirmLabel="Archive"
        onConfirm={() => {
          handleDelete();
          setShowArchiveConfirm(false);
        }}
        onCancel={() => setShowArchiveConfirm(false)}
      />
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
