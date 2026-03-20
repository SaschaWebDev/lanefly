import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useCardSelection } from './card-selection-context';
import { useUpdateCardMutation } from '../api/update-card';
import { useDeleteCardMutation } from '../api/delete-card';
import { useMoveCardMutation } from '../api/move-card';
import { useColumnsQuery } from '@/features/columns/api/get-columns';
import { useLabelsQuery } from '@/features/labels/api/get-labels';
import { useBoardMembersQuery } from '@/features/members/api/get-board-members';
import { useToggleCardLabelMutation } from '@/features/labels/api/toggle-card-label';
import styles from './bulk-action-bar.module.css';

interface BulkActionBarProps {
  boardId: string;
}

export function BulkActionBar({ boardId }: BulkActionBarProps) {
  const ctx = useCardSelection();
  const updateCard = useUpdateCardMutation();
  const deleteCard = useDeleteCardMutation();
  const moveCard = useMoveCardMutation();
  const { data: columns } = useColumnsQuery(boardId);
  const { data: labels } = useLabelsQuery(boardId);
  const { data: members } = useBoardMembersQuery(boardId);
  const toggleLabel = useToggleCardLabelMutation();

  const [showMove, setShowMove] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  if (!ctx) return null;
  const { selectedIds, selectionCount, clearSelection } = ctx;

  const handleBulkAction = useCallback(
    (action: (cardId: string) => void) => {
      for (const id of selectedIds) {
        action(id);
      }
      clearSelection();
    },
    [selectedIds, clearSelection],
  );

  const handleMoveToColumn = useCallback(
    (columnId: string) => {
      const targetCol = columns?.find((c) => c.id === columnId);
      let pos = targetCol?.cards.length
        ? Math.max(...targetCol.cards.map((c) => c.position))
        : 0;

      for (const id of selectedIds) {
        pos += 1024;
        moveCard.mutate({ boardId, cardId: id, columnId, position: pos });
      }
      clearSelection();
      setShowMove(false);
    },
    [selectedIds, boardId, columns, moveCard, clearSelection],
  );

  if (selectionCount === 0) return null;

  return createPortal(
    <div className={styles.bar}>
      <span className={styles.count}>{selectionCount} card{selectionCount > 1 ? 's' : ''} selected</span>

      <div className={styles.actions}>
        <div className={styles.dropdownWrapper}>
          <Button size="sm" variant="secondary" onClick={() => { setShowMove(!showMove); setShowLabel(false); setShowAssign(false); }}>
            Move to...
          </Button>
          {showMove && (
            <div className={styles.dropdown}>
              {columns?.map((col) => (
                <button
                  key={col.id}
                  className={styles.dropdownItem}
                  onClick={() => handleMoveToColumn(col.id)}
                >
                  {col.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.dropdownWrapper}>
          <Button size="sm" variant="secondary" onClick={() => { setShowLabel(!showLabel); setShowMove(false); setShowAssign(false); }}>
            Set label...
          </Button>
          {showLabel && (
            <div className={styles.dropdown}>
              {labels?.map((label) => (
                <button
                  key={label.id}
                  className={styles.dropdownItem}
                  onClick={() => {
                    handleBulkAction((cardId) =>
                      toggleLabel.mutate({ cardId, labelId: label.id, boardId, isActive: false })
                    );
                    setShowLabel(false);
                  }}
                >
                  <span className={styles.colorDot} style={{ backgroundColor: label.color }} />
                  {label.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.dropdownWrapper}>
          <Button size="sm" variant="secondary" onClick={() => { setShowAssign(!showAssign); setShowMove(false); setShowLabel(false); }}>
            Assign to...
          </Button>
          {showAssign && (
            <div className={styles.dropdown}>
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  handleBulkAction((cardId) =>
                    updateCard.mutate({ boardId, cardId, assignee_id: null })
                  );
                  setShowAssign(false);
                }}
              >
                Unassigned
              </button>
              {members?.map((m) => (
                <button
                  key={m.id}
                  className={styles.dropdownItem}
                  onClick={() => {
                    handleBulkAction((cardId) =>
                      updateCard.mutate({ boardId, cardId, assignee_id: m.user_id })
                    );
                    setShowAssign(false);
                  }}
                >
                  {m.display_name ?? 'Unknown'}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          size="sm"
          variant="danger"
          onClick={() => setShowArchiveConfirm(true)}
        >
          Archive
        </Button>
      </div>

      <button className={styles.close} onClick={clearSelection} aria-label="Clear selection">
        &#x2715;
      </button>

      <ConfirmDialog
        open={showArchiveConfirm}
        title="Archive cards"
        message={`Are you sure you want to archive ${selectionCount} card${selectionCount > 1 ? 's' : ''}?`}
        variant="danger"
        confirmLabel="Archive"
        onConfirm={() => {
          handleBulkAction((cardId) => deleteCard.mutate({ boardId, cardId }));
          setShowArchiveConfirm(false);
        }}
        onCancel={() => setShowArchiveConfirm(false)}
      />
    </div>,
    document.body,
  );
}
