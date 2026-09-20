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
  resolveCompiledAbility,
  type CompiledAbilityInput,
} from '../../shared/resolve/compiledOutcome';
import { effectOccurrences, type CompiledResult } from '../../shared/contracts/compiledResult';
import { movementFacts } from './compiledResults';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { BoundActor, CommandEnvelope, Reference } from '../../shared/commands/envelope';
import type {
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
  correctTarget,
  resolveAbilityRoll,
  resolveCatchBreath,
  resolveCreatureFreeStrike,
} from '../../shared/resolve/index';
import type { ReadCtx } from './access';
import { committedEncounter } from './encounters';
import {
  assertCorrectionAllowed,
  assertManualResolutionAllowed,
  resolveHistoricalId,
} from './history';
import { journalInsert, journalPatch, type JournalScope } from './journal';
import { rollDice } from './dice';
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
  },
  argDescriptions: {
    ability: 'The ability by printed name or content id.',
    characteristic:
      'Optional roll characteristic override (M, A, R, I or P); default resets the choice.',
    'damage-characteristic':
      'Independent damage characteristic override among the printed choices; default resets it.',
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
      args['damage-characteristic'] === undefined
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
  } else if (!allowance.onTurn && ['move action', 'free maneuver'].includes(actionType))
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
  options: { shared?: boolean } = {},
) {
  if (!allowance.inCombat || !allowance.encounterId) return;
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
  return { resource, current: pool.current, legalFloor: 0 };
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
    fromDraft: 'Set by the selection controls when they fire the invoking user’s draft.',
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
    const counts = (value: unknown, name: string): number[] => {
      if (value === undefined) return targets.map(() => 0);
      const list = Array.isArray(value) ? value : [value];
      if (list.length !== targets.length)
        throw new ConvexError(`"${name}" needs one number per target (${targets.length}).`);
      return list.map(n => integer(n, name, 0));
    };
    const edges = counts(args.edges, 'edges');
    const banes = counts(args.banes, 'banes');
    const warnings: string[] = [];
    if (ability.targetShape.kind === 'single' && targets.length !== 1)
      throw new ConvexError(`${ability.name} targets one creature; give exactly one target.`);
    if (ability.targetShape.kind === 'multi' && targets.length > ability.targetShape.max)
      warnings.push(
        `Rule warning: ${ability.name} targets up to ${ability.targetShape.max} creatures; ${targets.length} were given.`,
      );
    if (ability.targetShape.kind !== 'self' && !targets.length)
      throw new ConvexError(`${ability.name} needs at least one target.`);
    const allowance = await allowanceFor(ctx, context, actor!);
    const tracking = planTracking(allowance, actor!, ability.actionType);
    warnings.push(...tracking.warnings);
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
        commit: async mctx => {
          await clear(mctx);
        },
      };
    }

    const costPool = ability.fixedCost
      ? poolFor(records, context, ability.fixedCost.resource)
      : undefined;
    const affordability = checkAffordability(ability.fixedCost, costPool, allowance.inCombat);
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
        'The outside-combat Ferocity reuse restriction is checked manually from the Ferocity source; no reuse limit or resource lifecycle is automated.',
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
          if (application) await writeDamage(mctx, scope, target, application);
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
    const pool = metadata.fixedCost
      ? poolFor(records, context, metadata.fixedCost.resource)
      : undefined;
    // Affordability is decided before any dice are drawn (R04 9: no roll, no debit when blocked).
    const probe = resolveAbilityRoll({
      ability: metadata,
      actor: actorFacts,
      targets: targets.map((t, i) => ({
        targetId: t.actor.id,
        edges: edges[i]!,
        banes: banes[i]!,
      })),
      targetFacts: [],
      dice: { d10a: 1, d10b: 1 },
      inCombat: allowance.inCombat,
      ...(pool ? { resourcePool: pool } : {}),
      ...(characteristic ? { selectedCharacteristic: characteristic } : {}),
      ...(damageCharacteristic ? { selectedDamageCharacteristic: damageCharacteristic } : {}),
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
    const targetFacts = targets.map(t => ({ record: t, facts: damageTargetFacts(t) }));
    const resolutionInput: CompiledAbilityInput = {
      actor: actorFacts,
      targets: targets.map((t, i) => ({
        targetId: t.actor.id,
        edges: edges[i]!,
        banes: banes[i]!,
      })),
      targetFacts: targetFacts.flatMap(t => ('facts' in t.facts ? [t.facts.facts] : [])),
      dice: { d10a: a!.value as never, d10b: b!.value as never },
      inCombat: allowance.inCombat,
      ...(pool ? { resourcePool: pool } : {}),
      ...(characteristic ? { selectedCharacteristic: characteristic } : {}),
      ...(damageCharacteristic ? { selectedDamageCharacteristic: damageCharacteristic } : {}),
      ...(!compiledDefinition && ability.effects ? { effectClauses: ability.effects } : {}),
      ...(compiledDefinition
        ? {
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
    for (const t of targetFacts) if ('missing' in t.facts) warnings.push(t.facts.missing);
    const perTarget = targets.map((t, i) => {
      const outcome = result.targets[i]!;
      const applied = minionApplication(
        t,
        result.damageApplications.find(d => d.targetId === t.actor.id) ?? null,
      );
      return { target: t.actor, edges: edges[i]!, banes: banes[i]!, outcome, applied };
    });
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
    const describeUse = (payment: string) =>
      `${actor!.name} uses ${ability.name} on ${targetNames}: ${describeRoll(result)}.${payment} ${perTarget.map(p => describeTarget(p.outcome, p.target.name, p.applied ?? undefined)).join(' ')}${squadText}${critText}${result.manualResolutions?.length ? ` Recorded for manual resolution: ${result.manualResolutions.map(m => `"${m.sourceClause}"`).join(', ')}.` : ''}${warnings.length ? ` ${warnings.join(' ')}` : ''}`;
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
        targets: perTarget.map(p => ({ target: p.target, edges: p.edges, banes: p.banes })),
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
        warnings,
        source,
      },
      ...(squadCard ? { interaction: squadCard } : {}),
      commit: async (mctx, scope) => {
        // 1. Debit the fixed cost once, before any effect.
        if (result.cost && !result.cost.waived)
          await debit(mctx, scope, records, context, result.cost.after, result.cost.resource);
        // 2. Damage to every target in target order (R04 4.5); squad pools once per squad.
        for (const p of perTarget) {
          const record = targets.find(t => sameActor(t.actor, p.target))!;
          if (p.applied) await writeDamage(mctx, scope, record, p.applied);
        }
        await commitSquadPlans(mctx, scope, squadPlans);
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
                  effects: effectOccurrences(scope.eventId, scope.eventId, compiledOutcome.effects),
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
            outcome: p.outcome,
            applied: p.applied,
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
    'Set the corrected edge and bane counts for one target of a resolved ability use. The accepted dice are kept, that target’s tier and damage are recomputed, the applied damage is reconciled without dealing it twice, and a linked correction entry is appended; the original entry is unchanged.',
  args: {
    event: v.string(),
    target: referenceValidator,
    edges: v.number(),
    banes: v.number(),
  },
  argDescriptions: {
    event: 'The id of the ability use event being corrected.',
    target: 'Which target of that use.',
    edges: 'The corrected number of edges against this target.',
    banes: 'The corrected number of banes against this target.',
  },
  roles: PLAYERS,
  session: 'running',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const { event, result } = await resultByEvent(ctx, context, String(args.event));
    // A06 window check: latest unit on the branch; acting player within their undo window; Director
    // always subject to the sequential-rewind rule for older events.
    await assertCorrectionAllowed(ctx, event._id, context.user);
    const edges = integer(args.edges, 'edges', 0);
    const banes = integer(args.banes, 'banes', 0);
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
    if (entry.edges === edges && entry.banes === banes)
      throw new ConvexError(
        `${targetRecord.actor.name} already has ${edges} edges and ${banes} banes on that use.`,
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
        dice: { d10a: result.dice.d10a as never, d10b: result.dice.d10b as never },
        characteristicValue: result.characteristicValue,
        ...(originalResult?.selectedDamageCharacteristic
          ? { selectedDamageCharacteristic: originalResult.selectedDamageCharacteristic }
          : {}),
        ...(result.selectedCharacteristic
          ? { selectedCharacteristic: result.selectedCharacteristic }
          : {}),
      },
      event._id,
      entry.outcome as TargetRollOutcome,
      applied,
      'facts' in facts ? facts.facts : undefined,
      edges,
      banes,
    );
    const savedCompiled = result.compiled as CompiledResult | undefined;
    const correctedCompiled = savedCompiled
      ? resolveCompiledAbility(savedCompiled.definition, {
          ...savedCompiled.inputs,
          targets: savedCompiled.inputs.targets.map(t =>
            t.targetId === entry.target.id ? { ...t, edges, banes } : t,
          ),
        })
      : undefined;
    if (correctedCompiled && correctedCompiled.kind !== 'resolved')
      throw new ConvexError('The saved compiled result cannot be corrected safely.');
    const name = targetRecord.actor.name;
    const stamina =
      'facts' in facts && correction.damageAfter
        ? `; ${name} Stamina ${facts.facts.stamina} → ${correction.damageAfter.staminaAfter}${correction.temporaryStaminaReconciliationDelta ? ` (temporary ${facts.facts.temporaryStamina} → ${correction.damageAfter.temporaryStaminaAfter})` : ''}${correction.damageAfter.slain ? '; Slain' : correction.damageAfter.windedAfter ? '; winded' : ''}`
        : 'facts' in facts && applied
          ? `; ${name} Stamina ${facts.facts.stamina} → ${facts.facts.stamina + correction.staminaReconciliationDelta}`
          : '';
    const publicDescription = `Correction by ${context.user.displayName}: ${result.actor.name}'s ${result.abilityName} against ${name}, edges ${entry.edges} → ${edges}, banes ${entry.banes} → ${banes} (same dice ${result.dice.d10a} + ${result.dice.d10b}): tier ${correction.before.tier} → ${correction.after.tier}, damage ${correction.before.damage?.rolledDamage ?? 'none'} → ${correction.after.damage?.rolledDamage ?? 'none'}, reconciliation ${correction.staminaReconciliationDelta >= 0 ? '+' : ''}${correction.staminaReconciliationDelta} Stamina.`;
    return {
      kind: 'correction.ability',
      description: `Correction by ${context.user.displayName}: ${result.actor.name}'s ${result.abilityName} against ${name}, edges ${entry.edges} → ${edges}, banes ${entry.banes} → ${banes} (same dice ${result.dice.d10a} + ${result.dice.d10b}): tier ${correction.before.tier} → ${correction.after.tier}, damage ${correction.before.damage?.rolledDamage ?? 'none'} → ${correction.after.damage?.rolledDamage ?? 'none'}, reconciliation ${correction.staminaReconciliationDelta >= 0 ? '+' : ''}${correction.staminaReconciliationDelta} Stamina${stamina}.`,
      causeEventId: event._id,
      data: {
        originalEventId: event._id,
        publicDescription,
        actor: result.actor,
        target: targetRecord.actor,
        correction,
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
                  revision: scope.eventId,
                  effects: effectOccurrences(
                    event._id,
                    scope.eventId,
                    correctedCompiled.effects.map(effect => {
                      if (effect.kind !== 'damage' || effect.targetId !== entry.target.id)
                        return effect;
                      const { application, ...rest } = effect;
                      void application;
                      return {
                        ...rest,
                        ...(correction.damageAfter ? { application: correction.damageAfter } : {}),
                      };
                    }),
                  ),
                } satisfies CompiledResult,
              }
            : {}),
          correctionEventIds: [...current.correctionEventIds, scope.eventId],
        });
        if ('facts' in facts && (applied || correction.damageAfter))
          await writeDamage(mctx, scope, targetRecord, {
            staminaAfter: facts.facts.stamina + correction.staminaReconciliationDelta,
            temporaryStaminaAfter:
              facts.facts.temporaryStamina + correction.temporaryStaminaReconciliationDelta,
          });
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
      if (clause && plainText(clause) !== plainText(occurrence.effect.clause))
        throw new ConvexError('The clause does not match that occurrence.');
      if (occurrence.revision !== compiled.revision || occurrence.useEventId !== event._id)
        throw new ConvexError('That occurrence is stale.');
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
