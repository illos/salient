// SPDX-License-Identifier: GPL-3.0-only
/**
 * V200 areas and auras (docs/build/V200-areas-and-auras.md,
 * docs/lasting-effects-design.md#6-areas-and-auras). Pure: the whole-section grammar of area
 * effects, binding printed amounts at use, which members a rider is about, and plain text for the
 * log and sheets. There is no substring or ability-name dispatch.
 *
 * There is no map. The user ruled on 2026-09-25 that the table picks who is in an area or aura (the
 * use's targets, then `effect.members`), and that adding a member is an explicit "enters the area":
 * enter riders fire then, within their printed limit. Distance, line of effect, geometry, the size
 * of the area and moving it stay table facts; the engine computes nothing from them.
 *
 * Source paths are relative to the pinned Compendium `en/unified/md`.
 */
import type {
  AreaPayload,
  AreaRelation,
  EffectDuration,
  EffectEndTrigger,
} from '../contracts/liveState.ts';
import { plain, type Characteristic } from './abilityGrammar.ts';
import { bindWatcher, describeWatcher, type PrintedWatcher } from './watchers.ts';

/** One printed rider: who among the members it is about, and the watcher it runs for each. */
export interface AreaRiderSpec {
  who: AreaRelation;
  watcher: PrintedWatcher;
}

/**
 * One area effect read from a whole Effect section: its riders, how long the area lasts and its
 * extra end conditions. `text` is the printed section, display markup removed.
 */
export interface AreaSpec {
  effect: 'area';
  duration: EffectDuration;
  endsWhen: EffectEndTrigger[];
  riders: AreaRiderSpec[];
  text: string;
}

/** rule/damage/damage-type.md: the printed damage types. */
const DAMAGE_TYPE = '(acid|cold|corruption|fire|holy|lightning|poison|psychic|sonic)';

const normalize = (text: string) => plain(text).replace(/\s+/g, ' ').trim();
const count = (text: string | undefined) => {
  const value = Number(text);
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
};

/**
 * Who an area ability's "each target" is, from its target line (rule/combat/target.md, "Each
 * [Target]": "If an area ability ... says it applies to each creature, object, enemy, or ally in the
 * area, then all eligible targets for the ability are affected"; "Self": the user only when the
 * line names "self"). Only the printed area lines the grammar admits are read.
 */
export function areaTargetRelation(target: string): AreaRelation | undefined {
  const text = normalize(target).toLowerCase();
  if (text === 'each ally in the area') return { self: false, others: 'ally' };
  if (text === 'self and each ally in the area') return { self: true, others: 'ally' };
  if (text === 'each enemy in the area') return { self: false, others: 'enemy' };
  return undefined;
}

type Reader = (match: RegExpExecArray, target: AreaRelation) => AreaSpec | undefined;

/**
 * Whole Effect sections of area abilities without a power roll (V157 effect-only). Each is matched
 * whole: an added or changed sentence is not an area the engine runs and stays manual.
 */
