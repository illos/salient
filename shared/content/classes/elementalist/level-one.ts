// SPDX-License-Identifier: GPL-3.0-only
/** Complete level-one Elementalist choices from the pinned Compendium. */
import type { ClassProfile, Decision, DecisionDefinitions } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';

const slug = (s: string) =>
  s
    .toLowerCase()
    .replaceAll("'", '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
export const ELEMENTALIST_CHOICES = [
  ['Afflict a Bountiful Decay', 0],
  ['Bifurcated Incineration', 0],
  ['Grasp of Beyond', 0],
  ['Meteoric Introduction', 0],
  ['Ray of Agonizing Self-Reflection', 0],
  ['The Green Within, the Green Without', 0],
  ['Unquiet Ground', 0],
  ['Viscous Fire', 0],
  ['Behold the Mystery', 3],
  ['Invigorating Growth', 3],
  ['Ripples in the Earth', 3],
  ['The Flesh, a Crucible', 3],
  ['Conflagration', 5],
  ['Instantaneous Excavation', 5],
  ['No More Than a Breeze', 5],
  ['Test of Rain', 5],
] as const;
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
        supportedInV001: [
          ...new Set(['crafting', 'lore'].flatMap(g => pools[`pool.skills.${g}`]!.values)),
        ],
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
        supportedInV001: [
          ...new Set(
            Object.entries(pools)
              .filter(([id]) => id.startsWith('pool.skills.'))
              .flatMap(([, p]) => p.values),
          ),
        ],
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
        ['Earth', 'Earth: Acolyte of Earth', 'Motivate Earth', 'Skin Like Castle Walls'],
        ['Fire', 'Fire: Acolyte of Fire', 'Return to Formlessness', 'Explosive Assistance'],
        [
          'Green',
          'Green: Acolyte of the Green',
          'It Is the Soul Which Hears',
          'Breath of Dawn Remembered',
        ],
        ['Void', 'Void: Acolyte of the Mystery', 'A Beyonding of Vision', 'Subtle Relocation'],
      ].map(([name, acolyte, extra, triggered]) =>
        option(name!, feature('elemental-specialization'), {
          grants: [
            grant('class-feature', acolyte!, feature(slug(acolyte!))),
            ...(name === 'Earth' || name === 'Fire'
              ? [grant('class-ability', extra!, ability(slug(extra!)))]
              : [grant('class-feature', extra!, feature(slug(extra!)))]),
            ...(name === 'Void'
              ? [grant('class-ability', 'Shared Void Sense', ability('shared-void-sense'))]
              : []),
            grant('aspect-ability', triggered!, ability(slug(triggered!))),
          ],
        }),
      ),
    ),
    choice(
      'class.elementalist.enchantment',
      'class.choice',
      'Elementalist',
      feature('enchantment'),
      'Choose one of the following enchantments.',
      ['Battle', 'Celerity', 'Destruction', 'Distance', 'Permanence'].map(n => {
        const name = `Enchantment of ${n}`;
        return option(name, feature(slug(name)), {
          grants: [grant('class-feature', name, feature(slug(name)))],
        });
      }),
    ),
    choice(
      'class.elementalist.ward',
      'class.choice',
      'Elementalist',
      feature('elementalist-ward'),
      'Choose one of the following wards.',
      [
        'Delightful Consequences',
        'Excellent Protection',
        "Nature's Affection",
        'Surprising Reactivity',
      ].map(n => {
        const name = `Ward of ${n}`;
        return option(name, feature(slug(name)), {
          grants: [grant('class-feature', name, feature(slug(name)))],
        });
      }),
    ),
    ...[0, 3, 5].map(cost =>
      choice(
        `class.elementalist.${cost ? `ability-${cost}` : 'signature-abilities'}`,
        'class.choice',
        'Elementalist',
        feature('elementalist-abilities'),
        cost
          ? `each of which costs ${cost} essence to use.`
          : 'Choose two signature abilities from the following options.',
        ELEMENTALIST_CHOICES.filter(([, c]) => c === cost).map(([name]) =>
          option(name, ability(slug(name)), {
            abilityKind: cost ? 'heroic' : 'signature',
            ...(cost ? { costQuote: `cost: ${cost} Essence` } : {}),
          }),
        ),
        cost ? {} : { shape: { type: 'multi', count: 2 } },
      ),
    ),
  ];
}
