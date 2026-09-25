import { heroicResourceFloor } from '../../shared/resolve/resourceFloor';
// SPDX-License-Identifier: GPL-3.0-only
/**
 * A05 ability operations, registered in convex/lib/registry.ts and reachable from the sheet, the
 * roster reticles, the palette, slash text and `pnpm app command` alike: ability selection and
 * targeting drafts with the confirmed auto-fire rules, the shared ability use (server dice, R04
 * arithmetic through shared/resolve, supported damage, fixed costs and the affordability block,
 * critical recognition with the recorded extra main action, verbatim unresolved clauses), Catch
 * Breath as a maneuver, Defend and Aid Attack recorded with their full text, post-roll edge/bane
 * corrections and the Director's Resolved at table disposition. Nothing in web/ resolves a rule.
 *
 * Owning specifications:
 * - docs/roll-and-damage-resolution.md (arithmetic, through shared/resolve/index.ts)
 * - docs/table-spec.md#roster-targeting-controls, docs/table-command-spec.md#roster-target-selection
 *   (per-user draft; single replaces and fires; multi toggles and fires at the full count or on
 *   explicit fire; area needs explicit fire; firing clears the draft; a refused activation has not fired)
 * - docs/table-spec.md#v001-edge-and-bane-inputs, #v001-roll-characteristic-default
 * - docs/table-spec.md#v001-critical-hits-and-additional-main-actions (offered, never executed)
 * - docs/table-spec.md#ability-costs-and-optional-spending, docs/table-command-spec.md#ability-costs-and-affordability
 *   (fixed cost debited on execution; unaffordable blocks every caller with no roll and no debit)
 * - docs/table-spec.md#player-sheet-actions-and-explicit-end-turn (allowance tracking is advisory)
 * - docs/table-spec.md#v001-catch-breath, #v001-defend-and-aid-attack, #v001-temporary-stamina
 * - docs/table-spec.md#director-edits-to-inline-results (same dice, per-target recompute, linked
 *   correction; acting-player window is A06's), #inline-interaction-cards-in-the-game-log
 *   (Resolved at table), docs/table-command-spec.md#target-and-fact-model
 * - docs/rules-adaptation-principles.md (warn without blocking except affordability; show full text)
 */
import { ConvexError, v } from 'convex/values';
import {
  grabEligibility,
  resolveCompiledAbility,
  resolveEffectOnly,
  smallerSize,
  type CompiledAbilityInput,
  type CompiledEffectOutcome,
  type CompiledGainOutcome,
  type EffectOnlyInput,
  type EffectOnlyRecipient,
} from '../../shared/resolve/compiledOutcome';
import { effectOccurrences, type CompiledResult } from '../../shared/contracts/compiledResult';
import { movementFacts, conditionFacts, grabbedBy } from './compiledResults';
import {
  applyConditionInstance,
  endConditionInstance,
  hasRolledConditionSave,
  replacedByUse,
  setManualCondition,
} from './conditionInstances';
import { appendEvent } from './events';
import {
  applyEffectInstance,
  consumeRollEffects,
  endLapsedEffects,
  endReusedEffects,
  lapsedEffects,
  type EffectHolder,
  type LapsedEffect,
} from './effectInstances';
import { describeDuration } from '../../shared/resolve/lastingEffects';
import {
  consumedBy,
  contributionIds,
  describeContribution,
  describeModifier,
  rollContributions,
  withContributions,
  type RollContribution,
} from '../../shared/resolve/modifiers';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { BoundActor, CommandEnvelope, Reference } from '../../shared/commands/envelope';
import type {
  AbilityMode,
  AbilityRollBlocked,
  AbilityRollResult,
  Characteristic,
  CostApplication,
  DamageApplication,
  DamageTargetFacts,
  TargetRollOutcome,
} from '../../shared/contracts/rollResolution';
import {
  CHARACTERISTICS,
  plainText,
  checkAffordability,
  effectiveFixedCost,
  correctTarget,
  modeMatters,
  resolveAbilityRoll,
  resolveCatchBreath,
  resolveCreatureFreeStrike,
  ignoredImmunityTypes,
  withoutImmunityTypes,
  applyDamage,
} from '../../shared/resolve/index';
import type { ReadCtx } from './access';
import { committedEncounter } from './encounters';
import {
  assertCorrectionAllowed,
  assertManualResolutionAllowed,
  resolveHistoricalId,
} from './history';
import { journalInsert, journalPatch, type JournalScope } from './journal';
import {
  assertCorrectionReconcilable,
  observeMaliceAbility,
  reconcileObservedGains,
} from './resourceTriggers';
import { rollDice } from './dice';
import { assertNotRevised, commitRevision, planRevision } from './damageRevisions';
import { damageTaken } from '../../shared/resolve/damageRevision';
import { commitStrained, planStrained, withStrainedPlan, type StrainedPlan } from './strainedUse';
import { assertWatchersReconcilable, noteManualWatchers, observeWatchers } from './watchers';
import { describeWatcher } from '../../shared/resolve/watchers';
import {
  acceptanceOrder,
  closeOffersOnPlay,
  offerOf,
  recheckOffer,
  resolveOffer,
} from './triggeredActions';
import { strainedExtraDamage, strainedState } from '../../shared/resolve/strained';
import {
  abilitiesFor,
  actorRollFacts,
  damageTargetFacts,
  findAbility,
  heroFacts,
  RECOVERIES_RULE_ID,
  CREATURE_FREE_STRIKE_RULE_ID,
  supportingSource,
  writeDamage,
  writePlannedDamage,
  ESCAPE_GRAB_ID,
  GRAB_ID,
  KNOCKBACK_ID,
  STAND_UP_ID,
  type AbilityDefinition,
  type TargetRecord,
} from './resolve';
import { requireContent } from '../content';
import { baselineOf, requireHeroLive, type HeroLive } from './characterBuild';
import {
  activeStrikeBenefit,
  commitSquadPlans,
  describeSquadPlans,
  minionApplication,
  planSquadDamage,
  squadCasualtyInteraction,
  squadPlanData,
} from './squads';
import {
  bindActor,
  run,
  type OperationDefinition,
  type Outcome,
  type Role,
  type TableContext,
} from './registry';

type Actor = BoundActor;
const actorKey = (actor: { kind: string; id: string }) => `${actor.kind}:${actor.id}`;
const sameActor = (a: { kind: string; id: string }, b: { kind: string; id: string }) =>
  a.kind === b.kind && a.id === b.id;
const PLAYERS: Role[] = ['director', 'player'];

// ---------------------------------------------------------------------------------------------
// Records.

export interface ActorRecords {
  actor: Actor;
  character?: Doc<'characters'>;
  foe?: Doc<'foes'>;
  /** V02: the member's squad, when the foe is a minion in one. */
  squad?: Doc<'squads'>;
  facts?: Doc<'heroRollFacts'> | null;
}

export async function loadActorRecords(
  ctx: ReadCtx,
  context: TableContext,
  actor: Actor,
): Promise<ActorRecords> {
  if (actor.kind === 'character') {
    const character = await ctx.db.get(actor.id as Id<'characters'>);
    if (!character || character.campaignId !== context.campaign._id)
      throw new ConvexError('That hero is not at this table.');
    return { actor, character, facts: await heroFacts(ctx, character._id) };
  }
  if (actor.kind === 'squad')
    throw new ConvexError(
      `${actor.name} is a squad: it acts together through /squad act and /squad free-strike, and its minions and captain are targeted individually.`,
    );
  const foe = await ctx.db.get(actor.id as Id<'foes'>);
  if (!foe || foe.campaignId !== context.campaign._id)
    throw new ConvexError('That foe is not at this table.');
  const squad = foe.squadId ? await ctx.db.get(foe.squadId) : null;
  return { actor, foe, ...(squad ? { squad } : {}) };
}

/** Resolves a target reference to a live creature at the table. Targeting needs no control. */
export async function bindTarget(
  ctx: ReadCtx,
  context: TableContext,
  reference: Reference,
  actor: Actor | null,
): Promise<TargetRecord> {
  if ('selector' in reference) {
    if (!actor) throw new ConvexError('@self needs an acting character.');
    return loadActorRecords(ctx, context, actor);
  }
  const director: TableContext = { ...context, role: 'director' };
  const currentReference =
    'id' in reference
      ? { ...reference, id: await resolveHistoricalId(ctx, context.campaign._id, reference.id) }
      : reference;
  const bound = await bindActor(ctx, director, currentReference);
  return loadActorRecords(ctx, context, bound);
}

const referenceValidator = v.union(
  v.object({ name: v.string() }),
  v.object({ refKind: v.string(), id: v.string() }),
  v.object({ selector: v.literal('self') }),
);

function integer(value: unknown, name: string, min?: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value))
    throw new ConvexError(`"${name}" must be a whole number.`);
  if (min !== undefined && value < min) throw new ConvexError(`"${name}" cannot be below ${min}.`);
  return value;
}

// ---------------------------------------------------------------------------------------------
// Targeting drafts (per authenticated user).

type Draft = Doc<'targetingDrafts'>;

async function draftOf(ctx: ReadCtx, context: TableContext): Promise<Draft | null> {
  return ctx.db
    .query('targetingDrafts')
    .withIndex('by_campaign_user', q =>
      q.eq('campaignId', context.campaign._id).eq('userId', context.user._id),
    )
    .unique();
}

type DraftFields = Omit<Draft, '_id' | '_creationTime'>;

function emptyDraft(context: TableContext, actor: Actor | null): DraftFields {
  return {
    campaignId: context.campaign._id,
    userId: context.user._id,
    actor,
    abilityId: null,
    targets: [],
    modifiers: {},
    characteristic: null,
    damageCharacteristic: null,
    mode: null,
    updatedAt: Date.now(),
  };
}

async function saveDraft(ctx: MutationCtx, context: TableContext, next: DraftFields) {
  const existing = await draftOf(ctx, context);
  const value = { ...next, updatedAt: Date.now() };
  if (existing) await ctx.db.replace(existing._id, value);
  else await ctx.db.insert('targetingDrafts', value);
}

/** Clears the invoking user's draft (fired, canceled, or the actor changed). */
export async function clearDraft(ctx: MutationCtx, context: TableContext) {
  const existing = await draftOf(ctx, context);
  if (existing) await ctx.db.delete(existing._id);
}

/** The draft for this actor: an existing one, or a fresh one when the actor changed (confirmed). */
function draftFor(context: TableContext, existing: Draft | null, actor: Actor): DraftFields {
  if (existing && existing.actor && sameActor(existing.actor, actor)) {
    const { _id, _creationTime, ...fields } = existing;
    void _id;
    void _creationTime;
    return fields;
  }
  return emptyDraft(context, actor);
}

function draftCounts(draft: DraftFields, target: Actor) {
  return draft.modifiers[actorKey(target)] ?? { edges: 0, banes: 0 };
}

/** Whether the pending ability's target selection is complete under the confirmed firing rules. */
function readyToFire(ability: AbilityDefinition, targets: Actor[]): boolean {
  switch (ability.targetShape.kind) {
    case 'self':
      return true;
    case 'single':
      return targets.length === 1;
    case 'multi':
      return targets.length >= ability.targetShape.max;
    case 'area':
    case 'unknown':
      return false;
  }
}

/** Builds the `ability.use` envelope that fires the draft under the invoking command id. */
function fireEnvelope(
  envelope: CommandEnvelope,
  actor: Actor,
  ability: AbilityDefinition,
  draft: DraftFields,
): CommandEnvelope {
  const targets = ability.targetShape.kind === 'self' ? [actor] : draft.targets;
  return {
    schemaVersion: 1,
    commandId: envelope.commandId,
    campaignId: envelope.campaignId,
    operation: 'ability.use',
    actor: { refKind: actor.kind, id: actor.id },
    arguments: {
      ability: ability.abilityId,
      targets: targets.map(t => ({ refKind: t.kind, id: t.id })),
      edges: targets.map(t => draftCounts(draft, t).edges),
      banes: targets.map(t => draftCounts(draft, t).banes),
      ...(draft.characteristic ? { characteristic: draft.characteristic } : {}),
      ...(draft.damageCharacteristic
        ? { 'damage-characteristic': draft.damageCharacteristic }
        : {}),
      ...(draft.mode ? { mode: draft.mode } : {}),
      fromDraft: true,
    },
  };
}

async function fireOrRecord(
  ctx: MutationCtx,
  context: TableContext,
  envelope: CommandEnvelope,
  actor: Actor,
  draft: DraftFields,
  ability: AbilityDefinition | null,
  description: string,
): Promise<Outcome> {
  if (ability && readyToFire(ability, draft.targets))
    return { delegated: await run(ctx, context, fireEnvelope(envelope, actor, ability, draft)) };
  return {
    kind: 'target.draft',
    description,
    data: {
      actor,
      abilityId: draft.abilityId,
      targets: draft.targets,
      modifiers: draft.modifiers,
      characteristic: draft.characteristic,
    },
    commit: async mctx => {
      await saveDraft(mctx, context, draft);
    },
  };
}

function prompt(ability: AbilityDefinition, targets: Actor[]): string {
  switch (ability.targetShape.kind) {
    case 'multi':
      return `Target up to ${ability.targetShape.max} (${targets.length} selected); /ability fire fires early.`;
    case 'area':
      return `Select the affected creatures (${targets.length} selected), then /ability fire.`;
    case 'unknown':
      return `Target "${ability.target}" is not a shape the app counts; select the targets and /ability fire.`;
    case 'single':
      return 'Select one target to fire.';
    case 'self':
      return 'Self: fires on selection.';
  }
}

/** V115 (rule/combat/distance.md, Melee or Ranged): a mode only for a Melee-and-Ranged ability. */
function parseMode(
  value: unknown,
  ability: AbilityDefinition,
  allowDefault = false,
): AbilityMode | null {
  const text = String(value).trim().toLowerCase();
  if (allowDefault && text === 'default') return null;
  if (text !== 'melee' && text !== 'ranged')
    throw new ConvexError('"mode" must be melee or ranged.');
  if (!dualMode(ability))
    throw new ConvexError(`${ability.name} is not a Melee-and-Ranged ability; it has no mode.`);
  return text;
}

function dualMode(ability: Pick<AbilityDefinition, 'keywords'>): boolean {
  const words = ability.keywords.map(k => plainText(k).toLowerCase());
  return words.includes('melee') && words.includes('ranged');
}

function damageChoices(ability: AbilityDefinition): Characteristic[] {
  const choices = (ability.metadata?.tiers ?? []).flatMap(t =>
    t.damage?.kind === 'plusChoice' ? t.damage.choices : [],
  );
  return [...new Set(choices)];
}

function selectedOverride(
  value: unknown,
  name: string,
  permitted: Characteristic[],
): Characteristic | null {
  if (String(value).toLowerCase() === 'default') return null;
  const c = String(value).toUpperCase() as Characteristic;
  if (!permitted.includes(c))
    throw new ConvexError(
      `"${name}" must be ${permitted.join(' or ') || 'a supported characteristic choice'}, or default.`,
    );
  return c;
}

const abilitySelect: OperationDefinition = {
  id: 'ability.select',
  family: 'ability',
  verb: 'select',
  title: 'Select an ability',
  description:
    'Choose an ability for the acting creature. A self-only ability fires at once; a single-target ability fires when its target is selected; a multi-target ability fires at the full count or with /ability fire. Selecting the pending ability again cancels it.',
  args: {
    ability: v.string(),
    characteristic: v.optional(v.string()),
    'damage-characteristic': v.optional(v.string()),
    mode: v.optional(v.string()),
  },
  argDescriptions: {
    ability: 'The ability by printed name or content id.',
    characteristic:
      'Optional roll characteristic override (M, A, R, I or P); default resets the choice.',
    'damage-characteristic':
      'Independent damage characteristic override among the printed choices; default resets it.',
    mode: 'melee or ranged for a Melee-and-Ranged ability; default resets the choice.',
  },
  roles: PLAYERS,
  session: 'running',
  actor: 'required',
  execute: async (ctx, { context, envelope, actor, args }) => {
    const records = await loadActorRecords(ctx, context, actor!);
    const abilities = await abilitiesFor(ctx, actor!, records);
    const ability = findAbility(abilities, String(args.ability));
    if (!ability)
      throw new ConvexError(
        `${actor!.name} has no ability "${String(args.ability)}". Available: ${abilities.map(a => a.name).join(', ')}.`,
      );
    const existing = await draftOf(ctx, context);
    const draft = draftFor(context, existing, actor!);
    if (
      draft.abilityId === ability.abilityId &&
      args.characteristic === undefined &&
      args['damage-characteristic'] === undefined &&
      args.mode === undefined
    )
      // Clicking the pending ability again cancels the un-fired selection (confirmed).
      return {
        kind: 'target.draft',
        description: `${actor!.name}: ${ability.name} selection canceled; targets cleared.`,
        data: { actor, abilityId: null, targets: [], modifiers: {} },
        commit: async mctx => {
          await clearDraft(mctx, context);
        },
      };
    if (draft.abilityId !== ability.abilityId) {
      draft.characteristic = null;
      draft.damageCharacteristic = null;
      draft.mode = null;
    }
    draft.abilityId = ability.abilityId;
    if (args.characteristic !== undefined)
      draft.characteristic = selectedOverride(
        args.characteristic,
        'characteristic',
        ability.metadata?.permittedCharacteristics ?? [],
      );
    if (args['damage-characteristic'] !== undefined)
      draft.damageCharacteristic = selectedOverride(
        args['damage-characteristic'],
        'damageCharacteristic',
        damageChoices(ability),
      );
    if (args.mode !== undefined) draft.mode = parseMode(args.mode, ability, true);
    // A single-target ability keeps at most the last selected target.
    if (ability.targetShape.kind === 'single' && draft.targets.length > 1)
      draft.targets = draft.targets.slice(-1);
    return fireOrRecord(
      ctx,
      context,
      envelope,
      actor!,
      draft,
      ability,
      `${actor!.name}: ${ability.name} selected. ${prompt(ability, draft.targets)}`,
    );
  },
};

async function draftActor(
  ctx: ReadCtx,
  context: TableContext,
  actor: Actor | null,
): Promise<{ actor: Actor; draft: DraftFields }> {
  const existing = await draftOf(ctx, context);
  const bound = actor ?? existing?.actor ?? null;
  if (!bound) throw new ConvexError('No acting character: give @Actor or select an ability first.');
  if (actor && context.role !== 'director')
    await bindActor(ctx, context, { refKind: actor.kind, id: actor.id });
  return { actor: bound, draft: draftFor(context, existing, bound) };
}

async function pendingAbility(
  ctx: ReadCtx,
  context: TableContext,
  actor: Actor,
  draft: DraftFields,
): Promise<AbilityDefinition | null> {
  if (!draft.abilityId) return null;
  const records = await loadActorRecords(ctx, context, actor);
  return findAbility(await abilitiesFor(ctx, actor, records), draft.abilityId) ?? null;
}

const targetToggle: OperationDefinition = {
  id: 'target.toggle',
  family: 'target',
  verb: 'toggle',
  title: 'Target a creature',
  description:
    'Select a target for the invoking user’s draft: single-target selection replaces the previous target; multi-target selection toggles membership. Completing a pending ability’s targets fires it once.',
  args: { target: referenceValidator },
  argDescriptions: { target: 'The hero or foe, as @Name, @{character:id}, @{foe:id} or @self.' },
  roles: PLAYERS,
  session: 'running',
  actor: 'optional',
  execute: async (ctx, { context, envelope, actor, args }) => {
    const { actor: acting, draft } = await draftActor(ctx, context, actor);
    const target = (await bindTarget(ctx, context, args.target as Reference, acting)).actor;
    const ability = await pendingAbility(ctx, context, acting, draft);
    const key = actorKey(target);
    const already = draft.targets.some(t => actorKey(t) === key);
    const multi = ability ? ability.targetShape.kind !== 'single' : false;
    let change: string;
    if (multi && already) {
      draft.targets = draft.targets.filter(t => actorKey(t) !== key);
      change = `${target.name} deselected`;
    } else if (multi) {
      draft.targets = [...draft.targets, target];
      change = `${target.name} selected`;
    } else {
      draft.targets = [target];
      change = `${target.name} targeted`;
    }
    return fireOrRecord(
      ctx,
      context,
      envelope,
      acting,
      draft,
      ability,
      `${acting.name}: ${change}.${ability ? ` ${prompt(ability, draft.targets)}` : ' No ability pending.'}`,
    );
  },
};

