// SPDX-License-Identifier: GPL-3.0-only
/** V67: source-accounted pure definitions. No authority, random dice, I/O or live migration. */
import type {
  AbilityRollMetadata,
  ActionType,
  DamageExpression,
  SourceRef,
} from '../contracts/rollResolution.ts';
import {
  blocksFromMarkdown,
  classify,
  conditionExpression,
  type Characteristic,
  type ConditionThreshold,
  damageExpression,
  effectRider,
  plain,
  readMarkdownItems,
  shapeOf,
  typeSection,
  typeTierClause,
  type Block,
  type Envelope,
} from './abilityGrammar.ts';

export interface CompileEnvelope extends Envelope {
  sourceRevision: string;
  /** Source-declared flavor, not every italic line encountered in Markdown. */
  declaredFlavor?: string[];
  /** Source parent facts remain attached for compile-only minion/other comparisons. */
  parentContext?: Record<string, unknown>;
}

interface NodeSource {
  id: string;
  locator: string;
  clause: string;
}
export interface DamageNode extends NodeSource {
  kind: 'damage';
  expression: DamageExpression;
  damageType?: string;
  kitBonusesIncluded: boolean;
}
export interface ConditionNode extends NodeSource {
  kind: 'condition';
  characteristic: Characteristic;
  threshold: ConditionThreshold;
  condition: import('../contracts/liveState.ts').ConditionId;
  duration: 'save-ends';
  after: string;
}
export interface PushNode extends NodeSource {
  kind: 'push';
  distance: number;
  after: string;
}
export interface UnsupportedNode extends NodeSource {
  kind: 'unsupported';
  shape: string;
  reason: string;
  dependency: 'after-damage' | 'unknown';
}
export interface RiderNode extends NodeSource {
  kind: 'rider';
  shape: import('./effectRiders.ts').EffectRider['shape'];
  dependency: 'independent' | 'after-damage' | 'after-movement';
}
export type CompiledNode = DamageNode | PushNode | ConditionNode | UnsupportedNode | RiderNode;
export interface CompileDiagnostic {
  code: string;
  message: string;
  locator: string;
  clause: string;
}
export interface CompiledAbility {
  format: 'salient.compiled-ability';
  version: 1;
  id: string;
  name: string;
  source: SourceRef;
  /** Complete bounded source retained; parsing does not certify live eligibility. */
  envelope: CompileEnvelope;
  metadata?: AbilityRollMetadata;
  tiers: CompiledNode[][];
  sections: (UnsupportedNode | RiderNode)[];
  diagnostics: CompileDiagnostic[];
  execution: 'supported' | 'manual';
  context: {
    corpus: Envelope['corpus'];
    parent?: string;
    parentName?: string;
    parentContext?: Record<string, unknown>;
    scope: 'pure-only';
  };
}

const ACTIONS: ActionType[] = [
  'main action',
  'maneuver',
  'move action',
  'triggered action',
  'free triggered action',
  'free maneuver',
];
const normalized = (text: string) => plain(text).replace(/\.$/, '').replace(/\s+/g, ' ').trim();

/** Non-security FNV-1a/64 over UTF-16 code units. Structure, not hash alone, distinguishes copies. */
function clauseHash(text: string): string {
  let value = 0xcbf29ce484222325n;
  for (let i = 0; i < text.length; i++) {
    value ^= BigInt(text.charCodeAt(i));
    value = BigInt.asUintN(64, value * 0x100000001b3n);
  }
  return value.toString(16).padStart(16, '0');
}
function sourceNode(
  envelope: Envelope,
  locator: string,
  ordinal: number,
  clause: string,
): NodeSource {
  return {
    id: `${envelope.id}#${locator}:${ordinal}:${clauseHash(clause)}`,
    locator: `${locator}:${ordinal}`,
    clause,
  };
}
function blockText(block: Block): string {
  return block.kind === 'section'
    ? `${block.label}: ${block.text}`
    : `${block.kind === 'roll' ? block.roll + '\n' : ''}${block.tiers.join('\n')}`;
}
function comparable(block: Block): string {
  return JSON.stringify(
    block.kind === 'section'
      ? { kind: block.kind, label: normalized(block.label), text: normalized(block.text) }
      : {
          kind: block.kind,
          ...(block.kind === 'roll' ? { roll: normalized(block.roll) } : {}),
          tiers: block.tiers.map(normalized),
        },
  );
}

