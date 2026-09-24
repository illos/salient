// SPDX-License-Identifier: GPL-3.0-only
/** V67: source-accounted pure definitions. No authority, random dice, I/O or live migration. */
import type {
  AbilityRollMetadata,
  ActionType,
  DamageExpression,
  SourceRef,
} from '../contracts/rollResolution.ts';
import { tierInstruction } from './effectRiders.ts';
import {
  effectOnlyTarget,
  readEffectOnlySection,
  type EffectOnlySentence,
  type EffectOnlyTarget,
} from './effectOnly.ts';
import {
  blocksFromMarkdown,
  classify,
  forcedMovementExpression,
  tierCantStandExpression,
  tierCompoundConditionExpression,
  tierConditionExpression,
  tierConditionMovementExpression,
  type Characteristic,
  type ConditionDuration,
  type ConditionThreshold,
  damageExpression,
  effectRider,
  eachAreaTarget,
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
  /** Absent only for V113 unconditional conditions (`threshold.kind === 'always'`). */
  characteristic?: Characteristic;
  threshold: ConditionThreshold | { kind: 'always' };
  condition: import('../contracts/liveState.ts').ConditionId;
  duration: ConditionDuration;
  after: string;
  /**
   * V153: the node id shared by the conditions of one compound clause ("dazed and slowed (save
   * ends)"). They resolve against one potency and are removed by one saving throw.
   */
  group?: string;
  /**
   * V155: a restriction on standing up that holds a prone creature down for `duration`. It is
   * recorded as a prone instance, so ending it leaves any other prone instance in place.
   */
  restriction?: 'cant-stand';
}
/** Forced movement. V26 push nodes have no `movement`; V113 adds pull, slide and vertical. */
export interface PushNode extends NodeSource {
  kind: 'push';
  distance: number;
  movement?: 'pull' | 'slide';
  vertical?: true;
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
  dependency: 'independent' | 'after-damage' | 'after-movement' | 'after-effects';
}
/**
 * V154 tier instruction: a whole tier clause that is table work for that target's outcome (a
 * teleport, shift, Recovery or surge instruction). It never changes state.
 */
export interface InstructionNode extends NodeSource {
  kind: 'instruction';
  shape: import('./effectRiders.ts').EffectRider['shape'];
  /** The tier's damage node, or '' in a tier without damage. */
  after: string;
  /**
   * V157, effect-only sections only: `actor` work happens once for the user; `target` work once
   * for each target. Tier instructions carry no subject.
   */
  subject?: 'actor' | 'target';
}
/**
 * V157 executed gain of an effect-only section: temporary Stamina (the greater of the current and
 * granted amounts, rule/health/temporary-stamina.md) and/or surges (added, rule/resource/surge.md).
 */
export interface GainNode extends NodeSource {
  kind: 'gain';
  subject: 'actor' | 'target';
  temporaryStamina?: number;
  surges?: number;
}
export type CompiledNode =
  DamageNode | PushNode | ConditionNode | UnsupportedNode | RiderNode | InstructionNode;
