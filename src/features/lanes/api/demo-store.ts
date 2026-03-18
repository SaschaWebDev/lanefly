import type { Lane } from '@/types/common';

let nextLaneNum = 1;

const demoLaneStore: Map<string, Lane[]> = new Map();

export function getDemoLanes(boardId: string): Lane[] {
  const existing = demoLaneStore.get(boardId);
  if (!existing) return [];
  return existing
    .filter((l) => !l.archived_at)
    .sort((a, b) => a.position - b.position);
}

export function getAllDemoLanes(boardId: string): Lane[] {
  return demoLaneStore.get(boardId) ?? [];
}

export function createDemoLane(boardId: string, title: string, position: number): Lane {
  const lanes = demoLaneStore.get(boardId) ?? [];
  if (!demoLaneStore.has(boardId)) demoLaneStore.set(boardId, lanes);

  const lane: Lane = {
    id: `demo-lane-${nextLaneNum++}`,
    board_id: boardId,
    title,
    position,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
  };
  lanes.push(lane);
  return lane;
}

export function updateDemoLane(
  boardId: string,
  laneId: string,
  updates: { title?: string; position?: number; archived_at?: string | null },
): void {
  const lanes = demoLaneStore.get(boardId);
  if (!lanes) return;
  const lane = lanes.find((l) => l.id === laneId);
  if (!lane) return;
  if (updates.title !== undefined) lane.title = updates.title;
  if (updates.position !== undefined) lane.position = updates.position;
  if (updates.archived_at !== undefined) lane.archived_at = updates.archived_at;
  lane.updated_at = new Date().toISOString();
}

export function permanentDeleteDemoLane(boardId: string, laneId: string): void {
  const lanes = demoLaneStore.get(boardId);
  if (!lanes) return;
  const index = lanes.findIndex((l) => l.id === laneId);
  if (index !== -1) lanes.splice(index, 1);
}

export function getDemoArchivedLanes(boardId: string): Lane[] {
  const lanes = demoLaneStore.get(boardId);
  if (!lanes) return [];
  return lanes.filter((l) => l.archived_at !== null);
}

export function restoreDemoLane(boardId: string, laneId: string): void {
  const lanes = demoLaneStore.get(boardId);
  if (!lanes) return;
  const lane = lanes.find((l) => l.id === laneId);
  if (!lane) return;
  lane.archived_at = null;
  lane.updated_at = new Date().toISOString();
}
