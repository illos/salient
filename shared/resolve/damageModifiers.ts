// SPDX-License-Identifier: GPL-3.0-only
/**
 * V178 damage immunity and weakness (docs/build/V178-immunity-weakness.md). Pure: reads a foe stat
 * block's printed Immunity and Weakness cells into typed entries, maps a hero's evaluated immunities
 * and weaknesses onto the same entries, and adds extra damage to a hit already applied.
 *
 * Source paths are relative to the pinned Compendium `en/unified/md`:
 * - rule/damage/damage-immunity.md: "Damage immunity might have a damage type associated with it,
 *   expressed as "[damage type] immunity." Damage immunity often has a value associated with it, so
 *   that one creature's stat block notes "damage immunity 5" (representing immunity to all damage),
 *   while another creature has "lightning immunity 5."" and "If the value of the immunity is "all,"
 *   then the target ignores all damage of the indicated type."
 * - rule/damage/damage-weakness.md: "A creature who has "damage weakness X" with no specific type or
 *   keyword indicated has weakness of the indicated amount when they take damage of any type."
 * - rule/damage/damage-type.md: the nine damage types (shared/resolve/damageTypes.ts).
 * - feature/summoner/level-1/minions.md: "You use your own characteristics where a minion's stat
 *   block refers to an R". A foe row has no summoner, so an "R" value stays manual.
 */
import type { DamageApplication, DamageModifierEntry } from '../contracts/rollResolution.ts';
import { DAMAGE_TYPES } from './damageTypes.ts';

/** A printed cell read: its entries, or why it is left to the table (entries are then empty). */
export interface ModifierCell {
  entries: DamageModifierEntry[];
  unparsed?: string;
}

const strip = (cell: string) =>
  cell
    .replace(/\[([^\]]+)\]\([^\n)]*\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const ITEM = new RegExp(`^(${DAMAGE_TYPES.join('|')}|damage) (\\d+|all)$`, 'i');

/**
 * One printed Immunity or Weakness cell (the text between the bold markers before `<br>Immunity`
 * or `<br>Weakness`). "-" and "—" print none. Otherwise the cell is a comma-separated list whose
 * every item is "<type> <value>": a damage type from rule/damage/damage-type.md, or "Damage" for
 * the untyped "damage immunity/weakness" (`all-damage`), and a whole number or "all". Anything else
 * (a summoner's "R", a type without a value, a choice of types) is not read, and says why.
 */
export function parseModifierCell(label: 'Immunity' | 'Weakness', printed: string): ModifierCell {
  const cell = strip(printed);
  if (cell === '-' || cell === '—') return { entries: [] };
  const entries: DamageModifierEntry[] = [];
  for (const item of cell.split(',').map(part => part.trim())) {
    const match = ITEM.exec(item);
    // Only an immunity's value can be "all" (rule/damage/damage-immunity.md).
    if (match && !(label === 'Weakness' && match[2]!.toLowerCase() === 'all')) {
      const type = match[1]!.toLowerCase();
      const value = match[2]!.toLowerCase();
      entries.push({
        type: type === 'damage' ? 'all-damage' : type,
        value: value === 'all' ? 'all' : Number(value),
      });
      continue;
    }
    const reason = match
      ? `"all" is a value only an immunity has (rule/damage/damage-immunity.md)`
      : / R$/.test(item)
        ? `"${item}" is valued by the summoner's Reason (feature/summoner/level-1/minions.md), and this creature has no summoner in the app`
        : new RegExp(`^(${DAMAGE_TYPES.join('|')})$`, 'i').test(item)
          ? `"${item}" prints no value`
          : `"${item}" is not a damage type and a value`;
    return { entries: [], unparsed: `${label} "${cell}" (${reason})` };
  }
  return { entries };
}