const targetModifier: OperationDefinition = {
  id: 'target.modifier',
  family: 'target',
  verb: 'modifier',
  title: 'Set edges and banes for a target',
  description:
    'Set the next-attack edge and bane counts for one target in the invoking user’s draft (target-only inputs, starting at zero, consumed by the accepted attack).',
  args: {
    target: referenceValidator,
    edges: v.optional(v.number()),
    banes: v.optional(v.number()),
  },
  argDescriptions: {
    target: 'The target these counts apply to.',
    edges: 'Number of edges against this target (default 0).',
    banes: 'Number of banes against this target (default 0).',
  },
  roles: PLAYERS,
  session: 'running',
  actor: 'optional',
  execute: async (ctx, { context, actor, args }) => {
    const { actor: acting, draft } = await draftActor(ctx, context, actor);
    const target = (await bindTarget(ctx, context, args.target as Reference, acting)).actor;
    const edges = args.edges === undefined ? 0 : integer(args.edges, 'edges', 0);
    const banes = args.banes === undefined ? 0 : integer(args.banes, 'banes', 0);
    draft.modifiers = { ...draft.modifiers, [actorKey(target)]: { edges, banes } };
    return {
      kind: 'target.draft',
      description: `${acting.name}: against ${target.name}, ${edges} edge${edges === 1 ? '' : 's'} and ${banes} bane${banes === 1 ? '' : 's'} for the next attack.`,
      data: { actor: acting, target, edges, banes },
      commit: async mctx => {
        await saveDraft(mctx, context, draft);
      },
    };
  },
};

const selectionCancel: OperationDefinition = {
  id: 'selection.cancel',
  family: 'selection',
  verb: 'cancel',
  title: 'Cancel selection',
  description: 'Clear the invoking user’s pending ability, targets and per-target counts.',
  args: {},
  argDescriptions: {},
  roles: PLAYERS,
  session: 'active',
  actor: 'none',
  execute: async (ctx, { context }) => {
    const existing = await draftOf(ctx, context);
    return {
      kind: 'target.draft',
      description: existing
        ? `${existing.actor?.name ?? context.user.displayName}: selection canceled.`
        : 'No selection to cancel.',
      data: { actor: existing?.actor ?? null, abilityId: null, targets: [], modifiers: {} },
      commit: async mctx => {
        await clearDraft(mctx, context);
      },
    };
  },
};

const abilityFire: OperationDefinition = {
  id: 'ability.fire',
  family: 'ability',
  verb: 'fire',
  title: 'Fire the pending ability',
  description:
    'Explicitly fire the invoking user’s pending ability at the selected targets (multi-target before the full count, or an area whose membership the table supplied).',
  args: {},
  argDescriptions: {},
  roles: PLAYERS,
  session: 'running',
  actor: 'optional',
  execute: async (ctx, { context, envelope, actor }) => {
    const { actor: acting, draft } = await draftActor(ctx, context, actor);
    const ability = await pendingAbility(ctx, context, acting, draft);
    if (!ability) throw new ConvexError('No ability is pending; select one first.');
    if (ability.targetShape.kind !== 'self' && !draft.targets.length)
      throw new ConvexError(`${ability.name} needs at least one selected target.`);
    return { delegated: await run(ctx, context, fireEnvelope(envelope, acting, ability, draft)) };
  },
};

// ---------------------------------------------------------------------------------------------
// Action allowance tracking (advisory; docs/table-spec.md#player-sheet-actions-and-explicit-end-turn).

export interface Allowance {
  inCombat: boolean;
  encounterId: Id<'encounters'> | null;
  round: number;
  /** The actor's turn in progress, when it is theirs. */
  turnId: Id<'turns'> | null;
  onTurn: boolean;
  mainUsed: number;
  maneuverUsed: number;
  /**
   * V173: ordinary triggered actions used this round, on or off turn (rule/combat/triggered-action.md:
   * one per round; free triggered actions don't count).
   */
  triggeredUsed: number;
  /** Offered critical-hit additional main actions not yet used. */
  extraMainOffered: Doc<'actionOpportunities'>[];
}

export async function allowanceFor(
  ctx: ReadCtx,
  context: TableContext,
  actor: Actor,
): Promise<Allowance> {
  const encounter = await committedEncounter(ctx, context.campaign);
  const none: Allowance = {
    inCombat: false,
    encounterId: null,
    round: 0,
    turnId: null,
    onTurn: false,
    mainUsed: 0,
    maneuverUsed: 0,
    triggeredUsed: 0,
    extraMainOffered: [],
  };
  if (!encounter) return none;
  // OK commits combat before initiative resolves. Its roll/choice stages still require fixed
  // resource payment; they only lack an active turn and its ordinary action allowances.
  if (encounter.phase !== 'turns')
    return { ...none, inCombat: true, encounterId: encounter._id, round: encounter.round ?? 0 };
  const active = encounter.activeTurnId ? await ctx.db.get(encounter.activeTurnId) : null;
  let onTurn = !!active && sameActor(active.actor, actor);
  // V02: a squad's shared turn is every living member's and the attached captain's turn.
  if (!onTurn && active && active.actor.kind === 'squad' && actor.kind === 'foe') {
    const foe = await ctx.db.get(actor.id as Id<'foes'>);
    const squad = await ctx.db.get(active.actor.id as Id<'squads'>);
    onTurn = !!foe && !!squad && (foe.squadId === squad._id || squad.captainId === foe._id);
  }
  const uses = onTurn
    ? (
        await ctx.db
          .query('actionUses')
          .withIndex('by_turn', q => q.eq('turnId', active!._id))
          .take(200)
      ).filter(u => sameActor(u.actor, actor))
    : [];
  const roundUses = (
    await ctx.db
      .query('actionUses')
      .withIndex('by_encounter_actor', q =>
        q.eq('encounterId', encounter._id).eq('actor.id', actor.id),
      )
      .take(200)
  ).filter(u => sameActor(u.actor, actor) && u.round === (encounter.round ?? 0));
  const opportunities = (
    await ctx.db
      .query('actionOpportunities')
      .withIndex('by_encounter_actor', q =>
        q.eq('encounterId', encounter._id).eq('actor.id', actor.id),
      )
      .take(100)
  ).filter(o => o.status === 'offered' && o.actor.kind === actor.kind);
  return {
    inCombat: true,
    encounterId: encounter._id,
    round: encounter.round ?? 0,
    turnId: onTurn ? active!._id : null,
    onTurn,
    mainUsed: uses.filter(u => u.actionType === 'main action' && u.opportunityId === null).length,
    maneuverUsed: uses.filter(u => u.actionType === 'maneuver').length,
    triggeredUsed: roundUses.filter(u => u.actionType === 'triggered action').length,
    extraMainOffered: opportunities,
  };
}

interface TrackingPlan {
  warnings: string[];
  /** Opportunity consumed by this use, if any. */
  opportunity: Doc<'actionOpportunities'> | null;
}

/** Rule warnings for the action type against the advisory allowance; never a block. */
export function planTracking(
  allowance: Allowance,
  actor: Actor,
  actionType: string | null,
): TrackingPlan {
  const warnings: string[] = [];
  let opportunity: Doc<'actionOpportunities'> | null = null;
  if (!allowance.inCombat || !actionType) return { warnings, opportunity: null };
  if (actionType === 'main action') {
    const ordinaryAvailable = allowance.onTurn && allowance.mainUsed < 1;
    if (!ordinaryAvailable && allowance.extraMainOffered.length)
      opportunity = allowance.extraMainOffered[0]!;
    else if (!allowance.onTurn)
      warnings.push(`Rule warning: it is not ${actor.name}'s turn (rule/combat/turn.md).`);
    else if (allowance.mainUsed >= 1)
      warnings.push(
        `Rule warning: ${actor.name} already used a main action this turn (rule/combat/turn.md: one main action per turn).`,
      );
  } else if (actionType === 'maneuver') {
    if (!allowance.onTurn)
      warnings.push(`Rule warning: it is not ${actor.name}'s turn (rule/combat/turn.md).`);
    else if (allowance.maneuverUsed >= 1)
      warnings.push(
        `Rule warning: ${actor.name} already used a maneuver this turn; a main action may be spent on a second maneuver (rule/combat/turn.md).`,
      );
  } else if (actionType === 'triggered action' && allowance.triggeredUsed >= 1)
    warnings.push(
      `Rule warning: ${actor.name} already used a triggered action this round (rule/combat/triggered-action.md: one per round; free triggered actions don't count).`,
    );
  else if (!allowance.onTurn && ['move action', 'free maneuver'].includes(actionType))
    warnings.push(`Rule warning: it is not ${actor.name}'s turn (rule/combat/turn.md).`);
  return { warnings, opportunity };
}

export async function recordUse(
  ctx: MutationCtx,
  scope: JournalScope,
  allowance: Allowance,
  actor: Actor,
  actionType: string,
  label: string,
  plan: TrackingPlan,
  options: { shared?: boolean; keepTriggeringEventId?: string } = {},
) {
  if (!allowance.inCombat || !allowance.encounterId) return;
  // V173: committing another ability passes this creature's earlier unused triggered-action
  // offers (docs/table-spec.md, "Confirmed early-close refinement").
  await closeOffersOnPlay(ctx, scope, actor, options.keepTriggeringEventId);
  const opportunityId = plan.opportunity?._id ?? null;
  await journalInsert(ctx, scope, 'actionUses', {
    campaignId: scope.campaignId,
    encounterId: allowance.encounterId,
    turnId: allowance.turnId,
    round: allowance.round,
    actor,
    actionType,
    label,
    eventId: scope.eventId,
    opportunityId,
  });
  if (opportunityId)
    await journalPatch(ctx, scope, 'actionOpportunities', opportunityId, {
      status: 'used',
      usedEventId: scope.eventId,
    });
  // V02 Minion Maneuvers: a minion taking an individual maneuver cannot also join the squad's
  // main action or maneuver this turn; note it on the squad's participation record.
  if (actor.kind === 'foe' && actionType === 'maneuver' && allowance.turnId && !options.shared) {
    const foe = await ctx.db.get(actor.id as Id<'foes'>);
    const squad = foe?.squadId ? await ctx.db.get(foe.squadId) : null;
    if (
      foe &&
      squad &&
      squad.participation.turnId === allowance.turnId &&
      !squad.participation.individual.includes(foe._id)
    )
      await journalPatch(ctx, scope, 'squads', squad._id, {
        participation: {
          ...squad.participation,
          individual: [...squad.participation.individual, foe._id],
        },
      });
  }
}

// ---------------------------------------------------------------------------------------------
// /ability use

function poolFor(records: ActorRecords, context: TableContext, resource: string) {
  if (records.actor.kind === 'foe') {
    if (resource !== 'malice') return undefined;
    return { resource, current: context.campaign.malice ?? 0, legalFloor: 0 };
  }
  if (resource === 'recovery') {
    const current = records.character?.liveState?.recoveries;
    return typeof current === 'number' ? { resource, current, legalFloor: 0 } : undefined;
  }
  const pool = records.character?.liveState?.heroicResource;
  if (!pool || pool.name === null || pool.current === null) return undefined;
  if (pool.name.toLowerCase() !== resource) return undefined;
  return {
    resource,
    current: pool.current,
    legalFloor: heroicResourceFloor(
      records.character ? baselineOf(records.character.derivedBaseline) : null,
      resource,
    ),
  };
}

async function debit(
  ctx: MutationCtx,
  scope: JournalScope,
  records: ActorRecords,
  context: TableContext,
  after: number,
  resource: string,
) {
  if (records.actor.kind === 'foe') {
    await journalPatch(ctx, scope, 'campaigns', context.campaign._id, { malice: after });
    // V144: an ability that costs Malice was used (the Null's discipline trigger).
    if (after < (context.campaign.malice ?? 0)) await observeMaliceAbility(ctx, scope);
    return;
  }
  const character = (await ctx.db.get(records.character!._id))!;
  const live: HeroLive = requireHeroLive(character);
  await journalPatch(ctx, scope, 'characters', character._id, {
    liveState:
      resource === 'recovery'
        ? { ...live, recoveries: after }
        : { ...live, heroicResource: { ...live.heroicResource, current: after } },
  });
}

/** Whether damage written against the current pools differs from the planned write. */
export function changedPools(planned: DamageApplication, applied: DamageApplication): boolean {
  return (
    planned.staminaAfter !== applied.staminaAfter ||
    planned.temporaryStaminaAfter !== applied.temporaryStaminaAfter
  );
}

/**
 * QC1 train 13 R1: damage a use planned before its commit and wrote against pools an earlier write
 * of the same commit had changed (a watcher's damage or gain). The use's entry states the planned
 * values; this linked entry states what was applied. Nothing is logged when nothing changed.
 */
export async function logReappliedDamage(
  ctx: MutationCtx,
  scope: JournalScope,
  label: string,
  reapplied: readonly {
    name: string;
    cause: string;
    planned: DamageApplication;
    applied: DamageApplication;
  }[],
): Promise<void> {
  if (!reapplied.length) return;
  const cause = (await ctx.db.get(scope.eventId))!;
  const one = reapplied.length === 1;
  await appendEvent(ctx, {
    campaignId: scope.campaignId,
    sessionId: cause.sessionId,
    encounterId: cause.encounterId,
    origin: 'engine',
    commandId: cause.commandId,
    causeEventId: scope.eventId,
    kind: 'ability.damage-reapplied',
    description: `${label}: an earlier effect of this use changed ${one ? 'a pool' : 'pools'} before this damage was written, so it was taken from the current pools: ${reapplied.map(r => `${r.name}, ${r.cause}: ${r.applied.afterImmunity}${r.applied.absorbedByTemporaryStamina ? ` (${r.applied.absorbedByTemporaryStamina} absorbed by temporary Stamina)` : ''}, Stamina ${r.applied.staminaBefore} → ${r.applied.staminaAfter} (planned ${r.planned.staminaBefore} → ${r.planned.staminaAfter})`).join('; ')}.`,
    payload: {
      data: {
        useEventId: scope.eventId,
        applications: reapplied.map(r => ({
          name: r.name,
          cause: r.cause,
          planned: r.planned,
          applied: r.applied,
        })),
      },
    },
  });
}

export function describeRoll(result: AbilityRollResult): string {
  const c = result.selectedCharacteristic
    ? `${result.characteristicValue >= 0 ? '+' : '−'} ${Math.abs(result.characteristicValue)} (${result.selectedCharacteristic})`
    : `${result.characteristicValue >= 0 ? '+' : '−'} ${Math.abs(result.characteristicValue)}`;
  return `2d10 = ${result.dice.d10a} + ${result.dice.d10b} (natural ${result.naturalRoll}) ${c}`;
}

export function describeTarget(
  outcome: TargetRollOutcome,
  name: string,
  applied?: DamageApplication,
) {
  const eb = outcome.edgeBane;
  const mods = [
    eb.modifier ? `${eb.modifier > 0 ? '+' : '−'} 2 (${eb.modifier > 0 ? 'edge' : 'bane'})` : null,
    eb.tierShift === 1
      ? 'double edge: tier +1'
      : eb.tierShift === -1
        ? 'double bane: tier −1'
        : null,
  ].filter(Boolean);
  const counts =
    eb.edges || eb.banes
      ? ` [${eb.edges} edge, ${eb.banes} bane${mods.length ? `; ${mods.join(', ')}` : ''}]`
      : '';
  const tier = `total ${outcome.total} → tier ${outcome.tier}${outcome.uncertainty ? ` (${outcome.uncertainty})` : ''}`;
  const damage = outcome.damage
    ? applied
      ? `${applied.afterImmunity} damage to ${name}${applied.absorbedByTemporaryStamina ? ` (${applied.absorbedByTemporaryStamina} absorbed by temporary Stamina)` : ''}${applied.slain ? '; Slain' : applied.windedAfter && !applied.windedBefore ? '; now winded' : applied.windedAfter ? '; winded' : ''}${applied.dying ? '; at 0 Stamina or lower (dying not automated)' : ''}`
      : `${outcome.damage.rolledDamage} damage to ${name} not applied`
    : `no supported damage for ${name}`;
  const unresolved = outcome.unresolvedClauses.length
    ? `; unresolved: ${outcome.unresolvedClauses.map(c => `"${c}"`).join(', ')}`
    : '';
  return `${name}${counts}: ${tier}; ${damage}${unresolved}`;
}

function sourceFor(ability: AbilityDefinition) {
  // Only the used action is public. Never attach the private full monster stat block as support.
  return {
    id: ability.contentId,
    name: ability.name,
    text: ability.text,
    sourcePath: ability.source.path,
    revision: ability.source.revision,
  };
}

/** Conditions follow all damage and retain the original use identity through corrections. */
async function commitConditions(
  ctx: MutationCtx,
  scope: JournalScope,
  occurrences: import('../../shared/contracts/compiledResult').EffectOccurrence[],
  targets: TargetRecord[],
  source: {
    eventId: Id<'events'>;
    abilityName: string;
    actorLabel: string;
    sourcePath: string;
    actorId: string;
  },
  encounterId: Id<'encounters'> | null,
  originalTargetId?: string,
) {
  const cause = (await ctx.db.get(scope.eventId))!;
  // V153: a compound clause's conditions share one saving throw, keyed by its first occurrence.
  const saveGroups = new Map<string, string>();
  for (const occurrence of occurrences) {
    const effect = occurrence.effect;
    if (effect.kind !== 'condition') continue;
    const groupKey =
      effect.group !== undefined ? JSON.stringify([effect.group, effect.targetId]) : undefined;
    if (groupKey !== undefined && !saveGroups.has(groupKey))
      saveGroups.set(groupKey, occurrence.id);
    const saveGroup = groupKey !== undefined ? saveGroups.get(groupKey) : undefined;
    const target = targets.find(
      t =>
        t.actor.id === effect.targetId ||
        (originalTargetId === effect.targetId && targets.length === 1),
    );
    if (!target) throw new ConvexError('Condition target is unavailable.');
    let schedule = '';
    if (effect.status === 'applied') {
      if (target.actor.kind === 'squad' || target.squad)
        throw new ConvexError('Squad potency conditions require manual resolution.');
      const instance = await applyConditionInstance(
        ctx,
        scope,
        { kind: target.actor.kind, id: target.actor.id },
        {
          id: occurrence.id,
          condition: effect.condition,
          duration: effect.duration,
          ...(saveGroup !== undefined ? { saveGroup } : {}),
          ...(effect.restriction ? { restriction: effect.restriction } : {}),
          sourceActorId: source.actorId,
          sourceUseEventId: source.eventId,
          abilityName: source.abilityName,
          actorLabel: source.actorLabel,
          sourcePath: source.sourcePath,
        },
        encounterId ?? undefined,
      );
      schedule =
        effect.duration === 'none'
          ? effect.condition === 'grabbed'
            ? ' No printed duration: the grab lasts until the grabber releases it, the creature escapes (Escape Grab), or a teleport or forced movement separates them (condition/grabbed.md); record that with condition off.'
            : ' No printed duration: it lasts until the creature stands up (Stand Up); record that with condition off.'
          : effect.duration === 'eot'
            ? instance.registrationId
              ? ' Ends at the end of the target’s current or next turn (EoT).'
              : ' EoT expiry is unscheduled outside a committed encounter; resolve it manually.'
            : instance.registrationId
              ? ' Save scheduled at each target turn end.'
              : ' Save is unscheduled outside a committed encounter; resolve it manually.';
      if (effect.restriction)
        schedule +=
          ' While it lasts, Stand Up is refused; when it ends the creature stays prone until it uses Stand Up.';
    }
    // Never publish the target score through event descriptions/payloads, even for hero targets.
    await appendEvent(ctx, {
      campaignId: scope.campaignId,
      sessionId: cause.sessionId,
      encounterId: cause.encounterId,
      origin: 'engine',
      commandId: cause.commandId,
      causeEventId: scope.eventId,
      kind: 'condition.potency',
      description: `${source.actorLabel}'s ${source.abilityName}: ${target.actor.name}, ${effect.restriction ? "can't stand" : effect.condition} (${plainText(effect.clause)}) — ${effect.status}.${schedule} Condition consequences remain manual.`,
      payload: {
        sourceUseEventId: source.eventId,
        occurrence: occurrence.id,
        condition: effect.condition,
        ...(effect.restriction ? { restriction: effect.restriction } : {}),
        duration: effect.duration,
        status: effect.status,
        target: target.actor,
        sourcePath: source.sourcePath,
      },
    });
  }
}

/**
 * V158: each lasting instruction of a compiled use becomes an `instruction` effect instance
 * (docs/lasting-effects-design.md#1-effect-instances), held by its subject, with its duration bound
 * to creatures and registered on the clock. The occurrence stays table work for the log card.
 */
