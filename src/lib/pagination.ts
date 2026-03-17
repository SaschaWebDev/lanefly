export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function encodeCursor(value: string | number): string {
  return btoa(String(value));
}

export function decodeCursor(cursor: string): string {
  return atob(cursor);
}
