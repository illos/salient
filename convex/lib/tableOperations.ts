import { heroicResourceFloor } from '../../shared/resolve/resourceFloor';
import { setManualCondition } from './conditionInstances';
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
 * and Recovery spending), through the pure engine in shared/resolve/index.ts (A05). Nothing else
 * here computes a game value.
 */
import { ConvexError, v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { BoundActor } from '../../shared/commands/envelope';
import type {
  Characteristic,
  TestDifficulty,
  TestRollResult,
  Tier,
} from '../../shared/contracts/rollResolution';
import {
  recoveryValueOf,
  resolveEdgeBane,
  testOutcome,
  tierOf,
  windedValueOf,
} from '../../shared/resolve/index';
import { damageEvents } from '../../shared/resolve/watchers';
import { noteManualWatchers } from './watchers';
import type { ConditionId } from '../../shared/contracts/liveState';
import { rollDice } from './dice';
import {
  consumedBy,
  contributionIds,
  describeContribution,
  rollContributions,
  withContributions,
} from '../../shared/resolve/modifiers';
import {
  consumeRollEffects,
  endLapsedEffects,
  endOwnerDyingEffects,
  lapsedEffects,
} from './effectInstances';
import { excludeList } from './abilityOperations';
import { requireContent } from '../content';
import { journalPatch, type JournalScope } from './journal';
import { run, type OperationDefinition, type Outcome, type TableContext } from './registry';
import {
  assertNoPendingCasualties,
  dropMembers,
  loadSquad,
  poolState,
  recordCaptainLoss,
  squadMembers,
  squadOfCaptain,
  writePool,
} from './squads';
import { currentEncounter } from './encounters';

// ---------------------------------------------------------------------------------------------
// Live-state shapes and helpers.

export { CONDITION_IDS, noConditions } from './characterBuild';
import {
  baselineOf,
  CONDITION_IDS,
  requireBaseline,
  requireHeroLive,
  type HeroLive,
} from './characterBuild';
export type { HeroLive } from './characterBuild';

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

function integer(value: unknown, name: string, min?: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value))
    throw new ConvexError(`"${name}" must be a whole number.`);
  if (min !== undefined && value < min) throw new ConvexError(`"${name}" cannot be below ${min}.`);
  return value;
}

const RUNNING_SESSION: OperationDefinition['session'] = 'running';

// ---------------------------------------------------------------------------------------------
// R04 arithmetic comes from the shared engine module (A05, shared/resolve/index.ts); the names are
// re-exported so earlier callers keep working.

