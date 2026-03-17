import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sendMagicLink } from '../api/magic-link';
import { signInWithOAuth } from '../api/oauth';
import styles from './login-form.module.css';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendMagicLink(email);
      setMagicLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: 'google' | 'github') {
    setError('');
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (magicLinkSent) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successMessage}>
            <div className={styles.successIcon}>&#x2709;</div>
            <div className={styles.successTitle}>Check your email</div>
            <p>
              We sent a magic link to <strong>{email}</strong>. Click the link
              to sign in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>LaneFly</div>
        <div className={styles.subtitle}>
          Sign in to manage your boards
        </div>

        <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" loading={loading} fullWidth>
            Send Magic Link
          </Button>
        </form>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.divider}>or</div>

        <div className={styles.oauthButtons}>
          <button
            className={styles.oauthButton}
            onClick={() => void handleOAuth('google')}
            type="button"
          >
            Continue with Google
          </button>
          <button
            className={styles.oauthButton}
            onClick={() => void handleOAuth('github')}
            type="button"
          >
            Continue with GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
