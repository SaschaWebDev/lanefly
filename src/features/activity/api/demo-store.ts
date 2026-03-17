import type { ActivityLog } from '@/types/common';
import { DEMO_USER_ID } from '@/config/demo';

const demoActivityStore: Map<string, ActivityLog[]> = new Map();
let nextActivityNum = 1;

export function getDemoActivity(cardId: string): ActivityLog[] {
  return demoActivityStore.get(cardId) ?? [];
}

export function addDemoActivity(
  boardId: string,
  cardId: string,
  action: string,
): ActivityLog {
  const entry: ActivityLog = {
    id: `demo-activity-${nextActivityNum++}`,
    board_id: boardId,
    card_id: cardId,
    user_id: DEMO_USER_ID,
    action,
    metadata: null,
    created_at: new Date().toISOString(),
  };

  const existing = demoActivityStore.get(cardId) ?? [];
  existing.unshift(entry);
  demoActivityStore.set(cardId, existing);
  return entry;
}
