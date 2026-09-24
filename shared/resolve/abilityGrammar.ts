// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure envelope readers and bounded ability-grammar classifier, shared by the coverage audit
 * and compiler. This module performs no filesystem access, evaluates no expressions and executes
 * no effects. Classification is grammar evidence, not an execution-support claim.
 *
 * Extracted from the V64 audit without changing its recognition or reconciliation semantics.
 * Readers retain every roll block, unlike the legacy resolver's first-roll adapter.
 */
import { effectRider } from './effectRiders.ts';
export { effectRider } from './effectRiders.ts';
import type { ConditionId } from '../contracts/liveState.ts';

// ---------------------------------------------------------------------------------------------
// Text normalization (copied from shared/resolve/index.ts plainText; display markup only).

/** Remove link and bold markup and normalize dashes. Never evaluates or follows anything. */
export function plain(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^\n)]*\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/[−–]/g, '-')
    .trim();
}

// ---------------------------------------------------------------------------------------------
// Envelope model.

export type Corpus = 'hero-standalone' | 'kit-signature' | 'granted' | 'foe-ability' | 'malice';

export type Block =
  | { kind: 'roll'; roll: string; tiers: [string, string, string] }
  | { kind: 'tiers'; tiers: [string, string, string] }
  | { kind: 'section'; label: string; text: string; cost?: string };

export interface Envelope {
  corpus: Corpus;
  /** Reader-declared presentation text; never arbitrary italic mechanics. */
  declaredFlavor?: string[];
  id: string;
  name: string;
  parent?: string;
  parentName?: string;
  sourcePath: string;
  usage: string;
  keywords: string[];
  distance: string;
  target: string;
  cost?: string;
  /** Blocks from the structured record (hero `structured.effects`, foe `fields.effects`) or the Markdown. */
  blocks: Block[];
  /** True when `blocks` came from a structured record and the Markdown is only cross-checked. */
  structured: boolean;
  /** The ability's own Markdown body (frontmatter removed, blockquote prefixes stripped). */
  markdown: string;
}

export type Category = 'COMPILES' | 'COMPILES_WITH_REMAINDER' | 'NO_MATCH';

export type DiagnosticType =
  | 'potency-condition'
  | 'push-with-extra'
  | 'slide'
  | 'shift'
  | 'pull'
  | 'condition'
  | 'extra-damage'
  | 'effect-paragraph'
  | 'malice-spend'
  | 'resource-spend'
  | 'trigger'
  | 'second-roll'
  | 'extra-table'
  | 'roll-expression'
  | 'tier-damage'
  | 'no-power-roll'
  | 'unknown';

export interface Diagnostic {
  type: DiagnosticType;
  /** Normalized clause-shape key used for the frequency ranking. */
  shape: string;
  /** Original clause text (display markup removed). */
  text: string;
  /** Structural position: `tier1`..`tier3`, `section:<n>`, `block:<n>`, `markdown`. */
  locator: string;
  /** Potency remainders only: within V26's bounded post-damage remainder shape. */
  bounded?: boolean;
}

export type Characteristic = 'M' | 'A' | 'R' | 'I' | 'P';

export type DamageExpression =
  | { kind: 'flat'; constant: number }
  | { kind: 'plusCharacteristic'; constant: number; characteristic: Characteristic }
  | { kind: 'plusChoice'; constant: number; choices: Characteristic[] };

export interface TierNodes {
  damage: DamageExpression;
  damageType?: string;
  push?: number;
}

export type TargetShape = 'self' | 'single' | 'multi' | 'area' | 'unknown';

export interface Classification {
  category: Category;
  /** NO_MATCH only: the first structural reason. */
  reason?: string;
  roll?: { permitted: Characteristic[]; fixedRollBonus?: number };
  tiers?: [TierNodes, TierNodes, TierNodes];
  diagnostics: Diagnostic[];
  /** COMPILES_WITH_REMAINDER whose every remainder is a V26 bounded potency clause. */
  withinV26Bounded: boolean;
  targetShape: TargetShape;
}

// ---------------------------------------------------------------------------------------------
// Markdown envelope reader.

export interface MarkdownItem {
  kind: 'title' | 'flavor' | 'table' | 'roll' | 'tier' | 'section' | 'paragraph' | 'heading';
  text: string;
  label?: string;
  tierIndex?: number;
}

const TIER_LABELS = ['≤11', '12-16', '17+'];

/** Labels the source uses for named sections; anything else with a colon is a paragraph. */
const SECTION_LABEL =
  /^((?:\d+\+? )?Malice|Spend \d+\+? [A-Za-z]+|Effect|Trigger|Special|Persistent \d+|Head|Legs|Torso|Villain Action \d?|Before|After)\s*:\s*(.*)$/;