/** The printed cell of a stat block's markdown, parsed; a missing cell is not read. */
export function statBlockModifiers(text: string, label: 'Immunity' | 'Weakness'): ModifierCell {
  const match = new RegExp(`\\*\\*([^*]*)\\*\\*<br>${label}`).exec(text);
  if (!match) return { entries: [], unparsed: `${label} cell not found in the stat block` };
  return parseModifierCell(label, match[1]!);
}

// ---------------------------------------------------------------------------------------------
// V178 review: stat blocks whose own traits or abilities change their damage immunity or weakness
// outside the printed cells. A silently wrong number is worse than a manual one, so damage to
// these stays manual, naming the feature. Quotes are the stat block's text with links and bold
// removed (tests/scripts/immunity-weakness.test.ts checks each against the ingested stat block).

/** One printed sentence that changes the creature's own immunity or weakness. */
export interface ModifierTrait {
  feature: string;
  text: string;
}

/**
 * Keyed by content id. Each gives the creature an immunity or weakness its cells don't print, or
 * takes one away, during play: a standing or conditional trait (Grave Ward, Of the Umbra, the
 * devils' True Name, Psionic Barrier), or an ability that grants it to the user (Primal Bay,
 * Adaptability, Break Armor). Interpretations (Q-IW-1 point 5): an ability targeting "Self or one
 * elemental", or an aura's "each war dog in the area", can reach the user.
 */
