export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export const DEMO_PROFILE = {
  id: DEMO_USER_ID,
  username: 'demo',
  display_name: 'Demo User',
  avatar_url: null,
  storage_used: 0,
  storage_quota: 104857600,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} as const;
