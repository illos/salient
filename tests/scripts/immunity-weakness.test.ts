// SPDX-License-Identifier: GPL-3.0-only
/**
 * V178 damage immunity and weakness. Expected values come from the printed stat-block cells (the
 * ingested pinned Compendium, shared/content/compendium/statblock.json) and the rule text
 * (pinned `en/unified/md`):
 * - rule/damage/damage-immunity.md: "one creature's stat block notes "damage immunity 5"
 *   (representing immunity to all damage), while another creature has "lightning immunity 5."";
 *   "they can reduce the damage by the value of the immunity (to a minimum of 0 damage)"; "If the
 *   value of the immunity is "all," then the target ignores all damage of the indicated type.";
 *   "If multiple damage immunities apply to a source of damage, only the immunity with the highest
 *   value applies. For instance, a creature with damage immunity 5 and fire immunity 10 who takes
 *   12 fire damage reduces the damage by 10 points."; "if your hero has fire immunity 5 and takes 8
 *   fire damage, they take 3 damage".
 * - rule/damage/damage-weakness.md: "if a creature has fire weakness 5 and is dealt 10 fire damage,
 *   they take 15 fire damage instead."; "If a creature has both damage immunity and damage weakness
 *   for a source of damage, apply the weakness first, then the immunity."
 * - feature/summoner/level-1/minions.md: "You use your own characteristics where a minion's stat
 *   block refers to an R".
 */
import { describe, expect, test } from 'vitest';
import statblocks from '../../shared/content/compendium/statblock.json' with { type: 'json' };
import {
  extraDamageAfterModifiers,
  FOE_MODIFIER_MENTIONS_REVIEWED,
  FOE_MODIFIER_TRAITS,
  foeModifierTraitReason,
  heroModifierEntries,
  heroModifierTraitReason,
  parseModifierCell,
  statBlockModifiers,
} from '../../shared/resolve/damageModifiers.ts';
import { applyDamage } from '../../shared/resolve/index.ts';
import { halveApplication } from '../../shared/resolve/damageRevision.ts';
import type {
  DamageModifierEntry,
  DamageTargetFacts,
} from '../../shared/contracts/rollResolution.ts';

type Expected = DamageModifierEntry[] | RegExp;

/**
 * Every distinct Immunity and Weakness cell the ingested stat blocks print, as printed, with what it
 * reads as: the entries its text states, or the reason it stays manual.
 */