export { resolveEdgeBane, tierOf, testOutcome, recoveryValueOf };

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
    exclude: v.optional(v.union(v.string(), v.array(v.string()))),
  },
  argDescriptions: {
    characteristic: 'M, A, R, I or P.',
    value:
      'The characteristic score as a supplied fact, accepted only for a hero without an evaluated build; an admitted hero uses its baseline.',
    skill: 'The skill the Director agreed applies; grants the +2 bonus.',
    edges: 'Number of edges (default 0).',
    banes: 'Number of banes (default 0).',
    difficulty: 'easy, medium or hard; omit it to leave interpretation to the Director.',
    exclude:
      'Effect instance ids whose automatic edge, bane or bonus does not apply to this test (the table’s override). Edges and banes given here are circumstance, added to the automatic ones.',
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
    // R02: an admitted hero's characteristic comes from its effective baseline. A hero without an
    // evaluated build (not reachable through admission) may still supply the score as a fact.
    const character = await loadCharacter(ctx, context, actor!);
    const baseline = baselineOf(character.derivedBaseline);
    let characteristicValue: number;
    let characteristicValueSource: 'baseline' | 'supplied';
    if (baseline) {
      if (
        args.value !== undefined &&
        integer(args.value, 'value') !== baseline.characteristics[characteristic].value
      )
        throw new ConvexError(
          `${actor!.name}'s ${characteristic} is ${baseline.characteristics[characteristic].value} in the evaluated build; omit value= (the Director adjusts the build through review, not the roll).`,
        );
      characteristicValue = baseline.characteristics[characteristic].value;
      characteristicValueSource = 'baseline';
    } else {
      if (args.value === undefined)
        throw new ConvexError(
          `${actor!.name} has no evaluated build that supplies ${characteristic}; add value=<score> and it is recorded as a supplied fact.`,
        );
      characteristicValue = integer(args.value, 'value');
      characteristicValueSource = 'supplied';
    }
    // V159 (docs/lasting-effects-design.md#2-modifier-pipeline): "A test is a power roll"
    // (rule/dice/power-roll.md), so the tester's active power-roll modifiers apply to it. A test has
    // no target, so only the tester's own `rolls-by` modifiers count; a test is never a strike.
    const exclude = excludeList(args.exclude);
    // QC1 train 13 R2 follow-up: a modifier whose owner is already dying contributes nothing; the
    // test ends it.
    const held = character.liveState?.effectInstances ?? [];
    const lapsed = await lapsedEffects(
      ctx,
      context.campaign._id,
      { kind: 'character', id: character._id },
      held,
    );
    const contributions = rollContributions({
      actor: {
        id: actor!.id,
        instances: held.filter(i => !lapsed.some(l => l.instance.id === i.id)),
      },
      targets: [{ id: actor!.id, instances: [] }],
      roll: { strike: false, test: true },
      exclude,
    })[0]!.contributions;
    const unknown = exclude.filter(id => !contributionIds(contributions).has(id));
    if (unknown.length)
      throw new ConvexError(
        `Not an automatic contribution to this test: ${unknown.join(', ')}. effect.list names the active effects.`,
      );
    const inputs = withContributions({ targetId: actor!.id, edges, banes }, contributions);
    const consumed = consumedBy([{ contributions }]);
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
    const dice = { d10a: a!.value as TestRollResult['dice']['d10a'], d10b: b!.value as never };
    // Section 1.2: the natural roll is the dice alone.
    const naturalRoll = a!.value + b!.value;
    // Section 5: +2 when the Director agreed a skill applies.
    const skillBonus: 0 | 2 = skill ? 2 : 0;
    const edgeBane = resolveEdgeBane(inputs.edges, inputs.banes);
    const otherBonuses = inputs.bonuses ?? [];
    const bonusTotal = skillBonus + otherBonuses.reduce((sum, b) => sum + b.amount, 0);
    // Section 5 / 1.5: total = natural + characteristic + skill + other bonuses + edge/bane modifier.
    const total = naturalRoll + characteristicValue + bonusTotal + edgeBane.modifier;
    // Section 1.6: a natural 19 or 20 is tier 3 regardless of modifiers (Q-R-1 resolved).
    const criticalSuccess = naturalRoll >= 19;
    const tier: Tier = criticalSuccess ? 3 : tierOf(total, edgeBane.tierShift);
    const result: TestRollResult = {
      actorId: actor!.id,
      dice,
      naturalRoll,
      characteristic,
      characteristicValue,
      skillBonus,
      bonusTotal,
      edgeBane,
      total,
      tier,
      criticalSuccess,
      ...(difficulty
        ? { difficulty, outcome: testOutcome(tier, criticalSuccess, difficulty) }
        : {}),
    };
    const parts = [
      `${a!.value} + ${b!.value}`,
      `${characteristicValue >= 0 ? '+' : '−'} ${Math.abs(characteristicValue)} (${characteristic})`,
      skill ? `+ 2 (${skill})` : null,
      ...otherBonuses.map(b => `${b.amount >= 0 ? '+' : '−'} ${Math.abs(b.amount)} (${b.label})`),
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
    const description = `${actor!.name} tested ${characteristic}: ${parts.join(' ')} = ${total} → tier ${tier}${shift}${criticalSuccess ? ' (natural 19+)' : ''}${result.outcome ? `; ${difficulty}: ${result.outcome}` : '; the Director interprets the total'}.${contributions.length ? ` Automatic: ${contributions.map(describeContribution).join('; ')}.` : ''}`;
    return {
      kind: 'test.roll',
      description,
      dice: accepted.dice,
      data: {
        result,
        rollId: accepted.rollId,
        characteristicValueSource,
        ...(skill ? { skill } : {}),
        ...(contributions.length ? { contributions } : {}),
        ...(consumed.length ? { consumed: consumed.map(c => c.instanceId) } : {}),
      },
      // V159 (design 5a): a consumable the test qualified for is used up by it, in this operation's
      // journal, so undo of the test restores it.
      ...(consumed.length || lapsed.length
        ? {
            commit: async (mctx: MutationCtx, scope: Parameters<typeof consumeRollEffects>[1]) => {
              await endLapsedEffects(mctx, scope, lapsed);
              await consumeRollEffects(
                mctx,
                scope,
                consumed.map(c => ({
                  holder: { kind: 'character', id: character._id },
                  instanceId: c.instanceId,
                })),
                `${actor!.name}'s ${characteristic} test`,
              );
            },
          }
        : {}),
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
  execute: async (ctx, { context, actor, envelope }) => {
    const encounter = context.session ? await currentEncounter(ctx, context.session) : null;
    if (encounter?.status === 'committed')
      return {
        delegated: await run(ctx, context, {
          ...envelope,
          operation: 'ability.use',
          actor: { refKind: actor!.kind, id: actor!.id },
          arguments: { ability: 'mcdm.heroes.v1/feature.common.maneuvers/catch-breath' },
        }),
      };
    const character = await loadCharacter(ctx, context, actor!);
    const live = requireHeroLive(character);
    const baseline = requireBaseline(character);
    // Section 7: cost is one Recovery; affordable iff recoveries >= 1.
    if (live.recoveries < 1)
      throw new ConvexError(`${character.authored.name} has no Recoveries left to spend.`);
    // R02 1.3/1.4: the maximum and the recovery value come from the effective baseline; R04
    // section 7 states the same floor(max / 3), which recoveryValueOf keeps for the record.
    const staminaMaximum = baseline.staminaMaximum.value;
    const recoveryValue = baseline.recoveryValue.value;
    if (recoveryValue !== recoveryValueOf(staminaMaximum))
      throw new ConvexError('The baseline recovery value disagrees with R04 section 7; refusing.');
    // Section 7: stamina' = min(maxStamina, stamina + recoveryValue) (Q-R-3 confirmed cap); temporary unchanged.
    const staminaAfter = Math.min(staminaMaximum, live.stamina + recoveryValue);
    const healed = staminaAfter - live.stamina;
    const capApplied = live.stamina + recoveryValue > staminaMaximum;
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
      temporaryStaminaUnchanged: live.temporaryStamina,
      warnings,
    };
    const source = await requireContent(
      ctx,
      'mcdm.heroes.v1/feature.common.maneuvers/catch-breath',
    );
    const recoverySource = await requireContent(ctx, 'mcdm.heroes.v1/rule.health/recoveries');
    const sourceRecord = (entry: Doc<'content'>) => ({
      id: entry.contentId,
      name: entry.name,
      text: entry.text,
      sourcePath: entry.sourcePath,
      revision: entry.revision,
    });
    return {
      kind: 'hero.recover',
      description: `${character.authored.name} spent a Recovery (${result.recoveriesBefore} → ${result.recoveriesAfter}) and regained ${healed} Stamina (${result.staminaBefore} → ${staminaAfter}${capApplied ? ', capped at the maximum' : ''}).${warnings.length ? ` ${warnings.join(' ')}` : ''}`,
      data: {
        result,
        source: {
          ...sourceRecord(source),
          supporting: [sourceRecord(recoverySource)],
          note: 'FreePlay use: no maneuver allowance is consumed (docs/table-spec.md#v001-catch-breath).',
        },
      },
      commit: async (mctx, scope) => {
        await journalPatch(mctx, scope, 'characters', character._id, {
          liveState: { ...live, stamina: staminaAfter, recoveries: result.recoveriesAfter },
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
        const live = requireHeroLive(character);
        const before = live.conditions[name];
        if (on ? (live.manualConditions?.[name] ?? before) : !before)
          throw new ConvexError(
            `${character.authored.name} is already ${on ? '' : 'not '}${name}.`,
          );
        return {
          kind,
          description: `${character.authored.name} is ${on ? 'now' : 'no longer'} ${name}.${
            !on
              ? (live.conditionInstances ?? [])
                  .filter(instance => instance.status === 'active' && instance.condition === name)
                  .map(instance => ` Ended ${instance.actorLabel}: ${instance.abilityName}.`)
                  .join('')
              : ''
          }`,
          data: {
            creature: { kind: 'character', id: character._id },
            condition: name,
            before,
            after: on,
          },
          commit: async (mctx, scope) => {
            await setManualCondition(
              mctx,
              scope,
              { kind: 'character', id: character._id },
              name,
              on,
            );
          },
        };
      }
      const foe = await loadFoe(ctx, context, actor!);
      const before = foe.live.conditions?.[name] ?? false;
      if (on ? (foe.live.manualConditions?.[name] ?? before) : !before)
        throw new ConvexError(`${foe.name} is already ${on ? '' : 'not '}${name}.`);
      return {
        kind,
        description: `${foe.name} is ${on ? 'now' : 'no longer'} ${name}.${
          !on
            ? (foe.live.conditionInstances ?? [])
                .filter(instance => instance.status === 'active' && instance.condition === name)
                .map(instance => ` Ended ${instance.actorLabel}: ${instance.abilityName}.`)
                .join('')
            : ''
        }`,
        data: { creature: { kind: 'foe', id: foe._id }, condition: name, before, after: on },
        commit: async (mctx, scope) => {
          await setManualCondition(mctx, scope, { kind: 'foe', id: foe._id }, name, on);
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
  /** What the value means, appended to the operation description. */
  meaning?: string;
}

const ADJUSTABLE: AdjustableField[] = [
  { verb: 'stamina', label: 'Stamina', scope: 'creature' },
  { verb: 'temporary-stamina', label: 'Temporary Stamina', scope: 'creature', min: 0 },
  { verb: 'recoveries', label: 'Recoveries', scope: 'hero', min: 0 },
  { verb: 'heroic-resource', label: 'Heroic Resource', scope: 'hero', min: 0 },
  { verb: 'surges', label: 'Surges', scope: 'hero', min: 0 },
  { verb: 'victories', label: 'Victories', scope: 'hero', min: 0 },
  // V32: manual campaign XP bookkeeping; this does not award XP by rule or advance the build.
  // V191 (user ruling 2026-09-25): the value is the hero's XP bank, spent at Respite Complete.
  {
    verb: 'xp',
    label: 'XP',
    scope: 'hero',
    min: 0,
    meaning:
      " The value is the hero's XP bank: the next Respite Complete adds Victories and turns each full XP-per-level into a pending level-up. Lifetime XP is not changed.",
  },
  { verb: 'malice', label: 'Malice', scope: 'campaign', min: 0 },
];
// Q-A-200 (option A, applied): the provisional `stamina-maximum` and `recoveries-maximum` verbs
// existed only while no evaluated baseline could exist; A02 supplies the maxima from the build.

function heroField(live: HeroLive, verb: string): number {
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
    case 'xp':
      return live.xp;
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
    case 'xp':
      return { ...live, xp: value };
    default:
      throw new ConvexError(`Unknown field ${verb}.`);
  }
}

/**
 * V171 review: a manual Stamina or temporary Stamina edit that lowers the pools reaches no watcher
 * observer (it has no dealer and isn't damage the engine recorded). Watchers of the creature's
 * damage taken, winding or dying get a linked table note instead (convex/lib/watchers.ts).
 */
async function noteAdjustedDamage(
  ctx: MutationCtx,
  scope: JournalScope,
  creature: { kind: 'character' | 'foe'; id: string },
  kind: 'hero' | 'foe',
  winded: number,
  before: { stamina: number; temporaryStamina: number },
  after: { stamina: number; temporaryStamina: number },
) {
  const events = damageEvents(kind, winded, before, after);
  if (events.length)
    await noteManualWatchers(
      ctx,
      scope,
      [{ creature, events }],
      'a manual adjustment lowered its Stamina and is not recorded as damage',
    );
}

function adjustOperation(field: AdjustableField): OperationDefinition {
  const manual = (subject: string, before: number, after: number, creature: unknown): Outcome => ({
    kind: 'manual.adjustment',
    description: `Manual adjustment — ${subject} ${field.label} ${before} → ${after}.`,
    data: { field: field.verb, label: field.label, creature, before, after },
  });
  return {
    id: `adjust.${field.verb}`,
    family: 'adjust',
    verb: field.verb,
    title: `Adjust ${field.label}`,
    description: `Director edit of the persistent ${field.label} value${field.scope === 'campaign' ? ' (the shared pool)' : ''}; appends a Manual adjustment entry with the previous and new value.${field.meaning ?? ''}`,
    args: { value: v.number() },
    argDescriptions: {
      value: `The new ${field.verb === 'xp' ? 'XP bank' : field.label} value.`,
    },
    roles: ['director'],
    session: RUNNING_SESSION,
    actor: field.scope === 'campaign' ? 'none' : 'required',
    execute: async (ctx, { context, actor, args }) => {
      const value = integer(
        args.value,
        'value',
        field.verb === 'heroic-resource' ? undefined : field.min,
      );
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
      if (actor!.kind === 'squad') {
        // V02: the Director edits the shared pool as a recorded adjudication; zero defeats the
        // remaining minions (2026-09-20); minions cannot gain temporary Stamina.
        if (field.verb !== 'stamina')
          throw new ConvexError(
            `${actor!.name} is a squad with a shared Stamina pool; ${field.label} does not apply to minions.`,
          );
        const squad = await loadSquad(ctx, context.campaign._id, actor!.id as Id<'squads'>);
        assertNoPendingCasualties(squad);
        const state = poolState(squad, await squadMembers(ctx, squad));
        const outcome = manual(squad.name, squad.pool, value, {
          kind: 'squad',
          id: squad._id,
        }) as Extract<Outcome, { kind: string }>;
        return {
          ...outcome,
          description: `${outcome.description}${value === 0 && state.living.length ? ' The pool at zero defeats every remaining minion.' : ''}`,
          commit: async (mctx, scope) => {
            await writePool(mctx, scope, squad, {
              ...state,
              pool: value,
              living: value === 0 ? [] : state.living,
            });
            if (value === 0) await dropMembers(mctx, scope, state.living);
          },
        };
      }
      if (actor!.kind === 'foe') {
        if (field.scope === 'hero')
          throw new ConvexError(`${actor!.name} is a foe; foes have no ${field.label}.`);
        const foe = await loadFoe(ctx, context, actor!);
        if (foe.squadId)
          throw new ConvexError(
            `${foe.name} is a squad minion: its Stamina is the squad's shared pool (adjust it with @{squad:${foe.squadId}} /adjust stamina).`,
          );
        const key = field.verb === 'stamina' ? 'stamina' : 'temporaryStamina';
        const before = foe.live[key];
        const outcome = manual(foe.name, before, value, { kind: 'foe', id: foe._id });
        return {
          ...outcome,
          commit: async (mctx, scope) => {
            await journalPatch(mctx, scope, 'foes', foe._id, {
              live: { ...foe.live, [key]: value },
            });
            // V171 review: a manual edit isn't recorded damage; watchers of it get a table note.
            await noteAdjustedDamage(
              mctx,
              scope,
              { kind: 'foe', id: foe._id },
              'foe',
              windedValueOf(foe.maxStamina),
              { stamina: foe.live.stamina, temporaryStamina: foe.live.temporaryStamina },
              {
                stamina: key === 'stamina' ? value : foe.live.stamina,
                temporaryStamina: key === 'temporaryStamina' ? value : foe.live.temporaryStamina,
              },
            );
            // V02: a captain edited to 0 Stamina is lost to its squad (benefit reverts).
            if (key === 'stamina' && value <= 0) {
              const squad = await squadOfCaptain(mctx, foe._id);
              if (squad) await recordCaptainLoss(mctx, scope, squad, 'slain');
            }
          },
        };
      }
      const character = await loadCharacter(ctx, context, actor!);
      const live = requireHeroLive(character);
      if (field.verb === 'heroic-resource')
        integer(
          value,
          'value',
          heroicResourceFloor(baselineOf(character.derivedBaseline), live.heroicResource.name),
        );
      const before = heroField(live, field.verb);
      const outcome = manual(character.authored.name, before, value, {
        kind: 'character',
        id: character._id,
      });
      return {
        ...outcome,
        commit: async (mctx, scope) => {
          const next = withHeroField(live, field.verb, value);
          await journalPatch(mctx, scope, 'characters', character._id, { liveState: next });
          // QC1 train 13 R2 follow-up (rule/health/dying.md, "When your Stamina is 0 or lower, you
          // are dying"): an edit that takes a hero from above 0 to 0 or lower ends its
          // `owner-dying` effects, as the damage writer does. A temporary Stamina edit never
          // changes Stamina, so it can't make a hero dying (rule/health/temporary-stamina.md).
          if (live.stamina > 0 && next.stamina <= 0)
            await endOwnerDyingEffects(mctx, scope, character._id);
          // V171 review: a manual edit isn't recorded damage; watchers of it get a table note.
          const baseline = baselineOf(character.derivedBaseline);
          if (baseline && (field.verb === 'stamina' || field.verb === 'temporary-stamina'))
            await noteAdjustedDamage(
              mctx,
              scope,
              { kind: 'character', id: character._id },
              'hero',
              baseline.windedValue.value,
              { stamina: live.stamina, temporaryStamina: live.temporaryStamina },
              { stamina: next.stamina, temporaryStamina: next.temporaryStamina },
            );
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Campaign display settings.

export { DEFAULT_SETTINGS } from './audience';
import { settingsOf } from './audience';
import {
  XP_PER_LEVEL_MAX,
  XP_PER_LEVEL_MIN,
  xpPerLevelProblem,
} from '../../shared/evaluate/xpAdvancement';

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

const testDifficultyVisible: OperationDefinition = {
  id: 'campaign.test-difficulty-visible',
  family: 'campaign',
  verb: 'test-difficulty-visible',
  title: 'Show test difficulty',
  description:
    'Show or hide recorded test difficulty for players and observers, including historical tests. Public dice, workings and outcomes remain visible.',
  args: { state: v.string() },
  argDescriptions: { state: 'on or off.' },
  roles: ['director'],
  session: 'none',
  actor: 'none',
  execute: async (_ctx, { context, args }) => {
    const state = String(args.state).toLowerCase();
    if (state !== 'on' && state !== 'off') throw new ConvexError('"state" must be on or off.');
    const before = settingsOf(context.campaign);
    const settings = { ...before, showTestDifficulty: state === 'on' };
    return {
      kind: 'campaign.setting',
      description: `Show test difficulty turned ${state}.`,
      data: {
        setting: 'showTestDifficulty',
        before: before.showTestDifficulty,
        after: settings.showTestDifficulty,
      },
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

/**
 * V190 XP per level (docs/table-spec.md#respite-mode, confirmed 2026-09-25): chapter/making-a-hero.md,
 * Heroic Advancement (16 per level) and Adjusted XP Advancement (double 8, half 32, "Directors can
 * also create their own customized pace"). V191 (user ruling 2026-09-25): it applies to each hero's XP
 * bank at the next Respite Complete; nothing is retroactive or caught up, and raising it removes
 * nothing.
 */
const xpPerLevel: OperationDefinition = {
  id: 'campaign.xp-per-level',
  family: 'campaign',
  verb: 'xp-per-level',
  title: 'XP per level',
  description: `Set how much XP each level needs: 16 standard, 8 double speed, 32 half speed, or any whole number from ${XP_PER_LEVEL_MIN} to ${XP_PER_LEVEL_MAX}. Applies from the next completed respite.`,
  args: { value: v.number() },
  argDescriptions: {
    value: `XP per level, a whole number from ${XP_PER_LEVEL_MIN} to ${XP_PER_LEVEL_MAX} (16 standard).`,
  },
  roles: ['director'],
  session: 'none',
  actor: 'none',
  execute: async (_ctx, { context, args }) => {
    const value = Number(args.value);
    const problem = xpPerLevelProblem(value);
    if (problem) throw new ConvexError(problem);
    const before = settingsOf(context.campaign);
    const settings = { ...before, xpPerLevel: value };
    return {
      kind: 'campaign.setting',
      description: `XP per level set to ${value}${before.xpPerLevel === value ? ' (unchanged)' : ` (was ${before.xpPerLevel})`}; it applies from the next completed respite.`,
      data: { setting: 'xpPerLevel', before: before.xpPerLevel, after: value },
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
  testDifficultyVisible,
  healthDisplay,
  xpPerLevel,
];
