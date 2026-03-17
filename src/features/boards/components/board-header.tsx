import { useState, useCallback, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { usePermission } from '@/features/permissions/hooks/use-permission';
import { SearchBar } from '@/features/search/components/search-bar';
import { ExportMenu } from '@/features/export/components/export-menu';
import { ArchivePanel } from '@/features/archive/components/archive-panel';
import { useToggleFavoriteMutation } from '../api/toggle-favorite';
import { BoardSettingsModal } from './board-settings-modal';
import type { BoardWithRole } from '../types';
import styles from './board-header.module.css';

interface BoardHeaderProps {
  board: BoardWithRole;
  onUpdateTitle: (title: string) => void;
}

export function BoardHeader({ board, onUpdateTitle }: BoardHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermission(board.role);
  const toggleFavorite = useToggleFavoriteMutation();
  const [editTitle, setEditTitle] = useState(board.title);
  const [showArchive, setShowArchive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const canEdit = can('board:update');

  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = useCallback(() => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== board.title) {
      onUpdateTitle(trimmed);
    } else {
      setEditTitle(board.title);
    }
  }, [editTitle, board.title, onUpdateTitle]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        if (e.key === 'Escape') {
          setEditTitle(board.title);
        }
        inputRef.current?.blur();
      }
    },
    [board.title],
  );

  return (
    <div className={styles.header}>
      <button
        className={styles.backButton}
        onClick={() => void navigate({ to: '/' })}
        aria-label="Back to boards"
      >
        &#8592;
      </button>

      {canEdit ? (
        <input
          ref={inputRef}
          className={styles.titleInput}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          aria-label="Board title"
        />
      ) : (
        <h1 className={styles.title}>{board.title}</h1>
      )}

      <div className={styles.actions}>
        {user && (
          <button
            className={`${styles.starButton}${board.is_favorite ? ` ${styles.starred}` : ''}`}
            onClick={() =>
              toggleFavorite.mutate({
                boardId: board.id,
                userId: user.id,
                isFavorite: board.is_favorite,
              })
            }
            aria-label={board.is_favorite ? 'Unstar board' : 'Star board'}
            title={board.is_favorite ? 'Unstar' : 'Star'}
          >
            {board.is_favorite ? '\u2605' : '\u2606'}
          </button>
        )}

        <SearchBar boardId={board.id} />

        {can('board:update') && (
          <ExportMenu boardId={board.id} />
        )}

        <button
          className={styles.backButton}
          onClick={() => setShowArchive(true)}
          aria-label="Archive"
          title="Archive"
        >
          &#128451;
        </button>

        {can('board:update') && (
          <button
            className={styles.backButton}
            onClick={() => setShowSettings(true)}
            aria-label="Board settings"
            title="Settings"
          >
            &#9881;
          </button>
        )}
      </div>

      <ArchivePanel
        boardId={board.id}
        role={board.role}
        open={showArchive}
        onClose={() => setShowArchive(false)}
      />

      {showSettings && (
        <BoardSettingsModal
          board={board}
          open={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
