// SPDX-License-Identifier: GPL-3.0-only
/** Human creation choices from the pinned Heroes Compendium. */
import type { Decision } from '../../../evaluate/definitions.ts';
import { SENTENCES } from '../../../evaluate/sources.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';

const trait = (slug: string) => path(`feature/trait/human/${slug}`);
export const levelOneDecisions: Decision[] = [
  auto(
    'ancestry.human.base-statistics',
    'ancestry.choice',
    'Human',
    SENTENCES.baseStatistics.path,
    SENTENCES.baseStatistics.quote,
  ),
  auto(
    'ancestry.human.signature-trait',
    'ancestry.choice',
    'Human',
    trait('detect-the-supernatural'),
    'As a maneuver, you can open your awareness to detect supernatural creatures and phenomena.',
    [
      grant(
        'ancestry-signature-trait',
        'Detect the Supernatural',
        trait('detect-the-supernatural'),
      ),
    ],
  ),
  choice(
    'ancestry.human.purchased-traits',
    'ancestry.choice',
    'Human',
    trait('human-traits'),
    'You have 3 ancestry points to spend on the following traits.',
    [
      option("Can't Take Hold", trait('cant-take-hold'), { cost: 1 }),
      option('Determination', trait('determination'), { cost: 2 }),
      option('Perseverance', trait('perseverance'), { cost: 1 }),
      option('Resist the Unnatural', trait('resist-the-unnatural'), { cost: 1 }),
      option('Staying Power', trait('staying-power'), { cost: 2 }),
    ],
    { shape: { type: 'points', budget: 3, costField: 'cost' } },
  ),
];
