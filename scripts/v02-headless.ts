// SPDX-License-Identifier: GPL-3.0-only
/**
 * V02 headless proof (docs/build/README.md#programmatic-headless-completion-gate): minion squads
 * exercised through the same authenticated operations the Director pane and the command line use,
 * with every claim read back from the backend afterwards. No browser, no UI setup, no fixture
 * writes: accounts register through Better Auth; everything else goes through `commands.submit`,
 * `commands.invoke`, `foes`, `table.roster`, `encounters.current`, `events.list` and `history`.
 * Dice are the server's own accepted rolls; expectations branch on the recorded tier using the
 * printed tier values (Goblin Spinecleaver Axe 2/4/5, Brutal Slam 5/8/15 for the fixture hero).
 *
 * Environment: VITE_CONVEX_URL, VITE_CONVEX_SITE_URL, VITE_SITE_URL; optional SALIENT_HEADLESS_REPORT.
 * Exit status 1 on any failed step. Sign-ups are paced for Better Auth's per-address limit.
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
const reportPath = process.env.SALIENT_HEADLESS_REPORT ?? 'v02-headless.json';
const run = `v02-${Date.now().toString(36)}`;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const SPINECLEAVER = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-spinecleaver';
const AXETHROWER = 'mcdm.monsters.v1/monster.dwarf.statblock/dwarf-axethrower';
const WARRIOR = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior';
const AXE_TIERS = [2, 4, 5];
const SLAM_TIERS = [5, 8, 15];

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
type Account = { name: string; userId: Id<'users'>; client: ConvexHttpClient };
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
  return { name, userId: profile.userId, client };
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

let counter = 0;
const cid = (label: string) => `${run}-${label}-${++counter}`;
const submit = (account: Account, campaignId: Id<'campaigns'>, text: string, label: string) =>
  account.client.mutation(api.commands.submit, { campaignId, text, commandId: cid(label) });
const foeRef = (id: string) => `@{foe:${id}}`;
const squadRef = (id: string) => `@{squad:${id}}`;

try {
  const director = await register('Director');
  await sleep(4000);
  const player = await register('Player');
  const campaignId = await director.client.mutation(api.campaigns.create, {
    name: `Squads ${run}`,
    commandId: cid('create'),
  });
  const roster = (account: Account) => account.client.query(api.table.roster, { campaignId });
  const encounter = () => director.client.query(api.encounters.current, { campaignId });
  const events = async () =>
    (await director.client.query(api.events.list, { campaignId, activeSession: true })).events;
  let thornId!: Id<'characters'>;
  await step(
    'table: player admitted, session started, hero Thorn admitted through the wizard route',
    async () => {
      const { shareCode } = await director.client.query(api.campaigns.get, { campaignId });
      await player.client.mutation(api.campaigns.requestJoin, {
        shareCode: shareCode!,
        commandId: cid('join'),
      });
      const request = (await director.client.query(api.campaigns.get, { campaignId }))
        .pendingRequests[0]!;
      await director.client.mutation(api.campaigns.approveRequest, {
        requestId: request.id,
        commandId: cid('approve'),
      });
      await director.client.mutation(api.sessions.start, {
        campaignId,
        selectedPlayerIds: [player.userId],
        commandId: cid('session'),
      });
      const authored = { name: 'Thorn', appearance: '', biography: '', notes: '' };
      thornId = await player.client.mutation(api.characters.create, {
        commandId: cid('hero'),
        authored,
      });
      await player.client.mutation(api.characters.save, {
        commandId: cid('save'),
        characterId: thornId,
        expectedRevision: 1,
        authored,
        selections: heroSelections('Thorn'),
      });
      await player.client.mutation(api.characters.submit, {
        commandId: cid('submit'),
        characterId: thornId,
        campaignId,
      });
      await director.client.mutation(api.characters.approve, {
        commandId: cid('admit'),
        characterId: thornId,
      });
      await submit(director, campaignId, '@Thorn /adjust stamina value=30', 'adj');
      const view = await roster(director);
      expect(
        view.heroes.some(h => h.id === thornId),
        'Thorn is on the roster',
      );
      return { campaignId, thornId };
    },
  );

  let squadId!: Id<'squads'>;
  let members: Id<'foes'>[] = [];
  let warriorId!: Id<'foes'>;
  await step(
    'squad add: four Spinecleavers persist one squad, four minion identities, pool 20, EV 3; minions refuse /foe add',
    async () => {
      const list = await director.client.query(api.foes.definitions, { campaignId });
      const spine = list.find(d => d.definitionId === SPINECLEAVER);
      expect(
        !!spine && spine.organization === 'Minion' && spine.stamina === 5,
        'Spinecleaver is a seeded Minion with Stamina 5',
      );
      await refused(
        director.client.mutation(api.foes.add, {
          campaignId,
          definitionId: SPINECLEAVER,
          commandId: cid('badadd'),
        }),
        '/squad add',
      );
      await refused(
        submit(player, campaignId, `/squad add definition="${SPINECLEAVER}" count=4`, 'player-add'),
        '',
      );
      await submit(director, campaignId, `/squad add definition="${SPINECLEAVER}" count=4`, 'add');
      const view = await roster(director);
      const squad = view.squads.find(s => s.definitionId === SPINECLEAVER)!;
      expect(!!squad, 'squad row read back');
      squadId = squad.id;
      members = squad.memberIds;
      expect(squad.memberIds.length === 4 && squad.living === 4, 'four living members');
      expect(
        squad.health.mode === 'director' && squad.health.pool === 20 && squad.health.step === 5,
        `pool ${JSON.stringify(squad.health)}`,
      );
      expect(squad.director?.ev.derived === 3, `EV ${JSON.stringify(squad.director?.ev)}`);
      const names = view.foes.filter(f => f.squadId === squadId).map(f => f.name);
      warriorId = await director.client.mutation(api.foes.add, {
        campaignId,
        definitionId: WARRIOR,
        commandId: cid('warrior'),
      });
      const peer = (await roster(player)).squads.find(s => s.id === squadId)!;
      expect(
        peer.health.mode === 'bar' && peer.health.fraction === 1 && !('director' in peer),
        'player sees a full bar and no Director facts',
      );
      return { squadId, members: names, ev: squad.director?.ev, peerHealth: peer.health };
    },
  );

  await step(
    'combat: one squad turn entry, its shared turn fires one turn-start boundary with all four participants',
    async () => {
      await submit(director, campaignId, '/combat start', 'start');
      await submit(director, campaignId, '/combat commit', 'commit');
      await submit(player, campaignId, '/combat roll', 'roll');
      await submit(director, campaignId, '/combat first side=heroes', 'first');
      const entries = (await encounter())!.groups.flatMap(g => g.entries);
      expect(
        entries.filter(e => e.actor.kind === 'squad' && e.actor.id === squadId).length === 1,
        'one squad entry',
      );
      expect(
        !entries.some(e => e.actor.kind === 'foe' && members.includes(e.actor.id as Id<'foes'>)),
        'no minion entries',
      );
      const take = await submit(director, campaignId, `${squadRef(squadId)} /turn take`, 'take');
      const boundaries = (await events()).filter(
        e => e.kind === 'clock.boundary' && e.causeEventId === take.eventId,
      );
      expect(boundaries.length === 1, `one boundary firing, saw ${boundaries.length}`);
      const turn = (boundaries[0]!.payload as { event: { turn: { participantIds: string[] } } })
        .event.turn;
      expect(
        turn.participantIds.length === 4,
        `four participants, saw ${turn.participantIds.length}`,
      );
      const active = (await encounter())!.activeTurn;
      expect(active?.actor.kind === 'squad' && active.actor.id === squadId, 'the squad is acting');
      return { entries: entries.length, participants: turn.participantIds.length };
    },
  );

  let thornStamina = 30;
  let warriorStamina = 15;
  await step(
    'squad act: one roll, two minions on Thorn add free strike 2, one on the warrior; damage read back from the recorded tier',
    async () => {
      const act = await submit(
        director,
        campaignId,
        `${squadRef(squadId)} /squad act assignments=[{"target": @Thorn, "minions": [${foeRef(members[0]!)}, ${foeRef(members[1]!)}]}, {"target": ${foeRef(warriorId)}, "minions": [${foeRef(members[2]!)}]}]`,
        'act',
      );
      const event = (await events()).find(e => e.id === act.eventId)!;
      expect(event.kind === 'ability.use', `kind ${event.kind}`);
      const data = event.payload as {
        data: {
          result: {
            targets: {
              tier: number;
              damage?: { rolledDamage: number; extraDamage?: { amount: number }[] };
            }[];
            damageApplications: { targetId: string; staminaAfter: number }[];
          };
        };
      };
      const [thornOutcome, warriorOutcome] = data.data.result.targets;
      const thornDamage = AXE_TIERS[thornOutcome!.tier - 1]! + 2;
      const warriorDamage = AXE_TIERS[warriorOutcome!.tier - 1]!;
      expect(
        thornOutcome!.damage?.rolledDamage === thornDamage,
        `Thorn damage ${thornOutcome!.damage?.rolledDamage} for tier ${thornOutcome!.tier}`,
      );
      expect(
        thornOutcome!.damage?.extraDamage?.[0]?.amount === 2,
        'one additional minion adds free strike 2',
      );
      expect(
        warriorOutcome!.damage?.rolledDamage === warriorDamage,
        `warrior damage ${warriorOutcome!.damage?.rolledDamage}`,
      );
      thornStamina -= thornDamage;
      warriorStamina -= warriorDamage;
      const view = await roster(director);
      const thorn = view.heroes.find(h => h.id === thornId)!;
      expect(
        (thorn.live as { stamina: number }).stamina === thornStamina,
        `Thorn Stamina ${(thorn.live as { stamina: number }).stamina} ≠ ${thornStamina}`,
      );
      const warrior = view.foes.find(f => f.id === warriorId)!;
      expect(
        warrior.health.mode === 'director' && warrior.health.stamina === warriorStamina,
        'warrior Stamina read back',
      );
      expect(event.dice?.length === 2, 'one shared 2d10');
      await submit(director, campaignId, '/turn end', 'end');
      return { tiers: [thornOutcome!.tier, warriorOutcome!.tier], thornStamina, warriorStamina };
    },
  );

  let pool = 20;
  let living = 4;
  await step(
    'ladder: Brutal Slam on a minion reduces the pool and derives casualties from the printed steps; owed choices are named by the attacker',
    async () => {
      await submit(player, campaignId, '@Thorn /turn take', 'take');
      const slam = await submit(
        player,
        campaignId,
        `@Thorn /ability use ability="Brutal Slam" targets=[${foeRef(members[0]!)}]`,
        'slam',
      );
      const event = (await events()).find(e => e.id === slam.eventId)!;
      const result = (event.payload as { data: { result: { targets: { tier: number }[] } } }).data
        .result;
      const damage = SLAM_TIERS[result.targets[0]!.tier - 1]!;
      const deaths = Math.min(living, Math.floor(damage / 5));
      pool = Math.max(0, pool - damage);
      const expectedPending = pool === 0 ? 0 : Math.max(0, deaths - 1);
      const squad = (await roster(director)).squads.find(s => s.id === squadId)!;
      expect(
        squad.health.mode === 'director' && squad.health.pool === pool,
        `pool ${JSON.stringify(squad.health)} ≠ ${pool}`,
      );
      const first = (await roster(director)).foes.find(f => f.id === members[0])!;
      expect(first.slain === deaths >= 1, `first minion slain=${first.slain} for ${damage} damage`);
      expect(
        (squad.pending?.count ?? 0) === expectedPending,
        `pending ${JSON.stringify(squad.pending)} ≠ ${expectedPending}`,
      );
      let named: string[] = [];
      if (expectedPending > 0) {
        expect(slam.interactionId !== null, 'a casualty card opened');
        named = squad.pending!.candidates.slice(0, expectedPending);
        await refused(
          director.client.mutation(api.interactions.respond, {
            interactionId: slam.interactionId!,
            answer: { casualties: named.slice(0, 1).map(id => ({ refKind: 'foe', id })) },
            commandId: cid('short'),
          }),
          'Name exactly',
        );
        await player.client.mutation(api.interactions.respond, {
          interactionId: slam.interactionId!,
          answer: { casualties: named.map(id => ({ refKind: 'foe', id })) },
          commandId: cid('card'),
        });
        const after = (await roster(director)).squads.find(s => s.id === squadId)!;
        expect(after.pending === null, 'no casualty owed after the answer');
        expect(
          after.health.mode === 'director' && after.health.pool === pool,
          'the answer deducts nothing',
        );
      }
      living = pool === 0 ? 0 : living - deaths;
      const view = await roster(director);
      expect(view.squads.find(s => s.id === squadId)!.living === living, `living ${living}`);
      await submit(player, campaignId, '/turn end', 'end');
      return { tier: result.targets[0]!.tier, damage, pool, deaths, named, living };
    },
  );

  await step(
    'history: undoing the Brutal Slam restores the pool and the dropped minions exactly',
    async () => {
      const list = await events();
      const slam = [...list]
        .reverse()
        .find(e => e.kind === 'ability.use' && e.description.includes('Brutal Slam'))!;
      // The turn end after it must be rewound first (sequential undo across the seam).
      const undoable = [...list].reverse().find(e => e.kind === 'turn.end')!;
      await submit(director, campaignId, `/history rewind event="${undoable.id}"`, 'rewind');
      await submit(director, campaignId, `/history rewind event="${slam.id}"`, 'rewind');
      const squad = (await roster(director)).squads.find(s => s.id === squadId)!;
      expect(
        squad.health.mode === 'director' && squad.health.pool === 20 && squad.living === 4,
        `restored ${JSON.stringify(squad.health)} living ${squad.living}`,
      );
      pool = 20;
      living = 4;
      return { pool, living };
    },
  );

  await step('Free Strike Together: two minions on Thorn apply one 4-damage strike', async () => {
    const before = thornStamina;
    const strike = await submit(
      director,
      campaignId,
      `${squadRef(squadId)} /squad free-strike target=@Thorn minions=[${foeRef(members[0]!)}, ${foeRef(members[1]!)}]`,
      'fst',
    );
    const event = (await events()).find(e => e.id === strike.eventId)!;
    expect(event.description.includes('2 × free strike 2'), event.description);
    thornStamina = before - 4;
    const thorn = (await roster(director)).heroes.find(h => h.id === thornId)!;
    expect((thorn.live as { stamina: number }).stamina === thornStamina, 'Thorn lost 4');
    return { thornStamina };
  });

  await step(
    'captain: two Axethrowers with the warrior as captain pool 18 at step 9; detaching reverts to 14 at step 7 with no casualty',
    async () => {
      if (warriorStamina <= 0) return { skipped: 'warrior already at 0 Stamina' };
      await submit(
        director,
        campaignId,
        `/squad add definition="${AXETHROWER}" count=2 captain=${foeRef(warriorId)}`,
        'axe',
      );
      const squad = (await roster(director)).squads.find(s => s.definitionId === AXETHROWER)!;
      expect(squad.captain?.id === warriorId, 'captain attached');
      expect(
        squad.health.mode === 'director' && squad.health.pool === 18 && squad.health.step === 9,
        `pool ${JSON.stringify(squad.health)}`,
      );
      const entries = (await encounter())!.groups.flatMap(g => g.entries);
      expect(
        !entries.some(e => e.actor.kind === 'foe' && e.actor.id === warriorId),
        'the captain shares the squad entry',
      );
      await submit(
        director,
        campaignId,
        `${squadRef(squad.id)} /squad captain captain=none`,
        'detach',
      );
      const after = (await roster(director)).squads.find(s => s.id === squad.id)!;
      expect(
        after.captain === null &&
          after.health.mode === 'director' &&
          after.health.pool === 14 &&
          after.health.step === 7 &&
          after.living === 2,
        `after ${JSON.stringify(after.health)} living ${after.living}`,
      );
      const back = (await encounter())!.groups.flatMap(g => g.entries);
      expect(
        back.some(e => e.actor.kind === 'foe' && e.actor.id === warriorId),
        'the detached captain has its own entry again',
      );
      return { pool: after.health, living: after.living };
    },
  );

  await step('removal: single minions are refused; the squad is removed as a unit', async () => {
    await refused(
      submit(director, campaignId, `${foeRef(members[0]!)} /foe remove`, 'bad-remove'),
      '/squad remove',
    );
    await submit(director, campaignId, `${squadRef(squadId)} /squad remove`, 'remove');
    const view = await roster(director);
    expect(!view.squads.some(s => s.id === squadId), 'squad gone');
    expect(!view.foes.some(f => f.squadId === squadId), 'minions gone');
    return { squads: view.squads.length, foes: view.foes.length };
  });
} finally {
  const passed = steps.every(s => s.ok);
  const report = {
    run,
    startedAt: new Date(started).toISOString(),
    elapsedMs: Date.now() - started,
    backend: url,
    passed,
    steps,
  };
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(
    `${passed ? 'PASS' : 'FAIL'} ${steps.filter(s => s.ok).length}/${steps.length} steps in ${report.elapsedMs} ms → ${reportPath}`,
  );
  process.exitCode = passed ? 0 : 1;
}
