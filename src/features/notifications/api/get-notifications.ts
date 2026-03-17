import { useQuery } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import type { Notification } from '@/types/common';
import { getDemoNotifications } from './demo-store';

async function fetchNotifications(userId: string): Promise<Notification[]> {
  if (isDemoMode) {
    return getDemoNotifications();
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, type, message, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) handleSupabaseError(error);
  return data;
}

export function useNotificationsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => {
      if (!userId) throw new Error('userId is required');
      return fetchNotifications(userId);
    },
    enabled: !!userId,
  });
}
