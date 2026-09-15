// SPDX-License-Identifier: GPL-3.0-only
/**
 * The R02 character evaluator: pure, deterministic, client-independent. Input is the R01 decision
 * ids and selection shapes; output is the status, diagnostics keyed by decision id, and a derived
 * baseline (or the "hero so far" partial) in which every value carries its provenance.
 *
 * Owning documents: docs/character-derived-values.md (every formula, section 1; provenance rule,
 * section 2; status rules, section 3; the three worked examples, section 4) and
 * docs/fury-level-one-decisions.md (the decision table this reads). Owning specification:
 * docs/character-wizard-spec.md#3-decision-system and #9-shared-operations-and-reliability.
 *
 * Nothing here reads or writes live values (R03, docs/live-state-initialization.md section 3).
 * Every number and grant is a formula the R02 document states with a source sentence; where a
 * formula cannot be derived because a term is missing (no kit chosen), the value is absent from the
 * partial, never a displayed zero. Provisional defaults carry their open question id.
 */
import { assignmentError } from './assignment.ts';
import { poolValues } from './structure.ts';
import type { Characteristic } from '../contracts/rollResolution.ts';
import type {
  DerivedBaseline,
  DerivedValue,
  Diagnostic,
  DiagnosticCode,
  DiagnosticSeverity,
  EvaluationInput,
  EvaluationResult,
  GrantedAbility,
  GrantedFeature,
  GrantedLanguage,
  GrantedSkill,
  KitContributions,
  PartialBaseline,
  Provenance,
  SelectionValue,
  SourceSentence,
  UncertaintyId,
} from '../contracts/characterEvaluation.ts';
import type {
  Decision,
  DecisionDefinitions,
  DecisionOption,
  OptionGrant,
  OptionsByParentEntry,
} from './definitions.ts';
import {
  ASPECT_FEATURE_SENTENCE,
  ASPECT_TRIGGERED_SENTENCE,
  BUDGET_RULE_HEADINGS,
  BUDGET_WORDS,
  CLASS_FEATURE_AFFECTS,
  FEATURE_ENTRY_PATHS,
  FURY_ABILITY_HEADINGS,
  KIT_BONUSES_HEADING,
  KIT_SENTENCES,
  KITS_PATH,
  KITS_TABLE_HEADING,
  SENTENCES,
  SKILL_SENTENCES,
  TRAIT_EFFECTS,
} from './sources.ts';

export const DEFINITIONS_SCHEMA_VERSION = 'r01.1';

/** Canonical order of the open-question labels on the output (the contract's union order). */
const UNCERTAINTY_ORDER: UncertaintyId[] = [];

type Sentence = Omit<SourceSentence, 'revision'>;

/** Parses an R01 array option such as "2, −1, −1" (U+2212 minus) into numbers. */
export function parseArray(value: string): number[] {
  return value.split(',').map(part => Number(part.trim().replace('−', '-')));
}

/** Parses "Intuition 1, Reason 0, Presence 0" into an assignment map. */
export function parseAssignment(value: string): Record<string, number> {
  return Object.fromEntries(
    value.split(',').map(part => {
      const [target, amount] = part.trim().split(/\s+/);
      return [target!, Number(amount!.replace('−', '-'))];
    }),
  );
}

function parseCost(costQuote: string | undefined): GrantedAbility['cost'] | undefined {
  const match = costQuote ? /^cost: (\d+) (\w+)$/.exec(costQuote) : null;
  if (!match) return undefined;
  const resource = match[2]!.toLowerCase();
  if (resource !== 'ferocity') return undefined;
  return { resource, amount: Number(match[1]) };
}

class Evaluation {
  readonly revision: string;
  readonly decisions = new Map<string, Decision>();
  readonly order: Decision[] = [];
  readonly diagnostics: Record<string, Diagnostic[]> = {};
  /** Decisions whose availability condition holds. */
  readonly available = new Set<string>();
  /** Valid selections by decision id, in the R01 shapes. */
  readonly valid = new Map<string, SelectionValue>();
  readonly uncertainties = new Set<UncertaintyId>();

  readonly definitions: DecisionDefinitions;
  readonly selections: Record<string, SelectionValue>;
  /** Steps the v0.01 wizard does not present (the complication step, Q-CHAR-1): never a diagnostic. */
  readonly notPresented = new Set<string>();

  constructor(definitions: DecisionDefinitions, selections: Record<string, SelectionValue>) {
    this.definitions = definitions;
    this.selections = selections;
    this.revision = definitions.compendiumRevision;
    for (const step of definitions.steps)
      for (const decision of step.decisions) {
        if (!step.presentedInV001) this.notPresented.add(decision.id);
        this.decisions.set(decision.id, decision);
        this.order.push(decision);
      }
  }

  sentence(s: Sentence): SourceSentence {
    return { ...s, revision: this.revision };
  }
  own(decision: Decision, heading?: string): SourceSentence {
    return this.sentence({
      path: decision.source,
      quote: decision.quote,
      ...(heading ? { heading } : {}),
    });
  }

  diagnose(
    decisionId: string,
    severity: DiagnosticSeverity,
    code: DiagnosticCode,
    message: string,
    source?: SourceSentence,
    uncertainty?: UncertaintyId,
  ) {
    const entry: Diagnostic = {
      decisionId,
      severity,
      code,
      message,
      ...(source ? { source } : {}),
      ...(uncertainty ? { uncertainty } : {}),
    };
    if (uncertainty) this.uncertainties.add(uncertainty);
    (this.diagnostics[decisionId] ??= []).push(entry);
  }

  provenance(entry: Provenance): Provenance {
    if (entry.uncertainty) this.uncertainties.add(entry.uncertainty);
    return entry;
  }

