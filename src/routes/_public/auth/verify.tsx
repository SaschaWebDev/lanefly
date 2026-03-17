import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@/config/supabase';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export const Route = createFileRoute('/_public/auth/verify')({
  component: VerifyMagicLink,
});

function VerifyMagicLink() {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  async function handleVerify() {
    setVerifying(true);
    setError('');

    try {
      const hash = window.location.hash;
      if (!hash) {
        setError('Invalid verification link');
        setVerifying(false);
        return;
      }

      const params = new URLSearchParams(hash.slice(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        setError('Invalid verification link');
        setVerifying(false);
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setError(sessionError.message);
        setVerifying(false);
        return;
      }

      void navigate({ to: '/' });
    } catch {
      setError('Verification failed. Please try again.');
      setVerifying(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 'var(--space-4)',
        padding: 'var(--space-6)',
        textAlign: 'center',
      }}
    >
      {verifying ? (
        <>
          <Spinner size="lg" />
          <p>Verifying your identity...</p>
        </>
      ) : (
        <>
          <h1
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--font-semibold)',
            }}
          >
            Confirm Sign In
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Click below to complete your sign in. This extra step prevents email
            scanner bots from consuming your magic link.
          </p>
          <Button onClick={() => void handleVerify()}>
            Confirm &amp; Sign In
          </Button>
          {error && (
            <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
