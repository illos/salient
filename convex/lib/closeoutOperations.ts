import { indexArchivedEncounter } from './historyIndex';
// SPDX-License-Identifier: GPL-3.0-only
/** A07: docs/table-spec.md#formal-encounter-closeout and #voiding-an-encounter.
 * End structure without final turn/round work; explicit rewards; journaled cleanup and snapshot Void.
 */
import { ConvexError, v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { ReadCtx } from './access';
import type { OperationDefinition, TableContext } from './registry';
import { currentEncounter } from './encounters';
import { appendEvent } from './events';
import { dispatchBoundary } from './clock';
import { journalDelete, journalInsert, journalPatch, type JournalScope } from './journal';
import { squadMembers } from './squads';

const SOURCE_ROOT = 'vendor/steel-compendium/en/unified/md/rule/';
export type VoidMode = 'keep' | 'reset';

async function active(
  ctx: ReadCtx,
  context: TableContext,
  closeout = false,
  encounterId?: unknown,
) {
  const encounter = context.session ? await currentEncounter(ctx, context.session) : null;
  if (!encounter || encounter.status !== 'committed') throw new ConvexError('No active combat.');
  if (encounterId !== undefined && encounterId !== encounter._id)
    throw new ConvexError('This closeout card belongs to a different encounter.');
  if (closeout && encounter.phase !== 'closeout')
    throw new ConvexError('End combat before closeout.');
  return encounter;
}

export async function closeoutHeroes(ctx: ReadCtx, encounter: Doc<'encounters'>) {
  const heroes: Doc<'characters'>[] = [];
  for (const id of encounter.heroParticipantIds ?? []) {
    const hero = await ctx.db.get(id);
    if (hero?.campaignId === encounter.campaignId && hero.liveState) heroes.push(hero);
  }
  return heroes;
}

/** Close only cards belonging to this encounter, retaining every original prompt and answer. */
async function closeCards(ctx: MutationCtx, scope: JournalScope, encounter: Doc<'encounters'>) {
  const cards = await ctx.db
    .query('interactions')
    .withIndex('by_campaign_status', q =>
      q.eq('campaignId', encounter.campaignId).eq('status', 'awaiting-input'),
    )
    .take(1001);
  if (cards.length > 1000) throw new ConvexError('Too many open cards to close safely.');
  for (const card of cards) {
    const event = await ctx.db.get(card.openedEventId);
    if (event?.encounterId !== encounter._id) continue;
    await journalPatch(ctx, scope, 'interactions', card._id, {
      status: 'closed',
      revision: card.revision + 1,
      resolvedAt: Date.now(),
      resolvedEventId: scope.eventId,
    });
  }
}

/** Expire old combat action opportunities and targeting preparations without executing them. */
async function closePreparations(
  ctx: MutationCtx,
  scope: JournalScope,
  encounter: Doc<'encounters'>,
) {
  const opportunities = await ctx.db
    .query('actionOpportunities')
    .withIndex('by_encounter_actor', q => q.eq('encounterId', encounter._id))
    .take(1001);
  if (opportunities.length > 1000)
    throw new ConvexError('Too many optional actions to close safely.');
  for (const opportunity of opportunities)
    if (opportunity.status === 'offered')
      await journalPatch(ctx, scope, 'actionOpportunities', opportunity._id, { status: 'closed' });
  const drafts = await ctx.db
    .query('targetingDrafts')
    .withIndex('by_campaign_user', q => q.eq('campaignId', encounter.campaignId))
    .take(1001);
  if (drafts.length > 1000) throw new ConvexError('Too many targeting drafts to close safely.');
  for (const draft of drafts)
    await journalPatch(ctx, scope, 'targetingDrafts', draft._id, {
      actor: null,
      abilityId: null,
      targets: [],
      modifiers: {},
      characteristic: null,
    });
}

/** Seal actual turn records without dispatching any turn or round boundary. */
async function stopStructure(ctx: MutationCtx, scope: JournalScope, encounter: Doc<'encounters'>) {
  const turns = await ctx.db
    .query('turns')
    .withIndex('by_encounter', q => q.eq('encounterId', encounter._id))
    .take(10001);
  if (turns.length > 10000) throw new ConvexError('Too many turns to close safely.');
  for (const turn of turns)
    if (turn.status === 'active')
      await journalPatch(ctx, scope, 'turns', turn._id, {
        status: 'ended',
        endedEventId: scope.eventId,
      });
  await journalPatch(ctx, scope, 'encounters', encounter._id, {
    activeTurnId: null,
    activeGroupId: null,
    activeSide: null,
  });
}

async function archive(
  ctx: MutationCtx,
  scope: JournalScope,
  encounter: Doc<'encounters'>,
  status: 'voided' | 'closed-out',
) {
  await closeCards(ctx, scope, encounter);
  await closePreparations(ctx, scope, encounter);
  await stopStructure(ctx, scope, encounter);
  const registrations = await ctx.db
    .query('clockRegistrations')
    .withIndex('by_encounter', q => q.eq('encounterId', encounter._id))
    .take(1001);
  if (registrations.length > 1000)
    throw new ConvexError('Too many clock registrations to archive safely.');
  for (const registration of registrations)
    if (registration.status === 'active')
      await journalPatch(ctx, scope, 'clockRegistrations', registration._id, { status: 'retired' });
  for (const hero of await closeoutHeroes(ctx, encounter))
    await journalPatch(ctx, scope, 'characters', hero._id, { combatLocked: false });
  await journalPatch(ctx, scope, 'encounters', encounter._id, { status, archivedAt: Date.now() });
  await indexArchivedEncounter(ctx, encounter);
  // Keep the session pointer to the archive: currentEncounter excludes it, and history sees the boundary.
}

type StartSnapshot = {
  characters: Record<string, Pick<Doc<'characters'>, 'liveState' | 'combatLocked'>>;
  foes: Record<string, Omit<Doc<'foes'>, '_id' | '_creationTime'>>;
  /** V02; absent in snapshots taken before squads existed. */
  squads?: Record<string, Omit<Doc<'squads'>, '_id' | '_creationTime'>>;
  campaign: { malice: number };
};

/** Uses the existing historical identity aliases when Convex must allocate a recreated document id. */
async function restoreStart(ctx: MutationCtx, scope: JournalScope, encounter: Doc<'encounters'>) {
  const snapshot = encounter.precombatSnapshotId
    ? await ctx.db.get(encounter.precombatSnapshotId)
    : null;
  if (!snapshot || snapshot.encounterId !== encounter._id || snapshot.kind !== 'encounter-start')
    throw new ConvexError('Combat-start snapshot unavailable; reset cannot proceed.');
  const state = snapshot.state as StartSnapshot;
  if (!state.characters || !state.foes || !state.campaign)
    throw new ConvexError('Combat-start snapshot is incomplete; reset cannot proceed.');
  const aliases = await ctx.db
    .query('historyAliases')
    .withIndex('by_campaign_former', q => q.eq('campaignId', encounter.campaignId))
    .take(10001);
  if (aliases.length > 10000)
    throw new ConvexError('Too many historical identities to restore safely.');
  const mapped = new Map(aliases.map(a => [a.formerId, a.currentId]));
  const resolve = (id: string) => {
    const seen = new Set<string>();
    while (mapped.has(id) && !seen.has(id)) {
      seen.add(id);
      id = mapped.get(id)!;
    }
    return id;
  };
  const keep = new Set<Id<'foes'>>();
  for (const [recordedId, value] of Object.entries(state.foes)) {
    const id = ctx.db.normalizeId('foes', resolve(recordedId));
    const existing = id ? await ctx.db.get(id) : null;
    if (existing && existing.campaignId !== encounter.campaignId)
      throw new ConvexError('Snapshot foe belongs to another campaign.');
    if (existing) {
      await journalPatch(ctx, scope, 'foes', existing._id, value);
      keep.add(existing._id);
    } else {
      const created = await journalInsert(ctx, scope, 'foes', value);
      const formerId = resolve(recordedId);
      const alias = aliases.find(a => a.formerId === formerId);
      if (alias) await ctx.db.patch(alias._id, { currentId: created });
      else
        await ctx.db.insert('historyAliases', {
          campaignId: encounter.campaignId,
          formerId,
          currentId: created,
        });
      mapped.set(formerId, created);
      keep.add(created);
    }
  }
  const foes = await ctx.db
    .query('foes')
    .withIndex('by_campaign', q => q.eq('campaignId', encounter.campaignId))
    .take(201);
  if (foes.length > 200) throw new ConvexError('Too many foes to reset safely.');
  for (const foe of foes) if (!keep.has(foe._id)) await journalDelete(ctx, scope, 'foes', foe._id);
  // V02: squads after their members so recreated member ids resolve through the aliases.
  const keepSquads = new Set<Id<'squads'>>();
  for (const [recordedId, value] of Object.entries(state.squads ?? {})) {
    const id = ctx.db.normalizeId('squads', resolve(recordedId));
    const existing = id ? await ctx.db.get(id) : null;
    if (existing && existing.campaignId !== encounter.campaignId)
      throw new ConvexError('Snapshot squad belongs to another campaign.');
    const mapped = {
      ...value,
      memberIds: value.memberIds.map(m => ctx.db.normalizeId('foes', resolve(m)) ?? m),
      captainId: value.captainId
        ? (ctx.db.normalizeId('foes', resolve(value.captainId)) ?? null)
        : null,
    };
    if (existing) {
      await journalPatch(ctx, scope, 'squads', existing._id, mapped);
      keepSquads.add(existing._id);
    } else {
      const created = await journalInsert(ctx, scope, 'squads', mapped);
      const formerId = resolve(recordedId);
      const alias = aliases.find(a => a.formerId === formerId);
      if (alias) await ctx.db.patch(alias._id, { currentId: created });
      else
        await ctx.db.insert('historyAliases', {
          campaignId: encounter.campaignId,
          formerId,
          currentId: created,
        });
      keepSquads.add(created);
      // Recreated members point at the recorded squad id; re-link them to the new row.
      for (const memberId of mapped.memberIds) {
        const member = await ctx.db.get(memberId as Id<'foes'>);
        if (member && member.squadId !== created)
          await journalPatch(ctx, scope, 'foes', member._id, { squadId: created });
      }
    }
  }
  const squads = await ctx.db
    .query('squads')
    .withIndex('by_campaign', q => q.eq('campaignId', encounter.campaignId))
    .take(201);
  for (const squad of squads)
    if (!keepSquads.has(squad._id)) await journalDelete(ctx, scope, 'squads', squad._id);
  for (const [recordedId, value] of Object.entries(state.characters)) {
    const id = ctx.db.normalizeId('characters', recordedId);
    const hero = id ? await ctx.db.get(id) : null;
    // Never recreate deleted accounts/characters or restore revoked campaign access.
    if (hero?.campaignId === encounter.campaignId)
      await journalPatch(ctx, scope, 'characters', hero._id, { liveState: value.liveState });
  }
  await journalPatch(ctx, scope, 'campaigns', encounter.campaignId, {
    malice: state.campaign.malice,
  });
}

/** Caller records combat.voided first; session closure may call this in the same transaction. */
export async function voidEncounter(
  ctx: MutationCtx,
  scope: JournalScope,
  encounter: Doc<'encounters'>,
  mode: VoidMode,
): Promise<void> {
  if (encounter.archivedAt !== null || encounter.status !== 'committed')
    throw new ConvexError('No active combat.');
  if (mode === 'reset') await restoreStart(ctx, scope, encounter);
  await archive(ctx, scope, encounter, 'voided');
}

async function consequence(
  ctx: MutationCtx,
  scope: JournalScope,
  encounter: Doc<'encounters'>,
  kind: string,
  description: string,
  data: unknown,
) {
  const cause = (await ctx.db.get(scope.eventId))!;
  const eventId = await appendEvent(ctx, {
    campaignId: encounter.campaignId,
    sessionId: encounter.sessionId,
    encounterId: encounter._id,
    origin: 'engine',
    commandId: cause.commandId,
    causeEventId: scope.eventId,
    kind,
    description,
    payload: { data },
  });
  return { campaignId: scope.campaignId, eventId };
}

const end: OperationDefinition = {
  id: 'combat.end',
  family: 'combat',
  verb: 'end',
  title: 'End combat',
  description:
    'End structured turns and close unused combat response cards; proceed to explicit Victory awards and cleanup.',
  args: { encounter: v.optional(v.string()) },
  argDescriptions: { encounter: 'Encounter id from the current card; rejects stale controls.' },
  roles: ['director'],
  session: 'running',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const encounter = await active(ctx, context, false, args.encounter);
    if (encounter.phase === 'closeout') throw new ConvexError('Combat is already in closeout.');
    return {
      kind: 'combat.ended',
      description:
        'Combat ended. Structured turns stop; no final turn or round effects are triggered. Review optional unresolved clauses, confirm Victories, then finish cleanup.',
      commit: async (writer, scope) => {
        await closeCards(writer, scope, encounter);
        await closePreparations(writer, scope, encounter);
        await stopStructure(writer, scope, encounter);
        await journalPatch(writer, scope, 'encounters', encounter._id, { phase: 'closeout' });
      },
    };
  },
};

