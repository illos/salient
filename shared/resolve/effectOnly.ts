// SPDX-License-Identifier: GPL-3.0-only
/**
 * V157 abilities without a power roll (docs/build/V157-effect-only-abilities.md#design). A main
 * action or maneuver whose every printed clause is a gain the engine applies or bounded table
 * work compiles as `effectOnly`. Inputs have display markup removed by abilityGrammar.plain.
 *
 * Every Effect section must be consumed whole, sentence by sentence, by the ordered patterns
 * below. There is no substring or ability-name dispatch; each pattern cites its pinned source
 * (Compendium `en/unified/md`). Instructions never change state: the table resolves and records
 * them, as V109 riders are recorded. Gains are the only executed work.
 */
import type { EffectRider } from './effectRiders.ts';
import { plain } from './abilityGrammar.ts';
import { EFFECT_ONLY_MODIFIERS, type ModifierSpec } from './modifiers.ts';
import { EFFECT_ONLY_WATCHERS, type WatcherSpec } from './watchers.ts';

/**
 * The effect-only target reader. rule/combat/target.md: the entry is the most that can be
 * targeted and fewer is legal; "You aren't an eligible creature target for your own abilities
 * unless those abilities also have 'self' as a target".
 * - `self`: only the user.
 * - `one`: exactly one target; `self` says whether the user may be it ("Self or one ally").
 * - `allies`: up to `max` others, plus the user when `self` ("Self and two allies").
 * - `area`: "Each ally in the area"; the table selects the affected allies (V110). V159: "Self
 *   and each ally in the area" (feature/ability/tactician/level-2/squad-on-me.md) also names the
 *   user, who is always a target (`self`).
 * - `each`: V171 "Self and each ally" without an area (feature/ability/conduit/level-2/
 *   blessing-of-insight.md): every ally within distance, which the table selects (there is no map),
 *   and the user, who is always a target.
 */
export type EffectOnlyTarget =
  | { kind: 'self' }
  | { kind: 'one'; self: boolean }
  | { kind: 'allies'; max: number; self: boolean }
  | { kind: 'area'; self?: true }
  | { kind: 'each'; self: true };

const COUNT: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

export function effectOnlyTarget(target: string, keywords: string[]): EffectOnlyTarget | undefined {
  const text = plain(target).replace(/\s+/g, ' ').trim().toLowerCase();
  const area = keywords.some(k => plain(k).toLowerCase() === 'area');
  if (area)
    return text === 'each ally in the area'
      ? { kind: 'area' }
      : text === 'self and each ally in the area'
        ? { kind: 'area', self: true }
        : undefined;
  if (text === 'self') return { kind: 'self' };
  if (text === 'self and each ally') return { kind: 'each', self: true };
  if (text === 'one creature' || text === 'one ally') return { kind: 'one', self: false };
  if (text === 'self or one ally' || text === 'self or one creature')
    return { kind: 'one', self: true };
  const allies = /^(two|three|four|five|six) allies$/.exec(text);
  if (allies) return { kind: 'allies', max: COUNT[allies[1]!]!, self: false };
  const selfAnd = /^self and (one ally|(?:two|three|four|five|six) allies)$/.exec(text);
  if (selfAnd) return { kind: 'allies', max: COUNT[selfAnd[1]!.split(' ')[0]!]!, self: true };
  return undefined;
}

/** How many creatures a target shape can name; `undefined` for an area's table selection. */
export function effectOnlyTargetLimit(shape: EffectOnlyTarget): number | undefined {
  switch (shape.kind) {
    case 'self':
    case 'one':
      return 1;
    case 'allies':
      return shape.max + (shape.self ? 1 : 0);
    case 'area':
    case 'each':
      return undefined;
  }
}

export type EffectOnlyClause =
  | {
      kind: 'gain';
      /** `actor` is printed "You"; `target` is "The target" or "Each target". */
      subject: 'actor' | 'target';
      temporaryStamina?: number;
      surges?: number;
    }
  | {
      kind: 'instruction';
      subject: 'actor' | 'target';
      shape: EffectRider['shape'];
    }
  | {
      /** V159: a modifier the engine applies (shared/resolve/modifiers.ts). */
      kind: 'modifier';
      subject: 'actor' | 'target';
      spec: ModifierSpec;
    }
  | {
      /** V171: a watcher the engine runs (shared/resolve/watchers.ts). */
      kind: 'watcher';
      subject: 'actor' | 'target';
      spec: WatcherSpec;
    }
  | {
      /**
       * V173: damage to the target sized by the damage that set off the triggered action
       * (shared/resolve/triggers.ts). Only an offer accepted from that damage knows the amount;
       * a use by hand leaves it to the table.
       */
      kind: 'triggered-damage';
      subject: 'target';
      damageType: string;
      share: 'half';
    };

