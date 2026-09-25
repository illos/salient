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