const victories: OperationDefinition = {
  id: 'combat.victories',
  family: 'combat',
  verb: 'victories',
  title: 'Confirm Victory award',
  description:
    'Confirm a nonnegative whole-number Victory amount and the eligible surviving heroes whose party objectives were achieved. Initial 1 is a proposal, never an automatic award.',
  args: {
    encounter: v.optional(v.string()),
    amount: v.number(),
    recipients: v.array(v.string()),
  },
  argDescriptions: {
    encounter: 'Encounter id from the current card.',
    amount: 'Victories per recipient; a whole number, including 0.',
    recipients: 'Character ids selected by the Director from combat participants.',
  },
  roles: ['director'],
  session: 'running',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const encounter = await active(ctx, context, true, args.encounter);
    if (encounter.victoryAward)
      throw new ConvexError('Victories are already confirmed for this encounter.');
    const amount = args.amount as number;
    const recipients = args.recipients as string[];
    if (!Number.isSafeInteger(amount) || amount < 0)
      throw new ConvexError('Victory amount must be a nonnegative whole number.');
    if (new Set(recipients).size !== recipients.length)
      throw new ConvexError('Select each recipient once.');
    const heroes = await closeoutHeroes(ctx, encounter);
    const selected = recipients.map(id => heroes.find(hero => hero._id === id));
    if (selected.some(hero => !hero))
      throw new ConvexError(
        'Victory recipients must be current hero participants in this encounter.',
      );
    for (const hero of selected)
      if (!Number.isSafeInteger(hero!.liveState!.victories + amount))
        throw new ConvexError('Resulting Victories exceed the supported whole-number range.');
    return {
      kind: 'combat.victories-confirmed',
      description: `${context.user.displayName} confirmed ${amount} ${amount === 1 ? 'Victory' : 'Victories'} for ${selected.map(h => h!.authored.name).join(', ') || 'no heroes'}.`,
      data: { amount, recipients, sourcePath: `${SOURCE_ROOT}resource/victories.md` },
      commit: async (writer, scope) => {
        for (const hero of selected) {
          const before = hero!.liveState!.victories;
          const child = await consequence(
            writer,
            scope,
            encounter,
            'combat.victory-awarded',
            `${hero!.authored.name}: Victories ${before} → ${before + amount} (Director-confirmed award).`,
            { characterId: hero!._id, before, amount, after: before + amount },
          );
          await journalPatch(writer, child, 'characters', hero!._id, {
            liveState: { ...hero!.liveState!, victories: before + amount },
          });
        }
        await journalPatch(writer, scope, 'encounters', encounter._id, {
          victoryAward: {
            amount,
            recipientIds: recipients as Id<'characters'>[],
            eventId: scope.eventId,
          },
        });
      },
    };
  },
};

