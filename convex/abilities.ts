import type { CompiledResult } from '../shared/contracts/compiledResult';
import { publicCompiledResult } from './lib/compiledResults';
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
import { ConvexError, v } from 'convex/values';
import { query } from './_generated/server';
import { requireUser } from './lib/access';
import { tableContext } from './lib/registry';
import { actorRef } from './initiativeTables';
import { rollContributionValidator } from './abilityTables';
import { abilitiesFor, type AbilityDefinition } from './lib/resolve';
import { allowanceFor, loadActorRecords } from './lib/abilityOperations';
import { settingsOf } from './lib/audience';
import { resolveHistoricalId } from './lib/history';
import { loadReadCorrectionWindows } from './lib/historyRead';
import {
  resourceForgoState,
  resourceMaintenance,
  resourcePrayer,
  resourceTriggers,
} from './lib/resourceOperations';

export { abilityOperations } from './lib/abilityOperations';

const targetShape = v.union(
  v.object({ kind: v.literal('self') }),
  v.object({ kind: v.literal('single') }),
  v.object({ kind: v.literal('multi'), max: v.number() }),
  v.object({ kind: v.literal('area') }),
  v.object({ kind: v.literal('unknown'), text: v.string() }),
);

const abilityView = v.object({
  manualFeature: v.boolean(),
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
  permittedDamageCharacteristics: v.array(v.string()),
  fixedCost: v.union(v.object({ resource: v.string(), amount: v.number() }), v.null()),
  unknownCost: v.union(v.string(), v.null()),
  freeStrikeValue: v.union(v.number(), v.null()),
});

function projectAbility(ability: AbilityDefinition, director: boolean, foe: boolean) {
  return {
    manualFeature: !!ability.manualFeature,
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
    permittedDamageCharacteristics: [
      ...new Set(
        (ability.metadata?.tiers ?? []).flatMap(t =>
          t.damage?.kind === 'plusChoice' ? t.damage.choices : [],
        ),
      ),
    ],
    fixedCost: ability.fixedCost ?? null,
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
    damageCharacteristic: v.union(v.string(), v.null()),
    mode: v.union(v.literal('melee'), v.literal('ranged'), v.null()),
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
    /** V150: the Self-Taught forgo state (`resource.forgo`), when the hero can forgo. */
    resourceForgo: v.union(
      v.null(),
      v.object({
        forgoNext: v.boolean(),
        forgoing: v.boolean(),
        sourcePath: v.string(),
        quote: v.string(),
      }),
    ),
    /** V147: the hero's turn-start prayer (`resource.pray`), when their class has one. */
    resourcePrayer: v.union(
      v.null(),
      v.object({
        label: v.string(),
        prayNext: v.boolean(),
        sourcePath: v.string(),
        quote: v.string(),
      }),
    ),
    /** V148: persistent abilities the hero can maintain (`resource.maintain`), when any. */
    resourceMaintenance: v.union(
      v.null(),
      v.object({
        sourcePath: v.string(),
        quote: v.string(),
        inCombat: v.boolean(),
        abilities: v.array(
          v.object({
            name: v.string(),
            value: v.number(),
            sourcePath: v.string(),
            /** Instances currently maintained (one per target). */
            maintained: v.number(),
          }),
        ),
      }),
    ),
    /** V120: class heroic-resource triggers the table claims with `resource.claim`. */
    resourceTriggers: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        amount: v.number(),
        dice: v.union(v.number(), v.null()),
        observed: v.boolean(),
        resource: v.string(),
        limit: v.union(
          v.literal('round'),
          v.literal('turn'),
          v.literal('encounter'),
          v.literal('each'),
        ),
        sourcePath: v.string(),
        quote: v.string(),
        confirmation: v.string(),
        unavailable: v.union(v.string(), v.null()),
      }),
    ),
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
    const mayRead =
      director || (args.actor.kind === 'character' && records.character?.ownerId === user._id);
    const abilities = mayRead ? await abilitiesFor(ctx, args.actor, records) : [];
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
              damageCharacteristic: mine.damageCharacteristic ?? null,
              mode: mine.mode ?? null,
            }
          : null,
      otherDrafts: others,
      missingFacts:
        mayRead &&
        args.actor.kind === 'character' &&
        !records.facts &&
        !records.character?.derivedBaseline
          ? `${args.actor.name} has no recorded characteristics or kit bonuses (no evaluated build); the Director records them with /hero facts.`
          : null,
      resourceForgo: mayRead && records.character ? resourceForgoState(records.character) : null,
      resourcePrayer: mayRead && records.character ? resourcePrayer(records.character) : null,
      resourceMaintenance:
        mayRead && records.character
          ? await resourceMaintenance(ctx, context.campaign, records.character)
          : null,
      resourceTriggers:
        mayRead && records.character
          ? await resourceTriggers(ctx, context.campaign, records.character)
          : [],
    };
  },
});

const disposition = v.object({ clause: v.string(), eventId: v.id('events'), note: v.string() });