export const FOE_MODIFIER_TRAITS: Readonly<Record<string, readonly ModifierTrait[]>> = {
  'mcdm.monsters.v1/monster.count-rhodar-von-glauer.statblock/count-rhodar-von-glauer': [
    {
      feature: 'Grave Ward',
      text: 'Rhodar has damage immunity 5. If he takes holy damage, he loses this immunity until the end of the round.',
    },
    {
      feature: 'Sanguine Mist',
      text: 'Effect: Rhodar teleports to an unoccupied space in the area. If he has lost the damage immunity from his Grave Ward trait, he regains it.',
    },
  ],
  'mcdm.monsters.v1/monster.devil.statblock/devil-adjudicator': [
    {
      feature: 'True Name',
      text: "If a creature within 10 squares speaks the adjudicator's true name, the adjudicator loses their damage immunities, any nondamaging effects of their signature ability, and their Devilish Charm ability until the end of the encounter.",
    },
  ],
  'mcdm.monsters.v1/monster.devil.statblock/devil-clerk': [
    {
      feature: 'True Name',
      text: "If a creature within 10 squares speaks the clerk's true name, the clerk loses their fire immunity and any nondamaging effects of their signature ability until the end of the encounter.",
    },
  ],
  'mcdm.monsters.v1/monster.devil.statblock/devil-high-judge': [
    {
      feature: 'True Name',
      text: "If a creature within 10 squares speaks the high judge's true name, the high judge loses their damage immunities, any nondamaging effects of their signature ability, and their Devilish Suggestion triggered action until the end of the encounter.",
    },
  ],
  'mcdm.monsters.v1/monster.devil.statblock/devil-jurist': [
    {
      feature: 'True Name',
      text: "If a creature within 10 squares speaks the jurist's true name, the jurist loses their fire immunity, any nondamaging effects of their signature ability, and their Devilish Charm ability until the end of the encounter.",
    },
  ],
  'mcdm.monsters.v1/monster.devil.statblock/devil-legate': [
    {
      feature: 'Hellish Bailiff',
      text: 'The legate has damage immunity 3 while in one of the Seven Cities of Hell or within 10 squares of a non-minion devil who is of a higher level than them.',
    },
    {
      feature: 'True Name',
      text: "If a creature within 10 squares speaks the legate's true name, the legate loses their damage immunities, any nondamaging effects of their signature ability, and their Devilish Charm ability until the end of the encounter.",
    },
  ],
  'mcdm.monsters.v1/monster.devil.statblock/devil-magistrate': [
    {
      feature: 'True Name',
      text: "If a creature within 10 squares speaks the magistrate's true name, the magistrate loses their damage immunities, any nondamaging effects of their signature ability, and their Devilish Charm ability until the end of the encounter.",
    },
  ],
  'mcdm.monsters.v1/monster.devil.statblock/devil-notary': [
    {
      feature: 'True Name',
      text: "If a creature within 10 squares speaks the notary's true name, the notary loses their fire immunity and any nondamaging effects of their signature ability until the end of the encounter.",
    },
  ],
  'mcdm.monsters.v1/monster.devil.statblock/devil-scrivener': [
    {
      feature: 'True Name',
      text: "If a creature within 10 squares speaks the scrivener's true name, the scrivener loses their fire immunity and any nondamaging effects of their signature ability until the end of the encounter.",
    },
  ],
  'mcdm.monsters.v1/monster.draconian.statblock/locratix-the-morningstar': [
    {
      feature: 'Absorbing Scales',
      text: 'When Locratix takes damage of any type for which she has damage immunity, she has damage immunity 6 against the next strike made against her.',
    },
  ],
  'mcdm.monsters.v1/monster.draconian.statblock/phrrygalax-the-subduer': [
    {
      feature: 'Armor of the Ancients',
      text: 'Effect: Phrrygalax takes no damage and instead regains the same amount of Stamina. He then swaps his current damage immunity with the triggering damage type.',
    },
  ],
  'mcdm.monsters.v1/monster.dragon.statblock/crucible-dragon': [
    {
      feature: 'Subdermal Shielding',
      text: "Effect: Shields embedded under the dragon's scales emerge, and the dragon gains damage immunity 6 at the start of each round until the end of the encounter. If the dragon takes any damage, they lose this immunity until the end of the current round.",
    },
  ],
  'mcdm.monsters.v1/monster.elemental.statblock/crux-of-fire': [
    {
      feature: 'Convocation of Flames',
      text: "Effect: Until the start of the crux's next turn, the target has fire immunity 5.",
    },
  ],
  'mcdm.monsters.v1/monster.elemental.statblock/essence-of-storms': [
    {
      feature: 'Convocation of Squalls',
      text: "Effect: Until the start of the essence's next turn, the target has lightning immunity 5.",
    },
  ],
  'mcdm.monsters.v1/monster.elemental.statblock/essence-of-tides': [
    {
      feature: 'Convocation of Waves',
      text: "Effect: Until the start of the essence's next turn, the target has cold immunity 5.",
    },
  ],
  'mcdm.monsters.v1/monster.elemental.statblock/force-of-earth': [
    {
      feature: 'Break Armor',
      text: 'Effect: The force halves the damage, and has damage weakness 3 and a +3 bonus to speed until the end of the encounter. This damage weakness increases by 3 each time the force uses this ability in the same encounter.',
    },
  ],
  'mcdm.monsters.v1/monster.elf-shadow.statblock/shadow-elf-assassin': [
    {
      feature: 'Of the Umbra',
      text: 'The assassin ignores concealment created by darkness. While the assassin is in direct sunlight, they have damage weakness 3. While the assassin has concealment, they have damage immunity 3.',
    },
  ],
  'mcdm.monsters.v1/monster.elf-shadow.statblock/shadow-elf-cloak': [
    {
      feature: 'Of the Umbra',
      text: 'The cloak ignores concealment created by darkness. While the cloak is in direct sunlight, they have damage weakness 3. While the cloak has concealment, they have damage immunity 3.',
    },
  ],
  'mcdm.monsters.v1/monster.elf-shadow.statblock/shadow-elf-dusk-mage': [
    {
      feature: 'Of the Umbra',
      text: 'The dusk mage ignores concealment created by darkness. While the dusk mage is in direct sunlight, they have damage weakness 3. While the dusk mage has concealment, they have damage immunity 3.',
    },
  ],
  'mcdm.monsters.v1/monster.elf-shadow.statblock/shadow-elf-duskcaller': [
    {
      feature: 'Of the Umbra',
      text: 'The duskcaller ignores concealment created by darkness. While the duskcaller is in direct sunlight, they have damage weakness 3. While the duskcaller has concealment, they have damage immunity 3.',
    },
  ],
  'mcdm.monsters.v1/monster.elf-shadow.statblock/shadow-elf-eclipse': [
    {
      feature: 'Of the Umbra',
      text: 'The eclipse ignores concealment created by darkness. While the eclipse is in direct sunlight, they have damage weakness 3. While the eclipse has concealment, they have damage immunity 3.',
    },
  ],
  'mcdm.monsters.v1/monster.elf-shadow.statblock/shadow-elf-knightfell': [
    {
      feature: 'Of the Umbra',
      text: 'The knightfell ignores concealment created by darkness. While the knightfell is in direct sunlight, they have damage weakness 3. While the knightfell has concealment, they have damage immunity 3.',
    },
  ],
  'mcdm.monsters.v1/monster.elf-shadow.statblock/shadow-elf-luminator': [
    {
      feature: 'Of the Umbra',
      text: 'The luminator ignores concealment created by darkness. While the luminator is in direct sunlight, they have damage weakness 3. While the luminator has concealment, they have damage immunity 3.',
    },
  ],
  'mcdm.monsters.v1/monster.elf-shadow.statblock/shadow-elf-moondancer': [
    {
      feature: 'Of the Umbra',
      text: 'The moondancer ignores concealment created by darkness. While the moondancer is in direct sunlight, they have damage weakness 3. While the moondancer has concealment, they have damage immunity 3.',
    },
  ],
  'mcdm.monsters.v1/monster.elf-shadow.statblock/shadow-elf-mournblade': [
    {
      feature: 'Of the Umbra',
      text: 'The mournblade ignores concealment created by darkness. While the mournblade is in direct sunlight, they have damage weakness 3. While the mournblade has concealment, they have damage immunity 3.',
    },
  ],
  'mcdm.monsters.v1/monster.elf-shadow.statblock/shadow-elf-nightstrike': [
    {
      feature: 'Of the Umbra',
      text: 'The nightstrike ignores concealment created by darkness. While the nightstrike is in direct sunlight, they have damage weakness 3. While the nightstrike has concealment, they have damage immunity 3.',
    },
  ],
  'mcdm.monsters.v1/monster.elf-shadow.statblock/shadow-elf-noctis-mage': [
    {
      feature: 'Of the Umbra',
      text: 'The noctis mage ignores concealment created by darkness. While the noctis mage is in direct sunlight, they have damage weakness 3. While the noctis mage has concealment, they have damage immunity 3.',
    },
  ],
  'mcdm.monsters.v1/monster.elf-shadow.statblock/shadow-elf-panther': [
    {
      feature: 'Of the Umbra',
      text: 'The panther ignores concealment created by darkness. While the panther is in direct sunlight, they have damage weakness 3. While the panther has concealment, they have damage immunity 3.',
    },
  ],
  'mcdm.monsters.v1/monster.elf-shadow.statblock/shadow-elf-sniper': [
    {
      feature: 'Of the Umbra',
      text: 'The sniper ignores concealment created by darkness. While the sniper is in direct sunlight, they have damage weakness 3. While the sniper has concealment, they have damage immunity 3.',
    },
  ],
  'mcdm.monsters.v1/monster.giant.statblock/marble-stone-giant': [
    {
      feature: 'Break Armor',
      text: 'Effect: The marble stone giant halves the damage, and has damage weakness 3 and a +3 bonus to speed until the end of the encounter. The damage weakness increases by 3 each time the marble stone giant uses this ability in the same encounter.',
    },
  ],
  'mcdm.monsters.v1/monster.human.statblock/human-bandit-chief': [
    {
      feature: 'Form Up!',
      text: 'Effect: Each target shifts up to their speed. Additionally, until the end of the encounter, while the bandit chief or any ally is adjacent to a target, they have damage immunity 2.',
    },
  ],
  'mcdm.monsters.v1/monster.kobold.statblock/kobold-centurion': [
    {
      feature: 'Testudo!',
      text: 'Effect: Each target shifts up to 2 squares before the damage is resolved. Each kobold with the Shield? Shield! trait gains damage immunity 2 against the triggering ability.',
    },
    {
      feature: 'Are You Not Entertained?!',
      text: 'Effect: A target who has P < 2 is taunted (save ends). Each ally within distance can make a free strike. Additionally, until the end of the encounter, the centurion has damage immunity 2.',
    },
  ],
  'mcdm.monsters.v1/monster.lich.statblock/lich': [
    {
      feature: 'Necrotic Form',
      text: 'Effect: The lich becomes spectral, moves up to their speed, and becomes corporeal again. While spectral, the lich automatically ends the grabbed or restrained conditions, has damage immunity 5, can move through solid matter, and ignores difficult terrain. If the lich ends this movement inside solid matter, they are shunted out into the space from which they entered it.',
    },
  ],
  'mcdm.monsters.v1/monster.lord-syuul.statblock/lord-syuul': [
    {
      feature: 'Adaptability',
      text: 'Effect: Until the start of his next turn, Lord Syuul gains immunity 5 to the triggering damage type.',
    },
  ],
  'mcdm.monsters.v1/monster.minotaur.statblock/minotaur-sunderer': [
    {
      feature: 'Fearsome Bay',
      text: 'Effect: Until the end of their next turn, the minotaur has damage immunity 2 and deals an extra 5 damage with strikes.',
    },
  ],
  'mcdm.monsters.v1/monster.minotaur.statblock/minotaur': [
    {
      feature: 'Primal Bay',
      text: 'Effect: Until the end of their next turn, the minotaur has damage immunity 2 and deals an extra 5 damage with strikes. On their next turn, the minotaur can use one additional maneuver.',
    },
  ],
  'mcdm.monsters.v1/monster.ogre.statblock/ogre-blue-blood': [
    {
      feature: 'Royal Anger',
      text: 'The blue blood has damage immunity 2 while their squad has three or fewer minions in it.',
    },
  ],
  'mcdm.monsters.v1/monster.ogre.statblock/ogre-goon': [
    { feature: 'Defiant Anger', text: 'While winded, the goon has damage immunity 2.' },
  ],
  'mcdm.monsters.v1/monster.ogre.statblock/ogre-juggernaut': [
    { feature: 'Defiant Anger', text: 'While winded, the juggernaut has damage immunity 2.' },
  ],
  'mcdm.monsters.v1/monster.ogre.statblock/ogre-tantrum': [
    {
      feature: 'Excessive Anger',
      text: 'The tantrum has damage immunity 3 and speed 8 while their squad has two or fewer minions in it.',
    },
  ],
  // Psychic Pulse's other clauses (weakened, slimed) are the targets'; this one is the olothec's.
  'mcdm.monsters.v1/monster.olothec.statblock/olothec': [
    {
      feature: 'Psychic Pulse',
      text: 'Additionally, until the start of their next turn, the olothec has damage immunity 4.',
    },
  ],
  'mcdm.monsters.v1/monster.retainer.statblock/devil-defector': [
    {
      feature: 'True Name',
      text: "If a creature within 10 squares speaks the defector's true name, the defector loses their damage immunities and their Tempting Offer triggered action until the end of the encounter.",
    },
  ],
  'mcdm.monsters.v1/monster.retainer.statblock/shadow-elf-shade': [
    {
      feature: 'Of the Umbra',
      text: 'The shade ignores concealment created by darkness. While the shade is in direct sunlight, they have damage weakness 3. While the shade has concealment, they have damage immunity 3.',
    },
  ],
  'mcdm.monsters.v1/monster.undead.4th-echelon.statblock/bonecage': [
    {
      feature: 'Ribcage Chomp',
      text: "Effect: The bonecage can have up to four size 1 targets grabbed at once. Any creature grabbed by the bonecage takes a bane on the Escape Grab maneuver, and the bonecage has damage immunity 5 against that creature's abilities. When the bonecage is force moved, any creature or object they have grabbed moves with them.",
    },
  ],
  'mcdm.monsters.v1/monster.voiceless-talker.statblock/voiceless-talker-evolutionist': [
    {
      feature: 'Adaptability',
      text: 'Effect: Until the start of their next turn, the evolutionist has damage immunity 5 to the triggering damage type.',
    },
  ],
  'mcdm.monsters.v1/monster.war-dog.2nd-echelon.statblock/war-dog-doomthief': [
    {
      feature: 'Expanding Doom',
      text: 'Effect: The doomthief has damage immunity 4 and the size of the aura from their Doom Magnet trait increases by 3, both until the start of their next turn.',
    },
  ],
  'mcdm.monsters.v1/monster.war-dog.2nd-echelon.statblock/war-dog-tetrarch': [
    {
      feature: 'You Would Dare?!',
      text: 'Effect: Until the end of the encounter, the tetrarch has damage immunity 2, and their Houndblade ability targets three creatures or objects.',
    },
  ],
  'mcdm.monsters.v1/monster.war-dog.3rd-echelon.statblock/war-dog-iron-priest': [
    { feature: 'Iron Banner', text: '- The target has damage immunity 2.' },
  ],
  'mcdm.monsters.v1/monster.war-dog.4th-echelon.statblock/castellan-hoplon': [
    {
      feature: 'Summon the Onyx Tower',
      text: 'Effect: A 10-square-tall tower made of black stone shimmers into being in an unoccupied space that is 5 squares on a side. The tower has three floors, an entrance in the middle of each side on the ground floor, and a crenelated rooftop. Any war dog inside or adjacent to the tower has damage immunity 2 and regains 5 Stamina at the start of each of their turns, and war dogs inside the tower can observe through and have line of effect through its walls. This ability can be used only once per encounter.',
    },
    {
      feature: 'Last Stand',
      text: 'The first time in an encounter that Hoplon is reduced to 0 Stamina, he instead has 1 Stamina and gains damage immunity 10 until the end of his next turn. When Hoplon is reduced to 0 Stamina again, each ally within 5 squares of him gains damage immunity 3 and deals an extra 5 damage on strikes, all until the end of the encounter.',
    },
  ],
  'mcdm.monsters.v1/monster.war-dog.4th-echelon.statblock/soulbinder-psyche': [
    {
      feature: 'Spirit Form',
      text: 'Effect: Psyche moves up to 5 squares, and has damage immunity 5 and ignores difficult terrain during this movement. The first time she moves through any creature during this movement, that creature takes 5 corruption damage.',
    },
  ],
  'mcdm.monsters.v1/monster.war-dog.4th-echelon.statblock/strategos-alkestis': [
    {
      feature: "The Silver Wolf's Final Stratagem",
      text: "Effect: Until the start of the next round, each target enemy who has I < 4 is dazed, each target enemy who has M < 4 is restrained, and each target enemy who has A < 4 can't use triggered actions. Additionally, until the end of the encounter, Alkestis and each target ally have damage immunity 3 and deal an extra 5 damage with strikes.",
    },
  ],
  'mcdm.monsters.v1/monster.xorannox-the-tyract.statblock/compulsion-eye': [
    {
      feature: 'Psionic Barrier',
      text: 'The compulsion eye has damage immunity 15. When they use a main action, they lose this immunity until the end of the round.',
    },
  ],
  'mcdm.monsters.v1/monster.xorannox-the-tyract.statblock/demolition': [
    {
      feature: 'Psionic Barrier',
      text: 'The demolition eye has damage immunity 15. When they use a main action, they lose this immunity until the end of the round.',
    },
  ],
  'mcdm.monsters.v1/monster.xorannox-the-tyract.statblock/mover-eye': [
    {
      feature: 'Psionic Barrier',
      text: 'The mover eye has damage immunity 15. When they use a main action, they lose this immunity until the end of the round.',
    },
  ],
  'mcdm.monsters.v1/monster.xorannox-the-tyract.statblock/necrotic-eye': [
    {
      feature: 'Psionic Barrier',
      text: 'The necrotic eye has damage immunity 15. When they use a main action, they lose this immunity until the end of the round.',
    },
  ],
  'mcdm.monsters.v1/monster.xorannox-the-tyract.statblock/toxic-eye': [
    {
      feature: 'Psionic Barrier',
      text: 'The toxic eye has damage immunity 15. When they use a main action, they lose this immunity until the end of the round.',
    },
  ],
  'mcdm.monsters.v1/monster.xorannox-the-tyract.statblock/zapper-eye': [
    {
      feature: 'Psionic Barrier',
      text: 'The zapper eye has damage immunity 15. When they use a main action, they lose this immunity until the end of the round.',
    },
  ],
};