export function readMarkdownItems(body: string, name: string): MarkdownItem[] {
  const items: MarkdownItem[] = [];
  let seenTitle = false;
  for (const original of body.split(/\r?\n/)) {
    const unquoted = original.replace(/^> ?/, '').trim();
    if (!unquoted) continue;
    const line = plain(unquoted);
    if (/^#{1,6} /.test(unquoted)) {
      const heading = line.replace(/^#{1,6} /, '');
      if (!seenTitle && (heading === name || heading.startsWith(`${name} (`))) {
        seenTitle = true;
        items.push({ kind: 'title', text: line });
      } else items.push({ kind: 'heading', text: line });
      continue;
    }
    if (/^\|[-:|\s]+\|$/.test(line)) continue;
    if (line.startsWith('|')) {
      items.push({ kind: 'table', text: line });
      continue;
    }
    const title = line.replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s+/g, ' ');
    if (!seenTitle && (title === name || title.startsWith(`${name} (`))) {
      seenTitle = true;
      items.push({ kind: 'title', text: line });
      continue;
    }
    if (/^\*[^*]+\*$/.test(unquoted)) {
      items.push({ kind: 'flavor', text: line });
      continue;
    }
    const roll = /^Power Roll \+ (.+):$/.exec(line);
    if (roll) {
      items.push({ kind: 'roll', text: `Power Roll + ${roll[1]}` });
      continue;
    }
    const tier = /^- (≤11|12-16|17\+):\s*(.*)$/.exec(line);
    if (tier) {
      items.push({ kind: 'tier', text: tier[2]!, tierIndex: TIER_LABELS.indexOf(tier[1]!) });
      continue;
    }
    const section = SECTION_LABEL.exec(line);
    if (section) {
      items.push({ kind: 'section', label: section[1]!, text: section[2]! });
      continue;
    }
    items.push({ kind: 'paragraph', text: line });
  }
  return items;
}

/** Blocks and envelope diagnostics derived from the Markdown alone. */
export function blocksFromMarkdown(items: MarkdownItem[]): {
  blocks: Block[];
  unattached: string[];
  tableRows: number;
} {
  const blocks: Block[] = [];
  const unattached: string[] = [];
  let tableRows = 0;
  let pendingTiers: (string | undefined)[] | null = null;
  let pendingRoll: string | null = null;
  let last: 'section' | 'tiers' | 'other' = 'other';
  const flushTiers = () => {
    if (!pendingTiers) return;
    const tiers = pendingTiers.map(t => t ?? '') as [string, string, string];
    if (pendingRoll !== null) blocks.push({ kind: 'roll', roll: pendingRoll, tiers });
    else blocks.push({ kind: 'tiers', tiers });
    pendingTiers = null;
    pendingRoll = null;
  };
  for (const item of items) {
    switch (item.kind) {
      case 'table':
        tableRows++;
        last = 'other';
        break;
      case 'roll':
        flushTiers();
        pendingRoll = item.text;
        pendingTiers = [undefined, undefined, undefined];
        last = 'other';
        break;
      case 'tier':
        if (!pendingTiers) pendingTiers = [undefined, undefined, undefined];
        if (item.tierIndex !== undefined) {
          if (pendingTiers[item.tierIndex] !== undefined) {
            flushTiers();
            pendingTiers = [undefined, undefined, undefined];
          }
          pendingTiers[item.tierIndex] = item.text;
        }
        last = 'tiers';
        break;
      case 'section': {
        flushTiers();
        const costLabel = /^(\d+\+? Malice|Spend \d+\+? [A-Za-z]+)$/.exec(item.label!);
        blocks.push({
          kind: 'section',
          label: item.label!,
          text: item.text,
          ...(costLabel ? { cost: item.label } : {}),
        });
        last = 'section';
        break;
      }
      case 'paragraph': {
        if (last === 'section') {
          const block = blocks[blocks.length - 1] as Extract<Block, { kind: 'section' }>;
          block.text = `${block.text}\n${item.text}`;
        } else {
          flushTiers();
          unattached.push(item.text);
          last = 'other';
        }
        break;
      }
      default:
        if (item.kind !== 'flavor' && item.kind !== 'title') last = 'other';
    }
  }
  flushTiers();
  return { blocks, unattached, tableRows };
}

// ---------------------------------------------------------------------------------------------
// Structured envelope reader (copy of convex/lib/resolve.ts effectsOf, keeping every block).

type Structured = Record<string, unknown>;
const stringOf = (value: unknown) => (typeof value === 'string' ? value : '');
const stringsOf = (value: unknown) =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

