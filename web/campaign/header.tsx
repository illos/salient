// SPDX-License-Identifier: GPL-3.0-only
/**
 * Campaign home header (docs/design-mockups/v2/campaign-home-simplified.png; V68): back link, the
 * campaign name, the grey meta line `Session n · last played …`, and at the right INVITE PLAYERS
 * beside START SESSION for the Director between sessions. With an active session the row keeps
 * OPEN THE TABLE / PAUSE / RESUME / END, submitting `sessions.transition` exactly as before, and
 * ending a session with committed combat opens the existing VoidCard (keep / reset).
 *
 * START SESSION has no roster on this page any more: the session screen that owns player selection
 * is a later slice. Interim behavior recorded in docs/build/V68-campaign-home.md: the button opens a
 * confirmation naming every current member, and `sessions.start` selects them all; the Director
 * adjusts afterwards through `sessions.setPlayers`. Presentation only: no rules logic.
 */
import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button, buttonVariants } from '../components/ui/button';
import { OverlayCard } from '../components/overlay-card';
import { Disc } from '../components/disc';
import { useCommand } from '../ui';
import { VoidCard } from '../table/void-card';

export type Session = {
  id: Id<'sessions'>;
  campaignId: Id<'campaigns'>;
  status: 'running' | 'paused' | 'closed';
  revision: number;
  selectedPlayerIds: Id<'users'>[];
  encounter: {
    id: Id<'encounters'>;
    status: 'draft' | 'committed' | 'closed-out' | 'voided';
  } | null;
  startedAt: number;
  closedAt: number | null;
  title: string | null;
  number: number;
};
export type Hero = { id: Id<'characters'>; name: string; level: number };
export type Member = { userId: Id<'users'>; displayName: string; heroes: Hero[] };

/** `3 days ago`, `2 hours ago`, `just now`; beyond a month, the calendar date. */
export function relativeTime(at: number, now: number): string {
  const seconds = Math.max(0, Math.floor((now - at) / 1000));
  if (seconds < 60) return 'just now';
  const units: [number, string][] = [
    [60 * 60 * 24 * 7, 'week'],
    [60 * 60 * 24, 'day'],
    [60 * 60, 'hour'],
    [60, 'minute'],
  ];
  if (seconds >= 60 * 60 * 24 * 30)
    return new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  for (const [size, name] of units) {
    if (seconds >= size) {
      const count = Math.floor(seconds / size);
      return `${count} ${name}${count === 1 ? '' : 's'} ago`;
    }
  }
  return 'just now';
}

/** The current time, re-rendered every minute so relative labels stay honest. */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

export function sessionStateText(active: Session | undefined): string {
  if (!active) return 'Between sessions';
  return active.status === 'paused' ? 'Session paused' : 'Session running';
}

