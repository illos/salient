// SPDX-License-Identifier: GPL-3.0-only
/**
 * The ability read side for A05: the sheet's ability list for one actor from S01 metadata plus the
 * common actions (select for use versus expand to read the verbatim text), the advisory action
 * allowance for the turn in progress including a recorded critical-hit opportunity, and the
 * effective per-target records of resolved uses that the log cards render (corrections and
 * Resolved at table dispositions included). Audience rules apply on the server: a foe's Stamina
 * numbers follow the health-display setting; the stat-block text of a foe ability is Director-only.
 *
 * Owning specifications: docs/table-spec.md#player-sheet-actions-and-explicit-end-turn,
 * #v001-critical-hits-and-additional-main-actions, #monster-visibility-and-health-display,
 * #director-edits-to-inline-results, #inline-interaction-cards-in-the-game-log.
 * The operations live in convex/lib/abilityOperations.ts.
 */
import { v } from 'convex/values';
import { query } from './_generated/server';
import { requireUser } from './lib/access';
import { tableContext } from './lib/registry';
import { actorRef } from './initiativeTables';
import { abilitiesFor, type AbilityDefinition } from './lib/resolve';
import { allowanceFor, loadActorRecords } from './lib/abilityOperations';
import { settingsOf } from './lib/audience';
import { correctionWindow } from './lib/history';

export { abilityOperations } from './lib/abilityOperations';

const targetShape = v.union(
  v.object({ kind: v.literal('self') }),
  v.object({ kind: v.literal('single') }),
  v.object({ kind: v.literal('multi'), max: v.number() }),
  v.object({ kind: v.literal('area') }),
  v.object({ kind: v.literal('unknown'), text: v.string() }),
);

const abilityView = v.object({
  id: v.string(),
  name: v.string(),
  kind: v.union(
    v.literal('rolled'),
    v.literal('creature-free-strike'),
    v.literal('catch-breath'),
    v.literal('recorded'),
  ),
  contentId: v.string(),
  actionType: v.union(v.string(), v.null()),
  usage: v.string(),
  keywords: v.array(v.string()),
  cost: v.union(v.string(), v.null()),
  distance: v.string(),
  target: v.string(),
  roll: v.union(v.string(), v.null()),
  tiers: v.union(v.array(v.string()), v.null()),
  effects: v.array(v.object({ label: v.string(), text: v.string() })),
  /** Verbatim source text; null when the viewer may not read it (a foe's stat block). */
  text: v.union(v.string(), v.null()),
  sourcePath: v.string(),
  targetShape,
  permittedCharacteristics: v.array(v.string()),
  fixedCost: v.union(v.object({ resource: v.string(), amount: v.number() }), v.null()),
  unknownCost: v.union(v.string(), v.null()),
  freeStrikeValue: v.union(v.number(), v.null()),
});

function projectAbility(ability: AbilityDefinition, director: boolean, foe: boolean) {
  return {
    id: ability.abilityId,
    name: ability.name,
    kind: ability.kind,
    contentId: ability.contentId,
    actionType: ability.actionType,
    usage: ability.usage,
    keywords: ability.keywords,
    cost: ability.cost ?? null,
    distance: ability.distance,
    target: ability.target,
    roll: ability.roll ?? null,
    tiers: ability.tiers ?? null,
    effects: ability.effects ?? [],
    // Full monster stat blocks are Director-only (docs/table-spec.md#monster-visibility-and-health-display).
    text:
      director || !foe || !ability.abilityId.startsWith(`${ability.contentId}/`)
        ? ability.text
        : null,
    sourcePath: ability.source.path,
    targetShape: ability.targetShape,
    permittedCharacteristics: ability.metadata?.permittedCharacteristics ?? [],
    fixedCost: ability.metadata?.fixedCost ?? null,
    unknownCost: ability.unknownCost ?? null,
    freeStrikeValue: ability.freeStrikeValue ?? null,
  };
}

const draftView = v.union(
  v.null(),
  v.object({
    actor: v.union(actorRef, v.null()),
    abilityId: v.union(v.string(), v.null()),
    targets: v.array(actorRef),
    modifiers: v.record(v.string(), v.object({ edges: v.number(), banes: v.number() })),
    characteristic: v.union(v.string(), v.null()),
  }),
);

