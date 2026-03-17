import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { useToast } from '@/components/ui/toast';

const DEBOUNCE_MS = 300;

export function useBoardRealtime(boardId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isDemoMode || !userId) return;

    function invalidateDebounced() {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ['columns', boardId] });
        void queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      }, DEBOUNCE_MS);
    }

    const channel = supabase
      .channel(`board-changes:${boardId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` },
        invalidateDebounced,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cards', filter: `board_id=eq.${boardId}` },
        invalidateDebounced,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'board_members', filter: `board_id=eq.${boardId}` },
        (payload) => {
          if (
            payload.eventType === 'DELETE' &&
            'user_id' in payload.old &&
            payload.old['user_id'] === userId
          ) {
            toast('You have been removed from this board', 'warning');
            void navigate({ to: '/' });
          }
          invalidateDebounced();
        },
      )
      .subscribe();

    return () => {
      clearTimeout(debounceRef.current);
      void supabase.removeChannel(channel);
    };
  }, [boardId, userId, queryClient, navigate, toast]);
}