/** Effect-section nodes: V109 riders, V157 effect-only gains and instructions, or manual work. */
export type SectionNode = UnsupportedNode | RiderNode | GainNode | InstructionNode;
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
  /** V157: an ability without a power roll; its work is `sections` and it has no `metadata`. */
  effectOnly?: true;
  /** V157, effect-only only: what a use needs in place of roll metadata. */
  activation?: {
    actionType: ActionType;
    fixedCost?: { resource: string; amount: number };
    targetShape: EffectOnlyTarget;
  };
  tiers: CompiledNode[][];
  sections: SectionNode[];
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
  const sections: SectionNode[] = [];
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
  const effectOnly = readEffectOnly(envelope);
  // V154: a tier that opens without damage is judged clause by clause in the tier loop below,
  // which diagnoses every clause it can't support; other grammar failures stay fatal here.
  // V157: "no-power-roll" is not a failure for an ability read whole as effect-only.
  if (
    grammar.category === 'NO_MATCH' &&
    !/^tier[123]-damage-outside-grammar$/.test(grammar.reason ?? '') &&
    !(effectOnly && grammar.reason === 'no-power-roll')
  )
    diagnose('grammar', 'envelope', '', grammar.reason ?? 'No bounded power roll.');

  let rollIndex = -1;
  envelope.blocks.forEach((block, index) => {
    const locator = `block:${index}`;
    if (block.kind === 'section' && effectOnly) {
      effectOnly.sections[index]!.forEach(({ text, clause }, ordinal) => {
        const node = sourceNode(envelope, locator, ordinal, text);
        sections.push(
          clause.kind === 'gain'
            ? { ...node, ...clause }
            : {
                ...node,
                kind: 'instruction',
                shape: clause.shape,
                after: '',
                subject: clause.subject,
              },
        );
      });
      return;
    }
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
      // V153: whether every clause so far was damage then supported push/condition work.
      let intact = true;
      // V154: a tier whose first clause is supported work rather than damage (Power Chord's
      // "Push 1", Battle Cry's "Each target gains 1 surge").
      let damageFree = false;
      clauses.forEach((raw, ordinal) => {
        const clause = raw.trim();
        if (!clause) {
          intact = false;
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
        // V113: tier effects follow the damage in printed order (rule/dice/ability-roll.md), so a
        // run of supported push/condition clauses directly after the damage clause is admitted.
        const damage = nodes[0]?.kind === 'damage' ? nodes[0] : undefined;
        if (ordinal === 0) damageFree = true;
        const supportedRun = intact && (damage !== undefined || damageFree);
        const after = damage?.id ?? '';
        const forced = forcedMovementExpression(clause);
        if (supportedRun && forced) {
          nodes.push({
            ...sourceNode(envelope, tierLocator, ordinal, clause),
            kind: 'push',
            distance: forced.distance,
            ...(forced.movement !== 'push' ? { movement: forced.movement } : {}),
            ...(forced.vertical ? { vertical: true as const } : {}),
            after,
          });
          return;
        }
        const condition = tierConditionExpression(clause);
        if (supportedRun && condition) {
          nodes.push({
            ...sourceNode(envelope, tierLocator, ordinal, clause),
            kind: 'condition',
            ...condition,
            after,
          });
          return;
        }
        // V153: one node per condition, each with its own id so occurrences stay distinct.
        const compound = tierCompoundConditionExpression(clause);
        if (supportedRun && compound) {
          const base = sourceNode(envelope, tierLocator, ordinal, clause);
          for (const name of compound.conditions)
            nodes.push({
              ...base,
              id: `${base.id}~${name}`,
              kind: 'condition',
              ...(compound.characteristic ? { characteristic: compound.characteristic } : {}),
              threshold: compound.threshold,
              condition: name,
              duration: compound.duration,
              after,
              group: base.id,
            });
          return;
        }
        // V155: prone (no duration, ended by Stand Up) plus the timed restriction on standing.
        const cantStand = tierCantStandExpression(clause);
        const printedProne = nodes.some(
          node =>
            node.kind === 'condition' &&
            node.condition === 'prone' &&
            node.restriction === undefined &&
            node.threshold.kind === 'always',
        );
        if (supportedRun && cantStand && (cantStand.withProne || printedProne)) {
          const base = sourceNode(envelope, tierLocator, ordinal, clause);
          const potency = {
            ...(cantStand.characteristic ? { characteristic: cantStand.characteristic } : {}),
            threshold: cantStand.threshold,
          };
          if (cantStand.withProne)
            nodes.push({
              ...base,
              id: `${base.id}~prone`,
              kind: 'condition',
              ...potency,
              condition: 'prone',
              duration: 'none',
              after,
            });
          nodes.push({
            ...base,
            id: `${base.id}~cant-stand`,
            kind: 'condition',
            ...potency,
            condition: 'prone',
            duration: cantStand.duration,
            restriction: 'cant-stand',
            after,
          });
          return;
        }
        const both = tierConditionMovementExpression(clause);
        if (supportedRun && both) {
          const base = sourceNode(envelope, tierLocator, ordinal, clause);
          nodes.push({
            ...base,
            id: `${base.id}~condition`,
            kind: 'condition',
            ...both.condition,
            after,
          });
          nodes.push({
            ...base,
            id: `${base.id}~movement`,
            kind: 'push',
            distance: both.movement.distance,
            ...(both.movement.movement !== 'push' ? { movement: both.movement.movement } : {}),
            ...(both.movement.vertical ? { vertical: true as const } : {}),
            after,
          });
          return;
        }
        // V154: tier table work, after the tier's damage when it has any.
        const instruction = tierInstruction(plain(clause));
        if (
          supportedRun &&
          instruction &&
          (instruction.subject === 'target' || grammar.targetShape === 'single')
        ) {
          nodes.push({
            ...sourceNode(envelope, tierLocator, ordinal, clause),
            kind: 'instruction',
            shape: instruction.shape,
            after,
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
        intact = false;
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
  // V157: an effect-only envelope's target was read by the effect-only target reader instead.
  const area = envelope.keywords.some(k => plain(k).toLowerCase() === 'area');
  if (
    !effectOnly &&
    !(
      (grammar.targetShape === 'area' && eachAreaTarget(envelope.target)) ||
      ((grammar.targetShape === 'single' || grammar.targetShape === 'multi') && !area)
    )
  )
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
  if (action && grammar.roll && tiers.every(nodes => nodes.length > 0) && rollIndex >= 0) {
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
        const damage = nodes[0]?.kind === 'damage' ? nodes[0] : undefined;
        return {
          text: block.tiers[index]!,
          ...(damage ? { damage: damage.expression } : {}),
          ...(damage?.damageType ? { damageType: damage.damageType } : {}),
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
    ...(effectOnly && action
      ? {
          effectOnly: true as const,
          activation: {
            actionType: action,
            ...(cost && Number.isSafeInteger(Number(cost[1]))
              ? { fixedCost: { resource: cost[2]!.toLowerCase(), amount: Number(cost[1]) } }
              : {}),
            targetShape: effectOnly.target,
          },
        }
      : {}),
    tiers,
    sections,
    diagnostics,
    execution:
      diagnostics.length === 0 && (metadata || (effectOnly && action)) ? 'supported' : 'manual',
    context: {
      corpus: envelope.corpus,
      ...(envelope.parent ? { parent: envelope.parent } : {}),
      ...(envelope.parentName ? { parentName: envelope.parentName } : {}),
      ...(envelope.parentContext ? { parentContext: envelope.parentContext } : {}),
      scope: 'pure-only',
    },
  };
}

/** V157 actions a use without a power roll may take; triggered actions stay manual (piece 5). */
const EFFECT_ONLY_ACTIONS: ActionType[] = ['main action', 'maneuver', 'free maneuver'];

/**
 * V157: the whole envelope read as an ability without a power roll, or `undefined`. Every block is
 * a cost-free Effect section (no roll, tiers, Trigger, Spend, Strained, Persistent or unattached
 * Paragraph) read whole by `readEffectOnlySection`, the action is a main action, maneuver or free
 * maneuver, and the effect-only target reader accepts the target. "The target" sentences need a
 * one-target envelope (V110) and "You" sentences a Self one, so that once-per-use work is
 * addressed to a creature the use names.
 */
function readEffectOnly(
  envelope: Envelope,
): { target: EffectOnlyTarget; sections: Record<number, EffectOnlySentence[]> } | undefined {
  if (!envelope.blocks.length) return undefined;
  const action = EFFECT_ONLY_ACTIONS.find(value => value === plain(envelope.usage).toLowerCase());
  const target = effectOnlyTarget(envelope.target, envelope.keywords);
  if (!action || !target) return undefined;
  const sections: Record<number, EffectOnlySentence[]> = {};
  for (const [index, block] of envelope.blocks.entries()) {
    if (block.kind !== 'section' || block.label !== 'Effect' || block.cost) return undefined;
    const read = readEffectOnlySection(block.text);
    if (
      !read ||
      read.some(
        sentence =>
          (sentence.singleTarget && target.kind !== 'one' && target.kind !== 'self') ||
          (sentence.clause.subject === 'actor' && target.kind !== 'self'),
      )
    )
      return undefined;
    sections[index] = read;
  }
  return { target, sections };
}
