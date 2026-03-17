import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useNotificationsQuery } from '../api/get-notifications';
import { useMarkReadMutation } from '../api/mark-read';
import { useMarkAllReadMutation } from '../api/mark-all-read';
import styles from './notification-bell.module.css';

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return `${Math.floor(diffHr / 24)}d`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const { data: notifications } = useNotificationsQuery(user?.id);
  const markRead = useMarkReadMutation();
  const markAllRead = useMarkAllReadMutation();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleNotifClick(notifId: string) {
    if (!user) return;
    markRead.mutate({ notificationId: notifId, userId: user.id });
  }

  function handleMarkAllRead() {
    if (!user) return;
    markAllRead.mutate({ userId: user.id });
  }

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <button
        className={styles.button}
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        &#128276;
        {unreadCount > 0 && <span className={styles.badge} />}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>Notifications</span>
            {unreadCount > 0 && (
              <button className={styles.markAllButton} onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>
          {notifications?.length ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`${styles.notifItem} ${!notif.is_read ? styles.unread : ''}`}
                onClick={() => handleNotifClick(notif.id)}
              >
                <span className={styles.notifMessage}>{notif.message}</span>
                <span className={styles.notifTime}>{formatTime(notif.created_at)}</span>
              </div>
            ))
          ) : (
            <div className={styles.empty}>No notifications yet</div>
          )}
        </div>
      )}
    </div>
  );
}
