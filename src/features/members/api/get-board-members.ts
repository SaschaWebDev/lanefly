import { useQuery } from '@tanstack/react-query';
import { isDemoMode, DEMO_USER_ID, DEMO_PROFILE } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import type { BoardRole } from '@/types/database';

export interface BoardMemberWithProfile {
  id: string;
  user_id: string;
  role: BoardRole;
  display_name: string | null;
  avatar_url: string | null;
}

async function fetchBoardMembers(boardId: string): Promise<BoardMemberWithProfile[]> {
  if (isDemoMode) {
    return [
      {
        id: 'demo-member-1',
        user_id: DEMO_USER_ID,
        role: 'admin',
        display_name: DEMO_PROFILE.display_name,
        avatar_url: DEMO_PROFILE.avatar_url,
      },
    ];
  }

  const { data, error } = await supabase
    .from('board_members')
    .select('id, user_id, role, profiles(display_name, avatar_url)')
    .eq('board_id', boardId);

  if (error) handleSupabaseError(error);

  return data.map((m) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role,
    display_name: m.profiles.display_name,
    avatar_url: m.profiles.avatar_url,
  }));
}

export function useBoardMembersQuery(boardId: string | undefined) {
  return useQuery({
    queryKey: ['board-members', boardId],
    queryFn: () => {
      if (!boardId) throw new Error('boardId is required');
      return fetchBoardMembers(boardId);
    },
    enabled: !!boardId,
  });
}
