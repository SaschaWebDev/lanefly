import { useQuery } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import type { Lane } from '@/types/common';
import { getDemoLanes } from './demo-store';

async function fetchLanes(boardId: string): Promise<Lane[]> {
  if (isDemoMode) {
    return getDemoLanes(boardId);
  }

  const { data, error } = await supabase
    .from('lanes')
    .select('id, board_id, title, position, created_at, updated_at, archived_at')
    .eq('board_id', boardId)
    .is('archived_at', null)
    .order('position', { ascending: true });

  if (error) handleSupabaseError(error);
  return data;
}

export function useLanesQuery(boardId: string | undefined) {
  return useQuery({
    queryKey: ['lanes', boardId],
    queryFn: () => {
      if (!boardId) throw new Error('boardId is required');
      return fetchLanes(boardId);
    },
    enabled: !!boardId,
  });
}