  single(id: string): string | undefined {
    const value = this.valid.get(id);
    return typeof value === 'string' ? value : undefined;
  }
  list(id: string): (string | null)[] | undefined {
    const value = this.valid.get(id);
    return Array.isArray(value) ? value : undefined;
  }

  // -------------------------------------------------------------------------------------------
  // Availability, pools and validation (R02 section 3, status rules 1 to 3 and 5).

  isAvailable(decision: Decision): boolean {
    if (decision.availableWhen) {
      const parent = this.single(decision.availableWhen.decision);
      if (parent !== decision.availableWhen.value) return false;
    }
    for (const parentId of decision.dependsOn ?? []) {
      const parent = this.decisions.get(parentId);
      if (!parent || !this.available.has(parentId)) return false;
      if (parent.kind === 'choice' && !this.valid.has(parentId)) return false;
    }
    return true;
  }

  poolValues(from: string | string[] | undefined): string[] {
    return poolValues(this.definitions, from);
  }

  /** The option values a decision offers for the current parent selections, and the parent entry used. */
  pool(decision: Decision): {
    values: string[];
    parent?: OptionsByParentEntry;
    parentValue?: string;
  } {
    if (decision.options) return { values: decision.options.map(option => option.value) };
    if (decision.optionsByParent) {
      const parentValue = this.single(decision.dependsOn?.[0] ?? '');
      const parent = parentValue ? decision.optionsByParent[parentValue] : undefined;
      if (!parent) return { values: [] };
      return {
        values: [...(parent.values ?? []), ...this.poolValues(parent.optionsFrom)],
        parent,
        parentValue,
      };
    }
    return { values: this.poolValues(decision.optionsFrom) };
  }

  supported(decision: Decision, value: string): boolean {
    const option = decision.options?.find(o => o.value === value);
    if (option) return option.supportedInV001;
    if (decision.supportedInV001) return decision.supportedInV001.includes(value);
    if (decision.supportedSetInV001) return decision.supportedSetInV001.includes(value);
    return false;
  }

  unsupported(decision: Decision, value: string) {
    this.diagnose(
      decision.id,
      'unsupported',
      'unsupported-option',
      `${value} is a legal source option that the v0.01 application does not offer for ${decision.id}`,
      this.own(decision),
    );
  }

  validate() {
    for (const id of Object.keys(this.selections))
      if (!this.decisions.has(id))
        this.diagnose(
          id,
          'invalid',
          'unknown-decision',
          `${id} is not a decision in the ${this.definitions.schemaVersion} definitions`,
        );
    for (const decision of this.order) {
      if (this.notPresented.has(decision.id)) continue;
      const available = this.isAvailable(decision);
      if (available) this.available.add(decision.id);
      const selection = this.selections[decision.id];
      if (decision.kind === 'authored') {
        if (selection !== undefined && typeof selection !== 'string')
          this.diagnose(
            decision.id,
            'invalid',
            'value-not-in-pool',
            `${decision.id} is authored text`,
            this.own(decision),
          );
        else if (typeof selection === 'string') this.valid.set(decision.id, selection);
        continue;
      }
      if (decision.kind !== 'choice') {
        if (selection !== undefined)
          this.diagnose(
            decision.id,
            'invalid',
            'unavailable-decision',
            `${decision.id} is ${decision.kind === 'automatic' ? 'an automatic grant' : 'not a selection'}; it takes no selection`,
            this.own(decision),
          );
        continue;
      }
      if (!available) {
        if (selection !== undefined)
          this.diagnose(
            decision.id,
            'invalid',
            'unavailable-decision',
            `${decision.id} is not available for the current selections; its selection cannot grant anything`,
            this.own(decision),
          );
        continue;
      }
      if (selection === undefined) {
        this.missing(decision);
        continue;
      }
      this.validateShape(decision, selection);
    }
  }

  missing(decision: Decision) {
    let message = `Required choice missing: ${decision.quote}`;
    let source = this.own(decision);
    if (decision.id === 'kit.choice') {
      const aspect = this.single('class.fury.aspect');
      const parent = aspect ? decision.optionsByParent?.[aspect] : undefined;
      if (parent?.quote) source = this.sentence({ path: parent.source, quote: parent.quote });
      if (aspect === 'Berserker' || aspect === 'Reaver')
        message = `Required choice missing: the ${aspect} aspect grants the Kit feature, so a kit must be chosen before Stamina, stability, disengage and kit damage bonuses can be derived`;
    }
    this.diagnose(decision.id, 'incomplete', 'required-choice-missing', message, source);
  }

