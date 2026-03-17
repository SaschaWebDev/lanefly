import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useBoardsQuery } from '../api/get-boards';
import { useToggleFavoriteMutation } from '../api/toggle-favorite';
import { BoardCard } from './board-card';
import { CreateBoardModal } from './create-board-modal';
import styles from './board-list.module.css';

export function BoardList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const { data: boards, isLoading } = useBoardsQuery(user?.id);
  const toggleFavorite = useToggleFavoriteMutation();

  if (isLoading) {
    return (
      <div className={styles.emptyState}>
        <Spinner size="lg" />
      </div>
    );
  }

  const favoriteBoards = boards?.filter((b) => b.is_favorite) ?? [];
  const myBoards =
    boards?.filter((b) => b.owner_id === user?.id && !b.is_favorite) ?? [];
  const sharedBoards =
    boards?.filter((b) => b.owner_id !== user?.id && !b.is_favorite) ?? [];

  function handleOpen(boardId: string) {
    void navigate({ to: '/boards/$boardId', params: { boardId } });
  }

  function handleToggleFavorite(boardId: string, isFavorite: boolean) {
    if (!user) return;
    toggleFavorite.mutate({ boardId, userId: user.id, isFavorite });
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Boards</h1>
          <Button onClick={() => setShowCreate(true)}>Create Board</Button>
        </div>

        {!boards?.length ? (
          <div className={styles.emptyState}>
            <p>No boards yet. Create one to get started.</p>
            <Button onClick={() => setShowCreate(true)}>
              Create your first board
            </Button>
          </div>
        ) : (
          <>
            {favoriteBoards.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Favorites</h2>
                <div className={styles.grid}>
                  {favoriteBoards.map((board) => (
                    <BoardCard
                      key={board.id}
                      board={board}
                      onOpen={handleOpen}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </section>
            )}

            {myBoards.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>My Boards</h2>
                <div className={styles.grid}>
                  {myBoards.map((board) => (
                    <BoardCard
                      key={board.id}
                      board={board}
                      onOpen={handleOpen}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </section>
            )}

            {sharedBoards.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Shared with me</h2>
                <div className={styles.grid}>
                  {sharedBoards.map((board) => (
                    <BoardCard
                      key={board.id}
                      board={board}
                      onOpen={handleOpen}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {user && (
          <CreateBoardModal
            open={showCreate}
            onClose={() => setShowCreate(false)}
            userId={user.id}
          />
        )}
      </div>
    </>
  );
}