const TARGET =
  'the immunity or weakness is given to the targets, enemies or creatures the ability affects, not to this creature';
const TEST =
  'a target with an immunity obtains a test outcome; this creature’s own damage is unchanged';
const DEALT =
  'this creature’s damage ignores immunity: the dealer’s side, not this creature’s cells';
const OBJECT =
  'an object the creature makes or carries has the immunity or weakness, not the creature';
const NAME =
  'only a feature’s name (“Exploit Weakness”) matches; its text grants no immunity or weakness';
const OTHER =
  'another creature (a rider or an ally) has the immunity: that creature’s damage is not tracked here (Q-IW-1 point 5)';

/**
 * Stat blocks whose text mentions immunity or weakness and was reviewed as not changing the
 * creature's own damage facts, each with its reason.
 */
export const FOE_MODIFIER_MENTIONS_REVIEWED: Readonly<Record<string, string>> = {
  'mcdm.monsters.v1/monster.bugbear.statblock/bugbear-channeler': TARGET,
  'mcdm.monsters.v1/monster.demon.2nd-echelon.statblock/bale-eye': TARGET,
  'mcdm.monsters.v1/monster.demon.4th-echelon.statblock/optacus': DEALT,
  'mcdm.monsters.v1/monster.draconian.statblock/myxovidan-the-sintaker': TARGET,
  'mcdm.monsters.v1/monster.dragon.statblock/gloom-dragon': TARGET,
  'mcdm.monsters.v1/monster.elf-high.statblock/elemental-mote': TARGET,
  'mcdm.monsters.v1/monster.elf-high.statblock/high-elf-bloodletter': TARGET,
  'mcdm.monsters.v1/monster.elf-wode.statblock/wodenelg': OTHER,
  'mcdm.monsters.v1/monster.giant.statblock/basalt-stone-giant': OBJECT,
  'mcdm.monsters.v1/monster.giant.statblock/fire-giant-red-fist': TEST,
  'mcdm.monsters.v1/monster.giant.statblock/frost-giant-storm-hurler': OBJECT,
  'mcdm.monsters.v1/monster.hobgoblin.statblock/hobgoblin-brandbearer': TARGET,
  'mcdm.monsters.v1/monster.hobgoblin.statblock/hobgoblin-war-mage': TARGET,
  'mcdm.monsters.v1/monster.hobgoblin.statblock/slaughter-demon': TARGET,
  'mcdm.monsters.v1/monster.kingfissure-worm.statblock/kingfissure-worm': OBJECT,
  'mcdm.monsters.v1/monster.kobold.statblock/kobold-adeptus': DEALT,
  'mcdm.monsters.v1/monster.retainer.statblock/hobgoblin-flameslinger': TARGET,
  'mcdm.monsters.v1/monster.rival.1st-echelon.statblock/rival-elementalist': TARGET,
  'mcdm.monsters.v1/monster.rival.2nd-echelon.statblock/rival-elementalist': TARGET,
  'mcdm.monsters.v1/monster.rival.3rd-echelon.statblock/rival-elementalist': TARGET,
  'mcdm.monsters.v1/monster.rival.4th-echelon.statblock/rival-elementalist': TARGET,
  'mcdm.monsters.v1/monster.rival.3rd-echelon.statblock/rival-shadow': NAME,
  'mcdm.monsters.v1/monster.rival.4th-echelon.statblock/rival-shadow': NAME,
  'mcdm.monsters.v1/monster.shambling-mound.statblock/shambling-mound': OBJECT,
  'mcdm.monsters.v1/monster.undead.4th-echelon.statblock/giant-shambler-zombie': OTHER,
  'mcdm.monsters.v1/monster.war-dog.1st-echelon.statblock/war-dog-neuronite': OTHER,
  'mcdm.monsters.v1/monster.war-dog.3rd-echelon.statblock/war-dog-firestarter': TARGET,
  'mcdm.monsters.v1/monster.war-dog.3rd-echelon.statblock/war-dog-taxiarch': TARGET,
};

