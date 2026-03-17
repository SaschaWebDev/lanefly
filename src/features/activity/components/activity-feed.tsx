import { useActivityQuery } from '../api/get-activity';
import styles from './activity-feed.module.css';

interface ActivityFeedProps {
  cardId: string;
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

export function ActivityFeed({ cardId }: ActivityFeedProps) {
  const { data: activity } = useActivityQuery(cardId);

  if (!activity?.length) {
    return <p className={styles.empty}>No activity yet</p>;
  }

  return (
    <div className={styles.feed}>
      {activity.map((entry) => (
        <div key={entry.id} className={styles.entry}>
          <div className={styles.avatar}>U</div>
          <div className={styles.content}>
            <span className={styles.action}>{entry.action}</span>
            <div className={styles.timestamp}>{formatTime(entry.created_at)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
