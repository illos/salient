// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { authClient } from './auth-client';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { ErrorNotice, Field, Loading } from './ui';

function RecoveryPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col bg-background px-10 py-8">
      <span className="text-lg font-wordmark">Salient</span>
      <section className="flex flex-1 items-center justify-center py-16">
        <div className="w-full max-w-[360px]">
          <h1 className="text-3xl">{title}</h1>
          <div className="mt-8 flex flex-col gap-5">{children}</div>
          <Link
            to="/login"
            search={{ next: '/' }}
            className="mt-6 inline-block text-base text-muted-foreground hover:text-foreground"
          >
            Back to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}

export function ForgotPassword() {
  const available = useQuery(api.auth.recoveryAvailable);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <RecoveryPage title="Reset your password">
      {available === undefined ? (
        <Loading>Loading…</Loading>
      ) : !available ? (
        <p>Password recovery is temporarily unavailable. Please try again later.</p>
      ) : sent ? (
        <p role="status">
          If an account uses that email address, you will receive a password-reset link. Check your
          inbox and spam folder.
        </p>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={async event => {
            event.preventDefault();
            if (pending) return;
            setPending(true);
            setError(null);
            const email = String(new FormData(event.currentTarget).get('email')).trim();
            try {
              const result = await authClient.requestPasswordReset({
                email,
                redirectTo: new URL('/reset-password', window.location.origin).href,
              });
              if (result.error) {
                setError(
                  result.error.status === 429
                    ? 'Too many requests. Wait a minute before trying again.'
                    : 'Unable to request a reset right now. Please try again later.',
                );
              } else setSent(true);
            } catch {
              setError('Unable to request a reset right now. Please try again later.');
            } finally {
              setPending(false);
            }
          }}
        >
          <p className="text-base text-muted-foreground">
            Enter the email address you use to sign in.
          </p>
          <Field label="Email">
            <Input name="email" type="email" autoComplete="email" required className="h-12" />
          </Field>
          <ErrorNotice error={error} />
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? 'Please wait…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </RecoveryPage>
  );
}

export function ResetPassword({ token, invalid }: { token?: string; invalid: boolean }) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <RecoveryPage title="Choose a new password">
      {done ? (
        <p role="status">Your password has been reset. Sign in with your new password.</p>
      ) : !token || invalid ? (
        <p>
          This reset link is invalid or has expired.{' '}
          <Link to="/forgot-password">Request a new link</Link>.
        </p>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={async event => {
            event.preventDefault();
            if (pending) return;
            const data = new FormData(event.currentTarget);
            const newPassword = String(data.get('password'));
            if (newPassword !== String(data.get('confirmPassword'))) {
              setError('The passwords do not match.');
              return;
            }
            setPending(true);
            setError(null);
            try {
              const result = await authClient.resetPassword({ token, newPassword });
              if (result.error) {
                setError(
                  result.error.code === 'INVALID_TOKEN'
                    ? 'This reset link is invalid or has expired. Request a new link.'
                    : result.error.status === 429
                      ? 'Too many requests. Wait a minute before trying again.'
                      : 'Unable to reset your password. Please try again.',
                );
              } else {
                setDone(true);
                // Remove the spent secret from the address bar and this history entry.
                window.history.replaceState(window.history.state, '', '/reset-password');
                // Clear any existing cross-domain session cached in this browser.
                await authClient.signOut().catch(() => {});
              }
            } catch {
              setError('Unable to reset your password. Please try again.');
            } finally {
              setPending(false);
            }
          }}
        >
          <Field label="New password">
            <Input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              className="h-12"
            />
          </Field>
          <Field label="Confirm new password">
            <Input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              className="h-12"
            />
          </Field>
          <ErrorNotice error={error} />
          {error && <Link to="/forgot-password">Request a new link</Link>}
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? 'Please wait…' : 'Reset password'}
          </Button>
        </form>
      )}
    </RecoveryPage>
  );
}
