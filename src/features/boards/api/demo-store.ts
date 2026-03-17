import { DEMO_USER_ID } from '@/config/demo';
import type { BoardWithMembership, BoardWithRole } from '../types';

let nextBoardNum = 4;

const demoBoardStore: BoardWithMembership[] = [
  {
    id: 'demo-board-1',
    title: 'Product Roadmap',
    background: '#3b82f6',
    owner_id: DEMO_USER_ID,
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-03-10T00:00:00Z',
    archived_at: null,
    board_members: [{ role: 'admin' }],
    is_favorite: true,
  },
  {
    id: 'demo-board-2',
    title: 'Sprint 12 - March',
    background: '#8b5cf6',
    owner_id: DEMO_USER_ID,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-14T00:00:00Z',
    archived_at: null,
    board_members: [{ role: 'admin' }],
    is_favorite: false,
  },
  {
    id: 'demo-board-3',
    title: 'Design System',
    background: '#22c55e',
    owner_id: 'other-user',
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-03-12T00:00:00Z',
    archived_at: null,
    board_members: [{ role: 'editor' }],
    is_favorite: false,
  },
];

export function getDemoBoards(): BoardWithMembership[] {
  return [...demoBoardStore];
}

export function createDemoBoard(
  title: string,
  background: string | null,
): BoardWithMembership {
  const board: BoardWithMembership = {
    id: `demo-board-${nextBoardNum++}`,
    title,
    background,
    owner_id: DEMO_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
    board_members: [{ role: 'admin' }],
    is_favorite: false,
  };
  demoBoardStore.unshift(board);
  return board;
}

export function getDemoBoard(boardId: string): BoardWithRole | null {
  const board = demoBoardStore.find((b) => b.id === boardId);
  if (!board) return null;
  const member = board.board_members[0];
  if (!member) return null;
  return {
    id: board.id,
    title: board.title,
    background: board.background,
    owner_id: board.owner_id,
    created_at: board.created_at,
    updated_at: board.updated_at,
    archived_at: board.archived_at,
    role: member.role,
    is_favorite: board.is_favorite ?? false,
  };
}

export function toggleDemoFavorite(boardId: string): void {
  const board = demoBoardStore.find((b) => b.id === boardId);
  if (board) {
    board.is_favorite = !board.is_favorite;
  }
}

export function updateDemoBoard(
  boardId: string,
  updates: { title?: string; background?: string | null },
): void {
  const board = demoBoardStore.find((b) => b.id === boardId);
  if (!board) return;
  if (updates.title !== undefined) board.title = updates.title;
  if (updates.background !== undefined) board.background = updates.background;
  board.updated_at = new Date().toISOString();
}
