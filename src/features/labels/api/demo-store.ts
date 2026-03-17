import type { Label } from '@/types/common';

const demoLabelStore: Map<string, Label[]> = new Map();
const demoCardLabels: Map<string, Set<string>> = new Map();

let nextLabelNum = 1;

const DEFAULT_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

export function getDemoLabels(boardId: string): Label[] {
  if (!demoLabelStore.has(boardId)) {
    demoLabelStore.set(boardId, [
      { id: 'demo-label-1', board_id: boardId, name: 'Bug', color: '#ef4444', created_at: '2026-03-01T00:00:00Z' },
      { id: 'demo-label-2', board_id: boardId, name: 'Feature', color: '#3b82f6', created_at: '2026-03-01T00:00:00Z' },
      { id: 'demo-label-3', board_id: boardId, name: 'Urgent', color: '#f59e0b', created_at: '2026-03-01T00:00:00Z' },
    ]);
    nextLabelNum = 4;
  }
  return demoLabelStore.get(boardId) ?? [];
}

export function createDemoLabel(boardId: string, name: string, color?: string): Label {
  const labels = getDemoLabels(boardId);
  const defaultColor = DEFAULT_COLORS[labels.length % DEFAULT_COLORS.length] ?? '#64748b';
  const label: Label = {
    id: `demo-label-${nextLabelNum++}`,
    board_id: boardId,
    name,
    color: color ?? defaultColor,
    created_at: new Date().toISOString(),
  };
  labels.push(label);
  return label;
}

export function getDemoCardLabelIds(cardId: string): string[] {
  return [...(demoCardLabels.get(cardId) ?? [])];
}

export function toggleDemoCardLabel(cardId: string, labelId: string): boolean {
  if (!demoCardLabels.has(cardId)) {
    demoCardLabels.set(cardId, new Set());
  }
  const set = demoCardLabels.get(cardId);
  if (!set) return false;
  if (set.has(labelId)) {
    set.delete(labelId);
    return false;
  }
  set.add(labelId);
  return true;
}
