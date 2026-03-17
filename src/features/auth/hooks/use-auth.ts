import { useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/config/supabase';
import { isDemoMode, DEMO_USER_ID, DEMO_PROFILE } from '@/config/demo';
import type { Profile } from '@/types/common';

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
}

const DEMO_USER: User = {
  id: DEMO_USER_ID,
  email: 'demo@lanefly.local',
  user_metadata: { full_name: 'Demo User' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
};

async function upsertProfile(user: User): Promise<Profile | null> {
  const displayName: string | null =
    (user.user_metadata['full_name'] as string | undefined) ??
    (user.user_metadata['name'] as string | undefined) ??
    null;
  const avatarUrl: string | null =
    (user.user_metadata['avatar_url'] as string | undefined) ?? null;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        display_name: displayName,
        avatar_url: avatarUrl,
      },
      { onConflict: 'id' },
    )
    .select(
      'id, username, display_name, avatar_url, storage_used, storage_quota, created_at, updated_at',
    )
    .single();

  if (error) {
    console.error('Failed to upsert profile:', error.message);
    return null;
  }

  return data;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(isDemoMode ? DEMO_USER : null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(
    isDemoMode ? { ...DEMO_PROFILE } : null,
  );
  const [isLoading, setIsLoading] = useState(!isDemoMode);

  const handleSession = useCallback(async (newSession: Session | null) => {
    setSession(newSession);
    const newUser = newSession?.user ?? null;
    setUser(newUser);

    if (newUser) {
      const p = await upsertProfile(newUser);
      setProfile(p);
    } else {
      setProfile(null);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isDemoMode) return;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      void handleSession(s);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      void handleSession(s);
    });

    return () => subscription.unsubscribe();
  }, [handleSession]);

  return { user, session, profile, isLoading };
}