export function CampaignHeader({
  campaignId,
  name,
  sessionCount,
  lastPlayedAt,
  director,
  active,
  members,
  onInvite,
}: {
  campaignId: Id<'campaigns'>;
  name: string;
  sessionCount: number;
  /** `closedAt` of the most recent closed session, when one exists. */
  lastPlayedAt: number | null;
  director: boolean;
  active: Session | undefined;
  members: Member[];
  onInvite: () => void;
}) {
  const now = useNow();
  const meta = active
    ? `Session ${active.number} · ${sessionStateText(active).toLowerCase()}`
    : sessionCount === 0
      ? 'No sessions yet'
      : `Session ${sessionCount}${lastPlayedAt ? ` · last played ${relativeTime(lastPlayedAt, now)}` : ''}`;
  return (
    <header className="rule-strong mb-8 pb-5">
      <Link to="/" className="mb-4 inline-block text-sm text-muted-foreground">
        ← Campaigns
      </Link>
      <div className="flex items-end justify-between gap-8">
        <div className="min-w-0">
          <h1 className="truncate">{name}</h1>
          <p className="mt-1 text-muted-foreground" data-testid="campaign-meta">
            {meta}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {active ? (
            <SessionActions campaignId={campaignId} session={active} director={director} />
          ) : director ? (
            <>
              <Button variant="outline" onClick={onInvite}>
                Invite players
              </Button>
              <StartSessionAction campaignId={campaignId} members={members} />
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function StartSessionAction({
  campaignId,
  members,
}: {
  campaignId: Id<'campaigns'>;
  members: Member[];
}) {
  const start = useMutation(api.sessions.start);
  const command = useCommand();
  const [open, setOpen] = useState(false);
  const selectedPlayerIds = members.map(m => m.userId);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Start session</Button>
      <OverlayCard
        open={open}
        onOpenChange={setOpen}
        eyebrow="Start session"
        title="Everyone plays"
        className="max-w-xl"
      >
        <p className="text-sm text-muted-foreground">
          Every member joins as a player. You can change who plays from the table once the session
          is running.
        </p>
        <ul className="m-0 my-4 flex list-none flex-wrap gap-2 p-0">
          {members.map(m => (
            <li
              key={m.userId}
              className="flex h-10 items-center gap-2 rounded-md border border-input px-3 text-sm font-semibold"
            >
              <span aria-hidden>
                <Disc name={m.displayName} size="sm" />
              </span>
              {m.displayName}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <Button
            disabled={command.pending}
            onClick={() =>
              void command
                .run(
                  commandId => start({ campaignId, selectedPlayerIds, commandId }),
                  JSON.stringify(['session.start', { campaignId, selectedPlayerIds }]),
                )
                .then(ok => ok && setOpen(false))
            }
          >
            {command.pending ? 'Starting…' : 'Start session'}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </OverlayCard>
    </>
  );
}

function SessionActions({
  campaignId,
  session,
  director,
}: {
  campaignId: Id<'campaigns'>;
  session: Session;
  director: boolean;
}) {
  const transition = useMutation(api.sessions.transition);
  const command = useCommand();
  const [closing, setClosing] = useState<Id<'encounters'> | null>(null);
  const open = (
    <Link
      to="/campaigns/$campaignId/table"
      params={{ campaignId }}
      className={buttonVariants({ className: 'hover:no-underline' })}
    >
      Open the table
    </Link>
  );
  if (!director) return open;
  const pauseOrResume = session.status === 'running' ? 'pause' : 'resume';
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        {open}
        <Button
          variant="outline"
          disabled={command.pending}
          onClick={() =>
            void command.run(
              commandId =>
                transition({
                  sessionId: session.id,
                  expectedRevision: session.revision,
                  action: pauseOrResume,
                  commandId,
                }),
              JSON.stringify([
                'session.transition',
                {
                  sessionId: session.id,
                  expectedRevision: session.revision,
                  action: pauseOrResume,
                },
              ]),
            )
          }
        >
          {session.status === 'running' ? 'Pause session' : 'Resume session'}
        </Button>
        <Button
          variant="outline"
          disabled={command.pending}
          onClick={() => {
            if (session.encounter?.status === 'committed') {
              setClosing(session.encounter.id);
              return;
            }
            void command.run(
              commandId =>
                transition({
                  sessionId: session.id,
                  expectedRevision: session.revision,
                  action: 'close',
                  commandId,
                }),
              JSON.stringify([
                'session.transition',
                { sessionId: session.id, expectedRevision: session.revision, action: 'close' },
              ]),
            );
          }}
        >
          End session
        </Button>
      </div>
      {closing === session.encounter?.id && session.encounter?.status === 'committed' && (
        <div className="w-full max-w-xl text-left">
          <VoidCard
            key={session.encounter.id}
            campaignId={session.campaignId}
            encounterId={session.encounter.id}
            session={{ id: session.id, revision: session.revision }}
            paused={session.status === 'paused'}
            onCancel={() => setClosing(null)}
            onDone={() => setClosing(null)}
          />
        </div>
      )}
    </div>
  );
}
