// SPDX-License-Identifier: GPL-3.0-only
/**
 * V94 Field Arsenal (en/unified/md/feature/tactician/level-1/field-arsenal.md): a Tactician uses two
 * ordinary kits. Each Kits-table benefit is supplied once: by the only kit that grants it, once when
 * both print the same value, or by the kit chosen in that benefit's arsenal decision when the two
 * printed values differ. Damage bonuses are whole tuples (the source's Battle Grace example).
 */
import type {
  DerivedValue,
  KitBenefit,
  KitBonusReplacement,
  KitContributions,
  Provenance,
} from '../../contracts/characterEvaluation.ts';
import type { DerivationContext, SelectedKit } from '../derivation.ts';
import { KIT_SENTENCES, type KitSentences } from '../sources.ts';
import { SUPPORTING_KITS } from '../../content/supporting-kits.ts';

export const SECOND_KIT_DECISION = 'class.tactician.second-kit';
export const arsenalDecisionId = (benefit: KitBenefit) => `class.tactician.arsenal.${benefit}`;
export const FIELD_ARSENAL_PATH = 'en/unified/md/feature/tactician/level-1/field-arsenal.md';
export const FIELD_ARSENAL = {
  twoKits: {
    path: FIELD_ARSENAL_PATH,
    quote:
      'You can use and gain the benefits of two kits, including both their signature abilities.',
  },
  sameBenefit: {
    path: FIELD_ARSENAL_PATH,
    quote:
      "If both kits grant you the same benefit, you take one or the other and can't change your choice until you finish a respite.",
  },
  replacement: {
    path: FIELD_ARSENAL_PATH,
    quote:
      "Kit signature abilities have their kit's bonuses already applied, which might require you to adjust the bonuses of the signature abilities you gain from a kit.",
  },
} as const;

export const KIT_BENEFITS: KitBenefit[] = [
  'stamina',
  'speed',
  'stability',
  'disengage',
  'meleeDamage',
  'rangedDamage',
  'meleeDistance',
  'rangedDistance',
];
/** Benefits a kit signature ability already includes (chapter/kits.md, Kit Signature Ability). */
const SIGNATURE_BENEFITS: KitBenefit[] = [
  'meleeDamage',
  'rangedDamage',
  'meleeDistance',
  'rangedDistance',
];

// Source: each named kit's Signature Ability keyword row under en/unified/md/kit/.
// All ordinary signatures below have Weapon; classify their actual Melee/Ranged keywords,
// rather than inferring applicability from the originating kit's nonzero bonuses.
const SIGNATURE_MODES: Record<string, readonly string[]> = {
  'Arcane Archer': ['ranged'],
  Battlemind: ['melee'],
  'Cloak and Dagger': ['melee', 'ranged'],
  'Dual Wielder': ['melee'],
  Guisarmier: ['melee'],
  'Martial Artist': ['melee'],
  Mountain: ['melee'],
  Panther: ['melee'],
  Pugilist: ['melee'],
  Raider: ['melee', 'ranged'],
  Ranger: ['ranged'],
  'Rapid-Fire': ['ranged'],
  Retiarius: ['melee'],
  'Shining Armor': ['melee'],
  Sniper: ['ranged'],
  Spellsword: ['melee'],
  'Stick and Robe': ['melee'],
  Swashbuckler: ['melee'],
  'Sword and Board': ['melee'],
  'Warrior Priest': ['melee'],
  Whirlwind: ['melee'],
};
const appliesToSignature = (kit: SelectedKit, benefit: KitBenefit) =>
  SIGNATURE_MODES[kit.name]?.some(mode => benefit.startsWith(mode)) ?? false;

type Printed = number | [number, number, number];

