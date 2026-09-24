// SPDX-License-Identifier: GPL-3.0-only
/**
 * V158 lasting effects (docs/build/V158-effect-instances.md, docs/lasting-effects-design.md
 * sections 1 and 5a). Pure: the whole-section grammar of lasting table work, duration binding,
 * the clock timing each bound duration uses, and the printed stacking aggregate. Inputs have
 * display markup removed by abilityGrammar.plain. There is no substring or ability-name dispatch.
 *
 * Source paths are relative to the pinned Compendium `en/unified/md`, except the stacking rule,
 * which is printed in `en/books/heroes/clean/Draw Steel Heroes.md`, "Stacking Unique Effects".
 */
import type { TimingClause } from '../contracts/clock.ts';
import type {
  BoundDuration,
  EffectDuration,
  EffectEndTrigger,
  EffectInstance,
} from '../contracts/liveState.ts';
import type { EffectRider } from './effectRiders.ts';

/**
 * One lasting effect read from a whole Effect section: its table work (`text`, the printed
 * sentences without the duration), who it is about and how long it lasts.
 */
export interface LastingSpec {
  effect: 'instruction';
  shape: EffectRider['shape'];
  /** `target`: written about "the target", so it needs a one-target envelope (V110). */
  subject: 'target' | 'owner';
  duration: EffectDuration;
  endsWhen: EffectEndTrigger[];
  text: string;
}

/**
 * Printed durations the engine binds (design, "Durations"). Each is a whole phrase; the relative
 * anchor is bound at application (`bindDuration`).
 */
const DURATIONS: readonly {
  phrase: string;
  duration: EffectDuration;
  endsWhen: EffectEndTrigger[];
}[] = [
  // feature/ability/null/level-1/relentless-nemesis.md.
  {
    phrase: 'the start of your next turn',
    duration: { kind: 'start-of-next-turn', anchor: 'owner' },
    endsWhen: [],
  },
  // "the end of your next turn" (feature/ability/elementalist/level-3/swarm-of-spirits.md) is not
  // bound: whether it lasts through the user's following turn when used on their own turn is open
  // (Q-EFFECT-1, docs/rules-questions-for-user.md). Such sentences stay manual until the user rules.
  // kit/battlemind.md (Unmooring); kit/shining-armor.md ("until the end of their next turn").
  {
    phrase: "the end of the target's next turn",
    duration: { kind: 'end-of-next-turn', anchor: 'subject' },
    endsWhen: [],
  },
  {
    phrase: 'the end of their next turn',
    duration: { kind: 'end-of-next-turn', anchor: 'subject' },
    endsWhen: [],
  },
  // feature/ability/censor/level-2/blessing-of-the-faithful.md (rule/health/dying.md).
  {
    phrase: 'the end of the encounter or until you are dying',
    duration: { kind: 'encounter' },
    endsWhen: ['owner-dying'],
  },
  // feature/ability/shadow/level-3/dancer.md.
  { phrase: 'the end of the encounter', duration: { kind: 'encounter' }, endsWhen: [] },
];

/**
 * Admitted table work, matched whole after the duration is removed. Only work the coverage
 * boundary admits (docs/decisions/2026-09-24-compiled-effect-coverage.md): movement, other
 * creatures' actions, banes or edges entered at a later roll, Recovery spending. Anything that
 * changes a number the engine computes stays manual until the modifiers slice.
 */
const BODIES: readonly {
  pattern: RegExp;
  shape: EffectRider['shape'];
  subject: 'target' | 'owner';
}[] = [
  // feature/ability/null/level-1/relentless-nemesis.md. The target's movement is not observable
  // (there is no map), so the trigger and the user's free triggered shift stay table work
  // (docs/decisions/2026-09-24-automation-rulings.md, ruling 2).
  {
    pattern:
      /^whenever the target finishes moving or being force moved, you can use a free triggered action to shift up to your speed\. You must end this shift adjacent to the target\.$/,
    shape: 'shift',
    subject: 'target',
  },
];

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/**
 * Reads one whole Effect section as a lasting instruction, or `undefined`. Two printed forms:
 * "Until <duration>, <table work>" and "<table work> until <duration>." in its first sentence. The
 * longest duration phrase is tried first, so "the end of the encounter or until you are dying" is
 * never read as "the end of the encounter".
 */
