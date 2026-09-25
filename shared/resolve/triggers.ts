// SPDX-License-Identifier: GPL-3.0-only
/**
 * V173 triggered actions (docs/build/V173-triggered-actions.md,
 * docs/lasting-effects-design.md#4-triggered-actions-and-reactions). Pure: the whole-sentence
 * grammar of Trigger sections the engine observes, which creature a trigger names as the target of
 * the response, and whether an owner may still take the response. There is no substring or
 * ability-name dispatch.
 *
 * Source paths are relative to the pinned Compendium `en/unified/md`. The governing rule is
 * rule/combat/triggered-action.md:
 * - "You can use one triggered action per round … but only when the action's trigger occurs."
 * - "A free triggered action follows the same rules as a triggered action, but it doesn't count
 *   against your limit of one triggered action per round."
 * - "If multiple triggered actions occur in response to the same trigger, any heroes and other
 *   player-controlled creatures … decide among themselves which of those triggered actions are
 *   resolved first. Then the Director decides the same for creatures they control."
 * - "Any effect that prevents you from using triggered actions also prevents you from using free
 *   triggered actions."
 */
import type { ActionType } from '../contracts/rollResolution.ts';
import { plain } from './abilityGrammar.ts';

/**
 * The events observed for triggers: the damage writer's (V173, convex/lib/watchers.ts) and V202's
 * clock turn boundaries (convex/lib/clock.ts dispatchBoundary).
 */
export type TriggerEvent = 'damage-taken' | 'damage-dealt' | 'turn-start' | 'turn-end';

/**
 * One Trigger section the engine observes.
 * - `whose`: the creature the event is about. `target`: the creature this ability would target
 *   (the damaged creature for `damage-taken`, the dealer for `damage-dealt`, the creature whose turn
 *   it is for a turn boundary); `owner`: the user. V202 turn boundaries only: `enemy`, an enemy of
 *   the owner; `other-hero`, a hero other than the owner.
 * - `damaged` (`damage-dealt` only): who the dealer damaged, relative to the owner.
 * - `dealer` (`damage-taken` only): `known` needs a creature that dealt the damage; `other` needs
 *   one other than the damaged creature.
 * - `from` (`damage-taken` only): the damage came from a melee strike.
 * - V202 `orDamageTaken` (turn boundaries only): the sentence also names the target taking damage
 *   ("The target starts their turn or takes damage."), which the damage writer observes as a
 *   `damage-taken` of the target.
 * - V202 `within` (turn boundaries only): the printed distance of the creature whose turn it is,
 *   which the table confirms (there is no map).
 * - V202 `notStartedByThis` (turn boundaries only): the creature whose turn ended must not have
 *   used this same ability to start that turn.
 */
export interface TriggerSpec {
  effect: 'trigger';
  event: TriggerEvent;
  whose: 'target' | 'owner' | 'enemy' | 'other-hero';
  damaged?: 'ally' | 'another' | 'any';
  dealer?: 'known' | 'other';
  from?: 'melee-strike';
  orDamageTaken?: true;
  within?: number;
  notStartedByThis?: true;
  /** The printed sentence, display markup removed. */
  text: string;
}

const normalize = (text: string) => plain(text).replace(/\s+/g, ' ').trim();

/**
 * Whole Trigger sections the engine observes. Matched whole: an added or changed sentence is not
 * a trigger the engine offers, and the ability stays a manual triggered action.
 */