/** The kit's printed value for a benefit; an omitted bonus is 0 (R02 1.14). */
export function printedBenefit(s: KitSentences, benefit: KitBenefit): Printed {
  switch (benefit) {
    case 'stamina':
      return s.staminaBonusPerEchelon.amount;
    case 'speed':
      return s.speedBonus;
    case 'stability':
      return s.stabilityBonus?.amount ?? 0;
    case 'disengage':
      return s.disengageBonus;
    case 'meleeDamage':
      return s.meleeDamageBonus?.value ?? [0, 0, 0];
    case 'rangedDamage':
      return s.rangedDamageBonus;
    case 'meleeDistance':
      return s.meleeDistanceBonus;
    case 'rangedDistance':
      return s.rangedDistanceBonus;
  }
}
const granted = (value: Printed) => (Array.isArray(value) ? value.some(Boolean) : value !== 0);
const same = (a: Printed, b: Printed) => JSON.stringify(a) === JSON.stringify(b);

/** Kit data by name, independent of the definitions version (ordinary kits only). */
export function kitSentencesFor(name: string | undefined): KitSentences | undefined {
  return name ? (KIT_SENTENCES[name] ?? SUPPORTING_KITS[name]) : undefined;
}

/**
 * How two kits relate on one benefit: `none` (at most one grants it), `equal` (both grant the same
 * printed value) or `differs` (both grant it and an arsenal choice is required).
 */
export function arsenalOverlap(
  a: KitSentences,
  b: KitSentences,
  benefit: KitBenefit,
): 'none' | 'equal' | 'differs' {
  const pa = printedBenefit(a, benefit);
  const pb = printedBenefit(b, benefit);
  if (!granted(pa) || !granted(pb)) return 'none';
  return same(pa, pb) ? 'equal' : 'differs';
}

/** The arsenal decisions a pair of kits needs, for the wizard and the evaluator alike. */
export function arsenalOverlaps(
  first: string | undefined,
  second: string | undefined,
): Partial<Record<KitBenefit, 'equal' | 'differs'>> {
  const a = kitSentencesFor(first);
  const b = kitSentencesFor(second);
  const out: Partial<Record<KitBenefit, 'equal' | 'differs'>> = {};
  if (!a || !b || first === second) return out;
  for (const benefit of KIT_BENEFITS) {
    const overlap = arsenalOverlap(a, b, benefit);
    if (overlap !== 'none') out[benefit] = overlap;
  }
  return out;
}

const FIELDS: Record<KitBenefit, keyof KitContributions> = {
  stamina: 'staminaBonusPerEchelon',
  speed: 'speedBonus',
  stability: 'stabilityBonus',
  disengage: 'disengageBonus',
  meleeDamage: 'meleeDamageBonus',
  rangedDamage: 'rangedDamageBonus',
  meleeDistance: 'meleeDistanceBonus',
  rangedDistance: 'rangedDistanceBonus',
};

export interface Arsenal {
  /** The resolved contributions every consumer reads; absent while an arsenal choice is missing. */
  kit?: KitContributions;
  /** Benefits whose arsenal decision is required and unanswered. */
  missing: KitBenefit[];
  /** Per kit signature: bonuses that kit lost to the other kit. */
  replacements: Record<string, KitBonusReplacement[]>;
}

/**
 * Resolves the Field Arsenal for the two kits. `first` is `kit.choice`, `second` the Tactician's
 * second kit; both carry their own printed contributions (with per-kit provenance).
 */
