import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { Spinner } from '@/components/ui/spinner';

export const Route = createFileRoute('/_public/auth/callback')({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) {
          void navigate({ to: '/' });
        } else {
          void navigate({ to: '/login' });
        }
      })
      .catch(() => {
        void navigate({ to: '/login' });
      });
  }, [navigate]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <Spinner size="lg" />
    </div>
  );
}
