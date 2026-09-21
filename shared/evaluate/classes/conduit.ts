// SPDX-License-Identifier: GPL-3.0-only
import type { DerivationContext } from '../derivation.ts';
import type { PartialBaseline, Provenance } from '../../contracts/characterEvaluation.ts';
import { SENTENCES } from '../sources.ts';
export function applyConduitModifiers(ctx: DerivationContext, out: PartialBaseline) {
  if (ctx.single('class.choice') !== 'Conduit') return;
  const source = (id: string, slug: string, quote: string, amount?: number): Provenance => ({
    decisionId: `class.conduit.${id}`,
    source: ctx.sentence({ path: `en/unified/md/feature/conduit/level-1/${slug}.md`, quote }),
    ...(amount === undefined ? {} : { operation: 'add', amount }),
  });
  const domains = ctx.list('class.conduit.domains');
  if (domains?.length === 2)
    out.subclass = {
      value: domains.join(' / '),
      provenance: [
        source('domains', 'deity-and-domains', 'The two domains you pick make up your subclass'),
      ],
    };
  const prayer = ctx.single('class.conduit.prayer');
  const add = (
    field: 'staminaMaximum' | 'stability' | 'speed' | 'disengage' | 'savingThrowThreshold',
    amount: number,
    p: Provenance,
  ) => {
    const v = out[field];
    if (v) out[field] = { value: v.value + amount, provenance: [...v.provenance, p] };
  };
  if (prayer === 'Prayer of Steel') {
    add(
      'staminaMaximum',
      6,
      source('prayer', 'prayer-of-steel', 'You gain a +6 bonus to Stamina', 6),
    );
    add(
      'stability',
      1,
      source('prayer', 'prayer-of-steel', 'Additionally, you gain a +1 bonus to stability.', 1),
    );
    if (out.staminaMaximum) {
      out.recoveryValue = {
        value: Math.floor(out.staminaMaximum.value / 3),
        provenance: [
          ...out.staminaMaximum.provenance,
          {
            decisionId: 'class.conduit.prayer',
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
            decisionId: 'class.conduit.prayer',
            source: ctx.sentence(SENTENCES.winded),
            operation: 'floor-divide',
            amount: 2,
          },
        ],
      };
    }
  }
  if (prayer === 'Prayer of Speed')
    for (const field of ['speed', 'disengage'] as const)
      add(
        field,
        1,
        source(
          'prayer',
          'prayer-of-speed',
          'You gain a +1 bonus to speed and to the distance you can shift when you take the Disengage move action.',
          1,
        ),
      );
  if (prayer === 'Prayer of Destruction')
    out.abilityModifiers = [
      ...(out.abilityModifiers ?? []),
      {
        id: 'conduit.prayer-of-destruction',
        label: prayer,
        field: 'rolled-damage',
        amount: 1,
        keywords: ['Magic'],
        provenance: source(
          'prayer',
          'prayer-of-destruction',
          'You gain a +1 bonus to rolled damage with magic abilities.',
          1,
        ),
      },
    ];
  if (ctx.single('class.conduit.ward') === 'Bastion Ward')
    add('savingThrowThreshold', -1, {
      ...source('ward', 'bastion-ward', 'You gain a +1 bonus to saving throws.', -1),
      note: '+1 on the saving roll is equivalent to lowering its success threshold by 1.',
    });
}
