import { startingRewardItems } from '../content/starting-reward-items.ts';
import { tacticianAbilities } from './tacticianAbilities.ts';
import { complicationAbilities } from './complicationAbilities.ts';
import { perkAbilities } from './perkAbilities.ts';
import { applyRevenantBaseline, applyRevenantDisengage } from './ancestries/revenant.ts';
import { applyTimeRaiderBaseline } from './ancestries/time-raider.ts';
import { applyWodeElfBaseline } from './ancestries/wode-elf.ts';
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
import { ancestryAbilities } from './ancestryAbilities.ts';
import { assignmentError } from './assignment.ts';
import { effectiveParent, isAvailable, poolOf, poolValues } from './structure.ts';
import { CAREER_BENEFITS } from '../content/supporting-backgrounds.ts';
import { COMPLICATION_ABILITIES } from '../content/supporting-complication-abilities.ts';
import { COMPLICATION_EFFECTS } from '../content/supporting-complications.ts';
import { SUPPORTING_KITS, KIT_BONUS_SOURCES } from '../content/supporting-kits.ts';
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
} from './sources.ts';

import { characterSupportDiagnostics } from '../content/character-support.ts';
import {
  applyFurySubclass,
  applyFuryCharacteristics,
  applyFuryVitals,
  applyFuryResource,
} from './classes/fury.ts';
import { applyClassProfile } from './classes/profile.ts';
import type { SelectedKit } from './derivation.ts';
import { applyElementalistModifiers } from './classes/elementalist.ts';
import {
  FIELD_ARSENAL,
  SECOND_KIT_DECISION,
  kitSentencesFor,
  resolveArsenal,
  type Arsenal,
} from './classes/tactician.ts';
import {
  applyDevilMovement,
  applyDevilSavingThrow,
  applyDevilNoKit,
  appendDevilTraits,
} from './ancestries/devil.ts';
import { applyDragonKnightBaseline } from './ancestries/dragon-knight.ts';
import { applyHighElfBaseline, applyHighElfDisengage } from './ancestries/high-elf.ts';
import { applyMemonekBaseline } from './ancestries/memonek.ts';
import { applyDwarfBaseline } from './ancestries/dwarf.ts';
import { applyHakaanBaseline } from './ancestries/hakaan.ts';
import { applyOrcBaseline } from './ancestries/orc.ts';
import { applyHumanBaseline } from './ancestries/human.ts';
import { applyPolderBaseline, applyPolderDisengage } from './ancestries/polder.ts';

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
  if (
    resource !== 'ferocity' &&
    resource !== 'essence' &&
    resource !== 'insight' &&
    resource !== 'focus'
  )
    return undefined;
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

  readonly level: number;
  readonly definitions: DecisionDefinitions;
  readonly selections: Record<string, SelectionValue>;
  /** Steps the v0.01 wizard does not present (the complication step, Q-CHAR-1): never a diagnostic. */
  readonly notPresented = new Set<string>();

  constructor(
    definitions: DecisionDefinitions,
    selections: Record<string, SelectionValue>,
    level: number,
  ) {
    this.level = level;
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
    return isAvailable(decision, Object.fromEntries(this.valid), this.decisions);
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
    if (decision.overlapBenefit)
      return {
        values: [this.single('kit.choice'), this.single(SECOND_KIT_DECISION)].filter(
          (name): name is string => typeof name === 'string',
        ),
      };
    if (decision.optionsByParent) {
      const parentValue = effectiveParent(
        decision,
        Object.fromEntries(this.valid),
        this.decisions,
      )?.value;
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
        if (!available) {
          if (selection !== undefined)
            this.diagnose(
              decision.id,
              'invalid',
              'unavailable-decision',
              `${decision.id} is not available for the current selections`,
              this.own(decision),
            );
          continue;
        }
        if (decision.requiredText && (typeof selection !== 'string' || !selection.trim()))
          this.missing(decision);
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
        if (!decision.optional) this.missing(decision);
        continue;
      }
      this.validateShape(decision, selection);
    }
    // Owned targets can refer to skills chosen later in the wizard; validate only after all
    // ordinary choices, and repeat when removing an invalid target invalidates its dependents.
    let changed = true;
    while (changed) {
      changed = false;
      const selections = Object.fromEntries(this.valid);
      for (const decision of this.order) {
        if (!this.available.has(decision.id)) continue;
        if (!isAvailable(decision, selections, this.decisions)) {
          this.available.delete(decision.id);
          delete this.diagnostics[decision.id];
          if (this.valid.has(decision.id))
            this.diagnose(
              decision.id,
              'invalid',
              'unavailable-decision',
              `${decision.id} is unavailable for these choices and grants nothing.`,
              this.own(decision),
            );
          changed = this.valid.delete(decision.id) || changed;
          continue;
        }
        if (
          (!decision.ownedPool &&
            !decision.selectedPool &&
            !decision.abilityPool &&
            !decision.options?.some(
              option =>
                option.requiresFeature ||
                option.excludesFeatures?.length ||
                option.excludedWhen?.length,
            )) ||
          !this.valid.has(decision.id)
        )
          continue;
        const value = this.valid.get(decision.id)!;
        const values = Array.isArray(value) ? value : [value];
        const allowed = poolOf(decision, selections, this.definitions).values;
        if (
          values.some(
            item => item !== null && (typeof item !== 'string' || !allowed.includes(item)),
          )
        ) {
          this.diagnose(
            decision.id,
            'invalid',
            'value-not-in-pool',
            `Choose an eligible ${decision.ownedPool?.kind ?? 'option'} for ${decision.label ?? decision.id}. Its ownership requirements are not met.`,
            this.own(decision),
          );
          this.valid.delete(decision.id);
          changed = true;
        }
      }
    }
  }

  missing(decision: Decision) {
    let message = `Required choice missing: ${decision.quote}`;
    let source = this.own(decision);
    if (decision.id === 'kit.choice') {
      // The effective parent (a Fury aspect or a class with its own kit entry) owns the sentence.
      const aspect = effectiveParent(
        decision,
        Object.fromEntries(this.valid),
        this.decisions,
      )?.value;
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
        if (!pool.includes(selection) && !shape.customAllowed) return notInPool(selection);
        if (shape.customAllowed && !selection.trim()) return this.missing(decision);
        this.valid.set(decision.id, selection);
        if (!shape.customAllowed && !this.supported(decision, selection))
          this.unsupported(decision, selection);
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
        if (decision.exactBudget && total < shape.budget) {
          this.diagnose(
            decision.id,
            'incomplete',
            'required-choice-missing',
            `${total} of ${shape.budget} points selected; this source requires ${shape.budget} points.`,
            this.own(decision),
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
        const error = assignmentError(selection, parseArray(array), shape.targets);
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
    const values = this.list(decisionId) ?? [this.single(decisionId)];
    return values.flatMap(value => decision.options?.find(o => o.value === value)?.grants ?? []);
  }

  private kit() {
    const kit = this.single('kit.choice');
    const sentences = kit
      ? this.definitions.supportingChoicesVersion
        ? (KIT_SENTENCES[kit] ?? SUPPORTING_KITS[kit])
        : KIT_SENTENCES[kit]
      : undefined;
    return sentences && this.available.has(`kit.${kit!.toLowerCase()}.contributions`)
      ? { name: kit!, s: sentences, decisionId: `kit.${kit!.toLowerCase()}.contributions` }
      : undefined;
  }

  /** The Tactician's Field Arsenal second kit (V94); ordinary kits only, distinct from `kit.choice`. */
  private secondKit(): SelectedKit | undefined {
    const name = this.available.has(SECOND_KIT_DECISION)
      ? this.single(SECOND_KIT_DECISION)
      : undefined;
    const s = kitSentencesFor(name);
    return s && name !== this.single('kit.choice')
      ? { name: name!, s, decisionId: SECOND_KIT_DECISION }
      : undefined;
  }

  /** Field Arsenal resolution for the current derivation; read by the ability list. */
  private arsenal: Arsenal | undefined;

  /** 1.14 One kit's printed contributions with their own provenance. */
  private kitContributions(kit: SelectedKit, echelon: number): KitContributions {
    const p = (entry: Provenance) => this.provenance(entry);
    const dv = <T>(value: T, provenance: Provenance[]): DerivedValue<T> => ({ value, provenance });
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
          decisionId: decisionId === SECOND_KIT_DECISION ? decisionId : 'kit.choice',
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
      disengageBonus: dv(s.disengageBonus, [table({ operation: 'set', amount: s.disengageBonus })]),
    };
    return contributions;
  }

  derive(): PartialBaseline {
    const out: PartialBaseline = {};
    const p = (entry: Provenance) => this.provenance(entry);
    const dv = <T>(value: T, provenance: Provenance[]): DerivedValue<T> => ({ value, provenance });

    // 1.2 Level and echelon: class.level is an automatic step with no availability condition.
    out.level = dv(this.level, [
      p({
        decisionId: 'class.level',
        source:
          this.level === 2
            ? this.own(this.decisions.get('class.level')!)
            : this.sentence(SENTENCES.level),
        operation: 'set',
        amount: this.level,
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
    applyFurySubclass(this, out);
    const career = this.single('career.choice');
    if (career)
      out.career = dv(career, [
        p({
          decisionId: 'career.choice',
          selection: career,
          source: this.sentence(SENTENCES.careerStep),
        }),
      ]);

    applyFuryCharacteristics(this, out);

    // 1.14 Kit contributions (read first: 1.3, 1.6, 1.7 and 1.9 add its terms).
    const kit = this.kit();
    const second = this.secondKit();
    this.arsenal = undefined;
    if (kit) {
      const first = this.kitContributions(kit, echelon);
      if (second) {
        const other = this.kitContributions(second, echelon);
        out.kits = [first, other];
        this.arsenal = resolveArsenal(
          this,
          { kit, contributions: first },
          { kit: second, contributions: other },
        );
        if (this.arsenal.kit) out.kit = this.arsenal.kit;
      } else out.kit = first;
    }

    applyFuryVitals(this, out, kit, echelon);

    applyDevilMovement(this, out, kit);

    // 1.9 Disengage = 1 + kit disengage bonus (the resolved arsenal bonus for a two-kit hero).
    if (kit && out.kit)
      out.disengage = dv(1 + out.kit.disengageBonus.value, [
        p({
          decisionId: 'free-strikes.grant',
          source: this.sentence(SENTENCES.disengage),
          operation: 'base',
          amount: 1,
          note: 'common move action, not a creation decision; attached to the automatic step',
        }),
        ...(second
          ? out.kit.disengageBonus.provenance.map(item => ({ ...item, operation: 'add' as const }))
          : [
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
            ]),
      ]);

    applyFuryResource(this, out);

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
      applyDevilSavingThrow(this, provenance, value => {
        threshold = value;
      });
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

    this.deriveProfiles(out);
    this.deriveSupportingBenefits(out);
    this.citeSupportingKit(out);

    // 1.15 Granted content, in definition order per group.
    out.skills = this.skills();
    out.languages = this.languages();
    out.traits = this.traits();
    out.features = this.features();
    out.perks = this.perks();
    out.abilities = complicationAbilities(
      out.features,
      perkAbilities(out.perks, ancestryAbilities(out.traits, this.abilities())),
    );
    out.abilities = tacticianAbilities(out.features, out.abilities);
    this.deriveSupportingChoices(out);
    const items = startingRewardItems(out.features ?? [], out.initialItems);
    if (items.length) out.initialItems = items;
    out.uncertainties = UNCERTAINTY_ORDER.filter(id => this.uncertainties.has(id));
    return out;
  }

  private citeSupportingKit(out: PartialBaseline) {
    const kit = this.kit();
    if (!kit || !this.definitions.supportingChoicesVersion || KIT_SENTENCES[kit.name]) return;
    const sources = KIT_BONUS_SOURCES[kit.name];
    if (!sources) return;
    const cite = (value: { provenance: Provenance[] } | undefined, field: string) => {
      const source = sources[field];
      if (!value || !source) return;
      value.provenance = value.provenance.map(entry =>
        entry.decisionId === kit.decisionId ? { ...entry, source: this.sentence(source) } : entry,
      );
    };
    for (const [field, source] of [
      ['staminaMaximum', 'stamina'],
      ['speed', 'speed'],
      ['stability', 'stability'],
      ['disengage', 'disengage'],
    ] as const)
      cite(out[field], source);
    for (const [field, source] of [
      ['staminaBonusPerEchelon', 'stamina'],
      ['speedBonus', 'speed'],
      ['stabilityBonus', 'stability'],
      ['meleeDamageBonus', 'meleeDamage'],
      ['rangedDamageBonus', 'rangedDamage'],
      ['meleeDistanceBonus', 'meleeDistance'],
      ['rangedDistanceBonus', 'rangedDistance'],
      ['disengageBonus', 'disengage'],
    ] as const)
      cite(out.kit?.[field], source);
  }

  private deriveSupportingBenefits(out: PartialBaseline) {
    if (!this.definitions.supportingChoicesVersion) return;
    const career = this.single('career.choice');
    const benefit = career ? CAREER_BENEFITS[career] : undefined;
    if (benefit) {
      const sourced = (quote: string, amount: number): Provenance => ({
        decisionId: 'career.choice',
        selection: career,
        source: this.sentence({ path: benefit.source, quote }),
        operation: 'add',
        amount,
      });
      if (out.renown?.value !== benefit.renown)
        out.renown = {
          value: benefit.renown,
          provenance: [
            {
              decisionId: 'career.choice',
              source: this.sentence(SENTENCES.renownBase),
              operation: 'base',
              amount: 0,
            },
            ...(benefit.renown ? [sourced(benefit.quotes.renown, benefit.renown)] : []),
          ],
        };
      if (out.wealth?.value !== 1 + benefit.wealth)
        out.wealth = {
          value: 1 + benefit.wealth,
          provenance: [
            {
              decisionId: 'career.choice',
              source: this.sentence(SENTENCES.wealthBase),
              operation: 'base',
              amount: 1,
            },
            ...(benefit.wealth ? [sourced(benefit.quotes.wealth, benefit.wealth)] : []),
          ],
        };
      if (benefit.projectPoints)
        out.projectPoints = {
          value: benefit.projectPoints,
          provenance: [sourced(benefit.quotes.projectPoints, benefit.projectPoints)],
        };
    }
    const complication = this.single('complication.choice');
    const effects = complication ? COMPLICATION_EFFECTS[complication] : undefined;
    if (!effects) return;
    const numericFields = ['staminaMaximum', 'recoveriesMaximum', 'speed', 'stability'] as const;
    const highest = out.characteristics
      ? Math.max(...Object.values(out.characteristics).map(value => value.value))
      : undefined;
    const amountOf = (value: unknown): number | undefined =>
      typeof value === 'number'
        ? value
        : value === '3 * echelon'
          ? 3 * Math.ceil(this.level / 3)
          : value === 'level'
            ? this.level
            : value === 'level - 1'
              ? this.level - 1
              : value === 'highest characteristic'
                ? highest
                : undefined;
    const provenance = (
      quote: string,
      amount: number,
      operation: 'add' | 'set' = 'add',
    ): Provenance => ({
      decisionId: 'complication.choice',
      selection: complication,
      source: this.sentence({ path: effects.source, quote }),
      operation,
      amount,
    });
    const selectedBenefit = this.single('complication.infernal-contract-but-like-bad.benefit');
    const benefitField = selectedBenefit?.split('+')[0];
    const selectedModifiers =
      selectedBenefit && benefitField
        ? [
            {
              field:
                benefitField === 'renown'
                  ? 'initialRenown'
                  : benefitField === 'wealth'
                    ? 'initialWealthBonus'
                    : 'staminaMaximum',
              operation: 'add',
              value: Number(selectedBenefit.split('+')[1]),
              quote: effects.fullText,
            },
          ]
        : [];
    for (const modifier of [...effects.permanentModifiers, ...selectedModifiers]) {
      const amount = amountOf(modifier.value);
      if (amount === undefined) continue;
      const entry = provenance(
        modifier.quote ?? effects.fullText,
        amount,
        ['set', 'cap', 'initialBaseline'].includes(modifier.operation) ? 'set' : 'add',
      );
      const field = numericFields.find(field => field === modifier.field);
      if (field && out[field])
        out[field] = {
          value: out[field]!.value + amount,
          provenance: [...out[field]!.provenance, entry],
        };
      if (modifier.field === 'initialRenown' && out.renown)
        out.renown = {
          value: out.renown.value + amount,
          provenance: [...out.renown.provenance, entry],
        };
      if (modifier.field === 'initialWealthBonus' && out.wealth)
        out.wealth = {
          value: out.wealth.value + amount,
          provenance: [...out.wealth.provenance, entry],
        };
      if (modifier.field === 'initialWealth') out.wealth = { value: amount, provenance: [entry] };
      if (modifier.field === 'renownMaximum')
        out.renownMaximum = { value: amount, provenance: [entry] };
      if (modifier.field.startsWith('immunity.') || modifier.field.startsWith('weakness.')) {
        const field = modifier.field.startsWith('immunity.')
          ? 'damageImmunities'
          : 'damageWeaknesses';
        const damageType = modifier.field.split('.')[1]!;
        const list = (out[field] ??= []);
        const existing = list.find(item => item.damageType === damageType);
        if (existing)
          existing.value = {
            value: Math.max(existing.value.value, amount),
            provenance: [...existing.value.provenance, entry],
          };
        else list.push({ damageType, value: { value: amount, provenance: [entry] } });
      }
    }
    if (out.renown && out.renownMaximum && out.renown.value > out.renownMaximum.value)
      out.renown = {
        value: out.renownMaximum.value,
        provenance: [...out.renown.provenance, ...out.renownMaximum.provenance],
      };
    if (out.staminaMaximum) {
      const changedStamina = [...effects.permanentModifiers, ...selectedModifiers].some(
        modifier => modifier.field === 'staminaMaximum',
      );
      if (changedStamina) {
        out.recoveryValue = {
          value: Math.floor(out.staminaMaximum.value / 3),
          provenance: [
            ...out.staminaMaximum.provenance,
            {
              decisionId: 'complication.choice',
              source: this.sentence(SENTENCES.recoveryValue),
              operation: 'floor-divide',
              amount: 3,
            },
          ],
        };
        out.windedValue = {
          value: Math.floor(out.staminaMaximum.value / 2),
          provenance: [
            ...out.staminaMaximum.provenance,
            {
              decisionId: 'complication.choice',
              source: this.sentence(SENTENCES.winded),
              operation: 'floor-divide',
              amount: 2,
            },
          ],
        };
      }
    }
    for (const modifier of effects.permanentModifiers)
      if (modifier.field === 'recoveryValue' && out.recoveryValue) {
        const amount = amountOf(modifier.value);
        if (amount !== undefined)
          out.recoveryValue = {
            value: out.recoveryValue.value + amount,
            provenance: [
              ...out.recoveryValue.provenance,
              provenance(modifier.quote ?? effects.fullText, amount),
            ],
          };
      }
  }

  private deriveSupportingChoices(out: PartialBaseline) {
    const complication = this.single('complication.choice');
    const effects = complication ? COMPLICATION_EFFECTS[complication] : undefined;
    const choices: NonNullable<DerivedBaseline['supportingChoices']> = [];
    for (const decision of this.order) {
      const value = this.valid.get(decision.id);
      if (!this.available.has(decision.id) || value === undefined) continue;
      const effect = effects?.selectionEffects.find(effect => effect.decision === decision.id);
      const configured =
        decision.selectionRole && !['skill', 'language'].includes(decision.selectionRole);
      if (!configured && !effect) continue;
      const values = (Array.isArray(value) ? value : [value]).filter(
        (value): value is string => typeof value === 'string',
      );
      if (!values.length) continue;
      choices.push({
        decisionId: decision.id,
        label: decision.label ?? decision.id,
        values,
        operation: effect
          ? `${effect.operation}${effect.value === undefined ? '' : `: ${effect.value}`}`
          : decision.selectionRole!,
        condition: effect?.condition ?? decision.note,
        sourcePath: decision.source,
        actor: decision.decisionActor,
      });
      if (effect?.operation === 'skill-bonus' && typeof effect.value === 'number')
        for (const skill of out.skills ?? [])
          if (values.includes(skill.name))
            skill.bonus = {
              value: effect.value,
              provenance: [
                {
                  decisionId: decision.id,
                  selection: skill.name,
                  source: this.own(decision),
                  operation: 'set',
                  amount: effect.value,
                },
              ],
            };
      if (effect?.operation === 'ability-cost' && typeof effect.value === 'number')
        for (const ability of out.abilities ?? [])
          if (values.includes(ability.name)) {
            (ability.costAdjustments ??= []).push({
              decisionId: decision.id,
              amount: effect.value,
              minimum: 1,
              sourcePath: decision.source,
            });
            if (ability.cost)
              ability.cost = {
                ...ability.cost,
                amount: Math.max(1, ability.cost.amount + effect.value),
              };
          }
      if (effect?.operation === 'item') {
        const state =
          complication === 'Artifact Bonded'
            ? 'absent'
            : complication === 'Shattered Legacy'
              ? 'broken'
              : 'possessed';
        for (const name of values)
          (out.initialItems ??= []).push({
            decisionId: decision.id,
            name,
            sourcePath:
              decision.optionSources?.[name] ??
              decision.options?.find(option => option.value === name)?.source ??
              decision.source,
            state,
            condition: effect.condition,
          });
      }
    }
    if (effects) {
      for (const modifier of effects.permanentModifiers)
        if (
          ![
            'staminaMaximum',
            'recoveriesMaximum',
            'speed',
            'stability',
            'recoveryValue',
            'initialWealth',
            'initialRenown',
            'renownMaximum',
          ].includes(modifier.field) &&
          !/^(immunity|weakness)\./.test(modifier.field)
        )
          choices.push({
            decisionId: 'complication.choice',
            label: modifier.field,
            values: [String(modifier.value)],
            operation: modifier.operation,
            sourcePath: effects.source,
            condition: modifier.quote,
          });
      if (complication === 'Strange Inheritance')
        (out.initialItems ??= []).push({
          decisionId: 'complication.strange-inheritance.secretTrinket',
          name: 'Secret second-echelon trinket',
          sourcePath: effects.source,
          state: 'pending-Director',
          condition:
            'The Director chooses privately; powers activate when level + Victories reaches 5.',
        });
    }
    if (choices.length) out.supportingChoices = choices;
  }

  /** Source of the granting rule remains distinct from the readable entry's source path. */
  private grantProvenance(decision: Decision, grant: OptionGrant): Provenance {
    return {
      decisionId: decision.id,
      ...(this.single(decision.id) ? { selection: this.single(decision.id) } : {}),
      source: this.own(decision),
      ...(grant.note ? { note: grant.note } : {}),
    };
  }

  /** Additional sourced class profiles share assignment, no-kit baselines and resource derivation. */
  private deriveProfiles(out: PartialBaseline) {
    applyClassProfile(this, out);
    const profile = this.definitions.classProfiles?.[this.single('class.choice') ?? ''];
    const dv = <T>(value: T, provenance: Provenance[]): DerivedValue<T> => ({ value, provenance });
    const sourced = (
      decisionId: string,
      source: string,
      quote: string,
      extra: Partial<Provenance> = {},
    ): Provenance => ({ decisionId, source: this.sentence({ path: source, quote }), ...extra });
    // Default ancestry statistics still apply when a supported class has no kit.
    const noKit = profile?.kit === 'none' && this.available.has(profile.baselineDecisionId);
    applyDevilNoKit(this, out, noKit);
    applyPolderBaseline(this, out, noKit);
    applyDwarfBaseline(this, out, noKit);
    applyHumanBaseline(this, out, noKit);
    applyHakaanBaseline(this, out, noKit);
    applyOrcBaseline(this, out, noKit);
    applyDragonKnightBaseline(this, out, noKit);
    applyHighElfBaseline(this, out, noKit);
    applyMemonekBaseline(this, out, noKit);
    applyTimeRaiderBaseline(this, out, noKit);
    applyWodeElfBaseline(this, out, noKit);
    applyRevenantBaseline(this, out, noKit);
    if (noKit)
      out.disengage = dv(1, [
        sourced('free-strikes.grant', SENTENCES.disengage.path, SENTENCES.disengage.quote, {
          operation: 'base',
          amount: 1,
        }),
      ]);
    applyPolderDisengage(this, out);
    applyHighElfDisengage(this, out);
    applyRevenantDisengage(this, out);
    if (this.available.has('career.mages-apprentice.renown')) {
      out.renown = dv(1, [
        sourced(
          'career.mages-apprentice.renown',
          SENTENCES.renownBase.path,
          SENTENCES.renownBase.quote,
          { operation: 'base', amount: 0 },
        ),
        sourced(
          'career.mages-apprentice.renown',
          'en/unified/md/career/mages-apprentice.md',
          'Renown: +1',
          { operation: 'add', amount: 1 },
        ),
      ]);
      out.wealth = dv(1, [
        sourced('career.choice', SENTENCES.wealthBase.path, SENTENCES.wealthBase.quote, {
          selection: "Mage's Apprentice",
          operation: 'base',
          amount: 1,
        }),
      ]);
    }
    applyElementalistModifiers(this, out);
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
      if (
        decision.selectionRole
          ? decision.selectionRole === 'skill'
          : /\.skills?(\.|$)|-skill$/.test(decision.id) || decision.replacesDuplicateSkill
      ) {
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
        const replacement = this.order.find(
          decision =>
            decision.replacesDuplicateSkill === skill.name && this.available.has(decision.id),
        );
        if (replacement) {
          (fixed.get(skill.name)!.additionalProvenance ??= []).push(skill.provenance);
          continue;
        }
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
    const removed = new Set(
      this.order
        .filter(
          decision =>
            decision.selectionRole === 'skill-removal' ||
            (decision.selectionRole === 'skill-conditional' &&
              decision.ownedPool &&
              !decision.ownedPool.exclude),
        )
        .flatMap(decision => this.list(decision.id) ?? [this.single(decision.id)]),
    );
    // Keep the fixture's stable presentation order; accounting above never depends on input order.
    return candidates
      .filter(({ skill, fixed: isFixed }) =>
        isFixed
          ? fixed.get(skill.name) === skill
          : !invalidChoices.has(skill.provenance.decisionId),
      )
      .map(candidate => candidate.skill)
      .filter(skill => !removed.has(skill.name));
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
    for (const decision of this.order) {
      if (!this.available.has(decision.id)) continue;
      for (const grant of this.grantsOf(decision.id))
        if (grant.kind === 'language')
          add(
            grant.value,
            {
              decisionId: decision.id,
              source:
                decision.id === 'culture.caelian'
                  ? this.sentence(SENTENCES.caelian)
                  : this.sentence({
                      path: grant.source ?? decision.source,
                      quote: grant.quote ?? decision.quote,
                    }),
            },
            true,
          );
      const isLanguage = decision.selectionRole
        ? decision.selectionRole === 'language'
        : decision.id === 'culture.language' || decision.id.endsWith('.languages');
      if (!isLanguage || decision.kind !== 'choice') continue;
      const value = this.valid.get(decision.id);
      for (const name of Array.isArray(value) ? value : [value])
        if (typeof name === 'string')
          add(
            name,
            {
              decisionId: decision.id,
              selection: name,
              source:
                decision.id === 'culture.language'
                  ? this.sentence(SENTENCES.cultureLanguage)
                  : this.own(decision),
            },
            false,
          );
    }
    const removed = new Set(
      this.order
        .filter(decision => decision.selectionRole === 'language-removal')
        .flatMap(decision => this.list(decision.id) ?? [this.single(decision.id)]),
    );
    return out.filter(language => !removed.has(language.name));
  }

  private traits(): GrantedFeature[] {
    const out: GrantedFeature[] = [];
    appendDevilTraits(this, out);
    for (const decision of this.order) {
      for (const grant of this.grantsOf(decision.id))
        if (grant.kind === 'ancestry-signature-trait')
          out.push({
            name: grant.value,
            kind: 'ancestry-signature-trait',
            sourcePath: grant.source ?? decision.source,
            provenance: this.grantProvenance(decision, grant),
          });
      if (
        !decision.id.endsWith('.purchased-traits') ||
        decision.id === 'ancestry.devil.purchased-traits'
      )
        continue;
      for (const name of this.list(decision.id) ?? []) {
        const option = decision.options?.find(option => option.value === name);
        if (option)
          out.push({
            name: option.value,
            kind: 'ancestry-purchased-trait',
            sourcePath: option.source ?? decision.source,
            cost: option.cost,
            provenance: {
              decisionId: decision.id,
              selection: option.value,
              source: this.own(decision),
            },
            ...(option.value === 'Graceful Retreat'
              ? { affects: ['disengage'] as const as ['disengage'] }
              : {}),
          });
      }
    }
    return out;
  }

  private features(): GrantedFeature[] {
    const out: GrantedFeature[] = [];
    const complication = this.single('complication.choice');
    if (complication && COMPLICATION_EFFECTS[complication])
      out.push({
        name: complication,
        kind: 'complication',
        sourcePath: COMPLICATION_EFFECTS[complication].source,
        provenance: {
          decisionId: 'complication.choice',
          selection: complication,
          source: this.own(this.decisions.get('complication.choice')!),
        },
      });
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
    const borrowed = this.decisions.get('complication.dragon-dreams.traits');
    if (borrowed && this.available.has(borrowed.id))
      for (const name of this.list(borrowed.id) ?? []) {
        const option = borrowed.options?.find(option => option.value === name);
        if (!option || !name) continue;
        out.push({
          name,
          kind: 'supporting-feature',
          sourcePath: option.source ?? borrowed.source,
          provenance: {
            decisionId: borrowed.id,
            selection: name,
            source: this.own(borrowed),
            note: 'Active only with 5 or more Victories.',
          },
        });
      }
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
    for (const decision of this.order)
      for (const grant of this.grantsOf(decision.id))
        if (
          grant.kind === 'class-feature' ||
          grant.kind === 'aspect-feature' ||
          grant.kind === 'career-benefit' ||
          grant.kind === 'complication' ||
          grant.kind === 'supporting-feature'
        )
          out.push({
            name: grant.value,
            kind: grant.kind,
            sourcePath: grant.source ?? decision.source,
            provenance: this.grantProvenance(decision, grant),
          });
    return out;
  }

  private perks(): GrantedFeature[] {
    return this.order
      .filter(decision => decision.id.endsWith('.perk'))
      .flatMap(decision => {
        const name = this.single(decision.id);
        if (!name) return [];
        return [
          {
            name,
            kind: 'perk' as const,
            sourcePath:
              decision.optionSources?.[name] ??
              decision.options?.find(option => option.value === name)?.source ??
              decision.source,
            provenance: this.provenance({
              decisionId: decision.id,
              selection: name,
              source: this.own(decision),
            }),
          },
        ];
      });
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
    for (const kit of [this.kit(), this.secondKit()]) {
      if (!kit) continue;
      const replacements = this.arsenal?.replacements[kit.name];
      out.push({
        name: kit.s.signatureAbility,
        kind: 'kit-signature',
        sourcePath: kit.s.entryPath,
        kitBonusesIncluded: true,
        ...(replacements?.length ? { kitBonusReplacements: replacements } : {}),
        provenance: this.provenance({
          decisionId: kit.decisionId,
          source: this.sentence(
            kit.decisionId === SECOND_KIT_DECISION ? FIELD_ARSENAL.twoKits : SENTENCES.kitSignature,
          ),
        }),
      });
    }
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
    for (const decision of this.order) {
      const values = this.list(decision.id) ?? [this.single(decision.id)];
      for (const name of values) {
        const option = decision.options?.find(option => option.value === name);
        if (!name || !option?.abilityKind) continue;
        const cost = parseCost(option.costQuote);
        out.push({
          name,
          kind: option.abilityKind,
          sourcePath: option.source ?? decision.source,
          ...(cost ? { cost } : {}),
          kitBonusesIncluded: false,
          provenance: { decisionId: decision.id, selection: name, source: this.own(decision) },
        });
      }
      const kinds: Record<string, GrantedAbility['kind']> = {
        'ancestry-ability': 'ancestry',
        'class-ability': 'class',
        'aspect-ability': 'aspect-triggered',
        'perk-ability': 'perk',
      };
      for (const grant of this.grantsOf(decision.id)) {
        const kind = kinds[grant.kind];
        if (kind)
          out.push({
            name: grant.value,
            kind,
            sourcePath: grant.source ?? decision.source,
            kitBonusesIncluded: false,
            provenance: this.grantProvenance(decision, grant),
          });
      }
    }
    for (const source of COMPLICATION_ABILITIES) {
      if (this.single(source.availability.decision) !== source.availability.value) continue;
      if (
        source.selectedTrait &&
        !this.list(source.selectedTrait.decision)?.includes(source.selectedTrait.value)
      )
        continue;
      out.push({
        name: source.name,
        kind: source.kind,
        sourcePath: source.sourcePath,
        kitBonusesIncluded: false,
        ...(source.condition ? { activationCondition: source.condition } : {}),
        provenance: {
          decisionId: source.selectedTrait?.decision ?? source.availability.decision,
          selection: source.selectedTrait?.value ?? source.availability.value,
          source: this.own(this.decisions.get(source.availability.decision)!),
        },
      });
    }
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
  const evaluation = new Evaluation(
    input.choiceOrigins ? { ...definitions, choiceOrigins: input.choiceOrigins } : definitions,
    input.selections,
    input.level,
  );
  const evaluatedAgainst = {
    definitionsSchemaVersion: DEFINITIONS_SCHEMA_VERSION as 'r01.1',
    compendiumRevision: definitions.compendiumRevision,
  };
  if (
    input.definitionsSchemaVersion !== definitions.schemaVersion ||
    input.compendiumRevision !== definitions.compendiumRevision ||
    !Object.is(input.level, definitions.level ?? 1)
  )
    evaluation.diagnose(
      'definitions',
      'invalid',
      'definition-mismatch',
      `The selections cite definitions ${input.definitionsSchemaVersion} at ${input.compendiumRevision} (level ${input.level}); this evaluator uses ${definitions.schemaVersion} at ${definitions.compendiumRevision} at level ${definitions.level ?? 1}`,
    );
  for (const diagnostic of characterSupportDiagnostics(input.level, input.selections))
    evaluation.diagnose(
      diagnostic.decisionId,
      'unsupported',
      'unsupported-option',
      diagnostic.message,
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
