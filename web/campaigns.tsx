import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { ErrorNotice, Loading, useCommand } from './ui';
import { FoesPanel } from './foes';

export function CampaignsPage() {
  const campaigns = useQuery(api.campaigns.list);
  const create = useMutation(api.campaigns.create);
  const requests = useQuery(api.campaigns.myRequests);
  const command = useCommand();
  const navigate = useNavigate();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR ADVENTURES</p>
          <h1>Campaigns</h1>
          <p className="muted">Prepare a session. Gather your players. Make your story.</p>
        </div>
      </div>
      <div className="columns">
        <section>
          <h2>
            Your tables <span className="count">{campaigns?.length ?? '—'}</span>
          </h2>
          {campaigns === undefined ? (
            <Loading />
          ) : campaigns.length === 0 ? (
            <div className="panel empty">
              <h3>Your first adventure awaits</h3>
              <p>Create a campaign, or use an invitation from your Director.</p>
            </div>
          ) : (
            <div className="stack">
              {campaigns.map(c => (
                <Link
                  className="panel campaign-card"
                  to="/campaigns/$campaignId"
                  params={{ campaignId: c.id }}
                  key={c.id}
                >
                  <span className="card-icon">✦</span>
                  <div>
                    <h3>{c.name}</h3>
                    <p className="muted">
                      {c.activeSessionId ? 'Session in progress' : 'Ready for your next session'}
                    </p>
                  </div>
                  <span>→</span>
                </Link>
              ))}
            </div>
          )}
          {requests && requests.length > 0 && (
            <section className="panel">
              <h2>Your join requests</h2>
              {requests.map(r => (
                <div key={r.id} className="list-row">
                  <span>{r.campaignName}</span>
                  <span className="badge">{r.status}</span>
                  {r.status === 'pending' && <WithdrawRequest requestId={r.id} />}
                </div>
              ))}
            </section>
          )}
        </section>
        <aside className="stack">
          <section className="panel">
            <h2>Create a campaign</h2>
            <p className="muted">You’ll be its Director.</p>
            <form
              className="stack"
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
              <label className="field">
                Campaign name
                <input name="name" required maxLength={100} placeholder="The road to Blackcastle" />
              </label>
              <ErrorNotice error={command.error} />
              <button disabled={command.pending}>
                {command.pending ? 'Creating…' : 'Create campaign'}
              </button>
            </form>
          </section>
          <section className="panel">
            <h2>Have an invitation?</h2>
            <form
              className="stack"
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
              <label className="field">
                Campaign code or link
                <input name="code" required placeholder="Paste your invitation" />
              </label>
              <button className="secondary">Find campaign</button>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}
