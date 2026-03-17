import type { BoardRole, Permission } from './types';

export const ROLE_PERMISSIONS: Record<BoardRole, ReadonlySet<Permission>> = {
  admin: new Set<Permission>([
    'board:update',
    'board:delete',
    'board:manage_members',
    'column:create',
    'column:update',
    'column:delete',
    'column:reorder',
    'card:create',
    'card:update',
    'card:delete',
    'card:move',
    'card:assign',
    'label:manage',
    'attachment:upload',
    'attachment:delete',
  ]),
  editor: new Set<Permission>([
    'column:create',
    'column:update',
    'column:reorder',
    'card:create',
    'card:update',
    'card:move',
    'card:assign',
    'label:manage',
    'attachment:upload',
    'attachment:delete',
  ]),
  viewer: new Set<Permission>([]),
};
