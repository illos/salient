// SPDX-License-Identifier: GPL-3.0-only
/**
 * V171 watchers (docs/build/V171-watchers.md, docs/lasting-effects-design.md#3-watchers). Pure: the
 * whole-sentence grammar of watcher sentences, binding printed amounts at use, which stored watcher
 * a later event is due for (its event, the watched creature, its filter and its limit window), and
 * the events one damage write produces. There is no substring or ability-name dispatch.
 *
 * Source paths are relative to the pinned Compendium `en/unified/md`.
 */
import type {
  EffectDuration,
  EffectEndTrigger,
  EffectInstance,
  Watcher,
  WatcherEvent,
  WatcherFiring,
  WatcherParty,
  WatcherResponse,
} from '../contracts/liveState.ts';
import type { Characteristic } from './abilityGrammar.ts';
import { claimWindow } from './heroicResourceGeneration.ts';

/** A printed damage amount: a number, dice, or "equal to your <characteristic> score". */
export type PrintedWatcherResponse =
  | Exclude<WatcherResponse, { kind: 'damage' }>
  | (Omit<Extract<WatcherResponse, { kind: 'damage' }>, 'amount'> & {
      amount:
        Extract<WatcherResponse, { kind: 'damage' }>['amount'] | { characteristic: Characteristic };
    });
export type PrintedWatcher = Omit<Watcher, 'responses'> & { responses: PrintedWatcherResponse[] };

/**
 * One watcher read from a whole printed sentence: who holds it (`target`: the target or each
 * target; `owner`: the user), what it watches and does, and how long it lasts.
 */
export interface WatcherSpec {
  effect: 'watcher';
  subject: 'target' | 'owner';
  watcher: PrintedWatcher;
  duration: EffectDuration;
  endsWhen: EffectEndTrigger[];
  /** The printed sentence, display markup removed. */
  text: string;
}

/** rule/damage/damage-type.md: the printed damage types. */
const DAMAGE_TYPE = '(acid|cold|corruption|fire|holy|lightning|poison|psychic|sonic)';

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
const count = (text: string | undefined) => {
  const value = Number(text);
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
};

/**
 * Whole Effect sections of rolled abilities that are one watcher sentence. Matched whole: an added
 * or changed sentence is not a watcher the engine runs and stays manual.
 */
const SECTIONS: readonly {
  pattern: RegExp;
  read: (m: RegExpExecArray) => WatcherSpec | undefined;
}[] = [
  // feature/ability/conduit/level-1/violence-will-not-aid-thee.md: "The first time on a turn that
  // the target deals damage to another creature, the target of this ability takes 1d10 lightning
  // damage (save ends)." The whole effect lasts until the target saves (rule/general/saving-throw.md,
  // at the end of each of its turns); the target's damage is observed where the engine writes it,
  // and "the first time on a turn" is a per-turn limit (rule/combat/turn.md).
  {
    pattern: new RegExp(
      `^The first time on a turn that the target deals damage to another creature, the target of this ability takes (\\d+)d(\\d+) ${DAMAGE_TYPE} damage \\(save ends\\)\\.$`,
    ),
    read: m => {
      const dice = count(m[1]);
      const sides = count(m[2]);
      if (!dice || !sides) return undefined;
      return {
        effect: 'watcher',
        subject: 'target',
        watcher: {
          event: 'damage-dealt',
          whose: 'subject',
          otherCreature: true,
          limit: 'turn',
          responses: [
            {
              kind: 'damage',
              recipient: 'subject',
              amount: { dice: { count: dice, sides } },
              damageType: m[3]!,
            },
          ],
        },
        duration: { kind: 'save-ends' },
        endsWhen: [],
        text: m[0],
      };
    },
  },
];

/** Reads one whole Effect section of a rolled ability as a watcher, or `undefined`. */
export function sectionWatcher(section: string): WatcherSpec | undefined {
  const text = normalize(section);
  for (const { pattern, read } of SECTIONS) {
    const match = pattern.exec(text);
    if (match) return read(match);
  }
  return undefined;
}

