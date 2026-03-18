import type { BoardRole } from '@/types/database';

export type Permission =
  | 'board:update'
  | 'board:delete'
  | 'board:manage_members'
  | 'lane:create'
  | 'lane:update'
  | 'lane:delete'
  | 'column:create'
  | 'column:update'
  | 'column:delete'
  | 'column:reorder'
  | 'card:create'
  | 'card:update'
  | 'card:delete'
  | 'card:move'
  | 'card:assign'
  | 'label:manage'
  | 'attachment:upload'
  | 'attachment:delete';

export type { BoardRole };