const EFFECT_ONLY: readonly { pattern: RegExp; read: Reader }[] = [
  // feature/ability/censor/level-2/blessing-of-the-faithful.md (3 aura, "Self and each ally in the
  // area"): "Until the end of the encounter or until you are dying, each target gains 1 surge at the
  // end of each of your turns." The user's turn ends are clock boundaries (rule/combat/turn.md),
  // surges are rule/resource/surge.md and "until you are dying" is rule/health/dying.md.
  // Interpretation (Q-AREA-2 point 2): "each target" is read as the aura's members the target
  // line admits at each turn end (rule/combat/aura.md: the aura "moves with you for the
  // duration"). The alternative, the creatures targeted at use wherever they are, is kept by the
  // table not editing the list.
  {
    pattern:
      /^Until the end of the encounter or until you are dying, each target gains (\d+) surges? at the end of each of your turns\.$/,
    read: (m, target) => {
      const surges = count(m[1]);
      if (!surges) return undefined;
      return {
        effect: 'area',
        duration: { kind: 'encounter' },
        endsWhen: ['owner-dying'],
        riders: [
          {
            who: target,
            watcher: {
              event: 'turn-end',
              whose: 'owner',
              limit: 'each',
              responses: [{ kind: 'gain', recipient: 'subject', surges }],
            },
          },
        ],
        text: m[0],
      };
    },
  },
  // feature/ability/conduit/level-2/wellspring-of-grace.md (3 aura, "Each ally in the area"):
  // "Until the end of the encounter or until you are dying, whenever a target starts their turn in
  // the area, they can spend a Recovery." A member's turn start is a clock boundary; spending a
  // Recovery is that creature's choice (rule/health/recoveries.md), so the response is table work,
  // as V157's "can spend a Recovery" sentences are.
  {
    pattern:
      /^Until the end of the encounter or until you are dying, whenever a target starts their turn in the area, they can spend a Recovery\.$/,
    read: (m, target) => ({
      effect: 'area',
      duration: { kind: 'encounter' },
      endsWhen: ['owner-dying'],
      riders: [
        {
          who: target,
          watcher: {
            event: 'turn-start',
            whose: 'subject',
            limit: 'each',
            responses: [{ kind: 'instruction', text: 'they can spend a Recovery.' }],
          },
        },
      ],
      text: m[0],
    }),
  },
  // ---- Troubadour performances (5 aura, "Self and each ally in the area", No action, the
  // Performance keyword). feature/troubadour/level-1/routines.md: "At the start of each combat
  // round, as long as you are not dazed, dead, or surprised, you can either choose a new performance
  // or maintain your current performance (no action required). Your performance lasts until you are
  // unable to maintain it or until the end of the encounter." "While this performance is active" is
  // that lifecycle: the encounter, ended early by choosing another performance or by being unable
  // to maintain it (`performance`, convex/lib/areas.ts). The compiler admits these only for an
  // ability with the Performance keyword.
  // feature/ability/troubadour/level-1/ballad-of-the-beast.md: "While this performance is active,
  // each target who starts their turn in the area gains 1 surge." Surges are rule/resource/surge.md.
  {
    pattern:
      /^While this performance is active, each target who starts their turn in the area gains (\d+) surges?\.$/,
    read: (m, target) => {
      const surges = count(m[1]);
      if (!surges) return undefined;
      return {
        effect: 'area',
        duration: { kind: 'encounter' },
        endsWhen: ['performance'],
        riders: [
          {
            who: target,
            watcher: {
              event: 'turn-start',
              whose: 'subject',
              limit: 'each',
              responses: [{ kind: 'gain', recipient: 'subject', surges }],
            },
          },
        ],
        text: m[0],
      };
    },
  },
  // feature/ability/troubadour/level-3/fire-up-the-night.md: "While this performance is active, each
  // target who starts their turn in the area doesn't take a bane on strikes against creatures with
  // concealment. Once during their turn, they can search for hidden creatures as a free maneuver
  // (see Hide and Sneak in Chapter 9: Tests)." Concealment banes (rule/combat/concealment.md) are
  // the table's circumstance input, and searching is the member's own maneuver, so the response is
  // table work at the member's turn start.
  {
    pattern:
      /^While this performance is active, each target who starts their turn in the area (doesn['’]t take a bane on strikes against creatures with concealment\. Once during their turn, they can search for hidden creatures as a free maneuver \(see Hide and Sneak in Chapter 9: Tests\)\.)$/,
    read: (m, target) => ({
      effect: 'area',
      duration: { kind: 'encounter' },
      endsWhen: ['performance'],
      riders: [
        {
          who: target,
          watcher: {
            event: 'turn-start',
            whose: 'subject',
            limit: 'each',
            responses: [{ kind: 'instruction', text: m[1]! }],
          },
        },
      ],
      text: m[0],
    }),
  },
  // feature/ability/troubadour/level-1/revitalizing-limerick.md: "At the end of each of your turns
  // while this performance is active, you can choose up to a number of targets equal to your
  // Presence score. Each chosen target can spend a Recovery." The choice among the members and the
  // Recovery (rule/health/recoveries.md) are table work, once at each of the user's turn ends, so the
  // rider is held by the user alone (who: self).
  {
    pattern:
      /^At the end of each of your turns while this performance is active, (you can choose up to a number of targets equal to your Presence score\. Each chosen target can spend a Recovery\.)$/,
    read: m => ({
      effect: 'area',
      duration: { kind: 'encounter' },
      endsWhen: ['performance'],
      riders: [
        {
          who: { self: true, others: 'none' },
          watcher: {
            event: 'turn-end',
            whose: 'owner',
            limit: 'each',
            responses: [{ kind: 'instruction', text: m[1]! }],
          },
        },
      ],
      text: m[0],
    }),
  },
];

/** Whole Effect sections of rolled area abilities (after the power roll). */
const ROLLED: readonly { pattern: RegExp; read: Reader }[] = [
  // feature/ability/talent/level-1/incinerate.md (3 cube within 10, "Each enemy in the area"): "A
  // column of fire remains in the area until the start of your next turn. Each enemy who enters the
  // area for the first time in a combat round or starts their turn there takes 2 fire damage."
  // - "until the start of your next turn": the user's next turn start (rule/combat/turn.md).
  // - Entering: `effect.members add` (user ruling, 2026-09-25), limited once per combat round per
  //   creature (rule/combat/combat-round.md), a V120 limit record on the member's rider.
  // - Starting their turn there: each turn start of a member.
  // Interpretation (Q-AREA-2 point 3): "for the first time in a combat round" limits entering
  // only, so an enemy who entered this round still takes the damage when it starts its turn there.
  // The alternative is one shared once-per-round limit for both.
  // - The damage is fire (rule/damage/damage-type.md), so immunity and weakness apply at the damage
  //   writer (rule/damage/damage-immunity.md, damage-weakness.md).
  {
    pattern: new RegExp(
      `^A column of fire remains in the area until the start of your next turn\\. Each enemy who enters the area for the first time in a combat round or starts their turn there takes (\\d+) ${DAMAGE_TYPE} damage\\.$`,
    ),
    read: m => {
      const amount = count(m[1]);
      if (!amount) return undefined;
      const enemy: AreaRelation = { self: false, others: 'enemy' };
      const damage = {
        kind: 'damage' as const,
        recipient: 'subject' as const,
        amount,
        damageType: m[2]!,
      };
      return {
        effect: 'area',
        duration: { kind: 'start-of-next-turn', anchor: 'owner' },
        endsWhen: [],
        riders: [
          {
            who: enemy,
            watcher: {
              event: 'area-entered',
              whose: 'subject',
              limit: 'round',
              responses: [damage],
            },
          },
          {
            who: enemy,
            watcher: { event: 'turn-start', whose: 'subject', limit: 'each', responses: [damage] },
          },
        ],
        text: m[0],
      };
    },
  },
];

function readWith(
  list: readonly { pattern: RegExp; read: Reader }[],
  section: string,
  target: string,
): AreaSpec | undefined {
  const relation = areaTargetRelation(target);
  if (!relation) return undefined;
  const text = normalize(section);
  for (const { pattern, read } of list) {
    const match = pattern.exec(text);
    if (match && match[0] === text) return read(match, relation);
  }
  return undefined;
}

/** The whole Effect section of an effect-only area ability, read as one area, or `undefined`. */
export function effectOnlyArea(section: string, target: string): AreaSpec | undefined {
  return readWith(EFFECT_ONLY, section, target);
}

/** The whole Effect section of a rolled area ability, read as one area, or `undefined`. */
export function sectionArea(section: string, target: string): AreaSpec | undefined {
  return readWith(ROLLED, section, target);
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

/** Two specs read from the same printed section are the same, field by field (tamper check). */
export function sameAreaSpec(a: AreaSpec, b: AreaSpec): boolean {
  return canonical(a) === canonical(b);
}

/** rule/combat/aura.md: an aura's distance is printed "X aura". */
export function isAura(distance: string): boolean {
  return /^\d+ aura$/.test(normalize(distance).toLowerCase());
}

/** Two bound area payloads are the same, field by field, whatever their key order. */
export function sameAreaPayload(a: AreaPayload, b: AreaPayload): boolean {
  return canonical(a) === canonical(b);
}

/** Binds every rider's printed amounts at use (shared/resolve/watchers.ts bindWatcher). */
export function bindArea(
  spec: AreaSpec,
  characteristics: Partial<Record<Characteristic, number>> | undefined,
): { payload: AreaPayload } | { requirement: string } {
  const riders: AreaPayload['riders'] = [];
  for (const rider of spec.riders) {
    const bound = bindWatcher(rider.watcher, characteristics);
    if ('requirement' in bound) return bound;
    riders.push({ who: rider.who, watcher: bound.payload });
  }
  return { payload: { riders } };
}

/** The sides the engine uses (rule/combat/side.md): heroes on one, every other creature the other. */
export type AreaSide = 'heroes' | 'director';

/**
 * Whether a rider is about a member, from the member's relation to the owner. rule/combat/side.md:
 * "The heroes and any of their allies are one side ... Any creatures who oppose the heroes are the
 * other side". rule/combat/enemy.md and ally.md leave who counts as an enemy or ally to the table,
 * with the Director's final say; the app places heroes on one side and foes on the other, as V173
 * offers and V175 marks do (labelled interpretation, Q-AREA-2 point 1).
 */
export function riderApplies(
  who: AreaRelation,
  member: { id: string; side: AreaSide },
  owner: { id: string; side: AreaSide },
): boolean {
  if (member.id === owner.id) return who.self;
  if (who.others === 'none') return false;
  return (member.side === owner.side) === (who.others === 'ally');
}

const relationText = (who: AreaRelation) =>
  [
    who.self ? 'you' : '',
    who.others === 'ally' ? 'each ally' : who.others === 'enemy' ? 'each enemy' : '',
  ]
    .filter(Boolean)
    .join(' and ');

/** Plain text of a bound area, for the log and sheets. */
export function describeArea(area: AreaPayload): string {
  return area.riders
    .map(rider => `for ${relationText(rider.who)} in the area, ${describeWatcher(rider.watcher)}`)
    .join('; ');
}

/**
 * V200: why a manual clause of an area ability is not an area the engine keeps, for the precise
 * diagnostic the report shows. Only clauses already diagnosed as manual are named, so this never
 * changes whether an ability compiles. Each reason cites the printed clause it recognizes.
 */
const MANUAL: readonly { pattern: RegExp; reason: string }[] = [
  // feature/ability/null/level-1/null-field.md and the abilities that enlarge it
  // (null/level-1/psychic-pulse.md, null/level-2/heat-sink.md, null/level-3/*-field.md).
  {
    pattern: /\bNull Field\b|^Each target reduces their potencies by 1\.$/,
    reason:
      'Null Field is not an area the engine keeps yet: its potency reduction on the creatures in the aura is not a modifier the engine applies to their abilities, and its discipline options and its life after the encounter are manual, so the abilities that enlarge it or read its area wait for it',
  },
  // feature/ability/troubadour/level-1/choreography.md.
  {
    pattern:
      /each target who starts their turn in the area gains a \+\d+ bonus to speed until the end of their turn/,
    reason:
      'a speed bonus until the end of the member’s turn is a modifier the rider would store at its turn start, and area riders don’t store modifiers yet',
  },
  // feature/ability/troubadour/level-1/acrobatics.md.
  {
    pattern: /automatically obtain a tier 3 outcome on one test/,
    reason:
      'an automatic tier 3 outcome on one later test to jump, tumble or climb is the member’s choice at that test, which the test operation doesn’t take as an input',
  },
  // feature/ability/troubadour/level-3/never-ending-hero.md.
  {
    pattern: /starts their turn dying while in the area/,
    reason:
      'the rider needs the member to be dying at its turn start, and its edge and ignoring bleeding until the end of the turn are not rider responses yet',
  },
  // feature/ability/conduit/level-1/font-of-wrath.md.
  {
    pattern: /moves within \d+ squares of the spirit/,
    reason:
      'the summoned spirit is not tracked, and its area is the squares within 2 of the spirit, not an area of the ability the table keeps',
  },
  // feature/ability/conduit/level-2/statue-of-power.md.
  {
    pattern: /statue rises out of the ground/,
    reason:
      'the statue is an object with its own Stamina and immunities that the engine doesn’t track, and its area is the squares within 3 of it',
  },
  // feature/ability/elementalist/level-3/wall-of-fire.md.
  {
    pattern: /for each square of the area they start their turn in or enter/,
    reason:
      'the damage counts the squares of the wall a creature starts in or enters, a map fact the table doesn’t record',
  },
  // feature/ability/elementalist/level-2/o-flower-aid-o-earth-defend.md.
  {
    pattern: /the area gains the following effects|you can move the area up to \d+ squares/,
    reason:
      'its listed area effects and its Persistent section (moving the area, the line-of-effect end, V148 maintenance) are not built for areas yet',
  },
];

export function areaManualReason(clause: string): string | undefined {
  const text = normalize(clause);
  return MANUAL.find(entry => entry.pattern.test(text))?.reason;
}
