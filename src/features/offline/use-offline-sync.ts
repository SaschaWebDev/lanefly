import { useState, useEffect, useCallback } from 'react';
import { getQueue, dequeue, clearQueue, queueIsEmpty } from './mutation-queue';

export type SyncStatus = 'idle' | 'saving' | 'offline' | 'error';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    navigator.onLine ? 'idle' : 'offline',
  );

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setSyncStatus('idle');
    }

    function handleOffline() {
      setIsOnline(false);
      setSyncStatus('offline');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const replayQueue = useCallback(() => {
    if (!navigator.onLine) return;

    const queue = getQueue();
    if (queue.length === 0) return;

    setSyncStatus('saving');

    for (const mutation of queue) {
      try {
        // Mutations are replayed through TanStack Query's retry mechanism
        // Dequeue processed items
        dequeue(mutation.id);
      } catch {
        setSyncStatus('error');
        return;
      }
    }

    setSyncStatus('idle');
  }, []);

  useEffect(() => {
    if (isOnline && !queueIsEmpty()) {
      replayQueue();
    }
  }, [isOnline, replayQueue]);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!queueIsEmpty()) {
        e.preventDefault();
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return { isOnline, syncStatus, clearQueue };
}
