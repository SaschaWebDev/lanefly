import clsx from 'clsx';
import type { BoardWithMembership } from '../types';
import styles from './board-card.module.css';

interface BoardCardProps {
  board: BoardWithMembership;
  onOpen: (boardId: string) => void;
  onToggleFavorite: (boardId: string, isFavorite: boolean) => void;
}

export function BoardCard({ board, onOpen, onToggleFavorite }: BoardCardProps) {
  const bgStyle = board.background
    ? { backgroundColor: board.background }
    : undefined;

  return (
    <div
      className={styles.card}
      style={bgStyle}
      onClick={() => onOpen(board.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(board.id);
      }}
    >
      <button
        className={clsx(
          styles.favoriteButton,
          board.is_favorite && styles.isFavorite,
        )}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(board.id, !!board.is_favorite);
        }}
        aria-label={board.is_favorite ? 'Unfavorite' : 'Favorite'}
      >
        {board.is_favorite ? '\u2605' : '\u2606'}
      </button>
      <span className={styles.title}>{board.title}</span>
    </div>
  );
}
