// SPDX-License-Identifier: GPL-3.0-only
/**
 * V174 damage-changing responses (docs/build/V174-damage-reactions.md,
 * docs/lasting-effects-design.md#5b-response-revision-accounting-ruling-3-option-b). Pure: the
 * whole-sentence grammar of responses that change the damage that set them off, their optional
 * Spend sections, and the revision arithmetic. Accepting such a response revises the hit
 * (docs/decisions/2026-09-24-automation-rulings.md, ruling 3, option B); the persisted revision is
 * convex/lib/damageRevisions.ts.
 *
 * Source paths are relative to the pinned Compendium `en/unified/md`:
 * - rule/general/always-round-down.md: "Whenever you divide an odd number in half and it results in
 *   a decimal, round the result down to the nearest whole number. For instance, if a tactician takes
 *   7 damage and uses the Parry ability in response—a triggered action that halves the
 *   damage—then the damage is reduced to 3."
 * - rule/damage/damage-immunity.md: "Damage immunity should be the last thing applied when
 *   calculating damage. For instance, if your hero has fire immunity 5 and takes 8 fire damage, they
 *   take 3 damage. But if an ally first halved the damage with a triggered action, your hero would
 *   take 4 damage before immunity is applied, with immunity then reducing the damage to 0."
 * - rule/damage/damage-weakness.md: "If a creature has both damage immunity and damage weakness for
 *   a source of damage, apply the weakness first, then the immunity."
 * - rule/health/temporary-stamina.md: "Whenever you take damage while you have temporary Stamina,
 *   the temporary Stamina decreases first, and any leftover damage is applied to your Stamina as
 *   usual."
 * - rule/character/potency.md: "Ability effects that have a potency are applied to a target only if
 *   the effect's potency value is higher than the target's indicated characteristic score."
 *
 * Interpretation (Q-REACT-1): the halving applies to the damage as dealt, before weakness and
 * immunity; weakness then immunity follow as for any damage. Alternative considered: halving after
 * weakness (and still before immunity, which the immunity file fixes as last).
 */
import type { DamageApplication } from '../contracts/rollResolution.ts';
import type { EffectRider } from './effectRiders.ts';
import { plain } from './abilityGrammar.ts';

/** A response sentence that revises the triggering damage to the damaged creature. */
export interface DamageRevisionClause {
  kind: 'damage-revision';
  /** `actor`: printed "You take …"; `target`: "the target takes …". The damaged creature either way. */
  subject: 'actor' | 'target';
  share: 'half';
  /** Table work printed with the revision, in printed order (movement has no map). */
  instructions: EffectRider['shape'][];
  /**
   * Parry: "If the target is you, or if you end this shift adjacent to the target". Accepting the
   * card for another creature is the table's confirmation of adjacency (there is no map).
   */
  confirm?: 'self-or-adjacent';
  /** Parry: "If the damage has any potency effect associated with it, the potency is decreased by 1." */
  potency?: 'any';
}

/** A Spend section of a damage-changing response: its cost and what it adds. */
export interface ResponseSpendClause {
  kind: 'response-spend';
  /** Whose potency a potency spend reduces ("for you", "for the target"); instructions are the user's. */
  subject: 'actor' | 'target';
  resource: string;
  amount: number;
  /** "Spend 1+ Insight": the user spends at least `amount`. */
  variable: boolean;
  effect:
    | { kind: 'potency'; scope: 'one' | 'any' }
    | { kind: 'instruction'; shape: EffectRider['shape'] };
  /** The printed cost label ("Spend 1 Discipline"). */
  cost: string;
}

const revision = (
  subject: DamageRevisionClause['subject'],
  instructions: DamageRevisionClause['instructions'],
  extra: Partial<Pick<DamageRevisionClause, 'confirm' | 'potency'>> = {},
): DamageRevisionClause => ({
  kind: 'damage-revision',
  subject,
  share: 'half',
  instructions,
  ...extra,
});

/**
 * Whole-sentence patterns (display markup removed), each citing its source. A whole-section pattern
 * precedes any pattern that matches its first sentence. Each needs a `damage-taken` trigger whose
 * subject is the creature the sentence names (shared/resolve/effectOnly.ts checks it).
 */
