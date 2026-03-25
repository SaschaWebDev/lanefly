import { useCallback } from 'react';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import type { ColumnWithCards } from '@/features/columns/types';
import type { BoardRole } from '@/types/database';
import { SortableColumn } from '@/features/dnd/sortable-column';
import { AddColumn } from '@/features/columns/components/add-column';
import { usePermission } from '@/features/permissions/hooks/use-permission';
import { LaneHeader } from './lane-header';
import styles from './lane.module.css';

interface LaneProps {
  laneId: string;
  boardId: string;
  title: string;
  columns: ColumnWithCards[];
  role: BoardRole;
  dragListeners?: SyntheticListenerMap;
  onAddColumn: (title: string, laneId?: string) => void;
}

export function Lane({ laneId, boardId, title, columns, role, dragListeners, onAddColumn }: LaneProps) {
  const { can } = usePermission(role);
  const columnIds = columns.map((c) => c.id);

  const handleAddColumn = useCallback(
    (colTitle: string) => {
      onAddColumn(colTitle, laneId);
    },
    [laneId, onAddColumn],
  );

  return (
    <div data-lane-id={laneId} className={styles.lane}>
      <div className={styles.laneSidebar}>
        <LaneHeader
          laneId={laneId}
          boardId={boardId}
          title={title}
          role={role}
          dragListeners={dragListeners}
        />
      </div>
      <div className={styles.laneContent}>
        <div className={styles.laneColumnsWrapper}>
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            <div className={styles.laneColumnsContainer}>
              {columns.map((col) => (
                <SortableColumn
                  key={col.id}
                  column={col}
                  boardId={boardId}
                  role={role}
                  laneId={laneId}
                />
              ))}
              {can('column:create') && (
                <AddColumn onAdd={handleAddColumn} laneId={laneId} />
              )}
            </div>
          </SortableContext>
        </div>
      </div>
    </div>
  );
}