export function blocksFromStructured(list: unknown, trigger?: string): Block[] {
  const blocks: Block[] = [];
  if (trigger) blocks.push({ kind: 'section', label: 'Trigger', text: trigger });
  if (!Array.isArray(list)) return blocks;
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Structured;
    // A foe record can carry a leading Effect sentence together with its roll (Malice Upchuck).
    if (typeof record.effect === 'string' && typeof record.roll === 'string')
      blocks.push({
        kind: 'section',
        label: stringOf(record.name) || 'Effect',
        text: record.effect,
        ...(typeof record.cost === 'string' ? { cost: record.cost } : {}),
      });
    if (typeof record.roll === 'string')
      blocks.push({
        kind: 'roll',
        roll: record.roll,
        tiers: [stringOf(record.tier1), stringOf(record.tier2), stringOf(record.tier3)],
      });
    else if (typeof record.tier1 === 'string') {
      if (typeof record.effect === 'string')
        blocks.push({
          kind: 'section',
          label: stringOf(record.name) || 'Effect',
          text: record.effect,
        });
      blocks.push({
        kind: 'tiers',
        tiers: [stringOf(record.tier1), stringOf(record.tier2), stringOf(record.tier3)],
      });
    } else if (typeof record.effect === 'string')
      // A nameless, costless entry is a bare paragraph the source printed outside any labeled section.
      blocks.push({
        kind: 'section',
        label:
          stringOf(record.name) || (typeof record.cost === 'string' ? record.cost : 'Paragraph'),
        text: record.effect,
        ...(typeof record.cost === 'string' ? { cost: record.cost } : {}),
      });
  }
  return blocks;
}

// ---------------------------------------------------------------------------------------------
// Grammar.

const NAMES: Record<string, Characteristic> = {
  might: 'M',
  agility: 'A',
  reason: 'R',
  intuition: 'I',
  presence: 'P',
  m: 'M',
  a: 'A',
  r: 'R',
  i: 'I',
  p: 'P',
};
const DAMAGE_TYPES = [
  'acid',
  'cold',
  'corruption',
  'fire',
  'holy',
  'lightning',
  'poison',
  'psychic',
  'sonic',
];
const DAMAGE_CLAUSE = new RegExp(`^(.+?)\\s+(?:(${DAMAGE_TYPES.join('|')})\\s+)?damage$`, 'i');

function characteristicOf(word: string): Characteristic | undefined {
  return NAMES[word.replace(/^\[|\]$/g, '').toLowerCase()];
}

/** "Power Roll + Might or Agility" → permitted [M, A]; "Power Roll + 2" → fixed bonus 2; else undefined. */
export function rollExpression(
  rollText: string,
): { permitted: Characteristic[]; fixedRollBonus?: number } | undefined {
  const text = plain(rollText).replace(/^Power Roll\s*\+\s*/i, '');
  if (/^-?\d+$/.test(text) && Number.isSafeInteger(Number(text)))
    return { permitted: [], fixedRollBonus: Number(text) };
  const permitted: Characteristic[] = [];
  for (const word of text.split(/\s+or\s+/i)) {
    const c = characteristicOf(word.trim());
    if (!c) return undefined;
    if (!permitted.includes(c)) permitted.push(c);
  }
  return permitted.length ? { permitted } : undefined;
}

/**
 * Supported current damage expressions: `N`, `N + C`, `C + N`, `C`, `N + C or C`, each with an
 * optional damage type before `damage`. `C` is a characteristic letter, `[letter]` or full name.
 */
export function damageExpression(
  clause: string,
): { damage: DamageExpression; damageType?: string } | undefined {
  const match = DAMAGE_CLAUSE.exec(clause);
  if (!match) return undefined;
  const type = match[2]?.toLowerCase();
  const amount = match[1]!.trim();
  const damageType = type ? { damageType: type } : {};
  const constant = (value: string) =>
    Number.isSafeInteger(Number(value)) ? Number(value) : undefined;
  let m: RegExpExecArray | null;
  if ((m = /^(\d+)$/.exec(amount))) {
    const n = constant(m[1]!);
    return n === undefined ? undefined : { damage: { kind: 'flat', constant: n }, ...damageType };
  }
  if ((m = /^(\d+)\s*\+\s*(\S+)(?:\s+or\s+(\S+))?$/.exec(amount))) {
    const n = constant(m[1]!);
    const first = characteristicOf(m[2]!);
    const second = m[3] ? characteristicOf(m[3]) : undefined;
    if (n === undefined || !first || (m[3] && !second)) return undefined;
    return second
      ? { damage: { kind: 'plusChoice', constant: n, choices: [first, second] }, ...damageType }
      : {
          damage: { kind: 'plusCharacteristic', constant: n, characteristic: first },
          ...damageType,
        };
  }
  if ((m = /^(\S+)\s*\+\s*(\d+)$/.exec(amount))) {
    const n = constant(m[2]!);
    const first = characteristicOf(m[1]!);
    if (n === undefined || !first) return undefined;
    return {
      damage: { kind: 'plusCharacteristic', constant: n, characteristic: first },
      ...damageType,
    };
  }
  if ((m = /^(\S+)(?:\s+or\s+(\S+))?$/.exec(amount))) {
    const first = characteristicOf(m[1]!);
    const second = m[2] ? characteristicOf(m[2]) : undefined;
    if (!first || (m[2] && !second)) return undefined;
    return second
      ? { damage: { kind: 'plusChoice', constant: 0, choices: [first, second] }, ...damageType }
      : {
          damage: { kind: 'plusCharacteristic', constant: 0, characteristic: first },
          ...damageType,
        };
  }
  return undefined;
}

