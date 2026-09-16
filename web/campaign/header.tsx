// SPDX-License-Identifier: GPL-3.0-only
/**
 * Campaign home header (docs/design-mockups/v1/campaign-home.png; V21 item 11): back link,
 * eyebrow, campaign name, grey meta line, and at the right of the same row the role tag beside
 * the primary session action. START SESSION submits `sessions.start` with the player selection
 * held by the page; PAUSE / RESUME / END submit `sessions.transition` exactly as before. Ending a
 * session with committed combat opens the existing VoidCard (keep / reset) under the header rule.
 * Presentation only: no rules logic, no new operations.
 */
import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Badge } from '../components/ui/badge';
import { Button, buttonVariants } from '../components/ui/button';
import { Eyebrow, useCommand } from '../ui';
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
};
export type Member = { userId: Id<'users'>; displayName: string };
export type CampaignRole = 'Director' | 'Player' | 'Observer';

/** `3 days ago`, `2 hours ago`, `just now`; re-rendered every minute. */
export function useRelativeTime(at: number | null | undefined): string | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  if (at === null || at === undefined) return null;
  const seconds = Math.max(0, Math.floor((now - at) / 1000));
  if (seconds < 60) return 'just now';
  const units: [number, string][] = [
    [60 * 60 * 24 * 365, 'year'],
    [60 * 60 * 24 * 30, 'month'],
    [60 * 60 * 24, 'day'],
    [60 * 60, 'hour'],
    [60, 'minute'],
  ];
  for (const [size, name] of units) {
    if (seconds >= size) {
      const count = Math.floor(seconds / size);
      return `${count} ${name}${count === 1 ? '' : 's'} ago`;
    }
  }
  return 'just now';
}

export function sessionStateText(active: Session | undefined): string {
  if (!active) return 'Between sessions';
  return active.status === 'paused' ? 'Session paused' : 'Session running';
}

export function CampaignHeader({
  campaignId,
  name,
  memberCount,
  role,
  director,
  active,
  lastPlayedAt,
  selectedPlayerIds,
}: {
  campaignId: Id<'campaigns'>;
  name: string;
  memberCount: number;
  role: CampaignRole;
  director: boolean;
  active: Session | undefined;
  /** `closedAt` of the most recent closed session, when one exists. */
  lastPlayedAt: number | null;
  selectedPlayerIds: Id<'users'>[];
}) {
  const lastPlayed = useRelativeTime(lastPlayedAt);
  return (
    <header className="rule-strong mb-8 pb-5">
      <Link to="/" className="mb-4 inline-block text-sm text-muted-foreground">
        ← Campaigns
      </Link>
      <div className="flex items-end justify-between gap-8">
        <div className="min-w-0">
          <Eyebrow>{director ? 'Director’s workspace' : 'Your campaign'}</Eyebrow>
          <h1 className="truncate">{name}</h1>
          <p className="mt-1 text-muted-foreground">
            {memberCount} {memberCount === 1 ? 'member' : 'members'} · {sessionStateText(active)}
            {lastPlayed ? ` · Last played ${lastPlayed}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Badge
            variant={director ? 'default' : 'outline'}
            className="h-9 border px-4 text-xs"
            data-testid="role-tag"
          >
            {role}
          </Badge>
          {active ? (
            <SessionActions campaignId={campaignId} session={active} director={director} />
          ) : director ? (
            <StartSessionAction campaignId={campaignId} selectedPlayerIds={selectedPlayerIds} />
          ) : null}
        </div>
      </div>
    </header>
  );
}

function StartSessionAction({
  campaignId,
  selectedPlayerIds,
}: {
  campaignId: Id<'campaigns'>;
  selectedPlayerIds: Id<'users'>[];
}) {
  const start = useMutation(api.sessions.start);
  const command = useCommand();
  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        disabled={command.pending}
        onClick={() =>
          void command.run(
            commandId => start({ campaignId, selectedPlayerIds, commandId }),
            JSON.stringify(['session.start', { campaignId, selectedPlayerIds }]),
          )
        }
      >
        {command.pending ? 'Starting…' : 'Start session'}
      </Button>
    </div>
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
