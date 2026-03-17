import { useQuery } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';
import type { Label } from '@/types/common';
import { getDemoLabels } from './demo-store';

async function fetchLabels(boardId: string): Promise<Label[]> {
  if (isDemoMode) {
    return getDemoLabels(boardId);
  }

  const { data, error } = await supabase
    .from('labels')
    .select('id, board_id, name, color, created_at')
    .eq('board_id', boardId)
    .order('created_at', { ascending: true });

  if (error) handleSupabaseError(error);
  return data;
}

export function useLabelsQuery(boardId: string | undefined) {
  return useQuery({
    queryKey: ['labels', boardId],
    queryFn: () => {
      if (!boardId) throw new Error('boardId is required');
      return fetchLabels(boardId);
    },
    enabled: !!boardId,
  });
}