const CONDITIONS =
  'bleeding|dazed|frightened|grabbed|prone|restrained|slowed|taunted|weakened|wet|marked|transformed';

export type ConditionThreshold =
  { kind: 'printed'; value: number } | { kind: 'potency'; tier: 'weak' | 'average' | 'strong' };

/** Exact V88 post-damage clause. Position is checked by the enclosing tier reader. */
export function conditionExpression(clause: string):
  | {
      characteristic: Characteristic;
      threshold: ConditionThreshold;
      condition: ConditionId;
    }
  | undefined {
  const match =
    /^([MARIP]) < (-?\d+|WEAK|AVERAGE|STRONG),? (bleeding|dazed|frightened|grabbed|prone|restrained|slowed|taunted|weakened) \(save ends\)$/.exec(
      plain(clause),
    );
  if (!match) return undefined;
  const value = Number(match[2]);
  if (/^-?\d+$/.test(match[2]!) && !Number.isSafeInteger(value)) return undefined;
  return {
    characteristic: match[1] as Characteristic,
    threshold: /^-?\d+$/.test(match[2]!)
      ? { kind: 'printed', value }
      : { kind: 'potency', tier: match[2]!.toLowerCase() as 'weak' | 'average' | 'strong' },
    condition: match[3] as ConditionId,
  };
}

export type ConditionDuration = 'save-ends' | 'eot' | 'none';

/**
 * V113 post-damage condition clause: an optional potency, one core condition, and a printed
 * duration. Sources (pinned en/unified/md): rule/general/saving-throw.md "(save ends)";
 * rule/combat/end-of-turn.md "(EoT)"; condition/prone.md, whose own text ends it (Stand Up), so a
 * bare condition is admitted only for prone. Grabbed keeps V88's save-ends form only; its grab
 * relationships (condition/grabbed.md) are not modeled. V88's `conditionExpression` is unchanged.
 */
export function tierConditionExpression(clause: string):
  | {
      characteristic?: Characteristic;
      threshold: ConditionThreshold | { kind: 'always' };
      condition: ConditionId;
      duration: ConditionDuration;
    }
  | undefined {
  const match =
    /^(?:([MARIP]) < (-?\d+|WEAK|AVERAGE|STRONG),? )?(bleeding|dazed|frightened|grabbed|prone|restrained|slowed|taunted|weakened)(?: \((save ends|EoT)\))?$/i.exec(
      plain(clause),
    );
  if (!match) return undefined;
  if (match[1] && match[1] !== match[1].toUpperCase()) return undefined;
  const condition = match[3]!.toLowerCase() as ConditionId;
  const duration: ConditionDuration =
    match[4] === undefined ? 'none' : /^eot$/i.test(match[4]) ? 'eot' : 'save-ends';
  if (match[4] !== undefined && !['save ends', 'EoT'].includes(match[4])) return undefined;
  if (duration === 'none' && condition !== 'prone' && condition !== 'grabbed') return undefined;
  // V119: a grab lasts until it ends by its own rules (condition/grabbed.md); no EoT grab form.
  if (condition === 'grabbed' && duration === 'eot') return undefined;
  let threshold: ConditionThreshold | { kind: 'always' } = { kind: 'always' };
  if (match[2] !== undefined) {
    const value = Number(match[2]);
    if (/^-?\d+$/.test(match[2])) {
      if (!Number.isSafeInteger(value)) return undefined;
      threshold = { kind: 'printed', value };
    } else if (/^(WEAK|AVERAGE|STRONG)$/.test(match[2]))
      threshold = {
        kind: 'potency',
        tier: match[2].toLowerCase() as 'weak' | 'average' | 'strong',
      };
    else return undefined;
  }
  return {
    ...(match[1] ? { characteristic: match[1] as Characteristic } : {}),
    threshold,
    condition,
    duration,
  };
}

/**
 * V153 compound tier condition: one optional potency and one printed duration shared by two or more
 * core conditions ("P < WEAK, dazed and frightened (save ends)"). rule/general/saving-throw.md: an
 * effect ending "(save ends)" takes one saving throw "to remove the effect", so the conditions
 * share one save. A duration is required. Grabbed (condition/grabbed.md relationships) and prone
 * (condition/prone.md, Stand Up unless the effect says otherwise) stay single-condition forms.
 */
