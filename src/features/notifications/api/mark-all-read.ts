import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { markAllDemoNotificationsRead } from './demo-store';

interface MarkAllReadInput {
  userId: string;
}

async function markAllRead({ userId }: MarkAllReadInput) {
  if (isDemoMode) {
    markAllDemoNotificationsRead();
    return;
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) handleSupabaseError(error);
}

export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllRead,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['notifications', variables.userId] });
    },
  });
}
