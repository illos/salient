// SPDX-License-Identifier: GPL-3.0-only
/** Complete level-one Polder choices; conditional gameplay effects remain manual. */
import type { Decision } from '../../../evaluate/definitions.ts';
import { SENTENCES } from '../../../evaluate/sources.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';

const trait = (slug: string) => path(`feature/trait/polder/${slug}`);

export const levelOneDecisions: Decision[] = [
  auto(
    'ancestry.polder.base-statistics',
    'ancestry.choice',
    'Polder',
    SENTENCES.baseStatistics.path,
    SENTENCES.baseStatistics.quote,
  ),
  auto(
    'ancestry.polder.signature-trait',
    'ancestry.choice',
    'Polder',
    trait('polder-traits'),
    'Polder heroes have access to the following traits.',
    [
      grant('ancestry-signature-trait', 'Shadowmeld', path('feature/ability/polder/shadowmeld')),
      grant('ancestry-signature-trait', 'Small!', trait('small')),
      grant('ancestry-ability', 'Shadowmeld', path('feature/ability/polder/shadowmeld')),
    ],
  ),
  choice(
    'ancestry.polder.purchased-traits',
    'ancestry.choice',
    'Polder',
    trait('polder-traits'),
    'You have 4 ancestry points to spend on the following traits.',
    [
      option('Corruption Immunity', trait('corruption-immunity'), { cost: 1 }),
      option('Fearless', trait('fearless'), { cost: 2 }),
      option('Graceful Retreat', trait('graceful-retreat'), { cost: 1 }),
      option('Nimblestep', trait('nimblestep'), { cost: 2 }),
      option('Polder Geist', trait('polder-geist'), { cost: 1 }),
      option('Reactive Tumble', trait('reactive-tumble'), { cost: 1 }),
    ],
    { shape: { type: 'points', budget: 4, costField: 'cost' } },
  ),
];