const finish: OperationDefinition = {
  id: 'combat.finish',
  family: 'combat',
  verb: 'finish',
  title: 'Finish cleanup',
  description:
    'Clear heroes’ remaining surges and creatures’ temporary Stamina, complete the common Malice ending lifecycle, remove defeated foes and archive combat. Ordinary Stamina and condition toggles remain.',
  args: { encounter: v.optional(v.string()) },
  argDescriptions: { encounter: 'Encounter id from the current card; rejects stale controls.' },
  roles: ['director'],
  session: 'running',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const encounter = await active(ctx, context, true, args.encounter);
    if (!encounter.victoryAward)
      throw new ConvexError('Confirm the Victory amount and recipients first (0 is allowed).');
    return {
      kind: 'combat.finished',
      description:
        'Cleanup finished; unused cleanup choices closed and the encounter archived. The table returns to FreePlay.',
      commit: async (writer, scope) => {
        for (const hero of await closeoutHeroes(writer, encounter)) {
          let liveState = hero.liveState!;
          for (const field of ['surges', 'temporaryStamina'] as const) {
            const before = liveState[field];
            if (before === 0) continue;
            const sourcePath = `${SOURCE_ROOT}${field === 'surges' ? 'resource/surge.md' : 'health/temporary-stamina.md'}`;
            const child = await consequence(
              writer,
              scope,
              encounter,
              'combat.resource-cleared',
              `${hero.authored.name}: ${field === 'surges' ? 'surges' : 'temporary Stamina'} ${before} → 0 (combat cleanup).`,
              { characterId: hero._id, field, before, after: 0, sourcePath },
            );
            liveState = { ...liveState, [field]: 0 };
            await journalPatch(writer, child, 'characters', hero._id, { liveState });
          }
        }
        await dispatchBoundary(writer, scope, encounter._id, {
          kind: 'combat-end',
          round: encounter.round ?? 0,
        });
        const foes = await writer.db
          .query('foes')
          .withIndex('by_campaign', q => q.eq('campaignId', encounter.campaignId))
          .take(201);
        if (foes.length > 200) throw new ConvexError('Too many foes to clean up safely.');
        for (const foe of foes)
          if (foe.live.stamina <= 0) {
            const child = await consequence(
              writer,
              scope,
              encounter,
              'combat.foe-cleaned-up',
              `${foe.name}: defeated foe removed during cleanup.`,
              { foeId: foe._id, ...(foe.squadId ? { squadId: foe.squadId } : {}) },
            );
            await journalDelete(writer, child, 'foes', foe._id);
          } else if (foe.live.temporaryStamina !== 0) {
            // Temporary Stamina is a creature rule, including foes retained after this encounter.
            const before = foe.live.temporaryStamina;
            const child = await consequence(
              writer,
              scope,
              encounter,
              'combat.resource-cleared',
              `${foe.name}: temporary Stamina ${before} → 0 (combat cleanup).`,
              {
                foeId: foe._id,
                field: 'temporaryStamina',
                before,
                after: 0,
                publicDescription: `${foe.name}: temporary Stamina cleared (combat cleanup).`,
                sourcePath: `${SOURCE_ROOT}health/temporary-stamina.md`,
              },
            );
            await journalPatch(writer, child, 'foes', foe._id, {
              live: { ...foe.live, temporaryStamina: 0 },
            });
          }
        // V02: a squad whose minions are all gone leaves the roster with them; survivors keep
        // their pool, carried damage and captain across encounters (no automatic healing).
        const squads = await writer.db
          .query('squads')
          .withIndex('by_campaign', q => q.eq('campaignId', encounter.campaignId))
          .take(200);
        for (const squad of squads) {
          const remaining = await squadMembers(writer, squad);
          if (remaining.length) continue;
          const child = await consequence(
            writer,
            scope,
            encounter,
            'combat.squad-cleaned-up',
            `${squad.name}: defeated squad removed during cleanup.`,
            { squadId: squad._id },
          );
          await journalDelete(writer, child, 'squads', squad._id);
        }
        await archive(writer, scope, encounter, 'closed-out');
      },
    };
  },
};

const voidCombat: OperationDefinition = {
  id: 'combat.void',
  family: 'combat',
  verb: 'void',
  title: 'Void combat',
  description:
    'Archive combat keeping current state or restoring the recorded starting state; no awards or normal cleanup. Allowed while paused; the pause remains.',
  args: {
    encounter: v.optional(v.string()),
    mode: v.union(v.literal('keep'), v.literal('reset')),
  },
  argDescriptions: { encounter: 'Encounter id from the current card.', mode: 'keep or reset.' },
  roles: ['director'],
  session: 'active',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const encounter = await active(ctx, context, false, args.encounter);
    const mode = args.mode as VoidMode;
    return {
      kind: 'combat.voided',
      description: `Combat voided: ${mode === 'keep' ? 'kept current state' : 'restored combat-start state'}. No rewards or cleanup applied.${context.session?.status === 'paused' ? ' Session remains paused.' : ''}`,
      data: { mode },
      commit: (writer, scope) => voidEncounter(writer, scope, encounter, mode),
    };
  },
};

export const closeoutOperations: OperationDefinition[] = [end, victories, finish, voidCombat];
