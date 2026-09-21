// SPDX-License-Identifier: GPL-3.0-only
/** V101: Beast Shape grants these features only from the selected Stormwight kit. */
import { auto, grant, path } from '../../decision-builders.ts';
import type { Decision } from '../../../evaluate/definitions.ts';

export const stormwightDecisions: Decision[] = [
  auto(
    'class.fury.action-options',
    'class.choice',
    'Fury',
    path('feature/fury/level-1/ferocity'),
    'you can use your heroic abilities and effects that cost ferocity without spending it.',
  ),
  auto(
    'class.fury.stormwight.aspect-of-the-wild',
    'class.fury.aspect',
    'Stormwight',
    path('feature/fury/stormwight-kits/aspect-of-the-wild'),
    'You have the following ability.',
    [
      grant(
        'class-ability',
        'Aspect of the Wild',
        path('feature/ability/fury/stormwight-kits/aspect-of-the-wild'),
      ),
    ],
  ),
];

// The evaluator validates choices in step order: kit-dependent grants follow kit.choice.
export const stormwightKitDecisions: Decision[] = [
  ...[
    ['Boren', 'Bear', 'Blizzard'],
    ['Corven', 'Crow', 'Anabatic Wind'],
    ['Raden', 'Rat', 'Rat Flood'],
    ['Vuken', 'Wolf', 'Lightning Storm'],
  ].map(([kit, animal, storm]) => {
    const slug = kit!.toLowerCase();
    const base = `feature/fury/${slug}`;
    return {
      ...auto(
        `class.fury.stormwight.${slug}`,
        'kit.choice',
        kit!,
        path('feature/fury/stormwight-kits/aspect-benefits-and-animal-form'),
        'Your primordial aspect benefits are always available to you, and you gain additional benefits while in the animal or hybrid form granted by your stormwight kit.',
        [
          grant('class-feature', `${kit}: Aspect Benefits`, path(`${base}/aspect-benefits`)),
          grant('class-feature', `${kit}: Growing Ferocity`, path(`${base}/growing-ferocity`)),
          grant(
            'class-feature',
            `Animal Form: ${animal}`,
            path(`${base}/animal-form-${animal!.toLowerCase()}`),
          ),
          grant(
            'class-feature',
            `Hybrid Form: ${animal}`,
            path(`${base}/hybrid-form-${animal!.toLowerCase()}`),
          ),
          grant(
            'class-feature',
            `Primordial Storm: ${storm}`,
            path(`${base}/primordial-storm-${storm!.toLowerCase().replaceAll(' ', '-')}`),
          ),
        ],
      ),
      dependsOn: ['kit.choice'],
      conditions: [{ decision: 'class.fury.aspect', value: 'Stormwight' }],
    };
  }),
];
