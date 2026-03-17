import { useQuery } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import type { ActivityLog } from '@/types/common';
import { getDemoActivity } from './demo-store';

async function fetchActivity(cardId: string): Promise<ActivityLog[]> {
  if (isDemoMode) {
    return getDemoActivity(cardId);
  }

  const { data, error } = await supabase
    .from('activity_log')
    .select('id, board_id, card_id, user_id, action, metadata, created_at')
    .eq('card_id', cardId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) handleSupabaseError(error);
  return data;
}

export function useActivityQuery(cardId: string | undefined) {
  return useQuery({
    queryKey: ['activity', cardId],
    queryFn: () => {
      if (!cardId) throw new Error('cardId is required');
      return fetchActivity(cardId);
    },
    enabled: !!cardId,
  });
}
