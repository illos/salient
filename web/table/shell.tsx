// SPDX-License-Identifier: GPL-3.0-only
/**
 * The session shell (docs/table-spec.md#confirmed-combat-layout, 2026-09-15 decision; audit
 * finding 1): a full-viewport frame that replaces the site nav with the session header (wordmark,
 * campaign name, session number and elapsed time, status pill, PAUSE / RESUME and END, the user
 * menu) over three `card` panels on the page ground with 16px gaps (Quiet, docs/design-mockups/
 * quiet/README.md, table screen), each scrolling on its own. Widths come from the layout tokens in
 * web/style.css (424 / flex / 424; heroes 566 in combat).
 *
 * PAUSE / RESUME / END submit `sessions.transition` exactly as the campaign page does; ending a
 * session with committed combat opens the same VoidCard keep/reset choice. Nothing here resolves
 * a rule.
 */
import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '../components/ui/button';
import { Pill } from '../components/pill';
import { OverlayCard } from '../components/overlay-card';
import { AccountLink } from '../components/session-user';
import { useCommand } from '../ui';
import { VoidCard } from './void-card';
import type { Roster } from './director-pane';
import type { Encounter } from './setup-card';

/** `1h 12m` style elapsed time since `startedAt`, re-rendered every minute. */
function useElapsed(startedAt: number | undefined): string | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  if (startedAt === undefined) return null;
  const minutes = Math.max(0, Math.floor((now - startedAt) / 60_000));
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

/** Header status text: `Running · Free play`, `Running · Combat · Round 2`, `Paused`, `Read-only`. */
export function sessionStatusText(roster: Roster, encounter: Encounter | null): string {
  const status = roster.session?.status ?? 'none';
  if (status === 'paused') return 'Paused';
  if (status !== 'running') return 'Read-only · No active session';
  if (encounter?.status === 'committed') {
    if (encounter.phase === 'closeout') return 'Running · Combat · Closeout';
    if (encounter.phase === 'turns') return `Running · Combat · Round ${encounter.round}`;
    return 'Running · Combat · Opening';
  }
  if (encounter?.status === 'draft') return 'Running · Free play · Combat setup';
  return 'Running · Free play';
}

function SessionControls({
  campaignId,
  session,
  encounter,
}: {
  campaignId: Id<'campaigns'>;
  session: NonNullable<Roster['session']>;
  encounter: Encounter | null;
}) {
  const transition = useMutation(api.sessions.transition);
  const command = useCommand();
  const [closing, setClosing] = useState<Id<'encounters'> | null>(null);
  const running = session.status === 'running';
  const paused = session.status === 'paused';
  if (!running && !paused) return null;
  const action = running ? 'pause' : 'resume';
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="rounded-full px-4"
        disabled={command.pending}
        onClick={() =>
          void command.run(
            commandId =>
              transition({
                sessionId: session.id,
                expectedRevision: session.revision,
                action,
                commandId,
              }),
            JSON.stringify([
              'session.transition',
              { sessionId: session.id, expectedRevision: session.revision, action },
            ]),
          )
        }
      >
        {running ? 'Pause' : 'Resume'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="rounded-full px-4"
        disabled={command.pending}
        onClick={() => {
          if (encounter?.status === 'committed') {
            setClosing(encounter.id);
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
        End
      </Button>
      {encounter?.status === 'committed' && (
        <OverlayCard
          open={closing === encounter.id}
          onOpenChange={open => setClosing(open ? encounter.id : null)}
          eyebrow="End session"
          title="Combat is still running"
          className="max-w-xl"
        >
          <VoidCard
            key={encounter.id}
            campaignId={campaignId}
            encounterId={encounter.id}
            session={{ id: session.id, revision: session.revision }}
            paused={paused}
            onCancel={() => setClosing(null)}
            onDone={() => setClosing(null)}
          />
        </OverlayCard>
      )}
    </>
  );
}

export function SessionHeader({
  campaignId,
  campaignName,
  roster,
  encounter,
}: {
  campaignId: Id<'campaigns'>;
  campaignName: string;
  roster: Roster;
  encounter: Encounter | null;
}) {
  const number = roster.session?.number ?? null;
  const elapsed = useElapsed(roster.session?.startedAt);
  const status = sessionStatusText(roster, encounter);
  const live = roster.session?.status === 'running';
  return (
    <header className="flex h-(--session-header-height) items-center gap-5 bg-background px-(--pane-padding-x)">
      <Link to="/" className="text-lg font-wordmark tracking-normal hover:no-underline">
        Salient
      </Link>
      <Link
        to="/campaigns/$campaignId"
        params={{ campaignId }}
        className="truncate text-base font-medium hover:no-underline"
        title="Back to the campaign"
      >
        {campaignName}
      </Link>
      {number !== null && (
        <span className="text-base text-muted-foreground">
          Session {number}
          {elapsed ? ` · ${elapsed}` : ''}
        </span>
      )}
      <div className="ml-auto flex items-center gap-3">
        <Pill filled={live} role="status" aria-live="polite">
          {status}
        </Pill>
        {roster.role === 'director' && roster.session && (
          <SessionControls campaignId={campaignId} session={roster.session} encounter={encounter} />
        )}
        <AccountLink />
      </div>
    </header>
  );
}

/**
 * The three panes. Each child is placed directly in a scrolling `card` panel (`.session-pane` in
 * web/style.css; no further card wrappers); `centerFooter` is pinned under the centre panel's
 * scroll area (the command line).
 */
export function SessionPanes({
  combat,
  director,
  center,
  centerFooter,
  heroes,
}: {
  /** Widen the heroes pane for the selected sheet while an encounter is committed. */
  combat: boolean;
  director: React.ReactNode;
  center: React.ReactNode;
  centerFooter?: React.ReactNode;
  heroes: React.ReactNode;
}) {
  return (
    <div className="session-panes" data-combat={combat ? 'true' : 'false'}>
      <section className="session-pane" aria-label="Director pane" data-pane="director">
        <div className="session-pane-scroll">{director}</div>
      </section>
      <section className="session-pane" aria-label="Game log pane" data-pane="log">
        <div className="session-pane-scroll">{center}</div>
        {centerFooter && <div data-command-footer>{centerFooter}</div>}
      </section>
      <section className="session-pane" aria-label="Heroes pane" data-pane="heroes">
        <div className="session-pane-scroll">{heroes}</div>
      </section>
    </div>
  );
}

/** Full-viewport frame: header row plus the pane row; the document itself never scrolls. */
export function SessionShell({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="session-shell" data-session-shell>
      {header}
      {children}
    </div>
  );
}
