import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { signOut } from '@/features/auth/api/sign-out';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import styles from './app-layout.module.css';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile } = useAuth();

  const initials =
    profile?.display_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?';

  return (
    <div className={styles.layout}>
      <nav className={styles.navBar}>
        <div className={styles.navLeft}>
          <Link to="/" className={styles.navLogo}>
            LaneFly
          </Link>
        </div>
        <div className={styles.navRight}>
          <NotificationBell />
          <ThemeToggle />
          <div className={styles.avatar}>{initials}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void signOut()}
          >
            Sign out
          </Button>
        </div>
      </nav>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