export function compileAbility(input: CompileEnvelope): CompiledAbility {
  // Definitions are snapshots: caller mutation of an envelope must not reinterpret a prior result.
  const envelope = structuredClone(input);
  const grammar = classify(envelope);
  const diagnostics: CompileDiagnostic[] = [];
  const sections: (UnsupportedNode | RiderNode)[] = [];
  const tiers: CompiledNode[][] = [[], [], []];
  const diagnose = (code: string, locator: string, clause: string, message: string) => {
    diagnostics.push({ code, locator, clause, message });
  };
  const unsupported = (
    locator: string,
    ordinal: number,
    clause: string,
    shape: string,
    reason: string,
    dependency: UnsupportedNode['dependency'] = 'unknown',
  ): UnsupportedNode => ({
    ...sourceNode(envelope, locator, ordinal, clause),
    kind: 'unsupported',
    shape,
    reason,
    dependency,
  });

  if (!envelope.sourceRevision || !envelope.sourcePath || !envelope.id)
    diagnose(
      'source-identity',
      'envelope',
      '',
      'Content identity, source path and revision are required.',
    );
  if (grammar.category === 'NO_MATCH')
    diagnose('grammar', 'envelope', '', grammar.reason ?? 'No bounded power roll.');

  let rollIndex = -1;
  envelope.blocks.forEach((block, index) => {
    const locator = `block:${index}`;
    if (block.kind === 'section') {
      const rider =
        block.label === 'Effect' && !block.cost && rollIndex >= 0
          ? effectRider(plain(block.text))
          : undefined;
      // V110: a section written about "the target" stays manual when several targets can differ.
      if (rider && (grammar.targetShape === 'single' || rider.subject === 'use')) {
        sections.push({
          ...sourceNode(envelope, locator, 0, block.text),
          kind: 'rider',
          shape: rider.shape,
          dependency: rider.dependency,
        });
        return;
      }
      const diagnostic = typeSection(block, index);
      // Paragraph ordinals retain repeated identical work as separate source occurrences.
      block.text
        .split(/\n+/)
        .filter(text => text.trim())
        .forEach((text, ordinal) => {
          sections.push(unsupported(locator, ordinal, text, diagnostic.shape, diagnostic.type));
        });
      if (!block.text.trim())
        sections.push(unsupported(locator, 0, '', diagnostic.shape, diagnostic.type));
      return;
    }
    if (block.kind !== 'roll' || rollIndex !== -1) {
      sections.push(
        unsupported(
          locator,
          0,
          blockText(block),
          block.kind === 'roll' ? 'second-roll' : 'extra-table',
          'Only one complete roll is supported.',
        ),
      );
      diagnose(
        'extra-roll-or-tiers',
        locator,
        blockText(block),
        'Additional rolls/tiers cannot be discarded.',
      );
      return;
    }
    rollIndex = index;
    block.tiers.forEach((text, tierIndex) => {
      const nodes = tiers[tierIndex]!;
      const tierLocator = `${locator}:tier${tierIndex + 1}`;
      const clauses = text.split(';');
      clauses.forEach((raw, ordinal) => {
        const clause = raw.trim();
        if (!clause) {
          diagnose('empty-clause', tierLocator, raw, 'A missing clause cannot be interpreted.');
          return;
        }
        const parsed = ordinal === 0 ? damageExpression(normalized(clause)) : undefined;
        if (parsed) {
          nodes.push({
            ...sourceNode(envelope, tierLocator, ordinal, clause),
            kind: 'damage',
            expression: parsed.damage,
            ...(parsed.damageType ? { damageType: parsed.damageType } : {}),
            kitBonusesIncluded: envelope.corpus === 'kit-signature',
          });
          return;
        }
        const previous = nodes[nodes.length - 1];
        const push = /^push (\d+)$/i.exec(normalized(clause));
        if (
          ordinal === 1 &&
          previous?.kind === 'damage' &&
          push &&
          Number.isSafeInteger(Number(push[1]))
        ) {
          nodes.push({
            ...sourceNode(envelope, tierLocator, ordinal, clause),
            kind: 'push',
            distance: Number(push[1]),
            after: previous.id,
          });
          return;
        }
        const condition = conditionExpression(clause);
        if (ordinal === 1 && clauses.length === 2 && previous?.kind === 'damage' && condition) {
          nodes.push({
            ...sourceNode(envelope, tierLocator, ordinal, clause),
            kind: 'condition',
            ...condition,
            duration: 'save-ends',
            after: previous.id,
          });
          return;
        }
        const typed = typeTierClause(
          clause,
          tierLocator,
          ordinal === 1 && previous?.kind === 'damage',
          clauses.length === 2,
        );
        const bounded = typed?.type === 'potency-condition' && typed.bounded === true;
        nodes.push(
          unsupported(
            tierLocator,
            ordinal,
            clause,
            typed?.shape ?? shapeOf(clause),
            typed?.type ?? 'unsupported-clause',
            bounded ? 'after-damage' : 'unknown',
          ),
        );
        if (!bounded)
          diagnose(
            'unsafe-tier-remainder',
            `${tierLocator}:${ordinal}`,
            clause,
            'The effect on damage, payment, targeting or order is not established.',
          );
      });
    });
  });

  // Strict coverage complements (and does not change) the V64 recognition audit.
  const items = readMarkdownItems(envelope.markdown, envelope.name);
  const markdown = blocksFromMarkdown(items);
  const structuredBlocks = envelope.blocks.filter(
    block => block.kind !== 'section' || block.label !== 'Paragraph',
  );
  if (structuredBlocks.length !== markdown.blocks.length)
    diagnose(
      'source-block-count',
      'markdown',
      envelope.markdown,
      'Structured and printed block counts differ.',
    );
  for (let index = 0; index < Math.max(structuredBlocks.length, markdown.blocks.length); index++) {
    const structured = structuredBlocks[index];
    const printed = markdown.blocks[index];
    if (!structured || !printed || comparable(structured) !== comparable(printed)) {
      const clause = printed ? blockText(printed) : structured ? blockText(structured) : '';
      diagnose(
        'source-block-mismatch',
        `markdown:block:${index}`,
        clause,
        'Roll, tier, section content or order differs between the envelope and full source.',
      );
      if (printed)
        sections.push(
          unsupported(
            `markdown:block:${index}`,
            0,
            clause,
            'source-block-mismatch',
            'Printed mechanics differ from the structured projection.',
          ),
        );
    }
  }
  const declared = [...(envelope.declaredFlavor ?? [])].map(normalized);
  const tables = items.filter(item => item.kind === 'table');
  const cells = (text: string) => text.split('|').slice(1, -1).map(normalized);
  const expected = [
    [
      envelope.keywords.length ? envelope.keywords.map(plain).join(', ') : '-',
      plain(envelope.usage),
    ],
    [`📏 ${plain(envelope.distance)}`, `🎯 ${plain(envelope.target)}`],
  ];
  if (
    tables.length !== 2 ||
    tables.some(
      (table, i) =>
        JSON.stringify(cells(table.text)) !== JSON.stringify(expected[i]?.map(normalized)),
    )
  ) {
    diagnose(
      'source-header',
      'markdown:table',
      tables.map(t => t.text).join('\n'),
      'Only the matching keyword/action and distance/target header rows are presentation scaffolding.',
    );
  }
  items.forEach((item, index) => {
    if (item.kind === 'title') {
      const title = item.text
        .replace(/^#{1,6} /, '')
        .replace(/^[^\p{L}\p{N}]+/u, '')
        .trim();
      const allowed = envelope.cost
        ? [`${envelope.name} (${plain(envelope.cost)})`]
        : [envelope.name, `${envelope.name} (Signature Ability)`];
      if (allowed.includes(title)) return;
      sections.push(
        unsupported(
          `markdown:title:${index}`,
          0,
          item.text,
          'title-mechanics',
          'Title annotation does not match the declared activation cost or known signature label.',
        ),
      );
      diagnose(
        'source-title',
        `markdown:title:${index}`,
        item.text,
        'Unknown or contradictory title mechanics cannot be presentation scaffolding.',
      );
      return;
    }
    if (item.kind === 'flavor') {
      const text = normalized(item.text.replace(/^\*|\*$/g, ''));
      const declaredIndex = declared.indexOf(text);
      if (declaredIndex >= 0) {
        declared.splice(declaredIndex, 1);
        return;
      }
    } else if (item.kind !== 'paragraph' && item.kind !== 'heading') return;
    const locator = `markdown:item:${index}`;
    sections.push(
      unsupported(
        locator,
        0,
        item.text,
        'unaccounted-paragraph',
        'Paragraph is not source-declared flavor or identified presentation scaffolding.',
      ),
    );
    diagnose('unaccounted-paragraph', locator, item.text, 'Printed mechanics cannot be ignored.');
  });
  if (declared.length)
    diagnose(
      'flavor-mismatch',
      'markdown',
      declared.join('\n'),
      'Declared flavor is absent from the source body.',
    );
  for (const section of sections)
    if (section.kind === 'unsupported')
      diagnose(
        'manual-section',
        section.locator,
        section.clause,
        'Section preserved as manual work; its effect on automation is not assumed independent.',
      );
  // V110: counted (`multi`) and area targets share one roll with per-target edges/banes and tiers;
  // area placement and target eligibility remain the user's table selection.
  const area = envelope.keywords.some(k => plain(k).toLowerCase() === 'area');
  if (!(
    grammar.targetShape === 'area' ||
    ((grammar.targetShape === 'single' || grammar.targetShape === 'multi') && !area)
  ))
    diagnose(
      'target-boundary',
      'header:target',
      envelope.target,
      'Only one, counted or area target envelopes are eligible.',
    );
  if (envelope.corpus === 'granted' || envelope.corpus === 'malice')
    diagnose(
      'compatibility-boundary',
      'envelope',
      envelope.corpus,
      'This source population retains its existing compatibility path; compilation grants no new execution.',
    );

  const action = ACTIONS.find(value => value === plain(envelope.usage).toLowerCase());
  if (!action) diagnose('action-type', 'header:usage', envelope.usage, 'Unrecognized action type.');
  const cost = envelope.cost ? /^(\d+)\s+([A-Za-z]+)$/.exec(plain(envelope.cost)) : null;
  if (envelope.cost && (!cost || !Number.isSafeInteger(Number(cost[1]))))
    diagnose('cost', 'header:cost', envelope.cost, 'Activation cost cannot be safely read.');
  const source = { id: envelope.id, path: envelope.sourcePath, revision: envelope.sourceRevision };
  let metadata: AbilityRollMetadata | undefined;
  if (
    action &&
    grammar.roll &&
    tiers.every(nodes => nodes[0]?.kind === 'damage') &&
    rollIndex >= 0
  ) {
    const block = envelope.blocks[rollIndex] as Extract<Block, { kind: 'roll' }>;
    metadata = {
      abilityId: envelope.id,
      name: envelope.name,
      source,
      actionType: action,
      keywords: [...envelope.keywords],
      permittedCharacteristics: grammar.roll.permitted,
      ...(grammar.roll.fixedRollBonus !== undefined
        ? { fixedRollBonus: grammar.roll.fixedRollBonus }
        : {}),
      kitBonusesIncluded: envelope.corpus === 'kit-signature',
      ...(cost && Number.isSafeInteger(Number(cost[1]))
        ? { fixedCost: { resource: cost[2]!.toLowerCase(), amount: Number(cost[1]) } }
        : {}),
      tiers: tiers.map((nodes, index) => {
        const damage = nodes[0] as DamageNode;
        return {
          text: block.tiers[index]!,
          damage: damage.expression,
          ...(damage.damageType ? { damageType: damage.damageType } : {}),
          unresolvedClauses: nodes
            .filter(node => node.kind === 'unsupported')
            .map(node => node.clause),
        };
      }) as AbilityRollMetadata['tiers'],
    };
  }
  return {
    format: 'salient.compiled-ability',
    version: 1,
    id: envelope.id,
    name: envelope.name,
    source,
    envelope,
    ...(metadata ? { metadata } : {}),
    tiers,
    sections,
    diagnostics,
    execution: diagnostics.length === 0 && metadata ? 'supported' : 'manual',
    context: {
      corpus: envelope.corpus,
      ...(envelope.parent ? { parent: envelope.parent } : {}),
      ...(envelope.parentName ? { parentName: envelope.parentName } : {}),
      ...(envelope.parentContext ? { parentContext: envelope.parentContext } : {}),
      scope: 'pure-only',
    },
  };
}