  validateShape(decision: Decision, selection: SelectionValue) {
    const shape = decision.shape;
    const { values: pool, parent, parentValue } = this.pool(decision);
    const notInPool = (value: string) =>
      this.diagnose(
        decision.id,
        'invalid',
        'value-not-in-pool',
        `${value} is not among the options for ${decision.id}${parentValue ? ` with ${parentValue}` : ''}`,
        parent?.quote
          ? this.sentence({ path: parent.source, quote: parent.quote })
          : this.own(decision),
      );
    switch (shape.type) {
      case 'single': {
        if (typeof selection !== 'string') {
          this.diagnose(
            decision.id,
            'invalid',
            'value-not-in-pool',
            `${decision.id} takes one option value`,
            this.own(decision),
          );
          return;
        }
        if (!pool.includes(selection)) return notInPool(selection);
        this.valid.set(decision.id, selection);
        if (!this.supported(decision, selection)) this.unsupported(decision, selection);
        return;
      }
      case 'multi': {
        if (!Array.isArray(selection)) {
          this.diagnose(
            decision.id,
            'invalid',
            'count-mismatch',
            `${decision.id} takes a list of ${shape.count} slots`,
            this.own(decision),
          );
          return;
        }
        if (selection.length !== shape.count) {
          this.diagnose(
            decision.id,
            'invalid',
            'count-mismatch',
            `${decision.id} has ${selection.length} slots; the source grants ${shape.count}`,
            this.own(decision),
          );
          return;
        }
        let ok = true;
        const seen = new Set<string>();
        for (const item of selection) {
          if (item === null) {
            if (!shape.deferrable) {
              this.diagnose(
                decision.id,
                'incomplete',
                'required-choice-missing',
                `Required choice missing: ${decision.quote}`,
                this.own(decision),
              );
              ok = false;
            }
            continue;
          }
          if (!pool.includes(item)) {
            notInPool(item);
            ok = false;
            continue;
          }
          if (seen.has(item)) {
            this.diagnose(
              decision.id,
              'invalid',
              'count-mismatch',
              `${item} is selected twice for ${decision.id}; each slot names a different option`,
              this.own(decision),
            );
            ok = false;
          }
          seen.add(item);
        }
        if (!ok) return;
        this.valid.set(decision.id, selection);
        for (const item of selection)
          if (item !== null && !this.supported(decision, item)) this.unsupported(decision, item);
        return;
      }
      case 'points': {
        if (!Array.isArray(selection) || selection.some(item => typeof item !== 'string')) {
          this.diagnose(
            decision.id,
            'invalid',
            'value-not-in-pool',
            `${decision.id} takes a list of option values`,
            this.own(decision),
          );
          return;
        }
        const items = selection as string[];
        const options = decision.options ?? [];
        let ok = true;
        const chosen: DecisionOption[] = [];
        for (const item of items) {
          const option = options.find(o => o.value === item);
          if (!option) {
            notInPool(item);
            ok = false;
            continue;
          }
          if (chosen.includes(option)) {
            this.diagnose(
              decision.id,
              'invalid',
              'count-mismatch',
              `${item} is selected twice for ${decision.id}`,
              this.own(decision),
            );
            ok = false;
            continue;
          }
          chosen.push(option);
        }
        if (!ok) return;
        const total = chosen.reduce((sum, option) => sum + (option.cost ?? 0), 0);
        const words = BUDGET_WORDS[decision.id] ?? { unit: 'points', grant: 'option' };
        const rule = decision.budgetRule
          ? this.sentence({
              path: decision.budgetRule.source,
              quote: decision.budgetRule.quote ?? decision.quote,
              ...(BUDGET_RULE_HEADINGS[decision.id]
                ? { heading: BUDGET_RULE_HEADINGS[decision.id] }
                : {}),
            })
          : this.own(decision);
        if (total > shape.budget) {
          this.diagnose(
            decision.id,
            'invalid',
            'budget-exceeded',
            `${chosen.map(o => `${o.value} (${o.cost ?? 0})`).join(' + ')} = ${total} exceeds the ${shape.budget} ${words.unit} budget; no ${words.grant} is granted until the selection is legal`,
            rule,
          );
          return;
        }
        this.valid.set(decision.id, items);
        if (total < shape.budget)
          this.diagnose(
            decision.id,
            'warning',
            'budget-unspent',
            `${total} of ${shape.budget} ${words.unit} spent. Unspent points are allowed; spending them later follows normal editing and review.`,
            this.own(decision),
          );
        for (const option of chosen)
          if (!this.supported(decision, option.value)) this.unsupported(decision, option.value);
        return;
      }
      case 'assignment': {
        const arrayId = decision.dependsOn?.[0] ?? '';
        const array = this.single(arrayId);
        if (
          typeof selection !== 'object' ||
          selection === null ||
          Array.isArray(selection) ||
          !array
        ) {
          this.diagnose(
            decision.id,
            'invalid',
            'assignment-mismatch',
            `${decision.id} maps each of ${shape.targets.join(', ')} to one value of the chosen array`,
            this.own(decision),
          );
          return;
        }
        const error = assignmentError(selection, parseArray(array));
        if (error) {
          this.diagnose(decision.id, 'invalid', 'assignment-mismatch', error, this.own(decision));
          return;
        }
        if (Object.keys(selection).length < shape.targets.length) {
          this.diagnose(
            decision.id,
            'incomplete',
            'required-choice-missing',
            `Assign the remaining values of ${array} to ${shape.targets.filter(t => selection[t] === undefined).join(', ')}.`,
            this.own(decision),
          );
          return;
        }
        this.valid.set(decision.id, selection);
        return;
      }
      default:
        this.diagnose(
          decision.id,
          'invalid',
          'unavailable-decision',
          `${decision.id} takes no selection`,
          this.own(decision),
        );
    }
  }

  // -------------------------------------------------------------------------------------------
  // Derivation (R02 section 1). Each method returns undefined when a term it reads is absent.

  private grantsOf(decisionId: string): OptionGrant[] {
    const decision = this.decisions.get(decisionId);
    if (!decision || !this.available.has(decisionId)) return [];
    if (decision.kind === 'automatic') return decision.grants ?? [];
    const selection = this.single(decisionId);
    return decision.options?.find(o => o.value === selection)?.grants ?? [];
  }

  private isFury(): boolean {
    return this.available.has('class.fury.baseline');
  }
  private isDevil(): boolean {
    return this.available.has('ancestry.devil.base-statistics');
  }
  private purchasedTraits(): string[] {
    return (this.list('ancestry.devil.purchased-traits') ?? []).filter(
      (t): t is string => t !== null,
    );
  }
  private kit() {
    const kit = this.single('kit.choice');
    const sentences = kit ? KIT_SENTENCES[kit] : undefined;
    return sentences && this.available.has(`kit.${kit!.toLowerCase()}.contributions`)
      ? { name: kit!, s: sentences, decisionId: `kit.${kit!.toLowerCase()}.contributions` }
      : undefined;
  }

