// SPDX-License-Identifier: GPL-3.0-only
/**
 * V159 modifiers from lasting effects (docs/build/V159-modifiers.md, docs/lasting-effects-design.md
 * sections 1, 2 and 5a). Pure: the whole-sentence grammar of modifier sentences, binding a printed
 * amount at use, the automatic contributions of a subject's active modifier instances to one roll
 * (printed stacking, then the table's exclusions), the roll inputs they give, and derived values
 * (speed, stability, saving throws). There is no substring or ability-name dispatch.
 *
 * Source paths are relative to the pinned Compendium `en/unified/md`; the stacking rule is printed
 * in `en/books/heroes/clean/Draw Steel Heroes.md`, "Stacking Unique Effects".
 */
import type { TargetRollInputs } from '../contracts/rollResolution.ts';
import type {
  DamageModifier,
  EffectDuration,
  EffectEndTrigger,
  EffectInstance,
  ModifierPayload,
  RollModifier,
  StatModifier,
} from '../contracts/liveState.ts';
import type { Characteristic } from './abilityGrammar.ts';
import { effectiveAggregate } from './lastingEffects.ts';
import { markEdgeConditions, ownerOrAlly, type MarkParty } from './marks.ts';

/** A printed stat amount is a number, or "equal to your <characteristic> score" bound at use. */
export type PrintedStatModifier = Omit<StatModifier, 'amount'> & {
  amount: number | { characteristic: Characteristic };
};
/** V179: a granted immunity or weakness prints its value (shared/resolve/damageModifiers.ts). */
export type PrintedModifier = RollModifier | PrintedStatModifier | DamageModifier;

/**
 * One modifier read from a whole printed sentence: what it changes, whose it is (`target`: the
 * target or each target; `owner`: the user), how long it lasts and whether a roll consumes it.
 */
export interface ModifierSpec {
  effect: 'modifier';
  subject: 'target' | 'owner';
  modifier: PrintedModifier;
  duration: EffectDuration;
  endsWhen: EffectEndTrigger[];
  /** Design 5a: used up by the first qualifying roll, even when banes cancel its benefit. */
  consumeOn?: { event: 'power-roll' | 'ability-roll' };
  /** The printed sentence, display markup removed. */
  text: string;
}

const LETTERS: Record<string, Characteristic> = {
  Might: 'M',
  Agility: 'A',
  Reason: 'R',
  Intuition: 'I',
  Presence: 'P',
};
const CHARACTERISTIC = '(Might|Agility|Reason|Intuition|Presence)';

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();

/**
 * Whole Effect sections of rolled abilities that are one modifier sentence. Matched whole: an
 * added or changed sentence is not a modifier the engine applies and stays manual.
 */
const SECTIONS: readonly { pattern: RegExp; read: (text: string) => ModifierSpec }[] = [
  // kit/raider.md and feature/ability/raider/raiders-awe.md (Raider's Awe): "The target takes a
  // bane on their next power roll made before the end of their next turn." A consumable bane on
  // the target's own next power roll (design 5a), expiring at the end of the target's next turn
  // (rule/combat/end-of-turn.md; the subject-anchored duration V158 binds).
  {
    pattern:
      /^The target takes a bane on their next power roll made before the end of their next turn\.$/,
    read: text => ({
      effect: 'modifier',
      subject: 'target',
      modifier: { kind: 'roll', target: 'rolls-by', scope: 'power-roll', banes: 1 },
      duration: { kind: 'end-of-next-turn', anchor: 'subject' },
      endsWhen: [],
      consumeOn: { event: 'power-roll' },
      text,
    }),
  },
];

/** Reads one whole Effect section of a rolled ability as a modifier, or `undefined`. */
export function sectionModifier(section: string): ModifierSpec | undefined {
  const text = normalize(section);
  const found = SECTIONS.find(entry => entry.pattern.test(text));
  return found?.read(text);
}

/**
 * Sentences of abilities without a power roll (V157 effect-only sections) that are one modifier.
 * Each pattern is anchored at the start and ends at the sentence's full stop; the effect-only
 * reader consumes the section sentence by sentence. `each target` suits any target count.
 */
