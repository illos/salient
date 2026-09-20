// SPDX-License-Identifier: GPL-3.0-only
/**
 * V64: the V26 bounded-grammar classifier over real content entries. Expected categories and
 * node values are read from the pinned source text quoted in each test, never from running the
 * classifier. Each test names the concrete misclassification it catches.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { conditionExpression } from '../../shared/resolve/abilityGrammar.ts';
import { describe, expect, it } from 'vitest';
import {
  audit,
  buildCorpus,
  classify,
  renderMarkdown,
  type Corpus,
  type Envelope,
} from '../../scripts/audit-ability-grammar.ts';

const corpus = buildCorpus();
const envelope = (kind: Corpus, name: string, parent?: RegExp): Envelope => {
  const found = corpus.envelopes.find(
    e => e.corpus === kind && e.name === name && (!parent || parent.test(e.parent ?? '')),
  );
  if (!found) throw new Error(`Missing ${kind} envelope ${name}`);
  return found;
};
const types = (e: Envelope) => classify(e).diagnostics.map(d => d.type);

describe('V26 bounded grammar classifier on real entries', () => {
  // Source: feature/ability/fury/level-1/brutal-slam.md — "3 + M damage; push 1", "6 + M damage;
  // push 2", "9 + M damage; push 4", no Effect. Catches a classifier that reports the trailing
  // `push N` as a remainder (or drops it) instead of compiling it after the damage node.
  it('Brutal Slam compiles damage + Might then push with no remainder', () => {
    const result = classify(envelope('hero-standalone', 'Brutal Slam'));
    expect(result.category).toBe('COMPILES');
    expect(result.roll).toEqual({ permitted: ['M'] });
    expect(result.tiers).toEqual([
      { damage: { kind: 'plusCharacteristic', constant: 3, characteristic: 'M' }, push: 1 },
      { damage: { kind: 'plusCharacteristic', constant: 6, characteristic: 'M' }, push: 2 },
      { damage: { kind: 'plusCharacteristic', constant: 9, characteristic: 'M' }, push: 4 },
    ]);
    expect(result.targetShape).toBe('single');
  });

  // Source: feature/ability/fury/level-1/thunder-roar.md — Area/Melee/Weapon, "Each enemy in the
  // area", tiers "6 damage; push 2" / "9 damage; push 4" / "13 damage; push 6" and a nearest-first
  // Effect paragraph. Catches a classifier that ignores the Effect section and reports COMPILES.
  it('Thunder Roar compiles its tiers but keeps the Effect paragraph as a remainder', () => {
    const result = classify(envelope('hero-standalone', 'Thunder Roar'));
    expect(result.category).toBe('COMPILES_WITH_REMAINDER');
    expect(result.tiers?.map(t => t.push)).toEqual([2, 4, 6]);
    expect(result.tiers?.map(t => t.damage)).toEqual([
      { kind: 'flat', constant: 6 },
      { kind: 'flat', constant: 9 },
      { kind: 'flat', constant: 13 },
    ]);
    expect(result.diagnostics.map(d => d.type)).toEqual(['effect-paragraph']);
    expect(result.targetShape).toBe('area');
    expect(result.withinV26Bounded).toBe(false);
  });

  // Source: monster/goblin/statblock/goblin-warrior.md, Bury the Point (2 Malice) — "5 damage;
  // M < 0 bleeding (save ends)" / "6 damage; M < 1 ..." / "7 damage; M < 2 ...". Catches a
  // classifier that treats the potency clause as unsupported free text (NO_MATCH) or that marks
  // the bounded remainder as outside V26's specified shape.
  it('Bury the Point is damage plus the bounded potency/bleeding/save remainder', () => {
    const e = envelope('foe-ability', 'Bury the Point', /goblin-warrior$/);
    const result = classify(e);
    expect(e.cost).toBe('2 Malice');
    expect(result.category).toBe('COMPILES_WITH_REMAINDER');
    expect(result.withinV26Bounded).toBe(true);
    expect(result.roll).toEqual({ permitted: [], fixedRollBonus: 2 });
    expect(result.tiers?.map(t => t.damage)).toEqual([
      { kind: 'flat', constant: 5 },
      { kind: 'flat', constant: 6 },
      { kind: 'flat', constant: 7 },
    ]);
    expect(result.diagnostics.map(d => [d.type, d.text, d.bounded])).toEqual([
      ['potency-condition', 'M < 0 bleeding (save ends)', true],
      ['potency-condition', 'M < 1 bleeding (save ends)', true],
      ['potency-condition', 'M < 2 bleeding (save ends)', true],
    ]);
  });

  // Source: goblin-warrior.md, Spear Charge (Signature Ability) — "Power Roll + 2", tiers
  // "3 damage" / "4 damage" / "5 damage", one creature or object. Catches a classifier that
  // requires a characteristic roll or misreads the fixed monster bonus.
  it('Spear Charge compiles a fixed-bonus roll with flat damage', () => {
    const result = classify(envelope('foe-ability', 'Spear Charge', /goblin-warrior$/));
    expect(result.category).toBe('COMPILES');
    expect(result.roll).toEqual({ permitted: [], fixedRollBonus: 2 });
    expect(result.tiers?.map(t => t.damage.constant)).toEqual([3, 4, 5]);
    expect(result.targetShape).toBe('single');
  });

  // Source: monster/ajax-the-invincible/statblock/ajax-the-invincible.md, Blade of the Gol King —
  // "Power Roll + 5", "16 damage; M < 4 the target loses 1d3 Recoveries" (22/M < 5, 26/M < 6 prone
  // and ...), Effect (shift), "1+ Malice" spend, two creatures or objects. Catches a classifier
  // that accepts a potency clause with a non-bounded tail as V26-bounded, or drops the Malice spend.
  it('Blade of the Gol King compiles damage and types every remainder', () => {
    const result = classify(
      envelope('foe-ability', 'Blade of the Gol King', /ajax-the-invincible$/),
    );
    expect(result.category).toBe('COMPILES_WITH_REMAINDER');
    expect(result.roll).toEqual({ permitted: [], fixedRollBonus: 5 });
    expect(result.tiers?.map(t => t.damage.constant)).toEqual([16, 22, 26]);
    expect(result.diagnostics.map(d => d.type).sort()).toEqual([
      'effect-paragraph',
      'malice-spend',
      'potency-condition',
      'potency-condition',
      'potency-condition',
    ]);
    expect(
      result.diagnostics
        .filter(d => d.type === 'potency-condition')
        .every(d => d.bounded === false),
    ).toBe(true);
    expect(result.withinV26Bounded).toBe(false);
    expect(result.targetShape).toBe('multi');
  });

  // Source: feature/ability/fury/level-1/lines-of-force.md — Triggered, Trigger/Effect/"Spend 1
  // Ferocity" sections, no power roll. Catches a classifier that compiles an Effect-only ability
  // or fails to retain its sections as typed remainders.
  it('Lines of Force is NO_MATCH with its trigger, effect and spend retained', () => {
    const result = classify(envelope('hero-standalone', 'Lines of Force'));
    expect(result.category).toBe('NO_MATCH');
    expect(result.reason).toBe('no-power-roll');
    expect(result.diagnostics.map(d => d.type).sort()).toEqual([
      'effect-paragraph',
      'no-power-roll',
      'resource-spend',
      'trigger',
    ]);
  });

  // Source: monster/fossil-cryptic/statblock/fossil-cryptic.md, No Escape (Villain Action 3) — two
  // "Power Roll + 3" blocks separated by a paragraph. Catches a classifier that keeps only the first
  // roll (as convex/lib/resolve.ts effectsOf does) and reports the ability as compiled.
  it('No Escape is NO_MATCH because of its second power roll', () => {
    const result = classify(envelope('foe-ability', 'No Escape', /fossil-cryptic$/));
    expect(result.category).toBe('NO_MATCH');
    expect(result.reason).toBe('multiple-power-rolls');
    expect(types(envelope('foe-ability', 'No Escape', /fossil-cryptic$/))).toContain('second-roll');
  });

  // Source: feature/ability/common/knockback.md — tiers "Push 1" / "Push 2" / "Push 3" with no
  // damage. V26's grammar is damage optionally followed by push; catches a classifier that accepts
  // a push-only tier as compiled.
  it('Knockback is NO_MATCH because its tiers have no damage expression', () => {
    const result = classify(envelope('hero-standalone', 'Knockback'));
    expect(result.category).toBe('NO_MATCH');
    expect(result.reason).toBe('tier1-damage-outside-grammar');
    expect(result.diagnostics.filter(d => d.type === 'tier-damage').map(d => d.shape)).toEqual([
      'tier:push N',
      'tier:push N',
      'tier:push N',
    ]);
  });

  // Source: kit/mountain.md, Signature Ability → Pain for Pain — "Power Roll + Might or Agility",
  // "3 + M or A damage" / "5 + M or A damage" / "13 + M or A damage", conditional Effect. Catches
  // a kit reader that fails to extract the printed section, or a grammar that rejects the choice
  // expression, and a grant reader that misses the kit signature path.
  it('Pain for Pain compiles the choice expression from the kit section with its Effect as remainder', () => {
    const e = envelope('kit-signature', 'Pain for Pain');
    const result = classify(e);
    expect(result.category).toBe('COMPILES_WITH_REMAINDER');
    expect(result.roll).toEqual({ permitted: ['M', 'A'] });
    expect(result.tiers?.map(t => t.damage)).toEqual([
      { kind: 'plusChoice', constant: 3, choices: ['M', 'A'] },
      { kind: 'plusChoice', constant: 5, choices: ['M', 'A'] },
      { kind: 'plusChoice', constant: 13, choices: ['M', 'A'] },
    ]);
    expect(result.diagnostics.map(d => d.type)).toEqual(['effect-paragraph']);
    expect(corpus.grantsByEnvelope.get(e.id)?.map(g => g.selectable)).toEqual([
      'selectable',
      'selectable',
    ]);
  });

  // Source: feature/ability/elementalist/level-1/ray-of-agonizing-self-reflection.md — "2 + R
  // corruption damage; R < WEAK, slowed (save ends)" (4/AVERAGE, 6/STRONG). Catches a classifier
  // that rejects the symbolic threshold or the comma form, and a grant reader that reports a live
  // grant the wizard does not offer (V26: compile-only).
  it('Ray of Agonizing Self-Reflection keeps the symbolic potency remainder and has no wizard grant', () => {
    const e = envelope('hero-standalone', 'Ray of Agonizing Self-Reflection');
    const result = classify(e);
    expect(result.category).toBe('COMPILES_WITH_REMAINDER');
    expect(result.withinV26Bounded).toBe(true);
    expect(result.tiers?.map(t => [t.damage, t.damageType])).toEqual([
      [{ kind: 'plusCharacteristic', constant: 2, characteristic: 'R' }, 'corruption'],
      [{ kind: 'plusCharacteristic', constant: 4, characteristic: 'R' }, 'corruption'],
      [{ kind: 'plusCharacteristic', constant: 6, characteristic: 'R' }, 'corruption'],
    ]);
    expect(result.diagnostics.map(d => d.text)).toEqual([
      'R < WEAK, slowed (save ends)',
      'R < AVERAGE, slowed (save ends)',
      'R < STRONG, slowed (save ends)',
    ]);
    expect(corpus.grantsByEnvelope.has(e.id)).toBe(false);
  });

  // V26 acceptance check 5: text outside the structured `effects`, or a Markdown tier that
  // contradicts the structured projection, must produce a diagnostic. Catches a classifier that
  // trusts the structured record alone and would report the mutated source as fully compiled.
  it('flags an appended paragraph and a contradicted tier instead of treating them as harmless', () => {
    const base = envelope('hero-standalone', 'Brutal Slam');
    const appended = classify({
      ...base,
      markdown: `${base.markdown}\nThe target also takes 5 extra damage.\n`,
    });
    expect(appended.category).toBe('COMPILES_WITH_REMAINDER');
    expect(appended.diagnostics.map(d => d.shape)).toEqual([
      'envelope:structured-markdown-mismatch',
    ]);
    expect(appended.diagnostics[0]!.text).toContain('1 unattached paragraphs');

    const contradicted = classify({
      ...base,
      markdown: base.markdown.replace('6 + M damage', '7 + M damage'),
    });
    expect(contradicted.category).toBe('COMPILES_WITH_REMAINDER');
    expect(contradicted.diagnostics[0]!.text).toContain('tier2 text differs');
  });
});

// V26 acceptance check 10 asks for the support report generated twice with identical output.
// Catches nondeterministic ordering (Map/Set iteration, unsorted filters) in the report.
it('produces byte-identical JSON and Markdown across two full runs', () => {
  const first = audit();
  const second = audit();
  expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  expect(renderMarkdown(second)).toBe(renderMarkdown(first));
  expect(first.totals['foe-ability'].total).toBe(1158);
});

// The pre-V88 report lacked 25 perk grants; V85 integration adds 37 reviewed complication grants.
// List both sets explicitly while preserving every original classification hash and clause change.
it('V88 changes only the exact bounded flags, preserving every other prior classification byte', () => {
  const fixture = JSON.parse(
    readFileSync(new URL('../fixtures/v88-audit-baseline.json', import.meta.url), 'utf8'),
  ) as {
    addedIds: string[];
    rows: Record<
      string,
      {
        hash: string;
        withinBefore?: boolean;
        changes?: { index: number; text: string; before: boolean; after: boolean }[];
      }
    >;
  };
  const canonical = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(canonical)
      : value && typeof value === 'object'
        ? Object.fromEntries(
            Object.entries(value)
              .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
              .map(([key, item]) => [key, canonical(item)]),
          )
        : value;
  const report = audit();
  expect(
    report.entries
      .filter(entry => !fixture.rows[`${entry.corpus}|${entry.id}`])
      .map(entry => `${entry.corpus}|${entry.id}`)
      .sort(),
  ).toEqual(fixture.addedIds);
  let promotions = 0;
  let demotions = 0;
  for (const [key, baseline] of Object.entries(fixture.rows)) {
    const entry = report.entries.find(row => `${row.corpus}|${row.id}` === key);
    expect(entry, key).toBeDefined();
    const classification = structuredClone(entry!.classification);
    for (const change of baseline.changes ?? []) {
      const diagnostic = classification.diagnostics[change.index]!;
      expect(diagnostic, key).toMatchObject({
        type: 'potency-condition',
        text: change.text,
        bounded: change.after,
      });
      expect(conditionExpression(diagnostic.text), key).toBeDefined();
      if (change.after) promotions++;
      else demotions++;
      diagnostic.bounded = change.before;
    }
    if (baseline.withinBefore !== undefined)
      classification.withinV26Bounded = baseline.withinBefore;
    expect(
      createHash('sha256')
        .update(JSON.stringify(canonical(classification)))
        .digest('hex'),
      key,
    ).toBe(baseline.hash);
  }
  expect({ promotions, demotions }).toEqual({ promotions: 235, demotions: 5 });
});

it.each([
  'bleeding',
  'dazed',
  'frightened',
  'grabbed',
  'prone',
  'restrained',
  'slowed',
  'taunted',
  'weakened',
])('V88 bounds core %s, including signed potency', condition => {
  expect(conditionExpression(`M < -1, ${condition} (save ends)`)).toMatchObject({
    characteristic: 'M',
    threshold: { kind: 'printed', value: -1 },
    condition,
  });
});
