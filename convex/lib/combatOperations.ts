// SPDX-License-Identifier: GPL-3.0-only
/**
 * A04 combat operations, registered in convex/lib/registry.ts and reachable from the setup card,
 * the initiative panel, the palette, slash text and `pnpm app command` alike. Nothing in web/
 * resolves a rule.
 *
 * Owning specifications:
 * - docs/table-spec.md#confirmed-initiative-setup-and-shared-presentation and
 *   docs/table-command-spec.md#starting-combat-through-an-action-card: `/combat start` opens the
 *   staged setup card (draft participants, surprise, groups; live rosters flow into the draft);
 *   `/combat cancel` discards the draft; `/combat commit` (OK) snapshots, commits, locks, then the
 *   opening path; `/combat roll` is the shared d10 any active player or the Director may make
 *   (observers cannot); `/combat first` is the winner's choice with Director access on either result.
 * - docs/table-spec.md#5-encounter-workflow: surprise handling and the two paths with a source
 *   default; both sides surprised or an empty side get explicit adjudication, never an invented roll.
 * - docs/table-spec.md#taking-a-turn, #player-sheet-actions-and-explicit-end-turn: `/turn take`,
 *   `/turn end` (explicit, also when ending early).
 * - docs/table-spec.md#mid-combat-additions-and-regrouping, docs/table-command-spec.md#mid-combat-group-operations:
 *   `/group move`.
 * - docs/conditions-and-clock.md sections 2.4 and 3: the registrations made at OK (Malice lifecycle,
 *   surprise expiry) and the boundary sequence.
 * Sources quoted in comments: vendor/steel-compendium/en/unified/md/rule/combat/combat-round.md,
 * rule/combat/surprised.md, rule/monster/malice.md (pin fb83a789da8f0327a389c277a0c790b1648d5810).
 */
