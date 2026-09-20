// SPDX-License-Identifier: GPL-3.0-only
/**
 * The encounter read for every role: the setup card state, the opening phase, the initiative
 * roster of groups and actor-linked turn entries, and the turn in progress. Audience rules apply on
 * the server: draft controls and choices are the Director's; everyone sees the shared phases, the
 * participants and the initiative order (every loaded foe is visible in v0.01).
 *
 * Owning specifications: docs/table-spec.md#confirmed-initiative-setup-and-shared-presentation
 * (Director setup controls; other viewers see status and response controls; observers cannot roll),
 * #initiative-groups-confirmed-app-model, #mid-combat-additions-and-regrouping (spent entries
 * grayed), #taking-a-turn. The operations are in convex/lib/combatOperations.ts.
 */
import { v } from 'convex/values';
import { query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { requireUser } from './lib/access';
import { tableContext } from './lib/registry';
import { currentEncounter } from './lib/encounters';
import { effectiveDraft } from './lib/combatOperations';
import { squadInBattle } from './lib/squads';
import { actorRef, side } from './initiativeTables';

export { combatOperations } from './lib/combatOperations';

const phase = v.union(
  v.literal('setup'),
  v.literal('roll'),
  v.literal('choice'),
  v.literal('turns'),
  v.literal('closeout'),
);

const participant = v.object({
  key: v.string(),
  actor: actorRef,
  side,
  included: v.boolean(),
  surprised: v.boolean(),
  groupKey: v.string(),
  /** Whether the viewer may act for this creature (Director: all; player: own heroes). */
  controlled: v.boolean(),
});

const entry = v.object({
  id: v.id('turnEntries'),
  actor: actorRef,
  source: v.union(v.literal('ordinary'), v.literal('granted')),
  /** Spent for the current round (advisory graying). */
  spent: v.boolean(),
  surprised: v.boolean(),
  slain: v.boolean(),
  controlled: v.boolean(),
  /** The entry's turn is in progress. */
  active: v.boolean(),
});

const group = v.object({
  id: v.id('initiativeGroups'),
  side,
  order: v.number(),
  /** Finished its activation this round: does not reopen. */
  completed: v.boolean(),
  active: v.boolean(),
  entries: v.array(entry),
});

export const current = query({
  args: { campaignId: v.id('campaigns') },
  returns: v.union(
    v.null(),
    v.object({
      id: v.id('encounters'),
      status: v.union(
        v.literal('draft'),
        v.literal('committed'),
        v.literal('closed-out'),
        v.literal('voided'),
      ),
      phase: v.union(phase, v.null()),
      round: v.number(),
      startingSide: v.union(side, v.null()),
      activeSide: v.union(side, v.null()),
      opening: v.union(
        v.null(),
        v.object({
          path: v.union(
            v.literal('roll'),
            v.literal('surprise-determined'),
            v.literal('adjudication'),
          ),
          surprisedSides: v.array(side),
          roll: v.union(
            v.null(),
            v.object({
              value: v.number(),
              entitlement: v.union(v.literal('players'), v.literal('director')),
              rolledByName: v.string(),
            }),
          ),
          chosenByName: v.union(v.string(), v.null()),
        }),
      ),
      /** The setup card's pending interaction, while a draft is open. */
      setupInteractionId: v.union(v.id('interactions'), v.null()),
      /** Draft participants against the live rosters; the Director sees choices, others the lists. */
      participants: v.array(participant),
      /** Whether the viewer may change the draft (the Director). */
      mayEditSetup: v.boolean(),
      mayRoll: v.boolean(),
      mayChooseFirst: v.boolean(),
      groups: v.array(group),
      activeTurn: v.union(
        v.null(),
        v.object({
          id: v.id('turns'),
          entryId: v.id('turnEntries'),
          groupId: v.id('initiativeGroups'),
          actor: actorRef,
          round: v.number(),
          /** The viewer may end this turn (controls the actor, or is the Director). */
          mayEnd: v.boolean(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const context = await tableContext(ctx, user, args.campaignId);
    if (!context.session) return null;
    const encounter = await currentEncounter(ctx, context.session);
    if (!encounter) return null;
    const director = context.role === 'director';
    const owned = new Set(
      (
        await ctx.db
          .query('characters')
          .withIndex('by_campaign', q => q.eq('campaignId', args.campaignId))
          .take(200)
      )
        .filter(c => c.ownerId === user._id)
        .map(c => c._id as string),
    );
    const controls = (actor: { kind: string; id: string }) =>
      director || (context.role === 'player' && actor.kind === 'character' && owned.has(actor.id));
    const round = encounter.round ?? 0;
    const participants = encounter.draft
      ? (await effectiveDraft(ctx, args.campaignId, encounter.draft)).map(p => ({
          key: p.key,
          actor: p.actor,
          side: p.side,
          included: p.included,
          surprised: p.surprised,
          groupKey: p.groupKey,
          controlled: controls(p.actor),
        }))
      : [];
    const groupRows = await ctx.db
      .query('initiativeGroups')
      .withIndex('by_encounter', q => q.eq('encounterId', encounter._id))
      .take(500);
    const entryRows = await ctx.db
      .query('turnEntries')
      .withIndex('by_encounter', q => q.eq('encounterId', encounter._id))
      .take(1000);
    entryRows.sort((a, b) => a.order - b.order);
    const activeTurn = encounter.activeTurnId ? await ctx.db.get(encounter.activeTurnId) : null;
    const slain = new Map<string, boolean>();
    for (const row of entryRows) {
      if (slain.has(row.actor.id)) continue;
      if (row.actor.kind === 'squad') {
        slain.set(row.actor.id, !(await squadInBattle(ctx, row.actor.id as Id<'squads'>)));
        continue;
      }
      if (row.actor.kind !== 'foe') continue;
      const foe = await ctx.db.get(row.actor.id as Doc<'foes'>['_id']);
      slain.set(row.actor.id, !foe || foe.live.stamina <= 0);
    }
    const groups = groupRows.map(g => ({
      id: g._id,
      side: g.side,
      order: g.order,
      completed: g.completedRound === round,
      active: encounter.activeGroupId === g._id,
      entries: entryRows
        .filter(e => e.groupId === g._id)
        .map(e => ({
          id: e._id,
          actor: e.actor,
          source: e.source,
          spent: e.spentRound === round,
          surprised: e.surprised,
          slain: slain.get(e.actor.id) ?? false,
          controlled: controls(e.actor),
          active: activeTurn?.turnEntryId === e._id,
        })),
    }));
    const pendingCards = encounter.draft
      ? await ctx.db
          .query('interactions')
          .withIndex('by_campaign_status', q =>
            q.eq('campaignId', args.campaignId).eq('status', 'awaiting-input'),
          )
          .take(100)
      : [];
    const setupCard =
      pendingCards.find(
        row => row.kind === 'combat-setup' && row.sessionId === encounter.sessionId,
      ) ?? null;
    const opening = encounter.opening ?? null;
    const entitlement = opening?.roll?.entitlement ?? 'director';
    const running = context.session.status === 'running';
    return {
      id: encounter._id,
      status: encounter.status,
      phase: encounter.phase ?? null,
      round,
      startingSide: encounter.startingSide ?? null,
      activeSide: encounter.activeSide ?? null,
      opening: opening
        ? {
            path: opening.path,
            surprisedSides: opening.surprisedSides,
            roll: opening.roll
              ? {
                  value: opening.roll.value,
                  entitlement: opening.roll.entitlement,
                  rolledByName: (await ctx.db.get(opening.roll.rolledBy))?.displayName ?? 'Unknown',
                }
              : null,
            chosenByName: opening.chosenBy
              ? ((await ctx.db.get(opening.chosenBy))?.displayName ?? 'Unknown')
              : null,
          }
        : null,
      setupInteractionId: setupCard?._id ?? null,
      participants,
      mayEditSetup: director && encounter.status === 'draft' && running,
      // Observers cannot roll; any active player or the Director can (confirmed audience).
      mayRoll: running && encounter.phase === 'roll' && context.role !== 'observer',
      mayChooseFirst:
        running &&
        encounter.phase === 'choice' &&
        (director || (context.role === 'player' && entitlement === 'players')),
      groups,
      activeTurn: activeTurn
        ? {
            id: activeTurn._id,
            entryId: activeTurn.turnEntryId,
            groupId: activeTurn.groupId,
            actor: activeTurn.actor,
            round: activeTurn.round,
            mayEnd: running && encounter.phase === 'turns' && controls(activeTurn.actor),
          }
        : null,
    };
  },
});
