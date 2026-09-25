// SPDX-License-Identifier: GPL-3.0-only
/**
 * The "Players" section of the campaign home (docs/design-mockups/v2/campaign-home-simplified.png;
 * V68): hard-rule heading with `n members · n characters`, the Director's join-request and
 * build-review counts and MANAGE PLAYERS at the right, then one card per member: disc, name, the OWNER and DIRECTOR badges
 * (docs/accounts-and-access-spec.md#campaigns: every other member is a player and carries no tag;
 * Observer is a session-level state), a presence dot, and one row per admitted hero with `LV n`.
 * The viewer's own card is tinted. A member who is not the Director sees the state of their own
 * pending submissions under their card, where the old Party panel showed it.
 *
 * Presence (docs/table-spec.md#2-participation-and-presence): `usePresence` sends
 * `presence.heartbeat` on mount and every 30 s, `presence.leave` on unmount, and reads
 * `presence.list`. The online window is the backend's; the UI never decides who is connected.
 */
import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { cn } from 'cn';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Disc } from '../components/disc';
import { SectionHeading } from '../ui';
import type { Member } from './header';

/** Matches HEARTBEAT_MS in convex/presence.ts (the web bundle does not import server modules). */
const HEARTBEAT_MS = 30_000;

export function usePresence(campaignId: Id<'campaigns'>): Id<'users'>[] {
  const heartbeat = useMutation(api.presence.heartbeat);
  const leave = useMutation(api.presence.leave);
  useEffect(() => {
    const beat = () => void heartbeat({ campaignId }).catch(() => undefined);
    beat();
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    return () => {
      window.clearInterval(timer);
      void leave({ campaignId }).catch(() => undefined);
    };
  }, [campaignId, heartbeat, leave]);
  return useQuery(api.presence.list, { campaignId }) ?? [];
}

export function PlayersSection({
  campaignId,
  members,
  ownerId,
  viewerId,
  online,
  director,
  joinRequests,
  onManage,
}: {
  campaignId: Id<'campaigns'>;
  members: Member[];
  ownerId: Id<'users'>;
  viewerId: Id<'users'>;
  online: Id<'users'>[];
  director: boolean;
  joinRequests: number;
  onManage: (section: 'invite' | 'requests' | 'admissions') => void;
}) {
  const heroes = members.reduce((n, m) => n + m.heroes.length, 0);
  const reviews = useQuery(api.characters.reviews, { campaignId });
  const pendingReviews = reviews?.filter(r => r.status === 'pending') ?? [];
  const ownPending = director ? [] : pendingReviews;
  const ordered = [...members].sort((a, b) =>
    a.userId === ownerId
      ? -1
      : b.userId === ownerId
        ? 1
        : a.displayName.localeCompare(b.displayName),
  );
  return (
    <section aria-labelledby="players-heading" className="mb-10">
      <SectionHeading
        className="mb-5"
        aside={
          director ? (
            <span className="flex items-center gap-4">
              <Button
                variant="link"
                className="text-sm text-muted-foreground"
                onClick={() => onManage('requests')}
                data-testid="join-request-count"
              >
                Join requests
                <span className={cn('ml-1', joinRequests > 0 ? 'text-primary' : '')}>
                  {joinRequests}
                </span>
              </Button>
              <Button
                variant="link"
                className="text-sm text-muted-foreground"
                onClick={() => onManage('admissions')}
                data-testid="build-review-count"
              >
                Build reviews
                <span className={cn('ml-1', pendingReviews.length > 0 ? 'text-primary' : '')}>
                  {pendingReviews.length}
                </span>
              </Button>
              <Button
                variant="link"
                className="text-sm text-foreground"
                onClick={() => onManage('admissions')}
              >
                Manage players
              </Button>
            </span>
          ) : (
            <Link to="/characters" className="text-sm">
              Your characters →
            </Link>
          )
        }
      >
        <span className="flex items-baseline gap-3">
          <span id="players-heading">Players</span>
          <span className="text-sm text-muted-foreground">
            {members.length} {members.length === 1 ? 'member' : 'members'} · {heroes}{' '}
            {heroes === 1 ? 'character' : 'characters'}
          </span>
        </span>
      </SectionHeading>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3 p-0">
        {ordered.map(m => {
          const own = m.userId === viewerId;
          const owner = m.userId === ownerId;
          const connected = online.includes(m.userId);
          return (
            <li
              key={m.userId}
              data-testid="member-card"
              data-online={connected ? 'true' : 'false'}
              className="flex min-h-48 flex-col gap-3 rounded-lg bg-card p-5"
            >
              <div className="flex items-start gap-3">
                <span aria-hidden>
                  <Disc name={m.displayName} src={m.portraitUrl} variant={own ? 'ink' : 'grey'} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-base font-medium">{m.displayName}</span>
                  <span className="flex flex-wrap gap-1">
                    {owner && <Badge variant="outline">Owner</Badge>}
                    {/* The owner is the Director until delegation exists (access spec). */}
                    {owner && <Badge>Director</Badge>}
                  </span>
                </span>
                <span
                  role="img"
                  aria-label={connected ? 'Connected' : 'Not connected'}
                  title={connected ? 'Connected' : 'Not connected'}
                  className={cn(
                    'mt-1 size-2.5 shrink-0 rounded-full',
                    connected ? 'bg-success' : 'bg-placeholder',
                  )}
                />
              </div>
              {m.heroes.length === 0 ? (
                <p className="m-0 text-sm text-muted-foreground">No characters yet.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {m.heroes.map(hero => (
                    <li key={hero.id}>
                      <Link
                        to="/characters/$characterId"
                        params={{ characterId: hero.id }}
                        className="flex h-10 items-center gap-2 rounded-md bg-muted px-2.5 text-sm transition-colors duration-(--motion-fast) hover:bg-accent hover:no-underline"
                      >
                        <span aria-hidden className="size-5 shrink-0 rounded-full bg-placeholder" />
                        <span className="min-w-0 flex-1 truncate font-medium">{hero.name}</span>
                        <span className="text-sm text-muted-foreground tabular-nums">
                          LV {hero.level}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {own && ownPending.length > 0 && (
                <p className="m-0 text-sm text-muted-foreground" data-testid="own-submissions">
                  Awaiting Director review: {ownPending.map(r => r.characterName).join(', ')}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