export function lastingInstruction(section: string): LastingSpec | undefined {
  const text = normalize(section);
  const ordered = [...DURATIONS].sort((a, b) => b.phrase.length - a.phrase.length);
  for (const { phrase, duration, endsWhen } of ordered) {
    const prefix = new RegExp(`^Until ${escape(phrase)}, (.+)$`).exec(text);
    const suffix = new RegExp(`^([^.]+?) until ${escape(phrase)}\\.(?: (.+))?$`).exec(text);
    const body = prefix
      ? prefix[1]!
      : suffix
        ? `${lowerFirst(suffix[1]!)}.${suffix[2] ? ` ${suffix[2]}` : ''}`
        : undefined;
    if (body === undefined) continue;
    const match = BODIES.find(entry => entry.pattern.test(body));
    if (!match) return undefined;
    return {
      effect: 'instruction',
      shape: match.shape,
      subject: match.subject,
      duration,
      endsWhen: [...endsWhen],
      text: body,
    };
  }
  return undefined;
}

/**
 * Binds a printed duration's relative anchor to one creature (docs/table-spec.md, "Game clock and
 * scheduled rules work": an effect lasting until the start of Thorn's next turn is anchored to
 * Thorn). Save-ends, EoT and maintained anchors follow the design table: the subject saves and
 * suffers EoT; the owner maintains.
 */
export function bindDuration(
  printed: EffectDuration,
  ownerId: string,
  subjectId: string,
): BoundDuration {
  switch (printed.kind) {
    case 'start-of-next-turn':
      return { kind: 'start-of-next-turn', creatureId: ownerId };
    case 'end-of-next-turn':
      return {
        kind: 'end-of-next-turn',
        creatureId: printed.anchor === 'owner' ? ownerId : subjectId,
      };
    case 'save-ends':
      return { kind: 'save-ends', creatureId: subjectId };
    case 'eot':
      return { kind: 'eot', creatureId: subjectId };
    case 'maintained':
      return { kind: 'maintained', creatureId: ownerId };
    case 'encounter':
    case 'none':
      return { kind: printed.kind };
  }
}

/**
 * The clock registration a bound duration needs, from the existing timings of
 * shared/contracts/clock.ts. `maintained` and `none` have no clock timing: maintenance ends through
 * resource.maintain (V148) and `none` ends by its own rules or `effect.end`.
 * - start of the next turn: the anchor's next `turn-start`, once;
 * - end of the next turn and EoT: the anchor's first `turn-end` after registration
 *   (rule/combat/end-of-turn.md). The grammar refuses an owner-anchored "end of your next turn"
 *   until Q-EFFECT-1 is ruled, so for an owner anchor this is only the fallback timing of a stored
 *   duration;
 * - the encounter: `combat-end`, once;
 * - save ends: a saving throw at the end of each of the subject's turns (rule/general/saving-throw.md).
 */
export function timingFor(
  duration: BoundDuration,
):
  | { timing: TimingClause; work: 'expire-effect' }
  | { timing: TimingClause; work: 'saving-throw'; creatureId: string }
  | undefined {
  switch (duration.kind) {
    case 'start-of-next-turn':
      return {
        timing: {
          scope: 'creature-turn',
          boundary: 'turn-start',
          creatureId: duration.creatureId,
          occurrence: 'next',
        },
        work: 'expire-effect',
      };
    case 'end-of-next-turn':
    case 'eot':
      return {
        timing: { scope: 'end-of-next-turn', creatureId: duration.creatureId },
        work: 'expire-effect',
      };
    case 'encounter':
      return { timing: { scope: 'combat', boundary: 'combat-end' }, work: 'expire-effect' };
    case 'save-ends':
      return {
        timing: {
          scope: 'creature-turn',
          boundary: 'turn-end',
          creatureId: duration.creatureId,
          occurrence: 'each',
        },
        work: 'saving-throw',
        creatureId: duration.creatureId,
      };
    case 'maintained':
    case 'none':
      return undefined;
  }
}

