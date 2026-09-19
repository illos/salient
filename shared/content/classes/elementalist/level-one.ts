// SPDX-License-Identifier: GPL-3.0-only
/** Existing V25 level-one Elementalist content. */
import type { ClassProfile, Decision, DecisionDefinitions } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';

const elementalist = path('class/elementalist');
const feature = (slug: string) => path(`feature/elementalist/level-1/${slug}`);
const ability = (slug: string) => path(`feature/ability/elementalist/level-1/${slug}`);
const characteristicsQuote =
  'You start with a Reason of 2, and you can choose one of the following arrays for your other characteristic scores:';

export const classProfile: ClassProfile = {
  fixedCharacteristics: { Reason: 2 },
  assignmentDecisionId: 'class.elementalist.array-assignment',
  arrayDecisionId: 'class.elementalist.characteristic-array',
  fixedDecisionId: 'class.elementalist.fixed-characteristics',
  baselineDecisionId: 'class.elementalist.baseline',
  subclassDecisionId: 'class.elementalist.specialization',
  source: elementalist,
  characteristicsQuote,
  startingStamina: 18,
  recoveries: 8,
  potencyCharacteristic: 'R',
  resource: 'essence',
  resourceSource: feature('essence'),
  resourceQuote:
    'You channel the substance of creation in the form of a Heroic Resource called essence, gathering and burning it to cast and maintain spells.',
  resourceOutsideCombatQuote:
    "Though you can't gain essence outside of combat, you can use your heroic abilities and effects that cost essence without spending it.",
  kit: 'none',
};

export function getLevelOneDecisions(pools: DecisionDefinitions['pools']): Decision[] {
  return [
    auto(
      'class.elementalist.fixed-characteristics',
      'class.choice',
      'Elementalist',
      elementalist,
      'You start with a Reason of 2',
      [grant('characteristic', 'Reason 2', elementalist)],
    ),
    choice(
      'class.elementalist.characteristic-array',
      'class.choice',
      'Elementalist',
      elementalist,
      characteristicsQuote,
      ['2, 2, −1, −1', '2, 1, 1, −1', '2, 1, 0, 0', '1, 1, 1, 0'].map(value =>
        option(value, elementalist),
      ),
    ),
    {
      id: 'class.elementalist.array-assignment',
      kind: 'choice',
      shape: { type: 'assignment', targets: ['Might', 'Agility', 'Intuition', 'Presence'] },
      dependsOn: ['class.elementalist.characteristic-array'],
      source: elementalist,
      quote: characteristicsQuote,
    },
    auto(
      'class.elementalist.baseline',
      'class.choice',
      'Elementalist',
      elementalist,
      'Starting Stamina at 1st Level: 18',
    ),
    auto(
      'class.elementalist.skill.magic',
      'class.choice',
      'Elementalist',
      elementalist,
      'You gain the Magic skill',
      [grant('skill', 'Magic', elementalist)],
    ),
    choice(
      'class.elementalist.skills',
      'class.choice',
      'Elementalist',
      elementalist,
      'Then choose any three skills from the crafting or lore skill groups.',
      [],
      {
        options: undefined,
        shape: { type: 'multi', count: 3 },
        optionsFrom: ['pool.skills.crafting', 'pool.skills.lore'],
        supportedInV001: ['Alchemy', 'Blacksmithing', 'History'],
      },
    ),
    choice(
      'class.elementalist.magic-replacement',
      'career.choice',
      "Mage's Apprentice",
      path('chapter/making-a-hero'),
      'If you gain the same specific skill from two different sources (for instance, from a career and a class), you can pick a different skill from any skill group.',
      [],
      {
        options: undefined,
        dependsOn: ['class.elementalist.skill.magic'],
        replacesDuplicateSkill: 'Magic',
        optionsFrom: Object.keys(pools).filter(id => id.startsWith('pool.skills.')),
        supportedInV001: ['Empathize'],
      },
    ),
    auto(
      'class.elementalist.features',
      'class.choice',
      'Elementalist',
      elementalist,
      'Elementalist Advancement Table',
      [
        ...[
          'Elemental Specialization',
          'Essence',
          'Hurl Element',
          'Persistent Magic',
          'Practical Magic',
          'Enchantment',
          'Elementalist Ward',
          'Elementalist Abilities',
        ].map(name =>
          grant('class-feature', name, feature(name.toLowerCase().replaceAll(' ', '-'))),
        ),
        grant('class-ability', 'Hurl Element', ability('hurl-element')),
        grant('class-ability', 'Practical Magic', ability('practical-magic')),
      ],
    ),
    choice(
      'class.elementalist.specialization',
      'class.choice',
      'Elementalist',
      feature('elemental-specialization'),
      'You choose an elemental specialization from the following options: earth, fire, green, or void.',
      [
        option('Fire', feature('elemental-specialization'), {
          grants: [
            grant('class-feature', 'Fire: Acolyte of Fire', feature('fire-acolyte-of-fire')),
            grant(
              'class-ability',
              'Return to Formlessness',
              ability('return-to-formlessness'),
              'You have the following ability.',
            ),
            grant(
              'aspect-ability',
              'Explosive Assistance',
              ability('explosive-assistance'),
              'Your elemental specialization grants you a triggered action',
            ),
          ],
        }),
      ],
    ),
    choice(
      'class.elementalist.enchantment',
      'class.choice',
      'Elementalist',
      feature('enchantment'),
      'Choose one of the following enchantments.',
      [
        option('Enchantment of Destruction', feature('enchantment-of-destruction'), {
          grants: [
            grant(
              'class-feature',
              'Enchantment of Destruction',
              feature('enchantment-of-destruction'),
            ),
          ],
        }),
      ],
    ),
    choice(
      'class.elementalist.ward',
      'class.choice',
      'Elementalist',
      feature('elementalist-ward'),
      'Choose one of the following wards.',
      [
        option('Ward of Delightful Consequences', feature('ward-of-delightful-consequences'), {
          grants: [
            grant(
              'class-feature',
              'Ward of Delightful Consequences',
              feature('ward-of-delightful-consequences'),
            ),
          ],
        }),
      ],
    ),
    choice(
      'class.elementalist.signature-abilities',
      'class.choice',
      'Elementalist',
      feature('elementalist-abilities'),
      'Choose two signature abilities from the following options.',
      [
        option('Bifurcated Incineration', ability('bifurcated-incineration'), {
          abilityKind: 'signature',
        }),
        option('Viscous Fire', ability('viscous-fire'), { abilityKind: 'signature' }),
      ],
      { shape: { type: 'multi', count: 2 } },
    ),
    choice(
      'class.elementalist.ability-3',
      'class.choice',
      'Elementalist',
      feature('elementalist-abilities'),
      'Choose one heroic ability from the following options, each of which costs 3 essence to use.',
      [
        option('The Flesh, a Crucible', ability('the-flesh-a-crucible'), {
          abilityKind: 'heroic',
          costQuote: 'cost: 3 Essence',
        }),
      ],
    ),
    choice(
      'class.elementalist.ability-5',
      'class.choice',
      'Elementalist',
      feature('elementalist-abilities'),
      'Choose one heroic ability from the following options, each of which costs 5 essence to use.',
      [
        option('Conflagration', ability('conflagration'), {
          abilityKind: 'heroic',
          costQuote: 'cost: 5 Essence',
        }),
      ],
    ),
  ];
}