/**
 * Sentences of abilities without a power roll (V157 effect-only sections) that are one watcher.
 * Each pattern is anchored at the start and ends at the sentence's full stop; the effect-only
 * reader consumes the section sentence by sentence. `each target` suits any target count.
 */
export const EFFECT_ONLY_WATCHERS: readonly {
  pattern: RegExp;
  read: (match: RegExpExecArray) => WatcherSpec | undefined;
}[] = [
  // feature/ability/conduit/level-2/blessing-of-insight.md: "Until the end of the encounter or until
  // you are dying, each target gains 1 surge at the end of each of your turns." The user's turn ends
  // are clock boundaries (rule/combat/turn.md); surges are rule/resource/surge.md; "until you are
  // dying" is rule/health/dying.md.
  {
    pattern:
      /^Until the end of the encounter or until you are dying, each target gains (\d+) surges? at the end of each of your turns\./,
    read: match => {
      const surges = count(match[1]);
      if (!surges) return undefined;
      return {
        effect: 'watcher',
        subject: 'target',
        watcher: {
          event: 'turn-end',
          whose: 'owner',
          limit: 'each',
          responses: [{ kind: 'gain', recipient: 'subject', surges }],
        },
        duration: { kind: 'encounter' },
        endsWhen: ['owner-dying'],
        text: match[0],
      };
    },
  },
  // V175, feature/ability/tactician/level-3/hit-em-hard.md: "Until the end of the encounter or until
  // you are dying, whenever you or any ally deals damage to a target marked by you, that creature
  // gains 2 surges, which they can use immediately." The damage and the damaged creature's marks are
  // observed at the damage writer (V175 marks, feature/ability/tactician/level-1/mark.md). "That
  // creature" is read as the one who dealt the damage (interpretation, Q-MARK-1 point 6; the
  // alternatives are the marked target or the Tactician); surges are rule/resource/surge.md, and gained surges
  // are usable at once, as the sentence says. "You or any ally": the owner's side (rule/combat/side.md).
  {
    pattern:
      /^Until the end of the encounter or until you are dying, whenever you or any ally deals damage to a target marked by you, that creature gains (\d+) surges?, which they can use immediately\./,
    read: match => {
      const surges = count(match[1]);
      if (!surges) return undefined;
      return {
        effect: 'watcher',
        subject: 'owner',
        watcher: {
          event: 'marked-damaged',
          whose: 'owner',
          limit: 'each',
          responses: [{ kind: 'gain', recipient: 'dealer', surges }],
        },
        duration: { kind: 'encounter' },
        endsWhen: ['owner-dying'],
        text: match[0],
      };
    },
  },
  // V175, feature/ability/tactician/level-3/stay-strong-and-focus.md: "Until the end of the encounter
  // or until you are dying, whenever you or any ally deals damage to a target marked by you, the
  // creature who dealt the damage can spend a Recovery." Spending a Recovery is that creature's
  // choice (rule/health/recoveries.md), so the response is table work, as V157's "can spend a
  // Recovery" sentences are.
  {
    pattern:
      /^Until the end of the encounter or until you are dying, whenever you or any ally deals damage to a target marked by you, the creature who dealt the damage can spend a Recovery\./,
    read: match => ({
      effect: 'watcher',
      subject: 'owner',
      watcher: {
        event: 'marked-damaged',
        whose: 'owner',
        limit: 'each',
        responses: [
          { kind: 'instruction', text: 'the creature who dealt the damage can spend a Recovery.' },
        ],
      },
      duration: { kind: 'encounter' },
      endsWhen: ['owner-dying'],
      text: match[0],
    }),
  },
];

