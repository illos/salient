// SPDX-License-Identifier: GPL-3.0-only
/** V45 extraction: preserve existing source contributions and their phase/order. */
import type { DerivationContext, SelectedKit } from '../derivation.ts';
import type {
  DerivedValue,
  Provenance,
  PartialBaseline,
} from '../../contracts/characterEvaluation.ts';
import { SENTENCES } from '../sources.ts';
import type { Characteristic } from '../../contracts/rollResolution.ts';
import type { SourceSentence } from '../../contracts/characterEvaluation.ts';
import { KIT_BONUSES_HEADING } from '../sources.ts';
type Sentence = Omit<SourceSentence, 'revision'>;

export function applyFurySubclass(ctx: DerivationContext, out: PartialBaseline) {
  const p = (entry: Provenance) => ctx.provenance(entry);
  const dv = <T>(value: T, provenance: Provenance[]): DerivedValue<T> => ({ value, provenance });
  const aspect = ctx.single('class.fury.aspect');
  if (aspect)
    out.subclass = dv(aspect, [
      p({
        decisionId: 'class.fury.aspect',
        selection: aspect,
        source: ctx.sentence(SENTENCES.subclass),
      }),
    ]);
}
export function applyFuryCharacteristics(ctx: DerivationContext, out: PartialBaseline) {
  const p = (entry: Provenance) => ctx.provenance(entry);
  const dv = <T>(value: T, provenance: Provenance[]): DerivedValue<T> => ({ value, provenance });
  // 1.1 Characteristics.
  const fixed = ctx.available.has('class.fury.fixed-characteristics');
  const array = ctx.single('class.fury.characteristic-array');
  const assignment = ctx.valid.get('class.fury.array-assignment');
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
        source: ctx.sentence(SENTENCES.fixedCharacteristics),
        operation: 'set',
        amount: 2,
      });
    const assigned = (target: string): DerivedValue<number> =>
      dv(assignment[target]!, [
        p({
          decisionId: 'class.fury.characteristic-array',
          selection: array,
          source: ctx.sentence(SENTENCES.characteristicArray),
        }),
        p({
          decisionId: 'class.fury.array-assignment',
          selection: `${target} ${assignment[target]}`,
          source: ctx.sentence(SENTENCES.characteristicArray),
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
}
export function applyFuryVitals(
  ctx: DerivationContext,
  out: PartialBaseline,
  kit: SelectedKit | undefined,
  echelon: number,
) {
  const p = (entry: Provenance) => ctx.provenance(entry);
  const dv = <T>(value: T, provenance: Provenance[]): DerivedValue<T> => ({ value, provenance });
  // 1.3 Stamina maximum = class starting Stamina + kit Stamina bonus × echelon.
  if (ctx.available.has('class.fury.baseline') && kit) {
    const s = kit.s;
    const applied = s.staminaBonusPerEchelon.amount * echelon;
    out.staminaMaximum = dv(21 + applied, [
      p({
        decisionId: 'class.fury.baseline',
        source: ctx.sentence(SENTENCES.startingStamina),
        operation: 'base',
        amount: 21,
      }),
      p({
        decisionId: kit.decisionId,
        source: ctx.sentence({
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
  // V32 progression is an explicit sourced contribution, never a live-state refill.
  const levelTwoStamina = ctx.decisions.get('class.fury.level-2.stamina');
  if (out.staminaMaximum && levelTwoStamina && ctx.available.has(levelTwoStamina.id)) {
    out.staminaMaximum.value += 9;
    out.staminaMaximum.provenance.push(
      p({
        decisionId: levelTwoStamina.id,
        source: ctx.own(levelTwoStamina, 'Basics'),
        operation: 'add',
        amount: 9,
      }),
    );
  }
  // 1.4 Recoveries and recovery value.
  if (ctx.available.has('class.fury.baseline'))
    out.recoveriesMaximum = dv(10, [
      p({
        decisionId: 'class.fury.baseline',
        source: ctx.sentence(SENTENCES.recoveries),
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
        source: ctx.sentence(SENTENCES.recoveryValue),
        operation: 'floor-divide',
        amount: 3,
        note: `floor(${stamina} / 3)`,
      }),
    ]);
    // 1.5 Winded value (restated from R04 6.3).
    out.windedValue = dv(Math.floor(stamina / 2), [
      p({
        decisionId: 'class.fury.baseline',
        source: ctx.sentence(SENTENCES.winded),
        operation: 'floor-divide',
        amount: 2,
        note: `floor(${stamina} / 2); R04 section 6.3`,
      }),
    ]);
  }
}
export function applyFuryResource(ctx: DerivationContext, out: PartialBaseline) {
  const p = (entry: Provenance) => ctx.provenance(entry);
  const dv = <T>(value: T, provenance: Provenance[]): DerivedValue<T> => ({ value, provenance });
  const might = out.characteristics?.M.value;
  // 1.10 Potencies from the class-named characteristic.
  if (ctx.available.has('class.fury.baseline')) {
    out.potencyCharacteristic = dv('M' as Characteristic, [
      p({
        decisionId: 'class.fury.baseline',
        source: ctx.sentence(SENTENCES.potencyStrong),
        note: 'class-named characteristic; the specific Fury formula applies (Potencies and Game of Exceptions).',
      }),
    ]);
    if (might !== undefined) {
      const potency = (sentence: Sentence, amount: number, note: string): DerivedValue<number> =>
        dv(amount, [
          p({
            decisionId: 'class.fury.baseline',
            source: ctx.sentence(sentence),
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
        p({ decisionId: 'class.fury.features', source: ctx.sentence(SENTENCES.ferocityName) }),
      ]),
      startingValue: dv(0, [
        p({
          decisionId: 'class.fury.features',
          source: ctx.sentence(SENTENCES.ferocityOutsideCombat),
          operation: 'set',
          amount: 0,
          note: 'Interpretation: a newly created hero has not been in combat and cannot have gained ferocity; see also "You lose any remaining ferocity at the end of the encounter." R03 owns live initialization.',
        }),
      ]),
    };
  }
}
