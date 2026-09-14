// SPDX-License-Identifier: GPL-3.0-only
/**
 * A03 FreePlay operations, registered in convex/lib/registry.ts and reachable from the palette,
 * slash text, the web panes and `pnpm app command` alike. Nothing in web/ resolves a rule.
 *
 * Owning specifications:
 * - docs/table-command-spec.md#direct-test-rolls (`/test roll`: record user, character, dice,
 *   characteristic, agreed skill, modifiers; outcome only when the difficulty is known)
 * - docs/table-spec.md#v001-catch-breath (`/hero recover`: one Recovery per use outside combat, both
 *   changes recorded together)
 * - docs/table-spec.md#v001-manual-condition-tracking (`/condition on|off`: players on their own
 *   heroes, the Director on all; before/after state recorded)
 * - docs/table-spec.md#persistent-values-and-manual-adjustment-entries, #v001-temporary-stamina,
 *   #v001-surge-tracking (`/adjust <field>`: Director numeric edits as Manual adjustment entries)
 * - docs/table-spec.md#malice-visibility, docs/table-command-spec.md#malice-display-setting and
 *   docs/table-spec.md#monster-visibility-and-health-display (campaign display settings)
 *
 * Arithmetic comes only from the R04 contract, docs/roll-and-damage-resolution.md: sections 1.4
 * (edges and banes), 1.5 (total and tier), 1.6 (natural 19/20), 5 (direct tests) and 7 (Catch Breath
 * and Recovery spending). Nothing else here computes a game value.
 */
import { ConvexError, v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { BoundActor } from '../../shared/commands/envelope';
import type {
  Characteristic,
  EdgeBaneResolution,
  TestDifficulty,
  TestOutcome,
  TestRollResult,
  Tier,
} from '../../shared/contracts/rollResolution';
import type { ConditionId, ConditionToggles } from '../../shared/contracts/liveState';
import { rollDice } from './dice';
import { journalPatch, type JournalScope } from './journal';
import type { OperationDefinition, Outcome, TableContext } from './registry';

// ---------------------------------------------------------------------------------------------
// Live-state shapes and helpers.

/** The nine toggles in R05 order (shared/content/core-conditions.json, liveState.ts ConditionId). */
export const CONDITION_IDS: ConditionId[] = [
  'bleeding',
  'dazed',
  'frightened',
  'grabbed',
  'prone',
  'restrained',
  'slowed',
  'taunted',
  'weakened',
];

export function noConditions(): ConditionToggles {
  return Object.fromEntries(CONDITION_IDS.map(id => [id, false])) as ConditionToggles;
}

export type HeroLive = NonNullable<Doc<'characters'>['liveState']>;

/**
 * First table use without an evaluated baseline (A02 has not landed): the literal R03 initial values
 * (temporary Stamina 0, surges 0, Victories 0, XP 0, every toggle off) and `null` for everything R03
 * takes from the baseline. Recorded as an implementation note in the A03 slice document.
 */
export function initialHeroLive(now: number): HeroLive {
  return {
    stamina: null,
    temporaryStamina: 0,
    recoveries: null,
    heroicResource: { name: null, current: null },
    surges: 0,
    victories: 0,
    xp: 0,
    conditions: noConditions(),
    staminaMaximum: null,
    recoveriesMaximum: null,
    origin: { kind: 'first-table-use-without-baseline', initializedAt: now },
  };
}

async function loadCharacter(ctx: MutationCtx, context: TableContext, actor: BoundActor) {
  if (actor.kind !== 'character')
    throw new ConvexError(`${actor.name} is not a hero; this operation acts for heroes only.`);
  const character = await ctx.db.get(actor.id as Id<'characters'>);
  if (!character || character.campaignId !== context.campaign._id)
    throw new ConvexError('That hero is not at this table.');
  return character;
}

async function loadFoe(ctx: MutationCtx, context: TableContext, actor: BoundActor) {
  const foe = await ctx.db.get(actor.id as Id<'foes'>);
  if (!foe || foe.campaignId !== context.campaign._id)
    throw new ConvexError('That foe is not at this table.');
  return foe;
}

/** Journals the first-use live record when the hero has none, then returns the current record. */
async function ensureHeroLive(
  ctx: MutationCtx,
  scope: JournalScope,
  character: Doc<'characters'>,
): Promise<HeroLive> {
  if (character.liveState) return character.liveState;
  const live = initialHeroLive(Date.now());
  await journalPatch(ctx, scope, 'characters', character._id, { liveState: live });
  return live;
}

function integer(value: unknown, name: string, min?: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value))
    throw new ConvexError(`"${name}" must be a whole number.`);
  if (min !== undefined && value < min) throw new ConvexError(`"${name}" cannot be below ${min}.`);
  return value;
}