const PRINTED: Record<'Immunity' | 'Weakness', Record<string, Expected>> = {
  Immunity: {
    '-': [],
    '—': [],
    'Acid 2': [{ type: 'acid', value: 2 }],
    'Acid 2, Poison 2': [
      { type: 'acid', value: 2 },
      { type: 'poison', value: 2 },
    ],
    'Acid 3': [{ type: 'acid', value: 3 }],
    'Acid 5': [{ type: 'acid', value: 5 }],
    'Acid 6': [{ type: 'acid', value: 6 }],
    'Acid R': /summoner's Reason/,
    'Cold 5': [{ type: 'cold', value: 5 }],
    'Cold 6': [{ type: 'cold', value: 6 }],
    'Cold 8': [{ type: 'cold', value: 8 }],
    'Cold, fire, or lightning': /"Cold" prints no value/,
    'Corruption 1, poison 1': [
      { type: 'corruption', value: 1 },
      { type: 'poison', value: 1 },
    ],
    'Corruption 1, psychic 1': [
      { type: 'corruption', value: 1 },
      { type: 'psychic', value: 1 },
    ],
    'Corruption 10, poison 10': [
      { type: 'corruption', value: 10 },
      { type: 'poison', value: 10 },
    ],
    'Corruption 2, psychic 2': [
      { type: 'corruption', value: 2 },
      { type: 'psychic', value: 2 },
    ],
    'Corruption 3, poison 3': [
      { type: 'corruption', value: 3 },
      { type: 'poison', value: 3 },
    ],
    'Corruption 3, psychic 3': [
      { type: 'corruption', value: 3 },
      { type: 'psychic', value: 3 },
    ],
    'Corruption 4, poison 4': [
      { type: 'corruption', value: 4 },
      { type: 'poison', value: 4 },
    ],
    'Corruption 4, psychic 4': [
      { type: 'corruption', value: 4 },
      { type: 'psychic', value: 4 },
    ],
    'Corruption 6': [{ type: 'corruption', value: 6 }],
    'Corruption 6, poison 6': [
      { type: 'corruption', value: 6 },
      { type: 'poison', value: 6 },
    ],
    'Corruption 7, poison 7': [
      { type: 'corruption', value: 7 },
      { type: 'poison', value: 7 },
    ],
    'Corruption 9, poison 9': [
      { type: 'corruption', value: 9 },
      { type: 'poison', value: 9 },
    ],
    'Corruption R, Poison R': /summoner's Reason/,
    'Damage 2, Corruption R, Poison R': /"Corruption R" is valued by the summoner's Reason/,
    'Damage 3': [{ type: 'all-damage', value: 3 }],
    'Fire 10': [{ type: 'fire', value: 10 }],
    'Fire 2': [{ type: 'fire', value: 2 }],
    'Fire 4': [{ type: 'fire', value: 4 }],
    'Fire 5': [{ type: 'fire', value: 5 }],
    'Fire 6': [{ type: 'fire', value: 6 }],
    'Fire 8': [{ type: 'fire', value: 8 }],
    'Fire 9': [{ type: 'fire', value: 9 }],
    'Fire R': /summoner's Reason/,
    'Fire R, Sonic R': /summoner's Reason/,
    'Lightning 3, Poison 2': [
      { type: 'lightning', value: 3 },
      { type: 'poison', value: 2 },
    ],
    'Lightning 4': [{ type: 'lightning', value: 4 }],
    'Lightning 5': [{ type: 'lightning', value: 5 }],
    'Lightning 6': [{ type: 'lightning', value: 6 }],
    'Poison 2': [{ type: 'poison', value: 2 }],
    'Poison 3': [{ type: 'poison', value: 3 }],
    'Poison 4': [{ type: 'poison', value: 4 }],
    'Poison 5': [{ type: 'poison', value: 5 }],
    'Poison 6': [{ type: 'poison', value: 6 }],
    'Poison R': /summoner's Reason/,
    'Psychic 10': [{ type: 'psychic', value: 10 }],
    'Psychic 2': [{ type: 'psychic', value: 2 }],
    'Psychic 3': [{ type: 'psychic', value: 3 }],
    'Psychic 5': [{ type: 'psychic', value: 5 }],
    'Psychic 6': [{ type: 'psychic', value: 6 }],
    'Psychic 8': [{ type: 'psychic', value: 8 }],
    'Sonic R': /summoner's Reason/,
    'Sonic R, Cold R': /summoner's Reason/,
  },
  Weakness: {
    '-': [],
    '—': [],
    // Troll stat blocks print the fire weakness without a value (frontmatter: "Acid 5", "fire").
    'Acid 5, fire ': /"fire" prints no value/,
    'Acid 8, fire ': /"fire" prints no value/,
    'Fire 1': [{ type: 'fire', value: 1 }],
    'Fire 5': [{ type: 'fire', value: 5 }],
    'Holy 1': [{ type: 'holy', value: 1 }],
    'Holy 3': [{ type: 'holy', value: 3 }],
    'Holy 5': [{ type: 'holy', value: 5 }],
  },
};

const cellOf = (text: string, label: string) =>
  new RegExp(`\\*\\*([^*]*)\\*\\*<br>${label}`).exec(text)?.[1];

describe('printed stat-block cells', () => {
  test('every distinct printed cell is enumerated here, and reads as its text says', () => {
    for (const label of ['Immunity', 'Weakness'] as const) {
      const printed = new Set(
        (statblocks as { text: string }[])
          .map(entry => cellOf(entry.text, label))
          .filter((cell): cell is string => cell !== undefined),
      );
      expect([...printed].sort()).toEqual(Object.keys(PRINTED[label]).sort());
      for (const [cell, expected] of Object.entries(PRINTED[label])) {
        const read = parseModifierCell(label, cell);
        if (expected instanceof RegExp) {
          expect(read.entries, cell).toEqual([]);
          expect(read.unparsed, cell).toMatch(expected);
          expect(read.unparsed, cell).toContain(`${label} "${cell.trim()}"`);
        } else {
          expect(read, cell).toEqual({ entries: expected });
        }
      }
    }
  });

  test('a real stat block: the Mummy prints both cells', () => {
    // monster/undead/2nd-echelon/statblock/mummy.md: "Corruption 4, poison 4" immunity, "Fire 5"
    // weakness.
    const mummy = (statblocks as { name: string; text: string }[]).find(e => e.name === 'Mummy')!;
    expect(statBlockModifiers(mummy.text, 'Immunity').entries).toEqual([
      { type: 'corruption', value: 4 },
      { type: 'poison', value: 4 },
    ]);
    expect(statBlockModifiers(mummy.text, 'Weakness').entries).toEqual([
      { type: 'fire', value: 5 },
    ]);
  });

  test('a missing cell and "all" as a weakness are not read; "all" as an immunity is', () => {
    expect(statBlockModifiers('no table', 'Immunity').unparsed).toMatch(/not found/);
    expect(parseModifierCell('Immunity', 'Fire all').entries).toEqual([
      { type: 'fire', value: 'all' },
    ]);
    expect(parseModifierCell('Weakness', 'Fire all').unparsed).toMatch(/only an immunity/);
  });
});

