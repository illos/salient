// SPDX-License-Identifier: GPL-3.0-only
/** Maintained source selection and verified external identities; never inferred from display names. */
export const BATCHES = [
  {
    root: 'monster/undead/1st-echelon/',
    monsters: [
      'crawling-claw',
      'decrepit-skeleton',
      'ghost',
      'ghoul',
      'rotting-zombie',
      'shade',
      'skeleton',
      'soulwight',
      'specter',
      'umbral-stalker',
      'zombie',
    ],
    malice: 'undead-malice-level-1-malice-features',
    counterpart: 'undead-malice',
    priorMalice: [],
  },
  {
    root: 'monster/undead/2nd-echelon/',
    monsters: [
      'flesh-mournling',
      'fleshflayed-shambler-zombie',
      'ghoul-craver',
      'giant-zombie',
      'hollowbone-launcher',
      'mummy-lord',
      'mummy',
      'vampire-spawn',
      'wraith',
    ],
    malice: 'undead-malice-level-4-malice-features',
    counterpart: 'undead-malice-4',
    priorMalice: ['monster/undead/1st-echelon/undead-malice-level-1-malice-features'],
  },
];
export const SELECTION = BATCHES.flatMap(batch => [
  ...batch.monsters.map(slug => ({
    path: `${batch.root}statblock/${slug}`,
    counterpart: slug,
    externalPath: `data/monsters/${slug}.json`,
    supportingPaths: [`${batch.root}${batch.malice}`],
  })),
  {
    path: `${batch.root}${batch.malice}`,
    counterpart: batch.counterpart,
    externalPath: `data/malice/${batch.counterpart}.json`,
    supportingPaths: batch.priorMalice,
  },
]);
export const PATHS = SELECTION.map(entry => entry.path);
export const COMPARISON_REPORT = 'docs/build/evidence/V30-steel-cauldron.json';
