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

/** The events V173 observes for triggers: the damage writer's (convex/lib/watchers.ts). */
export type TriggerEvent = 'damage-taken' | 'damage-dealt';

/**
 * One Trigger section the engine observes.
 * - `whose`: the creature the event is about. `target`: the creature this ability would target
 *   (the damaged creature for `damage-taken`, the dealer for `damage-dealt`); `owner`: the user.
 * - `damaged` (`damage-dealt` only): who the dealer damaged, relative to the owner.
 * - `dealer` (`damage-taken` only): `known` needs a creature that dealt the damage; `other` needs
 *   one other than the damaged creature.
 * - `from` (`damage-taken` only): the damage came from a melee strike.
 */
export interface TriggerSpec {
  effect: 'trigger';
  event: TriggerEvent;
  whose: 'target' | 'owner';
  damaged?: 'ally' | 'another' | 'any';
  dealer?: 'known' | 'other';
  from?: 'melee-strike';
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
];

/**
 * Why a Trigger section the engine does not observe stays manual, by the kind of fact it needs.
 * Each reason names the missing fact; the ability can still be used by hand as a triggered action.
 */
const UNOBSERVED: readonly { pattern: RegExp; reason: string }[] = [
  {
    pattern: /\bwould (take damage|be force moved)\b|\breceives enough damage\b/,
    reason:
      'it answers damage or movement before it happens, and a response that changes the hit is V174 (option B revision)',
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
    reason: 'turn-boundary triggers are not offered yet (V173 observes damage only)',
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