describe('application', () => {
  const target = (
    immunities: DamageModifierEntry[],
    weaknesses: DamageModifierEntry[] = [],
  ): DamageTargetFacts => ({
    targetId: 'x',
    kind: 'foe',
    stamina: 40,
    maxStamina: 40,
    temporaryStamina: 0,
    immunities,
    weaknesses,
  });
  const hit = (facts: DamageTargetFacts, amount: number, damageType?: string) =>
    applyDamage(facts, {
      targetId: 'x',
      amount,
      ...(damageType ? { damageType } : {}),
      causeLabel: 'test',
    });

  test('the rule pages’ own examples', () => {
    // damage-immunity.md: fire immunity 5, 8 fire damage → 3.
    expect(hit(target([{ type: 'fire', value: 5 }]), 8, 'fire').afterImmunity).toBe(3);
    // damage-immunity.md: damage immunity 5 and fire immunity 10, 12 fire damage → reduced by 10.
    const both = target([
      { type: 'all-damage', value: 5 },
      { type: 'fire', value: 10 },
    ]);
    expect(hit(both, 12, 'fire')).toMatchObject({ immunityApplied: 10, afterImmunity: 2 });
    // damage-weakness.md: fire weakness 5, 10 fire damage → 15.
    expect(hit(target([], [{ type: 'fire', value: 5 }]), 10, 'fire').afterImmunity).toBe(15);
    // damage-immunity.md: halved to 4 before immunity 5, then 0.
    const halved = halveApplication(hit(target([{ type: 'fire', value: 5 }]), 8, 'fire'), 'foe');
    expect(halved).toMatchObject({ incoming: 4, afterImmunity: 0 });
  });

  test('the Mummy: weakness before immunity, typed entries ignore untyped damage', () => {
    const mummy = target(
      [
        { type: 'corruption', value: 4 },
        { type: 'poison', value: 4 },
      ],
      [{ type: 'fire', value: 5 }],
    );
    expect(hit(mummy, 7, 'fire')).toMatchObject({ weaknessApplied: 5, afterImmunity: 12 });
    expect(hit(mummy, 7, 'poison')).toMatchObject({ immunityApplied: 4, afterImmunity: 3 });
    expect(hit(mummy, 3, 'corruption').afterImmunity).toBe(0);
    expect(hit(mummy, 7)).toMatchObject({
      weaknessApplied: 0,
      immunityApplied: 0,
      afterImmunity: 7,
    });
  });

  test('"Damage 3" (all damage) applies to untyped damage too; no damage takes no weakness', () => {
    // Hill Giant Clobberer, "Damage 3" immunity; section 6.2 of docs/roll-and-damage-resolution.md.
    const giant = target(parseModifierCell('Immunity', 'Damage 3').entries);
    expect(hit(giant, 5).afterImmunity).toBe(2);
    expect(hit(giant, 5, 'fire').afterImmunity).toBe(2);
    expect(hit(target([], [{ type: 'holy', value: 3 }]), 0, 'holy')).toMatchObject({
      weaknessApplied: 0,
      afterImmunity: 0,
    });
  });

  test('hero entries: the complication "damage weakness" is all damage', () => {
    // Cursed Weapon: "You have damage weakness 2."; tough-but-withered.md: "fire weakness 5".
    expect(
      heroModifierEntries([
        { damageType: 'allDamage', value: { value: 2 } },
        { damageType: 'fire', value: { value: 5 } },
      ]),
    ).toEqual([
      { type: 'all-damage', value: 2 },
      { type: 'fire', value: 5 },
    ]);
  });

  test('extra damage joins the hit: its weakness and immunity count once', () => {
    // The Mummy took 7 poison: immunity 4 left 3. Adding 4 to the hit gives 11 - 4 = 7, so 4 more.
    const mummy = target([{ type: 'poison', value: 4 }], [{ type: 'fire', value: 5 }]);
    expect(extraDamageAfterModifiers(hit(mummy, 7, 'poison'), 4)).toBe(4);
    // 2 poison was wholly stopped by immunity 4: 2 + 4 = 6, less 4, is 2 more.
    expect(extraDamageAfterModifiers(hit(mummy, 2, 'poison'), 4)).toBe(2);
    // The fire weakness already applied to the hit and is not added again.
    expect(extraDamageAfterModifiers(hit(mummy, 7, 'fire'), 4)).toBe(4);
    expect(
      extraDamageAfterModifiers(hit(target([{ type: 'fire', value: 'all' }]), 7, 'fire'), 4),
    ).toBe(0);
    expect(extraDamageAfterModifiers(hit(mummy, 0, 'fire'), 4)).toBeUndefined();
  });
});

