// SPDX-License-Identifier: GPL-3.0-only
/**
 * The signed-in user's controls shared by the site nav, the session header, the login page and
 * the account screen: the appearance switch (light / dark / system, stored locally by
 * web/theme.ts), Sign out, and the header disc that opens the account screen (V95,
 * docs/build/V95-account-screen.md). Quiet: the switch is a 999px segmented control.
 */
import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { cn } from 'cn';
import { api } from '../../convex/_generated/api';
import { authClient } from '../auth-client';
import { THEMES, useTheme, type Theme } from '../theme';
import { errorMessage } from '../ui';
import { useToast } from '../toast';
import { Button } from './ui/button';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Disc } from './disc';

const THEME_LABELS: Record<Theme, string> = { light: 'Light', dark: 'Dark', system: 'System' };

/** Light / dark / system appearance switch; the preference is stored locally (see web/theme.ts). */
export function ThemeSwitch({ className, inset }: { className?: string; inset?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <ToggleGroup
      aria-label="Appearance"
      value={[theme]}
      onValueChange={value => {
        const next = value[0];
        if (typeof next === 'string' && THEMES.includes(next as Theme)) setTheme(next as Theme);
      }}
      spacing={0}
      className={cn(inset && 'data-[spacing=0]:bg-muted', className)}
    >
      {THEMES.map(option => (
        <ToggleGroupItem
          key={option}
          value={option}
          aria-label={THEME_LABELS[option]}
          size="sm"
          className={cn(
            inset &&
              'aria-pressed:bg-accent data-pressed:bg-accent data-[state=on]:bg-accent hover:bg-transparent',
          )}
        >
          {THEME_LABELS[option]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** Signs out through Better Auth and returns to the login page. */
export function SignOut({ className }: { className?: string }) {
  const navigate = useNavigate();
  const showError = useToast();
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const result = await authClient.signOut();
          if (result.error) throw new Error(result.error.message);
          await navigate({ to: '/login', search: { next: '/' }, replace: true });
        } catch (e) {
          showError(errorMessage(e));
          setPending(false);
        }
      }}
    >
      Sign out
    </Button>
  );
}

/** The header disc: the viewer's portrait or initials, opening the account screen. */
export function AccountLink({ className }: { className?: string }) {
  const viewer = useQuery(api.auth.viewer);
  if (!viewer) return null;
  return (
    <Link
      to="/account"
      aria-label="Account"
      title="Account"
      className={cn(
        'inline-flex rounded-full outline-none transition-opacity duration-(--motion-fast) hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
    >
      <Disc name={viewer.displayName} src={viewer.portraitUrl} variant="grey" size="sm" label="" />
    </Link>
  );
}