  derive(): PartialBaseline {
    const out: PartialBaseline = {};
    const p = (entry: Provenance) => this.provenance(entry);
    const dv = <T>(value: T, provenance: Provenance[]): DerivedValue<T> => ({ value, provenance });

    // 1.2 Level and echelon: class.level is an automatic step with no availability condition.
    out.level = dv(1 as const, [
      p({
        decisionId: 'class.level',
        source: this.sentence(SENTENCES.level),
        operation: 'set',
        amount: 1,
      }),
    ]);
    const echelon = 1;

    const ancestry = this.single('ancestry.choice');
    if (ancestry)
      out.ancestry = dv(ancestry, [
        p({
          decisionId: 'ancestry.choice',
          selection: ancestry,
          source: this.sentence(SENTENCES.ancestryStep),
        }),
      ]);
    const klass = this.single('class.choice');
    if (klass)
      out.class = dv(klass, [
        p({
          decisionId: 'class.choice',
          selection: klass,
          source: this.sentence(SENTENCES.classStep),
        }),
      ]);
    const aspect = this.single('class.fury.aspect');
    if (aspect)
      out.subclass = dv(aspect, [
        p({
          decisionId: 'class.fury.aspect',
          selection: aspect,
          source: this.sentence(SENTENCES.subclass),
        }),
      ]);
    const career = this.single('career.choice');
    if (career)
      out.career = dv(career, [
        p({
          decisionId: 'career.choice',
          selection: career,
          source: this.sentence(SENTENCES.careerStep),
        }),
      ]);

    // 1.1 Characteristics.
    const fixed = this.available.has('class.fury.fixed-characteristics');
    const array = this.single('class.fury.characteristic-array');
    const assignment = this.valid.get('class.fury.array-assignment');
    if (
      fixed &&
      array &&
      assignment &&
      typeof assignment === 'object' &&
      !Array.isArray(assignment)
    ) {
      const fixedEntry = () =>
        p({
          decisionId: 'class.fury.fixed-characteristics',
          source: this.sentence(SENTENCES.fixedCharacteristics),
          operation: 'set',
          amount: 2,
        });
      const assigned = (target: string): DerivedValue<number> =>
        dv(assignment[target]!, [
          p({
            decisionId: 'class.fury.characteristic-array',
            selection: array,
            source: this.sentence(SENTENCES.characteristicArray),
          }),
          p({
            decisionId: 'class.fury.array-assignment',
            selection: `${target} ${assignment[target]}`,
            source: this.sentence(SENTENCES.characteristicArray),
            operation: 'set',
            amount: assignment[target]!,
          }),
        ]);
      out.characteristics = {
        M: dv(2, [fixedEntry()]),
        A: dv(2, [fixedEntry()]),
        R: assigned('Reason'),
        I: assigned('Intuition'),
        P: assigned('Presence'),
      };
    }
    const might = out.characteristics?.M.value;

    // 1.14 Kit contributions (read first: 1.3, 1.6, 1.7 and 1.9 add its terms).
    const kit = this.kit();
    if (kit) {
      const { s, decisionId } = kit;
      const entry = (quote: string, extra: Partial<Provenance> = {}) =>
        p({
          decisionId,
          source: this.sentence({ path: s.entryPath, quote, heading: KIT_BONUSES_HEADING }),
          ...extra,
        });
      const table = (extra: Partial<Provenance> = {}) =>
        p({
          decisionId,
          source: this.sentence({
            path: KITS_PATH,
            quote: s.tableRow,
            heading: KITS_TABLE_HEADING,
          }),
          ...extra,
        });
      const contributions: KitContributions = {
        name: dv(s.name, [
          p({
            decisionId: 'kit.choice',
            selection: s.name,
            source: this.sentence({ path: s.entryPath, quote: `name: ${s.name}` }),
          }),
        ]),
        equipmentText: dv(s.equipmentText, [
          p({
            decisionId,
            source: this.sentence({
              path: s.entryPath,
              quote: s.equipmentText,
              heading: 'Equipment',
            }),
          }),
        ]),
        staminaBonusPerEchelon: dv(s.staminaBonusPerEchelon.amount, [
          entry(s.staminaBonusPerEchelon.quote, {
            operation: 'set',
            amount: s.staminaBonusPerEchelon.amount,
          }),
        ]),
        echelon: dv(echelon, [
          p({
            decisionId: 'class.level',
            source: this.sentence(SENTENCES.echelon),
            operation: 'set',
            amount: echelon,
          }),
        ]),
        staminaBonusApplied: dv(s.staminaBonusPerEchelon.amount * echelon, [
          p({
            decisionId,
            source: this.sentence(SENTENCES.kitStaminaRule),
            operation: 'set',
            amount: s.staminaBonusPerEchelon.amount * echelon,
            note: `${s.staminaBonusPerEchelon.amount * echelon} at the 1st echelon`,
          }),
        ]),
        speedBonus: dv(s.speedBonus, [table({ operation: 'set', amount: s.speedBonus })]),
        stabilityBonus: dv(s.stabilityBonus?.amount ?? 0, [
          s.stabilityBonus
            ? entry(s.stabilityBonus.quote, { operation: 'set', amount: s.stabilityBonus.amount })
            : table({ operation: 'set', amount: 0 }),
        ]),
        meleeDamageBonus: dv(s.meleeDamageBonus?.value ?? [0, 0, 0], [
          s.meleeDamageBonus
            ? entry(s.meleeDamageBonus.quote, { note: 'applied per R04 section 4.2' })
            : table({ note: 'applied per R04 section 4.2' }),
        ]),
        rangedDamageBonus: dv(s.rangedDamageBonus, [table({ note: s.notes.rangedDamage })]),
        meleeDistanceBonus: dv(s.meleeDistanceBonus, [
          table({ operation: 'set', amount: s.meleeDistanceBonus }),
        ]),
        rangedDistanceBonus: dv(s.rangedDistanceBonus, [
          table({ operation: 'set', amount: s.rangedDistanceBonus }),
        ]),
        disengageBonus: dv(s.disengageBonus, [
          table({ operation: 'set', amount: s.disengageBonus }),
        ]),
      };
      out.kit = contributions;
    }

    // 1.3 Stamina maximum = class starting Stamina + kit Stamina bonus × echelon.
    if (this.isFury() && kit) {
      const s = kit.s;
      const applied = s.staminaBonusPerEchelon.amount * echelon;
      out.staminaMaximum = dv(21 + applied, [
        p({
          decisionId: 'class.fury.baseline',
          source: this.sentence(SENTENCES.startingStamina),
          operation: 'base',
          amount: 21,
        }),
        p({
          decisionId: kit.decisionId,
          source: this.sentence({
            path: s.entryPath,
            quote: s.staminaBonusPerEchelon.quote,
            heading: KIT_BONUSES_HEADING,
          }),
          operation: 'add',
          amount: applied,
          note: s.notes.stamina,
        }),
      ]);
    }
    // 1.4 Recoveries and recovery value.
    if (this.isFury())
      out.recoveriesMaximum = dv(10, [
        p({
          decisionId: 'class.fury.baseline',
          source: this.sentence(SENTENCES.recoveries),
          operation: 'set',
          amount: 10,
          note: 'rule: rule/health/recoveries.md, "determined by their class"',
        }),
      ]);
    if (out.staminaMaximum) {
      const stamina = out.staminaMaximum.value;
      out.recoveryValue = dv(Math.floor(stamina / 3), [
        p({
          decisionId: 'class.fury.baseline',
          source: this.sentence(SENTENCES.recoveryValue),
          operation: 'floor-divide',
          amount: 3,
          note: `floor(${stamina} / 3)`,
        }),
      ]);
      // 1.5 Winded value (restated from R04 6.3).
      out.windedValue = dv(Math.floor(stamina / 2), [
        p({
          decisionId: 'class.fury.baseline',
          source: this.sentence(SENTENCES.winded),
          operation: 'floor-divide',
          amount: 2,
          note: `floor(${stamina} / 2); R04 section 6.3`,
        }),
      ]);
    }

    // 1.6 to 1.8 Speed, stability and size from the ancestry base statistics.
    const traits = this.purchasedTraits();
    if (this.isDevil()) {
      const base = (amount: number) =>
        p({
          decisionId: 'ancestry.devil.base-statistics',
          source: this.sentence(SENTENCES.baseStatistics),
          operation: 'base',
          amount,
        });
      let speed = 5;
      const speedProvenance: Provenance[] = [base(5)];
      for (const trait of traits) {
        const effect = TRAIT_EFFECTS[trait];
        if (effect?.field === 'speed') {
          speed = effect.value;
          speedProvenance.push(
            p({
              decisionId: 'ancestry.devil.purchased-traits',
              selection: trait,
              source: this.sentence(effect.sentence),
              operation: 'set',
              amount: effect.value,
            }),
          );
        }
      }
      if (kit) {
        speed += kit.s.speedBonus;
        speedProvenance.push(
          p({
            decisionId: kit.decisionId,
            source: this.sentence({
              path: KITS_PATH,
              quote: kit.s.tableRow,
              heading: KITS_TABLE_HEADING,
            }),
            operation: 'add',
            amount: kit.s.speedBonus,
            note: kit.s.notes.speed,
          }),
        );
      }
      out.speed = dv(speed, speedProvenance);
      if (kit) {
        const bonus = kit.s.stabilityBonus;
        out.stability = dv(Math.max(0, 0 + (bonus?.amount ?? 0)), [
          base(0),
          p({
            decisionId: kit.decisionId,
            source: bonus
              ? this.sentence({
                  path: kit.s.entryPath,
                  quote: bonus.quote,
                  heading: KIT_BONUSES_HEADING,
                })
              : this.sentence({
                  path: KITS_PATH,
                  quote: kit.s.tableRow,
                  heading: KITS_TABLE_HEADING,
                }),
            operation: 'add',
            amount: bonus?.amount ?? 0,
            note: kit.s.notes.stability,
          }),
        ]);
      }
      out.size = dv('1M', [
        p({
          decisionId: 'ancestry.devil.base-statistics',
          source: this.sentence(SENTENCES.baseStatistics),
          operation: 'set',
        }),
      ]);
    }

    // 1.9 Disengage = 1 + kit disengage bonus.
    if (kit)
      out.disengage = dv(1 + kit.s.disengageBonus, [
        p({
          decisionId: 'free-strikes.grant',
          source: this.sentence(SENTENCES.disengage),
          operation: 'base',
          amount: 1,
          note: 'common move action, not a creation decision; attached to the automatic step',
        }),
        p({
          decisionId: kit.decisionId,
          source: this.sentence({
            path: KITS_PATH,
            quote: kit.s.tableRow,
            heading: KITS_TABLE_HEADING,
          }),
          operation: 'add',
          amount: kit.s.disengageBonus,
          note: kit.s.notes.disengage,
        }),
      ]);

    // 1.10 Potencies from the class-named characteristic.
    if (this.isFury()) {
      out.potencyCharacteristic = dv('M' as Characteristic, [
        p({
          decisionId: 'class.fury.baseline',
          source: this.sentence(SENTENCES.potencyStrong),
          note: 'class-named characteristic; the specific Fury formula applies (Potencies and Game of Exceptions).',
        }),
      ]);
      if (might !== undefined) {
        const potency = (sentence: Sentence, amount: number, note: string): DerivedValue<number> =>
          dv(amount, [
            p({
              decisionId: 'class.fury.baseline',
              source: this.sentence(sentence),
              operation: 'set',
              amount,
              note,
            }),
          ]);
        out.potency = {
          weak: potency(SENTENCES.potencyWeak, might - 2, `Might ${might} − 2`),
          average: potency(SENTENCES.potencyAverage, might - 1, `Might ${might} − 1`),
          strong: potency(SENTENCES.potencyStrong, might, `Might ${might}`),
        };
      }
      // 1.11 Heroic resource.
      out.heroicResource = {
        name: dv('ferocity' as const, [
          p({ decisionId: 'class.fury.features', source: this.sentence(SENTENCES.ferocityName) }),
        ]),
        startingValue: dv(0, [
          p({
            decisionId: 'class.fury.features',
            source: this.sentence(SENTENCES.ferocityOutsideCombat),
            operation: 'set',
            amount: 0,
            note: 'Interpretation: a newly created hero has not been in combat and cannot have gained ferocity; see also "You lose any remaining ferocity at the end of the encounter." R03 owns live initialization.',
          }),
        ]),
      };
    }

    // 1.12 Saving-throw threshold: 6 by rule, set by a trait that names another number.
    {
      let threshold = 6;
      const provenance: Provenance[] = [
        p({
          decisionId: 'free-strikes.grant',
          source: this.sentence(SENTENCES.savingThrow),
          operation: 'base',
          amount: 6,
          note: 'general rule, not a creation decision; attached to the automatic step',
        }),
      ];
      for (const trait of traits) {
        const effect = TRAIT_EFFECTS[trait];
        if (effect?.field === 'savingThrowThreshold') {
          threshold = effect.value;
          provenance.push(
            p({
              decisionId: 'ancestry.devil.purchased-traits',
              selection: trait,
              source: this.sentence(effect.sentence),
              operation: 'set',
              amount: effect.value,
            }),
          );
        }
      }
      out.savingThrowThreshold = dv(threshold, provenance);
    }

    // 1.13 Renown and Wealth (Soldier only in v0.01; other careers are unsupported options).
    if (this.available.has('career.soldier.renown')) {
      out.renown = dv(0 + 1, [
        p({
          decisionId: 'career.soldier.renown',
          source: this.sentence(SENTENCES.renownBase),
          operation: 'base',
          amount: 0,
        }),
        p({
          decisionId: 'career.soldier.renown',
          source: this.sentence({ path: 'en/unified/md/career/soldier.md', quote: 'Renown: +1' }),
          operation: 'add',
          amount: 1,
        }),
      ]);
      out.wealth = dv(1, [
        p({
          decisionId: 'career.choice',
          selection: 'Soldier',
          source: this.sentence(SENTENCES.wealthBase),
          operation: 'base',
          amount: 1,
          note: 'Soldier lists no wealth benefit',
        }),
      ]);
    }

    // 1.15 Granted content, in definition order per group.
    out.skills = this.skills();
    out.languages = this.languages();
    out.traits = this.traits();
    out.features = this.features();
    out.perks = this.perks();
    out.abilities = this.abilities();
    out.uncertainties = UNCERTAINTY_ORDER.filter(id => this.uncertainties.has(id));
    return out;
  }