export const EFFECT_ONLY_REVISIONS: readonly {
  pattern: RegExp;
  read: () => DamageRevisionClause;
  singleTarget?: true;
}[] = [
  // feature/ability/tactician/level-1/parry.md, the whole Effect section.
  {
    pattern:
      /^You can shift 1 square\. If the target is you, or if you end this shift adjacent to the target, the target takes half the damage\. If the damage has any potency effect associated with it, the potency is decreased by 1\./,
    read: () => revision('target', ['shift'], { confirm: 'self-or-adjacent', potency: 'any' }),
    singleTarget: true,
  },
  // feature/ability/shadow/level-1/defensive-roll.md, the whole Effect section. The Hide maneuver
  // (feature/common/maneuvers/hide) is the user's own later use.
  {
    pattern:
      /^You take half the triggering damage, then can shift up to 2 squares after the triggering effect resolves\. If you end this shift with concealment or cover, you can use the Hide maneuver even if you are observed\./,
    read: () => revision('actor', ['shift', 'ability-use']),
  },
  // feature/ability/shadow/level-1/in-all-this-confusion.md.
  {
    pattern:
      /^You take half the damage, then can teleport up to 4 squares after the triggering effect resolves\./,
    read: () => revision('actor', ['teleport']),
  },
  // feature/ability/fury/level-1/unearthly-reflexes.md.
  {
    pattern:
      /^You take half the damage from the triggering effect and can shift up to a number of squares equal to your Agility score\./,
    read: () => revision('actor', ['shift']),
  },
  // feature/ability/null/level-1/inertial-shield.md.
  { pattern: /^You take half the damage\./, read: () => revision('actor', []) },
  // feature/ability/elementalist/level-1/skin-like-castle-walls.md.
  {
    pattern: /^The target takes half the damage\./,
    read: () => revision('target', []),
    singleTarget: true,
  },
];

/** Printed Spend sections of these responses, read whole with their cost label. */
const SPENDS: readonly {
  text: string;
  subject: ResponseSpendClause['subject'];
  effect: ResponseSpendClause['effect'];
  variable?: true;
}[] = [
  // feature/ability/null/level-1/inertial-shield.md (Spend 1 Discipline).
  {
    text: 'The potency of one effect associated with the damage is reduced by 1 for you.',
    subject: 'actor',
    effect: { kind: 'potency', scope: 'one' },
  },
  // feature/ability/elementalist/level-1/skin-like-castle-walls.md (Spend 1 Essence).
  {
    text: 'If the damage has any potency effects associated with it, the potency is reduced by 1 for the target.',
    subject: 'target',
    effect: { kind: 'potency', scope: 'any' },
  },
  // feature/ability/fury/level-1/unearthly-reflexes.md (Spend 1 Ferocity).
  {
    text: 'If the damage has any potency effects associated with it, the potency is reduced by 1 for you.',
    subject: 'actor',
    effect: { kind: 'potency', scope: 'any' },
  },
  // feature/ability/shadow/level-1/defensive-roll.md (Spend 1 Insight).
  {
    text: 'The potency of any effects associated with the damage are reduced by 1 for you.',
    subject: 'actor',
    effect: { kind: 'potency', scope: 'any' },
  },
  // feature/ability/shadow/level-1/in-all-this-confusion.md (Spend 1+ Insight).
  {
    text: 'You teleport 1 additional square for each insight spent.',
    subject: 'actor',
    effect: { kind: 'instruction', shape: 'teleport' },
    variable: true,
  },
  // feature/ability/tactician/level-1/parry.md (Spend 1 Focus). Distance has no map: the card
  // already names it as the table's confirmation; the longer shift is table work.
  {
    text: "This ability's distance becomes Melee 1 + your Reason score, and you can shift up to a number of squares equal to your Reason score instead of 1 square.",
    subject: 'actor',
    effect: { kind: 'instruction', shape: 'shift' },
  },
];

const normalize = (text: string) => plain(text).replace(/\s+/g, ' ').trim();

