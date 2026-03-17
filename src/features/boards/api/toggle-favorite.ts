import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { toggleDemoFavorite } from './demo-store';

interface ToggleFavoriteInput {
  boardId: string;
  userId: string;
  isFavorite: boolean;
}

async function toggleFavorite({
  boardId,
  userId,
  isFavorite,
}: ToggleFavoriteInput) {
  if (isDemoMode) {
    toggleDemoFavorite(boardId);
    return;
  }

  if (isFavorite) {
    const { error } = await supabase
      .from('board_favorites')
      .delete()
      .eq('board_id', boardId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('board_favorites')
      .insert({ board_id: boardId, user_id: userId });
    if (error) throw new Error(error.message);
  }
}

export function useToggleFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleFavorite,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['boards'] });
      void queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
    },
  });
}