const TRIGGERS: readonly { text: string; spec: Omit<TriggerSpec, 'effect' | 'text'> }[] = [
  // feature/ability/talent/level-1/feedback-loop.md; tactician/level-2/no-dying-on-my-watch.md.
  // The target of the ability is the creature dealing the damage.
  {
    text: 'The target deals damage to an ally.',
    spec: { event: 'damage-dealt', whose: 'target', damaged: 'ally' },
  },
  // feature/ability/tactician/level-1/advanced-tactics.md; summoner/level-1/focus-fire.md.
  {
    text: 'The target deals damage to another creature.',
    spec: { event: 'damage-dealt', whose: 'target', damaged: 'another' },
  },
  // feature/ability/beastheart/level-1/thunderclap.md.
  {
    text: 'The target deals damage to a creature.',
    spec: { event: 'damage-dealt', whose: 'target', damaged: 'any' },
  },
  // feature/ability/elementalist/level-1/skin-like-castle-walls.md;
  // beastheart/level-1/the-pack-defends.md.
  { text: 'The target takes damage.', spec: { event: 'damage-taken', whose: 'target' } },
  // feature/ability/tactician/level-1/parry.md.
  {
    text: 'A creature deals damage to the target.',
    spec: { event: 'damage-taken', whose: 'target', dealer: 'known' },
  },
  // feature/ability/troubadour/level-1/riposte.md; rule/combat/strike.md and rule/combat/melee.md
  // (a strike with the Melee keyword, used in melee).
  {
    text: 'The target takes damage from a melee strike.',
    spec: { event: 'damage-taken', whose: 'target', from: 'melee-strike' },
  },
  // feature/ability/null/level-1/inertial-shield.md; shadow/level-1/in-all-this-confusion.md.
  { text: 'You take damage.', spec: { event: 'damage-taken', whose: 'owner' } },
  // feature/ability/shadow/level-1/defensive-roll.md.
  {
    text: 'Another creature damages you.',
    spec: { event: 'damage-taken', whose: 'owner', dealer: 'other' },
  },
  // ---- V202 turn boundaries, from the clock's turn-start and turn-end (convex/lib/clock.ts).
  // feature/ability/censor/level-1/my-life-for-yours.md;
  // elementalist/level-1/breath-of-dawn-remembered.md. "Or takes damage" is the damage writer's
  // `damage-taken` of the same target.
  {
    text: 'The target starts their turn or takes damage.',
    spec: { event: 'turn-start', whose: 'target', orDamageTaken: true },
  },
  // feature/ability/censor/level-2/prescient-grace.md. Observed, but its effect ("The target can
  // then take their turn immediately before the triggering enemy") is not one the engine compiles:
  // the enemy's turn has already started when the clock observes it (shared/resolve/effectOnly.ts).
  {
    text: 'An enemy within 10 squares starts their turn.',
    spec: { event: 'turn-start', whose: 'enemy', within: 10 },
  },
  // feature/ability/shadow/level-1/hesitation-is-weakness.md, both sentences read whole. The
  // second is the turn's record of the ability that started it (convex/lib/initiative.ts).
  {
    text: "Another hero ends their turn. That hero can't have used this ability to start their turn.",
    spec: { event: 'turn-end', whose: 'other-hero', notStartedByThis: true },
  },
];

/**
 * Why a Trigger section the engine does not observe stays manual, by the kind of fact it needs.
 * Each reason names the missing fact; the ability can still be used by hand as a triggered action.
 */
const UNOBSERVED: readonly { pattern: RegExp; reason: string }[] = [
  {
    pattern: /\bwould (take damage|be force moved)\b|\breceives enough damage\b/,
    reason:
      'it answers damage or movement before it happens; V174 revises only a hit already written (option B)',
  },
  {
    pattern: /\b(moves|force moved|force moves|enters a space)\b/,
    reason:
      'movement is a table fact: the app has no map (docs/lasting-effects-design.md#3-watchers)',
  },
  {
    pattern: /\bmakes an ability roll\b/,
    reason: 'it answers an ability roll before its outcome, which the engine resolves at once',
  },
  {
    pattern: /\btargets you with a strike\b|\bis targeted by a strike\b/,
    reason: 'it changes the target of a strike the engine has already resolved',
  },
  {
    pattern: /\bstarts their turn\b|\bends their turn\b/,
    reason:
      'the clock offers only the turn-boundary sentences V202 reads whole (shared/resolve/triggers.ts), and this is not one of them',
  },
  {
    pattern: /\buses an ability\b|\buse your\b|\buse a triggered action\b/,
    reason: 'ability-use triggers are not offered yet (V173 observes damage only)',
  },
  {
    pattern: /\blose Stamina\b/,
    reason: 'Stamina loss is not only damage the engine writes (rule/health/stamina.md)',
  },
];

/** Reads one whole Trigger section, or the reason the engine does not observe it. */
export function triggerSection(section: string): TriggerSpec | { unobserved: string } {
  const text = normalize(section);
  const known = TRIGGERS.find(entry => entry.text === text);
  if (known) return { effect: 'trigger', ...known.spec, text };
  const why = UNOBSERVED.find(entry => entry.pattern.test(text));
  return {
    unobserved: why?.reason ?? 'the engine observes no event that this trigger names exactly',
  };
}

/** Two specs read from the same printed sentence are the same, field by field (tamper check). */
export function sameTriggerSpec(a: TriggerSpec, b: TriggerSpec): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every(
    key =>
      (a as unknown as Record<string, unknown>)[key] ===
      (b as unknown as Record<string, unknown>)[key],
  );
}

/**
 * The action type of a printed usage. Hero abilities print "Triggered" and "Free triggered"
 * (feature/ability/*); foe stat blocks print "Triggered action" and "Free triggered action".
 */
