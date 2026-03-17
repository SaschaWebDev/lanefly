import { useCallback } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { usePermission } from '@/features/permissions/hooks/use-permission';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useBoardQuery } from '../api/get-board';
import { useColumnsQuery } from '@/features/columns/api/get-columns';
import { useCreateColumnMutation } from '@/features/columns/api/create-column';
import { useUpdateBoardMutation } from '../api/update-board';
import { BoardHeader } from './board-header';
import { BoardDndContext } from '@/features/dnd/dnd-context';
import { SortableColumn } from '@/features/dnd/sortable-column';
import { AddColumn } from '@/features/columns/components/add-column';
import { MobileColumnNav } from './mobile-column-nav';
import { useMediaQuery } from '@/hooks/use-media-query';
import { RealtimeProvider } from '@/features/realtime/realtime-provider';
import { ConnectionIndicator } from '@/features/realtime/connection-indicator';
import { useBoardRealtime } from '@/features/realtime/use-board-realtime';
import styles from './board-view.module.css';

interface BoardViewProps {
  boardId: string;
}

function BoardViewInner({ boardId }: BoardViewProps) {
  const { user } = useAuth();
  const { data: board, isLoading: boardLoading } = useBoardQuery(boardId);
  const { data: columns, isLoading: columnsLoading } = useColumnsQuery(boardId);
  const createColumn = useCreateColumnMutation();
  const updateBoard = useUpdateBoardMutation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  useBoardRealtime(boardId, user?.id);

  const { can } = usePermission(board?.role);

  const handleUpdateTitle = useCallback(
    (title: string) => {
      updateBoard.mutate({ boardId, title });
    },
    [boardId, updateBoard],
  );

  const handleAddColumn = useCallback(
    (title: string) => {
      const lastPos = columns?.length
        ? Math.max(...columns.map((c) => c.position))
        : 0;
      createColumn.mutate({
        boardId,
        title,
        position: lastPos + 1024,
      });
    },
    [boardId, columns, createColumn],
  );

  if (boardLoading || columnsLoading) {
    return (
      <div className={styles.board} style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className={styles.board} style={{ alignItems: 'center', justifyContent: 'center', display: 'flex', color: 'var(--color-text-secondary)' }}>
        Board not found
      </div>
    );
  }

  if (isMobile && columns) {
    return (
      <div className={styles.board}>
        <BoardHeader board={board} onUpdateTitle={handleUpdateTitle} />
        <ConnectionIndicator />
        <MobileColumnNav
          boardId={boardId}
          columns={columns}
          canEdit={can('card:create')}
        />
      </div>
    );
  }

  return (
    <div className={styles.board}>
      <BoardHeader board={board} onUpdateTitle={handleUpdateTitle} />
      <div className={styles.columnsWrapper}>
        <BoardDndContext boardId={boardId} columns={columns ?? []}>
          <div className={styles.columnsContainer}>
            {columns?.map((col) => (
              <SortableColumn
                key={col.id}
                column={col}
                boardId={boardId}
                role={board.role}
              />
            ))}
            {can('column:create') && (
              <AddColumn onAdd={handleAddColumn} />
            )}
          </div>
        </BoardDndContext>
      </div>
    </div>
  );
}

export function BoardView({ boardId }: BoardViewProps) {
  return (
    <RealtimeProvider boardId={boardId}>
      <BoardViewInner boardId={boardId} />
    </RealtimeProvider>
  );
}