async function commitLasting(
  ctx: MutationCtx,
  scope: JournalScope,
  occurrences: import('../../shared/contracts/compiledResult').EffectOccurrence[],
  targets: TargetRecord[],
  source: {
    eventId: Id<'events'>;
    abilityId: string;
    abilityName: string;
    actor: Actor;
    sourcePath: string;
  },
  encounterId: Id<'encounters'> | null,
) {
  const cause = (await ctx.db.get(scope.eventId))!;
  const use = (await ctx.db.get(source.eventId))!;
  for (const occurrence of occurrences) {
    const effect = occurrence.effect;
    if (effect.kind !== 'rider' || !effect.lasting) continue;
    const lasting = effect.lasting;
    const owner = { kind: source.actor.kind, id: source.actor.id, name: source.actor.name };
    const target = targets.find(t => t.actor.id === effect.targetId);
    const subject =
      lasting.subject === 'owner' || !target
        ? owner
        : { kind: target.actor.kind, id: target.actor.id, name: target.actor.name };
    const stored = await applyEffectInstance(
      ctx,
      scope,
      {
        id: occurrence.id,
        kind: 'instruction',
        sourceUseEventId: source.eventId,
        sourceActorId: source.actor.id,
        abilityId: source.abilityId,
        abilityName: source.abilityName,
        actorLabel: source.actor.name,
        sourcePath: source.sourcePath,
        clause: plainText(effect.clause),
        owner,
        subject,
        payload: { kind: 'instruction', text: lasting.text },
        printedDuration: lasting.duration,
        endsWhen: lasting.endsWhen,
        appliedSequence: use.sequence,
      },
      encounterId ?? undefined,
    );
    const lasts = describeDuration(lasting.duration, lasting.endsWhen);
    const tracked = stored && 'instance' in stored ? stored : undefined;
    const untracked = stored && 'untracked' in stored ? stored : undefined;
    const description = tracked?.endedAtApplication
      ? `${source.actor.name}'s ${source.abilityName} on ${subject.name}, ${lasts}: "${lasting.text}" It ends as it is applied (${tracked.endedAtApplication}), so nothing is scheduled.`
      : tracked?.manualGroup
        ? `${source.actor.name}'s ${source.abilityName} on ${subject.name}, ${lasts}: "${lasting.text}" ${subject.name} is already under this ability's effect in a way the engine can't resolve. This use and the earlier ones are kept as a manual stacking group: no clock ends them. Apply the stacking rule at the table (the most impactful effect applies, and the most recent use sets the duration), then end them with /effect end.`
        : tracked
          ? `${source.actor.name}'s ${source.abilityName} on ${subject.name}, ${lasts}: "${lasting.text}" Tracked as an effect${tracked.instance.registrationIds.length ? '; its end is scheduled' : lasting.duration.kind === 'none' || lasting.duration.kind === 'maintained' ? '' : '; its end is unscheduled outside a committed encounter, so end it with /effect end'}.${tracked.superseded ? ` It replaces ${tracked.superseded.actorLabel}'s earlier use, because the most recent use of the same ability sets the duration (Stacking Unique Effects).` : ''} The table resolves the instruction itself.`
          : untracked
            ? `${source.actor.name}'s ${source.abilityName} on ${subject.name}, ${lasts}: "${lasting.text}" This effect can't be tracked on a squad or object, because another use of the same ability on it couldn't be seen. Resolve it at the table.`
            : `${source.actor.name}'s ${source.abilityName} on ${subject.name}, ${lasts}: "${lasting.text}" No hero or foe can hold this effect; resolve it at the table.`;
    await appendEvent(ctx, {
      campaignId: scope.campaignId,
      sessionId: cause.sessionId,
      encounterId: cause.encounterId,
      origin: 'engine',
      commandId: cause.commandId,
      causeEventId: scope.eventId,
      kind: untracked || tracked?.manualGroup ? 'effect.untracked' : 'effect.applied',
      description,
      payload: {
        sourceUseEventId: source.eventId,
        occurrence: occurrence.id,
        effectInstanceId: tracked?.instance.id ?? null,
        holder: stored?.holder ?? null,
        duration: tracked?.instance.duration ?? null,
        ...(tracked?.endedAtApplication ? { endedAtApplication: tracked.endedAtApplication } : {}),
        ...(tracked?.superseded ? { superseded: tracked.superseded.id } : {}),
        sourcePath: source.sourcePath,
      },
    });
  }
}

/**
 * V159: each applied modifier of a compiled use becomes a `modifier` effect instance on its subject
 * (docs/lasting-effects-design.md#2-modifier-pipeline), with its duration bound and registered on
 * the clock. The engine then applies it to later rolls and derived values automatically.
 */
/** V159: occurrences that joined a manual stacking group are recorded as manual on the result. */
function markManual<T extends import('../../shared/contracts/compiledResult').EffectOccurrence>(
  occurrences: T[],
  manualIds: ReadonlySet<string>,
): T[] {
  return occurrences.map(occurrence =>
    manualIds.has(occurrence.id) &&
    (occurrence.effect.kind === 'modifier' || occurrence.effect.kind === 'watcher')
      ? {
          ...occurrence,
          effect: {
            ...occurrence.effect,
            status: 'manual' as const,
            requirements: [
              ...occurrence.effect.requirements,
              'manual stacking: an unresolved use of the same ability is already active; apply the stacking rule at the table',
            ],
          },
        }
      : occurrence,
  );
}

async function commitModifiers(
  ctx: MutationCtx,
  scope: JournalScope,
  occurrences: import('../../shared/contracts/compiledResult').EffectOccurrence[],
  recipients: { actor: Actor }[],
  source: {
    eventId: Id<'events'>;
    abilityId: string;
    abilityName: string;
    actor: Actor;
    sourcePath: string;
  },
  encounterId: Id<'encounters'> | null,
): Promise<Set<string>> {
  /** Occurrences that joined a V158 manual stacking group: the table applies them, not the engine. */
  const manualIds = new Set<string>();
  const cause = (await ctx.db.get(scope.eventId))!;
  const use = (await ctx.db.get(source.eventId))!;
  for (const occurrence of occurrences) {
    const effect = occurrence.effect;
    if (effect.kind !== 'modifier') continue;
    const owner = { kind: source.actor.kind, id: source.actor.id, name: source.actor.name };
    const recipient = recipients.find(r => r.actor.id === effect.targetId)?.actor;
    const subject = recipient
      ? { kind: recipient.kind, id: recipient.id, name: recipient.name }
      : undefined;
    const lasts = describeDuration(effect.spec.duration, effect.spec.endsWhen);
    const consumable = effect.spec.consumeOn
      ? `, used up by ${subject?.name ?? 'the subject'}'s next ${effect.spec.consumeOn.event === 'power-roll' ? 'power roll' : 'ability roll'}`
      : '';
    const result =
      effect.status === 'applied' && effect.payload && subject
        ? await applyEffectInstance(
            ctx,
            scope,
            {
              id: occurrence.id,
              kind: 'modifier',
              sourceUseEventId: source.eventId,
              sourceActorId: source.actor.id,
              abilityId: source.abilityId,
              abilityName: source.abilityName,
              actorLabel: source.actor.name,
              sourcePath: source.sourcePath,
              clause: plainText(effect.clause),
              owner,
              subject,
              payload: { kind: 'modifier', text: effect.spec.text, modifier: effect.payload },
              printedDuration: effect.spec.duration,
              endsWhen: effect.spec.endsWhen,
              ...(effect.spec.consumeOn ? { consumeOn: effect.spec.consumeOn } : {}),
              appliedSequence: use.sequence,
            },
            encounterId ?? undefined,
          )
        : undefined;
    // The ENGINE2 V158 lifecycle boundary may decline to store a same-ability instance whose
    // payload differs from an active one on the subject (Stacking Unique Effects is then applied at
    // the table); such a result carries no instance.
    const tracked = result && 'instance' in result ? result : undefined;
    const manualGroup = tracked?.manualGroup === true;
    if (manualGroup) manualIds.add(occurrence.id);
    const stored = manualGroup ? undefined : tracked;
    const untracked = result !== undefined && stored === undefined;
    await appendEvent(ctx, {
      campaignId: scope.campaignId,
      sessionId: cause.sessionId,
      encounterId: cause.encounterId,
      origin: 'engine',
      commandId: cause.commandId,
      causeEventId: scope.eventId,
      kind: untracked ? 'effect.untracked' : 'effect.applied',
      description: stored?.endedAtApplication
        ? `${source.actor.name}'s ${source.abilityName} on ${stored.instance.subject.name}: ${describeModifier(effect.payload!)}, ${lasts}. It ends as it is applied (${stored.endedAtApplication}): the engine never applies it.`
        : stored
          ? `${source.actor.name}'s ${source.abilityName} on ${stored.instance.subject.name}: ${describeModifier(effect.payload!)}, ${lasts}${consumable}. The engine applies it automatically; exclude it on a roll it doesn't fit${stored.instance.registrationIds.length ? '' : effect.spec.duration.kind === 'none' || effect.spec.duration.kind === 'maintained' ? '' : '. Its end is unscheduled outside a committed encounter, so end it with /effect end'}.`
          : manualGroup
            ? `${source.actor.name}'s ${source.abilityName} on ${subject!.name}: ${describeModifier(effect.payload!)}, ${lasts}. ${subject!.name} is already under ${source.abilityName} in a way the engine can't resolve, so this use and the earlier ones form a manual stacking group. The engine applies none of them: apply the most impactful effect with the most recent use's duration at the table (Stacking Unique Effects), then end them with /effect end.`
            : untracked
              ? `${source.actor.name}'s ${source.abilityName} on ${subject!.name}: ${describeModifier(effect.payload!)}, ${lasts}. This effect can't be tracked on a squad or object; apply it at the table.`
              : `${source.actor.name}'s ${source.abilityName}${subject ? ` on ${subject.name}` : ''}, ${lasts}: "${plainText(effect.clause)}" Not tracked (${effect.requirements.join('; ') || 'no hero or foe can hold it'}); apply it at the table.`,
      payload: {
        sourceUseEventId: source.eventId,
        occurrence: occurrence.id,
        effectInstanceId: stored?.instance.id ?? null,
        holder: result?.holder ?? null,
        duration: stored?.instance.duration ?? null,
        ...(stored?.endedAtApplication ? { endedAtApplication: stored.endedAtApplication } : {}),
        modifier: effect.payload ?? null,
        sourcePath: source.sourcePath,
      },
    });
  }
  return manualIds;
}

/**
 * V171: each applied watcher of a compiled use becomes a `watcher` effect instance on its subject
 * (docs/lasting-effects-design.md#3-watchers), with its duration bound and its turn work
 * registered. The engine fires it when the watched event happens (convex/lib/watchers.ts).
 */
async function commitWatchers(
  ctx: MutationCtx,
  scope: JournalScope,
  occurrences: import('../../shared/contracts/compiledResult').EffectOccurrence[],
  recipients: { actor: Actor }[],
  source: {
    eventId: Id<'events'>;
    abilityId: string;
    abilityName: string;
    actor: Actor;
    sourcePath: string;
  },
  encounterId: Id<'encounters'> | null,
): Promise<Set<string>> {
  const manualIds = new Set<string>();
  const cause = (await ctx.db.get(scope.eventId))!;
  const use = (await ctx.db.get(source.eventId))!;
  for (const occurrence of occurrences) {
    const effect = occurrence.effect;
    if (effect.kind !== 'watcher') continue;
    const owner = { kind: source.actor.kind, id: source.actor.id, name: source.actor.name };
    const recipient = recipients.find(r => r.actor.id === effect.targetId)?.actor;
    const subject = recipient
      ? { kind: recipient.kind, id: recipient.id, name: recipient.name }
      : undefined;
    const lasts = describeDuration(effect.spec.duration, effect.spec.endsWhen);
    const result =
      effect.status === 'applied' && effect.payload && subject
        ? await applyEffectInstance(
            ctx,
            scope,
            {
              id: occurrence.id,
              kind: 'watcher',
              sourceUseEventId: source.eventId,
              sourceActorId: source.actor.id,
              abilityId: source.abilityId,
              abilityName: source.abilityName,
              actorLabel: source.actor.name,
              sourcePath: source.sourcePath,
              clause: plainText(effect.clause),
              owner,
              subject,
              payload: { kind: 'watcher', text: effect.spec.text, watcher: effect.payload },
              printedDuration: effect.spec.duration,
              endsWhen: effect.spec.endsWhen,
              appliedSequence: use.sequence,
            },
            encounterId ?? undefined,
          )
        : undefined;
    const tracked = result && 'instance' in result ? result : undefined;
    const manualGroup = tracked?.manualGroup === true;
    if (manualGroup) manualIds.add(occurrence.id);
    const stored = manualGroup ? undefined : tracked;
    const untracked = result !== undefined && stored === undefined;
    const turnWork = effect.payload?.event === 'turn-start' || effect.payload?.event === 'turn-end';
    const scheduled = stored?.instance.registrationIds.length
      ? ''
      : turnWork || !['none', 'maintained'].includes(effect.spec.duration.kind)
        ? '. Outside a committed encounter nothing is scheduled: resolve it at the table and end it with /effect end'
        : '';
    await appendEvent(ctx, {
      campaignId: scope.campaignId,
      sessionId: cause.sessionId,
      encounterId: cause.encounterId,
      origin: 'engine',
      commandId: cause.commandId,
      causeEventId: scope.eventId,
      kind: untracked ? 'effect.untracked' : 'effect.applied',
      description: stored?.endedAtApplication
        ? `${source.actor.name}'s ${source.abilityName} on ${stored.instance.subject.name}, ${lasts}: ${describeWatcher(effect.payload!)}. It ends as it is applied (${stored.endedAtApplication}): nothing is scheduled and the engine never fires it.`
        : stored
          ? `${source.actor.name}'s ${source.abilityName} on ${stored.instance.subject.name}, ${lasts}: ${describeWatcher(effect.payload!)}. The engine fires it when that happens${scheduled}.${stored.superseded ? ` It replaces ${stored.superseded.actorLabel}'s earlier use, because the most recent use of the same ability sets the duration (Stacking Unique Effects).` : ''}`
          : manualGroup
            ? `${source.actor.name}'s ${source.abilityName} on ${subject!.name}, ${lasts}: "${effect.spec.text}" ${subject!.name} is already under ${source.abilityName} in a way the engine can't resolve, so this use and the earlier ones form a manual stacking group. The engine fires none of them: apply the stacking rule at the table (Stacking Unique Effects), then end them with /effect end.`
            : untracked
              ? `${source.actor.name}'s ${source.abilityName} on ${subject!.name}, ${lasts}: "${effect.spec.text}" This effect can't be tracked on a squad or object; resolve it at the table.`
              : `${source.actor.name}'s ${source.abilityName}${subject ? ` on ${subject.name}` : ''}, ${lasts}: "${plainText(effect.clause)}" Not tracked (${effect.requirements.join('; ') || 'no hero or foe can hold it'}); resolve it at the table.`,
      payload: {
        sourceUseEventId: source.eventId,
        occurrence: occurrence.id,
        effectInstanceId: stored?.instance.id ?? null,
        holder: result?.holder ?? null,
        duration: stored?.instance.duration ?? null,
        ...(stored?.endedAtApplication ? { endedAtApplication: stored.endedAtApplication } : {}),
        watcher: effect.payload ?? null,
        sourcePath: source.sourcePath,
      },
    });
  }
  return manualIds;
}

/**
 * V171: the user's `ability-used` and, for a strike, `strike-made` watchers
 * (rule/combat/strike.md: a strike is an ability with the Strike keyword).
 */
async function observeUse(
  ctx: MutationCtx,
  scope: JournalScope,
  actor: Actor,
  keywords: readonly string[],
) {
  if (actor.kind !== 'character' && actor.kind !== 'foe') return;
  const strike = keywords.some(keyword => plainText(keyword).toLowerCase() === 'strike');
  await observeWatchers(ctx, scope, { kind: actor.kind, id: actor.id }, [
    { event: 'ability-used', creatureId: actor.id },
    ...(strike ? [{ event: 'strike-made' as const, creatureId: actor.id }] : []),
  ]);
}

/**
 * V171 review: a use recorded for manual resolution applies no damage and reaches no observer.
 * Watchers of the user's use, strike or damage and of each target's damage get a table note.
 */
async function noteRecordedUse(
  ctx: MutationCtx,
  scope: JournalScope,
  actor: Actor,
  keywords: readonly string[],
  targets: readonly { actor: Actor; squad?: unknown }[],
) {
  const holder = (party: Actor) =>
    party.kind === 'character' || party.kind === 'foe'
      ? { kind: party.kind, id: party.id }
      : undefined;
  const strike = keywords.some(keyword => plainText(keyword).toLowerCase() === 'strike');
  const user = holder(actor);
  await noteManualWatchers(
    ctx,
    scope,
    [
      ...(user
        ? [
            {
              creature: user,
              events: [
                'ability-used' as const,
                'damage-dealt' as const,
                ...(strike ? ['strike-made' as const] : []),
              ],
            },
          ]
        : []),
      ...targets.flatMap(target => {
        const creature = target.squad ? undefined : holder(target.actor);
        return creature && !(user && creature.id === user.id)
          ? [
              {
                creature,
                events: ['damage-taken' as const, 'made-winded' as const, 'dying' as const],
              },
            ]
          : [];
      }),
    ],
    `${actor.name}'s use is recorded for manual resolution`,
  );
}

/** V159: a hero's or foe's stored effect instances; squads and objects hold none. */
function holderOfRecord(record: {
  character?: Doc<'characters'>;
  foe?: Doc<'foes'>;
}): EffectHolder | undefined {
  if (record.character) return { kind: 'character', id: record.character._id };
  if (record.foe) return { kind: 'foe', id: record.foe._id };
  return undefined;
}

function effectsOf(record: { character?: Doc<'characters'>; foe?: Doc<'foes'> }) {
  if (record.character) return record.character.liveState?.effectInstances ?? [];
  if (record.foe) return record.foe.live.effectInstances ?? [];
  return [];
}

/** V159: the `exclude` argument, one instance id or a list of them. */
export function excludeList(value: unknown): string[] {
  if (value === undefined) return [];
  const list = Array.isArray(value) ? value : [value];
  if (list.some(item => typeof item !== 'string' || !item))
    throw new ConvexError('"exclude" lists effect instance ids, as effect.list gives them.');
  return [...new Set(list as string[])];
}

/** Current condition toggles of a hero or foe target; undefined for squads and unknown records. */
function conditionsOf(record: TargetRecord): Record<string, boolean> | undefined {
  if (record.character) return requireHeroLive(record.character).conditions;
  if (record.foe) return record.foe.live.conditions;
  return undefined;
}

function instancesOf(record: TargetRecord) {
  if (record.character) return requireHeroLive(record.character).conditionInstances ?? [];
  if (record.foe) return record.foe.live.conditionInstances ?? [];
  return [];
}

type GrabPlan = {
  note: (tier: number) => string;
  commit: (
    mctx: MutationCtx,
    scope: JournalScope,
    tier: number,
    source: { abilityName: string; actorLabel: string; sourcePath: string },
  ) => Promise<void>;
};

/**
 * V119: Grab and Escape Grab (feature/ability/common/grab.md, escape-grab.md;
 * condition/grabbed.md). Grab's tier 3 grabs the target when the size rule allows it; Escape Grab's
 * tier 3 ends the actor's grab and takes a bane when smaller than its grabber. Tier 2 of each is the
 * table's choice (a melee free strike comes first) and stays manual.
 */