export const EFFECT_ONLY_MODIFIERS: readonly {
  pattern: RegExp;
  read: (match: RegExpExecArray) => ModifierSpec | undefined;
}[] = [
  // feature/ability/tactician/level-2/squad-on-me.md: "Until the start of your next turn, each
  // target has a bonus to stability equal to your Might score." rule/character/stability.md;
  // the owner-anchored start of the next turn is a duration V158 binds.
  {
    pattern: new RegExp(
      `^Until the start of your next turn, each target has a bonus to stability equal to your ${CHARACTERISTIC} score\\.`,
    ),
    read: match => ({
      effect: 'modifier',
      subject: 'target',
      modifier: {
        kind: 'stat',
        stat: 'stability',
        amount: { characteristic: LETTERS[match[1]!]! },
      },
      duration: { kind: 'start-of-next-turn', anchor: 'owner' },
      endsWhen: [],
      text: match[0],
    }),
  },
];

/** Reads one stored effect-only sentence as exactly one admitted modifier, or `undefined`. */
export function effectOnlyModifier(sentence: string): ModifierSpec | undefined {
  const text = normalize(sentence);
  for (const { pattern, read } of EFFECT_ONLY_MODIFIERS) {
    const match = pattern.exec(text);
    if (match && match[0] === text) return read(match);
  }
  return undefined;
}

/** Stable text of a value with sorted keys, so stored and re-read specs compare field by field. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

/** Two specs read from the same printed sentence are the same, field by field (tamper check). */
export function sameModifierSpec(a: ModifierSpec, b: ModifierSpec): boolean {
  return canonical(a) === canonical(b);
}

/**
 * Binds a printed amount at use. A characteristic score comes from the user (the owner, "your").
 * Interpretation (labelled): a bonus "equal to your <characteristic> score" for a score below 0 is
 * not established by the source (a negative bonus is a penalty), so such a use stays manual rather
 * than applying a penalty or a bonus of 0; the alternatives are applying the negative score, or
 * clamping it to 0.
 */
export function bindModifier(
  printed: PrintedModifier,
  characteristics: Partial<Record<Characteristic, number>> | undefined,
): { payload: ModifierPayload } | { requirement: string } {
  if (printed.kind === 'roll' || printed.kind === 'damage-modifier')
    return { payload: { ...printed } };
  if (typeof printed.amount === 'number')
    return { payload: { ...printed, amount: printed.amount } };
  const letter = printed.amount.characteristic;
  const score = characteristics?.[letter];
  if (score === undefined || !Number.isSafeInteger(score))
    return { requirement: `actor.characteristics.${letter}` };
  if (score < 0)
    return {
      requirement: `actor.characteristics.${letter} is below 0: a bonus equal to it is not established; the table decides`,
    };
  return { payload: { kind: 'stat', stat: printed.stat, amount: score } };
}

/** Plain text of a bound modifier, for the log and sheets. */
export function describeModifier(payload: ModifierPayload): string {
  // V179: "damage weakness 5" for the untyped entry, "fire weakness 3" for a typed one.
  if (payload.kind === 'damage-modifier')
    return `${payload.damageType === 'all-damage' ? 'damage' : payload.damageType} ${payload.defense} ${payload.value}`;
  if (payload.kind === 'stat') {
    const name = { speed: 'speed', stability: 'stability', 'saving-throw': 'saving throws' }[
      payload.stat
    ];
    return `${payload.amount >= 0 ? '+' : '−'}${Math.abs(payload.amount)} ${name}`;
  }
  const parts = [
    payload.edges ? `${payload.edges === 2 ? 'a double edge' : `${payload.edges} edge`}` : '',
    payload.banes ? `${payload.banes === 2 ? 'a double bane' : `${payload.banes} bane`}` : '',
    payload.bonus ? `${payload.bonus > 0 ? '+' : '−'}${Math.abs(payload.bonus)}` : '',
  ].filter(Boolean);
  const scope = { 'power-roll': 'power rolls', 'ability-roll': 'ability rolls', strike: 'strikes' }[
    payload.scope
  ];
  return `${parts.join(' and ')} on ${scope} ${payload.target === 'rolls-by' ? 'it makes' : 'made against it'}`;
}

// ---------------------------------------------------------------------------------------------
// Rolls (design section 2).

/** What the engine knows about one roll: whether it is a strike, and whether it is a test. */
export interface RollFacts {
  strike: boolean;
  /** A test is a power roll but not an ability roll (rule/dice/power-roll.md). */
  test?: boolean;
}