  private skillGroup(name: string): string {
    for (const [poolId, pool] of Object.entries(this.definitions.pools))
      if (poolId.startsWith('pool.skills.') && pool.values.includes(name))
        return poolId.slice('pool.skills.'.length);
    return 'unknown';
  }

  private skills(): GrantedSkill[] {
    const candidates: { skill: GrantedSkill; fixed: boolean }[] = [];
    const add = (name: string, provenance: Provenance, fixed: boolean) => {
      candidates.push({
        skill: { name, group: this.skillGroup(name), provenance: this.provenance(provenance) },
        fixed,
      });
    };
    for (const decision of this.order) {
      if (!this.available.has(decision.id)) continue;
      const override = SKILL_SENTENCES[decision.id];
      const sentence = override ? this.sentence(override) : this.own(decision);
      if (decision.kind === 'automatic') {
        for (const grant of decision.grants ?? [])
          if (grant.kind === 'skill')
            add(grant.value, { decisionId: decision.id, source: sentence }, true);
        continue;
      }
      if (decision.kind !== 'choice' || !this.valid.has(decision.id)) continue;
      const value = this.valid.get(decision.id)!;
      if (/\.skills?(\.|$)|-skill$/.test(decision.id)) {
        const names = Array.isArray(value) ? value : [value];
        for (const name of names)
          if (typeof name === 'string')
            add(name, { decisionId: decision.id, selection: name, source: sentence }, false);
        continue;
      }
      for (const grant of this.grantsOf(decision.id))
        if (grant.kind === 'skill')
          add(
            grant.value,
            {
              decisionId: decision.id,
              selection: typeof value === 'string' ? value : undefined,
              source: this.sentence({
                path: grant.source ?? decision.source,
                quote: grant.quote ?? decision.quote,
              }),
            },
            true,
          );
    }
    // Fixed grants win regardless of where the granting choice appeared in the wizard.
    const fixed = new Map<string, GrantedSkill>();
    for (const candidate of candidates.filter(candidate => candidate.fixed)) {
      const skill = candidate.skill;
      if (fixed.has(skill.name)) {
        // No supported Soldier/Berserker option creates this case. Preserve the entitlement as
        // unsupported rather than silently choosing its unrestricted replacement for future paths.
        this.diagnose(
          skill.provenance.decisionId,
          'unsupported',
          'duplicate-skill',
          `${skill.name} is granted by two fixed sources and requires an unrestricted replacement choice; that creation path is not supported in v0.01.`,
          skill.provenance.source,
        );
      } else fixed.set(skill.name, skill);
    }
    const chosen = candidates
      .filter(candidate => !candidate.fixed)
      .map(candidate => candidate.skill);
    const invalidChoices = new Set<string>();
    for (const skill of chosen) {
      if (fixed.has(skill.name) || chosen.filter(other => other.name === skill.name).length > 1) {
        invalidChoices.add(skill.provenance.decisionId);
        this.diagnose(
          skill.provenance.decisionId,
          'invalid',
          'duplicate-skill',
          `${skill.name} is already granted by another creation choice or fixed source. Choose a distinct eligible skill from this decision's printed pool; duplication grants no unrestricted replacement.`,
          skill.provenance.source,
        );
      }
    }
    // Keep the fixture's stable presentation order; accounting above never depends on input order.
    return candidates
      .filter(({ skill, fixed: isFixed }) =>
        isFixed
          ? fixed.get(skill.name) === skill
          : !invalidChoices.has(skill.provenance.decisionId),
      )
      .map(candidate => candidate.skill);
  }

