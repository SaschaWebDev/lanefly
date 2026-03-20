import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import { handleSupabaseError } from '@/lib/api-client';

export interface Comment {
  id: string;
  card_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  display_name: string | null;
  avatar_url: string | null;
}

async function fetchComments(cardId: string): Promise<Comment[]> {
  if (isDemoMode) return [];

  const { data, error } = await supabase
    .from('activity_log')
    .select('id, card_id, user_id, action, metadata, created_at, profiles:user_id(display_name, avatar_url)')
    .eq('card_id', cardId)
    .eq('action', 'comment')
    .order('created_at', { ascending: true });

  if (error) handleSupabaseError(error);

  return data.map((entry) => ({
    id: entry.id,
    card_id: entry.card_id ?? '',
    user_id: entry.user_id,
    content: (entry.metadata as { content?: string })?.content ?? '',
    created_at: entry.created_at,
    updated_at: entry.created_at,
    display_name: entry.profiles?.display_name ?? null,
    avatar_url: entry.profiles?.avatar_url ?? null,
  }));
}

export function useCommentsQuery(cardId: string | undefined) {
  return useQuery({
    queryKey: ['comments', cardId],
    queryFn: () => {
      if (!cardId) throw new Error('cardId required');
      return fetchComments(cardId);
    },
    enabled: !!cardId,
  });
}

interface AddCommentInput {
  cardId: string;
  boardId: string;
  userId: string;
  content: string;
}

async function addComment({ cardId, boardId, userId, content }: AddCommentInput) {
  if (isDemoMode) return;

  const { error } = await supabase
    .from('activity_log')
    .insert({
      card_id: cardId,
      board_id: boardId,
      user_id: userId,
      action: 'comment',
      metadata: { content },
    });

  if (error) handleSupabaseError(error);
}

export function useAddCommentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addComment,
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ['comments', v.cardId] });
      void qc.invalidateQueries({ queryKey: ['activity', v.cardId] });
    },
  });
}

interface DeleteCommentInput {
  commentId: string;
  cardId: string;
}

async function deleteComment({ commentId }: DeleteCommentInput) {
  if (isDemoMode) return;

  const { error } = await supabase
    .from('activity_log')
    .delete()
    .eq('id', commentId);

  if (error) handleSupabaseError(error);
}

export function useDeleteCommentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ['comments', v.cardId] });
    },
  });
}
