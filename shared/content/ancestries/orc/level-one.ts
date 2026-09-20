// SPDX-License-Identifier: GPL-3.0-only
/** Orc creation choices from the pinned Heroes Compendium. */
import type { Decision } from '../../../evaluate/definitions.ts';
import { SENTENCES } from '../../../evaluate/sources.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';

const trait = (slug: string) => path(`feature/trait/orc/${slug}`);

export const levelOneDecisions: Decision[] = [
  auto(
    'ancestry.orc.base-statistics',
    'ancestry.choice',
    'Orc',
    SENTENCES.baseStatistics.path,
    SENTENCES.baseStatistics.quote,
  ),
  auto(
    'ancestry.orc.signature-trait',
    'ancestry.choice',
    'Orc',
    trait('relentless'),
    'Whenever a creature deals damage to you that leaves you dying, you can make a free strike against any creature.',
    [grant('ancestry-signature-trait', 'Relentless', trait('relentless'))],
  ),
  choice(
    'ancestry.orc.purchased-traits',
    'ancestry.choice',
    'Orc',
    trait('orc-traits'),
    'You have 3 ancestry points to spend on the following traits.',
    [
      option('Bloodfire Rush', trait('bloodfire-rush'), { cost: 1 }),
      option('Glowing Recovery', trait('glowing-recovery'), { cost: 2 }),
      option('Grounded', trait('grounded'), { cost: 1 }),
      option('Nonstop', trait('nonstop'), { cost: 2 }),
      option('Passionate Artisan', trait('passionate-artisan'), { cost: 1 }),
    ],
    { shape: { type: 'points', budget: 3, costField: 'cost' } },
  ),
  choice(
    'ancestry.orc.passionate-artisan.skills',
    'ancestry.choice',
    'Orc',
    trait('passionate-artisan'),
    'When you gain your initial skills from your career, culture, class, or other source, choose two skills from the crafting skill group, whether you have those skills or not.',
    [
      'Alchemy',
      'Architecture',
      'Blacksmithing',
      'Carpentry',
      'Cooking',
      'Fletching',
      'Forgery',
      'Jewelry',
      'Mechanics',
      'Tailoring',
    ].map(name => option(name, path('skill/group/crafting'))),
    {
      label: 'Passionate Artisan crafting skills',
      shape: { type: 'multi', count: 2 },
      selectionRole: 'skill-target',
      conditions: [
        {
          decision: 'ancestry.orc.purchased-traits',
          value: 'Passionate Artisan',
          includes: true,
        },
      ],
      note: 'Gain +2 on crafting-project rolls using these skills; selecting them does not grant the skills or a bonus to ordinary tests.',
    },
  ),
];