async function grabManeuverPlan(
  ctx: ReadCtx,
  ability: AbilityDefinition,
  actorRecord: TargetRecord,
  targets: TargetRecord[],
  banes: number[],
  warnings: string[],
): Promise<GrabPlan | undefined> {
  if (ability.abilityId === ESCAPE_GRAB_ID) {
    if (!conditionsOf(actorRecord)?.grabbed)
      throw new ConvexError(`${actorRecord.actor.name} is not grabbed.`);
    const actorSize = movementFacts(actorRecord).size;
    const grabbers = [
      ...new Set(
        instancesOf(actorRecord)
          .filter(i => i.status === 'active' && i.condition === 'grabbed' && i.sourceActorId)
          .map(i => i.sourceActorId!),
      ),
    ];
    let bane = false;
    let unknownSize = conditionsOf(actorRecord)?.grabbed === true && !grabbers.length;
    for (const id of grabbers) {
      const heroId = ctx.db.normalizeId('characters', id);
      const foeId = ctx.db.normalizeId('foes', id);
      const character = heroId ? await ctx.db.get(heroId) : null;
      const foe = foeId ? await ctx.db.get(foeId) : null;
      const record = {
        actor: { kind: character ? 'character' : 'foe', id, name: '' },
        ...(character ? { character } : {}),
        ...(foe ? { foe } : {}),
      } as TargetRecord;
      const smaller = smallerSize(actorSize, movementFacts(record).size);
      if (smaller) bane = true;
      if (smaller === undefined) unknownSize = true;
    }
    if (instancesOf(actorRecord).every(i => i.condition !== 'grabbed' || i.status !== 'active'))
      unknownSize = true;
    if (bane) {
      banes[0] = (banes[0] ?? 0) + 1;
      warnings.push(
        'Escape Grab takes a bane: the actor is smaller than what has them grabbed (feature/ability/common/escape-grab.md).',
      );
    }
    if (unknownSize)
      warnings.push(
        'Escape Grab: a grab source or size is not recorded; apply the bane manually if the actor is smaller than what holds them (feature/ability/common/escape-grab.md).',
      );
    return {
      note: tier =>
        tier === 3
          ? ` ${actorRecord.actor.name} is no longer grabbed.`
          : tier === 2
            ? ` ${actorRecord.actor.name} can escape, but the grabber can first make a melee free strike; record an escape with condition off grabbed.`
            : ' No effect.',
      commit: async (mctx, scope, tier) => {
        if (tier !== 3) return;
        const kind = actorRecord.actor.kind;
        if (kind === 'character' || kind === 'foe')
          await setManualCondition(
            mctx,
            scope,
            { kind, id: actorRecord.actor.id },
            'grabbed',
            false,
          );
      },
    };
  }
  if (ability.abilityId !== GRAB_ID) return undefined;
  const target = targets[0]!;
  const creature =
    !target.squad && (target.actor.kind === 'character' || target.actor.kind === 'foe');
  const eligibility = grabEligibility(
    movementFacts(actorRecord).size,
    movementFacts(target).size,
    actorRollFacts(actorRecord.actor, actorRecord).characteristics.M,
  );
  if (eligibility === 'ineligible')
    throw new ConvexError(
      `${actorRecord.actor.name} can't grab ${target.actor.name}: it is larger than they can grab (condition/grabbed.md).`,
    );
  // Withheld, not refused, so the table decides:
  //   chapter/monster-basics.md, Creatures Who Grab: one grab at a time;
  //   chapter/classes.md, Stacking Unique Effects: no second grab by another enemy;
  //   and a known grabbed immunity.
  const holding = (await activeGrabsBy(ctx, actorRecord)).filter(h => h.id !== target.actor.id);
  // The same source detection as compiled grabs (QC1 R1): manual or unsourced grabs count.
  const otherGrabbers = grabbedBy(target).some(source => source !== actorRecord.actor.id);
  const immune = (
    target.character
      ? (baselineOf(target.character.derivedBaseline)?.conditionImmunities ?? [])
      : []
  ).some(i => i.condition === 'grabbed');
  const withheld = holding.length
    ? `${actorRecord.actor.name} already has ${holding.map(h => h.name).join(', ')} grabbed; a creature grabs one at a time unless its stat block or feature says otherwise (chapter/monster-basics.md; Q-GRAB-1). Release one with condition off, then record this grab`
    : otherGrabbers
      ? `${target.actor.name} is already grabbed by another creature (chapter/classes.md, Stacking Unique Effects); the table decides`
      : immune
        ? `${target.actor.name} can't be grabbed (evaluated immunity)`
        : undefined;
  const automatic = creature && eligibility === 'allowed' && !withheld;
  return {
    note: tier =>
      tier === 3
        ? automatic
          ? ` ${target.actor.name} is grabbed by ${actorRecord.actor.name}.`
          : ` The grab is not recorded automatically: ${withheld ?? 'size or squad facts are unavailable'}.`
        : tier === 2
          ? ` ${actorRecord.actor.name} can grab ${target.actor.name}, but the target can first make a melee free strike; record the grab with condition on grabbed.`
          : ' No effect.',
    commit: async (mctx, scope, tier, source) => {
      if (tier !== 3 || !automatic) return;
      await applyConditionInstance(
        mctx,
        scope,
        { kind: target.actor.kind as 'character' | 'foe', id: target.actor.id },
        {
          id: `${scope.eventId}:grabbed`,
          condition: 'grabbed',
          duration: 'none',
          sourceActorId: actorRecord.actor.id,
          sourceUseEventId: scope.eventId,
          ...source,
        },
      );
    },
  };
}

/** Creatures in this campaign the actor currently has grabbed through a recorded grab. */
async function activeGrabsBy(
  ctx: ReadCtx,
  actorRecord: TargetRecord,
): Promise<{ id: string; name: string }[]> {
  const campaignId = actorRecord.character?.campaignId ?? actorRecord.foe?.campaignId;
  if (!campaignId) return [];
  const held = (instances: { status: string; condition: string; sourceActorId?: string }[]) =>
    instances.some(
      i =>
        i.status === 'active' &&
        i.condition === 'grabbed' &&
        i.sourceActorId === actorRecord.actor.id,
    );
  const held_: { id: string; name: string }[] = [];
  for (const hero of await ctx.db
    .query('characters')
    .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
    .collect())
    if (hero.liveState && held(hero.liveState.conditionInstances ?? []))
      held_.push({ id: hero._id, name: hero.authored?.name ?? 'a hero' });
  for (const foe of await ctx.db
    .query('foes')
    .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
    .collect())
    if (held(foe.live.conditionInstances ?? [])) held_.push({ id: foe._id, name: foe.name });
  return held_;
}

