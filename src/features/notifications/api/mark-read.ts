import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import { markDemoNotificationRead } from './demo-store';

interface MarkReadInput {
  notificationId: string;
  userId: string;
}

async function markRead({ notificationId }: MarkReadInput) {
  if (isDemoMode) {
    markDemoNotificationRead(notificationId);
    return;
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) handleSupabaseError(error);
}

export function useMarkReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markRead,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['notifications', variables.userId] });
    },
  });
}
