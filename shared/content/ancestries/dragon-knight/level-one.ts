// SPDX-License-Identifier: GPL-3.0-only
import type { Decision } from '../../../evaluate/definitions.ts';
import { SENTENCES } from '../../../evaluate/sources.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';

const trait = (slug: string) => path(`feature/trait/dragon-knight/${slug}`);
export const levelOneDecisions: Decision[] = [
  auto(
    'ancestry.dragon-knight.base-statistics',
    'ancestry.choice',
    'Dragon Knight',
    SENTENCES.baseStatistics.path,
    SENTENCES.baseStatistics.quote,
  ),
  auto(
    'ancestry.dragon-knight.signature-trait',
    'ancestry.choice',
    'Dragon Knight',
    trait('wyrmplate'),
    'Your hardened scales grant you damage immunity equal to your level to one of the following damage types: acid, cold, corruption, fire, lightning, or poison. You can change your damage immunity type when you finish a respite.',
    [grant('ancestry-signature-trait', 'Wyrmplate', trait('wyrmplate'))],
  ),
  choice(
    'ancestry.dragon-knight.purchased-traits',
    'ancestry.choice',
    'Dragon Knight',
    trait('dragon-knight-traits'),
    'You have 3 ancestry points to spend on the following traits.',
    [
      option('Draconian Guard', trait('draconian-guard'), { cost: 1 }),
      option('Draconian Pride', trait('draconian-pride'), {
        cost: 2,
        grants: [
          grant(
            'ancestry-ability',
            'Draconian Pride',
            path('feature/ability/dragon-knight/draconian-pride'),
          ),
        ],
      }),
      option('Dragon Breath', trait('dragon-breath'), {
        cost: 2,
        grants: [
          grant(
            'ancestry-ability',
            'Dragon Breath',
            path('feature/ability/dragon-knight/dragon-breath'),
          ),
        ],
      }),
      option('Prismatic Scales', trait('prismatic-scales'), { cost: 1 }),
      option('Remember Your Oath', trait('remember-your-oath'), { cost: 1 }),
      option('Wings', trait('wings'), { cost: 2 }),
    ],
    { shape: { type: 'points', budget: 3, costField: 'cost' } },
  ),
  choice(
    'ancestry.dragon-knight.wyrmplate-immunity',
    'ancestry.choice',
    'Dragon Knight',
    trait('wyrmplate'),
    'Your hardened scales grant you damage immunity equal to your level to one of the following damage types: acid, cold, corruption, fire, lightning, or poison. You can change your damage immunity type when you finish a respite.',
    ['acid', 'cold', 'corruption', 'fire', 'lightning', 'poison'].map(type =>
      option(type, trait('wyrmplate')),
    ),
    { label: 'Initial Wyrmplate immunity' },
  ),
  choice(
    'ancestry.dragon-knight.prismatic-scales-immunity',
    'ancestry.choice',
    'Dragon Knight',
    trait('prismatic-scales'),
    'Select one damage immunity granted by your Wyrmplate trait. You always have this immunity, in addition to the immunity granted by Wyrmplate.',
    ['acid', 'cold', 'corruption', 'fire', 'lightning', 'poison'].map(type =>
      option(type, trait('prismatic-scales')),
    ),
    {
      label: 'Permanent Prismatic Scales immunity',
      conditions: [
        {
          decision: 'ancestry.dragon-knight.purchased-traits',
          value: 'Prismatic Scales',
          includes: true,
        },
      ],
    },
  ),
];
