// SPDX-License-Identifier: GPL-3.0-only
/**
 * V95 account screen (docs/build/V95-account-screen.md; mockup docs/design-mockups/quiet/
 * account-light.png): a sidebar of sections beside one `card` panel. Profile and devices are
 * app data (convex/account.ts); email, password and deletion go through Better Auth's routes.
 */
import { Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { cn } from 'cn';
import { api } from '../../convex/_generated/api';
import { authClient } from '../auth-client';
import { Disc } from '../components/disc';
import { Loading } from '../ui';
import { ProfilePanel } from './profile';
import { SecurityPanel } from './security';
import { PreferencesPanel } from './preferences';
import { DeletePanel } from './delete';
import { useDevices } from './device';

export const SECTIONS = ['profile', 'security', 'preferences', 'delete'] as const;
export type Section = (typeof SECTIONS)[number];

const TITLES: Record<Section, string> = {
  profile: 'Profile',
  security: 'Security',
  preferences: 'Preferences',
  delete: 'Delete account',
};
const INTROS: Record<Section, string> = {
  profile: 'How you appear to your Director and the other players.',
  security: 'Where you are signed in, and your password.',
  preferences: 'How Salient looks on this device.',
  delete: 'Leave for good. This cannot be undone.',
};

export function AccountPage({ section }: { section?: string }) {
  const current: Section = SECTIONS.includes(section as Section) ? (section as Section) : 'profile';
  const viewer = useQuery(api.auth.viewer);
  const session = authClient.useSession();
  const deviceState = useDevices(session.data?.session.token);
  const { devices } = deviceState;
  const email = session.data?.user.email ?? '';
  if (!viewer) return <Loading>Opening your account…</Loading>;
  const item =
    'flex h-12 items-center justify-between rounded-lg px-4 text-base text-muted-foreground transition-colors duration-(--motion-fast) hover:text-foreground hover:no-underline';
  const deviceCount = devices
    ? `${devices.length} ${devices.length === 1 ? 'device' : 'devices'}`
    : null;
  return (
    <div className="grid grid-cols-[260px_minmax(0,1fr)] items-start gap-8">
      <aside className="flex flex-col gap-5">
        <div className="flex items-center gap-4 px-2">
          <Disc name={viewer.displayName} src={viewer.portraitUrl} size="md" label="" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-base">{viewer.displayName}</span>
            <span className="truncate text-sm text-muted-foreground">{email}</span>
          </span>
        </div>
        <nav aria-label="Account sections" className="flex flex-col gap-1">
          <Link
            to="/account"
            className={cn(item, current === 'profile' && 'bg-card text-foreground')}
            aria-current={current === 'profile' ? 'page' : undefined}
          >
            {TITLES.profile}
          </Link>
          {(['security', 'preferences', 'delete'] as const).map(s => (
            <Link
              key={s}
              to="/account/$section"
              params={{ section: s }}
              className={cn(item, current === s && 'bg-card text-foreground')}
              aria-current={current === s ? 'page' : undefined}
            >
              <span>{TITLES[s]}</span>
              {s === 'security' && deviceCount && (
                <span className="text-sm text-muted-foreground">{deviceCount}</span>
              )}
            </Link>
          ))}
        </nav>
      </aside>
      <section aria-labelledby="account-heading">
        <h1 id="account-heading">{TITLES[current]}</h1>
        <p className="mt-1 mb-6 text-muted-foreground">{INTROS[current]}</p>
        <div className="flex flex-col gap-8 rounded-lg bg-card p-6">
          {current === 'profile' && (
            <ProfilePanel viewer={viewer} email={email} refreshSession={session.refetch} />
          )}
          {current === 'security' && <SecurityPanel {...deviceState} />}
          {current === 'preferences' && <PreferencesPanel />}
          {current === 'delete' && <DeletePanel />}
        </div>
      </section>
    </div>
  );
}