/** Why a bound duration ended at its clock boundary, for the instance and the log. */
export function expiryReason(duration: BoundDuration): string {
  switch (duration.kind) {
    case 'start-of-next-turn':
      return 'start of the owner’s next turn';
    case 'end-of-next-turn':
      return 'end of the next turn';
    case 'eot':
      return 'end of turn (EoT)';
    case 'encounter':
      return 'end of the encounter';
    default:
      return 'expired';
  }
}

/** Human text of a bound duration for lists and the log. */
export function describeDuration(
  printed: EffectDuration,
  endsWhen: readonly EffectEndTrigger[] = [],
): string {
  const base = {
    'start-of-next-turn': 'until the start of the owner’s next turn',
    'end-of-next-turn':
      printed.kind === 'end-of-next-turn' && printed.anchor === 'owner'
        ? 'until the end of the owner’s next turn'
        : 'until the end of the subject’s next turn',
    encounter: 'until the end of the encounter',
    'save-ends': 'save ends',
    eot: 'EoT',
    maintained: 'while maintained',
    none: 'no printed duration',
  }[printed.kind];
  const extra = endsWhen
    .filter(trigger => trigger !== 'willingly-ended')
    .map(trigger =>
      trigger === 'owner-dying'
        ? 'or until the owner is dying'
        : 'or until the ability is used again',
    );
  return [base, ...extra].join(' ');
}

// ---------------------------------------------------------------------------------------------
// Stacking (en/books/heroes/clean/Draw Steel Heroes.md, "Stacking Unique Effects").

export type AggregateInput<P> = Pick<
  EffectInstance,
  'id' | 'abilityId' | 'abilityName' | 'appliedSequence' | 'status'
> & { payload: P };

export interface AggregateGroup<P> {
  abilityId: string;
  abilityName: string;
  /** The most impactful payload among this ability's active instances. */
  applies: AggregateInput<P>;
  /** The most recent use, which sets the group's duration. */
  durationFrom: AggregateInput<P>;
  /** Every active instance of the ability, oldest first; history keeps them all. */
  sources: string[];
}

export interface EffectiveAggregate<P> {
  groups: AggregateGroup<P>[];
  /** Conditions and named consequences, each counted once however many instances impose it. */
  consequences: string[];
}

/**
 * The effective aggregate of one subject's stored instances, as printed in "Stacking Unique
 * Effects":
 * - "The unique effects of different abilities are combined": one group per ability;
 * - "the effects of the same ability used multiple times don't stack. Instead, the most impactful
 *   effect … from each use of the ability applies": whoever used it, the group applies its most
 *   impactful payload (`impact`, higher is more impactful; a tie keeps the more recent use);
 * - "The most recently used ability applies for determining duration": the most recent use of the
 *   ability (`appliedSequence`) sets the group's duration;
 * - "Different effects that impose the same condition don't stack … The same holds true for game
 *   effects that aren't conditions": a condition or named consequence counts once.
 * Instances that are not active are ignored. A source rule that says otherwise is an explicit
 * exception on that source, not handled here.
 */
export function effectiveAggregate<P>(
  instances: readonly AggregateInput<P>[],
  options: {
    impact?: (payload: P) => number;
    consequence?: (payload: P) => string | undefined;
  } = {},
): EffectiveAggregate<P> {
  const impact = options.impact ?? (() => 0);
  const byAbility = new Map<string, AggregateInput<P>[]>();
  for (const instance of instances) {
    if (instance.status !== 'active') continue;
    const list = byAbility.get(instance.abilityId) ?? [];
    list.push(instance);
    byAbility.set(instance.abilityId, list);
  }
  const groups: AggregateGroup<P>[] = [];
  for (const [abilityId, list] of byAbility) {
    const ordered = [...list].sort((a, b) => a.appliedSequence - b.appliedSequence);
    const durationFrom = ordered[ordered.length - 1]!;
    let applies = ordered[0]!;
    for (const candidate of ordered)
      if (impact(candidate.payload) >= impact(applies.payload)) applies = candidate;
    groups.push({
      abilityId,
      abilityName: durationFrom.abilityName,
      applies,
      durationFrom,
      sources: ordered.map(instance => instance.id),
    });
  }
  const consequences: string[] = [];
  for (const group of groups) {
    const named = options.consequence?.(group.applies.payload);
    if (named !== undefined && !consequences.includes(named)) consequences.push(named);
  }
  return { groups, consequences };
}
