import { useOfflineSync, type SyncStatus } from './use-offline-sync';
import styles from './sync-indicator.module.css';

export function SyncIndicator() {
  const { syncStatus } = useOfflineSync();

  if (syncStatus === 'idle') return null;

  const labels: Record<SyncStatus, string> = {
    saving: 'Saving...',
    offline: 'Offline',
    error: 'Sync error',
    idle: '',
  };

  return (
    <div className={`${styles.indicator} ${styles[syncStatus]}`} aria-live="polite">
      {labels[syncStatus]}
    </div>
  );
}
