import type { Lane } from '@/types/common';
import type { ColumnWithCards } from '@/features/columns/types';

export interface LaneWithColumns extends Lane {
  columns: ColumnWithCards[];
}