/** Reads one whole Spend section of a damage-changing response, or `undefined`. */
export function responseSpend(cost: string, text: string): ResponseSpendClause | undefined {
  const label = /^Spend (\d+)(\+?) ([A-Za-z]+)$/.exec(normalize(cost));
  const amount = Number(label?.[1]);
  if (!label || !Number.isSafeInteger(amount) || amount < 1) return undefined;
  const body = normalize(text);
  const known = SPENDS.find(entry => entry.text === body);
  if (!known || (known.variable === true) !== (label[2] === '+')) return undefined;
  // "for each insight spent" names the resource the label spends.
  if (known.variable && !body.includes(`each ${label[3]!.toLowerCase()} spent`)) return undefined;
  return {
    kind: 'response-spend',
    subject: known.subject,
    resource: label[3]!.toLowerCase(),
    amount,
    variable: label[2] === '+',
    effect: known.effect,
    cost: normalize(cost),
  };
}

/** Two spend clauses read from the same printed section are the same, field by field. */
export function sameResponseSpend(a: ResponseSpendClause, b: ResponseSpendClause): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---------------------------------------------------------------------------------------------
// Revision arithmetic.

/** Stamina and temporary Stamina a damage application took (after immunity and weakness). */
export function damageTaken(application: DamageApplication): number {
  return application.absorbedByTemporaryStamina + application.staminaDelta;
}

/**
 * The hit recomputed with half the damage, from the same starting pools and the same weakness and
 * immunity values it met (Q-REACT-1: halve, then weakness, then immunity). Zero damage is not
 * damage taken (Q-RES-4), so weakness adds nothing to it. `current` is the hit's current accepted
 * revision (design 5b: a second response recomputes from it, never from the original).
 */
export function halveApplication(
  current: DamageApplication,
  kind: 'hero' | 'foe',
): DamageApplication {
  const incoming = Math.floor(current.incoming / 2);
  const weaknessApplied = incoming > 0 ? current.weaknessApplied : 0;
  const afterWeakness = incoming + weaknessApplied;
  const immunity = current.immunityApplied;
  const afterImmunity = immunity === 'all' ? 0 : Math.max(0, afterWeakness - immunity);
  const absorbed = Math.min(current.temporaryStaminaBefore, afterImmunity);
  const staminaDelta = afterImmunity - absorbed;
  const staminaAfter = current.staminaBefore - staminaDelta;
  const revised: DamageApplication = {
    targetId: current.targetId,
    incoming,
    weaknessApplied,
    immunityApplied: immunity,
    afterImmunity,
    absorbedByTemporaryStamina: absorbed,
    temporaryStaminaBefore: current.temporaryStaminaBefore,
    temporaryStaminaAfter: current.temporaryStaminaBefore - absorbed,
    staminaDelta,
    staminaBefore: current.staminaBefore,
    staminaAfter,
    windedValue: current.windedValue,
    windedBefore: current.windedBefore,
    // rule/health/winded.md: "equal to or less than your winded value".
    windedAfter: staminaAfter <= current.windedValue,
  };
  if (kind === 'foe') revised.slain = staminaAfter <= 0;
  else {
    revised.dying = staminaAfter <= 0;
    revised.deadThresholdReached = staminaAfter <= -current.windedValue;
  }
  return revised;
}

/** What the revision gives back: never negative, since half the damage never takes more. */
export function revisionDelta(current: DamageApplication, revised: DamageApplication) {
  return {
    stamina: revised.staminaAfter - current.staminaAfter,
    temporaryStamina: revised.temporaryStaminaAfter - current.temporaryStaminaAfter,
  };
}

export type DamageEvent = 'damage-taken' | 'made-winded' | 'dying' | 'dead';

/**
 * The events a hit made true for the damaged creature, from the pools before and after it:
 * damage taken (Q-RES-4: more than 0), made winded (rule/health/winded.md), dying and dead for a hero
 * (rule/health/dying.md: dying at 0 or lower, dead at the negative of the winded value).
 */
