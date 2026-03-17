import { isDemoMode } from './demo';

function getEnvVar(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    if (isDemoMode) return '';
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const env = {
  supabaseUrl: getEnvVar('VITE_SUPABASE_URL'),
  supabaseAnonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
} as const;
