// SPDX-License-Identifier: GPL-3.0-only
/** V37 source-complete kit baselines. Compendium pin fb83a789da8f0327a389c277a0c790b1648d5810.
 * Audit: docs/research/v37-backgrounds.json. Signature values are already kit-bonused.
 * Stormwight rows have no ordinary Kits table row; their actual bonus paths are in notes.
 * Inclusion here is reference coverage, not permission to select a kit without its class grant.
 */
import type { KitSentences } from '../evaluate/sources.ts';

export const ORDINARY_KIT_NAMES: string[] = [
  'Arcane Archer',
  'Battlemind',
  'Cloak and Dagger',
  'Dual Wielder',
  'Guisarmier',
  'Martial Artist',
  'Mountain',
  'Panther',
  'Pugilist',
  'Raider',
  'Ranger',
  'Rapid-Fire',
  'Retiarius',
  'Shining Armor',
  'Sniper',
  'Spellsword',
  'Stick and Robe',
  'Swashbuckler',
  'Sword and Board',
  'Warrior Priest',
  'Whirlwind',
];

export const STORMWIGHT_KIT_NAMES: string[] = ['Boren', 'Corven', 'Raden', 'Vuken'];

export const SUPPORTING_KITS: Record<string, KitSentences> = {
  'Arcane Archer': {
    name: 'Arcane Archer',
    entryPath: 'en/unified/md/kit/arcane-archer.md',
    equipmentText: 'You wear no armor and wield a bow.',
    tableRow: '| Arcane Archer | None | Bow | - | +1 | - | - | +2/+2/+2 | - | +10 | +1 |',
    staminaBonusPerEchelon: {
      amount: 0,
      quote: '| Arcane Archer | None | Bow | - | +1 | - | - | +2/+2/+2 | - | +10 | +1 |',
    },
    stabilityBonus: null,
    meleeDamageBonus: null,
    speedBonus: 1,
    rangedDamageBonus: [2, 2, 2],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 10,
    disengageBonus: 1,
    signatureAbility: 'Exploding Arrow',
    notes: {
      stamina: 'en/unified/md/kit/arcane-archer.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/arcane-archer.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/arcane-archer.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/arcane-archer.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/arcane-archer.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  Battlemind: {
    name: 'Battlemind',
    entryPath: 'en/unified/md/kit/battlemind.md',
    equipmentText: 'You wear light armor and wield a medium weapon.',
    tableRow: '| Battlemind | Light | Medium | +3 | +2 | +1 | +2/+2/+2 | - | - | - | - |',
    staminaBonusPerEchelon: {
      amount: 3,
      quote: 'Stamina Bonus: +3 per echelon',
    },
    stabilityBonus: {
      amount: 1,
      quote: 'Stability Bonus: +1',
    },
    meleeDamageBonus: {
      value: [2, 2, 2],
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    speedBonus: 2,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbility: 'Unmooring',
    notes: {
      stamina: 'en/unified/md/kit/battlemind.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/battlemind.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/battlemind.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/battlemind.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/battlemind.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  Boren: {
    name: 'Boren',
    entryPath: 'en/unified/md/kit/boren.md',
    equipmentText: 'You wear no armor and use unarmed strikes.',
    tableRow: '',
    staminaBonusPerEchelon: {
      amount: 9,
      quote: 'Stamina Bonus: +9 per echelon',
    },
    stabilityBonus: {
      amount: 2,
      quote: 'Stability Bonus: +2',
    },
    meleeDamageBonus: {
      value: [0, 0, 4],
      quote: 'Melee Damage Bonus: +0/+0/+4',
    },
    speedBonus: 0,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbility: 'Bear Claws',
    notes: {
      stamina:
        'en/unified/md/feature/fury/boren/kit-bonuses.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/feature/fury/boren/kit-bonuses.md; omitted bonus means0.',
      speed: 'en/unified/md/feature/fury/boren/kit-bonuses.md; omitted bonus means0.',
      disengage:
        'en/unified/md/feature/fury/boren/kit-bonuses.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/feature/fury/boren/kit-bonuses.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  'Cloak and Dagger': {
    name: 'Cloak and Dagger',
    entryPath: 'en/unified/md/kit/cloak-and-dagger.md',
    equipmentText: 'You wear light armor and wield one or two light weapons.',
    tableRow:
      '| Cloak and Dagger | Light | Light | +3 | +2 | - | +1/+1/+1 | +1/+1/+1 | - | +5 | +1 |',
    staminaBonusPerEchelon: {
      amount: 3,
      quote: 'Stamina Bonus: +3 per echelon',
    },
    stabilityBonus: null,
    meleeDamageBonus: {
      value: [1, 1, 1],
      quote: 'Melee Damage Bonus: +1/+1/+1',
    },
    speedBonus: 2,
    rangedDamageBonus: [1, 1, 1],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 5,
    disengageBonus: 1,
    signatureAbility: 'Fade',
    notes: {
      stamina: 'en/unified/md/kit/cloak-and-dagger.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/cloak-and-dagger.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/cloak-and-dagger.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/cloak-and-dagger.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/cloak-and-dagger.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  Corven: {
    name: 'Corven',
    entryPath: 'en/unified/md/kit/corven.md',
    equipmentText: 'You wear no armor and use unarmed strikes.',
    tableRow: '',
    staminaBonusPerEchelon: {
      amount: 3,
      quote: 'Stamina Bonus: +3 per echelon',
    },
    stabilityBonus: null,
    meleeDamageBonus: {
      value: [2, 2, 2],
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    speedBonus: 3,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 1,
    signatureAbility: 'Wing Buffet',
    notes: {
      stamina:
        'en/unified/md/feature/fury/corven/kit-bonuses.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/feature/fury/corven/kit-bonuses.md; omitted bonus means0.',
      speed: 'en/unified/md/feature/fury/corven/kit-bonuses.md; omitted bonus means0.',
      disengage:
        'en/unified/md/feature/fury/corven/kit-bonuses.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/feature/fury/corven/kit-bonuses.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  'Dual Wielder': {
    name: 'Dual Wielder',
    entryPath: 'en/unified/md/kit/dual-wielder.md',
    equipmentText: 'You wear medium armor and wield a light weapon and a medium weapon.',
    tableRow: '| Dual Wielder | Medium | Light, medium | +6 | +2 | - | +2/+2/+2 | - | - | - | +1 |',
    staminaBonusPerEchelon: {
      amount: 6,
      quote: 'Stamina Bonus: +6 per echelon',
    },
    stabilityBonus: null,
    meleeDamageBonus: {
      value: [2, 2, 2],
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    speedBonus: 2,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 1,
    signatureAbility: 'Double Strike',
    notes: {
      stamina: 'en/unified/md/kit/dual-wielder.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/dual-wielder.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/dual-wielder.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/dual-wielder.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/dual-wielder.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  Guisarmier: {
    name: 'Guisarmier',
    entryPath: 'en/unified/md/kit/guisarmier.md',
    equipmentText: 'You wear medium armor and wield a polearm.',
    tableRow: '| Guisarmier | Medium | Polearm | +6 | - | +1 | +2/+2/+2 | - | +1 | - | - |',
    staminaBonusPerEchelon: {
      amount: 6,
      quote: 'Stamina Bonus: +6 per echelon',
    },
    stabilityBonus: {
      amount: 1,
      quote: 'Stability Bonus: +1',
    },
    meleeDamageBonus: {
      value: [2, 2, 2],
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    speedBonus: 0,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 1,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbility: 'Forward Thrust, Backward Smash',
    notes: {
      stamina: 'en/unified/md/kit/guisarmier.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/guisarmier.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/guisarmier.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/guisarmier.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/guisarmier.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  'Martial Artist': {
    name: 'Martial Artist',
    entryPath: 'en/unified/md/kit/martial-artist.md',
    equipmentText: 'You wear no armor and wield only your unarmed strikes.',
    tableRow:
      '| Martial Artist | None | Unarmed strikes | +3 | +3 | - | +2/+2/+2 | - | - | - | +1 |',
    staminaBonusPerEchelon: {
      amount: 3,
      quote: 'Stamina Bonus: +3 per echelon',
    },
    stabilityBonus: null,
    meleeDamageBonus: {
      value: [2, 2, 2],
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    speedBonus: 3,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 1,
    signatureAbility: 'Battle Grace',
    notes: {
      stamina: 'en/unified/md/kit/martial-artist.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/martial-artist.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/martial-artist.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/martial-artist.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/martial-artist.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  Mountain: {
    name: 'Mountain',
    entryPath: 'en/unified/md/kit/mountain.md',
    equipmentText: 'You wear heavy armor and wield a heavy weapon.',
    tableRow: '| Mountain | Heavy | Heavy | +9 | - | +2 | +0/+0/+4 | - | - | - | - |',
    staminaBonusPerEchelon: {
      amount: 9,
      quote: 'Stamina Bonus: +9 per echelon',
    },
    stabilityBonus: {
      amount: 2,
      quote: 'Stability Bonus: +2',
    },
    meleeDamageBonus: {
      value: [0, 0, 4],
      quote: 'Melee Damage Bonus: +0/+0/+4',
    },
    speedBonus: 0,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbility: 'Pain for Pain',
    notes: {
      stamina: 'en/unified/md/kit/mountain.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/mountain.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/mountain.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/mountain.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/mountain.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  Panther: {
    name: 'Panther',
    entryPath: 'en/unified/md/kit/panther.md',
    equipmentText: 'You wear no armor and wield a heavy weapon.',
    tableRow: '| Panther | None | Heavy | +6 | +1 | +1 | +0/+0/+4 | - | - | - | - |',
    staminaBonusPerEchelon: {
      amount: 6,
      quote: 'Stamina Bonus: +6 per echelon',
    },
    stabilityBonus: {
      amount: 1,
      quote: 'Stability Bonus: +1',
    },
    meleeDamageBonus: {
      value: [0, 0, 4],
      quote: 'Melee Damage Bonus: +0/+0/+4',
    },
    speedBonus: 1,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbility: 'Devastating Rush',
    notes: {
      stamina: 'en/unified/md/kit/panther.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/panther.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/panther.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/panther.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/panther.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  Pugilist: {
    name: 'Pugilist',
    entryPath: 'en/unified/md/kit/pugilist.md',
    equipmentText: 'You wear no armor and wield only your unarmed strikes.',
    tableRow: '| Pugilist | None | Unarmed strikes | +6 | +2 | +1 | +1/+1/+1 | - | - | - | - |',
    staminaBonusPerEchelon: {
      amount: 6,
      quote: 'Stamina Bonus: +6 per echelon',
    },
    stabilityBonus: {
      amount: 1,
      quote: 'Stability Bonus: +1',
    },
    meleeDamageBonus: {
      value: [1, 1, 1],
      quote: 'Melee Damage Bonus: +1/+1/+1',
    },
    speedBonus: 2,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbility: "Let's Dance",
    notes: {
      stamina: 'en/unified/md/kit/pugilist.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/pugilist.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/pugilist.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/pugilist.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/pugilist.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  Raden: {
    name: 'Raden',
    entryPath: 'en/unified/md/kit/raden.md',
    equipmentText: 'You wear no armor and use unarmed strikes.',
    tableRow: '',
    staminaBonusPerEchelon: {
      amount: 3,
      quote: 'Stamina Bonus: +3 per echelon',
    },
    stabilityBonus: null,
    meleeDamageBonus: {
      value: [2, 2, 2],
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    speedBonus: 3,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 1,
    signatureAbility: 'Driving Pounce',
    notes: {
      stamina:
        'en/unified/md/feature/fury/raden/kit-bonuses.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/feature/fury/raden/kit-bonuses.md; omitted bonus means0.',
      speed: 'en/unified/md/feature/fury/raden/kit-bonuses.md; omitted bonus means0.',
      disengage:
        'en/unified/md/feature/fury/raden/kit-bonuses.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/feature/fury/raden/kit-bonuses.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  Raider: {
    name: 'Raider',
    entryPath: 'en/unified/md/kit/raider.md',
    equipmentText: 'You wear light armor and wield a shield and a light weapon.',
    tableRow:
      '| Raider | Light, shield | Light | +6 | +1 | - | +1/+1/+1 | +1/+1/+1 | - | +5 | +1 |',
    staminaBonusPerEchelon: {
      amount: 6,
      quote: 'Stamina Bonus: +6 per echelon',
    },
    stabilityBonus: null,
    meleeDamageBonus: {
      value: [1, 1, 1],
      quote: 'Melee Damage Bonus: +1/+1/+1',
    },
    speedBonus: 1,
    rangedDamageBonus: [1, 1, 1],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 5,
    disengageBonus: 1,
    signatureAbility: "Raider's Awe",
    notes: {
      stamina: 'en/unified/md/kit/raider.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/raider.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/raider.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/raider.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/raider.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  Ranger: {
    name: 'Ranger',
    entryPath: 'en/unified/md/kit/ranger.md',
    equipmentText: 'You wear medium armor and wield a bow and a medium weapon.',
    tableRow: '| Ranger | Medium | Bow, medium | +6 | +1 | - | +1/+1/+1 | +1/+1/+1 | - | +5 | +1 |',
    staminaBonusPerEchelon: {
      amount: 6,
      quote: 'Stamina Bonus: +6 per echelon',
    },
    stabilityBonus: null,
    meleeDamageBonus: {
      value: [1, 1, 1],
      quote: 'Melee Damage Bonus: +1/+1/+1',
    },
    speedBonus: 1,
    rangedDamageBonus: [1, 1, 1],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 5,
    disengageBonus: 1,
    signatureAbility: 'Hamstring Shot',
    notes: {
      stamina: 'en/unified/md/kit/ranger.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/ranger.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/ranger.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/ranger.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/ranger.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  'Rapid-Fire': {
    name: 'Rapid-Fire',
    entryPath: 'en/unified/md/kit/rapid-fire.md',
    equipmentText: 'You wear light armor and wield a bow.',
    tableRow: '| Rapid-Fire | Light | Bow | +3 | +1 | - | - | +2/+2/+2 | - | +7 | +1 |',
    staminaBonusPerEchelon: {
      amount: 3,
      quote: 'Stamina Bonus: +3 per echelon',
    },
    stabilityBonus: null,
    meleeDamageBonus: null,
    speedBonus: 1,
    rangedDamageBonus: [2, 2, 2],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 7,
    disengageBonus: 1,
    signatureAbility: 'Two Shot',
    notes: {
      stamina: 'en/unified/md/kit/rapid-fire.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/rapid-fire.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/rapid-fire.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/rapid-fire.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/rapid-fire.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  Retiarius: {
    name: 'Retiarius',
    entryPath: 'en/unified/md/kit/retiarius.md',
    equipmentText: 'You wear light armor and wield several ensnaring weapons and a polearm.',
    tableRow:
      '| Retiarius | Light | Ensnaring, polearm | +3 | +1 | - | +2/+2/+2 | - | +1 | - | +1 |',
    staminaBonusPerEchelon: {
      amount: 3,
      quote: 'Stamina Bonus: +3 per echelon',
    },
    stabilityBonus: null,
    meleeDamageBonus: {
      value: [2, 2, 2],
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    speedBonus: 1,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 1,
    rangedDistanceBonus: 0,
    disengageBonus: 1,
    signatureAbility: 'Net and Stab',
    notes: {
      stamina: 'en/unified/md/kit/retiarius.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/retiarius.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/retiarius.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/retiarius.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/retiarius.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  'Shining Armor': {
    name: 'Shining Armor',
    entryPath: 'en/unified/md/kit/shining-armor.md',
    equipmentText: 'You wear heavy armor and wield a shield and a medium weapon.',
    tableRow:
      '| Shining Armor | Heavy, shield | Medium | +12 | - | +1 | +2/+2/+2 | - | - | - | - |',
    staminaBonusPerEchelon: {
      amount: 12,
      quote: 'Stamina Bonus: +12 per echelon',
    },
    stabilityBonus: {
      amount: 1,
      quote: 'Stability Bonus: +1',
    },
    meleeDamageBonus: {
      value: [2, 2, 2],
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    speedBonus: 0,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbility: 'Protective Attack',
    notes: {
      stamina: 'en/unified/md/kit/shining-armor.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/shining-armor.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/shining-armor.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/shining-armor.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/shining-armor.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  Sniper: {
    name: 'Sniper',
    entryPath: 'en/unified/md/kit/sniper.md',
    equipmentText: 'You wear no armor and wield a bow.',
    tableRow: '| Sniper | None | Bow | - | +1 | - | - | +0/+0/+4 | - | +10 | +1 |',
    staminaBonusPerEchelon: {
      amount: 0,
      quote: '| Sniper | None | Bow | - | +1 | - | - | +0/+0/+4 | - | +10 | +1 |',
    },
    stabilityBonus: null,
    meleeDamageBonus: null,
    speedBonus: 1,
    rangedDamageBonus: [0, 0, 4],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 10,
    disengageBonus: 1,
    signatureAbility: 'Patient Shot',
    notes: {
      stamina: 'en/unified/md/kit/sniper.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/sniper.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/sniper.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/sniper.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/sniper.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  Spellsword: {
    name: 'Spellsword',
    entryPath: 'en/unified/md/kit/spellsword.md',
    equipmentText: 'You wear light armor and wield a shield and a medium weapon.',
    tableRow: '| Spellsword | Light, shield | Medium | +6 | +1 | +1 | +2/+2/+2 | - | - | - | - |',
    staminaBonusPerEchelon: {
      amount: 6,
      quote: 'Stamina Bonus: +6 per echelon',
    },
    stabilityBonus: {
      amount: 1,
      quote: 'Stability Bonus: +1',
    },
    meleeDamageBonus: {
      value: [2, 2, 2],
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    speedBonus: 1,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbility: 'Leaping Lightning',
    notes: {
      stamina: 'en/unified/md/kit/spellsword.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/spellsword.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/spellsword.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/spellsword.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/spellsword.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  'Stick and Robe': {
    name: 'Stick and Robe',
    entryPath: 'en/unified/md/kit/stick-and-robe.md',
    equipmentText: 'You wear light armor and wield a polearm.',
    tableRow: '| Stick and Robe | Light | Polearm | +3 | +2 | - | +1/+1/+1 | - | +1 | - | +1 |',
    staminaBonusPerEchelon: {
      amount: 3,
      quote: 'Stamina Bonus: +3 per echelon',
    },
    stabilityBonus: null,
    meleeDamageBonus: {
      value: [1, 1, 1],
      quote: 'Melee Damage Bonus: +1/+1/+1',
    },
    speedBonus: 2,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 1,
    rangedDistanceBonus: 0,
    disengageBonus: 1,
    signatureAbility: 'Where I Want You',
    notes: {
      stamina: 'en/unified/md/kit/stick-and-robe.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/stick-and-robe.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/stick-and-robe.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/stick-and-robe.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/stick-and-robe.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  Swashbuckler: {
    name: 'Swashbuckler',
    entryPath: 'en/unified/md/kit/swashbuckler.md',
    equipmentText: 'You wear light armor and wield a medium weapon.',
    tableRow: '| Swashbuckler | Light | Medium | +3 | +3 | - | +2/+2/+2 | - | - | - | +1 |',
    staminaBonusPerEchelon: {
      amount: 3,
      quote: 'Stamina Bonus: +3 per echelon',
    },
    stabilityBonus: null,
    meleeDamageBonus: {
      value: [2, 2, 2],
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    speedBonus: 3,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 1,
    signatureAbility: 'Fancy Footwork',
    notes: {
      stamina: 'en/unified/md/kit/swashbuckler.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/swashbuckler.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/swashbuckler.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/swashbuckler.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/swashbuckler.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  'Sword and Board': {
    name: 'Sword and Board',
    entryPath: 'en/unified/md/kit/sword-and-board.md',
    equipmentText: 'You wear medium armor and wield a shield and a medium weapon.',
    tableRow:
      '| Sword and Board | Medium, shield | Medium | +9 | - | +1 | +2/+2/+2 | - | - | - | +1 |',
    staminaBonusPerEchelon: {
      amount: 9,
      quote: 'Stamina Bonus: +9 per echelon',
    },
    stabilityBonus: {
      amount: 1,
      quote: 'Stability Bonus: +1',
    },
    meleeDamageBonus: {
      value: [2, 2, 2],
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    speedBonus: 0,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 1,
    signatureAbility: 'Shield Bash',
    notes: {
      stamina: 'en/unified/md/kit/sword-and-board.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/sword-and-board.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/sword-and-board.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/sword-and-board.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/sword-and-board.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  Vuken: {
    name: 'Vuken',
    entryPath: 'en/unified/md/kit/vuken.md',
    equipmentText: 'You wear no armor and use unarmed strikes.',
    tableRow: '',
    staminaBonusPerEchelon: {
      amount: 9,
      quote: 'Stamina Bonus: +9 per echelon',
    },
    stabilityBonus: null,
    meleeDamageBonus: {
      value: [2, 2, 2],
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    speedBonus: 2,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 1,
    signatureAbility: 'Unbalancing Attack',
    notes: {
      stamina:
        'en/unified/md/feature/fury/vuken/kit-bonuses.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/feature/fury/vuken/kit-bonuses.md; omitted bonus means0.',
      speed: 'en/unified/md/feature/fury/vuken/kit-bonuses.md; omitted bonus means0.',
      disengage:
        'en/unified/md/feature/fury/vuken/kit-bonuses.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/feature/fury/vuken/kit-bonuses.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  'Warrior Priest': {
    name: 'Warrior Priest',
    entryPath: 'en/unified/md/kit/warrior-priest.md',
    equipmentText: 'You wear heavy armor and wield a light weapon.',
    tableRow: '| Warrior Priest | Heavy | Light | +9 | +1 | +1 | +1/+1/+1 | - | - | - | - |',
    staminaBonusPerEchelon: {
      amount: 9,
      quote: 'Stamina Bonus: +9 per echelon',
    },
    stabilityBonus: {
      amount: 1,
      quote: 'Stability Bonus: +1',
    },
    meleeDamageBonus: {
      value: [1, 1, 1],
      quote: 'Melee Damage Bonus: +1/+1/+1',
    },
    speedBonus: 1,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbility: 'Weakening Brand',
    notes: {
      stamina: 'en/unified/md/kit/warrior-priest.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/warrior-priest.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/warrior-priest.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/warrior-priest.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/warrior-priest.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
  Whirlwind: {
    name: 'Whirlwind',
    entryPath: 'en/unified/md/kit/whirlwind.md',
    equipmentText: 'You wear no armor and wield a whip.',
    tableRow: '| Whirlwind | None | Whip | - | +3 | - | +1/+1/+1 | - | +1 | - | +1 |',
    staminaBonusPerEchelon: {
      amount: 0,
      quote: '| Whirlwind | None | Whip | - | +3 | - | +1/+1/+1 | - | +1 | - | +1 |',
    },
    stabilityBonus: null,
    meleeDamageBonus: {
      value: [1, 1, 1],
      quote: 'Melee Damage Bonus: +1/+1/+1',
    },
    speedBonus: 3,
    rangedDamageBonus: [0, 0, 0],
    meleeDistanceBonus: 1,
    rangedDistanceBonus: 0,
    disengageBonus: 1,
    signatureAbility: 'Extension of My Arm',
    notes: {
      stamina: 'en/unified/md/kit/whirlwind.md; scales by echelon (levels1–3/4–6/7–9/10).',
      stability: 'en/unified/md/kit/whirlwind.md; omitted bonus means0.',
      speed: 'en/unified/md/kit/whirlwind.md; omitted bonus means0.',
      disengage: 'en/unified/md/kit/whirlwind.md; applies to Disengage shift only.',
      rangedDamage:
        'en/unified/md/kit/whirlwind.md; requires Ranged and Weapon keywords, rolled damage only.',
    },
  },
};

/** Exact source for each present bonus; zero ordinary values cite the real table row.
 * Stormwight omitted fields have null references: absence grants no bonus. */
export const KIT_BONUS_SOURCES: Record<
  string,
  Record<string, { path: string; heading: string; quote: string } | null>
> = {
  'Arcane Archer': {
    stamina: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Arcane Archer | None | Bow | - | +1 | - | - | +2/+2/+2 | - | +10 | +1 |',
    },
    speed: {
      path: 'en/unified/md/kit/arcane-archer.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +1',
    },
    stability: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Arcane Archer | None | Bow | - | +1 | - | - | +2/+2/+2 | - | +10 | +1 |',
    },
    meleeDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Arcane Archer | None | Bow | - | +1 | - | - | +2/+2/+2 | - | +10 | +1 |',
    },
    rangedDamage: {
      path: 'en/unified/md/kit/arcane-archer.md',
      heading: 'Kit Bonuses',
      quote: 'Ranged Damage Bonus: +2/+2/+2',
    },
    meleeDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Arcane Archer | None | Bow | - | +1 | - | - | +2/+2/+2 | - | +10 | +1 |',
    },
    rangedDistance: {
      path: 'en/unified/md/kit/arcane-archer.md',
      heading: 'Kit Bonuses',
      quote: 'Ranged Distance Bonus: +10',
    },
    disengage: {
      path: 'en/unified/md/kit/arcane-archer.md',
      heading: 'Kit Bonuses',
      quote: 'Disengage Bonus: +1',
    },
  },
  Battlemind: {
    stamina: {
      path: 'en/unified/md/kit/battlemind.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +3 per echelon',
    },
    speed: {
      path: 'en/unified/md/kit/battlemind.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +2',
    },
    stability: {
      path: 'en/unified/md/kit/battlemind.md',
      heading: 'Kit Bonuses',
      quote: 'Stability Bonus: +1',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/battlemind.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    rangedDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Battlemind | Light | Medium | +3 | +2 | +1 | +2/+2/+2 | - | - | - | - |',
    },
    meleeDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Battlemind | Light | Medium | +3 | +2 | +1 | +2/+2/+2 | - | - | - | - |',
    },
    rangedDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Battlemind | Light | Medium | +3 | +2 | +1 | +2/+2/+2 | - | - | - | - |',
    },
    disengage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Battlemind | Light | Medium | +3 | +2 | +1 | +2/+2/+2 | - | - | - | - |',
    },
  },
  Boren: {
    stamina: {
      path: 'en/unified/md/feature/fury/boren/kit-bonuses.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +9 per echelon',
    },
    speed: null,
    stability: {
      path: 'en/unified/md/feature/fury/boren/kit-bonuses.md',
      heading: 'Kit Bonuses',
      quote: 'Stability Bonus: +2',
    },
    meleeDamage: {
      path: 'en/unified/md/feature/fury/boren/kit-bonuses.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +0/+0/+4',
    },
    rangedDamage: null,
    meleeDistance: null,
    rangedDistance: null,
    disengage: null,
  },
  'Cloak and Dagger': {
    stamina: {
      path: 'en/unified/md/kit/cloak-and-dagger.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +3 per echelon',
    },
    speed: {
      path: 'en/unified/md/kit/cloak-and-dagger.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +2',
    },
    stability: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote:
        '| Cloak and Dagger | Light | Light | +3 | +2 | - | +1/+1/+1 | +1/+1/+1 | - | +5 | +1 |',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/cloak-and-dagger.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +1/+1/+1',
    },
    rangedDamage: {
      path: 'en/unified/md/kit/cloak-and-dagger.md',
      heading: 'Kit Bonuses',
      quote: 'Ranged Damage Bonus: +1/+1/+1',
    },
    meleeDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote:
        '| Cloak and Dagger | Light | Light | +3 | +2 | - | +1/+1/+1 | +1/+1/+1 | - | +5 | +1 |',
    },
    rangedDistance: {
      path: 'en/unified/md/kit/cloak-and-dagger.md',
      heading: 'Kit Bonuses',
      quote: 'Ranged Distance Bonus: +5',
    },
    disengage: {
      path: 'en/unified/md/kit/cloak-and-dagger.md',
      heading: 'Kit Bonuses',
      quote: 'Disengage Bonus: +1',
    },
  },
  Corven: {
    stamina: {
      path: 'en/unified/md/feature/fury/corven/kit-bonuses.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +3 per echelon',
    },
    speed: {
      path: 'en/unified/md/feature/fury/corven/kit-bonuses.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +3',
    },
    stability: null,
    meleeDamage: {
      path: 'en/unified/md/feature/fury/corven/kit-bonuses.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    rangedDamage: null,
    meleeDistance: null,
    rangedDistance: null,
    disengage: {
      path: 'en/unified/md/feature/fury/corven/kit-bonuses.md',
      heading: 'Kit Bonuses',
      quote: 'Disengage Bonus: +1',
    },
  },
  'Dual Wielder': {
    stamina: {
      path: 'en/unified/md/kit/dual-wielder.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +6 per echelon',
    },
    speed: {
      path: 'en/unified/md/kit/dual-wielder.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +2',
    },
    stability: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Dual Wielder | Medium | Light, medium | +6 | +2 | - | +2/+2/+2 | - | - | - | +1 |',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/dual-wielder.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    rangedDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Dual Wielder | Medium | Light, medium | +6 | +2 | - | +2/+2/+2 | - | - | - | +1 |',
    },
    meleeDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Dual Wielder | Medium | Light, medium | +6 | +2 | - | +2/+2/+2 | - | - | - | +1 |',
    },
    rangedDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Dual Wielder | Medium | Light, medium | +6 | +2 | - | +2/+2/+2 | - | - | - | +1 |',
    },
    disengage: {
      path: 'en/unified/md/kit/dual-wielder.md',
      heading: 'Kit Bonuses',
      quote: 'Disengage Bonus: +1',
    },
  },
  Guisarmier: {
    stamina: {
      path: 'en/unified/md/kit/guisarmier.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +6 per echelon',
    },
    speed: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Guisarmier | Medium | Polearm | +6 | - | +1 | +2/+2/+2 | - | +1 | - | - |',
    },
    stability: {
      path: 'en/unified/md/kit/guisarmier.md',
      heading: 'Kit Bonuses',
      quote: 'Stability Bonus: +1',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/guisarmier.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    rangedDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Guisarmier | Medium | Polearm | +6 | - | +1 | +2/+2/+2 | - | +1 | - | - |',
    },
    meleeDistance: {
      path: 'en/unified/md/kit/guisarmier.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Distance Bonus: +1',
    },
    rangedDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Guisarmier | Medium | Polearm | +6 | - | +1 | +2/+2/+2 | - | +1 | - | - |',
    },
    disengage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Guisarmier | Medium | Polearm | +6 | - | +1 | +2/+2/+2 | - | +1 | - | - |',
    },
  },
  'Martial Artist': {
    stamina: {
      path: 'en/unified/md/kit/martial-artist.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +3 per echelon',
    },
    speed: {
      path: 'en/unified/md/kit/martial-artist.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +3',
    },
    stability: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote:
        '| Martial Artist | None | Unarmed strikes | +3 | +3 | - | +2/+2/+2 | - | - | - | +1 |',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/martial-artist.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    rangedDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote:
        '| Martial Artist | None | Unarmed strikes | +3 | +3 | - | +2/+2/+2 | - | - | - | +1 |',
    },
    meleeDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote:
        '| Martial Artist | None | Unarmed strikes | +3 | +3 | - | +2/+2/+2 | - | - | - | +1 |',
    },
    rangedDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote:
        '| Martial Artist | None | Unarmed strikes | +3 | +3 | - | +2/+2/+2 | - | - | - | +1 |',
    },
    disengage: {
      path: 'en/unified/md/kit/martial-artist.md',
      heading: 'Kit Bonuses',
      quote: 'Disengage Bonus: +1',
    },
  },
  Mountain: {
    stamina: {
      path: 'en/unified/md/kit/mountain.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +9 per echelon',
    },
    speed: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Mountain | Heavy | Heavy | +9 | - | +2 | +0/+0/+4 | - | - | - | - |',
    },
    stability: {
      path: 'en/unified/md/kit/mountain.md',
      heading: 'Kit Bonuses',
      quote: 'Stability Bonus: +2',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/mountain.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +0/+0/+4',
    },
    rangedDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Mountain | Heavy | Heavy | +9 | - | +2 | +0/+0/+4 | - | - | - | - |',
    },
    meleeDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Mountain | Heavy | Heavy | +9 | - | +2 | +0/+0/+4 | - | - | - | - |',
    },
    rangedDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Mountain | Heavy | Heavy | +9 | - | +2 | +0/+0/+4 | - | - | - | - |',
    },
    disengage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Mountain | Heavy | Heavy | +9 | - | +2 | +0/+0/+4 | - | - | - | - |',
    },
  },
  Panther: {
    stamina: {
      path: 'en/unified/md/kit/panther.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +6 per echelon',
    },
    speed: {
      path: 'en/unified/md/kit/panther.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +1',
    },
    stability: {
      path: 'en/unified/md/kit/panther.md',
      heading: 'Kit Bonuses',
      quote: 'Stability Bonus: +1',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/panther.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +0/+0/+4',
    },
    rangedDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Panther | None | Heavy | +6 | +1 | +1 | +0/+0/+4 | - | - | - | - |',
    },
    meleeDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Panther | None | Heavy | +6 | +1 | +1 | +0/+0/+4 | - | - | - | - |',
    },
    rangedDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Panther | None | Heavy | +6 | +1 | +1 | +0/+0/+4 | - | - | - | - |',
    },
    disengage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Panther | None | Heavy | +6 | +1 | +1 | +0/+0/+4 | - | - | - | - |',
    },
  },
  Pugilist: {
    stamina: {
      path: 'en/unified/md/kit/pugilist.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +6 per echelon',
    },
    speed: {
      path: 'en/unified/md/kit/pugilist.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +2',
    },
    stability: {
      path: 'en/unified/md/kit/pugilist.md',
      heading: 'Kit Bonuses',
      quote: 'Stability Bonus: +1',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/pugilist.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +1/+1/+1',
    },
    rangedDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Pugilist | None | Unarmed strikes | +6 | +2 | +1 | +1/+1/+1 | - | - | - | - |',
    },
    meleeDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Pugilist | None | Unarmed strikes | +6 | +2 | +1 | +1/+1/+1 | - | - | - | - |',
    },
    rangedDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Pugilist | None | Unarmed strikes | +6 | +2 | +1 | +1/+1/+1 | - | - | - | - |',
    },
    disengage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Pugilist | None | Unarmed strikes | +6 | +2 | +1 | +1/+1/+1 | - | - | - | - |',
    },
  },
  Raden: {
    stamina: {
      path: 'en/unified/md/feature/fury/raden/kit-bonuses.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +3 per echelon',
    },
    speed: {
      path: 'en/unified/md/feature/fury/raden/kit-bonuses.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +3',
    },
    stability: null,
    meleeDamage: {
      path: 'en/unified/md/feature/fury/raden/kit-bonuses.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    rangedDamage: null,
    meleeDistance: null,
    rangedDistance: null,
    disengage: {
      path: 'en/unified/md/feature/fury/raden/kit-bonuses.md',
      heading: 'Kit Bonuses',
      quote: 'Disengage Bonus: +1',
    },
  },
  Raider: {
    stamina: {
      path: 'en/unified/md/kit/raider.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +6 per echelon',
    },
    speed: {
      path: 'en/unified/md/kit/raider.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +1',
    },
    stability: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Raider | Light, shield | Light | +6 | +1 | - | +1/+1/+1 | +1/+1/+1 | - | +5 | +1 |',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/raider.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +1/+1/+1',
    },
    rangedDamage: {
      path: 'en/unified/md/kit/raider.md',
      heading: 'Kit Bonuses',
      quote: 'Ranged Damage Bonus: +1/+1/+1',
    },
    meleeDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Raider | Light, shield | Light | +6 | +1 | - | +1/+1/+1 | +1/+1/+1 | - | +5 | +1 |',
    },
    rangedDistance: {
      path: 'en/unified/md/kit/raider.md',
      heading: 'Kit Bonuses',
      quote: 'Ranged Distance Bonus: +5',
    },
    disengage: {
      path: 'en/unified/md/kit/raider.md',
      heading: 'Kit Bonuses',
      quote: 'Disengage Bonus: +1',
    },
  },
  Ranger: {
    stamina: {
      path: 'en/unified/md/kit/ranger.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +6 per echelon',
    },
    speed: {
      path: 'en/unified/md/kit/ranger.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +1',
    },
    stability: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Ranger | Medium | Bow, medium | +6 | +1 | - | +1/+1/+1 | +1/+1/+1 | - | +5 | +1 |',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/ranger.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +1/+1/+1',
    },
    rangedDamage: {
      path: 'en/unified/md/kit/ranger.md',
      heading: 'Kit Bonuses',
      quote: 'Ranged Damage Bonus: +1/+1/+1',
    },
    meleeDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Ranger | Medium | Bow, medium | +6 | +1 | - | +1/+1/+1 | +1/+1/+1 | - | +5 | +1 |',
    },
    rangedDistance: {
      path: 'en/unified/md/kit/ranger.md',
      heading: 'Kit Bonuses',
      quote: 'Ranged Distance Bonus: +5',
    },
    disengage: {
      path: 'en/unified/md/kit/ranger.md',
      heading: 'Kit Bonuses',
      quote: 'Disengage Bonus: +1',
    },
  },
  'Rapid-Fire': {
    stamina: {
      path: 'en/unified/md/kit/rapid-fire.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +3 per echelon',
    },
    speed: {
      path: 'en/unified/md/kit/rapid-fire.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +1',
    },
    stability: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Rapid-Fire | Light | Bow | +3 | +1 | - | - | +2/+2/+2 | - | +7 | +1 |',
    },
    meleeDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Rapid-Fire | Light | Bow | +3 | +1 | - | - | +2/+2/+2 | - | +7 | +1 |',
    },
    rangedDamage: {
      path: 'en/unified/md/kit/rapid-fire.md',
      heading: 'Kit Bonuses',
      quote: 'Ranged Damage Bonus: +2/+2/+2',
    },
    meleeDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Rapid-Fire | Light | Bow | +3 | +1 | - | - | +2/+2/+2 | - | +7 | +1 |',
    },
    rangedDistance: {
      path: 'en/unified/md/kit/rapid-fire.md',
      heading: 'Kit Bonuses',
      quote: 'Ranged Distance Bonus: +7',
    },
    disengage: {
      path: 'en/unified/md/kit/rapid-fire.md',
      heading: 'Kit Bonuses',
      quote: 'Disengage Bonus: +1',
    },
  },
  Retiarius: {
    stamina: {
      path: 'en/unified/md/kit/retiarius.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +3 per echelon',
    },
    speed: {
      path: 'en/unified/md/kit/retiarius.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +1',
    },
    stability: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote:
        '| Retiarius | Light | Ensnaring, polearm | +3 | +1 | - | +2/+2/+2 | - | +1 | - | +1 |',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/retiarius.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    rangedDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote:
        '| Retiarius | Light | Ensnaring, polearm | +3 | +1 | - | +2/+2/+2 | - | +1 | - | +1 |',
    },
    meleeDistance: {
      path: 'en/unified/md/kit/retiarius.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Distance Bonus: +1',
    },
    rangedDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote:
        '| Retiarius | Light | Ensnaring, polearm | +3 | +1 | - | +2/+2/+2 | - | +1 | - | +1 |',
    },
    disengage: {
      path: 'en/unified/md/kit/retiarius.md',
      heading: 'Kit Bonuses',
      quote: 'Disengage Bonus: +1',
    },
  },
  'Shining Armor': {
    stamina: {
      path: 'en/unified/md/kit/shining-armor.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +12 per echelon',
    },
    speed: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Shining Armor | Heavy, shield | Medium | +12 | - | +1 | +2/+2/+2 | - | - | - | - |',
    },
    stability: {
      path: 'en/unified/md/kit/shining-armor.md',
      heading: 'Kit Bonuses',
      quote: 'Stability Bonus: +1',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/shining-armor.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    rangedDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Shining Armor | Heavy, shield | Medium | +12 | - | +1 | +2/+2/+2 | - | - | - | - |',
    },
    meleeDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Shining Armor | Heavy, shield | Medium | +12 | - | +1 | +2/+2/+2 | - | - | - | - |',
    },
    rangedDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Shining Armor | Heavy, shield | Medium | +12 | - | +1 | +2/+2/+2 | - | - | - | - |',
    },
    disengage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Shining Armor | Heavy, shield | Medium | +12 | - | +1 | +2/+2/+2 | - | - | - | - |',
    },
  },
  Sniper: {
    stamina: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Sniper | None | Bow | - | +1 | - | - | +0/+0/+4 | - | +10 | +1 |',
    },
    speed: {
      path: 'en/unified/md/kit/sniper.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +1',
    },
    stability: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Sniper | None | Bow | - | +1 | - | - | +0/+0/+4 | - | +10 | +1 |',
    },
    meleeDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Sniper | None | Bow | - | +1 | - | - | +0/+0/+4 | - | +10 | +1 |',
    },
    rangedDamage: {
      path: 'en/unified/md/kit/sniper.md',
      heading: 'Kit Bonuses',
      quote: 'Ranged Damage Bonus: +0/+0/+4',
    },
    meleeDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Sniper | None | Bow | - | +1 | - | - | +0/+0/+4 | - | +10 | +1 |',
    },
    rangedDistance: {
      path: 'en/unified/md/kit/sniper.md',
      heading: 'Kit Bonuses',
      quote: 'Ranged Distance Bonus: +10',
    },
    disengage: {
      path: 'en/unified/md/kit/sniper.md',
      heading: 'Kit Bonuses',
      quote: 'Disengage Bonus: +1',
    },
  },
  Spellsword: {
    stamina: {
      path: 'en/unified/md/kit/spellsword.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +6 per echelon',
    },
    speed: {
      path: 'en/unified/md/kit/spellsword.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +1',
    },
    stability: {
      path: 'en/unified/md/kit/spellsword.md',
      heading: 'Kit Bonuses',
      quote: 'Stability Bonus: +1',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/spellsword.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    rangedDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Spellsword | Light, shield | Medium | +6 | +1 | +1 | +2/+2/+2 | - | - | - | - |',
    },
    meleeDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Spellsword | Light, shield | Medium | +6 | +1 | +1 | +2/+2/+2 | - | - | - | - |',
    },
    rangedDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Spellsword | Light, shield | Medium | +6 | +1 | +1 | +2/+2/+2 | - | - | - | - |',
    },
    disengage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Spellsword | Light, shield | Medium | +6 | +1 | +1 | +2/+2/+2 | - | - | - | - |',
    },
  },
  'Stick and Robe': {
    stamina: {
      path: 'en/unified/md/kit/stick-and-robe.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +3 per echelon',
    },
    speed: {
      path: 'en/unified/md/kit/stick-and-robe.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +2',
    },
    stability: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Stick and Robe | Light | Polearm | +3 | +2 | - | +1/+1/+1 | - | +1 | - | +1 |',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/stick-and-robe.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +1/+1/+1',
    },
    rangedDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Stick and Robe | Light | Polearm | +3 | +2 | - | +1/+1/+1 | - | +1 | - | +1 |',
    },
    meleeDistance: {
      path: 'en/unified/md/kit/stick-and-robe.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Distance Bonus: +1',
    },
    rangedDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Stick and Robe | Light | Polearm | +3 | +2 | - | +1/+1/+1 | - | +1 | - | +1 |',
    },
    disengage: {
      path: 'en/unified/md/kit/stick-and-robe.md',
      heading: 'Kit Bonuses',
      quote: 'Disengage Bonus: +1',
    },
  },
  Swashbuckler: {
    stamina: {
      path: 'en/unified/md/kit/swashbuckler.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +3 per echelon',
    },
    speed: {
      path: 'en/unified/md/kit/swashbuckler.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +3',
    },
    stability: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Swashbuckler | Light | Medium | +3 | +3 | - | +2/+2/+2 | - | - | - | +1 |',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/swashbuckler.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    rangedDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Swashbuckler | Light | Medium | +3 | +3 | - | +2/+2/+2 | - | - | - | +1 |',
    },
    meleeDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Swashbuckler | Light | Medium | +3 | +3 | - | +2/+2/+2 | - | - | - | +1 |',
    },
    rangedDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Swashbuckler | Light | Medium | +3 | +3 | - | +2/+2/+2 | - | - | - | +1 |',
    },
    disengage: {
      path: 'en/unified/md/kit/swashbuckler.md',
      heading: 'Kit Bonuses',
      quote: 'Disengage Bonus: +1',
    },
  },
  'Sword and Board': {
    stamina: {
      path: 'en/unified/md/kit/sword-and-board.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +9 per echelon',
    },
    speed: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote:
        '| Sword and Board | Medium, shield | Medium | +9 | - | +1 | +2/+2/+2 | - | - | - | +1 |',
    },
    stability: {
      path: 'en/unified/md/kit/sword-and-board.md',
      heading: 'Kit Bonuses',
      quote: 'Stability Bonus: +1',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/sword-and-board.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    rangedDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote:
        '| Sword and Board | Medium, shield | Medium | +9 | - | +1 | +2/+2/+2 | - | - | - | +1 |',
    },
    meleeDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote:
        '| Sword and Board | Medium, shield | Medium | +9 | - | +1 | +2/+2/+2 | - | - | - | +1 |',
    },
    rangedDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote:
        '| Sword and Board | Medium, shield | Medium | +9 | - | +1 | +2/+2/+2 | - | - | - | +1 |',
    },
    disengage: {
      path: 'en/unified/md/kit/sword-and-board.md',
      heading: 'Kit Bonuses',
      quote: 'Disengage Bonus: +1',
    },
  },
  Vuken: {
    stamina: {
      path: 'en/unified/md/feature/fury/vuken/kit-bonuses.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +9 per echelon',
    },
    speed: {
      path: 'en/unified/md/feature/fury/vuken/kit-bonuses.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +2',
    },
    stability: null,
    meleeDamage: {
      path: 'en/unified/md/feature/fury/vuken/kit-bonuses.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +2/+2/+2',
    },
    rangedDamage: null,
    meleeDistance: null,
    rangedDistance: null,
    disengage: {
      path: 'en/unified/md/feature/fury/vuken/kit-bonuses.md',
      heading: 'Kit Bonuses',
      quote: 'Disengage Bonus: +1',
    },
  },
  'Warrior Priest': {
    stamina: {
      path: 'en/unified/md/kit/warrior-priest.md',
      heading: 'Kit Bonuses',
      quote: 'Stamina Bonus: +9 per echelon',
    },
    speed: {
      path: 'en/unified/md/kit/warrior-priest.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +1',
    },
    stability: {
      path: 'en/unified/md/kit/warrior-priest.md',
      heading: 'Kit Bonuses',
      quote: 'Stability Bonus: +1',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/warrior-priest.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +1/+1/+1',
    },
    rangedDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Warrior Priest | Heavy | Light | +9 | +1 | +1 | +1/+1/+1 | - | - | - | - |',
    },
    meleeDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Warrior Priest | Heavy | Light | +9 | +1 | +1 | +1/+1/+1 | - | - | - | - |',
    },
    rangedDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Warrior Priest | Heavy | Light | +9 | +1 | +1 | +1/+1/+1 | - | - | - | - |',
    },
    disengage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Warrior Priest | Heavy | Light | +9 | +1 | +1 | +1/+1/+1 | - | - | - | - |',
    },
  },
  Whirlwind: {
    stamina: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Whirlwind | None | Whip | - | +3 | - | +1/+1/+1 | - | +1 | - | +1 |',
    },
    speed: {
      path: 'en/unified/md/kit/whirlwind.md',
      heading: 'Kit Bonuses',
      quote: 'Speed Bonus: +3',
    },
    stability: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Whirlwind | None | Whip | - | +3 | - | +1/+1/+1 | - | +1 | - | +1 |',
    },
    meleeDamage: {
      path: 'en/unified/md/kit/whirlwind.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Damage Bonus: +1/+1/+1',
    },
    rangedDamage: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Whirlwind | None | Whip | - | +3 | - | +1/+1/+1 | - | +1 | - | +1 |',
    },
    meleeDistance: {
      path: 'en/unified/md/kit/whirlwind.md',
      heading: 'Kit Bonuses',
      quote: 'Melee Distance Bonus: +1',
    },
    rangedDistance: {
      path: 'en/unified/md/chapter/kits.md',
      heading: 'Kits Table',
      quote: '| Whirlwind | None | Whip | - | +3 | - | +1/+1/+1 | - | +1 | - | +1 |',
    },
    disengage: {
      path: 'en/unified/md/kit/whirlwind.md',
      heading: 'Kit Bonuses',
      quote: 'Disengage Bonus: +1',
    },
  },
};