export function resolveArsenal(
  ctx: DerivationContext,
  first: { kit: SelectedKit; contributions: KitContributions },
  second: { kit: SelectedKit; contributions: KitContributions },
): Arsenal {
  const p = (entry: Provenance) => ctx.provenance(entry);
  const dv = <T>(value: T, provenance: Provenance[]): DerivedValue<T> => ({ value, provenance });
  const sides = [first, second];
  const missing: KitBenefit[] = [];
  const replacements: Record<string, KitBonusReplacement[]> = {
    [first.kit.name]: [],
    [second.kit.name]: [],
  };
  const resolved: Partial<KitContributions> = {};
  const winners: Partial<
    Record<KitBenefit, { kit: SelectedKit; contributions: KitContributions }>
  > = {};
  for (const benefit of KIT_BENEFITS) {
    const field = FIELDS[benefit];
    const overlap = arsenalOverlap(first.kit.s, second.kit.s, benefit);
    const grantedBy = sides.filter(side => granted(printedBenefit(side.kit.s, benefit)));
    let winner = grantedBy[0] ?? first;
    let extra: Provenance[] = [];
    if (overlap === 'equal') {
      // Interpretation: identical printed values need no choice; the value is taken once, never
      // added, and the second kit's entry stays in the provenance.
      extra = [
        ...(second.contributions[field] as DerivedValue<unknown>).provenance,
        p({
          decisionId: 'class.tactician.features',
          source: ctx.sentence(FIELD_ARSENAL.sameBenefit),
          note: `${first.kit.name} and ${second.kit.name} print the same ${benefit} bonus; taken once (interpretation: no choice is needed between equal values)`,
        }),
      ];
    } else if (overlap === 'differs') {
      const decisionId = arsenalDecisionId(benefit);
      const choice = ctx.single(decisionId);
      if (choice === undefined) {
        missing.push(benefit);
        continue;
      }
      winner = choice === second.kit.name ? second : first;
      extra = [
        p({
          decisionId,
          selection: winner.kit.name,
          source: ctx.sentence(FIELD_ARSENAL.sameBenefit),
          note: `${benefit}: ${winner.kit.name} chosen over ${(winner === first ? second : first).kit.name}`,
        }),
      ];
    } else if (grantedBy.length === 1) {
      extra = [
        p({
          decisionId: 'class.tactician.features',
          selection: winner.kit.name,
          source: ctx.sentence(FIELD_ARSENAL.twoKits),
          note: `${benefit} bonus supplied by ${winner.kit.name} alone`,
        }),
      ];
    }
    // chapter/kits.md, Damage Bonuses and Distance Bonus: any qualifying Weapon ability
    // receives the resolved bonus, including a signature whose own kit supplied zero.
    if (SIGNATURE_BENEFITS.includes(benefit)) {
      for (const side of sides) {
        const subtract = printedBenefit(side.kit.s, benefit);
        const add = printedBenefit(winner.kit.s, benefit);
        if (!appliesToSignature(side.kit, benefit) || same(subtract, add)) continue;
        replacements[side.kit.name]!.push({
          benefit,
          fromKit: side.kit.name,
          toKit: winner.kit.name,
          subtract,
          add,
          decisionId: overlap === 'differs' ? arsenalDecisionId(benefit) : winner.kit.decisionId,
          sourcePath: FIELD_ARSENAL_PATH,
        });
      }
    }
    winners[benefit] = winner;
    const source = winner.contributions[field] as DerivedValue<unknown>;
    (resolved as Record<string, unknown>)[field] = dv(source.value, [
      ...source.provenance,
      ...extra,
    ]);
  }
  if (missing.length) return { missing, replacements };
  const stamina = winners.stamina!;
  const kit: KitContributions = {
    ...(resolved as Omit<
      KitContributions,
      'name' | 'equipmentText' | 'echelon' | 'staminaBonusApplied'
    >),
    name: dv(`${first.kit.name} and ${second.kit.name}`, [
      ...first.contributions.name.provenance,
      ...second.contributions.name.provenance,
      p({ decisionId: second.kit.decisionId, source: ctx.sentence(FIELD_ARSENAL.twoKits) }),
    ]),
    equipmentText: dv(
      `${first.contributions.equipmentText.value} ${second.contributions.equipmentText.value}`,
      [
        ...first.contributions.equipmentText.provenance,
        ...second.contributions.equipmentText.provenance,
      ],
    ),
    echelon: first.contributions.echelon,
    staminaBonusApplied: dv(stamina.contributions.staminaBonusApplied.value, [
      ...stamina.contributions.staminaBonusApplied.provenance,
      ...resolved.staminaBonusPerEchelon!.provenance.slice(
        stamina.contributions.staminaBonusPerEchelon.provenance.length,
      ),
    ]),
  };
  return { kit, missing, replacements };
}
