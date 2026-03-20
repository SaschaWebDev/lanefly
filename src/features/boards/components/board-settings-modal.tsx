import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useUpdateBoardMutation } from '../api/update-board';
import { useDeleteBoardMutation } from '../api/delete-board';
import { useDuplicateBoardMutation } from '../api/duplicate-board';
import { useBoardMembersQuery } from '@/features/members/api/get-board-members';
import { useUpdateMemberRoleMutation } from '@/features/members/api/update-member-role';
import { useRemoveMemberMutation } from '@/features/members/api/remove-member';
import { Avatar } from '@/features/members/components/avatar';
import type { BoardWithRole } from '../types';
import type { BoardRole } from '@/types/database';
import styles from './board-settings-modal.module.css';

const BACKGROUND_COLORS = [
  '#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#64748b', '#84cc16',
];

interface BoardSettingsModalProps {
  board: BoardWithRole;
  open: boolean;
  onClose: () => void;
}

export function BoardSettingsModal({ board, open, onClose }: BoardSettingsModalProps) {
  const navigate = useNavigate();
  const updateBoard = useUpdateBoardMutation();
  const deleteBoard = useDeleteBoardMutation();
  const duplicateBoard = useDuplicateBoardMutation();
  const { data: members } = useBoardMembersQuery(board.id);
  const updateRole = useUpdateMemberRoleMutation();
  const removeMember = useRemoveMemberMutation();

  const [title, setTitle] = useState(board.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [includeCards, setIncludeCards] = useState(false);

  const handleSaveTitle = useCallback(() => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== board.title) {
      updateBoard.mutate({ boardId: board.id, title: trimmed });
    }
  }, [title, board.title, board.id, updateBoard]);

  const handleChangeBackground = useCallback(
    (color: string) => {
      updateBoard.mutate({ boardId: board.id, background: color });
    },
    [board.id, updateBoard],
  );

  const handleDeleteBoard = useCallback(() => {
    deleteBoard.mutate({ boardId: board.id });
    onClose();
    void navigate({ to: '/' });
  }, [board.id, deleteBoard, onClose, navigate]);

  const handleDuplicateBoard = useCallback(() => {
    duplicateBoard.mutate(
      { boardId: board.id, includeCards },
      {
        onSuccess: (newBoardId) => {
          onClose();
          void navigate({ to: '/boards/$boardId', params: { boardId: newBoardId } });
        },
      },
    );
  }, [board.id, includeCards, duplicateBoard, onClose, navigate]);

  const handleRoleChange = useCallback(
    (memberId: string, role: BoardRole) => {
      updateRole.mutate({ boardId: board.id, memberId, role });
    },
    [board.id, updateRole],
  );

  const handleRemoveMember = useCallback(
    (memberId: string) => {
      removeMember.mutate({ boardId: board.id, memberId });
    },
    [board.id, removeMember],
  );

  return (
    <>
      <Modal open={open} onClose={onClose} title="Board Settings">
        <div className={styles.sections}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Title</h3>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
            />
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Background</h3>
            <div className={styles.colorGrid}>
              {BACKGROUND_COLORS.map((color) => (
                <button
                  key={color}
                  className={
                    board.background === color
                      ? styles.colorSwatchActive
                      : styles.colorSwatch
                  }
                  style={{ backgroundColor: color }}
                  onClick={() => handleChangeBackground(color)}
                  aria-label={`Set background to ${color}`}
                />
              ))}
            </div>
          </div>

          {members && members.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Members</h3>
              <div className={styles.memberList}>
                {members.map((member) => (
                  <div key={member.id} className={styles.memberRow}>
                    <Avatar name={member.display_name} imageUrl={member.avatar_url} size="sm" />
                    <span className={styles.memberName}>
                      {member.display_name ?? 'Unknown'}
                    </span>
                    <select
                      className={styles.roleSelect}
                      value={member.role}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'admin' || value === 'editor' || value === 'viewer') {
                          handleRoleChange(member.id, value);
                        }
                      }}
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      className={styles.removeButton}
                      onClick={() => setMemberToRemove(member.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Duplicate Board</h3>
            <p className={styles.hint}>
              Create a copy of this board with all lanes, columns, and labels.
            </p>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={includeCards}
                onChange={(e) => setIncludeCards(e.target.checked)}
              />
              Include cards
            </label>
            <Button
              variant="secondary"
              onClick={handleDuplicateBoard}
              loading={duplicateBoard.isPending}
            >
              Duplicate Board
            </Button>
          </div>

          <div className={`${styles.section} ${styles.dangerZone}`}>
            <h3 className={styles.sectionTitle}>Danger Zone</h3>
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Board
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={memberToRemove !== null}
        title="Remove member"
        message="Are you sure you want to remove this member from the board?"
        variant="danger"
        confirmLabel="Remove"
        onConfirm={() => {
          if (memberToRemove) handleRemoveMember(memberToRemove);
          setMemberToRemove(null);
        }}
        onCancel={() => setMemberToRemove(null)}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete board"
        message={`Are you sure you want to delete "${board.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteBoard}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
