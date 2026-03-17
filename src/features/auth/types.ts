import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/common';

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
}