export function tierCompoundConditionExpression(clause: string):
  | {
      characteristic?: Characteristic;
      threshold: ConditionThreshold | { kind: 'always' };
      conditions: ConditionId[];
      duration: Exclude<ConditionDuration, 'none'>;
    }
  | undefined {
  const text = plain(clause).replace(/\.$/, '').replace(/\s+/g, ' ').trim();
  const match = /^(?:([MARIP]) < (-?\d+|WEAK|AVERAGE|STRONG),? )?(.+) \((save ends|EoT)\)$/.exec(
    text,
  );
  if (!match) return undefined;
  const list = /^([a-z]+)(?:, ([a-z]+))*,? and ([a-z]+)$/.exec(match[3]!);
  if (!list) return undefined;
  const names = match[3]!.replace(/,? and /, ', ').split(', ');
  const allowed = [
    'bleeding',
    'dazed',
    'frightened',
    'restrained',
    'slowed',
    'taunted',
    'weakened',
  ];
  if (
    names.length < 2 ||
    names.some(n => !allowed.includes(n)) ||
    new Set(names).size !== names.length
  )
    return undefined;
  const single = tierConditionExpression(
    `${match[1] ? `${match[1]} < ${match[2]}, ` : ''}${names[0]} (${match[4]})`,
  );
  if (!single) return undefined;
  return {
    ...(single.characteristic ? { characteristic: single.characteristic } : {}),
    threshold: single.threshold,
    conditions: names as ConditionId[],
    duration: match[4] === 'EoT' ? 'eot' : 'save-ends',
  };
}

/**
 * V153 unconditional condition then forced movement in one clause ("taunted (EoT), slide 1"),
 * applied in printed order. A potency before the condition is refused: whether it also gates the
 * movement is not stated.
 */
export function tierConditionMovementExpression(clause: string):
  | {
      condition: NonNullable<ReturnType<typeof tierConditionExpression>>;
      movement: NonNullable<ReturnType<typeof forcedMovementExpression>>;
      parts: [string, string];
    }
  | undefined {
  const text = plain(clause).replace(/\.$/, '').replace(/\s+/g, ' ').trim();
  const match = /^(.+ \((?:save ends|EoT)\)), ((?:vertical )?(?:push|pull|slide) \d+)$/.exec(text);
  if (!match) return undefined;
  const condition = tierConditionExpression(match[1]!);
  const movement = forcedMovementExpression(match[2]!);
  if (!condition || !movement || condition.threshold.kind !== 'always') return undefined;
  if (condition.condition === 'grabbed') return undefined;
  return { condition, movement, parts: [match[1]!, match[2]!] };
}

/**
 * V113 post-damage forced movement (movement/forced-movement.md): push, pull or slide N, optionally
 * "vertical". Potency-gated or combined movement stays unsupported.
 */
export function forcedMovementExpression(
  clause: string,
): { movement: 'push' | 'pull' | 'slide'; vertical: boolean; distance: number } | undefined {
  const match = /^(vertical )?(push|pull|slide) (\d+)$/i.exec(
    plain(clause).replace(/\.$/, '').replace(/\s+/g, ' ').trim(),
  );
  if (!match || (match[1] && match[1] !== 'vertical ')) return undefined;
  const distance = Number(match[3]);
  if (!Number.isSafeInteger(distance)) return undefined;
  return {
    movement: match[2]!.toLowerCase() as 'push' | 'pull' | 'slide',
    vertical: !!match[1],
    distance,
  };
}

/** Normalized clause-shape key: lowercase, dice → NdN, integers → N, symbolic potency → SYM. */
export function shapeOf(text: string): string {
  return plain(text)
    .replace(/\.$/, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\d+d\d+\b/g, 'NdN')
    .replace(/(?<![a-z])-?\d+(?![a-z])/g, 'N')
    .replace(/\b(weak|average|strong)\b/g, 'SYM')
    .trim();
}

function potencyShape(characteristic: string, threshold: string, rest: string): string {
  const value = /^-?\d+$/.test(threshold) ? 'N' : 'SYM';
  return `potency:${characteristic} < ${value} ${shapeOf(rest)}`;
}

/** Type one non-damage tier clause. `afterDamage` is true only for the clause right after damage. */
export function typeTierClause(
  clause: string,
  locator: string,
  afterDamage: boolean,
  lastClause = true,
): Diagnostic | null {
  const text = plain(clause).replace(/\.$/, '').trim();
  const lower = text.toLowerCase();
  const potency = /^([MARIP]) < (-?\d+|WEAK|AVERAGE|STRONG),? (.+)$/.exec(text);
  if (potency) {
    const rest = potency[3]!;
    const bounded = afterDamage && lastClause && conditionExpression(clause) !== undefined;
    return {
      type: 'potency-condition',
      shape: potencyShape(potency[1]!, potency[2]!, rest),
      text,
      locator,
      bounded,
    };
  }
  if (/^push \d+$/.test(lower)) {
    if (afterDamage) return null; // Supported push node.
    return {
      type: 'push-with-extra',
      shape: `${shapeOf(text)} (not directly after damage)`,
      text,
      locator,
    };
  }
  if (/\bpush\b/.test(lower))
    return { type: 'push-with-extra', shape: shapeOf(text), text, locator };
  if (/\bslide\b/.test(lower)) return { type: 'slide', shape: shapeOf(text), text, locator };
  if (/\bshifts?\b/.test(lower)) return { type: 'shift', shape: shapeOf(text), text, locator };
  if (/\bpull\b/.test(lower)) return { type: 'pull', shape: shapeOf(text), text, locator };
  if (damageExpression(text)) return { type: 'extra-damage', shape: shapeOf(text), text, locator };
  if (new RegExp(`^(the target is )?(${CONDITIONS})\\b`).test(lower))
    return { type: 'condition', shape: shapeOf(text), text, locator };
  return { type: 'unknown', shape: shapeOf(text), text, locator };
}