  private languages(): GrantedLanguage[] {
    const out: GrantedLanguage[] = [];
    const granted = new Map<string, { decisionId: string; automatic: boolean }>();
    const add = (name: string, provenance: Provenance, automatic: boolean) => {
      const earlier = granted.get(name);
      const entry: GrantedLanguage = { name, provenance };
      if (earlier) {
        entry.duplicateOf = earlier.decisionId;
        this.diagnose(
          provenance.decisionId,
          'warning',
          'duplicate-language',
          `${name} is already known through ${earlier.decisionId}; choose an extra language or leave the career slot open.`,
          this.sentence(earlier.automatic ? SENTENCES.caelian : SENTENCES.cultureLanguage),
        );
      } else granted.set(name, { decisionId: provenance.decisionId, automatic });
      out.push({ ...entry, provenance: this.provenance(provenance) });
    };
    if (this.available.has('culture.caelian'))
      add(
        'Caelian',
        { decisionId: 'culture.caelian', source: this.sentence(SENTENCES.caelian) },
        true,
      );
    const culture = this.single('culture.language');
    if (culture)
      add(
        culture,
        {
          decisionId: 'culture.language',
          selection: culture,
          source: this.sentence(SENTENCES.cultureLanguage),
        },
        false,
      );
    const soldier = this.decisions.get('career.soldier.languages');
    for (const name of this.list('career.soldier.languages') ?? [])
      if (name !== null && soldier)
        add(name, { decisionId: soldier.id, selection: name, source: this.own(soldier) }, false);
    return out;
  }

