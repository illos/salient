// SPDX-License-Identifier: GPL-3.0-only
/** App labels for actions embedded in the complete pinned source; effects remain manual. */
import abilitySources from '../../compendium/ability.json' with { type: 'json' };
import featureSources from '../../compendium/feature.json' with { type: 'json' };

function source(path: string) {
  const row = [...abilitySources, ...featureSources].find(
    entry => entry.sourcePath === `vendor/steel-compendium/${path}`,
  );
  if (!row) throw new Error(`Missing Tactician action source: ${path}`);
  return row.text;
}
const mark = 'en/unified/md/feature/ability/tactician/level-1/mark.md';
const studied = 'en/unified/md/feature/tactician/level-1/studied-commander.md';
export const TACTICIAN_ACTIONS = [
  {
    name: 'Mark: Trigger',
    parent: 'Mark',
    sourcePath: mark,
    actionType: 'Free triggered action',
    cost: '1 Focus',
    trigger: 'You or an ally uses an ability to deal rolled damage to a creature marked by you.',
    activationCondition:
      'The source trigger must occur. Choose exactly one printed benefit per trigger; resolve the chosen benefit manually. This records use and pays Focus, not mark state or the benefit.',
    text: source(mark),
  },
  {
    name: 'Mark: Retarget',
    parent: 'Mark',
    sourcePath: mark,
    actionType: 'Free triggered action',
    trigger: 'A creature marked by you is reduced to 0 Stamina.',
    activationCondition:
      'The source trigger must occur; mark a new target within 10 squares manually. This records use, not mark state.',
    text: source(mark),
  },
  {
    name: 'Studied Commander: Prepare',
    parent: 'Studied Commander',
    sourcePath: studied,
    actionType: 'Respite activity',
    activationCondition:
      'At least 24 hours before a combat encounter or negotiation, with one or more clues or rumors. Once per encounter or negotiation. Make the Reason test and resolve the printed outcome manually; this records the activity, not completion of a respite.',
    text: source(studied),
  },
];
