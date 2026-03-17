import { createPortal } from 'react-dom';
import { useArchivedItemsQuery } from '../api/get-archived';
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
  const restoreColumn = useRestoreColumnMutation();
  const restoreCard = useRestoreCardMutation();
  const permanentDelete = usePermanentDeleteMutation();

  if (!open) return null;

  const hasItems = (data?.columns.length ?? 0) > 0 || (data?.cards.length ?? 0) > 0;

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
          {!hasItems && <p className={styles.empty}>No archived items</p>}

          {data?.columns && data.columns.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Lists</h3>
              {data.columns.map((col) => (
                <div key={col.id} className={styles.item}>
                  <span className={styles.itemTitle}>{col.title}</span>
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
                        onClick={() => permanentDelete.mutate({ boardId, type: 'column', id: col.id })}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {data?.cards && data.cards.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Cards</h3>
              {data.cards.map((card) => (
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
                        onClick={() => permanentDelete.mutate({ boardId, type: 'card', id: card.id })}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