interface Pattern {
  pattern: RegExp;
  read: (match: RegExpExecArray) => EffectOnlyClause | undefined;
  /**
   * V110: "The target" was written for one target, so it is admitted only when the envelope has
   * exactly one target. "Each target" suits any count.
   */
  singleTarget?: true;
  /**
   * V173: the sentence speaks of "the triggering damage" or "the triggering strike", so it is
   * admitted only in a triggered ability whose Trigger section names that event.
   */
  trigger?: 'damage' | 'melee-strike';
}

const amount = (text: string | undefined) => {
  const value = Number(text);
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
};
const gain = (
  subject: 'actor' | 'target',
  temporaryStamina: string | undefined,
  surges: string | undefined,
): EffectOnlyClause | undefined => {
  const stamina = temporaryStamina === undefined ? undefined : amount(temporaryStamina);
  const surge = surges === undefined ? undefined : amount(surges);
  if ((temporaryStamina !== undefined && !stamina) || (surges !== undefined && !surge))
    return undefined;
  return {
    kind: 'gain',
    subject,
    ...(stamina ? { temporaryStamina: stamina } : {}),
    ...(surge ? { surges: surge } : {}),
  };
};
const instruction =
  (subject: 'actor' | 'target', shape: EffectRider['shape']) => (): EffectOnlyClause => ({
    kind: 'instruction',
    subject,
    shape,
  });

/**
 * Ordered whole-sentence patterns. A longer (whole-section) pattern precedes any pattern that
 * matches its first sentence. Each pattern is anchored and ends at a sentence's full stop.
 */
