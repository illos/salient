// SPDX-License-Identifier: GPL-3.0-only
/**
 * V177 damage-type options (docs/build/V177-damage-type-options.md). Pure: the whole-section grammar
 * of a rolled ability's Effect section that sets the type of its damage, and the choice of one use.
 * There is no substring or ability-name dispatch: each section is matched whole and cites its
 * source.
 *
 * Source paths are relative to the pinned Compendium `en/unified/md`:
 * - rule/damage/damage-type.md: "abilities and effects note when they deal any of the following
 *   damage types: acid, cold, corruption, fire, holy, lightning, poison, psychic, or sonic."
 * - rule/damage/damage-immunity.md and rule/damage/damage-weakness.md: immunity and weakness apply
 *   to damage "of the indicated type"; the chosen type is applied through the same arithmetic
 *   (shared/resolve/index.ts `applyDamage`).
 */
import { plain } from './abilityGrammar.ts';

/** rule/damage/damage-type.md, the printed list. */
export const DAMAGE_TYPES = [
  'acid',
  'cold',
  'corruption',
  'fire',
  'holy',
  'lightning',
  'poison',
  'psychic',
  'sonic',
] as const;

/**
 * How one use's damage type is decided:
 * - `optional`: the user may have the damage be one of `options`; otherwise it is the printed
 *   untyped damage.
 * - `required`: the user chooses one of `options` for each use.
 * - `primordial`: the user's primordial damage type, fixed by their Stormwight kit; not chosen.
 */
export interface DamageTypeSpec {
  choice: 'optional' | 'required' | 'primordial';
  options: string[];
  /** The printed sentence, display markup removed. */
  text: string;
}

/**
 * The primordial damage type of each Stormwight kit's Primordial Storm feature (the feature names
 * are shared/content/classes/fury/stormwight.ts). feature/fury/stormwight-kits/primordial-storm.md:
 * "Each stormwight kit is associated with a primordial storm, which channels a specific damage type
 * used by some of your abilities."
 */
export const PRIMORDIAL_STORMS: readonly { feature: string; source: string; type: string }[] = [
  // feature/fury/boren/primordial-storm-blizzard.md: "Your primordial damage type is cold."
  {
    feature: 'Primordial Storm: Blizzard',
    source: 'feature/fury/boren/primordial-storm-blizzard.md',
    type: 'cold',
  },
  // feature/fury/corven/primordial-storm-anabatic-wind.md: "Your primordial damage type is fire."
  {
    feature: 'Primordial Storm: Anabatic Wind',
    source: 'feature/fury/corven/primordial-storm-anabatic-wind.md',
    type: 'fire',
  },
  // feature/fury/raden/primordial-storm-rat-flood.md: "Your primordial damage type is corruption."
  {
    feature: 'Primordial Storm: Rat Flood',
    source: 'feature/fury/raden/primordial-storm-rat-flood.md',
    type: 'corruption',
  },
  // feature/fury/vuken/primordial-storm-lightning-storm.md: "Your primordial damage type is
  // lightning."
  {
    feature: 'Primordial Storm: Lightning Storm',
    source: 'feature/fury/vuken/primordial-storm-lightning-storm.md',
    type: 'lightning',
  },
];

const TYPE = `(${DAMAGE_TYPES.join('|')})`;
const normalize = (text: string) => plain(text).replace(/\s+/g, ' ').trim();

/** "acid, cold, corruption, fire, lightning, poison, or sonic": every item a printed type. */
function typeList(text: string): string[] | undefined {
  const items = text.split(/,\s*(?:or\s+)?|\s+or\s+/).map(item => item.trim());
  return items.length > 1 &&
    items.every(item => (DAMAGE_TYPES as readonly string[]).includes(item)) &&
    new Set(items).size === items.length
    ? items
    : undefined;
}

/**
 * Whole Effect sections of rolled abilities. Matched whole: an added or changed sentence is not a
 * damage-type option the engine applies and stays manual.
 */
