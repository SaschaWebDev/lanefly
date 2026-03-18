import { useCallback, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { usePermission } from '@/features/permissions/hooks/use-permission';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useBoardQuery } from '../api/get-board';
import { useColumnsQuery } from '@/features/columns/api/get-columns';
import { useCreateColumnMutation } from '@/features/columns/api/create-column';
import { useUpdateBoardMutation } from '../api/update-board';
import { useLanesQuery } from '@/features/lanes/api/get-lanes';
import { useCreateLaneMutation } from '@/features/lanes/api/create-lane';
import { BoardHeader } from './board-header';
import { BoardDndContext } from '@/features/dnd/dnd-context';
import { SortableColumn } from '@/features/dnd/sortable-column';
import { SortableLane } from '@/features/dnd/sortable-lane';
import { Lane } from '@/features/lanes/components/lane';
import { AddLane } from '@/features/lanes/components/add-lane';
import { AddColumn } from '@/features/columns/components/add-column';
import { MobileColumnNav } from './mobile-column-nav';
import { useMediaQuery } from '@/hooks/use-media-query';
import { RealtimeProvider } from '@/features/realtime/realtime-provider';
import { ConnectionIndicator } from '@/features/realtime/connection-indicator';
import { useBoardRealtime } from '@/features/realtime/use-board-realtime';
import type { ColumnWithCards } from '@/features/columns/types';
import type { LaneWithColumns } from '@/features/lanes/types';
import type { Lane as LaneType } from '@/types/common';
import styles from './board-view.module.css';

interface BoardViewProps {
  boardId: string;
}

function groupColumnsIntoLanes(lanes: LaneType[], columns: ColumnWithCards[]): LaneWithColumns[] {
  const laneMap = new Map<string, ColumnWithCards[]>();
  for (const lane of lanes) {
    laneMap.set(lane.id, []);
  }
  for (const col of columns) {
    if (col.lane_id && laneMap.has(col.lane_id)) {
      laneMap.get(col.lane_id)!.push(col);
    }
  }
  return lanes.map((lane) => ({
    ...lane,
    columns: (laneMap.get(lane.id) ?? []).sort((a, b) => a.position - b.position),
  }));
}

function BoardViewInner({ boardId }: BoardViewProps) {
  const { user } = useAuth();
  const { data: board, isLoading: boardLoading } = useBoardQuery(boardId);
  const { data: columns, isLoading: columnsLoading } = useColumnsQuery(boardId);
  const { data: lanes, isLoading: lanesLoading } = useLanesQuery(boardId);
  const createColumn = useCreateColumnMutation();
  const createLane = useCreateLaneMutation();
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
    (title: string, laneId?: string) => {
      const relevantCols = laneId
        ? columns?.filter((c) => c.lane_id === laneId)
        : columns;
      const lastPos = relevantCols?.length
        ? Math.max(...relevantCols.map((c) => c.position))
        : 0;
      createColumn.mutate({
        boardId,
        title,
        position: lastPos + 1024,
        laneId: laneId ?? null,
      });
    },
    [boardId, columns, createColumn],
  );

  const handleAddLane = useCallback(
    (title: string) => {
      const lastPos = lanes?.length
        ? Math.max(...lanes.map((l) => l.position))
        : 0;
      createLane.mutate({
        boardId,
        title,
        position: lastPos + 1024,
      });
    },
    [boardId, lanes, createLane],
  );

  if (boardLoading || columnsLoading || lanesLoading) {
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

  const hasLanes = lanes && lanes.length > 0;

  if (isMobile && columns) {
    return (
      <div className={styles.board}>
        <BoardHeader board={board} onUpdateTitle={handleUpdateTitle} />
        <ConnectionIndicator />
        <MobileColumnNav
          boardId={boardId}
          columns={columns}
          lanes={lanes ?? []}
          canEdit={can('card:create')}
          canCreateLane={can('column:create')}
          onAddLane={handleAddLane}
        />
      </div>
    );
  }

  // Multi-lane layout
  const [dragColumnOverride, setDragColumnOverride] = useState<{
    columnId: string;
    targetLaneId: string;
  } | null>(null);

  if (hasLanes) {
    const effectiveColumns = dragColumnOverride
      ? (columns ?? []).map((col) =>
          col.id === dragColumnOverride.columnId
            ? { ...col, lane_id: dragColumnOverride.targetLaneId }
            : col
        )
      : (columns ?? []);
    const lanesWithColumns = groupColumnsIntoLanes(lanes, effectiveColumns);

    return (
      <div className={styles.board}>
        <BoardHeader board={board} onUpdateTitle={handleUpdateTitle} />
        <div className={styles.lanesWrapper}>
          <BoardDndContext boardId={boardId} columns={columns ?? []} lanes={lanes} onColumnLaneChange={setDragColumnOverride}>
            {lanesWithColumns.map((lane) => (
              <SortableLane key={lane.id} lane={lane}>
                {({ listeners }) => (
                  <Lane
                    laneId={lane.id}
                    boardId={boardId}
                    title={lane.title}
                    columns={lane.columns}
                    role={board.role}
                    dragListeners={listeners}
                    onAddColumn={handleAddColumn}
                  />
                )}
              </SortableLane>
            ))}
          </BoardDndContext>
          {can('column:create') && (
            <AddLane onAdd={handleAddLane} />
          )}
        </div>
      </div>
    );
  }

  // Flat layout (no lanes)
  return (
    <div className={styles.board}>
      <BoardHeader board={board} onUpdateTitle={handleUpdateTitle} />
      <div className={styles.boardContent}>
        {can('column:create') && (
          <AddLane onAdd={handleAddLane} />
        )}
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
