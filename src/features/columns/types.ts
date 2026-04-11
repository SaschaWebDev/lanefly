import type { Column, Card } from '@/types/common';

export type CardSortAction = 'name-asc' | 'created-newest' | 'created-oldest';

export type CardLabel = { id: string; name: string; color: string };
export type CardWithLabels = Card & { labels: CardLabel[] };

export interface ColumnWithCards extends Column {
  cards: CardWithLabels[];
}
