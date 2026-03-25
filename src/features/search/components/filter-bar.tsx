import { useState, useCallback } from 'react';
import { useLabelsQuery } from '@/features/labels/api/get-labels';
import { useBoardMembersQuery } from '@/features/members/api/get-board-members';
import { Avatar } from '@/features/members/components/avatar';
import styles from './filter-bar.module.css';

export interface FilterState {
  labelIds: string[];
  assigneeId: string | null;
  dueDate: 'overdue' | 'this-week' | 'no-date' | null;
  status: 'active' | 'done' | null;
}

export const EMPTY_FILTERS: FilterState = {
  labelIds: [],
  assigneeId: null,
  dueDate: null,
  status: null,
};

export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.labelIds.length > 0 ||
    filters.assigneeId !== null ||
    filters.dueDate !== null ||
    filters.status !== null
  );
}

interface FilterBarProps {
  boardId: string;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  open: boolean;
}

export function FilterBar({ boardId, filters, onChange, open }: FilterBarProps) {
  const { data: labels } = useLabelsQuery(boardId);
  const { data: members } = useBoardMembersQuery(boardId);

  const toggleLabel = useCallback(
    (labelId: string) => {
      const next = filters.labelIds.includes(labelId)
        ? filters.labelIds.filter((id) => id !== labelId)
        : [...filters.labelIds, labelId];
      onChange({ ...filters, labelIds: next });
    },
    [filters, onChange],
  );

  const setAssignee = useCallback(
    (userId: string | null) => {
      onChange({ ...filters, assigneeId: filters.assigneeId === userId ? null : userId });
    },
    [filters, onChange],
  );

  const setDueDate = useCallback(
    (value: FilterState['dueDate']) => {
      onChange({ ...filters, dueDate: filters.dueDate === value ? null : value });
    },
    [filters, onChange],
  );

  const setStatus = useCallback(
    (value: FilterState['status']) => {
      onChange({ ...filters, status: filters.status === value ? null : value });
    },
    [filters, onChange],
  );

  if (!open) return null;

  return (
    <div className={styles.bar}>
      <div className={styles.group}>
        <span className={styles.groupLabel}>Labels</span>
        <div className={styles.chips}>
          {labels?.map((label) => (
            <button
              key={label.id}
              className={
                filters.labelIds.includes(label.id) ? styles.chipActive : styles.chip
              }
              onClick={() => toggleLabel(label.id)}
            >
              <span className={styles.colorDot} style={{ backgroundColor: label.color }} />
              {label.name}
            </button>
          ))}
          {!labels?.length && <span className={styles.empty}>No labels</span>}
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.groupLabel}>Assignee</span>
        <div className={styles.chips}>
          <button
            className={filters.assigneeId === 'unassigned' ? styles.chipActive : styles.chip}
            onClick={() => setAssignee('unassigned')}
          >
            <span className={styles.unassignedIcon}>{'\u2715'}</span>
            Unassigned
          </button>
          {members?.map((m) => (
            <button
              key={m.id}
              className={
                filters.assigneeId === m.user_id ? styles.chipActive : styles.chip
              }
              onClick={() => setAssignee(m.user_id)}
            >
              <Avatar name={m.display_name} imageUrl={m.avatar_url} size="sm" />
              {m.display_name ?? 'Unknown'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.groupLabel}>Due date</span>
        <div className={styles.chips}>
          <button
            className={filters.dueDate === 'overdue' ? styles.chipActive : styles.chip}
            onClick={() => setDueDate('overdue')}
          >
            Overdue
          </button>
          <button
            className={filters.dueDate === 'this-week' ? styles.chipActive : styles.chip}
            onClick={() => setDueDate('this-week')}
          >
            Due this week
          </button>
          <button
            className={filters.dueDate === 'no-date' ? styles.chipActive : styles.chip}
            onClick={() => setDueDate('no-date')}
          >
            No date
          </button>
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.groupLabel}>Status</span>
        <div className={styles.chips}>
          <button
            className={filters.status === 'active' ? styles.chipActive : styles.chip}
            onClick={() => setStatus('active')}
          >
            Active
          </button>
          <button
            className={filters.status === 'done' ? styles.chipActive : styles.chip}
            onClick={() => setStatus('done')}
          >
            Done
          </button>
        </div>
      </div>

      {hasActiveFilters(filters) && (
        <button
          className={styles.clearAll}
          onClick={() => onChange(EMPTY_FILTERS)}
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
