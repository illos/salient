// SPDX-License-Identifier: GPL-3.0-only
/** Dwarf creation choices from the pinned Heroes Compendium. */
import type { Decision } from '../../../evaluate/definitions.ts';
import { SENTENCES } from '../../../evaluate/sources.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';

const trait = (slug: string) => path(`feature/trait/dwarf/${slug}`);

export const levelOneDecisions: Decision[] = [
  auto(
    'ancestry.dwarf.base-statistics',
    'ancestry.choice',
    'Dwarf',
    SENTENCES.baseStatistics.path,
    SENTENCES.baseStatistics.quote,
  ),
  auto(
    'ancestry.dwarf.signature-trait',
    'ancestry.choice',
    'Dwarf',
    trait('runic-carving'),
    'You can have one rune active at a time, and can change or remove a rune with 10 uninterrupted minutes of work.',
    [grant('ancestry-signature-trait', 'Runic Carving', trait('runic-carving'))],
  ),
  choice(
    'ancestry.dwarf.purchased-traits',
    'ancestry.choice',
    'Dwarf',
    trait('dwarf-traits'),
    'You have 3 ancestry points to spend on the following traits.',
    [
      option('Great Fortitude', trait('great-fortitude'), { cost: 2 }),
      option('Grounded', trait('grounded'), { cost: 1 }),
      option('Spark Off Your Skin', trait('spark-off-your-skin'), { cost: 2 }),
      option('Stand Tough', trait('stand-tough'), { cost: 1 }),
      option('Stone Singer', trait('stone-singer'), { cost: 1 }),
    ],
    { shape: { type: 'points', budget: 3, costField: 'cost' } },
  ),
];
