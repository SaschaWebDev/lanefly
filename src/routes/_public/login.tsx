import { createFileRoute, redirect } from '@tanstack/react-router';
import { supabase } from '@/config/supabase';
import { LoginForm } from '@/features/auth/components/login-form';

export const Route = createFileRoute('/_public/login')({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginForm,
});
