// SPDX-License-Identifier: GPL-3.0-only
/**
 * V64: deterministic coverage audit of the bounded V26 ability grammar over every ability envelope
 * in the committed content snapshot (hero standalone entries, kit signatures, wizard grants, foe
 * abilities and Malice features with a power roll).
 *
 * The classifier is a read-only text check. It never evaluates an expression, never executes an
 * effect and never changes gameplay behavior. The report is developer evidence for
 * docs/build/V26-compiled-ability-effects.md ("Proposed implementation contract" section 1,
 * acceptance checks 4, 5, 10 and 11, and the affected-ability audit), not a support ledger.
 *
 * The envelope readers below deliberately copy the minimal pure field-access conventions of
 * convex/lib/resolve.ts (`effectsOf`, `abilityFromKit`, `targetShapeOf`, `rollEntry`) and
 * shared/resolve/index.ts (`plainText`, tier clause splitting on `;`). Importing convex/lib/resolve.ts
 * would pull in Convex generated types, so the logic is duplicated here with the same semantics and
 * documented differences (every roll block is kept, not only the first).
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { COMPLICATION_ABILITIES } from '../shared/content/supporting-complication-abilities.ts';
import { SUPPORTING_KITS } from '../shared/content/supporting-kits.ts';
import type { Decision, DecisionDefinitions } from '../shared/evaluate/definitions.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (relative: string) => readFileSync(join(root, relative), 'utf8');

export const REPORT_DIR = 'docs/build/evidence/V26/coverage-audit-2026-09-20';

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

interface MarkdownItem {
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
function typeTierClause(clause: string, locator: string, afterDamage: boolean): Diagnostic | null {
  const text = plain(clause).replace(/\.$/, '').trim();
  const lower = text.toLowerCase();
  const potency = /^([MARIP]) < (-?\d+|WEAK|AVERAGE|STRONG),? (.+)$/.exec(text);
  if (potency) {
    const rest = potency[3]!;
    const bounded = afterDamage && /^(bleeding|slowed) \(save ends\)$/.test(rest);
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

function typeSection(block: Extract<Block, { kind: 'section' }>, index: number): Diagnostic {
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

/** Copy of convex/lib/resolve.ts targetShapeOf, returning only the shape kind. */
const COUNT_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
export function targetShapeOf(target: string, keywords: string[]): TargetShape {
  const text = plain(target).toLowerCase();
  if (text === 'self') return 'self';
  if (/^one (creature|enemy|ally)( or object)?$/.test(text)) return 'single';
  const upTo = /^(?:up to )?(\w+) (creatures|enemies|allies)( or objects)?$/.exec(text);
  if (upTo) {
    const max = COUNT_WORDS[upTo[1]!] ?? Number(upTo[1]);
    if (Number.isInteger(max) && max > 0) return max === 1 ? 'single' : 'multi';
  }
  const area = keywords.some(k => plain(k).toLowerCase() === 'area');
  if (area || /in the area|in the line|in the burst|in the cube/.test(text)) return 'area';
  return 'unknown';
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
    if (block.kind === 'section') diagnostics.push(typeSection(block, index));
    else if (block.kind === 'tiers')
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
        const d = typeTierClause(clause, locator, i === 0);
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
// Corpus construction.

interface ContentEntry {
  id: string;
  kind: string;
  name: string;
  sourcePath: string;
  text: string;
  structured: Structured;
}

const stripFrontmatter = (text: string) => text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');

function heroEnvelope(entry: ContentEntry): Envelope {
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

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** A kit's own printed signature section (copy of convex/lib/resolve.ts abilityFromKit extraction). */
function kitEnvelope(entry: ContentEntry, name: string): Envelope {
  return headedEnvelope('kit-signature', entry, name, `${entry.id}/${slug(name)}`);
}

/** The `###### <name>` section of an entry that embeds an ability (kits and perks). */
function headedEnvelope(corpus: Corpus, entry: ContentEntry, name: string, id: string): Envelope {
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
function markdownEnvelope(base: Omit<Envelope, 'blocks' | 'structured'>): Envelope {
  const items = readMarkdownItems(base.markdown, base.name);
  const { blocks } = blocksFromMarkdown(items);
  return { ...base, blocks, structured: false };
}

function foeEnvelope(
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

interface FoeObjectLike {
  id: string;
  kind: string;
  name: string;
  parentId?: string;
  fields: Structured;
  markdown: string;
  source: { path: string; revision: string };
}

export interface GrantRecord {
  name: string;
  sourcePath: string;
  decisionId: string;
  level: number;
  grantKind: string;
  /** Whether the current wizard can select the grant's decision chain. */
  selectable: 'selectable' | 'not-selectable' | 'unknown';
  detail: string;
}

/** Whether the v0.01 application offers an option value (copy of shared/evaluate/structure.ts isSupported). */
function isSupported(decision: Decision, value: string): boolean {
  const option = decision.options?.find(o => o.value === value);
  if (option) return option.supportedInV001;
  if (decision.supportedInV001) return decision.supportedInV001.includes(value);
  const set = (decision as { supportedSetInV001?: string[] }).supportedSetInV001;
  if (set) return set.includes(value);
  return false;
}

function reachability(
  decision: Decision,
  index: Map<string, Decision>,
  seen = new Set<string>(),
): 'selectable' | 'not-selectable' | 'unknown' {
  if (seen.has(decision.id)) return 'unknown';
  seen.add(decision.id);
  if (decision.selectedPool || decision.abilityPool) return 'unknown';
  for (const condition of decision.conditions ?? []) {
    if (condition.not) continue;
    const parent = index.get(condition.decision);
    if (!parent) return 'unknown';
    if (!isSupported(parent, condition.value)) return 'not-selectable';
    const upstream = reachability(parent, index, seen);
    if (upstream !== 'selectable') return upstream;
  }
  if (decision.availableWhen) {
    const parent = index.get(decision.availableWhen.decision);
    if (!parent) return 'unknown';
    if (!isSupported(parent, decision.availableWhen.value)) return 'not-selectable';
    return reachability(parent, index, seen);
  }
  return 'selectable';
}

const FURY_ABILITY_DECISIONS = [
  'class.fury.signature-ability',
  'class.fury.ability-3',
  'class.fury.ability-5',
];
const GRANT_KINDS = new Set([
  'ancestry-ability',
  'class-ability',
  'aspect-ability',
  'perk-ability',
]);

/** Every ability grant the evaluator would derive from the composed wizard definitions. */
export function wizardGrants(definitions: DecisionDefinitions, level: number): GrantRecord[] {
  const out: GrantRecord[] = [];
  const index = new Map<string, Decision>();
  for (const step of definitions.steps)
    for (const decision of step.decisions) index.set(decision.id, decision);
  const combine = (a: GrantRecord['selectable'], b: GrantRecord['selectable']) =>
    a === 'not-selectable' || b === 'not-selectable'
      ? 'not-selectable'
      : a === 'unknown' || b === 'unknown'
        ? 'unknown'
        : 'selectable';
  for (const decision of index.values()) {
    const chain = reachability(decision, index);
    for (const option of decision.options ?? []) {
      const isAbilityOption =
        option.abilityKind !== undefined || FURY_ABILITY_DECISIONS.includes(decision.id);
      if (isAbilityOption && option.source)
        out.push({
          name: option.value,
          sourcePath: option.source,
          decisionId: decision.id,
          level,
          grantKind:
            option.abilityKind ??
            (decision.id === 'class.fury.signature-ability' ? 'signature' : 'heroic'),
          selectable: combine(chain, option.supportedInV001 ? 'selectable' : 'not-selectable'),
          detail: `option ${option.value} supportedInV001=${option.supportedInV001}; chain ${chain}`,
        });
      for (const grant of option.grants ?? [])
        if (GRANT_KINDS.has(grant.kind) && grant.source)
          out.push({
            name: grant.value,
            sourcePath: grant.source,
            decisionId: decision.id,
            level,
            grantKind: grant.kind,
            selectable: combine(chain, option.supportedInV001 ? 'selectable' : 'not-selectable'),
            detail: `grant of option ${option.value} supportedInV001=${option.supportedInV001}; chain ${chain}`,
          });
      if (decision.id === 'class.fury.aspect')
        for (const grant of option.grants ?? [])
          if (grant.kind === 'ability' && grant.source)
            out.push({
              name: grant.value,
              sourcePath: grant.source,
              decisionId: decision.id,
              level,
              grantKind: 'aspect-triggered',
              selectable: combine(chain, option.supportedInV001 ? 'selectable' : 'not-selectable'),
              detail: `aspect ${option.value} supportedInV001=${option.supportedInV001}; chain ${chain}`,
            });
    }
    if (decision.kind === 'automatic')
      for (const grant of decision.grants ?? []) {
        const kit = /^kit\.(.+)\.contributions$/.exec(decision.id);
        if (GRANT_KINDS.has(grant.kind) && grant.source)
          out.push({
            name: grant.value,
            sourcePath: grant.source,
            decisionId: decision.id,
            level,
            grantKind: grant.kind,
            selectable: chain,
            detail: `automatic grant; chain ${chain}`,
          });
        else if (grant.kind === 'ability' && grant.source && decision.id === 'free-strikes.grant')
          out.push({
            name: grant.value,
            sourcePath: grant.source,
            decisionId: decision.id,
            level,
            grantKind: 'free-strike',
            selectable: chain,
            detail: `automatic grant; chain ${chain}`,
          });
        else if (grant.kind === 'ability' && kit && decision.availableWhen)
          // The evaluator resolves a kit signature through SUPPORTING_KITS by the selected kit name.
          out.push({
            name: grant.value,
            sourcePath: `${SUPPORTING_KITS[decision.availableWhen.value]?.entryPath ?? grant.source ?? ''}#${slug(grant.value)}`,
            decisionId: decision.id,
            level,
            grantKind: 'kit-signature',
            selectable: chain,
            detail: `kit contributions; chain ${chain}`,
          });
      }
  }
  const complicationChoice = index.get('complication.choice');
  for (const source of COMPLICATION_ABILITIES) {
    const decision = index.get(source.availability.decision) ?? complicationChoice;
    const supported = decision ? isSupported(decision, source.availability.value) : false;
    const chain = decision ? reachability(decision, index) : 'unknown';
    const trait = source.selectedTrait ? index.get(source.selectedTrait.decision) : undefined;
    const traitSupported = source.selectedTrait
      ? trait
        ? isSupported(trait, source.selectedTrait.value)
        : undefined
      : true;
    out.push({
      name: source.name,
      sourcePath: `complication:${source.complication}/${slug(source.name)}`,
      decisionId: source.selectedTrait?.decision ?? source.availability.decision,
      level,
      grantKind: source.kind,
      selectable:
        traitSupported === undefined
          ? 'unknown'
          : combine(chain, supported && traitSupported ? 'selectable' : 'not-selectable'),
      detail: `complication ${source.availability.value} supported=${supported}${source.selectedTrait ? `; trait ${source.selectedTrait.value} supported=${traitSupported}` : ''}; chain ${chain}`,
    });
  }
  return out.sort(
    (a, b) =>
      a.sourcePath.localeCompare(b.sourcePath, 'en') ||
      a.decisionId.localeCompare(b.decisionId, 'en') ||
      a.level - b.level,
  );
}

export interface AuditEntry {
  corpus: Corpus;
  id: string;
  name: string;
  parent?: string;
  parentName?: string;
  sourcePath: string;
  usage: string;
  target: string;
  cost?: string;
  classification: Classification;
  /** Wizard grants that resolve to this entry (hero standalone and kit signatures). */
  grants?: GrantRecord[];
  availability?: 'selectable' | 'not-selectable' | 'not-granted' | 'unknown';
  /** V26 design expectation, when the ability is one of the thirteen inventoried ones. */
  v26?: { label: string; expected: Category; agrees: boolean };
}

/** The V26 inventory (docs/build/V26-compiled-ability-effects.md, ability table) with the category each design implies. */
export const V26_INVENTORY: {
  label: string;
  match: (entry: AuditEntry) => boolean;
  expected: Category;
  note: string;
}[] = [
  {
    label: 'Brutal Slam',
    match: e => e.id === 'mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam',
    expected: 'COMPILES',
    note: 'damage then ordinary push instruction',
  },
  {
    label: 'Spear Charge',
    match: e => e.name === 'Spear Charge' && /goblin-warrior$/.test(e.parent ?? ''),
    expected: 'COMPILES',
    note: 'printed 3/4/5 damage, fixed +2',
  },
  {
    label: 'Bury the Point',
    match: e => e.name === 'Bury the Point' && /goblin-warrior$/.test(e.parent ?? ''),
    expected: 'COMPILES_WITH_REMAINDER',
    note: 'damage then bounded potency/bleeding/save remainder',
  },
  {
    label: 'Melee Free Strike',
    match: e => e.id === 'mcdm.heroes.v1/feature.ability.common/melee-weapon-free-strike',
    expected: 'COMPILES',
    note: 'independent Might/Agility roll and damage choices',
  },
  {
    label: 'Ranged Free Strike',
    match: e => e.id === 'mcdm.heroes.v1/feature.ability.common/ranged-weapon-free-strike',
    expected: 'COMPILES',
    note: 'independent Might/Agility roll and damage choices',
  },
  {
    label: 'Pain for Pain',
    match: e => e.corpus === 'kit-signature' && e.name === 'Pain for Pain',
    expected: 'COMPILES_WITH_REMAINDER',
    note: 'conditional Effect rider stays outside the safe subset',
  },
  {
    label: 'Out of the Way!',
    match: e => e.id === 'mcdm.heroes.v1/feature.ability.fury.level-1/out-of-the-way',
    expected: 'COMPILES_WITH_REMAINDER',
    note: 'slide and movement rider remain manual',
  },
  {
    label: 'Thunder Roar',
    match: e => e.id === 'mcdm.heroes.v1/feature.ability.fury.level-1/thunder-roar',
    expected: 'COMPILES_WITH_REMAINDER',
    note: 'area, nearest-first Effect; push not an independent instruction',
  },
  {
    label: 'Lines of Force',
    match: e => e.id === 'mcdm.heroes.v1/feature.ability.fury.level-1/lines-of-force',
    expected: 'NO_MATCH',
    note: 'no power roll; triggered action',
  },
  {
    label: 'Viscous Fire',
    match: e => e.id === 'mcdm.heroes.v1/feature.ability.elementalist.level-1/viscous-fire',
    expected: 'COMPILES',
    note: 'fire damage + Reason then push',
  },
  {
    label: 'Meteoric Introduction (compile-only)',
    match: e =>
      e.id === 'mcdm.heroes.v1/feature.ability.elementalist.level-1/meteoric-introduction',
    expected: 'COMPILES',
    note: 'damage + Reason then push; no live grant',
  },
  {
    label: 'Ray of Agonizing Self-Reflection (compile-only)',
    match: e =>
      e.id ===
      'mcdm.heroes.v1/feature.ability.elementalist.level-1/ray-of-agonizing-self-reflection',
    expected: 'COMPILES_WITH_REMAINDER',
    note: 'symbolic potency/slowed/save remainder; no live grant',
  },
  {
    label: 'Spinecleaver Axe (compile-only)',
    match: e => e.name === 'Axe' && /goblin-spinecleaver$/.test(e.parent ?? ''),
    expected: 'COMPILES',
    note: 'damage then push; minion envelope retained outside execution',
  },
];

export interface AuditInputs {
  abilities: ContentEntry[];
  kits: ContentEntry[];
  perks: ContentEntry[];
  manifest: {
    compendium?: unknown;
    contentHash?: string;
    entries: { id: string; sourcePath: string }[];
  };
  foes: { sourceRevision: string; edition: string; objects: FoeObjectLike[] };
}

export function readInputs(): AuditInputs {
  const json = <T>(relative: string) => JSON.parse(read(relative)) as T;
  return {
    abilities: json<ContentEntry[]>('shared/content/compendium/ability.json'),
    kits: json<ContentEntry[]>('shared/content/compendium/kit.json'),
    perks: json<ContentEntry[]>('shared/content/compendium/perk.json'),
    manifest: json<AuditInputs['manifest']>('shared/content/compendium/manifest.json'),
    foes: json<AuditInputs['foes']>('shared/content/foes/catalog.json'),
  };
}

export interface Report {
  generator: string;
  contentHash?: string;
  foesEdition: string;
  sourceRevision: string;
  totals: Record<Corpus, Record<Category, number> & { total: number; withinV26Bounded: number }>;
  grants: {
    total: number;
    resolvedToStandalone: number;
    resolvedToKit: number;
    ownText: number;
    unresolved: GrantRecord[];
  };
  entries: AuditEntry[];
  shapes: {
    shape: string;
    type: DiagnosticType;
    count: number;
    abilities: number;
    examples: string[];
  }[];
  v26: {
    label: string;
    expected: Category;
    actual: Category | 'missing';
    agrees: boolean;
    id?: string;
    availability?: string;
    note: string;
  }[];
  buys: Record<
    'foe' | 'hero',
    {
      total: number;
      compiles: number;
      withRemainder: number;
      withinV26Bounded: number;
      noMatch: number;
    }
  >;
}

export interface Corpus_ {
  envelopes: Envelope[];
  /** Grants keyed by the envelope id they resolve to or were classified from. */
  grantsByEnvelope: Map<string, GrantRecord[]>;
  grants: {
    total: number;
    resolvedToStandalone: number;
    resolvedToKit: number;
    ownText: number;
    unresolved: GrantRecord[];
  };
}

/** Every envelope in the audit population, in deterministic order, with the wizard grants attached. */
export function buildCorpus(inputs: AuditInputs = readInputs()): Corpus_ {
  const envelopes: Envelope[] = [];
  const bySourcePath = new Map<string, Envelope>();
  const grantsByEnvelope = new Map<string, GrantRecord[]>();
  const strip = (path: string) => path.replace(/^vendor\/steel-compendium\//, '');

  for (const entry of inputs.abilities) {
    const envelope = heroEnvelope(entry);
    envelopes.push(envelope);
    bySourcePath.set(strip(entry.sourcePath), envelope);
  }
  for (const kit of inputs.kits) {
    const supporting = Object.values(SUPPORTING_KITS).find(
      k => k.entryPath === strip(kit.sourcePath),
    );
    const names = supporting
      ? [supporting.signatureAbility]
      : [...kit.text.matchAll(/^###### (.+)$/gm)].map(m => m[1]!.trim());
    for (const name of names) {
      const envelope = kitEnvelope(kit, name);
      envelopes.push(envelope);
      bySourcePath.set(`${strip(kit.sourcePath)}#${slug(name)}`, envelope);
    }
  }

  // Wizard grants: resolve to the standalone/kit entry where possible; otherwise classify own text.
  const grants = [...wizardGrants(getDefinitions(1), 1), ...wizardGrants(getDefinitions(2), 2)];
  const perkByPath = new Map(inputs.perks.map(p => [strip(p.sourcePath), p]));
  let resolvedToStandalone = 0;
  let resolvedToKit = 0;
  let ownText = 0;
  const unresolved: GrantRecord[] = [];
  const ownEnvelopes = new Map<string, Envelope>();
  const attach = (id: string, grant: GrantRecord) => {
    const list = grantsByEnvelope.get(id) ?? [];
    list.push(grant);
    grantsByEnvelope.set(id, list);
  };
  for (const grant of grants) {
    const target = bySourcePath.get(grant.sourcePath);
    if (target) {
      attach(target.id, grant);
      if (target.corpus === 'kit-signature') resolvedToKit++;
      else resolvedToStandalone++;
      continue;
    }
    const complication = grant.sourcePath.startsWith('complication:')
      ? COMPLICATION_ABILITIES.find(
          c => `complication:${c.complication}/${slug(c.name)}` === grant.sourcePath,
        )
      : undefined;
    if (complication) {
      if (!ownEnvelopes.has(grant.sourcePath)) {
        const items = readMarkdownItems(complication.text, complication.name);
        const header = items
          .filter(i => i.kind === 'table')
          .map(i => i.text.split('|').map(v => v.trim()));
        ownEnvelopes.set(
          grant.sourcePath,
          markdownEnvelope({
            corpus: 'granted',
            id: grant.sourcePath,
            name: complication.name,
            parentName: complication.complication,
            sourcePath: complication.sourcePath,
            usage: header[0]?.[2] ?? '',
            keywords: (header[0]?.[1] ?? '')
              .split(',')
              .map(v => v.trim())
              .filter(Boolean),
            distance: (header[1]?.[1] ?? '').replace(/^📏\s*/, ''),
            target: (header[1]?.[2] ?? '').replace(/^🎯\s*/, ''),
            markdown: complication.text,
          }),
        );
      }
      attach(grant.sourcePath, grant);
      ownText++;
      continue;
    }
    const perk = perkByPath.get(grant.sourcePath);
    if (perk) {
      // Like a kit, a perk prints its ability under its own `######` heading; only that section is the envelope.
      const id = `${perk.id}/${slug(grant.name)}`;
      if (!ownEnvelopes.has(grant.sourcePath))
        ownEnvelopes.set(grant.sourcePath, headedEnvelope('granted', perk, grant.name, id));
      attach(id, grant);
      ownText++;
      continue;
    }
    unresolved.push(grant);
  }
  for (const [, envelope] of [...ownEnvelopes.entries()].sort(([a], [b]) =>
    a.localeCompare(b, 'en'),
  ))
    envelopes.push(envelope);

  // Foes: every ability object, plus Malice features containing a power roll.
  const parents = new Map(inputs.foes.objects.map(o => [o.id, o]));
  const parentName = (o: FoeObjectLike) =>
    o.parentId ? (parents.get(o.parentId)?.name ?? o.parentId) : '';
  const parentKey = (o: FoeObjectLike) => o.parentId ?? '';
  const ordered = (kind: string, extra: (o: FoeObjectLike) => boolean) =>
    inputs.foes.objects
      .filter(o => o.kind === kind && extra(o))
      .sort(
        (a, b) => parentKey(a).localeCompare(parentKey(b), 'en') || a.id.localeCompare(b.id, 'en'),
      );
  for (const object of ordered('ability', () => true))
    envelopes.push(foeEnvelope(object, 'foe-ability', parentName(object)));
  for (const object of ordered('malice', o => /Power Roll \+/.test(o.markdown)))
    envelopes.push(foeEnvelope(object, 'malice', parentName(object)));

  return {
    envelopes,
    grantsByEnvelope,
    grants: { total: grants.length, resolvedToStandalone, resolvedToKit, ownText, unresolved },
  };
}

export function audit(inputs: AuditInputs = readInputs()): Report {
  const corpus = buildCorpus(inputs);
  const entries: AuditEntry[] = corpus.envelopes.map(envelope => {
    const grants = corpus.grantsByEnvelope.get(envelope.id);
    const heroLike =
      envelope.corpus === 'hero-standalone' ||
      envelope.corpus === 'kit-signature' ||
      envelope.corpus === 'granted';
    const list = grants ?? [];
    return {
      corpus: envelope.corpus,
      id: envelope.id,
      name: envelope.name,
      ...(envelope.parent ? { parent: envelope.parent } : {}),
      ...(envelope.parentName ? { parentName: envelope.parentName } : {}),
      sourcePath: envelope.sourcePath,
      usage: envelope.usage,
      target: envelope.target,
      ...(envelope.cost ? { cost: envelope.cost } : {}),
      classification: classify(envelope),
      ...(grants ? { grants } : {}),
      ...(heroLike
        ? {
            availability:
              list.length === 0
                ? ('not-granted' as const)
                : list.some(g => g.selectable === 'selectable')
                  ? ('selectable' as const)
                  : list.some(g => g.selectable === 'unknown')
                    ? ('unknown' as const)
                    : ('not-selectable' as const),
          }
        : {}),
    };
  });
  const { resolvedToStandalone, resolvedToKit, ownText, unresolved } = corpus.grants;
  const grants = { total: corpus.grants.total };

  // Totals.
  const corpora: Corpus[] = [
    'hero-standalone',
    'kit-signature',
    'granted',
    'foe-ability',
    'malice',
  ];
  const totals = Object.fromEntries(
    corpora.map(c => [
      c,
      { COMPILES: 0, COMPILES_WITH_REMAINDER: 0, NO_MATCH: 0, total: 0, withinV26Bounded: 0 },
    ]),
  ) as Report['totals'];
  for (const entry of entries) {
    const t = totals[entry.corpus];
    t[entry.classification.category]++;
    t.total++;
    if (entry.classification.withinV26Bounded) t.withinV26Bounded++;
  }

  // Clause shapes.
  const shapeMap = new Map<string, { type: DiagnosticType; count: number; ids: Set<string> }>();
  for (const entry of entries)
    for (const d of entry.classification.diagnostics) {
      const key = `${d.type}\u0000${d.shape}`;
      const item = shapeMap.get(key) ?? { type: d.type, count: 0, ids: new Set<string>() };
      item.count++;
      item.ids.add(entry.id);
      shapeMap.set(key, item);
    }
  const shapes = [...shapeMap.entries()]
    .map(([key, item]) => ({
      shape: key.split('\u0000')[1]!,
      type: item.type,
      count: item.count,
      abilities: item.ids.size,
      examples: [...item.ids].sort((a, b) => a.localeCompare(b, 'en')).slice(0, 3),
    }))
    .sort(
      (a, b) =>
        b.count - a.count || b.abilities - a.abilities || a.shape.localeCompare(b.shape, 'en'),
    );

  // V26 inventory agreement.
  const v26: Report['v26'] = V26_INVENTORY.map(item => {
    const matches = entries.filter(item.match);
    const entry = matches[0];
    if (entry)
      entry.v26 = {
        label: item.label,
        expected: item.expected,
        agrees: entry.classification.category === item.expected,
      };
    return {
      label: item.label,
      expected: item.expected,
      actual: entry ? entry.classification.category : 'missing',
      agrees: entry ? entry.classification.category === item.expected : false,
      ...(entry ? { id: entry.id } : {}),
      ...(entry?.availability ? { availability: entry.availability } : {}),
      note:
        matches.length > 1
          ? `${item.note} (matched ${matches.length} entries; first used)`
          : item.note,
    };
  });

  const buysFor = (filter: (e: AuditEntry) => boolean) => {
    const list = entries.filter(filter);
    return {
      total: list.length,
      compiles: list.filter(e => e.classification.category === 'COMPILES').length,
      withRemainder: list.filter(e => e.classification.category === 'COMPILES_WITH_REMAINDER')
        .length,
      withinV26Bounded: list.filter(e => e.classification.withinV26Bounded).length,
      noMatch: list.filter(e => e.classification.category === 'NO_MATCH').length,
    };
  };

  return {
    generator: 'scripts/audit-ability-grammar.ts v1',
    ...(inputs.manifest.contentHash ? { contentHash: inputs.manifest.contentHash } : {}),
    foesEdition: inputs.foes.edition,
    sourceRevision: inputs.foes.sourceRevision,
    totals,
    grants: { total: grants.total, resolvedToStandalone, resolvedToKit, ownText, unresolved },
    entries,
    shapes,
    v26,
    buys: {
      foe: buysFor(e => e.corpus === 'foe-ability'),
      hero: buysFor(
        e =>
          e.corpus === 'hero-standalone' || e.corpus === 'kit-signature' || e.corpus === 'granted',
      ),
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Markdown rendering.

const pct = (n: number, total: number) =>
  total === 0 ? '0.00%' : `${((n / total) * 100).toFixed(2)}%`;
const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function renderMarkdown(report: Report): string {
  const lines: string[] = [];
  const corpora: Corpus[] = [
    'hero-standalone',
    'kit-signature',
    'granted',
    'foe-ability',
    'malice',
  ];
  const labels: Record<Corpus, string> = {
    'hero-standalone': 'Hero standalone (`ability.json`)',
    'kit-signature': 'Kit signature (`kit.json`)',
    granted: 'Class/other grants with their own text',
    'foe-ability': 'Foe abilities (`foes/catalog.json`)',
    malice: 'Malice features with a power roll',
  };
  lines.push('# V26 bounded-grammar coverage audit — 2026-09-20');
  lines.push('');
  lines.push(
    'Generated by `pnpm audit:abilities` (`scripts/audit-ability-grammar.ts`). Deterministic; do not hand-edit.',
    'Classification is a read-only text check against the bounded grammar in',
    '[V26 section 1](../../../V26-compiled-ability-effects.md#1-source-to-compiled-definition):',
    'one power roll with three tiers; each tier a supported damage expression, optionally followed by',
    '`push N`; the bounded post-damage potency remainder counts as a remainder. Nothing here is a',
    'gameplay migration, a support claim or evidence that any ability executes correctly.',
    '',
    `Content hash: \`${report.contentHash ?? 'n/a'}\`. Foe catalog edition: \`${report.foesEdition}\`. Source revision: \`${report.sourceRevision}\`.`,
    '',
  );
  lines.push('## Totals per corpus', '');
  lines.push(
    '| Corpus | Total | COMPILES | COMPILES_WITH_REMAINDER | of which within V26 bounded remainder | NO_MATCH |',
  );
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: |');
  for (const c of corpora) {
    const t = report.totals[c];
    lines.push(
      `| ${labels[c]} | ${t.total} | ${t.COMPILES} | ${t.COMPILES_WITH_REMAINDER} | ${t.withinV26Bounded} | ${t.NO_MATCH} |`,
    );
  }
  lines.push('');
  lines.push(
    `Wizard ability grants inspected: ${report.grants.total} (${report.grants.resolvedToStandalone} resolve to a standalone entry, ${report.grants.resolvedToKit} to a kit signature, ${report.grants.ownText} classified from their own embedded text, ${report.grants.unresolved.length} unresolved).`,
  );
  if (report.grants.unresolved.length) {
    lines.push('', 'Unresolved grants:', '');
    for (const g of report.grants.unresolved)
      lines.push(`- ${g.name} — \`${g.sourcePath}\` (${g.decisionId}, level ${g.level})`);
  }
  lines.push('');

  lines.push('## What the bounded V26 grammar buys', '');
  const b = report.buys;
  lines.push(
    `- Foe abilities: ${b.foe.compiles + b.foe.withRemainder} of ${b.foe.total} (${pct(b.foe.compiles + b.foe.withRemainder, b.foe.total)}) have tiers the grammar compiles: ${b.foe.compiles} fully (${pct(b.foe.compiles, b.foe.total)}), ${b.foe.withRemainder} with a typed remainder (${pct(b.foe.withRemainder, b.foe.total)}), of which ${b.foe.withinV26Bounded} (${pct(b.foe.withinV26Bounded, b.foe.total)}) are within V26's bounded potency remainder. ${b.foe.noMatch} (${pct(b.foe.noMatch, b.foe.total)}) do not match.`,
    `- Hero abilities (standalone + kit signatures + own-text grants): ${b.hero.compiles + b.hero.withRemainder} of ${b.hero.total} (${pct(b.hero.compiles + b.hero.withRemainder, b.hero.total)}) compile: ${b.hero.compiles} fully (${pct(b.hero.compiles, b.hero.total)}), ${b.hero.withRemainder} with a typed remainder (${pct(b.hero.withRemainder, b.hero.total)}), of which ${b.hero.withinV26Bounded} (${pct(b.hero.withinV26Bounded, b.hero.total)}) are within the bounded potency remainder. ${b.hero.noMatch} (${pct(b.hero.noMatch, b.hero.total)}) do not match.`,
    '',
    'A compiled tier means the damage expression and optional push are recognized; V26 runtime',
    'eligibility additionally requires a single-target shape and no remainder. Target shapes of the',
    'compiled entries:',
    '',
  );
  const shapes: TargetShape[] = ['single', 'multi', 'area', 'self', 'unknown'];
  lines.push('| Corpus | Category | ' + shapes.join(' | ') + ' |');
  lines.push('| --- | --- | ' + shapes.map(() => '---:').join(' | ') + ' |');
  for (const c of corpora)
    for (const category of ['COMPILES', 'COMPILES_WITH_REMAINDER'] as const) {
      const list = report.entries.filter(
        e => e.corpus === c && e.classification.category === category,
      );
      if (!list.length) continue;
      lines.push(
        `| ${labels[c]} | ${category} | ` +
          shapes.map(s => list.filter(e => e.classification.targetShape === s).length).join(' | ') +
          ' |',
      );
    }
  lines.push('');

  lines.push('## V26 inventory agreement', '');
  lines.push(
    'Expected categories are read from the V26 designs; a disagreement is a finding, not a tuning target.',
    '',
  );
  lines.push('| Ability | Expected | Classifier | Agrees | Availability | Note |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const item of report.v26)
    lines.push(
      `| ${item.label} | ${item.expected} | ${item.actual} | ${item.agrees ? 'yes' : '**no**'} | ${item.availability ?? '—'} | ${cell(item.note)} |`,
    );
  lines.push('');

  lines.push('## Hero abilities that compile (fully or with remainder)', '');
  lines.push(
    'Availability is derived from the composed wizard definitions (`getDefinitions(1)` and `(2)`): `selectable` when at least one granting decision chain is offered by the current wizard, `not-selectable` when every grant path is unsupported, `not-granted` when no wizard decision references the entry, `unknown` when a pool-restricted decision could not be evaluated statically.',
    '',
  );
  lines.push(
    '| Corpus | Ability | Category | Bounded | Target | Availability | Grant decisions | Remainder shapes |',
  );
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const e of report.entries.filter(
    e =>
      (e.corpus === 'hero-standalone' || e.corpus === 'kit-signature' || e.corpus === 'granted') &&
      e.classification.category !== 'NO_MATCH',
  )) {
    const shapesText = [...new Set(e.classification.diagnostics.map(d => d.shape))].join('; ');
    const decisions = [
      ...new Set((e.grants ?? []).map(g => `${g.decisionId}@${g.level}:${g.selectable}`)),
    ].join(', ');
    lines.push(
      `| ${e.corpus} | ${cell(e.name)}${e.parent ? ` (${cell(e.parent)})` : ''}${e.v26 ? ` [V26: ${cell(e.v26.label)}]` : ''} | ${e.classification.category} | ${e.classification.withinV26Bounded ? 'yes' : '—'} | ${e.classification.targetShape} | ${e.availability ?? '—'} | ${cell(decisions) || '—'} | ${cell(shapesText) || '—'} |`,
    );
  }
  lines.push('');

  lines.push('## Hero abilities that do not match', '');
  lines.push('| Corpus | Ability | Reason | Availability | Shapes |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const e of report.entries.filter(
    e =>
      (e.corpus === 'hero-standalone' || e.corpus === 'kit-signature' || e.corpus === 'granted') &&
      e.classification.category === 'NO_MATCH',
  ))
    lines.push(
      `| ${e.corpus} | ${cell(e.name)}${e.parent ? ` (${cell(e.parent)})` : ''} | ${e.classification.reason} | ${e.availability ?? '—'} | ${cell([...new Set(e.classification.diagnostics.map(d => d.shape))].join('; '))} |`,
    );
  lines.push('');

  lines.push('## Clause shapes by frequency (top 40)', '');
  lines.push('| # | Type | Shape | Clauses | Abilities | Examples |');
  lines.push('| ---: | --- | --- | ---: | ---: | --- |');
  report.shapes
    .slice(0, 40)
    .forEach((s, i) =>
      lines.push(
        `| ${i + 1} | ${s.type} | ${cell(s.shape)} | ${s.count} | ${s.abilities} | ${s.examples.map(id => `\`${id}\``).join(', ')} |`,
      ),
    );
  lines.push('');
  const byType = new Map<DiagnosticType, { count: number; shapes: number }>();
  for (const s of report.shapes) {
    const item = byType.get(s.type) ?? { count: 0, shapes: 0 };
    item.count += s.count;
    item.shapes++;
    byType.set(s.type, item);
  }
  lines.push('### Remainder clauses by type', '');
  lines.push('| Type | Clauses | Distinct shapes |');
  lines.push('| --- | ---: | ---: |');
  for (const [type, item] of [...byType.entries()].sort(
    (a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0], 'en'),
  ))
    lines.push(`| ${type} | ${item.count} | ${item.shapes} |`);
  lines.push('');

  lines.push('## Envelopes the readers could not reconcile', '');
  lines.push(
    'Structured record and Markdown disagree, or a paragraph sits outside any labeled section. These are retained as `unknown` remainders, never dropped.',
    '',
  );
  lines.push('| Corpus | Ability | Parent | Detail |');
  lines.push('| --- | --- | --- | --- |');
  for (const e of report.entries)
    for (const d of e.classification.diagnostics)
      if (d.shape === 'envelope:structured-markdown-mismatch' || d.shape === 'unattached-paragraph')
        lines.push(
          `| ${e.corpus} | ${cell(e.name)} | ${cell(e.parentName ?? e.parent ?? '—')} | ${cell(d.shape === 'unattached-paragraph' ? `unattached paragraph: ${d.text.slice(0, 120)}` : d.text)} |`,
        );
  lines.push('');
  lines.push('## NO_MATCH reasons', '');
  lines.push('| Corpus | Reason | Abilities |');
  lines.push('| --- | --- | ---: |');
  const reasons = new Map<string, number>();
  for (const e of report.entries)
    if (e.classification.reason) {
      const key = `${e.corpus}\u0000${e.classification.reason}`;
      reasons.set(key, (reasons.get(key) ?? 0) + 1);
    }
  for (const [key, count] of [...reasons.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], 'en'),
  )) {
    const [corpus, reason] = key.split('\u0000');
    lines.push(`| ${corpus} | ${reason} | ${count} |`);
  }
  lines.push('');
  lines.push(
    'The full per-ability classification, including every foe ability and diagnostic, is in `report.json`.',
    '',
  );
  return lines.join('\n');
}

// ---------------------------------------------------------------------------------------------
// Entry point.

export function writeReport(report: Report): { markdown: string; json: string } {
  const dir = join(root, REPORT_DIR);
  mkdirSync(dir, { recursive: true });
  const markdown = renderMarkdown(report);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  writeFileSync(join(dir, 'report.md'), markdown);
  writeFileSync(join(dir, 'report.json'), json);
  return { markdown, json };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const report = audit();
  writeReport(report);
  const t = report.totals;
  for (const corpus of Object.keys(t) as Corpus[])
    console.log(
      `${corpus}: total ${t[corpus].total}, COMPILES ${t[corpus].COMPILES}, COMPILES_WITH_REMAINDER ${t[corpus].COMPILES_WITH_REMAINDER}, NO_MATCH ${t[corpus].NO_MATCH}`,
    );
  console.log(
    `Wrote ${REPORT_DIR}/report.md and report.json (${dirname(join(root, REPORT_DIR))}).`,
  );
}
