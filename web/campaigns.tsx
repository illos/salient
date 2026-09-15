// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { Badge } from './components/ui/badge';
import { Button, buttonVariants } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { ErrorNotice, Eyebrow, Field, Loading, Notice, SectionHeading, useCommand } from './ui';
import { FoesPanel } from './foes';
import { PartyPanel } from './character-sheet/party';
import { CommandConsole } from './command-input';
import { VoidCard } from './table/void-card';

export function CampaignsPage() {
  const campaigns = useQuery(api.campaigns.list);
  const create = useMutation(api.campaigns.create);
  const requests = useQuery(api.campaigns.myRequests);
  const command = useCommand();
  const navigate = useNavigate();
  return (
    <>
      <div className="rule-strong mb-8 pb-5">
        <Eyebrow>Your adventures</Eyebrow>
        <h1>Campaigns</h1>
        <p className="mt-1 text-muted-foreground">
          Prepare a session. Gather your players. Make your story.
        </p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-8">
        <section className="flex flex-col gap-8">
          <div>
            <SectionHeading aside={campaigns ? `${campaigns.length} total` : undefined}>
              Your tables
            </SectionHeading>
            {campaigns === undefined ? (
              <Loading />
            ) : campaigns.length === 0 ? (
              <div className="rounded-md border border-dashed border-input px-6 py-10 text-center">
                <h3>Your first adventure awaits</h3>
                <p className="mt-1 text-muted-foreground">
                  Create a campaign, or use an invitation from your Director.
                </p>
              </div>
            ) : (
              <ul className="m-0 list-none p-0">
                {campaigns.map(c => (
                  <li key={c.id} className="rule-soft">
                    <Link
                      className="flex items-center gap-4 py-4 transition-colors duration-(--motion-fast) hover:bg-muted hover:no-underline"
                      to="/campaigns/$campaignId"
                      params={{ campaignId: c.id }}
                    >
                      <span
                        aria-hidden
                        className={
                          c.activeSessionId
                            ? 'size-2.5 shrink-0 rounded-full bg-primary'
                            : 'size-2.5 shrink-0 rounded-full bg-placeholder'
                        }
                      />
                      <span className="flex-1">
                        <span className="block text-lg font-bold">{c.name}</span>
                        <span className="block text-sm text-muted-foreground">
                          {c.activeSessionId
                            ? 'Session in progress'
                            : 'Ready for your next session'}
                        </span>
                      </span>
                      <span className="caps text-muted-foreground">Open →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {requests && requests.length > 0 && (
            <div>
              <SectionHeading>Your join requests</SectionHeading>
              {requests.map(r => (
                <div key={r.id} className="rule-soft flex items-center justify-between gap-3 py-3">
                  <span>{r.campaignName}</span>
                  <span className="flex items-center gap-3">
                    <Badge variant="outline">{r.status}</Badge>
                    {r.status === 'pending' && <WithdrawRequest requestId={r.id} />}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
        <aside className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div>
                <h2>Create a campaign</h2>
                <p className="text-sm text-muted-foreground">You’ll be its Director.</p>
              </div>
              <form
                className="flex flex-col gap-4"
                onSubmit={async e => {
                  e.preventDefault();
                  const name = String(new FormData(e.currentTarget).get('name'));
                  await command.run(
                    async commandId => {
                      const id = await create({ name, commandId });
                      await navigate({ to: '/campaigns/$campaignId', params: { campaignId: id } });
                    },
                    JSON.stringify(['campaign.create', { name }]),
                  );
                }}
              >
                <Field label="Campaign name">
                  <Input
                    name="name"
                    required
                    maxLength={100}
                    placeholder="The road to Blackcastle"
                  />
                </Field>
                <ErrorNotice error={command.error} />
                <Button type="submit" disabled={command.pending}>
                  {command.pending ? 'Creating…' : 'Create campaign'}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-4">
              <h2>Have an invitation?</h2>
              <form
                className="flex flex-col gap-4"
                onSubmit={e => {
                  e.preventDefault();
                  let shareCode = String(new FormData(e.currentTarget).get('code')).trim();
                  try {
                    shareCode = new URL(shareCode).pathname.split('/').filter(Boolean).at(-1) || '';
                  } catch {
                    /* Plain code. */
                  }
                  if (shareCode) void navigate({ to: '/join/$shareCode', params: { shareCode } });
                }}
              >
                <Field label="Campaign code or link">
                  <Input name="code" required placeholder="Paste your invitation" />
                </Field>
                <Button type="submit" variant="outline">
                  Find campaign
                </Button>
              </form>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
function WithdrawRequest({ requestId }: { requestId: Id<'joinRequests'> }) {
  const withdraw = useMutation(api.campaigns.withdrawRequest);
  const command = useCommand();
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={command.pending}
        onClick={() =>
          void command.run(
            commandId => withdraw({ requestId, commandId }),
            JSON.stringify(['campaign.withdraw', { requestId }]),
          )
        }
      >
        Withdraw
      </Button>
      <ErrorNotice error={command.error} />
    </div>
  );
}
export function JoinPage({ shareCode }: { shareCode: string }) {
  const { isAuthenticated } = useConvexAuth();
  const campaign = useQuery(api.campaigns.preview, { shareCode });
  const request = useMutation(api.campaigns.requestJoin);
  const command = useCommand();
  const [sent, setSent] = useState(false);
  if (campaign === undefined) return <Loading />;
  if (!campaign)
    return (
      <Card className="w-full max-w-xl">
        <CardContent className="flex flex-col gap-3">
          <h1>Invitation unavailable</h1>
          <p>This invitation may have been replaced. Ask the Director for their current link.</p>
          <Link to="/">Back to campaigns</Link>
        </CardContent>
      </Card>
    );
  return (
    <Card className="w-full max-w-xl">
      <CardContent className="flex flex-col gap-4">
        <div>
          <Eyebrow>You’re invited</Eyebrow>
          <h1>{campaign.name}</h1>
          <p className="mt-1">Directed by {campaign.ownerName}</p>
          <p className="text-sm text-muted-foreground">
            The Director reviews your request before you can enter the campaign.
          </p>
        </div>
        {!isAuthenticated ? (
          <Link
            to="/login"
            search={{ next: `/join/${shareCode}` }}
            className={buttonVariants({ className: 'w-fit hover:no-underline' })}
          >
            Sign in to request membership
          </Link>
        ) : sent ? (
          <Notice role="status">
            Your request has been saved. Its status appears on your campaigns page.
          </Notice>
        ) : (
          <Button
            className="w-fit"
            disabled={command.pending}
            onClick={async () => {
              if (
                await command.run(
                  commandId => request({ shareCode, commandId }),
                  JSON.stringify(['campaign.request', { shareCode }]),
                )
              )
                setSent(true);
            }}
          >
            {command.pending ? 'Sending…' : 'Request to join'}
          </Button>
        )}
        <ErrorNotice error={command.error} />
        <p>
          <Link to="/">Back to campaigns</Link>
        </p>
      </CardContent>
    </Card>
  );
}
export function CampaignPage({ campaignId }: { campaignId: Id<'campaigns'> }) {
  const campaign = useQuery(api.campaigns.get, { campaignId });
  const viewer = useQuery(api.auth.viewer);
  const sessions = useQuery(api.sessions.list, { campaignId });
  const [history, setHistory] = useState<Id<'sessions'> | undefined>();
  if (campaign === undefined || viewer === undefined || sessions === undefined) return <Loading />;
  if (!viewer) return null;
  const director = campaign.ownerId === viewer.userId;
  const active = sessions.find(s => s.id === campaign.activeSessionId);
  const role = director
    ? 'Director'
    : active?.selectedPlayerIds.includes(viewer.userId)
      ? 'Player'
      : 'Observer';
  return (
    <>
      <Link to="/" className="mb-4 inline-block text-sm text-muted-foreground">
        ← Campaigns
      </Link>
      <div className="rule-strong mb-8 flex items-end justify-between gap-6 pb-5">
        <div>
          <Eyebrow>{director ? 'Director’s workspace' : 'Your campaign'}</Eyebrow>
          <h1>{campaign.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {campaign.members.length} members ·{' '}
            {active
              ? active.status === 'paused'
                ? 'Session paused'
                : 'Session running'
              : 'Between sessions'}
          </p>
        </div>
        <Badge variant={director ? 'default' : 'outline'} className="h-9 px-4 text-xs">
          {role}
        </Badge>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-8">
        <div className="flex flex-col gap-8">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <h2>The table</h2>
                <span className="eyebrow mb-0">{active?.status ?? 'No active session'}</span>
              </div>
              {active && (
                <Link
                  to="/campaigns/$campaignId/table"
                  params={{ campaignId }}
                  className="text-sm font-bold"
                >
                  Open the table →
                </Link>
              )}
              {active ? (
                <SessionControls session={active} director={director} members={campaign.members} />
              ) : director ? (
                <StartSession campaignId={campaignId} members={campaign.members} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Your Director will start the next session.
                </p>
              )}
              <div className="rule-soft border-t pt-4">
                {/* A02: admitted heroes and the admission review queue. */}
                <PartyPanel campaignId={campaignId} director={director} />
              </div>
            </CardContent>
          </Card>
          <CommandConsole campaignId={campaignId} sessionRevision={active?.revision} />
          <section>
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
                        {new Date(s.startedAt).toLocaleString()} · {s.status}
                        {i === 0 ? ' · latest' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              }
            >
              Game log
            </SectionHeading>
            {history && sessions.find(s => s.id === history)?.status === 'closed' && (
              <Notice className="mb-4">Closed session history is read-only.</Notice>
            )}
            <GameLog key={history ?? 'all'} campaignId={campaignId} sessionId={history} />
          </section>
        </div>
        <aside className="flex flex-col gap-8">
          {director && campaign.shareCode && (
            <Invitations
              campaignId={campaignId}
              shareCode={campaign.shareCode}
              requests={campaign.pendingRequests}
            />
          )}
          <section>
            <SectionHeading aside={String(campaign.members.length)}>
              Campaign members
            </SectionHeading>
            {campaign.members.map(m => (
              <div
                className="rule-soft flex items-center justify-between gap-3 py-3"
                key={m.userId}
              >
                <span>{m.displayName}</span>
                <Badge variant={m.userId === campaign.ownerId ? 'default' : 'outline'}>
                  {m.userId === campaign.ownerId
                    ? 'Director'
                    : active?.selectedPlayerIds.includes(m.userId)
                      ? 'Player'
                      : 'Observer'}
                </Badge>
              </div>
            ))}
          </section>
          <FoesPanel campaignId={campaignId} director={director} />
        </aside>
      </div>
    </>
  );
}
type Session = {
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
type Member = { userId: Id<'users'>; displayName: string };
function PlayerSelection({
  members,
  selected,
  setSelected,
  disabled,
}: {
  members: Member[];
  selected: Id<'users'>[];
  setSelected: (ids: Id<'users'>[]) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="m-0 border-0 p-0">
      <legend className="caps mb-1 text-muted-foreground">
        Players for this session · others observe
      </legend>
      <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
        {members.map(m => (
          <label key={m.userId} className="flex items-center gap-2">
            <input
              type="checkbox"
              className="size-4 accent-secondary"
              checked={selected.includes(m.userId)}
              onChange={e =>
                setSelected(
                  e.target.checked
                    ? [...selected, m.userId]
                    : selected.filter(id => id !== m.userId),
                )
              }
            />
            {m.displayName}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function StartSession({ campaignId, members }: { campaignId: Id<'campaigns'>; members: Member[] }) {
  const [selected, setSelected] = useState<Id<'users'>[]>([]);
  const start = useMutation(api.sessions.start);
  const command = useCommand();
  return (
    <div className="flex flex-col gap-4">
      <PlayerSelection
        members={members}
        selected={selected}
        setSelected={setSelected}
        disabled={command.pending}
      />
      <ErrorNotice error={command.error} />
      <Button
        className="w-fit"
        disabled={command.pending}
        onClick={() =>
          void command.run(
            commandId => start({ campaignId, selectedPlayerIds: selected, commandId }),
            JSON.stringify(['session.start', { campaignId, selectedPlayerIds: selected }]),
          )
        }
      >
        {command.pending ? 'Starting…' : 'Start session'}
      </Button>
    </div>
  );
}
function SessionControls({
  session,
  director,
  members,
}: {
  session: Session;
  director: boolean;
  members: Member[];
}) {
  const transition = useMutation(api.sessions.transition);
  const command = useCommand();
  const [closing, setClosing] = useState<Id<'encounters'> | null>(null);
  if (!director)
    return (
      <Notice>
        {session.status === 'paused'
          ? 'The session is paused. You can still read the table.'
          : 'The session is running. Your selection as a player is managed by the Director.'}
      </Notice>
    );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={command.pending}
          onClick={() =>
            void command.run(
              commandId =>
                transition({
                  sessionId: session.id,
                  expectedRevision: session.revision,
                  action: session.status === 'running' ? 'pause' : 'resume',
                  commandId,
                }),
              JSON.stringify([
                'session.transition',
                {
                  sessionId: session.id,
                  expectedRevision: session.revision,
                  action: session.status === 'running' ? 'pause' : 'resume',
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
        <VoidCard
          key={session.encounter.id}
          campaignId={session.campaignId}
          encounterId={session.encounter.id}
          session={{ id: session.id, revision: session.revision }}
          paused={session.status === 'paused'}
          onCancel={() => setClosing(null)}
          onDone={() => setClosing(null)}
        />
      )}
      <ErrorNotice error={command.error} />
      <details className="text-sm">
        <summary className="cursor-pointer py-1 text-muted-foreground">
          Manage session players
        </summary>
        <EditPlayers
          key={`${session.id}:${session.revision}`}
          session={session}
          members={members}
        />
      </details>
    </div>
  );
}
function EditPlayers({ session, members }: { session: Session; members: Member[] }) {
  const [selected, setSelected] = useState(session.selectedPlayerIds);
  const save = useMutation(api.sessions.setPlayers);
  const command = useCommand();
  return (
    <div className="flex flex-col gap-4 pt-3">
      <PlayerSelection
        members={members}
        selected={selected}
        setSelected={setSelected}
        disabled={command.pending || session.encounter?.status === 'committed'}
      />
      <Button
        variant="outline"
        className="w-fit"
        disabled={command.pending || session.encounter?.status === 'committed'}
        onClick={() =>
          void command.run(
            commandId =>
              save({
                sessionId: session.id,
                expectedRevision: session.revision,
                selectedPlayerIds: selected,
                commandId,
              }),
            JSON.stringify([
              'session.players',
              {
                sessionId: session.id,
                expectedRevision: session.revision,
                selectedPlayerIds: selected,
              },
            ]),
          )
        }
      >
        Save players
      </Button>
      <ErrorNotice error={command.error} />
    </div>
  );
}
function Invitations({
  campaignId,
  shareCode,
  requests,
}: {
  campaignId: Id<'campaigns'>;
  shareCode: string;
  requests: { id: Id<'joinRequests'>; userId: Id<'users'>; displayName: string }[];
}) {
  const regenerate = useMutation(api.campaigns.regenerateShareCode);
  const command = useCommand();
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div>
          <h2>Invite your players</h2>
          <p className="text-sm text-muted-foreground">Share this link. You approve who joins.</p>
        </div>
        <Field label="Invitation link">
          <Input
            readOnly
            className="text-xs"
            value={`${window.location.origin}/join/${shareCode}`}
            onFocus={e => e.currentTarget.select()}
          />
        </Field>
        <Button
          variant="link"
          className="w-fit"
          disabled={command.pending}
          onClick={() =>
            void command.run(
              commandId => regenerate({ campaignId, commandId }),
              JSON.stringify(['campaign.rotate', { campaignId }]),
            )
          }
        >
          Replace invitation link
        </Button>
        <ErrorNotice error={command.error} />
        <div className="rule-soft border-t pt-4">
          <p className="caps mb-2 text-muted-foreground">
            Join requests{' '}
            {requests.length > 0 && <span className="text-foreground">{requests.length}</span>}
          </p>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending requests.</p>
          ) : (
            requests.map(r => <ReviewRequest key={r.id} request={r} />)
          )}
        </div>
      </CardContent>
    </Card>
  );
}
function ReviewRequest({ request }: { request: { id: Id<'joinRequests'>; displayName: string } }) {
  const approve = useMutation(api.campaigns.approveRequest);
  const decline = useMutation(api.campaigns.declineRequest);
  const command = useCommand();
  return (
    <div className="rule-soft flex flex-col gap-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <strong>{request.displayName}</strong>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={command.pending}
            onClick={() =>
              void command.run(
                commandId => approve({ requestId: request.id, commandId }),
                JSON.stringify(['campaign.approve', { requestId: request.id }]),
              )
            }
          >
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={command.pending}
            onClick={() =>
              void command.run(
                commandId => decline({ requestId: request.id, commandId }),
                JSON.stringify(['campaign.decline', { requestId: request.id }]),
              )
            }
          >
            Decline
          </Button>
        </div>
      </div>
      <ErrorNotice error={command.error} />
    </div>
  );
}
function GameLog({
  campaignId,
  sessionId,
}: {
  campaignId: Id<'campaigns'>;
  sessionId?: Id<'sessions'>;
}) {
  const [before, setBefore] = useState<number | undefined>();
  const result = useQuery(api.events.list, {
    campaignId,
    ...(sessionId ? { sessionId } : {}),
    ...(before === undefined ? {} : { before }),
  });
  if (!result) return <Loading>Loading the log…</Loading>;
  return (
    <>
      <p className="mb-2 text-sm text-muted-foreground">
        Session and campaign activity is recorded here.
      </p>
      {result.events.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No recorded activity yet.</p>
      ) : (
        <ol className="m-0 list-none p-0">
          {result.events.map((event, index) => (
            <li key={event.id} className="rule-soft flex items-start gap-4 py-3 text-sm">
              <span
                aria-hidden
                className={
                  index === 0 && before === undefined
                    ? 'mt-1.5 size-2 shrink-0 rounded-full bg-primary'
                    : 'mt-1.5 size-2 shrink-0 rounded-full bg-placeholder'
                }
              />
              <div className="flex-1">
                <strong>{event.description}</strong>
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
      <div className="mt-4 flex items-center gap-3">
        {before !== undefined && (
          <Button variant="outline" onClick={() => setBefore(undefined)}>
            Latest activity
          </Button>
        )}
        {result.nextBefore !== null && (
          <Button variant="outline" onClick={() => setBefore(result.nextBefore!)}>
            Older activity
          </Button>
        )}
      </div>
    </>
  );
}
