import { useState, useCallback, useRef, useEffect } from 'react';
import type { SyntheticListenerMap } from '@dnd-kit/sortable';
import { useUpdateLaneMutation } from '../api/update-lane';
import { useDeleteLaneMutation } from '../api/delete-lane';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const updateLane = useUpdateLaneMutation();
  const deleteLane = useDeleteLaneMutation();
  const { can } = usePermission(role);

  useEffect(() => {
    setEditTitle(title);
  }, [title]);

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
        inputRef.current?.blur();
      }
    },
    [title],
  );

  const handleArchive = useCallback(() => {
    setMenuOpen(false);
    deleteLane.mutate({ boardId, laneId });
  }, [boardId, laneId, deleteLane]);

  return (
    <div className={styles.header}>
      {can('column:reorder') && (
        <div className={styles.dragHandle} {...dragListeners}>
          &#x2630;
        </div>
      )}
      <input
        ref={inputRef}
        className={styles.title}
        value={editTitle}
        onChange={(e) => setEditTitle(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        readOnly={!can('column:update')}
      />
      {can('column:delete') && (
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
              <button className={styles.dropdownItemDanger} onClick={handleArchive}>
                Archive lane
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