export function hitEvents(application: DamageApplication, kind: 'hero' | 'foe'): DamageEvent[] {
  const events: DamageEvent[] = [];
  if (damageTaken(application) > 0) events.push('damage-taken');
  const winded = application.windedValue;
  if (application.staminaBefore > winded && application.staminaAfter <= winded)
    events.push('made-winded');
  if (kind === 'hero' && application.staminaBefore > 0 && application.staminaAfter <= 0)
    events.push('dying');
  if (kind === 'hero' && application.staminaBefore > -winded && application.staminaAfter <= -winded)
    events.push('dead');
  return events;
}

/** Events the original hit made true that the revised hit no longer does (design 5b "Reversal"). */
export function eventsNoLongerTrue(
  current: DamageApplication,
  revised: DamageApplication,
  kind: 'hero' | 'foe',
): DamageEvent[] {
  const after = hitEvents(revised, kind);
  return hitEvents(current, kind).filter(event => !after.includes(event));
}

/**
 * Design 5b "Reversal" and "Attribution": the part of a reversed gain still in the pool, counting
 * the most recent gains as spent first. Spending since the gain is charged to gains made after it
 * before this one, so what remains of it is the pool's rise above its level just before the gain,
 * up to the gain (the open accounting choice the design names, not a rules claim). The pool never
 * goes below its floor.
 */
export function unspentGain(input: {
  current: number;
  /** The pool right after the gain (the `resource.triggered` entry's `after`). */
  afterGain: number;
  gain: number;
  floor: number;
}): { reversed: number; spent: number } {
  const remaining = Math.min(
    input.gain,
    Math.max(0, input.current - (input.afterGain - input.gain)),
  );
  const reversed = Math.max(0, Math.min(remaining, input.current - input.floor));
  return { reversed, spent: input.gain - reversed };
}

/** One potency condition the hit applied or resisted on the damaged creature. */
export interface PotencyEffect {
  /** The condition occurrence (its instance id). */
  id: string;
  /** Conditions of one printed clause share it (V153 group, else the clause node). */
  effect: string;
  condition: string;
  status: string;
  threshold?: number;
  targetScore?: number;
}

/**
 * The hit's potency effects re-checked with the potency reduced by 1 (rule/character/potency.md:
 * applied only if the potency value is higher than the score). Only an applied effect can change:
 * a lower potency never imposes one that was resisted. `scope: 'one'` reduces one effect's potency,
 * which the user picks (`choice`, a condition name) when more than one would change.
 */
export function potencyRevision(
  effects: readonly PotencyEffect[],
  scope: 'one' | 'any',
  choice?: string,
):
  | { kind: 'none' }
  | { kind: 'revised'; ended: PotencyEffect[]; unchanged: PotencyEffect[] }
  | { kind: 'choose'; options: string[] }
  | { kind: 'unknown-choice'; options: string[] } {
  const potency = effects.filter(
    e => Number.isSafeInteger(e.threshold) && Number.isSafeInteger(e.targetScore),
  );
  if (!potency.length) return { kind: 'none' };
  const changes = (e: PotencyEffect) =>
    e.status === 'applied' && !(e.targetScore! < e.threshold! - 1);
  const groups = [...new Set(potency.map(e => e.effect))];
  let chosen = groups;
  if (scope === 'one') {
    const changing = groups.filter(g => potency.some(e => e.effect === g && changes(e)));
    const label = (g: string) =>
      potency
        .filter(e => e.effect === g)
        .map(e => e.condition)
        .join(' and ');
    if (choice !== undefined) {
      const picked = groups.filter(
        g => label(g) === choice || potency.some(e => e.effect === g && e.condition === choice),
      );
      if (picked.length !== 1) return { kind: 'unknown-choice', options: groups.map(label) };
      chosen = picked;
    } else if (changing.length > 1) return { kind: 'choose', options: changing.map(label) };
    else chosen = changing.length ? changing : groups.slice(0, 1);
  }
  const inScope = potency.filter(e => chosen.includes(e.effect));
  return {
    kind: 'revised',
    ended: inScope.filter(changes),
    unchanged: inScope.filter(e => !changes(e)),
  };
}