const SECTIONS: readonly {
  pattern: RegExp;
  read: (m: RegExpExecArray, text: string) => DamageTypeSpec | undefined;
}[] = [
  // feature/ability/conduit/level-1/ray-of-wrath.md: "You can have this ability deal holy damage."
  {
    pattern: new RegExp(`^You can have this ability deal ${TYPE} damage\\.$`),
    read: (m, text) => ({ choice: 'optional', options: [m[1]!], text }),
  },
  // feature/ability/elementalist/level-1/hurl-element.md: "When you make this strike, choose the
  // damage type from one of the following options: acid, cold, corruption, fire, lightning, poison,
  // or sonic."
  {
    pattern:
      /^When you make this strike, choose the damage type from one of the following options: ([a-z ,]+)\.$/,
    read: (m, text) => {
      const options = typeList(m[1]!);
      return options ? { choice: 'required', options, text } : undefined;
    },
  },
  // feature/ability/fury/level-2/visceral-roar.md: "This ability deals your primordial damage type
  // (see Stormwight Kits)."
  {
    pattern: /^This ability deals your primordial damage type \(see Stormwight Kits\)\.$/,
    read: (_m, text) => ({
      choice: 'primordial',
      options: PRIMORDIAL_STORMS.map(storm => storm.type),
      text,
    }),
  },
];

/** Reads one whole Effect section of a rolled ability as a damage-type option, or `undefined`. */
export function sectionDamageType(section: string): DamageTypeSpec | undefined {
  const text = normalize(section);
  for (const entry of SECTIONS) {
    const m = entry.pattern.exec(text);
    if (m) return entry.read(m, text);
  }
  return undefined;
}

export function sameDamageTypeSpec(a: DamageTypeSpec, b: DamageTypeSpec): boolean {
  return (
    a.choice === b.choice &&
    a.text === b.text &&
    a.options.length === b.options.length &&
    a.options.every((option, i) => option === b.options[i])
  );
}

/**
 * The section sets the type of the ability's damage, so it is admitted only when every tier opens
 * with printed damage that has no type of its own: the chosen type then applies to the damage of
 * whichever tier the roll gives, and to every target, since one use makes one choice.
 */
export function damageTypeAdmitted(
  tiers: readonly (readonly { kind: string; damageType?: string }[])[],
): boolean {
  return (
    tiers.length === 3 &&
    tiers.every(nodes => nodes[0]?.kind === 'damage' && nodes[0].damageType === undefined)
  );
}

/** The user's primordial damage type from their granted features, or `undefined`. */
export function primordialDamageType(
  features: readonly { name: string }[] | undefined,
): (typeof PRIMORDIAL_STORMS)[number] | undefined {
  const found = PRIMORDIAL_STORMS.filter(storm => features?.some(f => f.name === storm.feature));
  return found.length === 1 ? found[0] : undefined;
}

/**
 * One use's damage type: `type` (absent for the printed untyped damage), or the reason the use is
 * refused. `given` is the table's `damage-type=` value; `features` are the user's granted features.
 */
export function chooseDamageType(
  spec: DamageTypeSpec,
  given: string | undefined,
  features: readonly { name: string }[] | undefined,
  abilityName: string,
): { type?: string; note?: string } | { refusal: string } {
  const value = given?.trim().toLowerCase();
  if (spec.choice === 'primordial') {
    const storm = primordialDamageType(features);
    if (!storm)
      return {
        refusal: `${abilityName} deals your primordial damage type, which comes from your Stormwight kit's Primordial Storm (feature/fury/stormwight-kits/primordial-storm.md); this creature has none, so resolve it at the table.`,
      };
    if (value !== undefined && value !== storm.type)
      return {
        refusal: `${abilityName} deals your primordial damage type, ${storm.type} (${storm.feature}, ${storm.source}); it is not chosen at use.`,
      };
    return { type: storm.type, note: `${storm.feature}: ${storm.type}` };
  }
  if (value === undefined)
    return spec.choice === 'required'
      ? {
          refusal: `${abilityName} needs its damage type: give damage-type= one of ${spec.options.join(', ')}.`,
        }
      : {};
  if (!spec.options.includes(value))
    return {
      refusal: `${abilityName} can deal ${spec.options.join(', ')} damage${spec.choice === 'optional' ? ' (or its printed untyped damage, with no damage-type)' : ''}; "${given}" is not one of them.`,
    };
  return { type: value };
}