/** The manual reason for a foe whose own features change its immunity or weakness, if any. */
export function foeModifierTraitReason(contentId: string): string | undefined {
  const traits = FOE_MODIFIER_TRAITS[contentId];
  if (!traits) return undefined;
  const names = [...new Set(traits.map(trait => trait.feature))];
  return `${names.join(' and ')} change${names.length === 1 ? 's' : ''} its damage immunity or weakness during play (“${traits[0]!.text}”)`;
}

/**
 * Hero complications whose immunity or weakness changes during play, so the evaluated value can be
 * wrong: complication/corrupted-mentor.md, "You have holy weakness 1. Each time you use Corrupt
 * Spirit, your holy weakness increases by 1, to a maximum equal to your recovery value. Whenever you
 * take holy damage, this weakness resets to 1." The app doesn't track the current value.
 */
export const HERO_MODIFIER_TRAITS: readonly { name: string; text: string }[] = [
  {
    name: 'Corrupted Mentor',
    text: 'Each time you use Corrupt Spirit, your holy weakness increases by 1, to a maximum equal to your recovery value.',
  },
];

/** The manual reason for a hero whose evaluated immunities or weaknesses come from such a source. */
export function heroModifierTraitReason(
  lists: readonly (
    | readonly { damageType?: string; value: { value?: number; provenance?: readonly unknown[] } }[]
    | undefined
  )[],
): string | undefined {
  const provenance = JSON.stringify(
    lists.flatMap(list => (list ?? []).map(i => i.value.provenance)),
  );
  const found = HERO_MODIFIER_TRAITS.find(
    trait => provenance.includes(`"selection":"${trait.name}"`) || provenance.includes(trait.text),
  );
  return found
    ? `${found.name} changes their damage weakness during play (“${found.text}”)`
    : undefined;
}