export const sheet = query({
  args: { campaignId: v.id('campaigns'), actor: actorRef },
  returns: v.object({
    controlled: v.boolean(),
    abilities: v.array(abilityView),
    allowance: v.object({
      inCombat: v.boolean(),
      onTurn: v.boolean(),
      mainUsed: v.number(),
      maneuverUsed: v.number(),
      /** Recorded critical-hit additional main actions still available to the acting user. */
      extraMainOffered: v.number(),
    }),
    /** The viewer's own draft, when it is for this actor. */
    draft: draftView,
    /** Other users' drafts targeting at this table (names only; distinct indicators). */
    otherDrafts: v.array(
      v.object({
        userName: v.string(),
        actor: v.union(actorRef, v.null()),
        targets: v.array(actorRef),
      }),
    ),
    /** Facts a hero needs before rolled abilities resolve; null when present or not a hero. */
    missingFacts: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const context = await tableContext(ctx, user, args.campaignId);
    const director = context.role === 'director';
    const records = await loadActorRecords(ctx, context, args.actor);
    const controlled =
      director ||
      (context.role === 'player' &&
        args.actor.kind === 'character' &&
        records.character?.ownerId === user._id);
    const abilities = await abilitiesFor(ctx, args.actor, records);
    const allowance = await allowanceFor(ctx, context, args.actor);
    const drafts = await ctx.db
      .query('targetingDrafts')
      .withIndex('by_campaign_user', q => q.eq('campaignId', args.campaignId))
      .take(100);
    const mine = drafts.find(d => d.userId === user._id) ?? null;
    const others = await Promise.all(
      drafts
        .filter(d => d.userId !== user._id && d.targets.length)
        .map(async d => ({
          userName: (await ctx.db.get(d.userId))?.displayName ?? 'Unknown',
          actor: d.actor,
          targets: d.targets,
        })),
    );
    return {
      controlled,
      abilities: abilities.map(a => projectAbility(a, director, args.actor.kind === 'foe')),
      allowance: {
        inCombat: allowance.inCombat,
        onTurn: allowance.onTurn,
        mainUsed: allowance.mainUsed,
        maneuverUsed: allowance.maneuverUsed,
        extraMainOffered: allowance.extraMainOffered.length,
      },
      draft:
        mine && mine.actor && mine.actor.id === args.actor.id
          ? {
              actor: mine.actor,
              abilityId: mine.abilityId,
              targets: mine.targets,
              modifiers: mine.modifiers,
              characteristic: mine.characteristic,
            }
          : null,
      otherDrafts: others,
      missingFacts:
        args.actor.kind === 'character' && !records.facts
          ? `${args.actor.name} has no recorded characteristics or kit bonuses (no evaluated build); the Director records them with /hero facts.`
          : null,
    };
  },
});

const disposition = v.object({ clause: v.string(), eventId: v.id('events'), note: v.string() });

/** Effective results of resolved ability uses in this campaign, newest first. */
export const results = query({
  args: { campaignId: v.id('campaigns') },
  returns: v.array(
    v.object({
      id: v.id('abilityResults'),
      eventId: v.id('events'),
      actor: actorRef,
      abilityId: v.string(),
      abilityName: v.string(),
      dice: v.object({ d10a: v.number(), d10b: v.number() }),
      characteristicValue: v.number(),
      selectedCharacteristic: v.union(v.string(), v.null()),
      targets: v.array(
        v.object({
          target: actorRef,
          edges: v.number(),
          banes: v.number(),
          outcome: v.any(),
          applied: v.any(),
          dispositions: v.array(disposition),
        }),
      ),
      manualDispositions: v.array(disposition),
      correctionEventIds: v.array(v.id('events')),
      /** Whether the viewer may submit a correction for this use now. */
      mayCorrect: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const context = await tableContext(ctx, user, args.campaignId);
    const director = context.role === 'director';
    const numerical = settingsOf(context.campaign).healthDisplay === 'numerical';
    const rows = await ctx.db
      .query('abilityResults')
      .withIndex('by_campaign', q => q.eq('campaignId', args.campaignId))
      .order('desc')
      .take(100);
    const windows = new Map<string, boolean>();
    for (const row of rows)
      windows.set(row._id, (await correctionWindow(ctx, row.eventId, user)).allowed);
    return rows.map(row => ({
      id: row._id,
      eventId: row.eventId,
      actor: row.actor,
      abilityId: row.abilityId,
      abilityName: row.abilityName,
      dice: row.dice,
      characteristicValue: row.characteristicValue,
      selectedCharacteristic: row.selectedCharacteristic,
      targets: row.targets.map(t => ({
        ...t,
        // Foe Stamina numbers follow the health-display setting for players and observers.
        applied:
          t.applied && t.target.kind === 'foe' && !director && !numerical
            ? hideFoeStamina(t.applied as Record<string, unknown>)
            : t.applied,
      })),
      manualDispositions: row.manualDispositions,
      correctionEventIds: row.correctionEventIds,
      mayCorrect: windows.get(row._id) ?? false,
    }));
  },
});

/** Keeps the damage arithmetic public and removes the foe's resulting Stamina values. */
export function hideFoeStamina(application: Record<string, unknown>): Record<string, unknown> {
  const { staminaBefore, staminaAfter, temporaryStaminaBefore, temporaryStaminaAfter, ...rest } =
    application;
  void staminaBefore;
  void staminaAfter;
  void temporaryStaminaBefore;
  void temporaryStaminaAfter;
  return rest;
}
