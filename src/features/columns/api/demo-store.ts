import type { Card, Column } from '@/types/common';
import type { ColumnWithCards } from '../types';

let nextColNum = 1;
let nextCardNum = 1;

function makeCard(
  columnId: string,
  boardId: string,
  title: string,
  position: number,
): Card {
  const id = `demo-card-${nextCardNum++}`;
  return {
    id,
    column_id: columnId,
    board_id: boardId,
    title,
    description: null,
    status: 'active',
    position,
    assignee_id: null,
    due_date: null,
    created_at: '2026-03-10T00:00:00Z',
    updated_at: '2026-03-10T00:00:00Z',
    archived_at: null,
    archived_with_column: false,
  };
}

const demoColumnStore: Map<string, ColumnWithCards[]> = new Map();

function seedBoard(boardId: string): ColumnWithCards[] {
  const cols: ColumnWithCards[] = [];

  const col1Id = `demo-col-${nextColNum++}`;
  const col2Id = `demo-col-${nextColNum++}`;
  const col3Id = `demo-col-${nextColNum++}`;

  const todoTitles = [
    'Set up project scaffolding',
    'Design database schema',
    'Create auth flow',
    'Write API documentation',
    'Set up CI/CD pipeline',
  ];
  const inProgressTitles = [
    'Build board view UI',
    'Implement drag and drop',
    'Add real-time sync',
    'Write unit tests',
    'Create onboarding flow',
    'Fix mobile layout',
    'Add dark mode support',
  ];
  const doneTitles = [
    'Project kickoff',
    'Tech stack decision',
    'Set up repository',
    'Initial wireframes',
    'Domain registration',
  ];

  cols.push({
    id: col1Id,
    board_id: boardId,
    title: 'To Do',
    position: 1024,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-10T00:00:00Z',
    archived_at: null,
    cards: todoTitles.map((t, i) => makeCard(col1Id, boardId, t, (i + 1) * 1024)),
  });

  cols.push({
    id: col2Id,
    board_id: boardId,
    title: 'In Progress',
    position: 2048,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-10T00:00:00Z',
    archived_at: null,
    cards: inProgressTitles.map((t, i) => makeCard(col2Id, boardId, t, (i + 1) * 1024)),
  });

  cols.push({
    id: col3Id,
    board_id: boardId,
    title: 'Done',
    position: 3072,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-10T00:00:00Z',
    archived_at: null,
    cards: doneTitles.map((t, i) => {
      const card = makeCard(col3Id, boardId, t, (i + 1) * 1024);
      card.status = 'done';
      return card;
    }),
  });

  demoColumnStore.set(boardId, cols);
  return cols;
}

export function getDemoColumns(boardId: string): ColumnWithCards[] {
  const existing = demoColumnStore.get(boardId);
  if (existing) return existing.filter((c) => !c.archived_at).map((c) => ({
    ...c,
    cards: c.cards.filter((card) => !card.archived_at),
  }));
  return seedBoard(boardId);
}

export function createDemoColumn(boardId: string, title: string, position: number): ColumnWithCards {
  const cols = demoColumnStore.get(boardId) ?? seedBoard(boardId);
  const col: ColumnWithCards = {
    id: `demo-col-${nextColNum++}`,
    board_id: boardId,
    title,
    position,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
    cards: [],
  };
  cols.push(col);
  return col;
}

export function updateDemoColumn(
  boardId: string,
  columnId: string,
  updates: { title?: string; position?: number; archived_at?: string | null },
): void {
  const cols = demoColumnStore.get(boardId);
  if (!cols) return;
  const col = cols.find((c) => c.id === columnId);
  if (!col) return;
  if (updates.title !== undefined) col.title = updates.title;
  if (updates.position !== undefined) col.position = updates.position;
  if (updates.archived_at !== undefined) {
    col.archived_at = updates.archived_at;
    const archivedAt = updates.archived_at;
    if (archivedAt) {
      col.cards.forEach((card) => {
        card.archived_at = archivedAt;
        card.archived_with_column = true;
      });
    }
  }
  col.updated_at = new Date().toISOString();
}

export function createDemoCard(
  boardId: string,
  columnId: string,
  title: string,
  position: number,
): Card {
  const cols = demoColumnStore.get(boardId) ?? seedBoard(boardId);
  const col = cols.find((c) => c.id === columnId);
  if (!col) throw new Error('Column not found');
  const card = makeCard(columnId, boardId, title, position);
  col.cards.push(card);
  return card;
}

export function updateDemoCard(
  boardId: string,
  cardId: string,
  updates: { title?: string; description?: string | null; status?: 'active' | 'done'; position?: number; column_id?: string; archived_at?: string | null },
): void {
  const cols = demoColumnStore.get(boardId);
  if (!cols) return;

  for (const col of cols) {
    const cardIndex = col.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) continue;

    const card = col.cards[cardIndex];
    if (!card) return;
    if (updates.title !== undefined) card.title = updates.title;
    if (updates.description !== undefined) card.description = updates.description;
    if (updates.status !== undefined) card.status = updates.status;
    if (updates.position !== undefined) card.position = updates.position;
    if (updates.archived_at !== undefined) card.archived_at = updates.archived_at;
    card.updated_at = new Date().toISOString();

    if (updates.column_id && updates.column_id !== col.id) {
      col.cards.splice(cardIndex, 1);
      const targetCol = cols.find((c) => c.id === updates.column_id);
      if (targetCol) {
        card.column_id = updates.column_id;
        targetCol.cards.push(card);
      }
    }
    return;
  }
}

export function deleteDemoCard(boardId: string, cardId: string): void {
  updateDemoCard(boardId, cardId, { archived_at: new Date().toISOString() });
}

export function permanentDeleteDemoColumn(boardId: string, columnId: string): void {
  const cols = demoColumnStore.get(boardId);
  if (!cols) return;
  const index = cols.findIndex((c) => c.id === columnId);
  if (index !== -1) cols.splice(index, 1);
}

export function permanentDeleteDemoCard(boardId: string, cardId: string): void {
  const cols = demoColumnStore.get(boardId);
  if (!cols) return;
  for (const col of cols) {
    const index = col.cards.findIndex((c) => c.id === cardId);
    if (index !== -1) {
      col.cards.splice(index, 1);
      return;
    }
  }
}

export function getDemoArchivedColumns(boardId: string): Column[] {
  const cols = demoColumnStore.get(boardId);
  if (!cols) return [];
  return cols
    .filter((c) => c.archived_at !== null)
    .map(({ cards: _cards, ...col }) => col);
}

export function getDemoArchivedCards(boardId: string): Card[] {
  const cols = demoColumnStore.get(boardId);
  if (!cols) return [];
  const archived: Card[] = [];
  for (const col of cols) {
    for (const card of col.cards) {
      if (card.archived_at !== null && !card.archived_with_column) {
        archived.push(card);
      }
    }
  }
  return archived;
}

export function restoreDemoColumn(boardId: string, columnId: string): void {
  const cols = demoColumnStore.get(boardId);
  if (!cols) return;
  const col = cols.find((c) => c.id === columnId);
  if (!col) return;
  col.archived_at = null;
  col.updated_at = new Date().toISOString();
  for (const card of col.cards) {
    if (card.archived_with_column) {
      card.archived_at = null;
      card.archived_with_column = false;
      card.updated_at = new Date().toISOString();
    }
  }
}
