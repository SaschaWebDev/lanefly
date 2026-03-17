import type { Column, Card } from '@/types/common';

export type CardSortAction = 'name-asc' | 'created-newest' | 'created-oldest';

export interface ColumnWithCards extends Column {
  cards: Card[];
}