export function typeSection(block: Extract<Block, { kind: 'section' }>, index: number): Diagnostic {
  const locator = `section:${index}`;
  const label = plain(block.label);
  const text = plain(block.text);
  if (/^trigger$/i.test(label)) return { type: 'trigger', shape: 'trigger', text, locator };
  if (label === 'Paragraph')
    return { type: 'unknown', shape: 'unattached-paragraph', text, locator };
  const malice = /^(\d+\+?) Malice$/i.exec(plain(block.cost ?? label));
  if (malice) {
    const shape = `malice-spend:${malice[1]!.replace(/\d+/, 'N')} malice`;
    return { type: 'malice-spend', shape, text, locator };
  }
  const spend = /^Spend (\d+\+?) ([A-Za-z]+)$/i.exec(plain(block.cost ?? label));
  if (spend) {
    const shape = `resource-spend:spend ${spend[1]!.replace(/\d+/, 'N')} ${spend[2]!.toLowerCase()}`;
    return { type: 'resource-spend', shape, text, locator };
  }
  return {
    type: 'effect-paragraph',
    shape: `effect-paragraph:${shapeOf(label)}`,
    text,
    locator,
  };
}

/** Copy of convex/lib/resolve.ts targetShapeOf; `max` is the printed count for `multi`. */
const COUNT_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
export function targetShapeDetail(
  target: string,
  keywords: string[],
): { kind: TargetShape; max?: number } {
  const text = plain(target).toLowerCase();
  if (text === 'self') return { kind: 'self' };
  if (/^one (creature|enemy|ally)( or object)?$/.test(text)) return { kind: 'single' };
  const upTo = /^(?:up to )?(\w+) (creatures|enemies|allies)( or objects)?$/.exec(text);
  if (upTo) {
    const max = COUNT_WORDS[upTo[1]!] ?? Number(upTo[1]);
    if (Number.isInteger(max) && max > 0)
      return max === 1 ? { kind: 'single' } : { kind: 'multi', max };
  }
  const area = keywords.some(k => plain(k).toLowerCase() === 'area');
  if (area || /in the area|in the line|in the burst|in the cube/.test(text))
    return { kind: 'area' };
  return { kind: 'unknown' };
}
/**
 * V110: pinned rule/combat/target.md, Each [Target]: only an area Target that gives no number and
 * applies to each creature, enemy, ally or object in the area affects all eligible targets. Self,
 * numbered, special and triggering Targets are not this form, whatever the keywords say.
 */
export function eachAreaTarget(target: string): boolean {
  return /^each (creature|enemy|ally)(,? (and|or) objects?)? in the (area|line|burst|cube)$/.test(
    plain(target).toLowerCase(),
  );
}
export function targetShapeOf(target: string, keywords: string[]): TargetShape {
  return targetShapeDetail(target, keywords).kind;
}

/**
 * Classify one envelope against the bounded V26 grammar: exactly one power roll with three tiers,
 * each tier a supported damage expression optionally followed by `push N`; every other clause,
 * section, extra table, second roll or unattached paragraph is a typed remainder.
 */
