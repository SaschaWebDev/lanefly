import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/features/members/components/avatar';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCommentsQuery, useAddCommentMutation, useDeleteCommentMutation } from '../api/comments';
import styles from './comment-feed.module.css';

interface CommentFeedProps {
  cardId: string;
  boardId: string;
  canComment: boolean;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function CommentFeed({ cardId, boardId, canComment }: CommentFeedProps) {
  const { user } = useAuth();
  const { data: comments } = useCommentsQuery(cardId);
  const addComment = useAddCommentMutation();
  const deleteComment = useDeleteCommentMutation();
  const [text, setText] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || !user) return;
      addComment.mutate({ cardId, boardId, userId: user.id, content: trimmed });
      setText('');
    },
    [text, user, cardId, boardId, addComment],
  );

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>Comments</h3>

      {canComment && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            autoResize
          />
          {text.trim() && (
            <div className={styles.formActions}>
              <Button size="sm" type="submit" loading={addComment.isPending}>
                Comment
              </Button>
            </div>
          )}
        </form>
      )}

      <div className={styles.list}>
        {comments?.map((comment) => (
          <div key={comment.id} className={styles.comment}>
            <Avatar name={comment.display_name} imageUrl={comment.avatar_url} size="sm" />
            <div className={styles.content}>
              <div className={styles.header}>
                <span className={styles.author}>{comment.display_name ?? 'Unknown'}</span>
                <span className={styles.time}>{formatTime(comment.created_at)}</span>
                {user?.id === comment.user_id && (
                  <button
                    className={styles.deleteBtn}
                    onClick={() => deleteComment.mutate({ commentId: comment.id, cardId })}
                    aria-label="Delete comment"
                  >
                    &#x2715;
                  </button>
                )}
              </div>
              <p className={styles.text}>{comment.content}</p>
            </div>
          </div>
        ))}
        {comments?.length === 0 && (
          <p className={styles.empty}>No comments yet</p>
        )}
      </div>
    </div>
  );
}
