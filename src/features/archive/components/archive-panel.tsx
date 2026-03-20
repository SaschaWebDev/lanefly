import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useArchivedItemsQuery } from '../api/get-archived';
import { useRestoreLaneMutation } from '../api/restore-lane';
import { useRestoreColumnMutation } from '../api/restore-column';
import { useRestoreCardMutation } from '../api/restore-card';
import { usePermanentDeleteMutation } from '../api/permanent-delete';
import { usePermission } from '@/features/permissions/hooks/use-permission';
import type { BoardRole } from '@/types/database';
import styles from './archive-panel.module.css';

interface ArchivePanelProps {
  boardId: string;
  role: BoardRole;
  open: boolean;
  onClose: () => void;
}

export function ArchivePanel({ boardId, role, open, onClose }: ArchivePanelProps) {
  const { can } = usePermission(role);
  const { data } = useArchivedItemsQuery(open ? boardId : undefined);
  const restoreLane = useRestoreLaneMutation();
  const restoreColumn = useRestoreColumnMutation();
  const restoreCard = useRestoreCardMutation();
  const permanentDelete = usePermanentDeleteMutation();
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'lane' | 'column' | 'card'; id: string; title: string } | null>(null);

  if (!open) return null;

  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Archive</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            &#x2715;
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Lanes</h3>
            {data?.lanes && data.lanes.length > 0 ? (
              data.lanes.map((lane) => (
                <div key={lane.id} className={styles.item}>
                  <div className={styles.itemContent}>
                    <span className={styles.itemTitle}>{lane.title}</span>
                    <div className={styles.itemInfo}>
                      {lane.columnCount} {lane.columnCount === 1 ? 'column' : 'columns'}
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <button
                      className={styles.restoreButton}
                      onClick={() => restoreLane.mutate({ boardId, laneId: lane.id })}
                    >
                      Restore
                    </button>
                    {can('board:delete') && (
                      <button
                        className={styles.deleteButton}
                        onClick={() => setDeleteTarget({ type: 'lane', id: lane.id, title: lane.title })}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptySection}>No archived lanes</p>
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Columns</h3>
            {data?.columns && data.columns.length > 0 ? (
              data.columns.map((col) => (
                <div key={col.id} className={styles.item}>
                  <div className={styles.itemContent}>
                    <span className={styles.itemTitle}>{col.title}</span>
                    <div className={styles.itemInfo}>
                      {col.cardCount} {col.cardCount === 1 ? 'card' : 'cards'}
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <button
                      className={styles.restoreButton}
                      onClick={() => restoreColumn.mutate({ boardId, columnId: col.id })}
                    >
                      Restore
                    </button>
                    {can('board:delete') && (
                      <button
                        className={styles.deleteButton}
                        onClick={() => setDeleteTarget({ type: 'column', id: col.id, title: col.title })}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptySection}>No archived columns</p>
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Cards</h3>
            {data?.cards && data.cards.length > 0 ? (
              data.cards.map((card) => (
                <div key={card.id} className={styles.item}>
                  <span className={styles.itemTitle}>{card.title}</span>
                  <div className={styles.itemActions}>
                    <button
                      className={styles.restoreButton}
                      onClick={() => restoreCard.mutate({ boardId, cardId: card.id })}
                    >
                      Restore
                    </button>
                    {can('board:delete') && (
                      <button
                        className={styles.deleteButton}
                        onClick={() => setDeleteTarget({ type: 'card', id: card.id, title: card.title })}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptySection}>No archived cards</p>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete permanently"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            permanentDelete.mutate({ boardId, type: deleteTarget.type, id: deleteTarget.id });
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
        loading={permanentDelete.isPending}
      />
    </>,
    document.body,
  );
}