export function classify(envelope: Envelope): Classification {
  const diagnostics: Diagnostic[] = [];
  const targetShape = targetShapeOf(envelope.target, envelope.keywords);
  let reason: string | undefined;
  const fail = (why: string) => {
    reason ??= why;
  };

  const rollBlocks = envelope.blocks.filter(
    (b): b is Extract<Block, { kind: 'roll' }> => b.kind === 'roll',
  );
  let roll: Classification['roll'];
  let tiers: Classification['tiers'];

  envelope.blocks.forEach((block, index) => {
    if (block.kind === 'section') {
      if (
        block.label !== 'Effect' ||
        block.cost ||
        !envelope.blocks.slice(0, index).some(prior => prior.kind === 'roll') ||
        !effectRider(plain(block.text))
      )
        diagnostics.push(typeSection(block, index));
    } else if (block.kind === 'tiers')
      diagnostics.push({
        type: 'extra-table',
        shape: 'extra-table:tiers without a power roll',
        text: block.tiers.map(plain).join(' / '),
        locator: `block:${index}`,
      });
  });

  if (rollBlocks.length === 0) {
    fail(
      envelope.blocks.some(b => b.kind === 'tiers') ? 'tiers-without-power-roll' : 'no-power-roll',
    );
    diagnostics.push({
      type: 'no-power-roll',
      shape: 'no-power-roll',
      text: '',
      locator: 'envelope',
    });
  } else {
    if (rollBlocks.length > 1) {
      fail('multiple-power-rolls');
      rollBlocks.slice(1).forEach((block, i) =>
        diagnostics.push({
          type: 'second-roll',
          shape: `second-roll:${shapeOf(block.roll)}`,
          text: plain(block.roll),
          locator: `roll:${i + 2}`,
        }),
      );
    }
    const first = rollBlocks[0]!;
    roll = rollExpression(first.roll);
    if (!roll) {
      fail('roll-expression-outside-grammar');
      diagnostics.push({
        type: 'roll-expression',
        shape: `roll:${shapeOf(first.roll)}`,
        text: plain(first.roll),
        locator: 'roll:1',
      });
    }
    const nodes: TierNodes[] = [];
    first.tiers.forEach((tierText, index) => {
      const locator = `tier${index + 1}`;
      const clauses = tierText
        .split(';')
        .map(c => plain(c).replace(/\.$/, '').trim())
        .filter(Boolean);
      if (clauses.length === 0) {
        fail(`${locator}-missing`);
        diagnostics.push({ type: 'tier-damage', shape: 'tier:empty', text: '', locator });
        return;
      }
      const damage = damageExpression(clauses[0]!);
      if (!damage) {
        fail(`${locator}-damage-outside-grammar`);
        diagnostics.push({
          type: 'tier-damage',
          shape: `tier:${shapeOf(clauses[0]!)}`,
          text: clauses[0]!,
          locator,
        });
        clauses.slice(1).forEach(clause => {
          const d = typeTierClause(clause, locator, false);
          if (d) diagnostics.push(d);
        });
        return;
      }
      const node: TierNodes = {
        damage: damage.damage,
        ...(damage.damageType ? { damageType: damage.damageType } : {}),
      };
      clauses.slice(1).forEach((clause, i) => {
        const d = typeTierClause(clause, locator, i === 0, clauses.length === 2);
        if (d) diagnostics.push(d);
        else node.push = Number(/\d+/.exec(clause)![0]);
      });
      nodes.push(node);
    });
    if (nodes.length === 3) tiers = nodes as [TierNodes, TierNodes, TierNodes];
  }

  // Envelope coverage from the Markdown: rolls, tiers and sections must match the blocks used, and
  // no paragraph may sit outside a named section (V26 check 5: nothing outside `effects` is harmless).
  const items = readMarkdownItems(envelope.markdown, envelope.name);
  const fromMarkdown = blocksFromMarkdown(items);
  if (!envelope.structured)
    fromMarkdown.unattached.forEach((text, i) =>
      diagnostics.push({
        type: 'unknown',
        shape: 'unattached-paragraph',
        text,
        locator: `markdown:paragraph:${i + 1}`,
      }),
    );
  if (fromMarkdown.tableRows > 2)
    diagnostics.push({
      type: 'extra-table',
      shape: 'extra-table:additional table rows',
      text: `${fromMarkdown.tableRows} table rows`,
      locator: 'markdown:table',
    });
  if (envelope.structured) {
    const mdRolls = fromMarkdown.blocks.filter(b => b.kind === 'roll');
    const mdSections = fromMarkdown.blocks.filter(b => b.kind === 'section');
    const sections = envelope.blocks.filter(b => b.kind === 'section' && b.label !== 'Paragraph');
    const paragraphs = envelope.blocks.filter(b => b.kind === 'section' && b.label === 'Paragraph');
    const mismatch: string[] = [];
    if (fromMarkdown.unattached.length !== paragraphs.length)
      mismatch.push(
        `markdown has ${fromMarkdown.unattached.length} unattached paragraphs, structured has ${paragraphs.length}`,
      );
    if (mdRolls.length !== rollBlocks.length)
      mismatch.push(
        `markdown has ${mdRolls.length} power rolls, structured has ${rollBlocks.length}`,
      );
    rollBlocks.forEach((block, i) => {
      const md = mdRolls[i];
      if (!md || md.kind !== 'roll') return;
      block.tiers.forEach((tier, t) => {
        if (plain(tier).replace(/\.$/, '') !== plain(md.tiers[t]!).replace(/\.$/, ''))
          mismatch.push(`tier${t + 1} text differs between structured and markdown`);
      });
    });
    if (mdSections.length !== sections.length)
      mismatch.push(
        `markdown has ${mdSections.length} sections, structured has ${sections.length}`,
      );
    if (mismatch.length)
      diagnostics.push({
        type: 'unknown',
        shape: 'envelope:structured-markdown-mismatch',
        text: mismatch.join('; '),
        locator: 'markdown',
      });
  }

  diagnostics.sort(
    (a, b) => a.locator.localeCompare(b.locator, 'en') || a.shape.localeCompare(b.shape, 'en'),
  );
  const category: Category = reason
    ? 'NO_MATCH'
    : diagnostics.length
      ? 'COMPILES_WITH_REMAINDER'
      : 'COMPILES';
  return {
    category,
    ...(reason ? { reason } : {}),
    ...(roll ? { roll } : {}),
    ...(tiers ? { tiers } : {}),
    diagnostics,
    withinV26Bounded:
      category === 'COMPILES_WITH_REMAINDER' &&
      diagnostics.every(d => d.type === 'potency-condition' && d.bounded === true),
    targetShape,
  };
}