  private traits(): GrantedFeature[] {
    const out: GrantedFeature[] = [];
    const signature = this.decisions.get('ancestry.devil.signature-trait');
    if (signature && this.available.has(signature.id))
      for (const grant of signature.grants ?? [])
        if (grant.kind === 'trait')
          out.push({
            name: grant.value,
            kind: 'ancestry-signature-trait',
            sourcePath: grant.source ?? signature.source,
            provenance: this.provenance({
              decisionId: signature.id,
              source: this.sentence(SENTENCES.ancestryTraits),
            }),
          });
    const purchased = this.decisions.get('ancestry.devil.purchased-traits');
    if (purchased)
      for (const name of this.purchasedTraits()) {
        const option = purchased.options?.find(o => o.value === name);
        if (!option) continue;
        const effect = TRAIT_EFFECTS[name];
        out.push({
          name,
          kind: 'ancestry-purchased-trait',
          sourcePath: option.source ?? purchased.source,
          ...(option.cost !== undefined ? { cost: option.cost } : {}),
          provenance: this.provenance({
            decisionId: purchased.id,
            selection: name,
            source: this.own(purchased),
          }),
          ...(effect ? { affects: [effect.field] } : {}),
        });
      }
    return out;
  }

  private features(): GrantedFeature[] {
    const out: GrantedFeature[] = [];
    if (this.available.has('culture.edge'))
      out.push({
        name: 'Culture edge',
        kind: 'culture-benefit',
        sourcePath: SENTENCES.cultureEdge.path,
        provenance: this.provenance({
          decisionId: 'culture.edge',
          source: this.sentence(SENTENCES.cultureEdge),
        }),
      });
    const classFeatures = this.decisions.get('class.fury.features');
    if (classFeatures && this.available.has(classFeatures.id))
      for (const grant of classFeatures.grants ?? [])
        if (grant.kind === 'feature') {
          const affects = CLASS_FEATURE_AFFECTS[grant.value];
          out.push({
            name: grant.value,
            kind: 'class-feature',
            sourcePath: grant.source ?? classFeatures.source,
            provenance: this.provenance({
              decisionId: classFeatures.id,
              source: this.sentence(SENTENCES.furyAdvancement),
            }),
            ...(affects ? { affects } : {}),
          });
        }
    const aspect = this.single('class.fury.aspect');
    if (aspect)
      for (const grant of this.grantsOf('class.fury.aspect'))
        if (grant.kind === 'feature')
          out.push({
            name: grant.value,
            kind: 'aspect-feature',
            sourcePath: FEATURE_ENTRY_PATHS[grant.value] ?? grant.source ?? '',
            provenance: this.provenance({
              decisionId: 'class.fury.aspect',
              selection: aspect,
              source: this.sentence(ASPECT_FEATURE_SENTENCE),
            }),
            ...(grant.value === 'Kit' ? { affects: ['kit' as const] } : {}),
          });
    return out;
  }

