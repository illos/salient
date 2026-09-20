// SPDX-License-Identifier: GPL-3.0-only
/** Hakaan creation choices from the pinned Heroes Compendium. */
import type { Decision } from '../../../evaluate/definitions.ts';
import { SENTENCES } from '../../../evaluate/sources.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';

const trait = (slug: string) => path(`feature/trait/hakaan/${slug}`);

export const levelOneDecisions: Decision[] = [
  auto(
    'ancestry.hakaan.base-statistics',
    'ancestry.choice',
    'Hakaan',
    SENTENCES.baseStatistics.path,
    SENTENCES.baseStatistics.quote,
  ),
  auto(
    'ancestry.hakaan.signature-trait',
    'ancestry.choice',
    'Hakaan',
    trait('big'),
    'Your size is 1L.',
    [grant('ancestry-signature-trait', 'Big!', trait('big'))],
  ),
  choice(
    'ancestry.hakaan.purchased-traits',
    'ancestry.choice',
    'Hakaan',
    trait('hakaan-traits'),
    'You have 3 ancestry points to spend on the following traits.',
    [
      option('All Is a Feather', trait('all-is-a-feather'), { cost: 1 }),
      option('Doomsight', trait('doomsight'), { cost: 2 }),
      option('Forceful', trait('forceful'), { cost: 1 }),
      option('Great Fortitude', trait('great-fortitude'), { cost: 2 }),
      option('Stand Tough', trait('stand-tough'), { cost: 1 }),
    ],
    { shape: { type: 'points', budget: 3, costField: 'cost' } },
  ),
];
