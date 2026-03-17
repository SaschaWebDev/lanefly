import { useRealtimeContext } from './realtime-provider';
import styles from './connection-indicator.module.css';

export function ConnectionIndicator() {
  const { status } = useRealtimeContext();

  if (status === 'connected') return null;

  return (
    <div className={styles.indicator} aria-live="polite">
      <span className={`${styles.dot} ${styles[status]}`} />
      <span className={styles.label}>
        {status === 'connecting' ? 'Connecting...' : 'Offline'}
      </span>
    </div>
  );
}