  private perks(): GrantedFeature[] {
    const perk = this.decisions.get('career.soldier.perk');
    const name = this.single('career.soldier.perk');
    if (!perk || !name) return [];
    return [
      {
        name,
        kind: 'perk',
        sourcePath: perk.optionSources?.[name] ?? perk.source,
        provenance: this.provenance({
          decisionId: perk.id,
          selection: name,
          source: this.own(perk),
        }),
      },
    ];
  }

  private abilities(): GrantedAbility[] {
    const out: GrantedAbility[] = [];
    for (const id of [
      'class.fury.signature-ability',
      'class.fury.ability-3',
      'class.fury.ability-5',
    ]) {
      const decision = this.decisions.get(id);
      const name = this.single(id);
      const option = decision?.options?.find(o => o.value === name);
      if (!decision || !name || !option) continue;
      const cost = parseCost(option.costQuote);
      out.push({
        name,
        kind: id === 'class.fury.signature-ability' ? 'signature' : 'heroic',
        sourcePath: option.source ?? decision.source,
        ...(cost ? { cost } : {}),
        kitBonusesIncluded: false,
        provenance: this.provenance({
          decisionId: id,
          selection: name,
          source: this.own(decision, FURY_ABILITY_HEADINGS[id]),
        }),
      });
    }
    const aspect = this.single('class.fury.aspect');
    if (aspect)
      for (const grant of this.grantsOf('class.fury.aspect'))
        if (grant.kind === 'ability')
          out.push({
            name: grant.value,
            kind: 'aspect-triggered',
            sourcePath: grant.source ?? '',
            kitBonusesIncluded: false,
            provenance: this.provenance({
              decisionId: 'class.fury.aspect',
              selection: aspect,
              source: this.sentence(ASPECT_TRIGGERED_SENTENCE),
            }),
          });
    const kit = this.kit();
    if (kit)
      out.push({
        name: kit.s.signatureAbility,
        kind: 'kit-signature',
        sourcePath: kit.s.entryPath,
        kitBonusesIncluded: true,
        provenance: this.provenance({
          decisionId: kit.decisionId,
          source: this.sentence(SENTENCES.kitSignature),
        }),
      });
    const free = this.decisions.get('free-strikes.grant');
    if (free && this.available.has(free.id))
      for (const grant of free.grants ?? [])
        if (grant.kind === 'ability')
          out.push({
            name: grant.value,
            kind: 'free-strike',
            sourcePath: grant.source ?? free.source,
            kitBonusesIncluded: false,
            provenance: this.provenance({
              decisionId: free.id,
              source: this.sentence(SENTENCES.freeStrikes),
            }),
          });
    return out;
  }
}

const BASELINE_KEYS: (keyof DerivedBaseline)[] = [
  'level',
  'ancestry',
  'class',
  'subclass',
  'career',
  'characteristics',
  'staminaMaximum',
  'recoveriesMaximum',
  'recoveryValue',
  'windedValue',
  'speed',
  'stability',
  'size',
  'disengage',
  'potencyCharacteristic',
  'potency',
  'heroicResource',
  'savingThrowThreshold',
  'renown',
  'wealth',
  'kit',
  'skills',
  'languages',
  'traits',
  'features',
  'perks',
  'abilities',
  'uncertainties',
];

/** Converts a saved selection list into the evaluator's map shape. */
export function selectionsFrom(
  entries: { decisionId: string; value: unknown }[],
): Record<string, SelectionValue> {
  return Object.fromEntries(
    entries.map(entry => [entry.decisionId, entry.value as SelectionValue]),
  );
}

/**
 * Evaluates one set of selections against the R01 definitions. Deterministic; throws only on a
 * contract violation (a `complete` status whose baseline lacks a field), never on user input.
 */
export function evaluateCharacter(
  input: EvaluationInput,
  definitions: DecisionDefinitions,
): EvaluationResult {
  const evaluation = new Evaluation(definitions, input.selections);
  const evaluatedAgainst = {
    definitionsSchemaVersion: DEFINITIONS_SCHEMA_VERSION as 'r01.1',
    compendiumRevision: definitions.compendiumRevision,
  };
  if (
    input.definitionsSchemaVersion !== definitions.schemaVersion ||
    input.compendiumRevision !== definitions.compendiumRevision ||
    input.level !== 1
  )
    evaluation.diagnose(
      'definitions',
      'invalid',
      'definition-mismatch',
      `The selections cite definitions ${input.definitionsSchemaVersion} at ${input.compendiumRevision} (level ${input.level}); this evaluator uses ${definitions.schemaVersion} at ${definitions.compendiumRevision} at level 1`,
    );
  evaluation.validate();
  const fields = evaluation.derive();
  const severities = new Set(
    Object.values(evaluation.diagnostics)
      .flat()
      .map(d => d.severity),
  );
  const status = severities.has('invalid')
    ? 'invalid'
    : severities.has('unsupported')
      ? 'unsupported'
      : severities.has('incomplete')
        ? 'incomplete'
        : 'complete';
  if (status === 'complete') {
    const missing = BASELINE_KEYS.filter(key => fields[key] === undefined);
    if (missing.length)
      throw new Error(
        `Evaluator contract violation: complete status without ${missing.join(', ')}`,
      );
    return {
      status,
      diagnostics: evaluation.diagnostics,
      baseline: fields as DerivedBaseline,
      evaluatedAgainst,
    };
  }
  return {
    status,
    diagnostics: evaluation.diagnostics,
    baseline: null,
    partial: fields,
    evaluatedAgainst,
  };
}
