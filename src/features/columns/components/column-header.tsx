import { useState, useCallback, useRef } from 'react';
import { usePermission } from '@/features/permissions/hooks/use-permission';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useUpdateColumnMutation } from '../api/update-column';
import { useDeleteColumnMutation } from '../api/delete-column';
import { useSortColumnCardsMutation } from '../api/sort-column-cards';
import { useDuplicateColumnMutation } from '../api/duplicate-column';
import { useColumnsQuery } from '../api/get-columns';
import { useMoveCardMutation } from '@/features/cards/api/move-card';
import { useLanesQuery } from '@/features/lanes/api/get-lanes';
import { usePermanentDeleteMutation } from '@/features/archive/api/permanent-delete';
import { computePosition } from '@/lib/position';
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
  const duplicateColumn = useDuplicateColumnMutation();
  const { data: allColumns } = useColumnsQuery(boardId);
  const permanentDelete = usePermanentDeleteMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const { data: lanes } = useLanesQuery(boardId);
  const moveCard = useMoveCardMutation();

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
      sortCards.mutate({
        boardId,
        columnId: column.id,
        action,
        cards: column.cards,
      });
    },
    [boardId, column.id, column.cards, sortCards],
  );

  const handleDuplicate = useCallback(() => {
    if (!allColumns) return;
    const sameLane = allColumns
      .filter((c) => c.lane_id === column.lane_id)
      .sort((a, b) => a.position - b.position);
    const idx = sameLane.findIndex((c) => c.id === column.id);
    const nextPos =
      idx < sameLane.length - 1 ? sameLane[idx + 1]?.position ?? null : null;
    const newPosition = computePosition(column.position, nextPos);
    const siblingColumnTitles = sameLane.map((c) => c.title);

    duplicateColumn.mutate({
      boardId,
      column,
      siblingColumnTitles,
      newPosition,
    });
  }, [allColumns, boardId, column, duplicateColumn]);

  const handleMoveCards = useCallback(
    (targetColumnId: string) => {
      if (targetColumnId === column.id || column.cards.length === 0) return;
      const targetCol = allColumns?.find((c) => c.id === targetColumnId);
      let lastPos = targetCol?.cards.length
        ? Math.max(...targetCol.cards.map((c) => c.position))
        : 0;
      for (const card of column.cards) {
        lastPos += 1024;
        moveCard.mutate({
          boardId,
          cardId: card.id,
          columnId: targetColumnId,
          position: lastPos,
        });
      }
    },
    [column.id, column.cards, boardId, allColumns, moveCard],
  );

  const hasMultipleLanes = lanes && lanes.length > 1;
  const otherColumns = allColumns?.filter((c) => c.id !== column.id) ?? [];

  const showMenu =
    can('card:move') || can('column:delete') || can('column:create');

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
      {column.cards.length > 0 && (
        <span className={styles.count}>{column.cards.length}</span>
      )}

      {showMenu && (
        <div className={styles.menuContainer}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              className={styles.menuButton}
              aria-label="Column menu"
            >
              &#8943;
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              {can('card:move') && (
                <DropdownMenu.Sub label="Sort cards by">
                  <DropdownMenu.SubItem onSelect={() => handleSort('name-asc')}>
                    Name (A–Z)
                  </DropdownMenu.SubItem>
                  <DropdownMenu.SubItem
                    onSelect={() => handleSort('created-newest')}
                  >
                    Date created (newest)
                  </DropdownMenu.SubItem>
                  <DropdownMenu.SubItem
                    onSelect={() => handleSort('created-oldest')}
                  >
                    Date created (oldest)
                  </DropdownMenu.SubItem>
                </DropdownMenu.Sub>
              )}
              {can('card:move') &&
                otherColumns.length > 0 &&
                column.cards.length > 0 && (
                  <DropdownMenu.Sub label="Move cards to">
                    {hasMultipleLanes
                      ? lanes.map((lane) => {
                          const laneCols = otherColumns.filter(
                            (c) => c.lane_id === lane.id,
                          );
                          if (laneCols.length === 0) return null;
                          return (
                            <DropdownMenu.Sub key={lane.id} label={lane.title}>
                              {laneCols.map((col) => (
                                <DropdownMenu.SubItem
                                  key={col.id}
                                  onSelect={() => handleMoveCards(col.id)}
                                >
                                  {col.title}
                                </DropdownMenu.SubItem>
                              ))}
                            </DropdownMenu.Sub>
                          );
                        })
                      : otherColumns.map((col) => (
                          <DropdownMenu.SubItem
                            key={col.id}
                            onSelect={() => handleMoveCards(col.id)}
                          >
                            {col.title}
                          </DropdownMenu.SubItem>
                        ))}
                  </DropdownMenu.Sub>
                )}
              {can('column:create') && (
                <DropdownMenu.Item
                  onSelect={handleDuplicate}
                  disabled={duplicateColumn.isPending}
                >
                  {duplicateColumn.isPending ? 'Duplicating...' : 'Duplicate'}
                </DropdownMenu.Item>
              )}
              {can('column:delete') && (
                <>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item
                    danger
                    onSelect={() => setShowArchiveConfirm(true)}
                  >
                    Archive
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    danger
                    onSelect={() => setShowDeleteConfirm(true)}
                  >
                    Delete
                  </DropdownMenu.Item>
                </>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      )}

      <ConfirmDialog
        open={showArchiveConfirm}
        title="Archive list"
        message={`Are you sure you want to archive "${column.title}" and all its cards?`}
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