export function triggeredActionType(usage: string): ActionType | undefined {
  const text = normalize(usage).toLowerCase();
  if (text === 'triggered' || text === 'triggered action') return 'triggered action';
  if (text === 'free triggered' || text === 'free triggered action') return 'free triggered action';
  return undefined;
}

// ---------------------------------------------------------------------------------------------
// Offers.

/**
 * Who a triggered ability may target, read from its Target entry. rule/combat/target.md, Creature:
 * "You aren't an eligible creature target for your own abilities unless those abilities also have
 * "self" as a target (see below), or unless the ability indicates otherwise." Interpretation
 * (Q-TRIG-1, point 2): "an ally" in a target or trigger is another creature on your side, never you.
 */
export interface TriggerTarget {
  self: boolean;
  others: 'ally' | 'enemy' | 'creature' | 'none';
}

export function triggerTarget(target: string): TriggerTarget | undefined {
  const text = normalize(target).toLowerCase();
  if (text === 'self') return { self: true, others: 'none' };
  const one = /^(self or )?one (ally|enemy|creature)$/.exec(text);
  if (!one) return undefined;
  return { self: one[1] !== undefined, others: one[2] as TriggerTarget['others'] };
}

/**
 * A creature in the encounter. The app places heroes on the players' side and foes on the
 * Director's (rule/combat/side.md: the heroes and their allies are one side, every creature who
 * opposes them the other).
 */
export interface TriggerCreature {
  id: string;
  side: 'heroes' | 'director';
}

/** One damage write the engine observed (convex/lib/resolve.ts writeDamage). */
export interface DamageOccurrence {
  damaged: TriggerCreature;
  /** The creature dealing the damage, when a use named one (a watcher's own damage has none). */
  dealer?: TriggerCreature;
  /** Stamina plus temporary Stamina lost, after immunity and weakness. */
  amount: number;
  /** Whether the damage came from a melee strike, when the use says. */
  meleeStrike?: boolean;
}

/** A hero's triggered ability that the engine can offer. */
export interface TriggerHolder {
  owner: TriggerCreature;
  spec: TriggerSpec;
  target: TriggerTarget;
}

function relation(owner: TriggerCreature, creature: TriggerCreature): 'self' | 'ally' | 'enemy' {
  if (creature.id === owner.id) return 'self';
  return creature.side === owner.side ? 'ally' : 'enemy';
}

function targetable(holder: TriggerHolder, creature: TriggerCreature): boolean {
  const related = relation(holder.owner, creature);
  if (related === 'self') return holder.target.self;
  return holder.target.others === 'creature' || holder.target.others === related;
}

/**
 * The creature a holder's response would target for this damage, or `undefined` when the trigger
 * doesn't occur. Zero damage is not damage taken (Q-RES-4), so it occurs for no one.
 */
export function triggerTargetFor(
  holder: TriggerHolder,
  damage: DamageOccurrence,
): string | undefined {
  if (damage.amount <= 0) return undefined;
  const spec = holder.spec;
  // V202: a turn-boundary sentence answers damage only when it also says "or takes damage" of
  // the target; that half is read as the target's `damage-taken`.
  if (spec.event === 'turn-start' || spec.event === 'turn-end') {
    if (!spec.orDamageTaken || spec.whose !== 'target') return undefined;
    return targetable(holder, damage.damaged) ? damage.damaged.id : undefined;
  }
  if (spec.event === 'damage-dealt') {
    const dealer = damage.dealer;
    if (!dealer || dealer.id === damage.damaged.id) return undefined;
    const damaged = relation(holder.owner, damage.damaged);
    if (spec.damaged === 'ally' && damaged !== 'ally') return undefined;
    const subject = spec.whose === 'owner' ? holder.owner : dealer;
    if (subject.id !== dealer.id) return undefined;
    return targetable(holder, dealer) ? dealer.id : undefined;
  }
  if (spec.whose === 'owner' && damage.damaged.id !== holder.owner.id) return undefined;
  if (spec.dealer === 'known' && !damage.dealer) return undefined;
  if (spec.dealer === 'other' && (!damage.dealer || damage.dealer.id === damage.damaged.id))
    return undefined;
  if (spec.from === 'melee-strike' && damage.meleeStrike !== true) return undefined;
  return targetable(holder, damage.damaged) ? damage.damaged.id : undefined;
}

/** V202: one turn boundary the clock dispatched (convex/lib/clock.ts dispatchBoundary). */
export interface TurnOccurrence {
  boundary: 'turn-start' | 'turn-end';
  /** The creature whose turn it is (a squad's turn is its own creature on the Director's side). */
  creature: TriggerCreature;
  /** The creature is a hero (a character in the app). */
  hero: boolean;
  /**
   * The turn was started by using the holder's own ability (the turn's `startedBy` record names
   * the same source), for "That hero can't have used this ability to start their turn."
   */
  startedByThis: boolean;
}