function WithdrawRequest({ requestId }: { requestId: Id<'joinRequests'> }) {
  const withdraw = useMutation(api.campaigns.withdrawRequest);
  const command = useCommand();
  return (
    <div>
      <button
        className="secondary"
        disabled={command.pending}
        onClick={() =>
          void command.run(
            commandId => withdraw({ requestId, commandId }),
            JSON.stringify(['campaign.withdraw', { requestId }]),
          )
        }
      >
        Withdraw
      </button>
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
      <section className="panel">
        <h1>Invitation unavailable</h1>
        <p>This invitation may have been replaced. Ask the Director for their current link.</p>
        <Link to="/">Back to campaigns</Link>
      </section>
    );
  return (
    <section className="panel narrow">
      <p className="eyebrow">YOU’RE INVITED</p>
      <h1>{campaign.name}</h1>
      <p>Directed by {campaign.ownerName}</p>
      <p className="muted">The Director reviews your request before you can enter the campaign.</p>
      {!isAuthenticated ? (
        <Link className="button" to="/login" search={{ next: `/join/${shareCode}` }}>
          Sign in to request membership
        </Link>
      ) : sent ? (
        <p className="notice" role="status">
          Your request has been saved. Its status appears on your campaigns page.
        </p>
      ) : (
        <button
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
        </button>
      )}
      <ErrorNotice error={command.error} />
      <p>
        <Link to="/">Back to campaigns</Link>
      </p>
    </section>
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
  return (
    <>
      <Link to="/" className="back">
        ← Campaigns
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{director ? 'DIRECTOR’S WORKSPACE' : 'YOUR CAMPAIGN'}</p>
          <h1>{campaign.name}</h1>
          <p className="muted">
            {campaign.members.length} members ·{' '}
            {active
              ? active.status === 'paused'
                ? 'Session paused'
                : 'Session running'
              : 'Between sessions'}
          </p>
        </div>
        <span className="badge">
          {director
            ? 'Director'
            : active?.selectedPlayerIds.includes(viewer.userId)
              ? 'Player'
              : 'Observer'}
        </span>
      </div>
      <div className="columns">
        <div className="stack">
          <section className="panel">
            <div className="section-heading">
              <h2>The table</h2>
              <span className="badge">{active?.status ?? 'No active session'}</span>
            </div>
            {active ? (
              <SessionControls session={active} director={director} members={campaign.members} />
            ) : director ? (
              <StartSession campaignId={campaignId} members={campaign.members} />
            ) : (
              <p className="muted">Your Director will start the next session.</p>
            )}
            <div className="table-placeholder">
              <h3>Party roster</h3>
              <p>
                Party play and combat controls are not available in this pre-alpha yet. You can save
                character drafts.
              </p>
              <Link to="/characters">Open your characters →</Link>
            </div>
          </section>
          <section className="panel">
            <h2>Game log</h2>
            <label className="field inline">
              Show
              <select
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
            {history && sessions.find(s => s.id === history)?.status === 'closed' && (
              <p className="notice">Closed session history is read-only.</p>
            )}
            <GameLog key={history ?? 'all'} campaignId={campaignId} sessionId={history} />
          </section>
        </div>
        <aside className="stack">
          {director && campaign.shareCode && (
            <Invitations
              campaignId={campaignId}
              shareCode={campaign.shareCode}
              requests={campaign.pendingRequests}
            />
          )}
          <section className="panel">
            <h2>Campaign members</h2>
            {campaign.members.map(m => (
              <div className="list-row" key={m.userId}>
                <span>{m.displayName}</span>
                <span className="badge">
                  {m.userId === campaign.ownerId
                    ? 'Director'
                    : active?.selectedPlayerIds.includes(m.userId)
                      ? 'Player'
                      : 'Observer'}
                </span>
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
  combatActive: boolean;
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
    <fieldset disabled={disabled}>
      <legend>Players for this session</legend>
      <p className="muted">Other campaign members can observe.</p>
      <div className="check-list">
        {members.map(m => (
          <label key={m.userId}>
            <input
              type="checkbox"
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
    <div className="stack">
      <PlayerSelection
        members={members}
        selected={selected}
        setSelected={setSelected}
        disabled={command.pending}
      />
      <ErrorNotice error={command.error} />
      <button
        disabled={command.pending}
        onClick={() =>
          void command.run(
            commandId => start({ campaignId, selectedPlayerIds: selected, commandId }),
            JSON.stringify(['session.start', { campaignId, selectedPlayerIds: selected }]),
          )
        }
      >
        {command.pending ? 'Starting…' : 'Start session'}
      </button>
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
  if (!director)
    return (
      <p className="notice">
        {session.status === 'paused'
          ? 'The session is paused. You can still read the table.'
          : 'The session is running. Your selection as a player is managed by the Director.'}
      </p>
    );
  return (
    <div className="stack">
      <div className="row">
        <button
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
        </button>
        <button
          className="secondary"
          disabled={command.pending || session.combatActive}
          onClick={() =>
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
            )
          }
        >
          End session
        </button>
      </div>
      <ErrorNotice error={command.error} />
      <details>
        <summary>Manage session players</summary>
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
    <div className="stack">
      <PlayerSelection
        members={members}
        selected={selected}
        setSelected={setSelected}
        disabled={command.pending || session.combatActive}
      />
      <button
        className="secondary"
        disabled={command.pending || session.combatActive}
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
      </button>
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
    <section className="panel">
      <h2>Invite your players</h2>
      <p className="muted">Share this link. You approve who joins.</p>
      <label className="field">
        Invitation link
        <input
          readOnly
          value={`${window.location.origin}/join/${shareCode}`}
          onFocus={e => e.currentTarget.select()}
        />
      </label>
      <button
        className="text-button"
        disabled={command.pending}
        onClick={() =>
          void command.run(
            commandId => regenerate({ campaignId, commandId }),
            JSON.stringify(['campaign.rotate', { campaignId }]),
          )
        }
      >
        Replace invitation link
      </button>
      <ErrorNotice error={command.error} />
      <h3>Join requests</h3>
      {requests.length === 0 ? (
        <p className="muted">No pending requests.</p>
      ) : (
        requests.map(r => <ReviewRequest key={r.id} request={r} />)
      )}
    </section>
  );
}
function ReviewRequest({ request }: { request: { id: Id<'joinRequests'>; displayName: string } }) {
  const approve = useMutation(api.campaigns.approveRequest);
  const decline = useMutation(api.campaigns.declineRequest);
  const command = useCommand();
  return (
    <div className="stack request">
      <strong>{request.displayName}</strong>
      <div className="row">
        <button
          disabled={command.pending}
          onClick={() =>
            void command.run(
              commandId => approve({ requestId: request.id, commandId }),
              JSON.stringify(['campaign.approve', { requestId: request.id }]),
            )
          }
        >
          Approve
        </button>
        <button
          className="secondary"
          disabled={command.pending}
          onClick={() =>
            void command.run(
              commandId => decline({ requestId: request.id, commandId }),
              JSON.stringify(['campaign.decline', { requestId: request.id }]),
            )
          }
        >
          Decline
        </button>
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
      <p className="muted">
        Session and campaign activity is recorded here. Combat action entries are not available yet.
      </p>
      {result.events.length === 0 ? (
        <p className="empty">No recorded activity yet.</p>
      ) : (
        <ol className="game-log">
          {result.events.map(event => (
            <li key={event.id}>
              <span className="log-dot" />
              <div>
                <strong>{event.description}</strong>
                <small>
                  {event.actorName} · {new Date(event.createdAt).toLocaleString()}
                </small>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="row">
        {before !== undefined && (
          <button className="secondary" onClick={() => setBefore(undefined)}>
            Latest activity
          </button>
        )}
        {result.nextBefore !== null && (
          <button className="secondary" onClick={() => setBefore(result.nextBefore!)}>
            Older activity
          </button>
        )}
      </div>
    </>
  );
}
