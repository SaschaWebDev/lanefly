import type { Card } from '@/types/common';

export type CardSummary = Pick<
  Card,
  'id' | 'column_id' | 'board_id' | 'title' | 'status' | 'position' | 'assignee_id' | 'due_date'
>;

export interface CardDetail extends Card {
  labels: Array<{ id: string; name: string; color: string }>;
  checklist_count: number;
  checklist_done_count: number;
  attachment_count: number;
}