// ---------------------------------------------------------------------------------------------
// Pure source-envelope adapters.

export interface ContentEntry {
  id: string;
  kind: string;
  name: string;
  sourcePath: string;
  text: string;
  structured: Structured;
}

const stripFrontmatter = (text: string) => text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');

export function heroEnvelope(entry: ContentEntry): Envelope {
  const s = entry.structured;
  return {
    corpus: 'hero-standalone',
    id: entry.id,
    name: entry.name,
    sourcePath: entry.sourcePath,
    usage: plain(stringOf(s.action_type)),
    keywords: stringsOf(s.keywords).map(plain),
    distance: plain(stringOf(s.distance)),
    target: plain(stringOf(s.target)),
    ...(typeof s.cost === 'string' ? { cost: plain(s.cost) } : {}),
    blocks: blocksFromStructured(s.effects, typeof s.trigger === 'string' ? s.trigger : undefined),
    structured: true,
    markdown: stripFrontmatter(entry.text),
  };
}

export const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** A kit's own printed signature section (copy of convex/lib/resolve.ts abilityFromKit extraction). */
export function kitEnvelope(entry: ContentEntry, name: string): Envelope {
  const envelope = headedEnvelope('kit-signature', entry, name, `${entry.id}/${slug(name)}`);
  // The kit format declares exactly the standalone italic line immediately after its heading.
  // Subsequent italics (including inside/after mechanics) remain unaccounted source text.
  const lines = envelope.markdown
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  const flavor = lines[1];
  return {
    ...envelope,
    ...(flavor && /^\*[^*]+\*$/.test(flavor)
      ? { declaredFlavor: [plain(flavor.slice(1, -1))] }
      : {}),
  };
}

/** The `###### <name>` section of an entry that embeds an ability (kits and perks). */
export function headedEnvelope(
  corpus: Corpus,
  entry: ContentEntry,
  name: string,
  id: string,
): Envelope {
  const marker = `###### ${name}\n`;
  const offset = entry.text.indexOf(marker);
  const section = offset < 0 ? '' : entry.text.slice(offset).split(/\n#{1,6} /)[0]!;
  const lines = section.split('\n');
  const tableRows = lines.filter(line => line.startsWith('|')).map(plain);
  const header = tableRows[0]?.split('|').map(v => v.trim()) ?? [];
  const targetRow =
    tableRows
      .find(line => line.includes('🎯'))
      ?.split('|')
      .map(v => v.trim()) ?? [];
  return markdownEnvelope({
    corpus,
    id,
    name,
    parentName: entry.name,
    sourcePath: entry.sourcePath,
    usage: header[2] ?? '',
    keywords: (header[1] ?? '')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean),
    distance: (targetRow[1] ?? '').replace(/^📏\s*/, ''),
    target: (targetRow[2] ?? '').replace(/^🎯\s*/, ''),
    markdown: section,
  });
}

/** An envelope whose blocks come from its Markdown (kits and embedded complication abilities). */
export function markdownEnvelope(base: Omit<Envelope, 'blocks' | 'structured'>): Envelope {
  const items = readMarkdownItems(base.markdown, base.name);
  const { blocks } = blocksFromMarkdown(items);
  return { ...base, blocks, structured: false };
}

export function foeEnvelope(
  object: FoeObjectLike,
  corpus: 'foe-ability' | 'malice',
  parentName: string,
): Envelope {
  const f = object.fields;
  return {
    corpus,
    id: object.id,
    name: object.name,
    ...(object.parentId ? { parent: object.parentId } : {}),
    parentName,
    sourcePath: object.source.path,
    usage: plain(stringOf(f.usage)),
    keywords: stringsOf(f.keywords).map(plain),
    distance: plain(stringOf(f.distance)),
    target: plain(stringOf(f.target)),
    ...(typeof f.cost === 'string' ? { cost: plain(f.cost) } : {}),
    blocks: blocksFromStructured(f.effects, typeof f.trigger === 'string' ? f.trigger : undefined),
    structured: true,
    markdown: object.markdown,
  };
}

export interface FoeObjectLike {
  id: string;
  kind: string;
  name: string;
  parentId?: string;
  fields: Structured;
  markdown: string;
  source: { path: string; revision: string };
}