/** Effective results of resolved ability uses in this campaign, newest first. */
export const results = query({
  args: { campaignId: v.id('campaigns'), eventIds: v.optional(v.array(v.id('events'))) },
  returns: v.array(
    v.object({
      id: v.id('abilityResults'),
      eventId: v.id('events'),
      actor: actorRef,
      abilityId: v.string(),
      abilityName: v.string(),
      compiled: v.optional(v.any()),
      execution: v.optional(v.any()),
      /** V157: no power roll, so no dice, characteristic or per-target outcome. */
      effectOnly: v.optional(v.literal(true)),
      dice: v.optional(v.object({ d10a: v.number(), d10b: v.number() })),
      characteristicValue: v.optional(v.number()),
      selectedCharacteristic: v.union(v.string(), v.null()),
      targets: v.array(
        v.object({
          target: actorRef,
          edges: v.number(),
          banes: v.number(),
          /** V159: automatic contributions of active effects, with the table's exclusions. */
          contributions: v.optional(v.array(rollContributionValidator)),
          outcome: v.any(),
          applied: v.any(),
          dispositions: v.array(disposition),
          originalTargetId: v.optional(v.string()),
        }),
      ),
      manualDispositions: v.array(disposition),
      correctionEventIds: v.array(v.id('events')),
      /** Whether the viewer may submit a correction for this use now. */
      mayCorrect: v.boolean(),
      mayResolve: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const context = await tableContext(ctx, user, args.campaignId);
    const director = context.role === 'director';
    const numerical = settingsOf(context.campaign).healthDisplay === 'numerical';
    if (args.eventIds && args.eventIds.length > 50)
      throw new ConvexError('Request at most one visible log page.');
    const selected = args.eventIds
      ? await Promise.all(
          [...new Set(args.eventIds)].map(eventId =>
            ctx.db
              .query('abilityResults')
              .withIndex('by_event', q => q.eq('eventId', eventId))
              .unique(),
          ),
        )
      : null;
    const rows = selected
      ? selected.filter(
          (row): row is NonNullable<typeof row> => !!row && row.campaignId === args.campaignId,
        )
      : await ctx.db
          .query('abilityResults')
          .withIndex('by_campaign', q => q.eq('campaignId', args.campaignId))
          .order('desc')
          .take(100);
    if (!rows.length) return [];
    const windowFor = await loadReadCorrectionWindows(ctx, context);
    const windows = new Map<string, boolean>();
    const manualWindows = new Map<string, boolean>();
    const aliases = new Map<string, string>();
    for (const row of rows) {
      windows.set(row._id, (await windowFor(row.eventId)).allowed);
      manualWindows.set(row._id, director && (await windowFor(row.eventId, 'manual')).allowed);
      for (const actor of [row.actor, ...row.targets.map(t => t.target)])
        if (!aliases.has(actor.id))
          aliases.set(actor.id, await resolveHistoricalId(ctx, args.campaignId, actor.id));
    }
    // Historical effects retain original target IDs, while controller authority follows the
    // current restored character. Never infer authority from the acting ability's controller.
    const controlledTargetIds = new Set<string>();
    if (!director && context.role === 'player') {
      for (const row of rows) {
        for (const { target } of row.targets) {
          if (target.kind !== 'character' || controlledTargetIds.has(target.id)) continue;
          const currentId = aliases.get(target.id) ?? target.id;
          const characterId = ctx.db.normalizeId('characters', currentId);
          const character = characterId ? await ctx.db.get(characterId) : null;
          if (character?.campaignId === args.campaignId && character.ownerId === user._id)
            controlledTargetIds.add(target.id);
        }
      }
    }
    return rows.map(row => ({
      id: row._id,
      eventId: row.eventId,
      actor: { ...row.actor, id: aliases.get(row.actor.id) ?? row.actor.id },
      abilityId: row.abilityId,
      abilityName: row.abilityName,
      ...(row.execution ? { execution: row.execution } : {}),
      ...(row.compiled
        ? {
            compiled: publicCompiledResult(
              row.compiled as CompiledResult,
              new Set(row.targets.filter(t => t.target.kind === 'foe').map(t => t.target.id)),
              director,
              numerical,
              controlledTargetIds,
            ),
          }
        : {}),
      ...(row.effectOnly ? { effectOnly: true as const } : {}),
      ...(row.dice ? { dice: row.dice } : {}),
      ...(row.characteristicValue !== undefined
        ? { characteristicValue: row.characteristicValue }
        : {}),
      selectedCharacteristic: row.selectedCharacteristic,
      targets: row.targets.map(t => ({
        ...t,
        target: { ...t.target, id: aliases.get(t.target.id) ?? t.target.id },
        ...(row.compiled ? { originalTargetId: t.target.id } : {}),
        // Foe Stamina numbers follow the health-display setting for players and observers.
        applied:
          t.applied && t.target.kind === 'foe' && !director
            ? hideFoeStamina(t.applied as Record<string, unknown>, numerical)
            : t.applied,
      })),
      manualDispositions: row.manualDispositions,
      correctionEventIds: row.correctionEventIds,
      mayCorrect: windows.get(row._id) ?? false,
      mayResolve: manualWindows.get(row._id) ?? false,
    }));
  },
});

/** Keeps the damage arithmetic public and removes the foe's resulting Stamina values. */
export function hideFoeStamina(
  application: Record<string, unknown>,
  numerical = false,
): Record<string, unknown> {
  const { staminaBefore, staminaAfter, temporaryStaminaBefore, temporaryStaminaAfter, ...rest } =
    application;
  void staminaBefore;
  void staminaAfter;
  void temporaryStaminaBefore;
  void temporaryStaminaAfter;
  return { ...rest, ...(numerical ? { staminaBefore, staminaAfter } : {}) };
}
