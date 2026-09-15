// SPDX-License-Identifier: GPL-3.0-only
/**
 * The signed-in user's controls shared by the site nav and the session header: the appearance
 * switch (light / dark / system, stored locally by web/theme.ts until V10), Sign out, and the
 * session header's user Disc that opens both in a small menu (the mockups' name-and-avatar at the
 * right of the header; the account page itself is V10).
 */
import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from 'cn';
import { authClient } from '../auth-client';
import { THEMES, useTheme, type Theme } from '../theme';
import { ErrorNotice, errorMessage } from '../ui';
import { Button } from './ui/button';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Disc } from './disc';

const THEME_LABELS: Record<Theme, string> = { light: 'Light', dark: 'Dark', system: 'System' };

/** Light / dark / system appearance switch; the preference is stored locally (see web/theme.ts). */
export function ThemeSwitch({ className }: { className?: string }) {
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
      className={cn('rounded-md border border-rule-strong', className)}
    >
      {THEMES.map(option => (
        <ToggleGroupItem
          key={option}
          value={option}
          aria-label={THEME_LABELS[option]}
          className="caps h-7 rounded-none px-2.5 text-muted-foreground hover:text-foreground data-pressed:bg-secondary data-pressed:text-secondary-foreground"
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
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={className}
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const result = await authClient.signOut();
            if (result.error) throw new Error(result.error.message);
            await navigate({ to: '/login', search: { next: '/' }, replace: true });
          } catch (e) {
            setError(errorMessage(e));
            setPending(false);
          }
        }}
      >
        Sign out
      </Button>
      <ErrorNotice error={error} />
    </>
  );
}

/** The header Disc; opens a small menu with the appearance switch and Sign out. */
export function UserMenu({ displayName }: { displayName: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div ref={root} className="relative">
      <button
        type="button"
        className="flex items-center gap-3 rounded-full"
        aria-label={`${displayName}: account menu`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-sm">{displayName}</span>
        <Disc name={displayName} variant="ink" size="sm" label="" />
      </button>
      {open && (
        <div
          id={id}
          role="group"
          aria-label="Account"
          className="absolute top-full right-0 z-50 mt-2 flex min-w-60 flex-col gap-3 border border-rule-strong bg-background p-4 shadow-hard"
        >
          <span className="caps text-muted-foreground">Appearance</span>
          <ThemeSwitch />
          <SignOut className="self-start" />
        </div>
      )}
    </div>
  );
}
