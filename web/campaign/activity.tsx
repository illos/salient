// SPDX-License-Identifier: GPL-3.0-only
/**
 * The campaign home "Game log" section (campaign-home.png; V21 item 11): hard-rule heading with
 * the `Show` filter at the right, rows with a small dot (brick red for the newest entry, grey
 * otherwise), bold headline, grey attribution and time beneath, and the session meta
 * (`Session n · closed`) right-aligned when the entry belongs to a closed session. The session
 * number is the session's position from the oldest in `sessions.list`, as the session shell
 * derives it. Reads `events.list` exactly as before; OLDER ACTIVITY pages the same query.
 */
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { cn } from 'cn';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '../components/ui/button';
import { Loading, Notice, SectionHeading } from '../ui';
import { EventRuleLinks } from '../rules/event-links';
import { readableRuleText } from '../rules/reference';
import type { Session } from './header';

export function ActivitySection({
  campaignId,
  sessions,
}: {
  campaignId: Id<'campaigns'>;
  /** Newest first, as `sessions.list` returns them. */
  sessions: Session[];
}) {
  const [history, setHistory] = useState<Id<'sessions'> | undefined>();
  return (
    <section aria-labelledby="game-log-heading">
      <SectionHeading
        aside={
          <label className="flex items-center gap-2 normal-case tracking-normal">
            <span className="caps">Show</span>
            <select
              className="native-select"
              value={history ?? ''}
              onChange={e =>
                setHistory((e.target.value || undefined) as Id<'sessions'> | undefined)
              }
            >
              <option value="">All campaign activity</option>
              {sessions.map((s, i) => (
                <option key={s.id} value={s.id}>
                  Session {sessions.length - i} · {new Date(s.startedAt).toLocaleDateString()} ·{' '}
                  {s.status}
                  {i === 0 ? ' · latest' : ''}
                </option>
              ))}
            </select>
          </label>
        }
      >
        <span id="game-log-heading">Game log</span>
      </SectionHeading>
      {history && sessions.find(s => s.id === history)?.status === 'closed' && (
        <Notice className="mb-4">Closed session history is read-only.</Notice>
      )}
      <GameLog
        key={history ?? 'all'}
        campaignId={campaignId}
        sessionId={history}
        sessions={sessions}
      />
    </section>
  );
}

function GameLog({
  campaignId,
  sessionId,
  sessions,
}: {
  campaignId: Id<'campaigns'>;
  sessionId?: Id<'sessions'>;
  sessions: Session[];
}) {
  const [before, setBefore] = useState<number | undefined>();
  const result = useQuery(api.events.list, {
    campaignId,
    ...(sessionId ? { sessionId } : {}),
    ...(before === undefined ? {} : { before }),
  });
  if (!result) return <Loading>Loading the log…</Loading>;
  const sessionMeta = (id: Id<'sessions'> | null) => {
    if (!id) return null;
    const index = sessions.findIndex(s => s.id === id);
    if (index < 0) return null;
    const session = sessions[index]!;
    return `Session ${sessions.length - index} · ${session.status}`;
  };
  return (
    <>
      {result.events.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No recorded activity yet.</p>
      ) : (
        <ol className="m-0 list-none p-0">
          {result.events.map((event, index) => {
            const meta = sessionMeta(event.sessionId);
            return (
              <li key={event.id} className="rule-soft flex items-start gap-4 py-3 text-sm">
                <span
                  aria-hidden
                  className={cn(
                    'mt-2 size-2 shrink-0 rounded-full',
                    index === 0 && before === undefined ? 'bg-primary' : 'bg-placeholder',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <strong>{readableRuleText(event.description)}</strong>
                  <EventRuleLinks payload={event.payload} />
                  {event.dice && (
                    <small className="mt-0.5 block text-xs text-muted-foreground">
                      Dice: {event.dice.map(die => `d${die.sides}=${die.value}`).join(' ')}
                    </small>
                  )}
                  <small className="mt-0.5 block text-xs text-muted-foreground">
                    {event.actorName ?? (event.origin === 'clock' ? 'Game clock' : 'Engine')} ·{' '}
                    {new Date(event.createdAt).toLocaleString()}
                  </small>
                </div>
                {meta && <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>}
              </li>
            );
          })}
        </ol>
      )}
      <div className="mt-5 flex items-center gap-3">
        {before !== undefined && (
          <Button variant="outline" onClick={() => setBefore(undefined)}>
            Latest activity
          </Button>
        )}
        <Button
          variant="outline"
          disabled={result.nextBefore === null}
          onClick={() => result.nextBefore !== null && setBefore(result.nextBefore)}
        >
          Older activity
        </Button>
      </div>
    </>
  );
}
