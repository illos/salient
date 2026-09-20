// SPDX-License-Identifier: GPL-3.0-only
import type { Decision } from '../../../evaluate/definitions.ts';
import { SENTENCES } from '../../../evaluate/sources.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
const trait = (slug: string) => path(`feature/trait/time-raider/${slug}`);
const ability = (slug: string) => path(`feature/ability/time-raider/${slug}`);
export const levelOneDecisions: Decision[] = [
  auto(
    'ancestry.time-raider.base-statistics',
    'ancestry.choice',
    'Time Raider',
    SENTENCES.baseStatistics.path,
    SENTENCES.baseStatistics.quote,
  ),
  auto(
    'ancestry.time-raider.signature-trait',
    'ancestry.choice',
    'Time Raider',
    trait('psychic-scar'),
    'You have psychic immunity equal to your level.',
    [grant('ancestry-signature-trait', 'Psychic Scar', trait('psychic-scar'))],
  ),
  choice(
    'ancestry.time-raider.purchased-traits',
    'ancestry.choice',
    'Time Raider',
    trait('time-raider-traits'),
    'You have 3 ancestry points to spend on the following traits.',
    [
      option('Beyondsight', trait('beyondsight'), { cost: 1 }),
      option('Foresight', trait('foresight'), { cost: 1 }),
      option('Four-Armed Athletics', trait('four-armed-athletics'), { cost: 1 }),
      option('Four-Armed Martial Arts', trait('four-armed-martial-arts'), { cost: 2 }),
      option('Psionic Gift', trait('psionic-gift'), { cost: 2 }),
      option('Unstoppable Mind', trait('time-raider-traits'), { cost: 2 }),
    ],
    { shape: { type: 'points', budget: 3, costField: 'cost' } },
  ),
  choice(
    'ancestry.time-raider.psionic-gift.ability',
    'ancestry.choice',
    'Time Raider',
    trait('psionic-gift'),
    'Choose one signature ability from the following options.',
    [
      option('Concussive Slam', ability('concussive-slam'), {
        grants: [grant('ancestry-ability', 'Concussive Slam', ability('concussive-slam'))],
      }),
      option('Minor Acceleration', ability('minor-acceleration'), {
        grants: [grant('ancestry-ability', 'Minor Acceleration', ability('minor-acceleration'))],
      }),
      option('Psionic Bolt', ability('psionic-bolt'), {
        grants: [grant('ancestry-ability', 'Psionic Bolt', ability('psionic-bolt'))],
      }),
    ],
    {
      label: 'Psionic Gift ability',
      conditions: [
        {
          decision: 'ancestry.time-raider.purchased-traits',
          value: 'Psionic Gift',
          includes: true,
        },
      ],
    },
  ),
];
