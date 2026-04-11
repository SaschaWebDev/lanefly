import { useState, useCallback } from 'react';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useUpdateCardMutation } from '../api/update-card';
import { useDeleteCardMutation } from '../api/delete-card';
import { usePermanentDeleteMutation } from '@/features/archive/api/permanent-delete';
import { useMoveCardMutation } from '../api/move-card';
import { useColumnsQuery } from '@/features/columns/api/get-columns';
import { useLanesQuery } from '@/features/lanes/api/get-lanes';
import { useLabelsQuery } from '@/features/labels/api/get-labels';
import { useToggleCardLabelMutation } from '@/features/labels/api/toggle-card-label';
import { useBoardMembersQuery } from '@/features/members/api/get-board-members';
import { Avatar } from '@/features/members/components/avatar';
import type { Card } from '@/types/common';
import type { CardLabel } from '@/features/columns/types';
import styles from './card-context-menu.module.css';

interface CardContextMenuProps {
  card: Card;
  boardId: string;
  labels?: CardLabel[];
  children: React.ReactNode;
  onDuplicate?: () => void;
  onToggleStatus?: () => void;
}

export function CardContextMenu({ card, boardId, labels: cardLabels, children, onDuplicate, onToggleStatus }: CardContextMenuProps) {
  const updateCard = useUpdateCardMutation();
  const deleteCard = useDeleteCardMutation();
  const permanentDelete = usePermanentDeleteMutation();
  const moveCard = useMoveCardMutation();
  const { data: columns } = useColumnsQuery(boardId);
  const { data: lanes } = useLanesQuery(boardId);
  const { data: labels } = useLabelsQuery(boardId);
  const { data: members } = useBoardMembersQuery(boardId);
  const toggleLabel = useToggleCardLabelMutation();
  const activeLabelIds = new Set(cardLabels?.map((l) => l.id) ?? []);

  const handleMoveToColumn = useCallback(
    (columnId: string) => {
      if (columnId === card.column_id) return;
      const targetCol = columns?.find((c) => c.id === columnId);
      const lastPos = targetCol?.cards.length
        ? Math.max(...targetCol.cards.map((c) => c.position))
        : 0;
      moveCard.mutate({ boardId, cardId: card.id, columnId, position: lastPos + 1024 });
    },
    [card.id, card.column_id, boardId, columns, moveCard],
  );

  const handleAssign = useCallback(
    (userId: string | null) => {
      updateCard.mutate({ boardId, cardId: card.id, assignee_id: userId });
    },
    [boardId, card.id, updateCard],
  );

  const handleArchive = useCallback(() => {
    deleteCard.mutate({ boardId, cardId: card.id });
  }, [boardId, card.id, deleteCard]);

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasMultipleLanes = lanes && lanes.length > 1;
  const otherColumns = columns?.filter((c) => c.id !== card.column_id) ?? [];

  return (
    <>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={styles.trigger}>
        {children}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {otherColumns.length > 0 && (
          <DropdownMenu.Sub label="Move to">
            {hasMultipleLanes
              ? lanes.map((lane) => {
                  const laneCols = otherColumns.filter((c) => c.lane_id === lane.id);
                  if (laneCols.length === 0) return null;
                  return (
                    <DropdownMenu.Sub key={lane.id} label={lane.title}>
                      {laneCols.map((col) => (
                        <DropdownMenu.SubItem
                          key={col.id}
                          onSelect={() => handleMoveToColumn(col.id)}
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
                    onSelect={() => handleMoveToColumn(col.id)}
                  >
                    {col.title}
                  </DropdownMenu.SubItem>
                ))}
          </DropdownMenu.Sub>
        )}

        {labels && labels.length > 0 && (
          <DropdownMenu.Sub label="Set label">
            {labels.map((label) => (
              <DropdownMenu.SubItem
                key={label.id}
                checked={activeLabelIds.has(label.id)}
                onSelect={() => toggleLabel.mutate({ cardId: card.id, labelId: label.id, boardId, isActive: activeLabelIds.has(label.id) })}
              >
                <span className={styles.colorDot} style={{ backgroundColor: label.color }} />
                {label.name}
              </DropdownMenu.SubItem>
            ))}
          </DropdownMenu.Sub>
        )}

        {members && members.length > 0 && (
          <DropdownMenu.Sub label="Assign to">
            <DropdownMenu.SubItem onSelect={() => handleAssign(null)}>
              <span className={styles.unassignedIcon}>{'\u2715'}</span>
              Unassigned
            </DropdownMenu.SubItem>
            {members.map((m) => (
              <DropdownMenu.SubItem
                key={m.id}
                checked={card.assignee_id === m.user_id}
                onSelect={() => handleAssign(m.user_id)}
              >
                <Avatar name={m.display_name} imageUrl={m.avatar_url} size="sm" />
                {m.display_name ?? 'Unknown'}
              </DropdownMenu.SubItem>
            ))}
          </DropdownMenu.Sub>
        )}

        <DropdownMenu.Separator />

        <DropdownMenu.Item
          onSelect={() => onToggleStatus?.()}
        >
          {card.status === 'done' ? 'Mark as Ongoing' : 'Mark as Done'}
        </DropdownMenu.Item>

        {onDuplicate && (
          <DropdownMenu.Item onSelect={onDuplicate}>
            Duplicate
          </DropdownMenu.Item>
        )}

        <DropdownMenu.Separator />

        <DropdownMenu.Item danger onSelect={() => setShowArchiveConfirm(true)}>
          Archive
        </DropdownMenu.Item>
        <DropdownMenu.Item danger onSelect={() => setShowDeleteConfirm(true)}>
          Delete
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>

    <ConfirmDialog
      open={showArchiveConfirm}
      title="Archive card"
      message={`Are you sure you want to archive "${card.title}"?`}
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
      title="Delete card"
      message={`Are you sure you want to permanently delete "${card.title}"? This cannot be undone.`}
      variant="danger"
      confirmLabel="Delete"
      onConfirm={() => {
        permanentDelete.mutate({ boardId, type: 'card', id: card.id });
        setShowDeleteConfirm(false);
      }}
      onCancel={() => setShowDeleteConfirm(false)}
      loading={permanentDelete.isPending}
    />
    </>
  );
}
