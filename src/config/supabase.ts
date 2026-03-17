import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import { isDemoMode } from './demo';
import type { Database } from '@/types/database';

export const supabase = createClient<Database>(
  isDemoMode ? 'https://demo.invalid' : env.supabaseUrl,
  isDemoMode ? 'demo' : env.supabaseAnonKey,
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
);