/**
 * One automatic contribution to one target's roll: an ability's effective modifier after printed
 * stacking. `sources` are every active matching instance of that ability (the same ability doesn't
 * stack); `consumes` are the consumable ones among them, which the roll uses up.
 */
export interface RollContribution {
  instanceId: string;
  sources: string[];
  consumes: string[];
  abilityId: string;
  abilityName: string;
  /** The owner who used the ability. */
  actorLabel: string;
  sourcePath: string;
  text: string;
  /** `actor`: a modifier on the rolls the user makes; `target`: on rolls made against the target. */
  side: 'actor' | 'target';
  /** The creature holding the modifier. */
  subjectId: string;
  edges: number;
  banes: number;
  bonus: number;
  /** The table's override: not applied to this roll (design section 2, `exclude`). */
  excluded?: true;
  /**
   * Set once, when the roll is made: this roll used up the consumables in `consumes` (design 5a).
   * A later correction's exclusion never clears it, so re-including it is not a new consumption.
   */
  usedUp?: true;
}

/**
 * Whether a stored instance is about the creature holding it. An instance is held by its subject
 * when the subject is a hero or foe (convex/lib/effectInstances.ts holderOf); an object's or
 * squad's effect is held by its owner and never modifies the owner. The subject kind is checked
 * rather than its id, which a history restoration may have re-aliased.
 */
const aboutHolder = (instance: EffectInstance) =>
  instance.subject.kind === 'character' || instance.subject.kind === 'foe';

type RollInstance = EffectInstance & {
  payload: { kind: 'modifier'; text: string; modifier: RollModifier };
};

function rollModifiersOf(
  instances: readonly EffectInstance[],
  side: 'actor' | 'target',
  roll: RollFacts,
): RollInstance[] {
  return instances.filter((instance): instance is RollInstance => {
    // V158 R1b: an unresolved same-ability group is the table's; never apply it automatically.
    if (instance.status !== 'active' || instance.kind !== 'modifier' || instance.manualStacking)
      return false;
    if (!aboutHolder(instance) || instance.payload.kind !== 'modifier') return false;
    const modifier = instance.payload.modifier;
    if (modifier.kind !== 'roll') return false;
    if (modifier.target !== (side === 'actor' ? 'rolls-by' : 'rolls-against')) return false;
    // rule/dice/power-roll.md: every ability roll is a power roll; `strike` needs a strike.
    if (modifier.scope === 'ability-roll') return !roll.test;
    return modifier.scope !== 'strike' || roll.strike;
  });
}

const impact = (modifier: RollModifier) =>
  (modifier.edges ?? 0) + (modifier.banes ?? 0) + Math.abs(modifier.bonus ?? 0);

function aggregate(
  instances: RollInstance[],
  side: 'actor' | 'target',
  subjectId: string,
  excluded: boolean,
): RollContribution[] {
  // "Stacking Unique Effects": one group per ability, whoever used it; the most impactful applies.
  const { groups } = effectiveAggregate(instances, { impact: payload => impact(payload.modifier) });
  const consumable = new Set(instances.filter(i => i.consumeOn).map(i => i.id));
  return groups.map(group => {
    const applies = instances.find(instance => instance.id === group.applies.id)!;
    const modifier = applies.payload.modifier;
    return {
      instanceId: applies.id,
      sources: group.sources,
      consumes: instances
        .filter(instance => group.sources.includes(instance.id) && instance.consumeOn)
        .map(instance => instance.id),
      abilityId: applies.abilityId,
      abilityName: applies.abilityName,
      actorLabel: applies.actorLabel,
      sourcePath: applies.sourcePath,
      text: applies.payload.text,
      side,
      subjectId,
      edges: modifier.edges ?? 0,
      banes: modifier.banes ?? 0,
      bonus: modifier.bonus ?? 0,
      ...(excluded ? { excluded: true as const } : {}),
      ...(!excluded && group.sources.some(id => consumable.has(id))
        ? { usedUp: true as const }
        : {}),
    };
  });
}

/**
 * The automatic contributions to each target's roll (design section 2): the actor's `rolls-by`
 * modifiers apply to the shared roll against every target, and each target's `rolls-against`
 * modifiers to its own. Instances the table excludes are recorded as excluded contributions and
 * never applied.
 */
