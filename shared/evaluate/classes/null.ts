// SPDX-License-Identifier: GPL-3.0-only
import type { DerivationContext } from '../derivation.ts';
import type { PartialBaseline, Provenance } from '../../contracts/characterEvaluation.ts';
import { SENTENCES } from '../sources.ts';
export function applyNullModifiers(ctx: DerivationContext, out: PartialBaseline) {
  if (ctx.single('class.choice') !== 'Null') return;
  const source = (id: string, slug: string, quote: string, amount?: number): Provenance => ({
    decisionId: `class.null.${id}`,
    source: ctx.sentence({ path: `en/unified/md/feature/null/level-1/${slug}.md`, quote }),
    ...(amount === undefined ? {} : { operation: 'add', amount }),
  });
  const augmentation = ctx.single('class.null.augmentation');
  const add = (
    field: 'staminaMaximum' | 'stability' | 'speed' | 'disengage' | 'savingThrowThreshold',
    amount: number,
    p: Provenance,
  ) => {
    const v = out[field];
    if (v) out[field] = { value: v.value + amount, provenance: [...v.provenance, p] };
  };
  if (augmentation === 'Density Augmentation') {
    add(
      'staminaMaximum',
      6,
      source('augmentation', 'density-augmentation', 'You gain a +6 bonus to Stamina', 6),
    );
    add(
      'stability',
      1,
      source(
        'augmentation',
        'density-augmentation',
        'Additionally, you gain a +1 bonus to stability.',
        1,
      ),
    );
    if (out.staminaMaximum) {
      out.recoveryValue = {
        value: Math.floor(out.staminaMaximum.value / 3),
        provenance: [
          ...out.staminaMaximum.provenance,
          {
            decisionId: 'class.null.augmentation',
            source: ctx.sentence(SENTENCES.recoveryValue),
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
            decisionId: 'class.null.augmentation',
            source: ctx.sentence(SENTENCES.winded),
            operation: 'floor-divide',
            amount: 2,
          },
        ],
      };
    }
  }
  if (augmentation === 'Speed Augmentation')
    for (const field of ['speed', 'disengage'] as const)
      add(
        field,
        1,
        source(
          'augmentation',
          'speed-augmentation',
          'You gain a +1 bonus to speed and to the distance you can shift when you take the Disengage move action.',
          1,
        ),
      );
  if (augmentation === 'Force Augmentation')
    out.abilityModifiers = [
      ...(out.abilityModifiers ?? []),
      {
        id: 'null.force-augmentation',
        label: augmentation,
        field: 'rolled-damage',
        amount: 1,
        keywords: ['Psionic'],
        provenance: source(
          'augmentation',
          'force-augmentation',
          'Your damage-dealing psionic abilities gain a +1 bonus to rolled damage.',
          1,
        ),
      },
    ];
  const agility = out.characteristics?.A?.value;
  if (agility !== undefined)
    for (const field of ['speed', 'disengage'] as const)
      add(
        field,
        agility,
        source('features', 'null-speed', 'equal to your Agility score.', agility),
      );
}