const PATTERNS: readonly Pattern[] = [
  // ---- Gains the engine applies (rule/health/temporary-stamina.md; rule/resource/surge.md).
  // feature/ability/fury/level-3/steelbreaker.md.
  {
    pattern: /^You gain (\d+) temporary Stamina\./,
    read: m => gain('actor', m[1], undefined),
  },
  // feature/ability/conduit/level-3/saints-raiment.md.
  {
    pattern: /^The target gains (\d+) temporary Stamina and (\d+) surges\./,
    read: m => gain('target', m[1], m[2]),
    singleTarget: true,
  },
  // The printed surge forms: "You gain 1 surge." (feature/ability/shadow/level-1/gasping-in-pain.md,
  // feature/ability/talent/level-1/spirit-sword.md) and "Each target gains 1 surge"
  // (feature/ability/tactician/level-1/battle-cry.md).
  { pattern: /^You gain (\d+) surges?\./, read: m => gain('actor', undefined, m[1]) },
  { pattern: /^Each target gains (\d+) surges?\./, read: m => gain('target', undefined, m[1]) },
  // feature/ability/tactician/level-2/squad-on-me.md: "Additionally, each target gains 2 surges."
  {
    pattern: /^Additionally, each target gains (\d+) surges?\./,
    read: m => gain('target', undefined, m[1]),
  },
  // ---- V159 modifiers the engine applies, each citing its source in shared/resolve/modifiers.ts.
  ...EFFECT_ONLY_MODIFIERS.map(({ pattern, read }) => ({
    pattern,
    read: (match: RegExpExecArray): EffectOnlyClause | undefined => {
      const spec = read(match);
      return spec
        ? { kind: 'modifier', subject: spec.subject === 'owner' ? 'actor' : 'target', spec }
        : undefined;
    },
  })),
  // ---- V171 watchers the engine runs, each citing its source in shared/resolve/watchers.ts.
  ...EFFECT_ONLY_WATCHERS.map(({ pattern, read }) => ({
    pattern,
    read: (match: RegExpExecArray): EffectOnlyClause | undefined => {
      const spec = read(match);
      return spec
        ? { kind: 'watcher', subject: spec.subject === 'owner' ? 'actor' : 'target', spec }
        : undefined;
    },
  })),
  // ---- V173 responses to the triggering event (shared/resolve/triggers.ts).
  // feature/ability/talent/level-1/feedback-loop.md: "The target takes psychic damage equal to half
  // the triggering damage." rule/general/always-round-down.md: an odd number halved rounds down.
  {
    pattern:
      /^The target takes (acid|cold|corruption|fire|holy|lightning|poison|psychic|sonic) damage equal to half the triggering damage\./,
    read: m => ({ kind: 'triggered-damage', subject: 'target', damageType: m[1]!, share: 'half' }),
    singleTarget: true,
    trigger: 'damage',
  },
  // feature/ability/troubadour/level-1/riposte.md: "The target makes a free strike against the
  // creature who made the triggering strike." The target's free strike is its own use
  // (feature/common/main-actions/free-strike), recorded by the table through the ability operation.
  {
    pattern:
      /^The target makes a free strike against the creature who made the triggering strike\./,
    read: instruction('target', 'free-strike'),
    singleTarget: true,
    trigger: 'melee-strike',
  },
  // ---- Table work, recorded as ordered manual occurrences (V109, V152).
  // feature/ability/conduit/level-1/sermon-of-grace.md, the whole section. Each target spends
  // through their own Recovery; the free triggered action ends an effect (rule/general/saving-throw.md,
  // rule/combat/end-of-turn.md) or ends prone through Stand Up (condition/prone.md).
  {
    pattern:
      /^Each target can spend a Recovery\. Additionally, each target can use a free triggered action to end one effect on them that is ended by a saving throw or that ends at the end of their turn, or to stand up if prone\./,
    read: instruction('target', 'recovery'),
  },
  // feature/ability/conduit/level-1/drain.md ("The target can spend a Recovery"); sermon-of-grace.md.
  {
    pattern: /^The target can spend a Recovery\./,
    read: instruction('target', 'recovery'),
    singleTarget: true,
  },
  { pattern: /^Each target can spend a Recovery\./, read: instruction('target', 'recovery') },
  // feature/ability/tactician/level-1/now.md (feature/common/main-actions/free-strike).
  { pattern: /^Each target can make a free strike\./, read: instruction('target', 'free-strike') },
  // feature/ability/tactician/level-1/squad-forward.md (rule/character/speed.md).
  { pattern: /^Each target can move up to their speed\./, read: instruction('target', 'move') },
  // feature/ability/shadow/level-1/shadowstrike.md. Each strike is its own ability use, with its
  // own roll and payment, made by the table through the ability operation.
  {
    pattern: /^You use a strike signature ability twice\./,
    read: instruction('actor', 'ability-use'),
  },
  // feature/ability/null/level-2/blur.md. The edge is entered at that later roll, as V154's
  // Inspiring Strike edge is.
  {
    pattern:
      /^You can use a signature or heroic ability\. You gain an edge on that ability's power rolls\./,
    read: instruction('actor', 'ability-use'),
  },
];

const normalize = (text: string) => plain(text).replace(/\s+/g, ' ').trim();

export interface EffectOnlySentence {
  /** The matched sentence or sentences, display markup removed. */
  text: string;
  clause: EffectOnlyClause;
  singleTarget: boolean;
  /** V173: the Trigger section the sentence needs (Pattern.trigger). */
  trigger?: 'damage' | 'melee-strike';
}

/** Reads one Effect section whole, or `undefined` when any part is outside the patterns. */
export function readEffectOnlySection(text: string): EffectOnlySentence[] | undefined {
  let rest = normalize(text);
  if (!rest) return undefined;
  const out: EffectOnlySentence[] = [];
  while (rest) {
    let matched: EffectOnlySentence | undefined;
    for (const { pattern, read, singleTarget, trigger } of PATTERNS) {
      const match = pattern.exec(rest);
      // Whole sentences only: the match ends the section or is followed by the next sentence.
      if (!match || (rest.length > match[0].length && rest[match[0].length] !== ' ')) continue;
      const clause = read(match);
      if (!clause) continue;
      matched = {
        text: match[0],
        clause,
        singleTarget: singleTarget === true,
        ...(trigger ? { trigger } : {}),
      };
      break;
    }
    if (!matched) return undefined;
    out.push(matched);
    rest = rest.slice(matched.text.length).trim();
  }
  return out;
}

/** Re-reads one stored clause; it must be exactly one admitted sentence pattern. */
export function effectOnlyClause(text: string): EffectOnlySentence | undefined {
  const read = readEffectOnlySection(text);
  return read?.length === 1 && read[0]!.text === normalize(text) ? read[0] : undefined;
}