export function rollContributions(input: {
  actor: { id: string; instances: readonly EffectInstance[] };
  targets: readonly { id: string; name?: string; instances: readonly EffectInstance[] }[];
  roll: RollFacts;
  exclude?: readonly string[];
  /** V175: the roller's side, for the Mark edge ("you and allies"); absent, no Mark edge applies. */
  roller?: MarkParty;
}): { targetId: string; contributions: RollContribution[] }[] {
  const exclude = new Set(input.exclude ?? []);
  const side = (
    subjectId: string,
    instances: readonly EffectInstance[],
    which: 'actor' | 'target',
  ) => {
    const matching = rollModifiersOf(instances, which, input.roll);
    return [
      ...aggregate(
        matching.filter(instance => !exclude.has(instance.id)),
        which,
        subjectId,
        false,
      ),
      ...aggregate(
        matching.filter(instance => exclude.has(instance.id)),
        which,
        subjectId,
        true,
      ),
    ];
  };
  const actor = side(input.actor.id, input.actor.instances, 'actor');
  return input.targets.map(target => ({
    targetId: target.id,
    contributions: [
      ...actor,
      ...side(target.id, target.instances, 'target'),
      ...markEdge(target, input.roll, input.roller, exclude),
    ],
  }));
}

/**
 * V175, feature/ability/tactician/level-1/mark.md: "While a creature marked by you is within your
 * line of effect, you and allies within your line of effect gain an edge on power rolls made against
 * that creature." One edge for a roll against a marked creature by its marker or the marker's ally
 * (rule/combat/side.md), whichever ability marked it: the mark is one status, so it counts once
 * ("Stacking Unique Effects": the same effect doesn't stack), and another Tactician's mark on the
 * creature has already ended (convex/lib/marks.ts). Tests are power rolls without a target
 * (rule/dice/power-roll.md), so they never get it. Line of effect has no map: both printed
 * conditions label the contribution, and the table's `exclude` rejects it when either fails.
 */
function markEdge(
  target: { id: string; name?: string; instances: readonly EffectInstance[] },
  roll: RollFacts,
  roller: MarkParty | undefined,
  exclude: ReadonlySet<string>,
): RollContribution[] {
  if (!roller || roll.test) return [];
  const mark = [...target.instances]
    .filter(
      instance =>
        instance.kind === 'mark' &&
        instance.status === 'active' &&
        !instance.manualStacking &&
        instance.payload.kind === 'mark' &&
        instance.owner.kind === 'character' &&
        ownerOrAlly({ id: instance.owner.id, side: 'heroes' }, roller),
    )
    .sort((a, b) => b.appliedSequence - a.appliedSequence)[0];
  if (!mark) return [];
  const subject = target.name ?? mark.subject.name;
  return [
    {
      instanceId: mark.id,
      sources: [mark.id],
      consumes: [],
      abilityId: mark.abilityId,
      abilityName: mark.abilityName,
      actorLabel: mark.actorLabel,
      sourcePath: mark.sourcePath,
      text: `an edge on power rolls against ${subject}, marked by ${mark.actorLabel}: ${markEdgeConditions(mark.actorLabel, subject)}`,
      side: 'target',
      subjectId: target.id,
      edges: 1,
      banes: 0,
      bonus: 0,
      ...(exclude.has(mark.id) ? { excluded: true as const } : {}),
    },
  ];
}

/** Every instance id a set of contributions names, applied or excluded. */
export function contributionIds(contributions: readonly RollContribution[]): Set<string> {
  return new Set(contributions.flatMap(c => [c.instanceId, ...c.sources]));
}

/** The label a bonus carries on the roll breakdown. */
export const contributionLabel = (c: RollContribution) => `${c.actorLabel}'s ${c.abilityName}`;

/**
 * One target's roll inputs: the table's circumstance edges and banes plus every applied
 * contribution (design section 2: circumstance and automatic contributions add; the double edge
 * and bane caps apply after all sources are summed, in resolveEdgeBane). Bonuses and penalties add
 * together before edges and banes (rule/dice/bonuses-and-penalties.md).
 */
