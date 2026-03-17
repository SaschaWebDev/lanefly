import type { Board, BoardMember } from '@/types/common';
import type { BoardRole } from '@/types/database';

export interface BoardWithMembership extends Board {
  board_members: Pick<BoardMember, 'role'>[];
  is_favorite?: boolean;
}

export interface BoardWithRole extends Board {
  role: BoardRole;
  is_favorite: boolean;
}
