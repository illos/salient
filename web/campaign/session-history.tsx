// SPDX-License-Identifier: GPL-3.0-only
/**
 * The "Session history" section of the campaign home (V68; docs/table-spec.md#reading-session-history):
 * closed sessions newest first, each row `Session n` plus the Director's optional title, the
 * participants as small discs, when it ended, and RECAP. Five rows show until ALL n SESSIONS. The
 * Director edits a title inline through `sessions.setTitle`.
 *
 * RECAP is, for now, that session's game log: the same `events.list` read with `sessionId` and
 * OLDER ACTIVITY paging the campaign log used before V68, shown as a drill-in under the heading
 * with the read-only notice. The recap abstraction over log, chat and notes is later scope.
 */
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { cn } from 'cn';
import { Pencil } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Disc } from '../components/disc';
import { Loading, Notice, SectionHeading, useCommand } from '../ui';
import { EventRuleLinks } from '../rules/event-links';
import { readableRuleText } from '../rules/reference';
import { relativeTime, useNow, type Member, type Session } from './header';

const FIRST_PAGE = 5;

export function sessionLabel(session: Session): string {
  return session.title
    ? `Session ${session.number} · ${session.title}`
    : `Session ${session.number}`;
}

function TitleEditor({ session, onDone }: { session: Session; onDone: () => void }) {
  const setTitle = useMutation(api.sessions.setTitle);
  const command = useCommand();
  const [title, setValue] = useState(session.title ?? '');
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={e => {
        e.preventDefault();
        void command
          .run(
            commandId => setTitle({ sessionId: session.id, title, commandId }),
            JSON.stringify(['session.title', { sessionId: session.id, title }]),
          )
          .then(ok => ok && onDone());
      }}
    >
      <Input
        autoFocus
        aria-label={`Title for session ${session.number}`}
        className="h-8 max-w-xs text-sm"
        maxLength={100}
        placeholder="Untitled"
        value={title}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Escape' && onDone()}
      />
      <Button type="submit" size="sm" disabled={command.pending}>
        Save
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onDone}>
        Cancel
      </Button>
    </form>
  );
}

export function SessionHistory({
  campaignId,
  sessions,
  members,
  director,
}: {
  campaignId: Id<'campaigns'>;
  /** Newest first, as `sessions.list` returns them. */
  sessions: Session[];
  members: Member[];
  director: boolean;
}) {
  const now = useNow();
  const [all, setAll] = useState(false);
  const [editing, setEditing] = useState<Id<'sessions'> | null>(null);
  const [recap, setRecap] = useState<Id<'sessions'> | null>(null);
  const closed = sessions.filter(s => s.status === 'closed');
  const shown = all ? closed : closed.slice(0, FIRST_PAGE);
  const nameOf = (id: Id<'users'>) =>
    members.find(m => m.userId === id)?.displayName ?? 'Former player';
  const open = recap ? closed.find(s => s.id === recap) : undefined;
  if (open)
    return (
      <section aria-labelledby="session-history-heading">
        <SectionHeading
          aside={
            <Button variant="link" className="caps" onClick={() => setRecap(null)}>
              ← All sessions
            </Button>
          }
        >
          <span id="session-history-heading">{sessionLabel(open)}</span>
        </SectionHeading>
        <Notice className="mb-4">Closed session history is read-only.</Notice>
        <SessionLog key={open.id} campaignId={campaignId} sessionId={open.id} />
      </section>
    );
  return (
    <section aria-labelledby="session-history-heading">
      <SectionHeading aside={`${closed.length} ${closed.length === 1 ? 'session' : 'sessions'}`}>
        <span id="session-history-heading">Session history</span>
      </SectionHeading>
      {closed.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No sessions played yet.</p>
      ) : (
        <ol className="m-0 list-none p-0">
          {shown.map((session, index) => (
            <li
              key={session.id}
              data-testid="session-row"
              className={cn(
                'rule-soft flex items-center gap-4 py-4',
                !all && index === FIRST_PAGE - 1 && closed.length > FIRST_PAGE && 'opacity-60',
              )}
            >
              <span className="w-24 shrink-0 text-lg font-bold">Session {session.number}</span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                {editing === session.id ? (
                  <TitleEditor session={session} onDone={() => setEditing(null)} />
                ) : (
                  <>
                    <span
                      className={cn(
                        'truncate text-sm',
                        session.title ? 'font-semibold' : 'text-muted-foreground',
                      )}
                    >
                      {session.title ?? 'Untitled'}
                    </span>
                    {director && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Edit title of session ${session.number}`}
                        onClick={() => setEditing(session.id)}
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                    )}
                  </>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-1" aria-label="Players">
                {session.selectedPlayerIds.map(id => (
                  <Disc key={id} name={nameOf(id)} size="sm" label={nameOf(id)} />
                ))}
              </span>
              <span className="w-24 shrink-0 text-right text-sm text-muted-foreground">
                {session.closedAt ? relativeTime(session.closedAt, now) : ''}
              </span>
              <Button variant="outline" size="sm" onClick={() => setRecap(session.id)}>
                Recap
              </Button>
            </li>
          ))}
        </ol>
      )}
      {closed.length > FIRST_PAGE && (
        <div className="mt-5">
          <Button variant="outline" onClick={() => setAll(a => !a)}>
            {all ? 'Recent sessions' : `All ${closed.length} sessions`}
          </Button>
        </div>
      )}
    </section>
  );
}

/** One session's game log, paged like the pre-V68 campaign log. */
function SessionLog({
  campaignId,
  sessionId,
}: {
  campaignId: Id<'campaigns'>;
  sessionId: Id<'sessions'>;
}) {
  const [before, setBefore] = useState<number | undefined>();
  const result = useQuery(api.events.list, {
    campaignId,
    sessionId,
    ...(before === undefined ? {} : { before }),
  });
  if (!result) return <Loading>Loading the log…</Loading>;
  return (
    <>
      {result.events.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No recorded activity.</p>
      ) : (
        <ol className="m-0 list-none p-0">
          {result.events.map((event, index) => (
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
            </li>
          ))}
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
