// SPDX-License-Identifier: GPL-3.0-only
import type { Decision } from '../../../evaluate/definitions.ts';
import { SENTENCES } from '../../../evaluate/sources.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
const trait = (slug: string) => path(`feature/trait/memonek/${slug}`);
export const levelOneDecisions: Decision[] = [
  auto(
    'ancestry.memonek.base-statistics',
    'ancestry.choice',
    'Memonek',
    SENTENCES.baseStatistics.path,
    SENTENCES.baseStatistics.quote,
  ),
  auto(
    'ancestry.memonek.signature-trait',
    'ancestry.choice',
    'Memonek',
    trait('fall-lightly'),
    'Whenever you fall, you reduce the distance of the fall by 2 squares.',
    [
      grant('ancestry-signature-trait', 'Fall Lightly', trait('fall-lightly')),
      grant('ancestry-signature-trait', 'Lightweight', trait('lightweight')),
    ],
  ),
  choice(
    'ancestry.memonek.purchased-traits',
    'ancestry.choice',
    'Memonek',
    trait('memonek-traits'),
    'You have 4 ancestry points to spend on the following traits.',
    [
      option('I Am Law', trait('i-am-law'), { cost: 1 }),
      option('Keeper of Order', trait('keeper-of-order'), { cost: 2 }),
      option('Lightning Nimbleness', trait('lightning-nimbleness'), { cost: 2 }),
      option('Nonstop', trait('nonstop'), { cost: 2 }),
      option('Systematic Mind', trait('systematic-mind'), { cost: 1 }),
      option('Unphased', trait('unphased'), { cost: 1 }),
      option('Useful Emotion', trait('useful-emotion'), { cost: 1 }),
    ],
    { shape: { type: 'points', budget: 4, costField: 'cost' } },
  ),
];
