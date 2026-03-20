import { useCallback, useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Spinner } from '@/components/ui/spinner';
import { ShortcutsOverlay } from '@/components/ui/shortcuts-overlay';
import { usePermission } from '@/features/permissions/hooks/use-permission';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useBoardQuery } from '../api/get-board';
import { useColumnsQuery } from '@/features/columns/api/get-columns';
import { useCreateColumnMutation } from '@/features/columns/api/create-column';
import { useUpdateBoardMutation } from '../api/update-board';
import { useLanesQuery } from '@/features/lanes/api/get-lanes';
import { useCreateLaneMutation } from '@/features/lanes/api/create-lane';
import { useCreateCardMutation } from '@/features/cards/api/create-card';
import { BoardHeader } from './board-header';
import { BoardDndContext } from '@/features/dnd/dnd-context';
import { SortableColumn } from '@/features/dnd/sortable-column';
import { SortableLane } from '@/features/dnd/sortable-lane';
import { Lane } from '@/features/lanes/components/lane';
import { AddLane } from '@/features/lanes/components/add-lane';
import { AddColumn } from '@/features/columns/components/add-column';
import { MobileColumnNav } from './mobile-column-nav';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { RealtimeProvider } from '@/features/realtime/realtime-provider';
import { ConnectionIndicator } from '@/features/realtime/connection-indicator';
import { useBoardRealtime } from '@/features/realtime/use-board-realtime';
import { FilterBar, type FilterState, EMPTY_FILTERS, hasActiveFilters } from '@/features/search/components/filter-bar';
import { CardSelectionProvider } from '@/features/cards/components/card-selection-context';
import { BulkActionBar } from '@/features/cards/components/bulk-action-bar';
import type { ColumnWithCards } from '@/features/columns/types';
import type { LaneWithColumns } from '@/features/lanes/types';
import type { Lane as LaneType, Card } from '@/types/common';
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

function applyFilters(cards: Card[], filters: FilterState): Card[] {
  if (!hasActiveFilters(filters)) return cards;

  return cards.filter((card) => {
    if (filters.status && card.status !== filters.status) return false;

    if (filters.assigneeId) {
      if (filters.assigneeId === 'unassigned' && card.assignee_id !== null) return false;
      if (filters.assigneeId !== 'unassigned' && card.assignee_id !== filters.assigneeId) return false;
    }

    if (filters.dueDate) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (filters.dueDate === 'overdue') {
        if (!card.due_date || new Date(card.due_date) >= now) return false;
      } else if (filters.dueDate === 'this-week') {
        if (!card.due_date) return false;
        const due = new Date(card.due_date);
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + 7);
        if (due < now || due > weekEnd) return false;
      } else if (filters.dueDate === 'no-date') {
        if (card.due_date) return false;
      }
    }

    // Label filtering is done here — but card objects from columns query
    // don't carry labels. We skip label filter if no label data is available.
    // A full implementation would need a join or separate query.
    return true;
  });
}

function filterColumns(columns: ColumnWithCards[], filters: FilterState): ColumnWithCards[] {
  if (!hasActiveFilters(filters)) return columns;
  return columns.map((col) => ({
    ...col,
    cards: applyFilters(col.cards, filters),
  }));
}

