import { supabase } from '@/config/supabase';

const RATE_LIMIT_MS = 60_000;
let lastSentAt = 0;

export async function sendMagicLink(email: string): Promise<void> {
  const now = Date.now();
  if (now - lastSentAt < RATE_LIMIT_MS) {
    const secondsLeft = Math.ceil((RATE_LIMIT_MS - (now - lastSentAt)) / 1000);
    throw new Error(`Please wait ${secondsLeft}s before requesting another link`);
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  lastSentAt = Date.now();
}