const abilityUse: OperationDefinition = {
  id: 'ability.use',
  family: 'ability',
  verb: 'use',
  title: 'Use an ability',
  description:
    'Resolve an ability for the acting creature against the given targets: fixed cost and affordability first (unaffordable blocks with no roll and no debit), then the shared 2d10, each target’s edges and banes, tier, supported damage (temporary Stamina first), winded and Slain, critical recognition, and every other clause recorded verbatim as unresolved. Common actions: Melee/Ranged Weapon Free Strike, Free Strike (creatures), Catch Breath, Defend, Aid Attack.',
  args: {
    ability: v.string(),
    targets: v.optional(v.array(referenceValidator)),
    edges: v.optional(v.union(v.number(), v.array(v.number()))),
    banes: v.optional(v.union(v.number(), v.array(v.number()))),
    characteristic: v.optional(v.string()),
    'damage-characteristic': v.optional(v.string()),
    mode: v.optional(v.string()),
    exclude: v.optional(v.union(v.string(), v.array(v.string()))),
    strained: v.optional(v.string()),
    spend: v.optional(v.number()),
    potency: v.optional(v.string()),
    fromDraft: v.optional(v.boolean()),
  },
  argDescriptions: {
    ability: 'The ability by printed name or content id.',
    targets: 'Targets as [@Name, @{foe:id}, @self]; omitted for a self-only ability.',
    edges: 'Edges per target, one number per target in order (or one number for a single target).',
    banes: 'Banes per target, one number per target in order (or one number for a single target).',
    characteristic: 'Roll characteristic override (M, A, R, I or P) among the permitted ones.',
    'damage-characteristic':
      'Independent choice among the printed damage characteristics; otherwise highest permitted.',
    mode: 'melee or ranged, required when a Melee-and-Ranged ability deals different damage in each mode.',
    exclude:
      'Effect instance ids whose automatic edge, bane or bonus does not apply to this roll (the table’s override). Edges and banes given here are circumstance, added to the automatic ones.',
    strained:
      'yes or no, for an ability with a Strained effect the engine applies. By default the engine decides from Clarity (below 0 before the use, or taken below 0 by its cost). Outside combat, yes incurs the effect for 1d6 damage (the one-minute or voluntary rule); in combat a value against the automatic one is the table’s override.',
    spend:
      'For a triggered response with a Spend section the engine applies (V174), the heroic resource to spend on it: its printed amount, or that much or more for "Spend 1+". Omit to spend nothing.',
    potency:
      'For a response that reduces the potency of one effect of the triggering damage, the condition whose potency is reduced, when more than one would change.',
    fromDraft: 'Set by the selection controls when they fire the invoking user’s draft.',
  },
  roles: PLAYERS,
  session: 'running',
  actor: 'required',
  execute: async (ctx, { context, envelope, actor, args, respondsTo }) => {
    const records = await loadActorRecords(ctx, context, actor!);
    const abilities = await abilitiesFor(ctx, actor!, records);
    const ability = findAbility(abilities, String(args.ability));
    if (!ability)
      throw new ConvexError(
        `${actor!.name} has no ability "${String(args.ability)}". Available: ${abilities.map(a => a.name).join(', ')}.`,
      );
    const references = (args.targets as Reference[] | undefined) ?? [];
    const targets: TargetRecord[] = [];
    for (const reference of references) {
      const record = await bindTarget(ctx, context, reference, actor!);
      if (!targets.some(t => sameActor(t.actor, record.actor))) targets.push(record);
    }
    if (ability.targetShape.kind === 'self') {
      if (targets.length && !targets.every(t => sameActor(t.actor, actor!)))
        throw new ConvexError(`${ability.name} targets self only.`);
      if (!targets.length) targets.push(records);
    }
    // V159: "Self and each ally in the area" always names the user
    // (feature/ability/tactician/level-2/squad-on-me.md).
    const effectOnlyShape =
      ability.compilation?.mode === 'compiled' && ability.compilation.definition.effectOnly
        ? ability.compilation.definition.activation?.targetShape
        : undefined;
    // V171: so does "Self and each ally" (feature/ability/conduit/level-2/blessing-of-insight.md).
    if (
      (effectOnlyShape?.kind === 'area' || effectOnlyShape?.kind === 'each') &&
      effectOnlyShape.self === true &&
      !targets.some(t => sameActor(t.actor, actor!))
    )
      targets.unshift(records);
    // feature/common/maneuvers/stand-up.md: yourself unless you name a willing adjacent creature.
    if (ability.abilityId === STAND_UP_ID && !targets.length) targets.push(records);
    const counts = (value: unknown, name: string): number[] => {
      if (value === undefined) return targets.map(() => 0);
      const list = Array.isArray(value) ? value : [value];
      if (list.length !== targets.length)
        throw new ConvexError(`"${name}" needs one number per target (${targets.length}).`);
      return list.map(n => integer(n, name, 0));
    };
    const edges = counts(args.edges, 'edges');
    const banes = counts(args.banes, 'banes');
    const exclude = excludeList(args.exclude);
    const warnings: string[] = [];
    if (ability.targetShape.kind === 'single' && targets.length !== 1)
      throw new ConvexError(`${ability.name} targets one creature; give exactly one target.`);
    // V110: compiled automation applies tier effects to every given target, so it keeps the printed
    // maximum (pinned rule/combat/target.md); compatibility records retain the rule warning.
    if (
      ability.compilation?.mode === 'compiled' &&
      ability.targetShape.kind === 'multi' &&
      targets.length > ability.targetShape.max
    )
      throw new ConvexError(
        `${ability.name} targets up to ${ability.targetShape.max}; give at most ${ability.targetShape.max} targets.`,
      );
    if (ability.targetShape.kind === 'multi' && targets.length > ability.targetShape.max)
      warnings.push(
        `Rule warning: ${ability.name} targets up to ${ability.targetShape.max} creatures; ${targets.length} were given.`,
      );
    if (ability.targetShape.kind !== 'self' && !targets.length)
      throw new ConvexError(`${ability.name} needs at least one target.`);
    const allowance = await allowanceFor(ctx, context, actor!);
    const tracking = planTracking(allowance, actor!, ability.actionType);
    warnings.push(...tracking.warnings);
    // V173: condition/dazed.md prevents both kinds of triggered action (advisory for a use by hand;
    // an offered card is re-checked and refused below).
    const triggeredUse =
      ability.actionType === 'triggered action' || ability.actionType === 'free triggered action';
    if (triggeredUse && allowance.inCombat && conditionsOf(records)?.dazed)
      warnings.push(
        `Rule warning: ${actor!.name} is dazed and can't use triggered actions or free triggered actions (condition/dazed.md).`,
      );
    // V173: condition/bleeding.md: using a triggered action while bleeding (a dying hero is,
    // rule/health/dying.md) costs 1d6 + level Stamina after it resolves. Left to the table.
    const bleedingLive = records.character?.liveState;
    if (
      triggeredUse &&
      allowance.inCombat &&
      bleedingLive &&
      (bleedingLive.conditions.bleeding || bleedingLive.stamina <= 0)
    )
      warnings.push(
        `Rule warning: ${actor!.name} is bleeding${bleedingLive.stamina <= 0 ? ' (dying)' : ''}: after this triggered action resolves they lose 1d6 + ${baselineOf(records.character!.derivedBaseline)?.level.value ?? 'their level'} Stamina, which can't be prevented (condition/bleeding.md). The table applies it.`,
      );
    // V173: a response to a triggered-action card (convex/lib/triggeredActions.ts).
    const answered = respondsTo ? await offerOf(ctx, respondsTo.interactionId) : null;
    if (answered)
      await recheckOffer(ctx, context, answered.offer, {
        abilityId: ability.abilityId,
        actorId: actor!.id,
        targetIds: targets.map(t => t.actor.id),
      });
    if (
      answered &&
      !(ability.compilation?.mode === 'compiled' && ability.compilation.definition.trigger)
    )
      throw new ConvexError(
        `${ability.name} is no longer a triggered ability the engine resolves.`,
      );
    const source = sourceFor(ability);
    const clear = async (mctx: MutationCtx) => {
      // Firing clears the invoking user's draft (confirmed), whichever path fired it.
      await clearDraft(mctx, context);
    };
    const targetNames = targets.map(t => t.actor.name).join(', ');
    const execution = ability.compilation
      ? { mode: ability.compilation.mode, diagnostics: ability.compilation.diagnostics }
      : undefined;
    const abilityData = {
      ...(execution ? { execution } : {}),
      id: ability.abilityId,
      name: ability.name,
      kind: ability.kind,
      contentId: ability.contentId,
      actionType: ability.actionType,
      usage: ability.usage,
      keywords: ability.keywords,
      ...(ability.cost ? { cost: ability.cost } : {}),
      distance: ability.distance,
      target: ability.target,
      ...(ability.roll ? { roll: ability.roll } : {}),
      ...(ability.tiers ? { tiers: ability.tiers } : {}),
      ...(ability.effects ? { effects: ability.effects } : {}),
    };

    // V170: a Strained section the engine applies, and the table's declaration for it.
    const strainedNode =
      ability.compilation?.mode === 'compiled'
        ? ability.compilation.definition.sections.find(node => node.kind === 'strained')
        : undefined;
    let declaredStrained: 'yes' | 'no' | undefined;
    if (args.strained !== undefined) {
      const value = String(args.strained).toLowerCase();
      if (value !== 'yes' && value !== 'no') throw new ConvexError('"strained" must be yes or no.');
      if (!strainedNode)
        throw new ConvexError(
          `${ability.name} has no Strained effect the engine applies; resolve any strain effect at the table.`,
        );
      declaredStrained = value;
    }

    if (ability.compilation?.mode === 'manual') {
      return {
        kind: 'ability.recorded',
        description: `${actor!.name} records ${ability.name} for manual resolution: source coverage is not safe for automatic payment, rolls or effects.`,
        data: {
          ability: abilityData,
          manual: true,
          source,
          diagnostics: ability.compilation.diagnostics,
          targets: targets.map(t => t.actor),
        },
        commit: async (mctx, scope) => {
          await noteRecordedUse(mctx, scope, actor!, ability.keywords, targets);
          // V173: a triggered action used by hand still counts against the round's allowance.
          if (triggeredUse)
            await recordUse(
              mctx,
              scope,
              allowance,
              actor!,
              ability.actionType!,
              ability.name,
              tracking,
            );
          await clear(mctx);
        },
      };
    }

    // V159 (docs/lasting-effects-design.md#2-modifier-pipeline): the automatic contributions of
    // the active modifiers on the actor's roll and on each target's roll against, after printed
    // stacking, less the table's exclusions. Circumstance edges and banes add to them.
    const rolledAbility = ability.kind === 'rolled';
    // QC1 train 13 R2 follow-up: a modifier whose owner is already dying ("until you are dying",
    // rule/health/dying.md) contributes nothing; the rolled use's commit ends it.
    const lapsed: LapsedEffect[] = [];
    for (const record of [records, ...targets]) {
      const holder = holderOfRecord(record);
      if (holder && !lapsed.some(l => sameActor(l.holder, holder)))
        lapsed.push(...(await lapsedEffects(ctx, context.campaign._id, holder, effectsOf(record))));
    }
    const liveEffectsOf = (record: { character?: Doc<'characters'>; foe?: Doc<'foes'> }) =>
      effectsOf(record).filter(i => !lapsed.some(l => l.instance.id === i.id));
    const automatic = rollContributions({
      actor: { id: actor!.id, instances: liveEffectsOf(records) },
      targets: targets.map(t => ({ id: t.actor.id, instances: liveEffectsOf(t) })),
      roll: { strike: ability.keywords.some(k => plainText(k).toLowerCase() === 'strike') },
      exclude,
    });
    if (exclude.length) {
      if (!rolledAbility)
        throw new ConvexError(`${ability.name} has no power roll: there is nothing to exclude.`);
      const known = contributionIds(automatic.flatMap(t => t.contributions));
      const unknown = exclude.filter(id => !known.has(id));
      if (unknown.length)
        throw new ConvexError(
          `Not an automatic contribution to this roll: ${unknown.join(', ')}. effect.list names the active effects.`,
        );
    }
    const rollTotals = () =>
      targets.map((t, i) =>
        withContributions(
          { targetId: t.actor.id, edges: edges[i]!, banes: banes[i]! },
          automatic[i]!.contributions,
        ),
      );
    const costPool = ability.fixedCost
      ? poolFor(records, context, ability.fixedCost.resource)
      : undefined;
    // V156: the same edge-reduced cost the roll resolver charges (effectiveFixedCost), only for an
    // ability that makes use of a power roll (feature/shadow/level-1/insight.md). V159: automatic
    // edges count.
    const affordability = checkAffordability(
      rolledAbility && ability.fixedCost
        ? effectiveFixedCost(ability.fixedCost, actorRollFacts(actor!, records), rollTotals())
        : ability.fixedCost,
      costPool,
      allowance.inCombat,
    );
    if (affordability.kind === 'blocked')
      return {
        kind: 'ability.blocked',
        description: `Blocked: ${actor!.name} cannot use ${ability.name} — ${affordability.reason}. No roll, no cost, no action used; the pending selection is kept.`,
        data: {
          ability: abilityData,
          blocked: { ...affordability, abilityId: ability.abilityId, actorId: actor!.id },
          targets: targets.map(t => t.actor),
          source,
        },
      };
    const cost: CostApplication | undefined =
      affordability.kind === 'affordable'
        ? {
            ...affordability.cost,
            waived: false,
            before: affordability.before,
            after: affordability.after,
          }
        : affordability.kind === 'waived'
          ? {
              ...affordability.cost,
              waived: true,
              before: affordability.pool,
              after: affordability.pool,
            }
          : undefined;
    if (cost?.waived)
      warnings.push(
        `The outside-combat ${cost.resource} reuse restriction is checked manually from its class source; no reuse limit or resource lifecycle is automated.`,
      );

    // ---- Catch Breath (R04 section 7): a maneuver in combat, the same operation in FreePlay.
    if (ability.kind === 'catch-breath') {
      const live = records.character?.liveState;
      // A02: the Stamina maximum comes from the effective build's baseline (R02 1.3).
      const baseline = records.character ? baselineOf(records.character.derivedBaseline) : null;
      if (records.actor.kind === 'character' && (!live || !baseline))
        throw new ConvexError(
          `${actor!.name} has no evaluated build or live record; admission to the campaign supplies them.`,
        );
      const response = resolveCatchBreath({
        actorId: actor!.id,
        inCombat: allowance.inCombat,
        stamina: live?.stamina ?? records.foe!.live.stamina,
        maxStamina: baseline?.staminaMaximum.value ?? records.foe!.maxStamina,
        temporaryStamina: live?.temporaryStamina ?? records.foe!.live.temporaryStamina,
        ...(records.actor.kind === 'character' ? { recoveries: live!.recoveries } : {}),
        ...(live && live.stamina <= 0 ? { dying: true } : {}),
      });
      const supporting = [await supportingSource(ctx, RECOVERIES_RULE_ID)];
      if (response.kind === 'blocked')
        return {
          kind: 'ability.blocked',
          description: `Blocked: ${actor!.name} cannot use Catch Breath — ${response.reason} Nothing was spent or healed.`,
          data: { ability: abilityData, blocked: response, source: { ...source, supporting } },
        };
      warnings.push(...response.warnings);
      return {
        kind: 'hero.catch-breath',
        description: `${actor!.name} uses Catch Breath${allowance.inCombat ? ' (maneuver)' : ''}: spent a Recovery (${response.recoveriesBefore} → ${response.recoveriesAfter}) and regained ${response.healed} Stamina (${response.staminaBefore} → ${response.staminaAfter}${response.capApplied ? ', capped at the maximum' : ''}).${warnings.length ? ` ${warnings.join(' ')}` : ''}`,
        data: {
          ability: abilityData,
          result: response,
          allowance: {
            inCombat: allowance.inCombat,
            onTurn: allowance.onTurn,
            turnId: allowance.turnId,
          },
          warnings,
          source: {
            ...source,
            supporting,
            note: allowance.inCombat
              ? 'Combat use: recorded as the maneuver (docs/table-spec.md#v001-catch-breath).'
              : 'FreePlay use: no maneuver allowance is consumed (docs/table-spec.md#v001-catch-breath).',
          },
        },
        commit: async (mctx, scope) => {
          const character = (await mctx.db.get(records.character!._id))!;
          const current = requireHeroLive(character);
          await journalPatch(mctx, scope, 'characters', character._id, {
            liveState: {
              ...current,
              stamina: response.staminaAfter,
              recoveries: response.recoveriesAfter,
            },
          });
          await recordUse(mctx, scope, allowance, actor!, 'maneuver', ability.name, tracking);
          await clear(mctx);
        },
      };
    }

    // ---- Defend, Aid Attack and any ability the app cannot resolve: recorded with full text.
    if (ability.abilityId === STAND_UP_ID) {
      // condition/restrained.md: a restrained creature can't use the Stand Up maneuver.
      if (conditionsOf(records)?.restrained)
        throw new ConvexError(`${actor!.name} is restrained and can't use Stand Up.`);
      const target = targets[0]!;
      if (!conditionsOf(target)?.prone)
        throw new ConvexError(`${target.actor.name} is not prone; Stand Up has nothing to end.`);
      // V155 (automation rulings, section 5): an active "can't stand" restriction holds them down.
      const holding = instancesOf(target).find(
        i => i.status === 'active' && i.restriction === 'cant-stand',
      );
      if (holding)
        throw new ConvexError(
          `${target.actor.name} can't stand (${holding.actorLabel}'s ${holding.abilityName}, ${holding.duration === 'eot' ? 'until the end of their turn' : 'save ends'}); Stand Up is unavailable until that ends.`,
        );
      if (target.squad || (target.actor.kind !== 'character' && target.actor.kind !== 'foe'))
        throw new ConvexError('Stand Up ends prone on a hero or foe; resolve squads manually.');
      const other = !sameActor(target.actor, actor!);
      const description = `${actor!.name} uses Stand Up (maneuver)${other ? ` to make ${target.actor.name} stand up (a willing adjacent creature; the table confirms)` : ''}: ${target.actor.name} is no longer prone.${warnings.length ? ` ${warnings.join(' ')}` : ''}`;
      return {
        kind: 'ability.recorded',
        description,
        data: {
          ability: abilityData,
          targets: [target.actor],
          publicDescription: description,
          allowance: {
            inCombat: allowance.inCombat,
            onTurn: allowance.onTurn,
            turnId: allowance.turnId,
          },
          warnings,
          source,
        },
        commit: async (mctx, scope) => {
          await setManualCondition(
            mctx,
            scope,
            { kind: target.actor.kind as 'character' | 'foe', id: target.actor.id },
            'prone',
            false,
          );
          await noteRecordedUse(mctx, scope, actor!, ability.keywords, []);
          await recordUse(mctx, scope, allowance, actor!, 'maneuver', ability.name, tracking);
          await clear(mctx);
        },
      };
    }
    // ---- V157 ability without a power roll: pay, apply gains, record the ordered table work.
    if (ability.compilation?.mode === 'compiled' && ability.compilation.definition.effectOnly) {
      const definition = ability.compilation.definition;
      const recipient = (record: TargetRecord): EffectOnlyRecipient => {
        const id = record.actor.id;
        if (record.squad) return { id, kind: 'squad' };
        if (record.character) {
          const live = record.character.liveState;
          return live
            ? { id, kind: 'hero', temporaryStamina: live.temporaryStamina, surges: live.surges }
            : { id, kind: 'hero' };
        }
        return { id, kind: record.foe ? 'foe' : 'object' };
      };
      // V174: a response that revises the triggering damage, and its optional Spend section.
      const spendNode = definition.sections.find(node => node.kind === 'response-spend');
      const spend = args.spend === undefined ? undefined : integer(args.spend, 'spend', 1);
      if (spend !== undefined && !spendNode)
        throw new ConvexError(`${ability.name} has no Spend section the engine applies.`);
      const revisionNode = definition.sections.find(node => node.kind === 'damage-revision');
      if (args.potency !== undefined && (!answered || !revisionNode))
        throw new ConvexError(
          '"potency" answers a response card that reduces one effect’s potency.',
        );
      const revisionPlan =
        answered && revisionNode
          ? await planRevision(
              ctx,
              context.campaign._id,
              answered.offer,
              { name: ability.name, definition },
              {
                ...(spend !== undefined ? { spend } : {}),
                ...(args.potency !== undefined ? { potencyChoice: String(args.potency) } : {}),
              },
            )
          : undefined;
      // The response's own spend can't use a gain its revision takes back: the pool it is paid from
      // is the pool after that reversal (the revision is written first, below).
      const reclaimed =
        revisionPlan?.gains
          .filter(gain => gain.characterId === actor!.id)
          .reduce((sum, gain) => sum + gain.before - gain.after, 0) ?? 0;
      const heldPool = spendNode ? poolFor(records, context, spendNode.resource) : undefined;
      const spendPool = heldPool && { ...heldPool, current: heldPool.current - reclaimed };
      const effectInput: EffectOnlyInput = {
        actor: recipient(records),
        ...(records.character || records.foe
          ? { actorCharacteristics: actorRollFacts(actor!, records).characteristics }
          : {}),
        targets: targets.map(recipient),
        inCombat: allowance.inCombat,
        ...(spend !== undefined && spendPool
          ? { resourcePool: spendPool }
          : costPool
            ? { resourcePool: costPool }
            : {}),
        ...(answered
          ? {
              trigger: {
                damage: answered.offer.damage,
                ...(revisionPlan
                  ? {
                      revision: {
                        hitEventId: revisionPlan.hitEventId,
                        targetId: revisionPlan.damaged._id,
                        kind: 'hero' as const,
                        current: revisionPlan.current,
                      },
                    }
                  : {}),
              },
            }
          : {}),
        ...(spend !== undefined ? { spend } : {}),
      };
      const outcome = resolveEffectOnly(definition, effectInput);
      // V173: an accepted card re-checks cost; an unaffordable one stays open, unchanged.
      if (outcome.kind === 'blocked' && answered)
        throw new ConvexError(
          `${actor!.name} cannot use ${ability.name} — ${outcome.reason}. The card stays open.`,
        );
      if (outcome.kind === 'blocked')
        return {
          kind: 'ability.blocked',
          description: `Blocked: ${actor!.name} cannot use ${ability.name} — ${outcome.reason}. No cost, no effect, no action used; the pending selection is kept.`,
          data: { ability: abilityData, targets: targets.map(t => t.actor), source },
        };
      if (outcome.kind !== 'resolved') throw new ConvexError(`${ability.name}: ${outcome.reason}`);
      warnings.push(...outcome.warnings);
      // V174: what the revision reverses or leaves standing, with the revised hit (design 5b).
      for (const effect of outcome.effects)
        if (effect.kind === 'damage-revision' && effect.status === 'calculated' && revisionPlan)
          Object.assign(effect, { consequences: revisionPlan.notes });
      // V173: damage sized by the triggering damage, through the target's immunities and
      // weaknesses (rule/damage/damage-immunity.md, damage-weakness.md) and the damage writer.
      const triggeredDamage: { record: TargetRecord; application: DamageApplication }[] = [];
      for (const effect of outcome.effects) {
        if (effect.kind !== 'triggered-damage' || effect.status !== 'calculated') continue;
        const record = targets.find(t => t.actor.id === effect.targetId)!;
        const facts = record.squad
          ? { missing: `${record.actor.name} is a squad, whose pool the table adjusts` }
          : damageTargetFacts(record);
        if ('missing' in facts) {
          Object.assign(effect, { status: 'manual', requirements: [facts.missing] });
          continue;
        }
        const application = applyDamage(facts.facts, {
          targetId: facts.facts.targetId,
          amount: effect.amount!,
          damageType: effect.damageType,
          causeLabel: `${actor!.name}'s ${ability.name}`,
        });
        effect.application = application;
        triggeredDamage.push({ record, application });
      }
      const order = answered
        ? await acceptanceOrder(ctx, context.campaign._id, answered.offer)
        : undefined;
      const nameOf = (id: string) =>
        id === actor!.id ? actor!.name : (targets.find(t => t.actor.id === id)?.actor.name ?? id);
      const describeEffect = (effect: CompiledEffectOutcome) => {
        if (effect.kind === 'damage-revision') {
          const table = effect.instructions.length
            ? ` For the table (no map): the movement${effect.instructions.includes('ability-use') ? ' and the Hide maneuver' : ''} in "${effect.clause}"`
            : '';
          if (
            effect.status !== 'calculated' ||
            !effect.before ||
            !effect.application ||
            !revisionPlan
          )
            return `For the table (${nameOf(effect.targetId)}): "${effect.clause}" (used by hand: halve the triggering damage and resolve the rest at the table)`;
          const before = effect.before;
          const after = effect.application;
          const stamina = revisionPlan.stamina;
          const temporary = revisionPlan.temporaryStamina;
          return `${nameOf(effect.targetId)} takes half the damage (rule/general/always-round-down.md: ${before.incoming} → ${after.incoming})${after.weaknessApplied || after.immunityApplied ? `, then weakness ${after.weaknessApplied} and immunity ${after.immunityApplied}` : ''}: the hit is revised from ${damageTaken(before)} to ${damageTaken(after)} damage; Stamina ${stamina.before} → ${stamina.after}${temporary.after !== temporary.before ? `, temporary Stamina ${temporary.before} → ${temporary.after}` : ''}${after.windedAfter ? '' : before.windedAfter ? '; no longer winded' : ''}${after.dying || !before.dying ? '' : '; no longer dying'}.${effect.consequences?.length ? ` ${effect.consequences.join(' ')}` : ''}${effect.confirm && effect.targetId !== actor!.id ? ` Accepting confirmed ${actor!.name} ended the shift adjacent to ${nameOf(effect.targetId)}.` : ''}${table}`;
        }
        if (effect.kind === 'response-spend')
          return effect.status !== 'spent'
            ? ''
            : effect.effect.kind === 'instruction'
              ? `For the table (${effect.amount} ${effect.resource} spent): "${effect.clause}"`
              : `${effect.amount} ${effect.resource} spent: "${effect.clause}"`;
        if (effect.kind === 'triggered-damage')
          return effect.status === 'calculated' && effect.application
            ? `${nameOf(effect.targetId)} takes ${effect.amount} ${effect.damageType} damage (half the triggering ${effect.triggeringDamage}, rounded down)${effect.application.afterImmunity !== effect.amount ? `, ${effect.application.afterImmunity} after immunity and weakness` : ''}; Stamina ${effect.application.staminaBefore} → ${effect.application.staminaAfter}.`
            : `For the table (${nameOf(effect.targetId)}): "${effect.clause}"${effect.requirements.length ? ` (${effect.requirements.join('; ')})` : ''}`;
        if (effect.kind === 'watcher')
          return effect.status === 'applied' && effect.payload
            ? `${nameOf(effect.targetId)}: ${describeWatcher(effect.payload)}, ${describeDuration(effect.spec.duration, effect.spec.endsWhen)} (tracked; the linked effect entry records whether the engine fires it).`
            : `For the table (${nameOf(effect.targetId)}): "${effect.clause}"`;
        if (effect.kind === 'modifier')
          return effect.status === 'applied' && effect.payload
            ? `${nameOf(effect.targetId)}: ${describeModifier(effect.payload)}, ${describeDuration(effect.spec.duration, effect.spec.endsWhen)} (tracked; the linked effect entry records whether it applies automatically).`
            : `For the table (${nameOf(effect.targetId)}): "${effect.clause}"`;
        if (effect.kind === 'gain' && effect.application) {
          const a = effect.application;
          const parts = [
            effect.temporaryStamina !== undefined
              ? `${effect.temporaryStamina} temporary Stamina (${a.temporaryStaminaBefore} → ${a.temporaryStaminaAfter}, the greater amount is kept)`
              : '',
            effect.surges !== undefined
              ? `${effect.surges} surge${effect.surges === 1 ? '' : 's'} (${a.surgesBefore} → ${a.surgesAfter})`
              : '',
          ].filter(Boolean);
          return `${nameOf(effect.targetId)} gains ${parts.join(' and ')}.`;
        }
        return `For the table (${nameOf(effect.targetId)}): "${effect.clause}"`;
      };
      const effectsText = outcome.effects.map(describeEffect).filter(Boolean).join(' ');
      const payment = outcome.cost
        ? outcome.cost.waived
          ? ` Cost ${outcome.cost.amount} ${outcome.cost.resource} waived outside combat.`
          : ` Spent ${outcome.cost.amount} ${outcome.cost.resource} (${outcome.cost.before} → ${outcome.cost.after}).`
        : '';
      const responding = answered
        ? ` Accepted from the card (response ${order} to this trigger; the table confirmed distance: ${answered.offer.distance}).`
        : '';
      const describeUse = (paid: string) =>
        `${actor!.name} uses ${ability.name} (${definition.activation!.actionType}, no power roll)${ability.targetShape.kind !== 'self' ? ` on ${targetNames}` : ''}.${responding}${paid} ${effectsText}${warnings.length ? ` ${warnings.join(' ')}` : ''}`;
      const effects = (eventId: string) => effectOccurrences(eventId, eventId, outcome.effects);
      return {
        kind: 'ability.use',
        description: describeUse(payment),
        data: {
          ability: abilityData,
          effectOnly: true,
          targets: targets.map(t => t.actor),
          publicDescription: describeUse(
            outcome.cost?.resource === 'malice' ? ` Spent ${outcome.cost.amount} malice.` : payment,
          ),
          ...(outcome.cost ? { cost: outcome.cost } : {}),
          effects: outcome.effects,
          ...(answered
            ? {
                trigger: {
                  interactionId: answered.card._id,
                  triggeringEventId: answered.offer.triggeringEventId,
                  damage: answered.offer.damage,
                  text: answered.offer.trigger.text,
                  distance: answered.offer.distance,
                  // rule/combat/triggered-action.md: players order their own responses by
                  // accepting them; the engine never resolves one by arrival.
                  acceptanceOrder: order,
                },
              }
            : {}),
          allowance: {
            inCombat: allowance.inCombat,
            onTurn: allowance.onTurn,
            turnId: allowance.turnId,
            usedOpportunity: tracking.opportunity?._id ?? null,
          },
          warnings,
          source,
        },
        commit: async (mctx, scope) => {
          // V173: the answered card resolves in this use's journal, so undo reopens it.
          if (answered) await resolveOffer(mctx, scope, answered.card, respondsTo!.answer);
          // V174: the accepted response revises the hit, in this use's journal scope, before its
          // own spend is paid from what the revision leaves.
          if (revisionPlan)
            await commitRevision(mctx, scope, revisionPlan, `${actor!.name}'s ${ability.name}`);
          // 1. The fixed cost once, before any effect.
          if (outcome.cost && !outcome.cost.waived)
            await debit(mctx, scope, records, context, outcome.cost.after, outcome.cost.resource);
          // V158: "until you use this ability again" ends the owner's earlier effects of it.
          await endReusedEffects(mctx, scope, actor!, ability.abilityId);
          // V171: the user's watchers of their own ability use.
          await observeUse(mctx, scope, actor!, ability.keywords);
          // 2. Gains on each hero's live state (temporary Stamina keeps the greater; surges add).
          // QC1 train 13 R1: applied to the current values, since a watcher of the use (above)
          // may have changed them: surges add, temporary Stamina keeps the greater amount
          // (rule/resource/surge.md, rule/health/temporary-stamina.md).
          for (const write of outcome.writes) {
            const record =
              write.id === actor!.id ? records : targets.find(t => t.actor.id === write.id)!;
            const character = (await mctx.db.get(record.character!._id))!;
            const live = requireHeroLive(character);
            const gains = outcome.effects.filter(
              effect =>
                effect.kind === 'gain' &&
                effect.status === 'applied' &&
                effect.targetId === write.id,
            ) as CompiledGainOutcome[];
            const granted = gains.flatMap(g =>
              g.temporaryStamina === undefined ? [] : [g.temporaryStamina],
            );
            await journalPatch(mctx, scope, 'characters', character._id, {
              liveState: {
                ...live,
                temporaryStamina: Math.max(live.temporaryStamina, ...granted),
                surges: live.surges + gains.reduce((sum, g) => sum + (g.surges ?? 0), 0),
              },
            });
          }
          // V159: modifiers become modifier effect instances on each subject.
          const manualIds = await commitModifiers(
            mctx,
            scope,
            effects(scope.eventId),
            [records, ...targets],
            {
              eventId: scope.eventId,
              abilityId: ability.abilityId,
              abilityName: ability.name,
              actor: actor!,
              sourcePath: ability.source.path,
            },
            allowance.encounterId,
          );
          // V173: damage sized by the triggering damage; the user deals it.
          // QC1 train 13 R1: taken from the target's current pools.
          const reapplied = [];
          for (const { record, application } of triggeredDamage) {
            const applied = await writePlannedDamage(mctx, scope, record, application, {
              ...(actor!.kind === 'character' || actor!.kind === 'foe'
                ? { dealer: { kind: actor!.kind, id: actor!.id, name: actor!.name } }
                : {}),
            });
            if (changedPools(application, applied))
              reapplied.push({
                name: record.actor.name,
                cause: 'damage',
                planned: application,
                applied,
              });
          }
          await logReappliedDamage(mctx, scope, `${actor!.name}'s ${ability.name}`, reapplied);
          // V171: watchers become watcher effect instances on each subject.
          const watcherIds = await commitWatchers(
            mctx,
            scope,
            effects(scope.eventId),
            [records, ...targets],
            {
              eventId: scope.eventId,
              abilityId: ability.abilityId,
              abilityName: ability.name,
              actor: actor!,
              sourcePath: ability.source.path,
            },
            allowance.encounterId,
          );
          // 3. The effective record: occurrences and their dispositions; no dice or outcome.
          await journalInsert(mctx, scope, 'abilityResults', {
            campaignId: scope.campaignId,
            eventId: scope.eventId,
            encounterId: allowance.encounterId,
            actor: actor!,
            abilityId: ability.abilityId,
            ...(execution ? { execution } : {}),
            effectOnly: true,
            compiled: {
              version: 1,
              definition,
              inputs: effectInput,
              revision: scope.eventId,
              effects: markManual(effects(scope.eventId), new Set([...manualIds, ...watcherIds])),
            } satisfies CompiledResult,
            abilityName: ability.name,
            selectedCharacteristic: null,
            targets: targets.map(t => ({
              target: t.actor,
              edges: 0,
              banes: 0,
              outcome: null,
              applied: null,
              dispositions: [],
            })),
            manualDispositions: [],
            correctionEventIds: [],
          });
          // 4. Action tracking.
          await recordUse(
            mctx,
            scope,
            allowance,
            actor!,
            definition.activation!.actionType,
            ability.name,
            tracking,
            answered ? { keepTriggeringEventId: answered.offer.triggeringEventId } : {},
          );
          await clear(mctx);
        },
      };
    }
    if (ability.kind === 'recorded' || ability.unknownCost || !ability.actionType) {
      const reason = ability.unknownCost
        ? `Cost "${ability.unknownCost}" is not a fixed "N Resource" cost the app can check; the ability is recorded for manual resolution with no roll, no debit and no effect.`
        : !ability.actionType
          ? `Action type "${ability.usage}" is not one the app tracks; recorded for manual resolution.`
          : 'Effects are recorded for manual resolution; only supported fixed payment and action tracking are applied.';
      const type = ability.actionType ?? 'unknown';
      const describeRecorded = (payment: string) =>
        `${actor!.name} uses ${ability.name}${ability.actionType ? ` (${ability.actionType})` : ''}${targets.length && ability.targetShape.kind !== 'self' ? ` on ${targetNames}` : ''}. ${reason}${payment}${warnings.length ? ` ${warnings.join(' ')}` : ''}`;
      const payment = cost
        ? cost.waived
          ? ` Cost ${cost.amount} ${cost.resource} waived outside combat.`
          : ` Spent ${cost.amount} ${cost.resource} (${cost.before} → ${cost.after}).`
        : '';

      return {
        kind: 'ability.recorded',
        description: describeRecorded(payment),
        data: {
          ability: abilityData,
          targets: targets.map(t => t.actor),
          manual: true,
          publicDescription: describeRecorded(
            cost?.resource === 'malice' ? ` Spent ${cost.amount} malice.` : payment,
          ),
          ...(cost ? { cost } : {}),
          reason,
          allowance: {
            inCombat: allowance.inCombat,
            onTurn: allowance.onTurn,
            turnId: allowance.turnId,
          },
          warnings,
          source,
        },
        commit: async (mctx, scope) => {
          if (cost && !cost.waived)
            await debit(mctx, scope, records, context, cost.after, cost.resource);
          await noteRecordedUse(mctx, scope, actor!, ability.keywords, targets);
          if (ability.actionType)
            await recordUse(mctx, scope, allowance, actor!, type, ability.name, tracking);
          await clear(mctx);
        },
      };
    }

    // ---- Director-controlled creature free strike (R04 4.4): no roll.
    // V02 Captain Benefits: a squad member's own strikes carry the attached captain's printed
    // strike bonus. A free strike takes it directly; a rolled Strike ability goes through the
    // coordinated action with one participant, where edges and damage are applied uniformly.
    const strikeBenefit = records.squad ? await activeStrikeBenefit(ctx, records.squad) : null;
    if (ability.kind === 'creature-free-strike') {
      const target = targets[0]!;
      const facts = damageTargetFacts(target);
      const supporting = [await supportingSource(ctx, CREATURE_FREE_STRIKE_RULE_ID)];
      const strikeValue = ability.freeStrikeValue! + (strikeBenefit?.strikeDamage ?? 0);
      const application = minionApplication(
        target,
        'facts' in facts
          ? resolveCreatureFreeStrike(
              {
                actorId: actor!.id,
                freeStrikeValue: strikeValue,
                targetId: target.actor.id,
              },
              facts.facts,
            )
          : null,
      );
      if ('missing' in facts) warnings.push(facts.missing);
      // V02: a squad member's damage is one instance on its squad pool.
      const strikePlans = application
        ? await planSquadDamage(ctx, [{ target, amount: application.staminaDelta }], false)
        : [];
      const strikeCard = squadCasualtyInteraction(strikePlans, envelope);
      const damageText = application
        ? `${application.afterImmunity} damage to ${target.actor.name}${application.absorbedByTemporaryStamina ? ` (${application.absorbedByTemporaryStamina} absorbed by temporary Stamina)` : ''}${application.slain ? '; Slain' : application.windedAfter ? '; winded' : ''}`
        : `${ability.freeStrikeValue} damage to ${target.actor.name} not applied`;
      return {
        kind: 'ability.use',
        description: `${actor!.name} makes a free strike on ${target.actor.name} (no roll; Free Strike ${ability.freeStrikeValue}${strikeBenefit?.strikeDamage ? ` + ${strikeBenefit.strikeDamage} With Captain: ${strikeBenefit.text}` : ''}): ${damageText}.${strikePlans.length ? ` ${describeSquadPlans(strikePlans)}` : ''}${warnings.length ? ` ${warnings.join(' ')}` : ''}`,
        ...(strikeCard ? { interaction: strikeCard } : {}),
        data: {
          ability: abilityData,
          freeStrike: {
            value: strikeValue,
            printed: ability.freeStrikeValue,
            ...(strikeBenefit ? { captainBonus: strikeBenefit.strikeDamage } : {}),
            target: target.actor,
          },
          damage: [
            {
              target: target.actor,
              application,
              applied: !!application,
              ...(application ? {} : { missing: facts }),
            },
          ],
          allowance: {
            inCombat: allowance.inCombat,
            onTurn: allowance.onTurn,
            turnId: allowance.turnId,
          },
          squads: squadPlanData(strikePlans),
          warnings,
          source: { ...source, supporting },
        },
        commit: async (mctx, scope) => {
          // V171: the user's watchers of their own ability use and strike.
          await observeUse(mctx, scope, actor!, ability.keywords);
          // QC1 train 13 R1: a watcher of the use (above) may have changed the target's pools.
          const applied = application
            ? await writePlannedDamage(
                mctx,
                scope,
                target,
                application,
                actor!.kind === 'character' || actor!.kind === 'foe'
                  ? {
                      dealer: { kind: actor!.kind, id: actor!.id, name: actor!.name },
                      // V173: a hero's Melee Weapon Free Strike is a melee strike; a creature's free
                      // strike doesn't say whether it was melee.
                      ...(ability.keywords.some(k => /^melee$/i.test(plainText(k))) &&
                      ability.keywords.some(k => /^strike$/i.test(plainText(k)))
                        ? { meleeStrike: true }
                        : {}),
                    }
                  : {},
              )
            : undefined;
          if (application && applied && changedPools(application, applied))
            await logReappliedDamage(mctx, scope, `${actor!.name}'s ${ability.name}`, [
              { name: target.actor.name, cause: 'damage', planned: application, applied },
            ]);
          await commitSquadPlans(mctx, scope, strikePlans);
          await recordUse(mctx, scope, allowance, actor!, 'main action', ability.name, tracking);
          await clear(mctx);
        },
      };
    }

    if (strikeBenefit && ability.keywords.some(k => /strike/i.test(plainText(k))))
      throw new ConvexError(
        `${actor!.name} is a squad minion with a captain (With Captain: ${strikeBenefit.text}); use @{squad:${records.squad!._id}} /squad act ability="${ability.name}" with ${actor!.name} as the only participant so the benefit applies.`,
      );
    // ---- V119 common grab maneuvers (feature/ability/common/grab.md, escape-grab.md).
    // condition/grabbed.md: a grabbed creature can't use the Knockback maneuver.
    if (ability.abilityId === KNOCKBACK_ID && conditionsOf(records)?.grabbed)
      throw new ConvexError(`${actor!.name} is grabbed and can't use Knockback.`);
    const grabPlan = await grabManeuverPlan(ctx, ability, records, targets, banes, warnings);
    // ---- Rolled ability (R04 sections 1, 2, 4, 6, 9).
    const compiledDefinition =
      ability.compilation?.mode === 'compiled' ? ability.compilation.definition : undefined;
    const metadata = compiledDefinition?.metadata ?? ability.metadata!;
    const actorFacts = actorRollFacts(actor!, records);
    let characteristic: Characteristic | undefined;
    if (args.characteristic !== undefined) {
      characteristic = String(args.characteristic).toUpperCase() as Characteristic;
      if (!CHARACTERISTICS.includes(characteristic))
        throw new ConvexError('"characteristic" must be M, A, R, I or P.');
      if (!metadata.permittedCharacteristics.includes(characteristic))
        throw new ConvexError(
          `${ability.name} rolls ${metadata.permittedCharacteristics.join(' or ') || 'a fixed bonus'}; ${characteristic} is not permitted.`,
        );
    }
    const damageCharacteristic =
      args['damage-characteristic'] === undefined
        ? null
        : selectedOverride(
            args['damage-characteristic'],
            'damageCharacteristic',
            damageChoices(ability),
          );
    const mode = args.mode === undefined ? undefined : (parseMode(args.mode, ability) ?? undefined);
    if (!mode && modeMatters(metadata, actorFacts))
      throw new ConvexError(
        `${ability.name} can be used in melee or at range, and its damage differs (rule/combat/distance.md): give mode=melee or mode=ranged.`,
      );
    const pool = metadata.fixedCost
      ? poolFor(records, context, metadata.fixedCost.resource)
      : undefined;
    // Affordability is decided before any dice are drawn (R04 9: no roll, no debit when blocked).
    // V159: circumstance plus automatic contributions (after any Escape Grab bane above).
    const totals = rollTotals();
    const probe = resolveAbilityRoll({
      ability: metadata,
      actor: actorFacts,
      targets: totals,
      targetFacts: [],
      dice: { d10a: 1, d10b: 1 },
      inCombat: allowance.inCombat,
      ...(pool ? { resourcePool: pool } : {}),
      ...(characteristic ? { selectedCharacteristic: characteristic } : {}),
      ...(damageCharacteristic ? { selectedDamageCharacteristic: damageCharacteristic } : {}),
      ...(mode ? { selectedMode: mode } : {}),
    });
    if (probe.kind === 'blocked') {
      const blocked: AbilityRollBlocked = probe;
      return {
        kind: 'ability.blocked',
        description: `Blocked: ${actor!.name} cannot use ${ability.name} — ${blocked.reason}. No roll, no cost, no action used; the pending selection is kept.`,
        data: { ability: abilityData, blocked, targets: targets.map(t => t.actor), source },
      };
    }
    const accepted = await rollDice(
      ctx,
      context.campaign._id,
      envelope.commandId,
      [
        { id: 'd10a', sides: 10 },
        { id: 'd10b', sides: 10 },
      ],
      context.user._id,
    );
    const [a, b] = accepted.dice;
    // Disciple of Fire (shared/resolve ignoredImmunityTypes); corrections reuse these recorded facts.
    const ignored = ignoredImmunityTypes(
      records.character ? baselineOf(records.character.derivedBaseline)?.features : undefined,
    );
    const targetFacts = targets.map(t => {
      const facts = damageTargetFacts(t);
      return {
        record: t,
        facts: 'facts' in facts ? { facts: withoutImmunityTypes(facts.facts, ignored) } : facts,
      };
    });
    // V170 (feature/talent/level-1/clarity-and-strain.md): strained before the use, or by paying
    // this use's cost (the probe's payment is the use's, decided before any dice); the table's
    // declaration covers what the engine can't observe outside combat.
    const strained =
      strainedNode && compiledDefinition
        ? strainedState({
            inCombat: allowance.inCombat,
            ...(poolFor(records, context, 'clarity')
              ? { clarity: poolFor(records, context, 'clarity')!.current }
              : {}),
            ...(probe.cost ? { cost: probe.cost } : {}),
            ...(declaredStrained ? { declared: declaredStrained } : {}),
          })
        : undefined;
    const resolutionInput: CompiledAbilityInput = {
      ...(strained ? { strained } : {}),
      actor: actorFacts,
      targets: totals,
      targetFacts: targetFacts.flatMap(t => ('facts' in t.facts ? [t.facts.facts] : [])),
      dice: { d10a: a!.value as never, d10b: b!.value as never },
      inCombat: allowance.inCombat,
      ...(pool ? { resourcePool: pool } : {}),
      ...(characteristic ? { selectedCharacteristic: characteristic } : {}),
      ...(damageCharacteristic ? { selectedDamageCharacteristic: damageCharacteristic } : {}),
      ...(mode ? { selectedMode: mode } : {}),
      ...(!compiledDefinition && ability.effects ? { effectClauses: ability.effects } : {}),
      ...(compiledDefinition
        ? {
            conditionFacts: conditionFacts(
              records,
              targets,
              compiledDefinition.tiers.some(nodes =>
                nodes.some(n => n.kind === 'condition' && n.condition === 'grabbed'),
              )
                ? (await activeGrabsBy(ctx, records)).map(h => h.id)
                : [],
            ),
            movement: {
              actor: movementFacts(records),
              targets: targets.map(t => ({ ...movementFacts(t), targetId: t.actor.id })),
            },
          }
        : {}),
    };
    const compiledOutcome = compiledDefinition
      ? resolveCompiledAbility(compiledDefinition, resolutionInput)
      : undefined;
    if (compiledOutcome && compiledOutcome.kind !== 'resolved')
      throw new ConvexError('Compiled ability could not safely resolve.');
    const response =
      compiledOutcome?.kind === 'resolved'
        ? compiledOutcome.roll
        : resolveAbilityRoll({ ...resolutionInput, ability: metadata });
    if (response.kind !== 'resolved')
      throw new ConvexError('Affordability changed during resolution.');
    const result: AbilityRollResult = response;
    warnings.push(...result.warnings);
    // V170: the user's own damage from a strained use, planned now so the log states it.
    let strainedPlan: StrainedPlan | undefined;
    if (strainedNode && strained && compiledOutcome?.kind === 'resolved') {
      const asTarget = result.damageApplications.find(
        d => d.targetId === actor!.id && targets.some(t => sameActor(t.actor, actor!)),
      );
      strainedPlan = await planStrained(ctx, {
        campaignId: context.campaign._id,
        commandId: envelope.commandId,
        issuer: context.user._id,
        actor: records,
        actorLabel: actor!.name,
        node: strainedNode,
        state: strained,
        ...(asTarget ? { asTarget } : {}),
      });
      const plan = strainedPlan;
      compiledOutcome.effects = compiledOutcome.effects.map(effect =>
        effect.kind === 'strained' ? withStrainedPlan(effect, plan) : effect,
      );
    }
    for (const t of targetFacts) if ('missing' in t.facts) warnings.push(t.facts.missing);
    const perTarget = targets.map((t, i) => {
      const outcome = result.targets[i]!;
      const applied = minionApplication(
        t,
        result.damageApplications.find(d => d.targetId === t.actor.id) ?? null,
      );
      const contributions = automatic[i]!.contributions;
      return {
        target: t.actor,
        edges: edges[i]!,
        banes: banes[i]!,
        ...(contributions.length ? { contributions } : {}),
        outcome,
        applied,
      };
    });
    // V159 (design 5a): the consumables this roll uses up, even when banes cancel them.
    const consumed = consumedBy(perTarget.map(p => ({ contributions: p.contributions ?? [] })));
    const holderOf = (id: string): EffectHolder => {
      const record = id === actor!.id ? records : targets.find(t => t.actor.id === id)!;
      return record.character
        ? { kind: 'character', id: record.character._id }
        : { kind: 'foe', id: record.foe!._id };
    };
    const automaticText = perTarget
      .filter(p => p.contributions?.length)
      .map(p => `${p.target.name}: ${p.contributions!.map(describeContribution).join('; ')}`)
      .join('. ');
    const costText = result.cost
      ? result.cost.waived
        ? ` Cost ${result.cost.amount} ${result.cost.resource} waived outside combat.`
        : ` Spent ${result.cost.amount} ${result.cost.resource} (${result.cost.before} → ${result.cost.after}).`
      : '';
    const critText = result.criticalHit
      ? ' Critical hit (natural 19+ on a main action): an additional main action is available to the acting user; it is not taken automatically.'
      : '';
    // V02: squad members' applications become one pool instance per squad (area-aware).
    const squadPlans = await planSquadDamage(
      ctx,
      perTarget
        .filter(p => p.applied)
        .map(p => ({
          target: targets.find(t => sameActor(t.actor, p.target))!,
          amount: p.applied!.staminaDelta,
        })),
      ability.targetShape.kind === 'area',
    );
    const squadText = squadPlans.length ? ` ${describeSquadPlans(squadPlans)}` : '';
    const squadCard = squadCasualtyInteraction(squadPlans, envelope);
    const grabTier = perTarget[0]?.outcome.tier ?? 1;
    const grabText = grabPlan ? grabPlan.note(grabTier) : '';
    // V173: a melee strike (rule/combat/strike.md, rule/combat/melee.md) for Riposte's trigger:
    // the Strike and Melee keywords, and the melee mode when the ability is also Ranged. Saved on the
    // use, so a correction's changed damage is matched against the same fact.
    const printedKeywords = ability.keywords.map(k => plainText(k).toLowerCase());
    const meleeStrike =
      printedKeywords.includes('strike') &&
      printedKeywords.includes('melee') &&
      (!printedKeywords.includes('ranged') || mode === 'melee');
    const describeUse = (payment: string) =>
      `${actor!.name} uses ${ability.name} on ${targetNames}: ${describeRoll(result)}.${payment}${automaticText ? ` Automatic effects (${automaticText}).` : ''} ${perTarget.map(p => describeTarget(p.outcome, p.target.name, p.applied ?? undefined)).join(' ')}${grabText}${squadText}${critText}${strainedPlan?.text ?? ''}${result.manualResolutions?.length ? ` Recorded for manual resolution: ${result.manualResolutions.map(m => `"${m.sourceClause}"`).join(', ')}.` : ''}${warnings.length ? ` ${warnings.join(' ')}` : ''}`;
    return {
      kind: 'ability.use',
      description: describeUse(costText),
      dice: accepted.dice,
      data: {
        ability: abilityData,
        result,
        publicDescription: describeUse(
          result.cost?.resource === 'malice' ? ` Spent ${result.cost.amount} malice.` : costText,
        ),
        rollId: accepted.rollId,
        targets: perTarget.map(p => ({
          target: p.target,
          edges: p.edges,
          banes: p.banes,
          ...(p.contributions ? { contributions: p.contributions } : {}),
        })),
        ...(consumed.length ? { consumed: consumed.map(c => c.instanceId) } : {}),
        ...(strainedPlan
          ? {
              strained: {
                ...strainedPlan.state,
                ...(strainedPlan.incur
                  ? {
                      incurDie: strainedPlan.incur.die,
                      ...(strainedPlan.incur.heldBy
                        ? { incurHeldBy: strainedPlan.incur.heldBy }
                        : {}),
                    }
                  : {}),
                ...(strainedPlan.self ? { selfApplication: strainedPlan.self } : {}),
              },
            }
          : {}),
        damage: perTarget.map(p => ({
          target: p.target,
          application: p.applied,
          applied: !!p.applied,
        })),
        allowance: {
          inCombat: allowance.inCombat,
          onTurn: allowance.onTurn,
          turnId: allowance.turnId,
          usedOpportunity: tracking.opportunity?._id ?? null,
        },
        squads: squadPlanData(squadPlans),
        meleeStrike,
        warnings,
        source,
      },
      ...(squadCard ? { interaction: squadCard } : {}),
      commit: async (mctx, scope) => {
        // 1. Debit the fixed cost once, before any effect.
        if (result.cost && !result.cost.waived)
          await debit(mctx, scope, records, context, result.cost.after, result.cost.resource);
        // QC1 train 13 R2 follow-up: modifiers left out of this roll because their owner is dying.
        await endLapsedEffects(mctx, scope, lapsed);
        // V158: "until you use this ability again" ends the owner's earlier effects of it.
        if (compiledOutcome?.kind === 'resolved')
          await endReusedEffects(mctx, scope, actor!, ability.abilityId);
        // V159: the consumables this roll qualified for are used up by it (design 5a).
        await consumeRollEffects(
          mctx,
          scope,
          consumed.map(c => ({ holder: holderOf(c.subjectId), instanceId: c.instanceId })),
          `${actor!.name}'s ${ability.name} roll`,
        );
        // V171: the user's watchers of their own ability use.
        await observeUse(mctx, scope, actor!, ability.keywords);
        // 2. Damage to every target in target order (R04 4.5); squad pools once per squad.
        // V171: the user deals it, for `damage-dealt` watchers.
        const actorEffects = records.character
          ? {
              effectInstances: records.character.liveState?.effectInstances ?? [],
              ownedEffects: records.character.liveState?.ownedEffects ?? [],
            }
          : records.foe
            ? {
                effectInstances: records.foe.live.effectInstances ?? [],
                ownedEffects: records.foe.live.ownedEffects ?? [],
              }
            : undefined;
        const dealer =
          actor!.kind === 'character' || actor!.kind === 'foe'
            ? {
                dealer: { kind: actor!.kind, id: actor!.id, name: actor!.name },
                ...(actorEffects ? { dealerEffects: actorEffects } : {}),
                meleeStrike,
              }
            : {};
        // QC1 train 13 R1: each target's planned damage is taken from its pools as they are when
        // it is written, so a watcher an earlier write set off keeps its damage.
        const appliedTo = new Map<string, DamageApplication>();
        for (const p of perTarget) {
          const record = targets.find(t => sameActor(t.actor, p.target))!;
          if (p.applied)
            appliedTo.set(
              p.target.id,
              await writePlannedDamage(mctx, scope, record, p.applied, dealer),
            );
        }
        await commitSquadPlans(mctx, scope, squadPlans);
        if (grabPlan)
          await grabPlan.commit(mctx, scope, grabTier, {
            abilityName: ability.name,
            actorLabel: actor!.name,
            sourcePath: ability.source.path,
          });
        // Post-damage conditions share the same journal and command as their original use.
        if (compiledOutcome?.kind === 'resolved')
          await commitConditions(
            mctx,
            scope,
            effectOccurrences(scope.eventId, scope.eventId, compiledOutcome.effects),
            targets,
            {
              eventId: scope.eventId,
              abilityName: ability.name,
              actorLabel: actor!.name,
              sourcePath: ability.source.path,
              actorId: actor!.id,
            },
            allowance.encounterId,
          );
        // V159: applied modifiers become modifier effect instances on their subjects.
        const manualIds =
          compiledOutcome?.kind === 'resolved'
            ? await commitModifiers(
                mctx,
                scope,
                effectOccurrences(scope.eventId, scope.eventId, compiledOutcome.effects),
                targets,
                {
                  eventId: scope.eventId,
                  abilityId: ability.abilityId,
                  abilityName: ability.name,
                  actor: actor!,
                  sourcePath: ability.source.path,
                },
                allowance.encounterId,
              )
            : new Set<string>();
        // V171: applied watchers become watcher effect instances on their subjects.
        const watcherIds =
          compiledOutcome?.kind === 'resolved'
            ? await commitWatchers(
                mctx,
                scope,
                effectOccurrences(scope.eventId, scope.eventId, compiledOutcome.effects),
                targets,
                {
                  eventId: scope.eventId,
                  abilityId: ability.abilityId,
                  abilityName: ability.name,
                  actor: actor!,
                  sourcePath: ability.source.path,
                },
                allowance.encounterId,
              )
            : new Set<string>();
        // V158: lasting instructions become tracked effect instances after the conditions.
        if (compiledOutcome?.kind === 'resolved')
          await commitLasting(
            mctx,
            scope,
            effectOccurrences(scope.eventId, scope.eventId, compiledOutcome.effects),
            targets,
            {
              eventId: scope.eventId,
              abilityId: ability.abilityId,
              abilityName: ability.name,
              actor: actor!,
              sourcePath: ability.source.path,
            },
            allowance.encounterId,
          );
        // V170: the user's own damage from a strained use, after the use's other effects.
        const strainedApplied = strainedPlan
          ? await commitStrained(mctx, scope, records, strainedPlan)
          : undefined;
        // QC1 train 13 R1: when an earlier write changed a pool this use planned to damage, the
        // use's entry states the planned values; a linked entry states what was applied, and the
        // saved result below keeps the applied values.
        const reapplied = [
          ...perTarget.flatMap(p => {
            const applied = appliedTo.get(p.target.id);
            return p.applied && applied && changedPools(p.applied, applied)
              ? [{ name: p.target.name, cause: 'damage', planned: p.applied, applied }]
              : [];
          }),
          ...(strainedPlan?.incur?.application &&
          strainedApplied?.incur &&
          changedPools(strainedPlan.incur.application, strainedApplied.incur)
            ? [
                {
                  name: actor!.name,
                  cause: 'damage to incur the strain',
                  planned: strainedPlan.incur.application,
                  applied: strainedApplied.incur,
                },
              ]
            : []),
          ...(strainedPlan?.self &&
          strainedApplied?.self &&
          changedPools(strainedPlan.self, strainedApplied.self)
            ? [
                {
                  name: actor!.name,
                  cause: "Strained damage that can't be reduced",
                  planned: strainedPlan.self,
                  applied: strainedApplied.self,
                },
              ]
            : []),
        ];
        await logReappliedDamage(mctx, scope, `${actor!.name}'s ${ability.name}`, reapplied);
        const appliedEffects = (effects: CompiledEffectOutcome[]): CompiledEffectOutcome[] =>
          effects.map(effect =>
            effect.kind === 'damage' && effect.application && appliedTo.has(effect.targetId)
              ? { ...effect, application: appliedTo.get(effect.targetId)! }
              : effect.kind === 'strained' && effect.selfApplication && strainedApplied?.self
                ? { ...effect, selfApplication: strainedApplied.self }
                : effect,
          );
        // 3. The effective record for corrections and dispositions.
        await journalInsert(mctx, scope, 'abilityResults', {
          campaignId: scope.campaignId,
          eventId: scope.eventId,
          encounterId: allowance.encounterId,
          actor: actor!,
          abilityId: ability.abilityId,
          ...(execution ? { execution } : {}),
          ...(compiledOutcome?.kind === 'resolved'
            ? {
                compiled: {
                  version: 1,
                  definition: compiledOutcome.definition,
                  inputs: resolutionInput,
                  revision: scope.eventId,
                  effects: markManual(
                    effectOccurrences(
                      scope.eventId,
                      scope.eventId,
                      appliedEffects(compiledOutcome.effects),
                    ),
                    new Set([...manualIds, ...watcherIds]),
                  ),
                } satisfies CompiledResult,
              }
            : {}),
          resolutionInputs: {
            ability: metadata,
            actor: actorFacts,
            targetFacts: targetFacts.flatMap(t => ('facts' in t.facts ? [t.facts.facts] : [])),
          },
          abilityName: ability.name,
          dice: { d10a: result.dice.d10a, d10b: result.dice.d10b },
          characteristicValue: result.characteristicValue,
          selectedCharacteristic: result.selectedCharacteristic ?? null,
          targets: perTarget.map(p => ({
            target: p.target,
            edges: p.edges,
            banes: p.banes,
            ...(p.contributions ? { contributions: p.contributions } : {}),
            outcome: p.outcome,
            applied: (p.applied && appliedTo.get(p.target.id)) ?? p.applied,
            dispositions: [],
          })),
          manualDispositions: [],
          correctionEventIds: [],
        });
        // 4. Action tracking and the critical-hit opportunity (offered, never executed).
        await recordUse(
          mctx,
          scope,
          allowance,
          actor!,
          metadata.actionType,
          ability.name,
          tracking,
        );
        if (result.criticalHit && allowance.inCombat && allowance.encounterId)
          await journalInsert(mctx, scope, 'actionOpportunities', {
            campaignId: scope.campaignId,
            encounterId: allowance.encounterId,
            actor: actor!,
            kind: 'additional-main-action',
            sourceEventId: scope.eventId,
            status: 'offered',
            usedEventId: null,
          });
        await clear(mctx);
      },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// /ability correct — post-roll edge/bane correction (R04 section 3).

async function resultByEvent(ctx: ReadCtx, context: TableContext, key: string) {
  const eventId = ctx.db.normalizeId('events', key);
  const event = eventId ? await ctx.db.get(eventId) : null;
  if (!event || event.campaignId !== context.campaign._id)
    throw new ConvexError('That event is not in this campaign.');
  const result = await ctx.db
    .query('abilityResults')
    .withIndex('by_event', q => q.eq('eventId', event._id))
    .unique();
  if (!result) throw new ConvexError('That event is not a resolved ability use.');
  return { event, result };
}

const abilityCorrect: OperationDefinition = {
  id: 'ability.correct',
  family: 'ability',
  verb: 'correct',
  title: 'Add or remove edges and banes after the roll',
  description:
    'Set the corrected circumstance edge and bane counts, or the excluded automatic effects, for one target of a resolved ability use. The accepted dice are kept, the saved automatic contributions are reused (never re-read), that target’s tier and damage are recomputed, the applied damage is reconciled without dealing it twice, and a linked correction entry is appended; the original entry is unchanged.',
  args: {
    event: v.string(),
    target: referenceValidator,
    edges: v.optional(v.number()),
    banes: v.optional(v.number()),
    exclude: v.optional(v.union(v.string(), v.array(v.string()))),
  },
  argDescriptions: {
    event: 'The id of the ability use event being corrected.',
    target: 'Which target of that use.',
    edges:
      'The corrected number of circumstance edges against this target (automatic edges are separate); default unchanged.',
    banes:
      'The corrected number of circumstance banes against this target (automatic banes are separate); default unchanged.',
    exclude:
      'The corrected set of excluded automatic effects for this target, as effect instance ids; default unchanged. Give [] to exclude none.',
  },
  roles: PLAYERS,
  session: 'running',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const { event, result } = await resultByEvent(ctx, context, String(args.event));
    // V174: a hit an accepted response revised is recomputed from that revision; rewind instead.
    await assertNotRevised(ctx, context.campaign._id, event._id);
    // V157: an ability without a power roll has no dice, edges or banes to correct.
    const dice = result.dice;
    const characteristicValue = result.characteristicValue;
    if (result.effectOnly || !dice || characteristicValue === undefined)
      throw new ConvexError(
        `${result.abilityName} has no power roll: there is no roll to correct. Rewind the use instead.`,
      );
    // V119: a Grab or Escape Grab correction cannot re-decide its tier-3 grab write safely.
    if (result.abilityId === GRAB_ID || result.abilityId === ESCAPE_GRAB_ID)
      throw new ConvexError(
        `${result.abilityName} changes who is grabbed at tier 3; rewind the use instead of correcting it.`,
      );
    // A06 window check: latest unit on the branch; acting player within their undo window; Director
    // always subject to the sequential-rewind rule for older events.
    // Archived encounters may have removed their foes. Preserve the history refusal before
    // inspecting live condition state, while retaining the specific rolled-save reason in combat.
    if (event.encounterId && (await ctx.db.get(event.encounterId))?.archivedAt != null)
      await assertCorrectionAllowed(ctx, event._id, context.user);
    const conditionTargetIds = new Set(
      (result.compiled as CompiledResult | undefined)?.effects
        .filter(occurrence => occurrence.effect.kind === 'condition')
        .map(occurrence => occurrence.effect.targetId) ?? [],
    );
    if (conditionTargetIds.size) {
      for (const target of result.targets) {
        if (target.target.kind === 'squad' || !conditionTargetIds.has(target.target.id)) continue;
        const id = await resolveHistoricalId(ctx, context.campaign._id, target.target.id);
        if (await hasRolledConditionSave(ctx, { kind: target.target.kind, id }, event._id))
          throw new ConvexError(
            'A saving throw has already been rolled for this ability condition; rewind the save before correcting the ability. Recorded saves are never replayed.',
          );
        // condition/taunted.md: this use's taunt replaced another source's taunt. A correction
        // cannot restore that taunt's schedule, so the table rewinds the use instead.
        if (
          await replacedByUse(
            ctx,
            { kind: target.target.kind, id },
            new Set(
              (result.compiled as CompiledResult).effects
                .filter(
                  o => o.effect.kind === 'condition' && o.effect.targetId === target.target.id,
                )
                .map(o => o.id),
            ),
          )
        )
          throw new ConvexError(
            "This use's taunt replaced another creature's taunt; rewind the use instead of correcting it.",
          );
      }
    }
    await assertCorrectionAllowed(ctx, event._id, context.user);
    if (result.actor.kind === 'squad')
      throw new ConvexError(
        'Corrections of a squad action are not supported in V02: rewind the use, or adjust the squad pool with /adjust stamina on the squad.',
      );
    const targetRecord = await bindTarget(ctx, context, args.target as Reference, result.actor);
    if (targetRecord.squad)
      throw new ConvexError(
        `${targetRecord.actor.name} is a squad minion: corrections that change squad pool damage are not supported in V02; rewind the use, or adjust the squad pool with /adjust stamina on the squad.`,
      );
    const effectiveTargets = await Promise.all(
      result.targets.map(async t => ({
        ...t.target,
        id: await resolveHistoricalId(ctx, context.campaign._id, t.target.id),
      })),
    );
    const index = effectiveTargets.findIndex(t => sameActor(t, targetRecord.actor));
    if (index < 0)
      throw new ConvexError(`${targetRecord.actor.name} was not a target of that use.`);
    const entry = result.targets[index]!;
    const edges = args.edges === undefined ? entry.edges : integer(args.edges, 'edges', 0);
    const banes = args.banes === undefined ? entry.banes : integer(args.banes, 'banes', 0);
    // V159: the saved automatic contributions, with the table's corrected exclusions. They are
    // never re-read from current effects (docs/lasting-effects-design.md#2-modifier-pipeline).
    const savedContributions = (entry.contributions ?? []) as RollContribution[];
    const exclusionNotes: string[] = [];
    let contributions = savedContributions;
    if (args.exclude !== undefined) {
      const wanted = new Set(excludeList(args.exclude));
      const known = contributionIds(savedContributions);
      const unknown = [...wanted].filter(id => !known.has(id));
      if (unknown.length)
        throw new ConvexError(
          `Not an automatic contribution to that roll against ${targetRecord.actor.name}: ${unknown.join(', ')}.`,
        );
      contributions = savedContributions.map(c => {
        const excluded = [c.instanceId, ...c.sources].some(id => wanted.has(id));
        const { excluded: _was, ...rest } = c;
        void _was;
        return excluded ? { ...rest, excluded: true as const } : rest;
      });
      for (const [i, after] of contributions.entries()) {
        const before = savedContributions[i]!;
        if (!!before.excluded === !!after.excluded) continue;
        // Only a consumable excluded when the roll was made was never used up by it; one this roll
        // used up (a later correction excluded it) is included again without a new consumption.
        if (before.excluded && before.consumes.length && !before.usedUp)
          throw new ConvexError(
            `${describeContribution({ ...before, excluded: undefined } as RollContribution)} was excluded when the roll was made, so the roll did not use it up; a correction never consumes it later. Rewind the use to apply it.`,
          );
        // "Stacking Unique Effects": the same ability doesn't stack on one roll.
        if (
          before.excluded &&
          contributions.some(
            (other, j) =>
              j !== i &&
              !other.excluded &&
              other.abilityId === after.abilityId &&
              other.side === after.side,
          )
        )
          throw new ConvexError(
            `${after.abilityName} already applies to that roll; the same ability doesn't stack.`,
          );
        // Design 5a: a correction that removes a roll's eligibility reports the consumable as
        // "would not have been consumed"; it never restores or re-consumes it silently.
        if (before.excluded && before.usedUp)
          exclusionNotes.push(
            `${after.abilityName} applies again as this roll first used it; it was used up once and is not used up again.`,
          );
        if (!before.excluded && before.consumes.length)
          exclusionNotes.push(
            `${after.abilityName} would not have been used up by this roll; it stays used up (end or re-apply it at the table if the table agrees).`,
          );
      }
    }
    const sameExclusions = contributions.every(
      (c, i) => !!c.excluded === !!savedContributions[i]!.excluded,
    );
    if (entry.edges === edges && entry.banes === banes && sameExclusions)
      throw new ConvexError(
        `${targetRecord.actor.name} already has ${edges} edges and ${banes} banes on that use${savedContributions.length ? ', with those exclusions' : ''}.`,
      );
    const corrected = withContributions({ targetId: entry.target.id, edges, banes }, contributions);
    const totalsOf = (t: (typeof result.targets)[number]) =>
      withContributions(
        { targetId: t.target.id, edges: t.edges, banes: t.banes },
        (t.contributions ?? []) as RollContribution[],
      );
    const inputs = result.resolutionInputs as
      | {
          ability: import('../../shared/contracts/rollResolution').AbilityRollMetadata;
          actor: import('../../shared/contracts/rollResolution').ActorRollFacts;
          targetFacts: import('../../shared/contracts/rollResolution').DamageTargetFacts[];
        }
      | undefined;
    if (!inputs)
      throw new ConvexError(
        'This older ability use has no recorded resolution inputs; use a new current-state adjustment rather than recomputing it from changed facts.',
      );
    const savedStrained = result.compiled as
      (CompiledResult & { inputs: CompiledAbilityInput }) | undefined;
    const currentFacts = damageTargetFacts(targetRecord);
    const originalFacts = inputs.targetFacts.find(f => f.targetId === entry.target.id);
    const facts: { facts: DamageTargetFacts } | { missing: string } =
      'facts' in currentFacts && originalFacts
        ? {
            facts: {
              ...originalFacts,
              stamina: currentFacts.facts.stamina,
              temporaryStamina: currentFacts.facts.temporaryStamina,
            },
          }
        : { missing: 'The original use had no supported target facts; damage remains manual.' };
    const applied = (entry.applied as DamageApplication | null) ?? undefined;
    const originalResult = (event.payload as { data?: { result?: AbilityRollResult } })?.data
      ?.result;
    const correction = correctTarget(
      inputs.ability,
      inputs.actor,
      {
        dice: { d10a: dice.d10a as never, d10b: dice.d10b as never },
        characteristicValue,
        ...(originalResult?.selectedDamageCharacteristic
          ? { selectedDamageCharacteristic: originalResult.selectedDamageCharacteristic }
          : {}),
        ...(originalResult?.selectedMode ? { selectedMode: originalResult.selectedMode } : {}),
        ...(result.selectedCharacteristic
          ? { selectedCharacteristic: result.selectedCharacteristic }
          : {}),
      },
      event._id,
      entry.outcome as TargetRollOutcome,
      applied,
      'facts' in facts ? facts.facts : undefined,
      corrected.edges,
      corrected.banes,
      corrected.bonuses,
      // V170: a strained use's extra damage, from the saved decision (never re-decided).
      savedStrained
        ? strainedExtraDamage(
            savedStrained.definition.sections.find(node => node.kind === 'strained')?.spec,
            savedStrained.inputs.strained,
          )
        : undefined,
    );
    if (
      targetRecord.character &&
      (correction.staminaReconciliationDelta !== 0 ||
        correction.temporaryStaminaReconciliationDelta !== 0)
    )
      await assertCorrectionReconcilable(ctx, event, targetRecord.character._id);
    // V171 (docs/lasting-effects-design.md#7-history-and-corrections): a watcher this use set off
    // can't be re-derived by a correction; the table rewinds instead.
    const correctionDealer =
      result.actor.kind === 'character' || result.actor.kind === 'foe'
        ? {
            kind: result.actor.kind,
            id: await resolveHistoricalId(ctx, context.campaign._id, result.actor.id),
          }
        : undefined;
    if (
      correction.staminaReconciliationDelta !== 0 ||
      correction.temporaryStaminaReconciliationDelta !== 0
    )
      await assertWatchersReconcilable(ctx, context.campaign._id, event);
    // V173 (QC1 train 13 advisory): the changed damage is matched against the melee-strike fact the
    // use saved, so a melee-strike trigger (Riposte) refuses the correction as the use's hit would
    // have offered it. A use saved without the fact is treated as a melee strike: the correction is
    // refused whenever such a trigger could match, rather than missing it.
    const savedMeleeStrike = (event.payload as { data?: { meleeStrike?: unknown } })?.data
      ?.meleeStrike;
    const correctionMeleeStrike = typeof savedMeleeStrike === 'boolean' ? savedMeleeStrike : true;
    // Only a rolled use reaches here (effect-only uses are refused above).
    const savedCompiled = result.compiled as
      (CompiledResult & { inputs: CompiledAbilityInput }) | undefined;
    // V110: other targets keep their current (possibly already corrected) edges and banes.
    const correctedInputs = savedCompiled && {
      ...savedCompiled.inputs,
      targets: savedCompiled.inputs.targets.map(t => {
        if (t.targetId === entry.target.id) return corrected;
        const current = result.targets.find(r => r.target.id === t.targetId);
        return current ? totalsOf(current) : t;
      }),
    };
    let correctedCompiled: ReturnType<typeof resolveCompiledAbility> | undefined;
    try {
      correctedCompiled =
        savedCompiled && correctedInputs
          ? resolveCompiledAbility(savedCompiled.definition, correctedInputs)
          : undefined;
    } catch {
      // A result saved before V115 has no melee/ranged mode for a mode-dependent ability.
      throw new ConvexError(
        'This use was recorded without a melee or ranged mode; rewind it and use the ability again with a mode.',
      );
    }
    if (correctedCompiled && correctedCompiled.kind !== 'resolved')
      throw new ConvexError('The saved compiled result cannot be corrected safely.');
    if (correctedCompiled?.kind === 'resolved') {
      const outcome = correctedCompiled.roll.targets.find(t => t.targetId === entry.target.id);
      if (outcome) correction.after = outcome;
    }
    // V110: only the corrected target's occurrences and once-per-use sections get the correction
    // revision. Other targets keep their recorded occurrence identities, dispositions and instances.
    const correctedOccurrences = (revision: string) =>
      savedCompiled && correctedCompiled?.kind === 'resolved'
        ? correctedCompiled.effects.flatMap(effect => {
            // V154: tier instructions belong to their target, like its other tier effects.
            // V158: a lasting instruction is once per use and independent of the roll; it keeps its
            // occurrence, which is its effect instance's identity.
            // V159: a modifier section is once per use too; it keeps its occurrence and instance.
            if (
              ((effect.kind !== 'rider' || effect.tier) && effect.targetId !== entry.target.id) ||
              (effect.kind === 'rider' && effect.lasting) ||
              effect.kind === 'modifier' ||
              // V171: a watcher section is once per use too; it keeps its occurrence and instance.
              effect.kind === 'watcher' ||
              // V170: the Strained outcome is once per use and records the user's damage as applied.
              effect.kind === 'strained'
            ) {
              const kept = savedCompiled.effects.find(
                o => o.effect.nodeId === effect.nodeId && o.effect.targetId === effect.targetId,
              );
              if (kept) return [kept];
            }
            let current = effect;
            if (effect.kind === 'damage' && effect.targetId === entry.target.id) {
              const { application, ...rest } = effect;
              void application;
              current = {
                ...rest,
                ...(correction.damageAfter ? { application: correction.damageAfter } : {}),
              };
            }
            return effectOccurrences(event._id, revision, [current]);
          })
        : [];
    const name = targetRecord.actor.name;
    const stamina =
      'facts' in facts && correction.damageAfter
        ? `; ${name} Stamina ${facts.facts.stamina} → ${correction.damageAfter.staminaAfter}${correction.temporaryStaminaReconciliationDelta ? ` (temporary ${facts.facts.temporaryStamina} → ${correction.damageAfter.temporaryStaminaAfter})` : ''}${correction.damageAfter.slain ? '; Slain' : correction.damageAfter.windedAfter ? '; winded' : ''}`
        : 'facts' in facts && applied
          ? `; ${name} Stamina ${facts.facts.stamina} → ${facts.facts.stamina + correction.staminaReconciliationDelta}`
          : '';
    // V156 (labelled interpretation): a correction never re-charges or refunds a cost. When the
    // edge-reduced cost (feature/shadow/level-1/insight.md) would now differ, the table is told.
    // Alternatives considered: refunding or charging the difference automatically.
    // What was actually paid is the recorded payment, not a recomputation from saved edges, which
    // earlier corrections overwrite. Nothing to say when the cost was waived outside combat.
    const paid = originalResult?.cost;
    const dueAfter = effectiveFixedCost(
      inputs.ability.fixedCost,
      inputs.actor,
      result.targets.map((t, i) => (i === index ? corrected : totalsOf(t))),
    )?.amount;
    const paidBefore = paid && !paid.waived ? paid.amount : undefined;
    const costNote =
      paidBefore !== undefined && dueAfter !== undefined && paidBefore !== dueAfter
        ? ` The ${paid!.resource} cost would now be ${dueAfter} instead of the ${paidBefore} paid; the payment is unchanged (adjust it with /adjust heroic-resource if the table agrees).`
        : '';
    const excludedNames = (list: readonly RollContribution[]) =>
      list.filter(c => c.excluded).map(c => `${c.actorLabel}'s ${c.abilityName}`);
    const exclusionText = sameExclusions
      ? ''
      : `, excluded automatic effects ${excludedNames(savedContributions).join(', ') || 'none'} → ${excludedNames(contributions).join(', ') || 'none'}`;
    const notes = exclusionNotes.length ? ` ${exclusionNotes.join(' ')}` : '';
    const publicDescription = `Correction by ${context.user.displayName}: ${result.actor.name}'s ${result.abilityName} against ${name}, edges ${entry.edges} → ${edges}, banes ${entry.banes} → ${banes}${exclusionText} (same dice ${dice.d10a} + ${dice.d10b}): tier ${correction.before.tier} → ${correction.after.tier}, damage ${correction.before.damage?.rolledDamage ?? 'none'} → ${correction.after.damage?.rolledDamage ?? 'none'}, reconciliation ${correction.staminaReconciliationDelta >= 0 ? '+' : ''}${correction.staminaReconciliationDelta} Stamina.${costNote}${notes}`;
    return {
      kind: 'correction.ability',
      description: `Correction by ${context.user.displayName}: ${result.actor.name}'s ${result.abilityName} against ${name}, edges ${entry.edges} → ${edges}, banes ${entry.banes} → ${banes}${exclusionText} (same dice ${dice.d10a} + ${dice.d10b}): tier ${correction.before.tier} → ${correction.after.tier}, damage ${correction.before.damage?.rolledDamage ?? 'none'} → ${correction.after.damage?.rolledDamage ?? 'none'}, reconciliation ${correction.staminaReconciliationDelta >= 0 ? '+' : ''}${correction.staminaReconciliationDelta} Stamina${stamina}.${costNote}${notes}`,
      causeEventId: event._id,
      data: {
        originalEventId: event._id,
        publicDescription,
        actor: result.actor,
        target: targetRecord.actor,
        correction,
        ...(sameExclusions ? {} : { contributions }),
        byRole: context.role,
      },
      commit: async (mctx, scope) => {
        const current = (await mctx.db.get(result._id))!;
        const targets = current.targets.map((t, i) =>
          i === index
            ? {
                ...t,
                edges,
                banes,
                ...(contributions.length ? { contributions } : {}),
                outcome: correction.after,
                applied: correction.damageAfter ?? null,
              }
            : t,
        );
        await journalPatch(mctx, scope, 'abilityResults', result._id, {
          targets,
          ...(savedCompiled && correctedCompiled?.kind === 'resolved'
            ? {
                compiled: {
                  ...savedCompiled,
                  inputs: correctedInputs!,
                  revision: scope.eventId,
                  effects: correctedOccurrences(scope.eventId),
                } satisfies CompiledResult,
              }
            : {}),
          correctionEventIds: [...current.correctionEventIds, scope.eventId],
        });
        // V142: resource gains the original damage triggered and the corrected damage no longer
        // satisfies are reversed; newly satisfied ones follow from the damage write below.
        if (targetRecord.character && applied)
          await reconcileObservedGains(
            mctx,
            scope,
            targetRecord.character._id,
            event._id,
            { stamina: applied.staminaBefore, temporaryStamina: applied.temporaryStaminaBefore },
            correction.damageAfter
              ? {
                  stamina: correction.damageAfter.staminaAfter,
                  temporaryStamina: correction.damageAfter.temporaryStaminaAfter,
                }
              : {
                  stamina: applied.staminaBefore,
                  temporaryStamina: applied.temporaryStaminaBefore,
                },
          );
        if ('facts' in facts && (applied || correction.damageAfter))
          await writeDamage(
            mctx,
            scope,
            targetRecord,
            {
              staminaAfter: facts.facts.stamina + correction.staminaReconciliationDelta,
              temporaryStaminaAfter:
                facts.facts.temporaryStamina + correction.temporaryStaminaReconciliationDelta,
            },
            event._id,
            correctionDealer
              ? { dealer: correctionDealer, meleeStrike: correctionMeleeStrike }
              : {},
          );
        if (savedCompiled && correctedCompiled?.kind === 'resolved') {
          for (const occurrence of savedCompiled.effects) {
            if (
              occurrence.effect.kind !== 'condition' ||
              occurrence.effect.targetId !== entry.target.id
            )
              continue;
            await endConditionInstance(
              mctx,
              scope,
              targetRecord.actor as { kind: 'character' | 'foe'; id: string },
              occurrence.id,
              'ability correction',
            );
          }
          await commitConditions(
            mctx,
            scope,
            effectOccurrences(
              event._id,
              scope.eventId,
              correctedCompiled.effects.filter(effect => effect.targetId === entry.target.id),
            ),
            [targetRecord],
            {
              eventId: event._id,
              abilityName: result.abilityName,
              actorLabel: result.actor.name,
              sourcePath: savedCompiled.definition.source.path,
              actorId: result.actor.id,
            },
            result.encounterId,
            entry.target.id,
          );
        }
      },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// /ability resolved — Director's Resolved at table for one unresolved clause.

const abilityResolved: OperationDefinition = {
  id: 'ability.resolved',
  family: 'ability',
  verb: 'resolved',
  title: 'Resolved at table',
  description:
    'Director: record that one unresolved clause of a resolved ability use was handled manually at the table. Records the disposition and attribution without applying the clause, rerolling or changing any state; a clause can be marked once.',
  args: {
    event: v.string(),
    clause: v.optional(v.string()),
    occurrence: v.optional(v.string()),
    target: v.optional(referenceValidator),
    note: v.optional(v.string()),
  },
  argDescriptions: {
    event: 'The id of the ability use event.',
    clause: 'Legacy unresolved clause, or an unambiguous current compiled clause.',
    occurrence: 'Exact current compiled effect occurrence id from the result query.',
    target: 'The target whose clause it is; omit for an ability-level Effect clause.',
    note: 'How it was resolved (free text, up to 500 characters).',
  },
  roles: ['director'],
  session: 'running',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const { event, result } = await resultByEvent(ctx, context, String(args.event));
    const clause = args.clause === undefined ? '' : String(args.clause).trim();
    const note = args.note === undefined ? '' : String(args.note).trim();
    if (note.length > 500) throw new ConvexError('"note" is limited to 500 characters.');
    const compiled = result.compiled as CompiledResult | undefined;
    if (compiled) {
      const requestedTarget =
        args.target === undefined
          ? null
          : (await bindTarget(ctx, context, args.target as Reference, result.actor)).actor;
      let originalTargetId: string | undefined;
      if (requestedTarget) {
        for (const t of result.targets) {
          const effectiveId = await resolveHistoricalId(ctx, context.campaign._id, t.target.id);
          if (t.target.kind === requestedTarget.kind && effectiveId === requestedTarget.id)
            originalTargetId = t.target.id;
        }
        if (!originalTargetId) throw new ConvexError('That target was not part of this use.');
      }
      const candidates = compiled.effects.filter(
        o =>
          o.effect.kind !== 'damage' &&
          (args.occurrence !== undefined
            ? o.id === args.occurrence
            : !!clause && plainText(o.effect.clause) === plainText(clause)) &&
          (!originalTargetId || o.effect.targetId === originalTargetId),
      );
      if (candidates.length !== 1)
        throw new ConvexError(
          'Give one current effect occurrence; stale or ambiguous effects cannot be marked.',
        );
      const occurrence = candidates[0]!;
      if (
        occurrence.effect.kind === 'condition' &&
        occurrence.effect.status !== 'fact-needed' &&
        occurrence.effect.status !== 'manual'
      )
        throw new ConvexError(
          'An applied, resisted or immune condition occurrence cannot be resolved manually.',
        );
      // V157: an applied gain already changed the recipient's live state.
      if (occurrence.effect.kind === 'gain' && occurrence.effect.status === 'applied')
        throw new ConvexError('An applied gain cannot be resolved manually.');
      // V159: an applied modifier is a tracked effect; exclude it on a roll or end it instead.
      if (occurrence.effect.kind === 'modifier' && occurrence.effect.status === 'applied')
        throw new ConvexError(
          'An applied modifier is tracked by the engine; exclude it on a roll or end it with /effect end.',
        );
      // V171: an applied watcher is tracked by the engine, which fires it.
      if (occurrence.effect.kind === 'watcher' && occurrence.effect.status === 'applied')
        throw new ConvexError(
          'An applied watcher is tracked by the engine, which fires it; end it with /effect end.',
        );
      // V170: an applied Strained section already dealt its damage; an inapplicable one did nothing.
      // V173: damage sized by the triggering damage was applied by the engine.
      if (occurrence.effect.kind === 'triggered-damage' && occurrence.effect.status !== 'manual')
        throw new ConvexError(
          'This triggered damage was applied by the engine; rewind the use instead.',
        );
      if (occurrence.effect.kind === 'strained' && occurrence.effect.status !== 'manual')
        throw new ConvexError(
          occurrence.effect.status === 'applied'
            ? 'This Strained effect was applied by the engine; correct or rewind the use instead.'
            : 'This use was not strained, so its Strained effect does not apply; rewind the use to declare strained=yes.',
        );
      if (clause && plainText(clause) !== plainText(occurrence.effect.clause))
        throw new ConvexError('The clause does not match that occurrence.');
      // Candidates come from the current effects; V110 corrections keep other targets' revisions.
      if (occurrence.useEventId !== event._id) throw new ConvexError('That occurrence is stale.');
      if (occurrence.disposition)
        throw new ConvexError('That occurrence is already resolved at table.');
      await assertManualResolutionAllowed(ctx, event._id, context.user);
      return {
        kind: 'ability.resolved-at-table',
        description: `Resolved at table by ${context.user.displayName}: "${occurrence.effect.clause}" from ${result.actor.name}'s ${result.abilityName}${note ? ` — ${note}` : ''}. No movement, damage, conditions or saves were applied.`,
        causeEventId: event._id,
        data: {
          originalEventId: event._id,
          occurrence: occurrence.id,
          clause: occurrence.effect.clause,
          target: requestedTarget,
          note,
        },
        commit: async (mctx, scope) => {
          await journalPatch(mctx, scope, 'abilityResults', result._id, {
            compiled: {
              ...compiled,
              effects: compiled.effects.map(o =>
                o.id === occurrence.id
                  ? { ...o, disposition: { eventId: scope.eventId, note } }
                  : o,
              ),
            },
          });
        },
      };
    }
    if (args.occurrence !== undefined)
      throw new ConvexError('This older result has no compiled occurrences.');
    if (!clause) throw new ConvexError('Give a clause for this legacy result.');
    let targetActor: Actor | null = null;
    let index = -1;
    if (args.target !== undefined) {
      targetActor = (await bindTarget(ctx, context, args.target as Reference, result.actor)).actor;
      const effectiveTargets = await Promise.all(
        result.targets.map(async t => ({
          ...t.target,
          id: await resolveHistoricalId(ctx, context.campaign._id, t.target.id),
        })),
      );
      index = effectiveTargets.findIndex(t => sameActor(t, targetActor!));
      if (index < 0) throw new ConvexError(`${targetActor.name} was not a target of that use.`);
      const outcome = result.targets[index]!.outcome as TargetRollOutcome;
      if (!outcome.unresolvedClauses.includes(clause))
        throw new ConvexError(
          `"${clause}" is not an unresolved clause for ${targetActor.name}; unresolved: ${outcome.unresolvedClauses.map(c => `"${c}"`).join(', ') || 'none'}.`,
        );
      if (result.targets[index]!.dispositions.some(d => d.clause === clause))
        throw new ConvexError(
          `"${clause}" for ${targetActor.name} is already marked resolved at table.`,
        );
    } else {
      const eventData = (event.payload as { data?: { result?: AbilityRollResult } })?.data?.result;
      const manual = eventData?.manualResolutions?.some(m => m.sourceClause === clause);
      if (!manual)
        throw new ConvexError(
          `"${clause}" is not an ability-level clause of that use; give target= for a per-target clause.`,
        );
      if (result.manualDispositions.some(d => d.clause === clause))
        throw new ConvexError(`"${clause}" is already marked resolved at table.`);
    }
    await assertManualResolutionAllowed(ctx, event._id, context.user);
    return {
      kind: 'ability.resolved-at-table',
      description: `Resolved at table by ${context.user.displayName}: "${clause}"${targetActor ? ` for ${targetActor.name}` : ''} from ${result.actor.name}'s ${result.abilityName}${note ? ` — ${note}` : ''}. No state was changed by this record.`,
      causeEventId: event._id,
      data: { originalEventId: event._id, clause, target: targetActor, note },
      commit: async (mctx, scope) => {
        const current = (await mctx.db.get(result._id))!;
        const disposition = { clause, eventId: scope.eventId, note };
        if (index >= 0)
          await journalPatch(mctx, scope, 'abilityResults', result._id, {
            targets: current.targets.map((t, i) =>
              i === index ? { ...t, dispositions: [...t.dispositions, disposition] } : t,
            ),
          });
        else
          await journalPatch(mctx, scope, 'abilityResults', result._id, {
            manualDispositions: [...current.manualDispositions, disposition],
          });
      },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// /hero facts — Director-supplied roll facts while no evaluated baseline exists (Q-A-200 route).

function bonusTriple(value: unknown, name: string): number[] {
  if (value === undefined) return [0, 0, 0];
  const parts = String(value)
    .split('/')
    .map(p => p.trim().replace(/^\+/, ''));
  if (parts.length !== 3 || parts.some(p => !/^-?\d+$/.test(p)))
    throw new ConvexError(`"${name}" must be three whole numbers like "0/0/4".`);
  return parts.map(Number);
}

const heroFactsOperation: OperationDefinition = {
  id: 'hero.facts',
  family: 'hero',
  verb: 'facts',
  title: 'Record hero roll facts',
  description:
    'Legacy supplied-fact bridge: refused for heroes with an evaluated build. Admitted heroes use their reviewed build for characteristics, kits and granted abilities.',
  args: {
    might: v.number(),
    agility: v.number(),
    reason: v.number(),
    intuition: v.number(),
    presence: v.number(),
    melee: v.optional(v.string()),
    ranged: v.optional(v.string()),
    kit: v.optional(v.string()),
    signature: v.optional(v.string()),
    abilities: v.optional(v.array(v.string())),
    resource: v.optional(v.string()),
  },
  argDescriptions: {
    might: 'Might score.',
    agility: 'Agility score.',
    reason: 'Reason score.',
    intuition: 'Intuition score.',
    presence: 'Presence score.',
    melee: 'Kit melee damage bonus as "+X/+Y/+Z" (default 0/0/0).',
    ranged: 'Kit ranged damage bonus as "+X/+Y/+Z" (default 0/0/0).',
    kit: 'Kit name, for the record.',
    signature:
      'Printed name of the kit’s own signature ability (its damage already includes the bonus).',
    abilities:
      'Content ids of the granted abilities, e.g. ["mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam"].',
    resource:
      'Name of the heroic resource pool (e.g. "Ferocity"); its current value stays what /adjust heroic-resource set.',
  },
  roles: ['director'],
  session: 'running',
  actor: 'required',
  execute: async (ctx, { context, actor, args }) => {
    if (actor!.kind !== 'character')
      throw new ConvexError('Roll facts are recorded for heroes only.');
    const records = await loadActorRecords(ctx, context, actor!);
    if (records.character?.derivedBaseline)
      throw new ConvexError(
        'This hero has an evaluated build. The temporary /hero facts bridge cannot override an admitted build; use the character revision and review workflow.',
      );
    const characteristics = {
      M: integer(args.might, 'might'),
      A: integer(args.agility, 'agility'),
      R: integer(args.reason, 'reason'),
      I: integer(args.intuition, 'intuition'),
      P: integer(args.presence, 'presence'),
    };
    const abilities = (args.abilities as string[] | undefined) ?? [];
    for (const id of abilities) await requireContent(ctx, id);
    const next = {
      campaignId: context.campaign._id,
      characterId: records.character!._id,
      characteristics,
      kitName: args.kit === undefined ? null : String(args.kit),
      kitMeleeDamageBonus: bonusTriple(args.melee, 'melee'),
      kitRangedDamageBonus: bonusTriple(args.ranged, 'ranged'),
      abilities,
      kitSignatureAbility: args.signature === undefined ? null : String(args.signature),
    };
    const before = records.facts ?? null;
    const resource = args.resource === undefined ? undefined : String(args.resource).trim();
    if (resource !== undefined && (!resource || resource.length > 40))
      throw new ConvexError('"resource" needs 1–40 characters.');
    return {
      kind: 'hero.facts',
      description: `Supplied facts for ${actor!.name}: M ${characteristics.M}, A ${characteristics.A}, R ${characteristics.R}, I ${characteristics.I}, P ${characteristics.P}; kit ${next.kitName ?? 'none'} melee ${next.kitMeleeDamageBonus.join('/')} ranged ${next.kitRangedDamageBonus.join('/')}; ${abilities.length} granted abilit${abilities.length === 1 ? 'y' : 'ies'}.`,
      data: {
        creature: actor,
        before: before
          ? {
              characteristics: before.characteristics,
              kitName: before.kitName,
              kitMeleeDamageBonus: before.kitMeleeDamageBonus,
              kitRangedDamageBonus: before.kitRangedDamageBonus,
              abilities: before.abilities,
              kitSignatureAbility: before.kitSignatureAbility,
            }
          : null,
        after: next,
        ...(resource !== undefined ? { resource } : {}),
        note: 'Supplied facts (no evaluated build exists; Q-A-200 route).',
      },
      commit: async (mctx, scope) => {
        if (before) await journalPatch(mctx, scope, 'heroRollFacts', before._id, next);
        else await journalInsert(mctx, scope, 'heroRollFacts', next);
        if (resource !== undefined) {
          const character = (await mctx.db.get(records.character!._id))!;
          const live: HeroLive = requireHeroLive(character);
          await journalPatch(mctx, scope, 'characters', character._id, {
            liveState: { ...live, heroicResource: { ...live.heroicResource, name: resource } },
          });
        }
      },
    };
  },
};

export const abilityOperations: OperationDefinition[] = [
  abilitySelect,
  targetToggle,
  targetModifier,
  selectionCancel,
  abilityFire,
  abilityUse,
  abilityCorrect,
  abilityResolved,
  heroFactsOperation,
];