function BoardViewInner({ boardId }: BoardViewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: board, isLoading: boardLoading } = useBoardQuery(boardId);
  const { data: columns, isLoading: columnsLoading } = useColumnsQuery(boardId);
  const { data: lanes, isLoading: lanesLoading } = useLanesQuery(boardId);
  const createColumn = useCreateColumnMutation();
  const createLane = useCreateLaneMutation();
  const createCard = useCreateCardMutation();
  const updateBoard = useUpdateBoardMutation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [dragColumnOverride, setDragColumnOverride] = useState<{
    columnId: string;
    targetLaneId: string;
  } | null>(null);

  useBoardRealtime(boardId, user?.id);

  const { can } = usePermission(board?.role);

  // Keyboard shortcuts
  useKeyboardShortcuts(
    useMemo(
      () => [
        {
          key: '?',
          handler: () => setShowShortcuts((v) => !v),
        },
        {
          key: '/',
          handler: () => {
            const input = document.querySelector<HTMLInputElement>('[aria-label="Search cards"]');
            input?.focus();
          },
        },
        {
          key: 'b',
          handler: () => void navigate({ to: '/' }),
        },
        {
          key: 'n',
          handler: () => {
            if (!can('card:create') || !columns?.length) return;
            const firstCol = columns[0];
            const lastPos = firstCol.cards.length
              ? Math.max(...firstCol.cards.map((c) => c.position))
              : 0;
            const title = prompt('Card title:');
            if (title?.trim()) {
              createCard.mutate({
                boardId,
                columnId: firstCol.id,
                title: title.trim(),
                position: lastPos + 1024,
              });
            }
          },
        },
        {
          key: 'f',
          handler: () => setShowFilters((v) => !v),
        },
      ],
      [navigate, can, columns, boardId, createCard],
    ),
  );

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

  const filteredColumns = filterColumns(columns ?? [], filters);
  const hasLanes = lanes && lanes.length > 0;

  if (isMobile && columns) {
    return (
      <div className={styles.board}>
        <BoardHeader
          board={board}
          onUpdateTitle={handleUpdateTitle}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((v) => !v)}
          hasActiveFilters={hasActiveFilters(filters)}
        />
        <FilterBar boardId={boardId} filters={filters} onChange={setFilters} open={showFilters} />
        <ConnectionIndicator />
        <MobileColumnNav
          boardId={boardId}
          columns={filteredColumns}
          lanes={lanes ?? []}
          canEdit={can('card:create')}
          canCreateLane={can('column:create')}
          onAddLane={handleAddLane}
        />
        <ShortcutsOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      </div>
    );
  }

  if (hasLanes) {
    const effectiveColumns = dragColumnOverride
      ? filteredColumns.map((col) =>
          col.id === dragColumnOverride.columnId
            ? { ...col, lane_id: dragColumnOverride.targetLaneId }
            : col
        )
      : filteredColumns;
    const lanesWithColumns = groupColumnsIntoLanes(lanes, effectiveColumns);

    return (
      <CardSelectionProvider>
        <div className={styles.board}>
          <BoardHeader
            board={board}
            onUpdateTitle={handleUpdateTitle}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((v) => !v)}
            hasActiveFilters={hasActiveFilters(filters)}
          />
          <FilterBar boardId={boardId} filters={filters} onChange={setFilters} open={showFilters} />
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
          <BulkActionBar boardId={boardId} />
          <ShortcutsOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />
        </div>
      </CardSelectionProvider>
    );
  }

  // Flat layout (no lanes)
  return (
    <CardSelectionProvider>
      <div className={styles.board}>
        <BoardHeader
          board={board}
          onUpdateTitle={handleUpdateTitle}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((v) => !v)}
          hasActiveFilters={hasActiveFilters(filters)}
        />
        <FilterBar boardId={boardId} filters={filters} onChange={setFilters} open={showFilters} />
        <div className={styles.boardContent}>
          <div className={styles.columnsWrapper}>
            <BoardDndContext boardId={boardId} columns={columns ?? []}>
              <div className={styles.columnsContainer}>
                {filteredColumns?.map((col) => (
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
          {can('column:create') && (
            <div className={styles.addLaneFlat}>
              <AddLane onAdd={handleAddLane} />
            </div>
          )}
        </div>
        <BulkActionBar boardId={boardId} />
        <ShortcutsOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      </div>
    </CardSelectionProvider>
  );
}

export function BoardView({ boardId }: BoardViewProps) {
  return (
    <RealtimeProvider boardId={boardId}>
      <BoardViewInner boardId={boardId} />
    </RealtimeProvider>
  );
}