/**
 * V202: the creature a holder's response would target at this turn boundary, or `undefined` when
 * the trigger doesn't occur. A response whose trigger is about another creature (an enemy, another
 * hero) targets only its user, so its offer names the user; any other target shape is refused at
 * compile time (shared/resolve/compileAbility.ts).
 */
export function triggerTargetForTurn(
  holder: TriggerHolder,
  turn: TurnOccurrence,
): string | undefined {
  const spec = holder.spec;
  if (spec.event !== turn.boundary) return undefined;
  const related = relation(holder.owner, turn.creature);
  switch (spec.whose) {
    case 'target':
      // "The target starts their turn": the creature whose turn it is must be one the ability may
      // target (rule/combat/target.md), such as "Self or one ally".
      return targetable(holder, turn.creature) ? turn.creature.id : undefined;
    case 'owner':
      return related === 'self' && holder.target.self ? holder.owner.id : undefined;
    case 'enemy':
      return related === 'enemy' && holder.target.self && holder.target.others === 'none'
        ? holder.owner.id
        : undefined;
    case 'other-hero':
      // "Another hero ends their turn. That hero can't have used this ability to start their turn."
      if (related === 'self' || !turn.hero) return undefined;
      if (spec.notStartedByThis && turn.startedByThis) return undefined;
      return holder.target.self && holder.target.others === 'none' ? holder.owner.id : undefined;
  }
}

/** What stands between an owner and a response when it is offered, and again when accepted. */
export interface TriggerEligibilityInput {
  actionType: 'triggered action' | 'free triggered action';
  /** The owner already used their ordinary triggered action this round. */
  ordinaryUsedThisRound: boolean;
  /**
   * What prevents the owner from taking triggered actions: `dazed`, `surprised`, or `dead`. Other
   * preventions (unconscious, a printed "can't use triggered actions until …") are the table's check.
   */
  preventions: readonly ('dazed' | 'surprised' | 'dead')[];
  /**
   * V202, given only for a response whose effect is "You take your turn after the triggering hero":
   * whether the owner still has a turn to take this round (an unspent turn entry). Interpretation
   * (Q-TURNTRIG-1, point 2): "your turn" is the owner's turn of this round.
   */
  turnLeft?: boolean;
}

const PREVENTION: Record<TriggerEligibilityInput['preventions'][number], string> = {
  // condition/dazed.md: "can't use triggered actions, free triggered actions, or free maneuvers".
  dazed: 'is dazed and can’t use triggered actions or free triggered actions (condition/dazed.md)',
  // rule/combat/surprised.md: "A surprised creature can't take triggered actions or free
  // triggered actions".
  surprised:
    'is surprised and can’t take triggered actions or free triggered actions (rule/combat/surprised.md)',
  // rule/health/dying.md: at the negative of the winded value "you die"; a dying hero "can still
  // act", so dying alone is not a prevention.
  dead: 'is dead (Stamina at or below the negative of their winded value, rule/health/dying.md)',
};

/**
 * Whether the owner may take the response now (rule/combat/triggered-action.md): a prevention
 * blocks both kinds; the ordinary one-per-round limit binds only a triggered action.
 */
export function triggerEligibility(
  input: TriggerEligibilityInput,
): { eligible: true } | { eligible: false; reason: string } {
  const prevented = input.preventions[0];
  if (prevented) return { eligible: false, reason: PREVENTION[prevented] };
  if (input.turnLeft === false)
    return {
      eligible: false,
      reason:
        'has already taken their turn this round, so has no turn to take after the triggering hero (interpretation, Q-TURNTRIG-1)',
    };
  if (input.actionType === 'triggered action' && input.ordinaryUsedThisRound)
    return {
      eligible: false,
      reason:
        'already used a triggered action this round (rule/combat/triggered-action.md: one per round; free triggered actions don’t count)',
    };
  return { eligible: true };
}

/** "Ranged 10" → "within 10 squares: the table confirms", for the card; distance has no map. */
export function distanceNote(distance: string): string {
  const text = normalize(distance);
  const reach = /^(Melee|Ranged) (\d+)$/.exec(text);
  if (reach)
    return `within ${reach[2]} square${reach[2] === '1' ? '' : 's'} (${reach[1]!.toLowerCase()}): the table confirms`;
  return text.toLowerCase() === 'self' ? 'self' : `${text}: the table confirms`;
}