import { ConvexError, v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { Reference } from '../../shared/commands/envelope';
import type { Side } from '../../shared/contracts/clock';
import { dispatchBoundary, operationHandlers, registerWork } from './clock';
import type { ReadCtx } from './access';
import { currentEncounter } from './encounters';
import {
  actorKey,
  createEntry,
  createGroup,
  endTurn,
  loadInitiative,
  moveEntry,
  sideOf,
  startTurn,
  validateTurnStart,
  type Actor,
} from './initiative';
import { journalDelete, journalInsert, journalPatch } from './journal';
import { rollDice } from './dice';
import type { OperationDefinition, Role, TableContext } from './registry';
import { bindActor } from './actors';
import { baselineOf } from './characterBuild';
import { generationProfile } from '../../shared/resolve/heroicResourceGeneration';

const SURPRISED_SOURCE = 'vendor/steel-compendium/en/unified/md/rule/combat/surprised.md';
const COMBAT_ROUND_SOURCE = 'vendor/steel-compendium/en/unified/md/rule/combat/combat-round.md';
const MALICE_SOURCE = 'vendor/steel-compendium/en/unified/md/rule/monster/malice.md';

// ---------------------------------------------------------------------------------------------
// Draft setup resolved against the live rosters.

export interface DraftParticipant {
  key: string;
  actor: Actor;
  side: Side;
  included: boolean;
  surprised: boolean;
  /** Creatures sharing a key share an initiative group; the default is the creature's own key. */
  groupKey: string;
}

/**
 * The effective draft: every live roster creature, included unless excluded, unsurprised unless
 * marked, in its own group unless combined. Roster additions therefore appear included and removals
 * disappear without touching the stored draft (confirmed draft roster updates, 2026-09-13).
 */
export async function effectiveDraft(
  ctx: ReadCtx,
  campaignId: Id<'campaigns'>,
  draft: NonNullable<Doc<'encounters'>['draft']>,
): Promise<DraftParticipant[]> {
  const characters = await ctx.db
    .query('characters')
    .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
    .take(200);
  const foes = await ctx.db
    .query('foes')
    .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
    .take(200);
  // V02: a squad is one participant with a shared turn; its minions and attached captain are not
  // listed separately (docs/table-spec.md#minion-squads-and-captain-state).
  const squads = await ctx.db
    .query('squads')
    .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
    .take(200);
  const captains = new Set(squads.map(s => s.captainId).filter(Boolean) as string[]);
  const actors: Actor[] = [
    ...characters.map(c => ({ kind: 'character' as const, id: c._id, name: c.authored.name })),
    ...foes
      .filter(f => !f.squadId && !captains.has(f._id))
      .map(f => ({ kind: 'foe' as const, id: f._id, name: f.name })),
    ...squads.map(s => ({ kind: 'squad' as const, id: s._id, name: s.name })),
  ];
  return actors.map(actor => {
    const key = actorKey(actor);
    return {
      key,
      actor,
      side: sideOf(actor),
      included: !draft.excluded.includes(key),
      surprised: draft.surprised.includes(key),
      groupKey: draft.groupOf[key] ?? key,
    };
  });
}

async function sessionEncounter(ctx: MutationCtx, context: TableContext) {
  if (!context.session) throw new ConvexError('Combat needs an active session.');
  return currentEncounter(ctx, context.session);
}

async function requireDraft(ctx: MutationCtx, context: TableContext) {
  const encounter = await sessionEncounter(ctx, context);
  if (!encounter || encounter.status !== 'draft' || !encounter.draft)
    throw new ConvexError('No combat setup is open; /combat start opens one.');
  return encounter;
}

async function requireCommitted(ctx: MutationCtx, context: TableContext) {
  const encounter = await sessionEncounter(ctx, context);
  if (!encounter || encounter.status !== 'committed' || !encounter.phase)
    throw new ConvexError('No combat encounter is committed.');
  return encounter;
}

async function setupInteraction(
  ctx: MutationCtx,
  campaignId: Id<'campaigns'>,
  sessionId: Id<'sessions'>,
) {
  const pending = await ctx.db
    .query('interactions')
    .withIndex('by_campaign_status', q =>
      q.eq('campaignId', campaignId).eq('status', 'awaiting-input'),
    )
    .take(100);
  return pending.find(row => row.kind === 'combat-setup' && row.sessionId === sessionId) ?? null;
}

const DIRECTOR_RUNNING: { roles: Role[]; session: 'running' } = {
  roles: ['director'],
  session: 'running',
};

// ---------------------------------------------------------------------------------------------
// /combat start — open the setup card (draft encounter + pending interaction).

const combatStart: OperationDefinition = {
  id: 'combat.start',
  family: 'combat',
  verb: 'start',
  title: 'Start combat (setup card)',
  description:
    'Open the staged setup card: every hero and foe on the rosters is included, unsurprised and in its own initiative group until the Director changes that. Nothing is committed until OK.',
  args: {},
  argDescriptions: {},
  ...DIRECTOR_RUNNING,
  actor: 'none',
  execute: async (ctx, { context, envelope }) => {
    const existing = await sessionEncounter(ctx, context);
    if (existing)
      throw new ConvexError(
        existing.status === 'draft'
          ? 'A combat setup card is already open.'
          : 'Combat is already active in this session.',
      );
    const session = context.session!;
    return {
      kind: 'combat.setup-opened',
      description:
        'Combat setup opened: the Director selects participants, surprise and initiative groups, then OK.',
      commit: async (mctx, scope) => {
        const id = await journalInsert(mctx, scope, 'encounters', {
          campaignId: context.campaign._id,
          sessionId: session._id,
          status: 'draft',
          precombatSnapshotId: null,
          createdAt: Date.now(),
          archivedAt: null,
          phase: 'setup',
          draft: { excluded: [], surprised: [], groupOf: {} },
          round: 0,
          registrationSeq: 0,
        });
        await journalPatch(mctx, scope, 'sessions', session._id, { encounterId: id });
      },
      interaction: {
        kind: 'combat-setup',
        requiredInputs: [],
        continuation: {
          schemaVersion: 1,
          campaignId: envelope.campaignId,
          operation: 'combat.commit',
          actor: null,
          arguments: {},
        },
      },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// /combat setup — one draft change: include/exclude, surprise, group.

const combatSetup: OperationDefinition = {
  id: 'combat.setup',
  family: 'combat',
  verb: 'setup',
  title: 'Change combat setup',
  description:
    'Draft change for one creature on the open setup card: include or exclude it, mark it surprised, or put it in a named initiative group (creatures sharing a group name act as one group).',
  args: {
    creature: v.union(
      v.object({ name: v.string() }),
      v.object({ refKind: v.string(), id: v.string() }),
    ),
    included: v.optional(v.boolean()),
    surprised: v.optional(v.boolean()),
    group: v.optional(v.string()),
  },
  argDescriptions: {
    creature: 'The hero or foe, as @Name or @{character:id} / @{foe:id}.',
    included:
      'false removes the creature from this combat (not from the roster); true restores it.',
    surprised: 'true or false (rule/combat/surprised.md: surprised until the end of round 1).',
    group: 'Group name; "own" returns the creature to its own group.',
  },
  ...DIRECTOR_RUNNING,
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const encounter = await requireDraft(ctx, context);
    const actor = await bindActor(ctx, context, args.creature as Reference);
    const key = actorKey(actor);
    const draft = encounter.draft!;
    const excluded = new Set(draft.excluded);
    const surprised = new Set(draft.surprised);
    const groupOf = { ...draft.groupOf };
    const changes: string[] = [];
    if (args.included !== undefined) {
      if (args.included) excluded.delete(key);
      else excluded.add(key);
      changes.push(args.included ? 'included' : 'excluded from this combat');
    }
    if (args.surprised !== undefined) {
      if (args.surprised) surprised.add(key);
      else surprised.delete(key);
      changes.push(args.surprised ? 'surprised' : 'not surprised');
    }
    if (args.group !== undefined) {
      const name = String(args.group).trim();
      if (!name || name.length > 40) throw new ConvexError('"group" needs 1–40 characters.');
      if (name === 'own') delete groupOf[key];
      else groupOf[key] = `${sideOf(actor)}:${name}`;
      changes.push(name === 'own' ? 'in its own group' : `in group "${name}"`);
    }
    if (!changes.length)
      throw new ConvexError('Give at least one of included=, surprised= or group=.');
    const next = { excluded: [...excluded], surprised: [...surprised], groupOf };
    return {
      kind: 'combat.setup',
      description: `Setup: ${actor.name} ${changes.join(', ')}.`,
      data: { creature: actor, draft: next },
      commit: async (mctx, scope) => {
        await journalPatch(mctx, scope, 'encounters', encounter._id, { draft: next });
      },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// /combat cancel — discard the draft; persistent roster changes stay.

const combatCancel: OperationDefinition = {
  id: 'combat.cancel',
  family: 'combat',
  verb: 'cancel',
  title: 'Cancel combat setup',
  description:
    'Discard the open setup card and its draft choices. Roster changes made meanwhile remain; no encounter, snapshot or lock is created.',
  args: {},
  argDescriptions: {},
  roles: ['director'],
  session: 'active',
  actor: 'none',
  execute: async (ctx, { context }) => {
    const encounter = await requireDraft(ctx, context);
    const card = await setupInteraction(ctx, context.campaign._id, encounter.sessionId);
    return {
      kind: 'combat.setup-canceled',
      description: 'Combat setup canceled; no encounter was started.',
      ...(card ? { causeEventId: card.openedEventId } : {}),
      commit: async (mctx, scope) => {
        await journalPatch(mctx, scope, 'sessions', encounter.sessionId, { encounterId: null });
        await journalDelete(mctx, scope, 'encounters', encounter._id);
        if (card)
          await mctx.db.patch(card._id, {
            status: 'closed',
            revision: card.revision + 1,
            resolvedEventId: scope.eventId,
            resolvedAt: Date.now(),
          });
      },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// /combat commit — OK.

function sideLabel(side: Side) {
  return side === 'heroes' ? 'Heroes' : 'Foes';
}

const combatCommit: OperationDefinition = {
  id: 'combat.commit',
  family: 'combat',
  verb: 'commit',
  title: 'OK: commit combat',
  description:
    'Commit the setup card once: capture the precombat snapshot, create the encounter, lock the party roster and participating character sheets, register the Malice lifecycle, then proceed to the initiative roll, the surprise-determined side, or Director adjudication.',
  args: {},
  argDescriptions: {},
  ...DIRECTOR_RUNNING,
  actor: 'none',
  execute: async (ctx, { context, respondsTo }) => {
    const encounter = await requireDraft(ctx, context);
    const participants = (await effectiveDraft(ctx, context.campaign._id, encounter.draft!)).filter(
      p => p.included,
    );
    if (!participants.length) throw new ConvexError('Include at least one hero or foe before OK.');
    const heroes = participants.filter(p => p.side === 'heroes');
    const foes = participants.filter(p => p.side === 'director');
    // Only selected combatants count when assessing whether a side is entirely surprised.
    const surprisedSides: Side[] = (['heroes', 'director'] as Side[]).filter(side => {
      const members = participants.filter(p => p.side === side);
      return members.length > 0 && members.every(p => p.surprised);
    });
    const emptySide = heroes.length === 0 || foes.length === 0;
    // rule/combat/combat-round.md, Determine Who Goes First: "If all the creatures on one side are
    // surprised, then a creature on the other side gets to act first. But if both sides have
    // creatures who aren't surprised, the Director or a player they choose rolls a d10."
    let path: 'roll' | 'surprise-determined' | 'adjudication';
    let startingSide: Side | null = null;
    if (!emptySide && surprisedSides.length === 0) path = 'roll';
    else if (!emptySide && surprisedSides.length === 1) {
      path = 'surprise-determined';
      startingSide = surprisedSides[0] === 'heroes' ? 'director' : 'heroes';
    } else path = 'adjudication'; // both sides surprised or an empty side: no source default.
    const card = respondsTo
      ? null
      : await setupInteraction(ctx, context.campaign._id, encounter.sessionId);
    const opening = `${heroes.length} hero${heroes.length === 1 ? '' : 'es'} and ${foes.length} foe${foes.length === 1 ? '' : 's'}`;
    const pathText =
      path === 'roll'
        ? 'Both sides have an unsurprised creature: any active player or the Director rolls the shared d10.'
        : path === 'surprise-determined'
          ? `Every selected ${sideLabel(surprisedSides[0]!).toLowerCase()} creature is surprised: ${sideLabel(startingSide!)} act first without a roll.`
          : `${emptySide ? 'One side has no participants' : 'Both sides are entirely surprised'}: the source gives no starting side; the Director chooses.`;
    return {
      kind: 'combat.committed',
      description: `Combat committed with ${opening}; precombat snapshot taken; party roster and participating sheets locked. ${pathText}`,
      data: {
        participants: participants.map(p => ({
          actor: p.actor,
          side: p.side,
          surprised: p.surprised,
          groupKey: p.groupKey,
        })),
        path,
        surprisedSides,
        startingSide,
      },
      commit: async (mctx, scope) => {
        // 1. Baseline before any combat-start effect (restoration record, not an editable sheet).
        const state: Record<string, unknown> = { characters: {}, foes: {}, campaign: {} };
        // Hero documents are large (the evaluated build); read each once here and reuse it below,
        // so a large party stays under the per-mutation read limit.
        const heroDocs = new Map<string, Doc<'characters'>>();
        for (const hero of heroes) {
          const doc = await mctx.db.get(hero.actor.id as Id<'characters'>);
          if (doc) heroDocs.set(doc._id, doc);
          if (doc)
            (state.characters as Record<string, unknown>)[doc._id] = {
              liveState: doc.liveState,
              combatLocked: doc.combatLocked,
            };
        }
        const allFoes = await mctx.db
          .query('foes')
          .withIndex('by_campaign', q => q.eq('campaignId', context.campaign._id))
          .take(200);
        for (const foe of allFoes) {
          const { _id, _creationTime, ...rest } = foe;
          void _creationTime;
          (state.foes as Record<string, unknown>)[_id] = rest;
        }
        // V02: squads restore with their members (pool, step, carried damage, captain, participation).
        const allSquads = await mctx.db
          .query('squads')
          .withIndex('by_campaign', q => q.eq('campaignId', context.campaign._id))
          .take(200);
        state.squads = {};
        for (const squad of allSquads) {
          const { _id, _creationTime, ...rest } = squad;
          void _creationTime;
          (state.squads as Record<string, unknown>)[_id] = rest;
        }
        (state.campaign as Record<string, unknown>).malice = context.campaign.malice ?? 0;
        const snapshotId = await mctx.db.insert('snapshots', {
          campaignId: context.campaign._id,
          encounterId: encounter._id,
          kind: 'encounter-start',
          eventId: scope.eventId,
          state,
          createdAt: Date.now(),
        });
        // 2. Commit the configuration; combat is active from here (locks through combatActive).
        await journalPatch(mctx, scope, 'encounters', encounter._id, {
          status: 'committed',
          precombatSnapshotId: snapshotId,
          phase: path === 'roll' ? 'roll' : path === 'adjudication' ? 'choice' : 'turns',
          draft: undefined,
          round: path === 'surprise-determined' ? 1 : 0,
          startingSide,
          activeSide: startingSide,
          activeGroupId: null,
          activeTurnId: null,
          heroParticipantIds: heroes.map(h => h.actor.id as Id<'characters'>),
          opening: { path, surprisedSides, roll: null, chosenBy: null },
        });
        // 3. Character-edit lock on participating heroes (the party-roster lock is combatActive).
        for (const hero of heroes)
          await journalPatch(mctx, scope, 'characters', hero.actor.id as Id<'characters'>, {
            combatLocked: true,
          });
        // 4. Groups and entries: heroes first, then foes; one group per creature unless combined.
        const committed = (await mctx.db.get(encounter._id))!;
        for (const side of ['heroes', 'director'] as Side[]) {
          const groups = new Map<string, Id<'initiativeGroups'>>();
          for (const p of participants.filter(x => x.side === side)) {
            let groupId = groups.get(p.groupKey);
            if (!groupId) {
              groupId = await createGroup(mctx, scope, committed, side);
              groups.set(p.groupKey, groupId);
            }
            await createEntry(mctx, scope, committed, groupId, p.actor, {
              surprised: p.surprised,
            });
          }
        }
        // 5. Registrations (docs/conditions-and-clock.md 2.4 and 3.2), in enqueue order.
        const source = (label: string, sourcePath: string) => ({
          logEntryId: scope.eventId,
          sourcePath,
          label,
        });
        await registerWork(mctx, scope, encounter._id, {
          timing: { scope: 'combat', boundary: 'combat-start' },
          work: { kind: 'malice', step: 'combat-start-grant' },
          source: source('Malice: combat-start grant', MALICE_SOURCE),
        });
        await registerWork(mctx, scope, encounter._id, {
          timing: { scope: 'round', boundary: 'round-start' },
          work: { kind: 'malice', step: 'round-start-gain' },
          source: source('Malice: round-start gain', MALICE_SOURCE),
        });
        await registerWork(mctx, scope, encounter._id, {
          timing: { scope: 'combat', boundary: 'combat-end' },
          work: { kind: 'malice', step: 'encounter-end-loss' },
          source: source('Malice: encounter-end loss', MALICE_SOURCE),
        });
        // V120: each participating hero whose class has a generation profile gets its combat-start
        // grant, a gain at the start of each of its turns, and its encounter-end loss.
        for (const hero of heroes) {
          const characterId = hero.actor.id as Id<'characters'>;
          // Read at the snapshot above; the combat lock since then changes nothing read here.
          const record = heroDocs.get(characterId);
          const profile = generationProfile(baselineOf(record?.derivedBaseline));
          if (!record?.liveState || !profile) continue;
          const resource = record.liveState.heroicResource.name;
          const work = (step: 'combat-start-grant' | 'turn-start-gain' | 'encounter-end-loss') =>
            ({ kind: 'heroic-resource', step, characterId }) as const;
          const affectedIds = [characterId];
          await registerWork(mctx, scope, encounter._id, {
            timing: { scope: 'combat', boundary: 'combat-start' },
            work: work('combat-start-grant'),
            source: source(
              `${record.authored.name}'s ${resource}: combat-start grant`,
              profile.combatStart.sourcePath,
            ),
            affectedIds,
          });
          await registerWork(mctx, scope, encounter._id, {
            timing: {
              scope: 'creature-turn',
              boundary: 'turn-start',
              creatureId: characterId,
              occurrence: 'each',
            },
            work: work('turn-start-gain'),
            source: source(
              `${record.authored.name}'s ${resource}: turn-start gain`,
              profile.turnStart.sourcePath,
            ),
            affectedIds,
          });
          await registerWork(mctx, scope, encounter._id, {
            timing: { scope: 'combat', boundary: 'combat-end' },
            work: work('encounter-end-loss'),
            source: source(
              `${record.authored.name}'s ${resource}: encounter-end loss`,
              profile.encounterEnd.sourcePath,
            ),
            affectedIds,
          });
        }
        if (participants.some(p => p.surprised))
          // "surprised until the end of the first combat round" (rule/combat/surprised.md).
          await registerWork(mctx, scope, encounter._id, {
            timing: { scope: 'round', boundary: 'round-end', round: 1 },
            work: { kind: 'operation', operationId: 'combat.surprise-expiry' },
            source: source('Surprise ends (end of round 1)', SURPRISED_SOURCE),
            affectedIds: participants.filter(p => p.surprised).map(p => p.actor.id),
          });
        // 6. Boundaries: combat-start now; round 1 starts when the starting side is known.
        await dispatchBoundary(mctx, scope, encounter._id, { kind: 'combat-start', round: 0 });
        if (path === 'surprise-determined')
          await dispatchBoundary(mctx, scope, encounter._id, { kind: 'round-start', round: 1 });
        if (card)
          await mctx.db.patch(card._id, {
            status: 'resolved',
            revision: card.revision + 1,
            resolvedEventId: scope.eventId,
            answer: {},
            resolvedAt: Date.now(),
          });
      },
    };
  },
};

/** Clock handler: clears Surprised on every entry of the encounter at the end of round 1. */
operationHandlers.set('combat.surprise-expiry', async (ctx, firing) => {
  const init = await loadInitiative(ctx, firing.encounter._id);
  const cleared: string[] = [];
  for (const entry of init.entries.filter(e => e.surprised)) {
    await journalPatch(ctx, firing.scope, 'turnEntries', entry._id, { surprised: false });
    cleared.push(entry.actor.name);
  }
  return {
    kind: 'clock.work',
    description: `Surprise ends: ${cleared.length ? cleared.join(', ') : 'nobody'} no longer surprised (end of round 1).`,
    payload: { cleared, sourcePath: SURPRISED_SOURCE },
  };
});

// ---------------------------------------------------------------------------------------------
// /combat roll — the shared d10.

const combatRoll: OperationDefinition = {
  id: 'combat.roll',
  family: 'combat',
  verb: 'roll',
  title: 'Roll initiative',
  description:
    'The shared opening d10: 6 or higher, the players choose who goes first; otherwise the Director decides. Any active player or the Director may roll; the first accepted roll is shared by everyone.',
  args: {},
  argDescriptions: {},
  roles: ['director', 'player'],
  session: 'running',
  actor: 'none',
  execute: async (ctx, { context, envelope }) => {
    const encounter = await requireCommitted(ctx, context);
    if (encounter.phase !== 'roll')
      throw new ConvexError(
        encounter.opening?.roll
          ? `The initiative roll was already made (d10 = ${encounter.opening.roll.value}).`
          : 'No initiative roll is due.',
      );
    const accepted = await rollDice(
      ctx,
      context.campaign._id,
      envelope.commandId,
      [{ id: 'd10', sides: 10 }],
      context.user._id,
    );
    const value = accepted.dice[0]!.value;
    // "On a 6 or higher, the players determine who goes first ... Otherwise, the Director decides."
    const entitlement = value >= 6 ? 'players' : 'director';
    return {
      kind: 'combat.initiative-roll',
      description: `Initiative roll: d10 = ${value} — ${entitlement === 'players' ? '6 or higher, the players choose who goes first' : '5 or lower, the Director decides who goes first'}.`,
      dice: accepted.dice,
      data: { value, entitlement, rollId: accepted.rollId, sourcePath: COMBAT_ROUND_SOURCE },
      commit: async (mctx, scope) => {
        await journalPatch(mctx, scope, 'encounters', encounter._id, {
          phase: 'choice',
          opening: {
            ...encounter.opening!,
            roll: { value, entitlement, rolledBy: context.user._id },
          },
        });
      },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// /combat first — the starting-side choice.

const combatFirst: OperationDefinition = {
  id: 'combat.first',
  family: 'combat',
  verb: 'first',
  title: 'Choose who goes first',
  description:
    'Announce the starting side. After a 6+ any participating player may choose; the Director may choose on either result and when the source gives no default.',
  args: { side: v.string() },
  argDescriptions: { side: 'heroes or foes.' },
  roles: ['director', 'player'],
  session: 'running',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const encounter = await requireCommitted(ctx, context);
    if (encounter.phase !== 'choice')
      throw new ConvexError(
        encounter.startingSide
          ? `The starting side is already announced: ${sideLabel(encounter.startingSide)} first.`
          : 'The starting side is not due yet.',
      );
    const word = String(args.side).toLowerCase();
    const side: Side = word === 'heroes' ? 'heroes' : word === 'foes' ? 'director' : ('' as Side);
    if (!side) throw new ConvexError('"side" must be heroes or foes.');
    const entitlement = encounter.opening?.roll?.entitlement ?? 'director';
    if (context.role !== 'director' && entitlement !== 'players')
      throw new ConvexError(
        encounter.opening?.roll
          ? 'The roll gave the choice to the Director.'
          : 'The source gives no starting side here; the Director adjudicates.',
      );
    const basis = encounter.opening?.roll
      ? `the d10 (${encounter.opening.roll.value}) entitled ${entitlement === 'players' ? 'the players' : 'the Director'}`
      : encounter.opening?.path === 'adjudication'
        ? 'Director adjudication (no source default)'
        : 'the opening';
    return {
      kind: 'combat.first-side',
      description: `${sideLabel(side)} act first — chosen by ${context.user.displayName}${context.role === 'director' && entitlement === 'players' ? ' (Director authority)' : ''}; ${basis}. Round 1 begins.`,
      data: { side, entitlement, chosenByRole: context.role, sourcePath: COMBAT_ROUND_SOURCE },
      commit: async (mctx, scope) => {
        await journalPatch(mctx, scope, 'encounters', encounter._id, {
          phase: 'turns',
          round: 1,
          startingSide: side,
          activeSide: side,
          opening: { ...encounter.opening!, chosenBy: context.user._id },
        });
        await dispatchBoundary(mctx, scope, encounter._id, { kind: 'round-start', round: 1 });
      },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// /turn take, /turn end

const turnTake: OperationDefinition = {
  id: 'turn.take',
  family: 'turn',
  verb: 'take',
  title: 'Take turn',
  description:
    'Start the acting creature’s turn and activate its initiative group. Players take turns for heroes they control; the Director for any hero or foe.',
  args: { entry: v.optional(v.string()) },
  argDescriptions: {
    entry: 'Which turn entry, when the creature has more than one unspent entry (entry id).',
  },
  roles: ['director', 'player'],
  session: 'running',
  actor: 'required',
  execute: async (ctx, { context, actor, args }) => {
    const encounter = await requireCommitted(ctx, context);
    if (encounter.phase !== 'turns')
      throw new ConvexError('Turns begin once the starting side is announced.');
    const round = encounter.round ?? 0;
    const init = await loadInitiative(ctx, encounter._id);
    const mine = init.entries.filter(e => e.actor.kind === actor!.kind && e.actor.id === actor!.id);
    if (!mine.length) throw new ConvexError(`${actor!.name} is not in this combat.`);
    let entry = mine.find(e => e.spentRound !== round) ?? mine[0]!;
    if (args.entry !== undefined) {
      const requested = mine.find(e => e._id === String(args.entry));
      if (!requested) throw new ConvexError(`${actor!.name} has no turn entry with that id.`);
      entry = requested;
    }
    const { warnings } = await validateTurnStart(ctx, encounter._id, entry._id);
    return {
      kind: 'turn.take',
      description: `${actor!.name} takes their turn (round ${round}).${warnings.length ? ` ${warnings.join(' ')}` : ''}`,
      data: { entryId: entry._id, groupId: entry.groupId, round, actor, warnings },
      commit: async (mctx, scope) => {
        await startTurn(mctx, scope, encounter._id, entry._id);
      },
    };
  },
};

const turnEnd: OperationDefinition = {
  id: 'turn.end',
  family: 'turn',
  verb: 'end',
  title: 'End turn',
  description:
    'Explicitly end the turn in progress, including early with unused actions. Due end-of-turn work resolves through the clock; the group and round hand off when nothing remains.',
  args: {},
  argDescriptions: {},
  roles: ['director', 'player'],
  session: 'running',
  actor: 'optional',
  execute: async (ctx, { context, actor }) => {
    const encounter = await requireCommitted(ctx, context);
    if (encounter.phase !== 'turns') throw new ConvexError('Structured turn play is not active.');
    if (!encounter.activeTurnId) throw new ConvexError('No turn is in progress.');
    const turn = (await ctx.db.get(encounter.activeTurnId))!;
    if (actor && (actor.kind !== turn.actor.kind || actor.id !== turn.actor.id))
      throw new ConvexError(`It is ${turn.actor.name}'s turn, not ${actor.name}'s.`);
    if (context.role !== 'director') {
      if (turn.actor.kind !== 'character')
        throw new ConvexError('Only the Director ends a foe’s turn.');
      const hero = await ctx.db.get(turn.actor.id as Id<'characters'>);
      if (!hero || hero.ownerId !== context.user._id)
        throw new ConvexError(`You do not control ${turn.actor.name}.`);
    }
    return {
      kind: 'turn.end',
      description: `${turn.actor.name} ends their turn (round ${turn.round}).`,
      data: { turnId: turn._id, entryId: turn.turnEntryId, round: turn.round, actor: turn.actor },
      commit: async (mctx, scope) => {
        await endTurn(mctx, scope, turn._id);
      },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// /group move

const groupMove: OperationDefinition = {
  id: 'group.move',
  family: 'group',
  verb: 'move',
  title: 'Move a turn entry',
  description:
    'Director regrouping: move one selected turn entry into another initiative group on its side, or into a new group at the bottom. Its spent state travels with it; a finished destination does not reopen.',
  args: { entry: v.string(), group: v.string() },
  argDescriptions: {
    entry: 'The turn entry id.',
    group: 'The destination group id, or "new".',
  },
  roles: ['director'],
  session: 'unpaused',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const encounter = await requireCommitted(ctx, context);
    const entryId = ctx.db.normalizeId('turnEntries', String(args.entry));
    if (!entryId) throw new ConvexError('That turn entry id is not valid.');
    const entry = await ctx.db.get(entryId);
    if (!entry || entry.encounterId !== encounter._id)
      throw new ConvexError('Turn entry unavailable.');
    const word = String(args.group);
    const target = word === 'new' ? ('new' as const) : ctx.db.normalizeId('initiativeGroups', word);
    if (!target) throw new ConvexError('"group" must be a group id or "new".');
    return {
      kind: 'group.move',
      description: `${entry.actor.name}'s turn entry moved to ${word === 'new' ? 'a new group at the bottom' : 'another group'}${entry.spentRound === (encounter.round ?? 0) ? ' (already spent this round)' : ''}.`,
      data: { entryId, target: word, spentRound: entry.spentRound },
      commit: async (mctx, scope) => {
        await moveEntry(mctx, scope, encounter, entryId, target);
      },
    };
  },
};

export const combatOperations: OperationDefinition[] = [
  combatStart,
  combatSetup,
  combatCancel,
  combatCommit,
  combatRoll,
  combatFirst,
  turnTake,
  turnEnd,
  groupMove,
];
