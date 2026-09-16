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
import { Eyebrow, Field, Loading, Notice, SectionHeading, useCommand } from './ui';
import { PartyPanel } from './character-sheet/party';
import { CommandConsole } from './command-input';
import { CampaignHeader, type CampaignRole } from './campaign/header';
import { NextSessionCard } from './campaign/next-session';
import { ActivitySection } from './campaign/activity';
import { InviteCard } from './campaign/invite';
import { MembersSection } from './campaign/members';
import { FoesPrepared } from './campaign/foes-prepared';

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
          <p>
            This invitation may have been replaced. Ask the Director for their current code or link.
          </p>
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
  // The next session's player selection lives here because START SESSION sits in the header
  // while the tiles sit in the "Next session" card (campaign-home.png).
  const [selected, setSelected] = useState<Id<'users'>[]>([]);
  if (campaign === undefined || viewer === undefined || sessions === undefined) return <Loading />;
  if (!viewer) return null;
  const director = campaign.ownerId === viewer.userId;
  const active = sessions.find(s => s.id === campaign.activeSessionId);
  const role: CampaignRole = director
    ? 'Director'
    : active?.selectedPlayerIds.includes(viewer.userId)
      ? 'Player'
      : 'Observer';
  const lastClosed = sessions.find(s => s.status === 'closed' && s.closedAt !== null);
  return (
    <>
      <CampaignHeader
        campaignId={campaignId}
        name={campaign.name}
        memberCount={campaign.members.length}
        role={role}
        director={director}
        active={active}
        lastPlayedAt={lastClosed?.closedAt ?? null}
        selectedPlayerIds={selected}
      />
      <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-8">
        <div className="flex flex-col gap-10">
          <NextSessionCard
            campaignId={campaignId}
            active={active}
            director={director}
            members={campaign.members}
            viewerId={viewer.userId}
            selected={selected}
            setSelected={setSelected}
          />
          {/* A02: admitted heroes and the admission review queue. */}
          <PartyPanel campaignId={campaignId} director={director} />
          <ActivitySection campaignId={campaignId} sessions={sessions} />
          {/* The operations rule keeps the console on this page; the mockup has no card for it. */}
          <details className="rule-soft border-t pt-3" data-testid="command-disclosure">
            <summary className="caps cursor-pointer py-1 text-muted-foreground">Command</summary>
            <div className="pt-4">
              <CommandConsole campaignId={campaignId} sessionRevision={active?.revision} />
            </div>
          </details>
        </div>
        <aside className="flex flex-col gap-10">
          {director && campaign.shareCode && (
            <InviteCard
              campaignId={campaignId}
              shareCode={campaign.shareCode}
              requests={campaign.pendingRequests}
            />
          )}
          <MembersSection
            members={campaign.members}
            ownerId={campaign.ownerId}
            viewerId={viewer.userId}
            active={active}
          />
          <FoesPrepared campaignId={campaignId} director={director} />
        </aside>
      </div>
    </>
  );
}