/** Reads one stored effect-only sentence as exactly one admitted watcher, or `undefined`. */
export function effectOnlyWatcher(sentence: string): WatcherSpec | undefined {
  const text = normalize(sentence);
  for (const { pattern, read } of EFFECT_ONLY_WATCHERS) {
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
export function sameWatcherSpec(a: WatcherSpec, b: WatcherSpec): boolean {
  return canonical(a) === canonical(b);
}

/**
 * Binds printed amounts at use. A characteristic score comes from the user ("your").
 * Interpretation (labelled, as V159's bindModifier): damage "equal to your <characteristic> score"
 * for a score below 1 deals no damage the source establishes, so such a use stays manual; the
 * alternatives are dealing 0 damage or skipping the response.
 */
export function bindWatcher(
  printed: PrintedWatcher,
  characteristics: Partial<Record<Characteristic, number>> | undefined,
): { payload: Watcher } | { requirement: string } {
  const responses: WatcherResponse[] = [];
  for (const response of printed.responses) {
    if (
      response.kind !== 'damage' ||
      typeof response.amount === 'number' ||
      'dice' in response.amount
    ) {
      responses.push(response as WatcherResponse);
      continue;
    }
    const letter = response.amount.characteristic;
    const score = characteristics?.[letter];
    if (score === undefined || !Number.isSafeInteger(score))
      return { requirement: `actor.characteristics.${letter}` };
    if (score < 1)
      return {
        requirement: `actor.characteristics.${letter} is below 1: damage equal to it is not established; the table decides`,
      };
    responses.push({ ...response, amount: score });
  }
  return { payload: { ...printed, responses } };
}

const party = (who: WatcherParty | 'dealer') =>
  who === 'owner'
    ? 'its owner'
    : who === 'dealer'
      ? 'the creature who dealt the damage'
      : 'its subject';

/** Plain text of a bound watcher, for the log and sheets. */
export function describeWatcher(watcher: Watcher): string {
  const event = {
    'damage-taken': 'takes damage',
    'damage-dealt': watcher.otherCreature ? 'deals damage to another creature' : 'deals damage',
    'made-winded': 'is made winded',
    dying: 'becomes dying',
    'turn-start': 'starts a turn',
    'turn-end': 'ends a turn',
    'ability-used': 'uses an ability',
    'strike-made': 'makes a strike',
    'marked-damaged': 'or an ally deals damage to a creature it marked',
  }[watcher.event];
  const limit = { turn: 'the first time on a turn', round: 'once per round', each: 'each time' }[
    watcher.limit
  ];
  const responses = watcher.responses.map(response => {
    switch (response.kind) {
      case 'gain':
        return `${party(response.recipient)} gains ${[
          response.surges ? `${response.surges} surge${response.surges === 1 ? '' : 's'}` : '',
          response.temporaryStamina ? `${response.temporaryStamina} temporary Stamina` : '',
        ]
          .filter(Boolean)
          .join(' and ')}`;
      case 'damage':
        return `${party(response.recipient)} takes ${
          typeof response.amount === 'number'
            ? response.amount
            : `${response.amount.dice.count}d${response.amount.dice.sides}`
        }${response.damageType ? ` ${response.damageType}` : ''} damage`;
      case 'condition':
        return `${party(response.recipient)} is ${response.condition} (${response.duration === 'eot' ? 'EoT' : 'save ends'})`;
      case 'instruction':
        return `the table resolves "${response.text}"`;
    }
  });
  return `when ${watcher.whose === 'owner' ? 'its owner' : 'its subject'} ${event} (${limit}): ${responses.join('; ')}`;
}

// ---------------------------------------------------------------------------------------------
// Observation.

/** An event the engine observed about one creature. */
export interface WatchedOccurrence {
  event: WatcherEvent;
  /** The creature the event is about: the damaged creature, the dealer, the turn's creature, the user. */
  creatureId: string;
  /** `damage-dealt`: the creature that took the damage. V175 `marked-damaged`: the dealer. */
  otherId?: string;
}

/**
 * Whether a stored watcher watches this occurrence: its event, and the watched creature (the
 * instance's subject, whose holder is `holderId`, or its owner). `undefined` when it doesn't.
 */
export function watches(
  instance: EffectInstance,
  holderId: string,
  occurrence: WatchedOccurrence,
): boolean {
  if (instance.status !== 'active' || instance.payload.kind !== 'watcher') return false;
  const watcher = instance.payload.watcher;
  if (watcher.event !== occurrence.event) return false;
  // An instance is held by its subject when the subject is a hero or foe (effectInstances.ts
  // holderOf); a squad or object subject has no events the engine observes.
  const subjectHolds = instance.subject.kind === 'character' || instance.subject.kind === 'foe';
  const watched =
    watcher.whose === 'owner' ? instance.owner.id : subjectHolds ? holderId : undefined;
  if (watched !== occurrence.creatureId) return false;
  if (watcher.otherCreature && occurrence.otherId === occurrence.creatureId) return false;
  return true;
}

/**
 * Whether a watcher that watches an occurrence fires now:
 * - `manual`: part of an unresolved same-ability stacking group (V158 R1b), or its limit needs a
 *   turn and none is active (outside combat there are no turns, rule/combat/turn.md); the table
 *   resolves it;
 * - `limited`: it already fired in this window (the printed limit);
 * - `fire`: with the window its firing record counts against (V120 claimWindow).
 */
export function watcherDue(
  instance: EffectInstance,
  at: { encounterId?: string; round?: number; turnId?: string },
):
  | { status: 'fire'; window: Omit<WatcherFiring, 'causeEventId'> }
  | { status: 'limited' }
  | { status: 'manual'; reason: string } {
  if (instance.payload.kind !== 'watcher') return { status: 'manual', reason: 'not a watcher' };
  if (instance.manualStacking)
    return {
      status: 'manual',
      reason:
        'part of a manual stacking group: apply the stacking rule at the table (Stacking Unique Effects)',
    };
  const limit = instance.payload.watcher.limit;
  if (limit === 'each')
    return { status: 'fire', window: at.encounterId ? { encounterId: at.encounterId } : {} };
  if (!at.encounterId || at.round === undefined)
    return {
      status: 'manual',
      reason: 'its limit counts turns or rounds, and no combat is running',
    };
  const window = claimWindow(limit, {
    round: at.round,
    ...(at.turnId ? { turnId: at.turnId } : {}),
  });
  if (!window) return { status: 'manual', reason: 'its limit counts turns, and no turn is active' };
  const taken = (instance.firings ?? []).some(
    firing =>
      firing.encounterId === at.encounterId &&
      firing.round === window.round &&
      firing.turnId === window.turnId,
  );
  if (taken) return { status: 'limited' };
  return { status: 'fire', window: { encounterId: at.encounterId, ...window } };
}

type Pools = { stamina: number; temporaryStamina: number };

/**
 * The events one damage write produces for the damaged creature:
 * - `damage-taken`: Stamina or temporary Stamina went down (Q-RES-4: 0 damage is not taken);
 * - `made-winded`: Stamina went from above the winded value to at or below it
 *   (rule/health/winded.md);
 * - `dying`: a hero's Stamina went from above 0 to 0 or lower (rule/health/dying.md). Only heroes
 *   are dying; other creatures are not.
 */
export function damageEvents(
  kind: 'hero' | 'foe',
  winded: number,
  before: Pools,
  after: Pools,
): WatcherEvent[] {
  const events: WatcherEvent[] = [];
  if (after.stamina + after.temporaryStamina < before.stamina + before.temporaryStamina)
    events.push('damage-taken');
  if (before.stamina > winded && after.stamina <= winded) events.push('made-winded');
  if (kind === 'hero' && before.stamina > 0 && after.stamina <= 0) events.push('dying');
  return events;
}