describe('features that change immunity or weakness outside the cells (V178 review)', () => {
  const blocks = statblocks as { id: string; name: string; text: string }[];
  const plain = (text: string) =>
    text
      .replace(/\[([^\]]+)\]\([^\n)]*\)/g, '$1')
      .replace(/\*\*/g, '')
      .replace(/^>\s?/gm, '');
  /** The stat block's feature text: no frontmatter, no stat table rows. */
  const featureText = (text: string) =>
    text
      .replace(/^---\n[\s\S]*?\n---\n/, '')
      .split('\n')
      .filter(line => !line.includes('<br>'))
      .join('\n');
  const MENTION = /damage (immunity|weakness)|immunit|immune|weakness/i;
  const read = blocks.filter(
    e =>
      !statBlockModifiers(e.text, 'Immunity').unparsed &&
      !statBlockModifiers(e.text, 'Weakness').unparsed,
  );

  test('every read stat block whose features mention immunity or weakness is classified', () => {
    const unclassified = read
      .filter(e => MENTION.test(featureText(e.text)))
      .map(e => e.id)
      .filter(id => !FOE_MODIFIER_TRAITS[id] && !FOE_MODIFIER_MENTIONS_REVIEWED[id]);
    // A new stat block that mentions either must be listed as manual or reviewed with a reason.
    expect(unclassified).toEqual([]);
  });

  test('the lists are disjoint, current, and quote the stat blocks exactly', () => {
    for (const id of Object.keys(FOE_MODIFIER_TRAITS))
      expect(FOE_MODIFIER_MENTIONS_REVIEWED[id], id).toBeUndefined();
    for (const [id, reason] of Object.entries(FOE_MODIFIER_MENTIONS_REVIEWED)) {
      const entry = read.find(e => e.id === id);
      expect(entry && MENTION.test(featureText(entry.text)), id).toBe(true);
      expect(reason.length, id).toBeGreaterThan(20);
    }
    for (const [id, traits] of Object.entries(FOE_MODIFIER_TRAITS)) {
      const entry = read.find(e => e.id === id);
      expect(entry, id).toBeDefined();
      const text = plain(entry!.text);
      for (const trait of traits) {
        expect(text, `${id} ${trait.feature}`).toContain(trait.text);
        expect(text, `${id} ${trait.feature}`).toContain(trait.feature);
      }
    }
  });

  test('the reviewer’s cases are manual and name the feature', () => {
    const id = (slug: string) => blocks.find(e => e.id.endsWith(slug))!.id;
    // monster/count-rhodar-von-glauer: Grave Ward, "Rhodar has damage immunity 5. If he takes holy
    // damage, he loses this immunity until the end of the round." His cell is "Corruption 10,
    // poison 10".
    expect(foeModifierTraitReason(id('/count-rhodar-von-glauer'))).toMatch(
      /^Grave Ward and Sanguine Mist change its damage immunity or weakness during play \(“Rhodar has damage immunity 5\./,
    );
    for (const slug of [
      '/devil-clerk',
      '/devil-notary',
      '/devil-scrivener',
      '/devil-jurist',
      '/devil-legate',
      '/phrrygalax-the-subduer',
      '/locratix-the-morningstar',
    ])
      expect(foeModifierTraitReason(id(slug)), slug).toBeDefined();
    expect(foeModifierTraitReason(id('/devil-legate'))).toMatch(/Hellish Bailiff and True Name/);
    // A stat block with no such feature is read from its cells.
    expect(foeModifierTraitReason(id('/mummy'))).toBeUndefined();
  });

  test('a Corrupted Mentor hero’s growing holy weakness is manual', () => {
    // complication/corrupted-mentor.md, Drawback.
    const weakness = [
      {
        damageType: 'holy',
        value: {
          value: 1,
          provenance: [{ decisionId: 'complication.choice', selection: 'Corrupted Mentor' }],
        },
      },
    ];
    expect(heroModifierTraitReason([undefined, weakness])).toMatch(/^Corrupted Mentor/);
    expect(
      heroModifierTraitReason([
        undefined,
        [{ damageType: 'fire', value: { value: 5, provenance: [{ selection: 'Revenant' }] } }],
      ]),
    ).toBeUndefined();
  });
});
