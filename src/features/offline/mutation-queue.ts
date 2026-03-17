export type MutationType =
  | 'MOVE_CARD'
  | 'CREATE_CARD'
  | 'UPDATE_CARD'
  | 'DELETE_CARD'
  | 'CREATE_COLUMN'
  | 'UPDATE_COLUMN'
  | 'DELETE_COLUMN'
  | 'REORDER_COLUMN';

export type MutationStatus = 'pending' | 'processing' | 'failed';

export interface QueuedMutation {
  id: string;
  type: MutationType;
  payload: Record<string, unknown>;
  timestamp: number;
  status: MutationStatus;
}

const STORAGE_KEY = 'lanefly_mutation_queue';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getQueue(): QueuedMutation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isQueuedMutation);
  } catch {
    return [];
  }
}

function isQueuedMutation(item: unknown): item is QueuedMutation {
  if (typeof item !== 'object' || item === null) return false;
  return (
    'id' in item &&
    typeof item.id === 'string' &&
    'type' in item &&
    typeof item.type === 'string' &&
    'timestamp' in item &&
    typeof item.timestamp === 'number' &&
    'status' in item &&
    typeof item.status === 'string'
  );
}

function saveQueue(queue: QueuedMutation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function enqueue(type: MutationType, payload: Record<string, unknown>): QueuedMutation {
  const entry: QueuedMutation = {
    id: generateId(),
    type,
    payload,
    timestamp: Date.now(),
    status: 'pending',
  };
  const queue = getQueue();
  queue.push(entry);
  saveQueue(queue);
  return entry;
}

export function dequeue(id: string): void {
  const queue = getQueue().filter((m) => m.id !== id);
  saveQueue(queue);
}

export function updateStatus(id: string, status: MutationStatus): void {
  const queue = getQueue().map((m) =>
    m.id === id ? { ...m, status } : m,
  );
  saveQueue(queue);
}

export function clearQueue(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function queueIsEmpty(): boolean {
  return getQueue().length === 0;
}
