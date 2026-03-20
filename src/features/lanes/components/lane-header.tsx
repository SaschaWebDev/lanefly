import { useState, useCallback, useRef, useEffect } from 'react';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useUpdateLaneMutation } from '../api/update-lane';
import { useDeleteLaneMutation } from '../api/delete-lane';
import { usePermanentDeleteMutation } from '@/features/archive/api/permanent-delete';
import { usePermission } from '@/features/permissions/hooks/use-permission';
import type { BoardRole } from '@/types/database';
import styles from './lane-header.module.css';

interface LaneHeaderProps {
  laneId: string;
  boardId: string;
  title: string;
  role: BoardRole;
  dragListeners?: SyntheticListenerMap;
}

export function LaneHeader({ laneId, boardId, title, role, dragListeners }: LaneHeaderProps) {
  const [editTitle, setEditTitle] = useState(title);
  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const updateLane = useUpdateLaneMutation();
  const deleteLane = useDeleteLaneMutation();
  const permanentDelete = usePermanentDeleteMutation();
  const { can } = usePermission(role);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== title) {
      updateLane.mutate({ boardId, laneId, title: trimmed });
    } else {
      setEditTitle(title);
    }
  }, [editTitle, title, boardId, laneId, updateLane]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        inputRef.current?.blur();
      } else if (e.key === 'Escape') {
        setEditTitle(title);
        setIsEditing(false);
      }
    },
    [title],
  );

  const handleTitleClick = useCallback(() => {
    if (can('column:update')) {
      setEditTitle(title);
      setIsEditing(true);
    }
  }, [can, title]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && can('column:update')) {
        e.preventDefault();
        setEditTitle(title);
        setIsEditing(true);
      }
    },
    [can, title],
  );

  const handleArchive = useCallback(() => {
    setMenuOpen(false);
    deleteLane.mutate({ boardId, laneId });
  }, [boardId, laneId, deleteLane]);

  return (
    <>
    <div className={styles.header}>
      {can('column:reorder') && (
        <div className={styles.dragHandle} {...dragListeners}>
          &#x2630;
        </div>
      )}
      {isEditing && can('column:update') ? (
        <input
          ref={inputRef}
          className={styles.titleInput}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <span
          className={styles.title}
          onClick={handleTitleClick}
          onKeyDown={handleTitleKeyDown}
          role={can('column:update') ? 'button' : undefined}
          tabIndex={can('column:update') ? 0 : undefined}
        >
          {title}
        </span>
      )}
      {can('column:delete') && (
        <div className={styles.menuContainer}>
          <div className={styles.menuWrapper} ref={menuRef}>
            <button
              className={styles.menuButton}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Lane menu"
            >
              &#x22EE;
            </button>
            {menuOpen && (
              <div className={styles.dropdown}>
                <button className={styles.dropdownItem} disabled>
                  Mock
                </button>
                <div className={styles.dropdownSeparator} />
                <button className={styles.dropdownItemDanger} onClick={() => { setMenuOpen(false); setShowArchiveConfirm(true); }}>
                  Archive
                </button>
                <button className={styles.dropdownItemDanger} onClick={() => { setMenuOpen(false); setShowDeleteConfirm(true); }}>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    <ConfirmDialog
      open={showArchiveConfirm}
      title="Archive lane"
      message={`Are you sure you want to archive "${title}"? All columns and cards in this lane will also be archived.`}
      variant="danger"
      confirmLabel="Archive"
      onConfirm={() => {
        handleArchive();
        setShowArchiveConfirm(false);
      }}
      onCancel={() => setShowArchiveConfirm(false)}
    />

    <ConfirmDialog
      open={showDeleteConfirm}
      title="Delete lane"
      message={`Are you sure you want to permanently delete "${title}"? All columns and cards will be permanently removed. This cannot be undone.`}
      variant="danger"
      confirmLabel="Delete"
      onConfirm={() => {
        permanentDelete.mutate({ boardId, type: 'lane', id: laneId });
        setShowDeleteConfirm(false);
      }}
      onCancel={() => setShowDeleteConfirm(false)}
      loading={permanentDelete.isPending}
    />
    </>
  );
}