const RUNNING_SESSION: OperationDefinition['session'] = 'running';

// ---------------------------------------------------------------------------------------------
// R04 arithmetic (docs/roll-and-damage-resolution.md). Each function cites its section.

/** Section 1.4: counts above two add nothing; net decides a ±2 modifier or a one-tier shift. */
export function resolveEdgeBane(edges: number, banes: number): EdgeBaneResolution {
  const effectiveEdges = Math.min(edges, 2) as 0 | 1 | 2;
  const effectiveBanes = Math.min(banes, 2) as 0 | 1 | 2;
  const net = (effectiveEdges - effectiveBanes) as -2 | -1 | 0 | 1 | 2;
  const modifier = net === 1 ? 2 : net === -1 ? -2 : 0;
  const tierShift = net === 2 ? 1 : net === -2 ? -1 : 0;
  return { edges, banes, effectiveEdges, effectiveBanes, net, modifier, tierShift };
}

/** Section 1.5: 11 or lower is tier 1, 12 to 16 tier 2, 17 or higher tier 3; then the shift, clamped. */
export function tierOf(total: number, tierShift: -1 | 0 | 1): Tier {
  const baseTier: Tier = total <= 11 ? 1 : total <= 16 ? 2 : 3;
  return Math.max(1, Math.min(3, baseTier + tierShift)) as Tier;
}

/** Section 5, Test Difficulty Outcomes table; natural 19 or 20 is a reward at any difficulty. */
export function testOutcome(
  tier: Tier,
  criticalSuccess: boolean,
  difficulty: TestDifficulty,
): TestOutcome {
  if (criticalSuccess) return 'Success with a reward';
  const table: Record<TestDifficulty, [TestOutcome, TestOutcome, TestOutcome]> = {
    easy: ['Success with a consequence', 'Success', 'Success with a reward'],
    medium: ['Failure', 'Success with a consequence', 'Success'],
    hard: ['Failure with a consequence', 'Failure', 'Success'],
  };
  return table[difficulty][tier - 1];
}

/** Section 7: `recoveryValue = floor(maxStamina / 3)`. */
export function recoveryValueOf(maxStamina: number): number {
  return Math.floor(maxStamina / 3);
}

const CHARACTERISTICS: Characteristic[] = ['M', 'A', 'R', 'I', 'P'];
const DIFFICULTIES: TestDifficulty[] = ['easy', 'medium', 'hard'];

// ---------------------------------------------------------------------------------------------
// /test roll

