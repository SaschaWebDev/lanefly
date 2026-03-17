import { useState, useCallback, useRef } from 'react';
import { usePermission } from '@/features/permissions/hooks/use-permission';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useUpdateColumnMutation } from '../api/update-column';
import { useDeleteColumnMutation } from '../api/delete-column';
import { useSortColumnCardsMutation } from '../api/sort-column-cards';
import { usePermanentDeleteMutation } from '@/features/archive/api/permanent-delete';
import type { BoardRole } from '@/types/database';
import type { ColumnWithCards } from '../types';
import type { CardSortAction } from '../types';
import styles from './column-header.module.css';

interface ColumnHeaderProps {
  column: ColumnWithCards;
  boardId: string;
  role: BoardRole;
}

export function ColumnHeader({ column, boardId, role }: ColumnHeaderProps) {
  const { can } = usePermission(role);
  const updateColumn = useUpdateColumnMutation();
  const deleteColumn = useDeleteColumnMutation();
  const sortCards = useSortColumnCardsMutation();
  const permanentDelete = usePermanentDeleteMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== column.title) {
      updateColumn.mutate({ boardId, columnId: column.id, title: trimmed });
    } else {
      setEditTitle(column.title);
    }
  }, [editTitle, column.title, column.id, boardId, updateColumn]);

  const editInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        editInputRef.current?.blur();
      } else if (e.key === 'Escape') {
        setEditTitle(column.title);
        setIsEditing(false);
      }
    },
    [column.title],
  );

  const handleTitleClick = useCallback(() => {
    if (can('column:update')) {
      setIsEditing(true);
    }
  }, [can]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && can('column:update')) {
        e.preventDefault();
        setIsEditing(true);
      }
    },
    [can],
  );

  const handleArchive = useCallback(() => {
    deleteColumn.mutate({ boardId, columnId: column.id });
  }, [boardId, column.id, deleteColumn]);

  const handleSort = useCallback(
    (action: CardSortAction) => {
      sortCards.mutate({ boardId, columnId: column.id, action, cards: column.cards });
    },
    [boardId, column.id, column.cards, sortCards],
  );

  const showMenu = can('card:move') || can('column:delete');

  return (
    <div className={styles.header}>
      {isEditing && can('column:update') ? (
        <input
          ref={editInputRef}
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
          {column.title}
        </span>
      )}
      <span className={styles.count}>{column.cards.length}</span>

      {showMenu && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className={styles.menuButton} aria-label="Column menu">
            &#8943;
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            {can('card:move') && (
              <DropdownMenu.Sub label="Sort cards by">
                <DropdownMenu.SubItem onSelect={() => handleSort('name-asc')}>
                  Name (A–Z)
                </DropdownMenu.SubItem>
                <DropdownMenu.SubItem onSelect={() => handleSort('created-newest')}>
                  Date created (newest)
                </DropdownMenu.SubItem>
                <DropdownMenu.SubItem onSelect={() => handleSort('created-oldest')}>
                  Date created (oldest)
                </DropdownMenu.SubItem>
              </DropdownMenu.Sub>
            )}
            {can('column:delete') && (
              <>
                <DropdownMenu.Separator />
                <DropdownMenu.Item danger onSelect={handleArchive}>
                  Archive list
                </DropdownMenu.Item>
                <DropdownMenu.Item danger onSelect={() => setShowDeleteConfirm(true)}>
                  Delete column
                </DropdownMenu.Item>
              </>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete column"
        message={`Are you sure you want to permanently delete "${column.title}" and all its cards? This cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          permanentDelete.mutate({ boardId, type: 'column', id: column.id });
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        loading={permanentDelete.isPending}
      />
    </div>
  );
}