export function withContributions(
  circumstance: { targetId: string; edges: number; banes: number },
  contributions: readonly RollContribution[] | undefined,
): TargetRollInputs {
  const applied = (contributions ?? []).filter(c => !c.excluded);
  const bonuses = applied
    .filter(c => c.bonus !== 0)
    .map(c => ({ label: contributionLabel(c), amount: c.bonus }));
  return {
    targetId: circumstance.targetId,
    edges: circumstance.edges + applied.reduce((sum, c) => sum + c.edges, 0),
    banes: circumstance.banes + applied.reduce((sum, c) => sum + c.banes, 0),
    ...(bonuses.length ? { bonuses } : {}),
  };
}

/**
 * The consumable instances a roll uses up (design 5a): every consumable source of an applied
 * contribution, once, even when banes cancel its benefit. Interpretation (labelled): an excluded
 * contribution is one the table says does not apply to this roll, so the roll does not qualify
 * and nothing of it is consumed; the alternative, consuming it anyway, would spend an effect the
 * table ruled out.
 */
export function consumedBy(
  perTarget: readonly { contributions: readonly RollContribution[] }[],
): { instanceId: string; subjectId: string }[] {
  const out = new Map<string, string>();
  for (const { contributions } of perTarget)
    for (const c of contributions)
      if (!c.excluded) for (const id of c.consumes) out.set(id, c.subjectId);
  return [...out].map(([instanceId, subjectId]) => ({ instanceId, subjectId }));
}

/** "1 bane from Ash's Raider's Awe" for the log. */
export function describeContribution(c: RollContribution): string {
  const parts = [
    c.edges
      ? `${c.edges === 2 ? 'double edge' : `${c.edges} edge${c.edges === 1 ? '' : 's'}`}`
      : '',
    c.banes
      ? `${c.banes === 2 ? 'double bane' : `${c.banes} bane${c.banes === 1 ? '' : 's'}`}`
      : '',
    c.bonus ? `${c.bonus > 0 ? '+' : '−'}${Math.abs(c.bonus)}` : '',
  ].filter(Boolean);
  return `${parts.join(' and ') || 'no change'} from ${contributionLabel(c)}${c.consumes.length ? ' (next roll)' : ''}${c.excluded ? ' — excluded by the table' : ''}`;
}

// ---------------------------------------------------------------------------------------------
// Derived values.

export interface StatContribution {
  instanceId: string;
  abilityName: string;
  actorLabel: string;
  sourcePath: string;
  amount: number;
}

/**
 * The effect part of a derived value on one creature, with its sources: the printed stacking
 * aggregate of the active `stat` modifiers it holds (one group per ability; the most impactful
 * amount of each; groups add). Base values are the caller's; the total is base plus this.
 */
export function statModifiers(
  instances: readonly EffectInstance[],
  stat: StatModifier['stat'],
): { total: number; contributions: StatContribution[] } {
  type StatInstance = EffectInstance & {
    payload: { kind: 'modifier'; text: string; modifier: StatModifier };
  };
  const matching = instances.filter(
    (instance): instance is StatInstance =>
      instance.status === 'active' &&
      // V158 R1b: an unresolved same-ability group is the table's; never apply it automatically.
      !instance.manualStacking &&
      instance.kind === 'modifier' &&
      aboutHolder(instance) &&
      instance.payload.kind === 'modifier' &&
      instance.payload.modifier.kind === 'stat' &&
      instance.payload.modifier.stat === stat,
  );
  const { groups } = effectiveAggregate(matching, {
    impact: payload => Math.abs(payload.modifier.amount),
  });
  const contributions = groups.map(group => {
    const applies = matching.find(instance => instance.id === group.applies.id)!;
    return {
      instanceId: applies.id,
      abilityName: applies.abilityName,
      actorLabel: applies.actorLabel,
      sourcePath: applies.sourcePath,
      amount: applies.payload.modifier.amount,
    };
  });
  return { total: contributions.reduce((sum, c) => sum + c.amount, 0), contributions };
}

/**
 * A derived value on one creature: its base plus its active effects (statModifiers), with the
 * sources. rule/character/stability.md: "A creature's stability can't be less than 0, even when
 * reduced by a penalty." Speed is table movement, shown as base plus effects
 * (rule/character/speed.md).
 */
export function derivedValue(
  base: number,
  instances: readonly EffectInstance[],
  stat: 'speed' | 'stability',
): { value: number; contributions: StatContribution[] } {
  const { total, contributions } = statModifiers(instances, stat);
  const value = base + total;
  return { value: stat === 'stability' ? Math.max(0, value) : value, contributions };
}
