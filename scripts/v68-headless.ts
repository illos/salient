// SPDX-License-Identifier: GPL-3.0-only
/**
 * V68 headless proof (docs/build/README.md#programmatic-headless-completion-gate): the campaign
 * home's capabilities exercised through the same authenticated Convex operations the page uses,
 * with every claim read back from the backend afterwards. No browser, no UI setup, no fixture
 * writes: three accounts are registered through Better Auth, and everything else goes through
 * `campaigns`, `sessions`, `presence`, `chat`, `characters`, `events`, `history` and `foes`.
 *
 * Environment: VITE_CONVEX_URL, VITE_CONVEX_SITE_URL and VITE_SITE_URL as the CT114 build service
 * supplies them; optional SALIENT_HEADLESS_REPORT (JSON output path). Exit status 1 on any failed
 * step. Sign-ups are paced because Better Auth allows three per ten seconds per client address.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { ConvexHttpClient } from 'convex/browser';
import { createAuthClient } from 'better-auth/client';
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';
import { api } from '../convex/_generated/api.js';
import type { Id } from '../convex/_generated/dataModel.js';
import type { EvaluationInput } from '../shared/contracts/characterEvaluation.ts';
import type { DecisionDefinitions } from '../shared/evaluate/definitions.ts';
import { draftSelectionsFrom } from '../shared/evaluate/draft.ts';

function required(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new Error(`Set ${name} (VITE_CONVEX_URL, VITE_CONVEX_SITE_URL, VITE_SITE_URL).`);
  return value;
}
const url = required('VITE_CONVEX_URL');
const siteUrl = required('VITE_CONVEX_SITE_URL');
const origin = required('VITE_SITE_URL');
const reportPath = process.env.SALIENT_HEADLESS_REPORT ?? 'v68-headless.json';
const run = `v68-${Date.now().toString(36)}`;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type Step = { step: string; ok: boolean; evidence: unknown; error?: string };
const steps: Step[] = [];
const started = Date.now();
async function step(name: string, body: () => Promise<unknown>) {
  try {
    const evidence = await body();
    steps.push({ step: name, ok: true, evidence });
    console.error(`ok   ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    steps.push({ step: name, ok: false, evidence: null, error: message });
    console.error(`FAIL ${name}: ${message}`);
  }
}
function expect(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}
async function refused(promise: Promise<unknown>, fragment: string) {
  try {
    await promise;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    expect(message.includes(fragment), `refused for another reason: ${message}`);
    return message;
  }
  throw new Error(`expected a refusal containing "${fragment}"`);
}

function authClient() {
  const storage = new Map<string, string>();
  return createAuthClient({
    baseURL: siteUrl,
    fetchOptions: { headers: { Origin: origin } },
    plugins: [
      convexClient(),
      crossDomainClient({
        storage: {
          getItem: key => storage.get(key) ?? null,
          setItem: (key, value) => {
            storage.set(key, value);
          },
        },
      }),
    ],
  });
}
type Account = {
  name: string;
  userId: Id<'users'>;
  client: ConvexHttpClient;
  auth: ReturnType<typeof authClient>;
};
async function register(name: string): Promise<Account> {
  const auth = authClient();
  const signUp = await auth.signUp.email({
    name,
    email: `${run}-${name.toLowerCase()}@headless.invalid`,
    password: `Headless-${run}-pass`,
  });
  if (signUp.error) throw new Error(`sign-up ${name}: ${signUp.error.message}`);
  const jwt = await auth.convex.token();
  if (jwt.error || !jwt.data?.token) throw new Error(`token ${name}: no token`);
  const client = new ConvexHttpClient(url, {
    logger: { logVerbose: () => {}, log: () => {}, warn: console.error, error: console.error },
  });
  client.setAuth(jwt.data.token);
  const profile = await client.mutation(api.auth.ensureProfile, {});
  return { name, userId: profile.userId, client, auth };
}

const examples = JSON.parse(
  readFileSync('shared/content/character-evaluation-examples.json', 'utf8'),
) as { examples: Record<string, { input: EvaluationInput }> };
const definitions = JSON.parse(
  readFileSync('shared/content/fury-level-one-decisions.json', 'utf8'),
) as DecisionDefinitions;
function heroSelections(name: string) {
  const selections = { ...examples.examples.complete!.input.selections, 'details.name': name };
  return draftSelectionsFrom(selections as EvaluationInput['selections'], definitions);
}

const accounts: Account[] = [];
try {
  const director = await register('Director');
  accounts.push(director);
  await sleep(4000);
  const player = await register('Player');
  accounts.push(player);
  await sleep(4000);
  const guest = await register('Guest');
  accounts.push(guest);

  let campaignId!: Id<'campaigns'>;
  await step(
    'campaign projection has no campaign-level role tags and counts sessions',
    async () => {
      campaignId = await director.client.mutation(api.campaigns.create, {
        name: `Headless ${run}`,
        commandId: `${run}-create`,
      });
      const campaign = await director.client.query(api.campaigns.get, { campaignId });
      expect(campaign.ownerId === director.userId, 'owner is the creator');
      expect(campaign.members.length === 1, 'one member');
      expect(campaign.members[0]!.heroes.length === 0, 'no heroes yet');
      expect(campaign.sessionCount === 0 && campaign.lastPlayedAt === null, 'no sessions yet');
      const keys = Object.keys(campaign.members[0]!).sort();
      expect(
        keys.join(',') === 'displayName,heroes,portraitUrl,userId',
        `member keys ${keys.join(',')}`,
      );
      return { campaignId, members: campaign.members, sessionCount: campaign.sessionCount };
    },
  );

  await step('join requests approved through the Manage players operations', async () => {
    const { shareCode } = await director.client.query(api.campaigns.get, { campaignId });
    await player.client.mutation(api.campaigns.requestJoin, {
      shareCode: shareCode!,
      commandId: `${run}-join-player`,
    });
    await guest.client.mutation(api.campaigns.requestJoin, {
      shareCode: shareCode!,
      commandId: `${run}-join-guest`,
    });
    const pending = (await director.client.query(api.campaigns.get, { campaignId }))
      .pendingRequests;
    expect(pending.length === 2, `two pending requests, saw ${pending.length}`);
    const request = pending.find(r => r.userId === player.userId)!;
    await director.client.mutation(api.campaigns.approveRequest, {
      requestId: request.id,
      commandId: `${run}-approve-player`,
    });
    const after = await director.client.query(api.campaigns.get, { campaignId });
    expect(
      after.members.some(m => m.userId === player.userId),
      'player is a member',
    );
    expect(after.pendingRequests.length === 1, 'guest still pending');
    // The pop-up's Replace control: the link and code shown come from shareCode, and rotating it
    // changes both while the pending request survives.
    await director.client.mutation(api.campaigns.regenerateShareCode, {
      campaignId,
      commandId: `${run}-rotate`,
    });
    const rotated = await director.client.query(api.campaigns.get, { campaignId });
    expect(!!rotated.shareCode && rotated.shareCode !== shareCode, 'share code replaced');
    expect(rotated.pendingRequests.length === 1, 'pending request survives rotation');
    return {
      members: after.members.map(m => m.displayName),
      pending: after.pendingRequests.length,
      shareCodeChanged: rotated.shareCode !== shareCode,
    };
  });

  await step(
    'presence: heartbeat lists a member, non-members are refused, leave removes',
    async () => {
      await refused(guest.client.mutation(api.presence.heartbeat, { campaignId }), 'unavailable');
      await refused(guest.client.query(api.presence.list, { campaignId }), 'unavailable');
      await player.client.mutation(api.presence.heartbeat, { campaignId });
      const online = await director.client.query(api.presence.list, { campaignId });
      expect(online.includes(player.userId), 'player online after heartbeat');
      expect(!online.includes(director.userId), 'director sent no heartbeat');
      await player.client.mutation(api.presence.leave, { campaignId });
      const afterLeave = await director.client.query(api.presence.list, { campaignId });
      expect(!afterLeave.includes(player.userId), 'player offline after leave');
      return { online, afterLeave };
    },
  );

  await step(
    'chat: member-only, validated, retry-safe, no game-log entry, no undo change',
    async () => {
      await refused(
        guest.client.mutation(api.chat.send, {
          campaignId,
          text: 'hi',
          commandId: `${run}-guest-chat`,
        }),
        'unavailable',
      );
      await refused(
        player.client.mutation(api.chat.send, {
          campaignId,
          text: '   ',
          commandId: `${run}-blank-chat`,
        }),
        'message',
      );
      const eventsBefore = (await director.client.query(api.events.list, { campaignId })).events
        .length;
      const undoBefore = await director.client.query(api.history.status, { campaignId });
      const sendArgs = { campaignId, text: ' Ready when you are ', commandId: `${run}-chat-1` };
      const first = await player.client.mutation(api.chat.send, sendArgs);
      const retry = await player.client.mutation(api.chat.send, sendArgs);
      expect(first === retry, 'retried send returns the same message id');
      await director.client.mutation(api.chat.send, {
        campaignId,
        text: 'Starting now.',
        commandId: `${run}-chat-2`,
      });
      const page = await player.client.query(api.chat.list, { campaignId });
      const texts = page.messages.map(m => [m.authorName, m.text]);
      expect(
        JSON.stringify(texts) ===
          JSON.stringify([
            ['Player', 'Ready when you are'],
            ['Director', 'Starting now.'],
          ]),
        `messages ${JSON.stringify(texts)}`,
      );
      const eventsAfter = (await director.client.query(api.events.list, { campaignId })).events
        .length;
      expect(eventsAfter === eventsBefore, 'chat appended no game-log event');
      const undoAfter = await director.client.query(api.history.status, { campaignId });
      expect(JSON.stringify(undoAfter) === JSON.stringify(undoBefore), 'undo window unchanged');
      return { messages: texts, eventsBefore, eventsAfter, undo: undoAfter.undo };
    },
  );

  let sessionId!: Id<'sessions'>;
  await step(
    'start session with every member (interim), title it, refuse a player title',
    async () => {
      const members = (await director.client.query(api.campaigns.get, { campaignId })).members.map(
        m => m.userId,
      );
      sessionId = await director.client.mutation(api.sessions.start, {
        campaignId,
        selectedPlayerIds: members,
        title: '  The road to Blackcastle  ',
        commandId: `${run}-start`,
      });
      let sessions = await player.client.query(api.sessions.list, { campaignId });
      const session = sessions.find(s => s.id === sessionId)!;
      expect(
        session.number === 1 && session.title === 'The road to Blackcastle',
        'numbered and titled',
      );
      expect(
        JSON.stringify([...session.selectedPlayerIds].sort()) ===
          JSON.stringify([...members].sort()),
        'all members selected',
      );
      await refused(
        player.client.mutation(api.sessions.setTitle, {
          sessionId,
          title: 'Mine',
          commandId: `${run}-player-title`,
        }),
        'owner',
      );
      await director.client.mutation(api.sessions.setTitle, {
        sessionId,
        title: 'Blackcastle, revisited',
        commandId: `${run}-retitle`,
      });
      sessions = await player.client.query(api.sessions.list, { campaignId });
      expect(sessions[0]!.title === 'Blackcastle, revisited', 'title changed');
      // The Director still adjusts the interim all-members roster through sessions.setPlayers.
      await director.client.mutation(api.sessions.setPlayers, {
        sessionId,
        expectedRevision: sessions[0]!.revision,
        selectedPlayerIds: [player.userId],
        commandId: `${run}-players`,
      });
      const adjusted = (await player.client.query(api.sessions.list, { campaignId }))[0]!;
      expect(
        adjusted.selectedPlayerIds.length === 1 && adjusted.selectedPlayerIds[0] === player.userId,
        'roster adjusted after start',
      );
      return { session: adjusted };
    },
  );

  await step('closing the session updates history, header meta and the recap log', async () => {
    const before = (await director.client.query(api.sessions.list, { campaignId }))[0]!;
    await director.client.mutation(api.sessions.transition, {
      sessionId,
      expectedRevision: before.revision,
      action: 'close',
      commandId: `${run}-close`,
    });
    const closed = (await player.client.query(api.sessions.list, { campaignId })).find(
      s => s.id === sessionId,
    )!;
    expect(closed.status === 'closed' && closed.closedAt !== null, 'session closed');
    const campaign = await player.client.query(api.campaigns.get, { campaignId });
    expect(campaign.sessionCount === 1, 'session count 1');
    expect(campaign.lastPlayedAt === closed.closedAt, 'last played equals closedAt');
    await director.client.mutation(api.sessions.setTitle, {
      sessionId,
      title: 'Closed and renamed',
      commandId: `${run}-retitle-closed`,
    });
    const renamed = (await player.client.query(api.sessions.list, { campaignId }))[0]!;
    expect(renamed.title === 'Closed and renamed', 'closed session accepts a title');
    const recap = await player.client.query(api.events.list, { campaignId, sessionId });
    const kinds = recap.events.map(e => e.kind);
    expect(kinds.includes('session.closed') && kinds.includes('session.started'), `recap ${kinds}`);
    expect(
      recap.events.every(e => e.sessionId === sessionId),
      'recap holds only this session',
    );
    return { closed: renamed, recapKinds: kinds, sessionCount: campaign.sessionCount };
  });

  await step(
    'hero admission through the pop-up operations lists the hero with its level',
    async () => {
      const authored = { name: 'Thorn', appearance: '', biography: '', notes: 'private' };
      const characterId = await player.client.mutation(api.characters.create, {
        commandId: `${run}-hero-create`,
        authored,
      });
      await player.client.mutation(api.characters.save, {
        commandId: `${run}-hero-save`,
        characterId,
        expectedRevision: 1,
        authored,
        selections: heroSelections('Thorn'),
      });
      await player.client.mutation(api.characters.submit, {
        commandId: `${run}-hero-submit`,
        characterId,
        campaignId,
      });
      const beforeApproval = await director.client.query(api.campaigns.get, { campaignId });
      const playerBefore = beforeApproval.members.find(m => m.userId === player.userId)!;
      expect(playerBefore.heroes.length === 0, 'unapproved hero is not listed');
      const reviews = await director.client.query(api.characters.reviews, { campaignId });
      expect(
        reviews.some(r => r.characterId === characterId && r.status === 'pending'),
        'pending review',
      );
      await director.client.mutation(api.characters.approve, {
        commandId: `${run}-hero-approve`,
        characterId,
      });
      const after = await guest.client.query(api.campaigns.get, { campaignId }).catch(() => null);
      expect(after === null, 'guest (pending, not a member) still cannot read the campaign');
      const campaign = await player.client.query(api.campaigns.get, { campaignId });
      const heroes = campaign.members.find(m => m.userId === player.userId)!.heroes;
      expect(
        heroes.length === 1 && heroes[0]!.id === characterId && heroes[0]!.level === 1,
        `heroes ${JSON.stringify(heroes)}`,
      );
      return { heroes };
    },
  );

  await step('foe management keeps its route off the campaign home', async () => {
    const foes = await director.client.query(api.foes.list, { campaignId });
    expect(Array.isArray(foes.rows), 'foes.list answers the Director');
    return { rows: foes.rows.length };
  });
} finally {
  for (const account of accounts) {
    try {
      await account.auth.signOut();
    } catch {
      console.error(`could not sign out ${account.name}`);
    }
  }
}

const report = {
  slice: 'V68',
  run,
  target: url,
  startedAt: new Date(started).toISOString(),
  elapsedMs: Date.now() - started,
  passed: steps.filter(s => s.ok).length,
  failed: steps.filter(s => !s.ok).length,
  steps,
};
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ passed: report.passed, failed: report.failed, report: reportPath }));
process.exit(report.failed === 0 ? 0 : 1);