/**
 * A hero's evaluated immunities or weaknesses as damage entries. Complications write the untyped
 * "damage weakness" as `allDamage` (shared/content/supporting-complications.ts, Cursed Weapon:
 * "You have damage weakness 2.").
 */
export function heroModifierEntries(
  list: readonly { damageType: string; value: { value: number } }[] | undefined,
): DamageModifierEntry[] {
  return (list ?? []).map(item => ({
    type: item.damageType === 'allDamage' ? 'all-damage' : item.damageType,
    value: item.value.value,
  }));
}

/**
 * Extra damage added to a hit already applied, as one damage (the Mark's "The ability deals extra
 * damage", feature/ability/tactician/level-1/mark.md). The hit's saved weakness and immunity apply
 * once to the total (rule/damage/damage-weakness.md: weakness first, then immunity), so the extra
 * Stamina taken is the total after immunity less what the hit already took after immunity. A hit
 * that took no damage before immunity had no weakness applied, so its weakness value is unknown:
 * `undefined` then, and the table adds it.
 */
export function extraDamageAfterModifiers(
  hit: DamageApplication,
  extra: number,
): number | undefined {
  if (hit.incoming <= 0) return undefined;
  if (hit.immunityApplied === 'all') return 0;
  const total = Math.max(0, hit.incoming + extra + hit.weaknessApplied - hit.immunityApplied);
  return total - hit.afterImmunity;
}
