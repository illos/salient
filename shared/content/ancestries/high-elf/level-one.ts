// SPDX-License-Identifier: GPL-3.0-only
import type { Decision } from '../../../evaluate/definitions.ts';
import { SENTENCES } from '../../../evaluate/sources.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';

const trait = (slug: string) => path(`feature/trait/high-elf/${slug}`);
export const levelOneDecisions: Decision[] = [
  auto(
    'ancestry.high-elf.base-statistics',
    'ancestry.choice',
    'High Elf',
    SENTENCES.baseStatistics.path,
    SENTENCES.baseStatistics.quote,
  ),
  auto(
    'ancestry.high-elf.signature-trait',
    'ancestry.choice',
    'High Elf',
    trait('high-elf-glamor'),
    'A magic glamor makes others perceive you as interesting and engaging, granting you an edge on Presence tests using the Flirt or Persuade skills. This glamor makes you appear and sound slightly different to each creature you meet, since what is engaging to one might be different for another. However, you never appear to be anyone other than yourself.',
    [grant('ancestry-signature-trait', 'High Elf Glamor', trait('high-elf-glamor'))],
  ),
  choice(
    'ancestry.high-elf.purchased-traits',
    'ancestry.choice',
    'High Elf',
    trait('high-elf-traits'),
    'You have 3 ancestry points to spend on the following traits.',
    [
      option('Glamor of Terror', trait('glamor-of-terror'), { cost: 2 }),
      option('Graceful Retreat', trait('graceful-retreat'), { cost: 1 }),
      option('High Senses', trait('high-senses'), { cost: 1 }),
      option('Otherworldly Grace', trait('otherworldly-grace'), { cost: 2 }),
      option('Revisit Memory', trait('revisit-memory'), { cost: 1 }),
      option('Unstoppable Mind', trait('unstoppable-mind'), { cost: 2 }),
    ],
    { shape: { type: 'points', budget: 3, costField: 'cost' } },
  ),
];
