import type { Notification } from '@/types/common';

const demoNotifications: Notification[] = [];

export function getDemoNotifications(): Notification[] {
  return [...demoNotifications];
}

export function markDemoNotificationRead(id: string): void {
  const notif = demoNotifications.find((n) => n.id === id);
  if (notif) notif.is_read = true;
}

export function markAllDemoNotificationsRead(): void {
  demoNotifications.forEach((n) => { n.is_read = true; });
}