const testRoll: OperationDefinition = {
  id: 'test.roll',
  family: 'test',
  verb: 'roll',
  title: 'Roll a test',
  description:
    'Make a direct test: 2d10 plus the characteristic, an agreed skill (+2), edges and banes. The outcome label appears only when a difficulty is given; otherwise the Director interprets the total.',
  args: {
    characteristic: v.string(),
    value: v.optional(v.number()),
    skill: v.optional(v.string()),
    edges: v.optional(v.number()),
    banes: v.optional(v.number()),
    difficulty: v.optional(v.string()),
  },
  argDescriptions: {
    characteristic: 'M, A, R, I or P.',
    value:
      'The characteristic score, supplied by the table while the hero has no evaluated build (recorded as a supplied fact).',
    skill: 'The skill the Director agreed applies; grants the +2 bonus.',
    edges: 'Number of edges (default 0).',
    banes: 'Number of banes (default 0).',
    difficulty: 'easy, medium or hard; omit it to leave interpretation to the Director.',
  },
  roles: ['director', 'player'],
  session: RUNNING_SESSION,
  actor: 'required',
  execute: async (ctx, { context, envelope, actor, args }) => {
    const characteristic = String(args.characteristic).toUpperCase() as Characteristic;
    if (!CHARACTERISTICS.includes(characteristic))
      throw new ConvexError('"characteristic" must be one of M, A, R, I or P.');
    const edges = args.edges === undefined ? 0 : integer(args.edges, 'edges', 0);
    const banes = args.banes === undefined ? 0 : integer(args.banes, 'banes', 0);
    const difficulty =
      args.difficulty === undefined
        ? undefined
        : (String(args.difficulty).toLowerCase() as TestDifficulty);
    if (difficulty !== undefined && !DIFFICULTIES.includes(difficulty))
      throw new ConvexError('"difficulty" must be easy, medium or hard.');
    const skill = args.skill === undefined ? undefined : String(args.skill).trim();
    if (skill !== undefined && (!skill || skill.length > 80))
      throw new ConvexError('"skill" needs 1–80 characters.');
    // No evaluated baseline exists in this checkout (A02 pending), so the score is a supplied fact.
    if (args.value === undefined)
      throw new ConvexError(
        `${actor!.name} has no evaluated build that supplies ${characteristic}; add value=<score> and it is recorded as a supplied fact.`,
      );
    const characteristicValue = integer(args.value, 'value');
    const accepted = await rollDice(ctx, context.campaign._id, envelope.commandId, [
      { id: 'd10a', sides: 10 },
      { id: 'd10b', sides: 10 },
    ]);
    const [a, b] = accepted.dice;
    const dice = { d10a: a!.value as TestRollResult['dice']['d10a'], d10b: b!.value as never };
    // Section 1.2: the natural roll is the dice alone.
    const naturalRoll = a!.value + b!.value;
    // Section 5: +2 when the Director agreed a skill applies.
    const skillBonus: 0 | 2 = skill ? 2 : 0;
    const edgeBane = resolveEdgeBane(edges, banes);
    // Section 5 / 1.5: total = natural + characteristic + skill + other bonuses + edge/bane modifier.
    const total = naturalRoll + characteristicValue + skillBonus + edgeBane.modifier;
    // Section 1.6: a natural 19 or 20 is tier 3 regardless of modifiers; Q-R-1 under a double bane.
    const criticalSuccess = naturalRoll >= 19;
    const tier: Tier = criticalSuccess ? 3 : tierOf(total, edgeBane.tierShift);
    const result: TestRollResult = {
      actorId: actor!.id,
      dice,
      naturalRoll,
      characteristic,
      characteristicValue,
      skillBonus,
      bonusTotal: skillBonus,
      edgeBane,
      total,
      tier,
      criticalSuccess,
      ...(difficulty
        ? { difficulty, outcome: testOutcome(tier, criticalSuccess, difficulty) }
        : {}),
      ...(criticalSuccess && edgeBane.tierShift === -1 ? { uncertainty: 'Q-R-1' as const } : {}),
    };
    const parts = [
      `${a!.value} + ${b!.value}`,
      `${characteristicValue >= 0 ? '+' : '−'} ${Math.abs(characteristicValue)} (${characteristic})`,
      skill ? `+ 2 (${skill})` : null,
      edgeBane.modifier
        ? `${edgeBane.modifier > 0 ? '+' : '−'} 2 (${edgeBane.modifier > 0 ? 'edge' : 'bane'})`
        : null,
    ].filter(Boolean);
    const shift =
      edgeBane.tierShift === 1
        ? ', double edge: tier +1'
        : edgeBane.tierShift === -1
          ? ', double bane: tier −1'
          : '';
    const description = `${actor!.name} tested ${characteristic}: ${parts.join(' ')} = ${total} → tier ${tier}${shift}${criticalSuccess ? ' (natural 19+)' : ''}${result.outcome ? `; ${difficulty}: ${result.outcome}` : '; the Director interprets the total'}.`;
    return {
      kind: 'test.roll',
      description,
      dice: accepted.dice,
      data: {
        result,
        rollId: accepted.rollId,
        characteristicValueSource: 'supplied' as const,
        ...(skill ? { skill } : {}),
      },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// /hero recover

const heroRecover: OperationDefinition = {
  id: 'hero.recover',
  family: 'hero',
  verb: 'recover',
  title: 'Spend a Recovery',
  description:
    'Outside combat: spend one Recovery and regain Stamina equal to the recovery value, capped at the Stamina maximum. No maneuver is used.',
  args: {},
  argDescriptions: {},
  roles: ['director', 'player'],
  session: RUNNING_SESSION,
  actor: 'required',
  execute: async (ctx, { context, actor }) => {
    const character = await loadCharacter(ctx, context, actor!);
    const live = character.liveState ?? initialHeroLive(Date.now());
    if (live.staminaMaximum === null || live.stamina === null || live.recoveries === null)
      throw new ConvexError(
        `${character.authored.name} has no recorded Stamina maximum, Stamina or Recoveries yet; no evaluated build exists (A02). The Director sets them with /adjust stamina-maximum, /adjust stamina and /adjust recoveries.`,
      );
    // Section 7: cost is one Recovery; affordable iff recoveries >= 1.
    if (live.recoveries < 1)
      throw new ConvexError(`${character.authored.name} has no Recoveries left to spend.`);
    const recoveryValue = recoveryValueOf(live.staminaMaximum);
    // Section 7: stamina' = min(maxStamina, stamina + recoveryValue) (cap: Q-R-3); temporary unchanged.
    const staminaAfter = Math.min(live.staminaMaximum, live.stamina + recoveryValue);
    const healed = staminaAfter - live.stamina;
    const capApplied = live.stamina + recoveryValue > live.staminaMaximum;
    const warnings: string[] = [];
    if (healed === 0)
      warnings.push('Already at the Stamina maximum: the Recovery is spent and 0 healed.');
    const result = {
      kind: 'resolved' as const,
      actorId: character._id,
      recoveryValue,
      recoveriesBefore: live.recoveries,
      recoveriesAfter: live.recoveries - 1,
      staminaBefore: live.stamina,
      staminaAfter,
      healed,
      capApplied,
      ...(capApplied ? { uncertainty: 'Q-R-3' as const } : {}),
      temporaryStaminaUnchanged: live.temporaryStamina,
      warnings,
    };
    return {
      kind: 'hero.recover',
      description: `${character.authored.name} spent a Recovery (${result.recoveriesBefore} → ${result.recoveriesAfter}) and regained ${healed} Stamina (${result.staminaBefore} → ${staminaAfter}${capApplied ? ', capped at the maximum' : ''}).${warnings.length ? ` ${warnings.join(' ')}` : ''}`,
      data: {
        result,
        source: {
          id: 'mcdm.heroes.v1/feature.common.maneuvers/catch-breath',
          note: 'FreePlay use: no maneuver allowance is consumed (docs/table-spec.md#v001-catch-breath).',
        },
      },
      commit: async (mctx, scope) => {
        const current = await ensureHeroLive(mctx, scope, character);
        await journalPatch(mctx, scope, 'characters', character._id, {
          liveState: { ...current, stamina: staminaAfter, recoveries: result.recoveriesAfter },
        });
      },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// /condition on|off

function conditionOperation(on: boolean): OperationDefinition {
  return {
    id: on ? 'condition.on' : 'condition.off',
    family: 'condition',
    verb: on ? 'on' : 'off',
    title: on ? 'Apply a condition' : 'Remove a condition',
    description: `${on ? 'Turn on' : 'Turn off'} one core condition on the acting hero or foe. Players change their own heroes; the Director changes anyone.`,
    args: { name: v.string() },
    argDescriptions: { name: `One of ${CONDITION_IDS.join(', ')}.` },
    roles: ['director', 'player'],
    session: RUNNING_SESSION,
    actor: 'required',
    execute: async (ctx, { context, actor, args }): Promise<Outcome> => {
      const name = String(args.name).toLowerCase() as ConditionId;
      if (!CONDITION_IDS.includes(name))
        throw new ConvexError(`"name" must be one of ${CONDITION_IDS.join(', ')}.`);
      const kind = on ? 'condition.on' : 'condition.off';
      if (actor!.kind === 'character') {
        const character = await loadCharacter(ctx, context, actor!);
        const before = character.liveState?.conditions[name] ?? false;
        if (before === on)
          throw new ConvexError(
            `${character.authored.name} is already ${on ? '' : 'not '}${name}.`,
          );
        return {
          kind,
          description: `${character.authored.name} is ${on ? 'now' : 'no longer'} ${name}.`,
          data: {
            creature: { kind: 'character', id: character._id },
            condition: name,
            before,
            after: on,
          },
          commit: async (mctx, scope) => {
            const live = await ensureHeroLive(mctx, scope, character);
            await journalPatch(mctx, scope, 'characters', character._id, {
              liveState: { ...live, conditions: { ...live.conditions, [name]: on } },
            });
          },
        };
      }
      const foe = await loadFoe(ctx, context, actor!);
      const before = foe.live.conditions?.[name] ?? false;
      if (before === on)
        throw new ConvexError(`${foe.name} is already ${on ? '' : 'not '}${name}.`);
      return {
        kind,
        description: `${foe.name} is ${on ? 'now' : 'no longer'} ${name}.`,
        data: { creature: { kind: 'foe', id: foe._id }, condition: name, before, after: on },
        commit: async (mctx, scope) => {
          // Loaded foes have no toggle record; the first toggle records the all-off state first.
          const conditions = foe.live.conditions ?? noConditions();
          if (!foe.live.conditions)
            await journalPatch(mctx, scope, 'foes', foe._id, { live: { ...foe.live, conditions } });
          await journalPatch(mctx, scope, 'foes', foe._id, {
            live: { ...foe.live, conditions: { ...conditions, [name]: on } },
          });
        },
      };
    },
  };
}

const conditionOn = conditionOperation(true);
const conditionOff = conditionOperation(false);

// ---------------------------------------------------------------------------------------------
// /adjust <field>

interface AdjustableField {
  verb: string;
  label: string;
  /** Which creatures carry the field; `campaign` for the shared Malice pool. */
  scope: 'hero' | 'creature' | 'campaign';
  /** Stamina may be negative for a hero (R03: no clamp); other counters cannot go below zero. */
  min?: number;
  /** Set only while no evaluated baseline exists (A02); see the slice implementation note. */
  provisional?: boolean;
}

const ADJUSTABLE: AdjustableField[] = [
  { verb: 'stamina', label: 'Stamina', scope: 'creature' },
  { verb: 'temporary-stamina', label: 'Temporary Stamina', scope: 'creature', min: 0 },
  { verb: 'recoveries', label: 'Recoveries', scope: 'hero', min: 0 },
  { verb: 'heroic-resource', label: 'Heroic Resource', scope: 'hero', min: 0 },
  { verb: 'surges', label: 'Surges', scope: 'hero', min: 0 },
  { verb: 'victories', label: 'Victories', scope: 'hero', min: 0 },
  { verb: 'stamina-maximum', label: 'Stamina maximum', scope: 'hero', min: 0, provisional: true },
  {
    verb: 'recoveries-maximum',
    label: 'Recoveries maximum',
    scope: 'hero',
    min: 0,
    provisional: true,
  },
  { verb: 'malice', label: 'Malice', scope: 'campaign', min: 0 },
];

function heroField(live: HeroLive, verb: string): number | null {
  switch (verb) {
    case 'stamina':
      return live.stamina;
    case 'temporary-stamina':
      return live.temporaryStamina;
    case 'recoveries':
      return live.recoveries;
    case 'heroic-resource':
      return live.heroicResource.current;
    case 'surges':
      return live.surges;
    case 'victories':
      return live.victories;
    case 'stamina-maximum':
      return live.staminaMaximum;
    case 'recoveries-maximum':
      return live.recoveriesMaximum;
    default:
      throw new ConvexError(`Unknown field ${verb}.`);
  }
}

function withHeroField(live: HeroLive, verb: string, value: number): HeroLive {
  switch (verb) {
    case 'stamina':
      return { ...live, stamina: value };
    case 'temporary-stamina':
      return { ...live, temporaryStamina: value };
    case 'recoveries':
      return { ...live, recoveries: value };
    case 'heroic-resource':
      return { ...live, heroicResource: { ...live.heroicResource, current: value } };
    case 'surges':
      return { ...live, surges: value };
    case 'victories':
      return { ...live, victories: value };
    case 'stamina-maximum':
      return { ...live, staminaMaximum: value };
    case 'recoveries-maximum':
      return { ...live, recoveriesMaximum: value };
    default:
      throw new ConvexError(`Unknown field ${verb}.`);
  }
}

function adjustOperation(field: AdjustableField): OperationDefinition {
  const manual = (
    subject: string,
    before: number | null,
    after: number,
    creature: unknown,
  ): Outcome => ({
    kind: 'manual.adjustment',
    description: `Manual adjustment — ${subject} ${field.label} ${before === null ? 'unset' : before} → ${after}.`,
    data: { field: field.verb, label: field.label, creature, before, after },
  });
  return {
    id: `adjust.${field.verb}`,
    family: 'adjust',
    verb: field.verb,
    title: `Adjust ${field.label}`,
    description: `Director edit of the persistent ${field.label} value${field.scope === 'campaign' ? ' (the shared pool)' : ''}; appends a Manual adjustment entry with the previous and new value.${field.provisional ? ' Available while the hero has no evaluated build (A02 pending).' : ''}`,
    args: { value: v.number() },
    argDescriptions: { value: `The new ${field.label} value.` },
    roles: ['director'],
    session: RUNNING_SESSION,
    actor: field.scope === 'campaign' ? 'none' : 'required',
    execute: async (ctx, { context, actor, args }) => {
      const value = integer(args.value, 'value', field.min);
      if (field.scope === 'campaign') {
        const before = context.campaign.malice ?? 0;
        const outcome = manual('shared', before, value, null);
        return {
          ...outcome,
          commit: async (mctx, scope) => {
            await journalPatch(mctx, scope, 'campaigns', context.campaign._id, { malice: value });
          },
        };
      }
      if (actor!.kind === 'foe') {
        if (field.scope === 'hero')
          throw new ConvexError(`${actor!.name} is a foe; foes have no ${field.label}.`);
        const foe = await loadFoe(ctx, context, actor!);
        const key = field.verb === 'stamina' ? 'stamina' : 'temporaryStamina';
        const before = foe.live[key];
        const outcome = manual(foe.name, before, value, { kind: 'foe', id: foe._id });
        return {
          ...outcome,
          commit: async (mctx, scope) => {
            await journalPatch(mctx, scope, 'foes', foe._id, {
              live: { ...foe.live, [key]: value },
            });
          },
        };
      }
      const character = await loadCharacter(ctx, context, actor!);
      const live = character.liveState ?? initialHeroLive(Date.now());
      if (field.provisional && character.derivedBaseline !== null)
        throw new ConvexError(
          `${field.label} comes from the evaluated build; it is not adjusted here.`,
        );
      const before = heroField(live, field.verb);
      const outcome = manual(character.authored.name, before, value, {
        kind: 'character',
        id: character._id,
      });
      return {
        ...outcome,
        commit: async (mctx, scope) => {
          const current = await ensureHeroLive(mctx, scope, character);
          await journalPatch(mctx, scope, 'characters', character._id, {
            liveState: withHeroField(current, field.verb, value),
          });
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Campaign display settings.

export const DEFAULT_SETTINGS = { showMalice: false, healthDisplay: 'bar' as const };

function settingsOf(campaign: Doc<'campaigns'>) {
  return campaign.settings ?? DEFAULT_SETTINGS;
}

const maliceVisible: OperationDefinition = {
  id: 'campaign.malice-visible',
  family: 'campaign',
  verb: 'malice-visible',
  title: 'Show Malice',
  description:
    'Turn the Show Malice campaign setting on or off. Off by default; the Director always sees the pool.',
  args: { state: v.string() },
  argDescriptions: { state: 'on or off.' },
  roles: ['director'],
  session: 'none',
  actor: 'none',
  execute: async (_ctx, { context, args }) => {
    const state = String(args.state).toLowerCase();
    if (state !== 'on' && state !== 'off') throw new ConvexError('"state" must be on or off.');
    const before = settingsOf(context.campaign);
    const settings = { ...before, showMalice: state === 'on' };
    return {
      kind: 'campaign.setting',
      description: `Show Malice turned ${state}.`,
      data: { setting: 'showMalice', before: before.showMalice, after: settings.showMalice },
      commit: async (mctx, scope) => {
        await journalPatch(mctx, scope, 'campaigns', context.campaign._id, { settings });
      },
    };
  },
};

const HEALTH_MODES = ['bar', 'numerical', 'winded'] as const;

const healthDisplay: OperationDefinition = {
  id: 'campaign.health-display',
  family: 'campaign',
  verb: 'health-display',
  title: 'Monster health display',
  description:
    'Set how players and observers see foe health: bar (default), numerical or winded. Changeable at any time.',
  args: { mode: v.string() },
  argDescriptions: { mode: 'bar, numerical or winded.' },
  roles: ['director'],
  session: 'none',
  actor: 'none',
  execute: async (_ctx, { context, args }) => {
    const mode = String(args.mode).toLowerCase() as (typeof HEALTH_MODES)[number];
    if (!HEALTH_MODES.includes(mode))
      throw new ConvexError('"mode" must be bar, numerical or winded.');
    const before = settingsOf(context.campaign);
    const settings = { ...before, healthDisplay: mode };
    return {
      kind: 'campaign.setting',
      description: `Monster health display set to ${mode}.`,
      data: { setting: 'healthDisplay', before: before.healthDisplay, after: mode },
      commit: async (mctx, scope) => {
        await journalPatch(mctx, scope, 'campaigns', context.campaign._id, { settings });
      },
    };
  },
};

export const tableOperations: OperationDefinition[] = [
  testRoll,
  heroRecover,
  conditionOn,
  conditionOff,
  ...ADJUSTABLE.map(adjustOperation),
  maliceVisible,
  healthDisplay,
];
