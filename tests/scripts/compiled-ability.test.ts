// SPDX-License-Identifier: GPL-3.0-only
/**
 * V67 compiler contracts. Source expectations are from Compendium fb83a789 and the independent
 * calculations in docs/build/V26-ability-designs.md. These fixtures exercise the execution gate,
 * not V64's separate descriptive classification. No live support is established by these tests.
 */
import { describe, expect, it } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import {
  compiledSupportReport,
  renderCompiledSupport,
} from '../../scripts/report-compiled-abilities.ts';
import { plain, type Corpus } from '../../shared/resolve/abilityGrammar.ts';
import { resolveAbilityRoll } from '../../shared/resolve/index.ts';
import { compileAbility } from '../../shared/resolve/compileAbility.ts';
import {
  resolveCompiledAbility,
  type CompiledAbilityInput,
} from '../../shared/resolve/compiledOutcome.ts';

type Input = Parameters<typeof compileAbility>[0];
const inputs = readInputs();
const corpus = buildCorpus(inputs);
const source = (kind: Corpus, name: string, parent?: RegExp): Input => {
  const entry = corpus.envelopes.find(
    e => e.corpus === kind && e.name === name && (!parent || parent.test(e.parent ?? '')),
  );
  if (!entry) throw new Error(`Missing ${kind} source ${name}`);
  const structured = inputs.abilities.find(e => e.id === entry.id)?.structured;
  const flavor = structured?.flavor;
  const parentContext = inputs.foes.objects.find(object => object.id === entry.parent)?.fields;
  return {
    ...structuredClone(entry),
    sourceRevision: inputs.foes.sourceRevision,
    ...(typeof flavor === 'string' ? { declaredFlavor: [plain(flavor)] } : {}),
    ...(parentContext ? { parentContext: structuredClone(parentContext) } : {}),
  };
};
const hero = (name: string) => source('hero-standalone', name);
const warrior = (name: string) => source('foe-ability', name, /goblin-warrior$/);

describe('V67 whole-envelope execution gate', () => {
  it('does not let a signature title hide a declared fixed activation cost', () => {
    const input = warrior('Bury the Point');
    input.markdown = input.markdown.replace(/2 \[Malice\]\([^)]*\)/, 'Signature Ability');
    const result = compileAbility(input);
    expect(result.execution).toBe('manual');
    expect(result.diagnostics.some(diagnostic => diagnostic.code === 'source-title')).toBe(true);
  });

  // A new instruction outside structured.effects must invalidate execution even if italicized;
  // otherwise readers that discard apparent flavor silently execute only part of the source.
  it.each(['The target takes 20 extra damage.', '*The target takes 20 extra damage.*'])(
    'keeps newly appended source text manual: %s',
    instruction => {
      const input = hero('Brutal Slam');
      input.markdown += `\n\n${instruction}\n`;
      const result = compileAbility(input);
      expect(result.execution).toBe('manual');
      expect(result.diagnostics.length).toBeGreaterThan(0);
      expect(
        result.sections.some(node => node.clause.includes('The target takes 20 extra damage.')),
      ).toBe(true);
    },
  );

  // Contradictory display roll/tier data must not be hidden by authoritative structured data.
  it.each([
    ['roll', (text: string) => text.replace(/\[Might\]/, '[Agility]')],
    ['tier', (text: string) => text.replace('6 + M damage', '60 + M damage')],
  ] as const)('refuses a contradictory Markdown %s', (_label, change) => {
    const input = hero('Brutal Slam');
    const original = input.markdown;
    input.markdown = change(original);
    expect(input.markdown).not.toBe(original);
    const result = compileAbility(input);
    expect(result.execution).toBe('manual');
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  // Source cost is printed in the foe title, outside effects and metadata table. A reader that
  // accepts arbitrary title parentheses would execute the stale 2-Malice projection.
  it('refuses a changed printed Malice cost even when structured cost remains unchanged', () => {
    const input = warrior('Bury the Point');
    const original = input.markdown;
    input.markdown = original.replace('Bury the Point (2 ', 'Bury the Point (3 ');
    expect(input.markdown).not.toBe(original);
    expect(input.cost).toBe('2 Malice');
    const result = compileAbility(input);
    expect(result.execution).toBe('manual');
    expect(result.diagnostics.some(d => d.code === 'source-title')).toBe(true);
  });

  it('does not dismiss parenthesized title mechanics as a harmless ability label', () => {
    const input = hero('Brutal Slam');
    input.markdown = `Brutal Slam (Spend 5 Ferocity to deal 20 extra damage)\n\n${input.markdown}`;
    const result = compileAbility(input);
    expect(result.execution).toBe('manual');
    expect(result.diagnostics.some(d => d.code === 'source-title')).toBe(true);
  });

  it('does not execute only the first roll when a second power roll is present', () => {
    const input = hero('Brutal Slam');
    const roll = input.blocks.find(b => b.kind === 'roll');
    if (!roll) throw new Error('Brutal Slam source has no roll');
    input.blocks.push(structuredClone(roll));
    input.markdown +=
      '\nPower Roll + Might:\n- ≤11: 3 + M damage; push 1\n- 12-16: 6 + M damage; push 2\n- 17+: 9 + M damage; push 4\n';
    const result = compileAbility(input);
    expect(result.execution).toBe('manual');
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  it('retains altered Effect text even when the section count is unchanged', () => {
    const input = hero('Thunder Roar');
    const section = input.blocks.find(b => b.kind === 'section');
    if (!section || section.kind !== 'section') throw new Error('Thunder Roar lacks Effect');
    const original = section.text;
    section.text = 'The target takes 99 extra damage.';
    const result = compileAbility(input);
    expect(result.execution).toBe('manual');
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.sections.some(node => node.clause.includes('99 extra damage'))).toBe(true);
    expect(result.diagnostics.some(diagnostic => diagnostic.code === 'source-block-mismatch')).toBe(
      true,
    );
    expect(input.markdown).not.toContain('99 extra damage');
    expect(original).not.toBe(section.text);
  });

  // Distinct occurrence identities are needed for later disposition/history: repeated identical
  // text is not one effect. The input repeats source clauses consistently in both representations.
  it('keeps repeated unsupported clauses as distinct stable occurrences', () => {
    const input = warrior('Bury the Point');
    input.blocks = input.blocks.map(block =>
      block.kind === 'roll'
        ? {
            ...block,
            // V113 compiles a repeated condition; an EoT grab stays unsupported.
            tiers: block.tiers.map(t => `${t}; A < 2 grabbed (EoT); A < 2 grabbed (EoT)`) as [
              string,
              string,
              string,
            ],
          }
        : block,
    );
    input.markdown = input.markdown.replace(
      /(^.*(?:≤11|12-16|17\+).*?;)([^\n]+)/gm,
      (_all, start: string, rest: string) =>
        `${start}${rest}; A < 2 grabbed (EoT); A < 2 grabbed (EoT)`,
    );
    const first = compileAbility(input);
    const unsupported = first.tiers.flat().filter(n => n.kind === 'unsupported');
    expect(unsupported).toHaveLength(6);
    expect(new Set(unsupported.map(n => n.id)).size).toBe(6);
    expect(
      compileAbility(input)
        .tiers.flat()
        .filter(n => n.kind === 'unsupported')
        .map(n => n.id),
    ).toEqual(unsupported.map(n => n.id));
  });

  it('uses grammar rather than an ability-name or numeric-content allowlist', () => {
    const input = hero('Brutal Slam');
    input.id = 'fixture/renamed-strike';
    input.name = 'A Different Strike';
    input.markdown = input.markdown.replace('6 + M damage', '12 + M damage');
    input.blocks = input.blocks.map(block =>
      block.kind === 'roll'
        ? {
            ...block,
            tiers: block.tiers.map(t => t.replace('6 + M damage', '12 + M damage')) as [
              string,
              string,
              string,
            ],
          }
        : block,
    );
    const result = compileAbility(input);
    expect(result.execution).toBe('supported');
    expect(result.tiers[1]?.find(n => n.kind === 'damage')).toMatchObject({
      expression: { kind: 'plusCharacteristic', constant: 12, characteristic: 'M' },
    });
    expect(result.tiers[1]?.find(n => n.kind === 'push')).toMatchObject({ distance: 2 });
  });
});

describe('V67 source-backed compiled nodes and manual boundaries', () => {
  // Full source tiers, not snapshots of classifier output: BS 3/6/9+M and push 1/2/4;
  // MI 3/5/8+R and push 2/3/4; VF 2/5/7+R fire and push 2/3/4.
  it.each([
    ['Brutal Slam', 'M', [3, 6, 9], [1, 2, 4]],
    ['Meteoric Introduction', 'R', [3, 5, 8], [2, 3, 4]],
    ['Viscous Fire', 'R', [2, 5, 7], [2, 3, 4]],
  ] as const)(
    'compiles ordered damage then push from %s',
    (name, characteristic, damage, pushes) => {
      const result = compileAbility(hero(name));
      expect(result.execution).toBe('supported');
      result.tiers.forEach((tier, i) => {
        expect(tier.map(node => node.kind)).toEqual(['damage', 'push']);
        expect(tier[0]).toMatchObject({
          expression: { kind: 'plusCharacteristic', constant: damage[i], characteristic },
        });
        expect(tier[1]).toMatchObject({ distance: pushes[i] });
      });
    },
  );

  it('keeps Goblin roll bonus separate from printed Spear Charge damage', () => {
    const result = compileAbility(warrior('Spear Charge'));
    expect(result.execution).toBe('supported');
    expect(result.tiers.map(t => t.find(n => n.kind === 'damage'))).toMatchObject([
      { expression: { kind: 'flat', constant: 3 } },
      { expression: { kind: 'flat', constant: 4 } },
      { expression: { kind: 'flat', constant: 5 } },
    ]);
  });

  it.each([
    ['Bury the Point', ['M < 0', 'M < 1', 'M < 2']],
    ['Ray of Agonizing Self-Reflection', ['R < WEAK', 'R < AVERAGE', 'R < STRONG']],
  ] as const)('keeps each %s potency/save clause intact after damage', (name, thresholds) => {
    const result = compileAbility(name === 'Bury the Point' ? warrior(name) : hero(name));
    expect(result.execution).toBe('supported');
    result.tiers.forEach((tier, i) => {
      expect(tier.map(n => n.kind)).toEqual(['damage', 'condition']);
      const remainder = tier.find(n => n.kind === 'condition');
      expect(remainder?.clause).toContain(thresholds[i]);
      expect(remainder?.clause).toContain('save ends');
      expect(remainder?.duration).toBe('save-ends');
    });
  });

  it('recognizes Spinecleaver Axe tiers without admitting its minion execution', () => {
    const result = compileAbility(source('foe-ability', 'Axe', /goblin-spinecleaver$/));
    expect(result.execution).toBe('manual');
    expect(result.tiers[1]?.find(n => n.kind === 'damage')).toMatchObject({
      expression: { kind: 'flat', constant: 4 },
    });
    expect(result.tiers[1]?.find(n => n.kind === 'push')).toMatchObject({ distance: 3 });
    expect(result.context.parentContext).toMatchObject({
      organization: 'Minion',
      with_captain: '+1 damage bonus to strikes',
    });
  });

  it('leaves kit conditional damage and Thunder Roar area ordering outside compiled execution', () => {
    const kit = compileAbility(source('kit-signature', 'Pain for Pain'));
    const area = compileAbility(hero('Thunder Roar'));
    expect(kit.execution).toBe('manual');
    expect(area.execution).toBe('manual');
    expect(kit.sections.length).toBeGreaterThan(0);
    expect(area.sections.length).toBeGreaterThan(0);
  });
});

// H and G are the independent V26 design fixtures. Pure calculations below do not claim live
// resource payment, condition changes, table movement, history or persistence.
const normalMovement = () => ({
  kind: 'creature' as const,
  size: '1M',
  stability: 2,
  conditions: { kind: 'none' as const },
  traits: { kind: 'none' as const },
  modifiers: { kind: 'none' as const },
});
const hToG = (): CompiledAbilityInput => ({
  actor: {
    actorId: 'H',
    characteristics: { M: 2, A: 2, R: -1, I: 1, P: 1 },
    kitMeleeDamageBonus: [0, 0, 4],
  },
  targets: [{ targetId: 'G', edges: 0, banes: 0 }],
  dice: { d10a: 7, d10b: 7 },
  inCombat: true,
  targetFacts: [{ targetId: 'G', kind: 'foe', stamina: 15, maxStamina: 15, temporaryStamina: 0 }],
  movement: {
    actor: normalMovement(),
    targets: [{ ...normalMovement(), targetId: 'G', size: '1S', stability: 0 }],
  },
});
const gToH = (): CompiledAbilityInput => ({
  actor: { actorId: 'G', characteristics: { M: -2, A: 2, R: 0, I: 0, P: -1 } },
  targets: [{ targetId: 'H', edges: 0, banes: 0 }],
  dice: { d10a: 7, d10b: 7 },
  inCombat: true,
  targetFacts: [{ targetId: 'H', kind: 'hero', stamina: 30, maxStamina: 30, temporaryStamina: 0 }],
});
const resolved = (definition: ReturnType<typeof compileAbility>, facts: CompiledAbilityInput) => {
  const outcome = resolveCompiledAbility(definition, facts);
  if (outcome.kind !== 'resolved') throw new Error(`Expected calculation, got ${outcome.kind}`);
  return outcome;
};

describe('V67 source-backed pure outcome examples', () => {
  // BS1/BS2/BS3: independently 3+2+0=5, 6+2+0=8, 9+2+4=15;
  // forced-movement Big Versus Little adds one for H's larger melee-weapon size.
  it.each([
    [4, 5, 1, 5, 10, 2],
    [7, 7, 2, 8, 7, 3],
    [8, 7, 3, 15, 0, 5],
  ] as const)(
    'BS: dice %i+%i select tier %i, damage %i, health %i, allowance %i',
    (d10a, d10b, tier, damage, health, allowance) => {
      const facts = hToG();
      facts.dice = { d10a, d10b };
      const result = resolved(compileAbility(hero('Brutal Slam')), facts);
      expect(result.roll.targets[0]).toMatchObject({ tier, damage: { rolledDamage: damage } });
      expect(result.roll.damageApplications[0]).toMatchObject({ staminaAfter: health });
      expect(result.effects.map(e => e.kind)).toEqual(['damage', 'push']);
      expect(result.effects[1]).toMatchObject({ status: 'instruction', allowance, sizeBonus: 1 });
      if (tier === 3) expect(result.roll.damageApplications[0]?.slain).toBe(true);
    },
  );

  it('BS4 keeps stability reduction optional rather than subtracting it automatically', () => {
    const facts = hToG();
    facts.movement!.targets[0] = { ...normalMovement(), targetId: 'G' };
    const result = resolved(compileAbility(hero('Brutal Slam')), facts);
    expect(result.effects[1]).toMatchObject({
      kind: 'push',
      status: 'instruction',
      printed: 2,
      sizeBonus: 0,
      allowance: 2,
      stability: 2,
      stabilityReduction: 'optional',
    });
  });

  it.each([undefined, '1'])('BS5 does not invent a precise size from %s', size => {
    const facts = hToG();
    facts.movement!.targets[0]!.size = size;
    const result = resolved(compileAbility(hero('Brutal Slam')), facts);
    expect(result.roll.damageApplications[0]?.staminaAfter).toBe(7);
    const push = result.effects.find(e => e.kind === 'push');
    expect(push).toMatchObject({ status: 'fact-needed' });
    expect(push?.requirements).toContain('target:G.preciseSize');
    expect(push?.allowance).toBeUndefined();
  });

  it('BS6 keeps movement manual with an unhandled condition despite known arithmetic', () => {
    const facts = hToG();
    facts.movement!.targets[0]!.conditions = { kind: 'unhandled', labels: ['restrained'] };
    const result = resolved(compileAbility(hero('Brutal Slam')), facts);
    const push = result.effects.find(e => e.kind === 'push');
    expect(push).toMatchObject({ status: 'manual', subtotal: 3 });
    expect(push?.allowance).toBeUndefined();
    expect(push?.manualReasons.join(' ')).toContain('restrained');
  });

  it.each([
    [1, 2, 8, 7, 3],
    [2, 1, 5, 10, 2],
  ] as const)(
    'BS7 calculates the effective outcome from original target facts with %i banes',
    (banes, tier, damage, health, allowance) => {
      const facts = hToG();
      facts.targets[0]!.banes = banes;
      const result = resolved(compileAbility(hero('Brutal Slam')), facts);
      expect(result.roll.dice).toEqual({ d10a: 7, d10b: 7 });
      expect(result.roll.targets[0]).toMatchObject({ tier, damage: { rolledDamage: damage } });
      expect(result.roll.damageApplications[0]).toMatchObject({
        staminaBefore: 15,
        staminaAfter: health,
      });
      expect(result.effects[1]).toMatchObject({ allowance });
    },
  );

  // SC1-3 fixed +2 is a roll bonus, never an extra damage characteristic.
  it.each([
    [4, 5, 3, 27],
    [7, 7, 4, 26],
    [8, 7, 5, 25],
  ] as const)(
    'SC dice %i+%i deal printed %i damage and leave H at %i',
    (d10a, d10b, damage, staminaAfter) => {
      const facts = gToH();
      facts.dice = { d10a, d10b };
      const result = resolved(compileAbility(warrior('Spear Charge')), facts);
      expect(result.roll.targets[0]?.damage).toMatchObject({
        rolledDamage: damage,
        damageCharacteristicValue: 0,
      });
      expect(result.roll.damageApplications[0]).toMatchObject({ staminaAfter });
    },
  );

  it('SC4 consumes temporary Stamina before actual Stamina', () => {
    const facts = gToH();
    facts.targetFacts[0]!.temporaryStamina = 3;
    const result = resolved(compileAbility(warrior('Spear Charge')), facts);
    expect(result.roll.damageApplications[0]).toMatchObject({
      incoming: 4,
      absorbedByTemporaryStamina: 3,
      temporaryStaminaAfter: 0,
      staminaAfter: 29,
    });
  });

  it('BP2 calculates one 2-Malice cost and damage while requesting missing potency facts', () => {
    const facts = gToH();
    facts.resourcePool = { resource: 'malice', current: 2, legalFloor: 0 };
    const result = resolved(compileAbility(warrior('Bury the Point')), facts);
    expect(result.roll.cost).toMatchObject({ amount: 2, before: 2, after: 0 });
    expect(result.roll.damageApplications[0]?.staminaAfter).toBe(24);
    expect(result.effects.map(e => e.kind)).toEqual(['damage', 'condition']);
    expect(result.effects[1]).toMatchObject({ status: 'fact-needed', characteristic: 'M' });
    expect(result.effects[1]?.clause).toContain('M < 1');
    facts.resourcePool.current = 1;
    const blocked = resolveCompiledAbility(compileAbility(warrior('Bury the Point')), facts);
    expect(blocked).toMatchObject({ kind: 'blocked', effects: [] });
    expect(facts.targetFacts[0]?.stamina).toBe(30);
    expect(facts.resourcePool.current).toBe(1);
  });

  // E's sources: Enchantment of Destruction (+1 Magic), Fire: Acolyte of Fire (+1 Fire+Magic).
  // MI2 = 5+2+1; RA2 = 4+2+1; VF2 = 5+2+1+1. Weapon is absent so no size bonus applies.
  it.each([
    ['Meteoric Introduction', 8, 7, undefined, 3],
    ['Ray of Agonizing Self-Reflection', 7, 8, 'corruption', undefined],
    ['Viscous Fire', 9, 6, 'fire', 3],
  ] as const)(
    '%s retains keyword-qualified build bonuses and post-damage work',
    (name, rolledDamage, staminaAfter, damageType, allowance) => {
      const facts = hToG();
      facts.actor.characteristics.R = 2;
      facts.actor.abilityDamageModifiers = [
        { label: 'Enchantment of Destruction', amount: 1, keywords: ['Magic'] },
        { label: 'Fire: Acolyte of Fire', amount: 1, keywords: ['Fire', 'Magic'] },
      ];
      const result = resolved(compileAbility(hero(name)), facts);
      expect(result.roll.targets[0]?.damage).toMatchObject({ rolledDamage, kitBonus: 0 });
      expect(result.roll.targets[0]?.damage?.damageType).toBe(damageType);
      expect(result.roll.damageApplications[0]?.staminaAfter).toBe(staminaAfter);
      if (allowance !== undefined)
        expect(result.effects[1]).toMatchObject({ kind: 'push', sizeBonus: 0, allowance });
      else {
        expect(result.effects[1]).toMatchObject({ kind: 'condition', status: 'fact-needed' });
        expect(result.effects[1]?.clause).toContain('R < AVERAGE');
      }
    },
  );
});

describe('V67 compatibility arithmetic remains separate from compiled execution', () => {
  // TR1 checks projection arithmetic only. The full area/Effect envelope must still be refused
  // by the new evaluator; this is not a legacy fallback or a live-support assertion.
  it('retains Thunder Roar constant damage, per-target tiers and one payment without executing its pushes', () => {
    const definition = compileAbility(hero('Thunder Roar'));
    const facts = hToG();
    facts.dice = { d10a: 7, d10b: 6 };
    facts.targets = [
      { targetId: 'G1', edges: 1, banes: 0 },
      { targetId: 'G2', edges: 0, banes: 2 },
      { targetId: 'G3', edges: 0, banes: 0 },
    ];
    facts.targetFacts = facts.targets.map(target => ({
      ...facts.targetFacts[0]!,
      targetId: target.targetId,
    }));
    facts.resourcePool = { resource: 'ferocity', current: 6, legalFloor: 0 };
    expect(resolveCompiledAbility(definition, facts).kind).toBe('manual');
    if (!definition.metadata) throw new Error('Thunder Roar damage projection missing');
    const arithmetic = resolveAbilityRoll({ ...facts, ability: definition.metadata });
    if (arithmetic.kind !== 'resolved') throw new Error('Expected affordable arithmetic');
    expect(arithmetic.targets.map(target => target.tier)).toEqual([3, 1, 2]);
    expect(arithmetic.targets.map(target => target.damage?.rolledDamage)).toEqual([17, 6, 9]);
    expect(arithmetic.damageApplications.map(target => target.staminaAfter)).toEqual([-2, 9, 6]);
    expect(arithmetic.cost).toMatchObject({ before: 6, after: 1, amount: 5 });
  });
});

describe('V67 support report reproducibility', () => {
  it('refuses mixed source revisions instead of labeling hero content with a stale foe pin', () => {
    const mixed = structuredClone(inputs);
    mixed.foes.sourceRevision = 'different-source';
    expect(() => compiledSupportReport(mixed)).toThrow('consistent pinned Compendium');
    const objectMismatch = structuredClone(inputs);
    objectMismatch.foes.objects[0]!.source.revision = 'different-object-source';
    expect(() => compiledSupportReport(objectMismatch)).toThrow('consistent pinned Compendium');
  });

  // Reports are durable evidence. Repeated generation from the same pinned snapshot must not
  // acquire timestamps/random occurrence IDs or depend on mutation from an earlier generation.
  it('renders byte-identical JSON and Markdown from two generations of the same inputs', () => {
    const first = compiledSupportReport(inputs);
    const second = compiledSupportReport(inputs);
    expect(JSON.stringify(second, null, 2)).toBe(JSON.stringify(first, null, 2));
    expect(renderCompiledSupport(second)).toBe(renderCompiledSupport(first));
  });
});

// V88 source-derived truth tables: M < printed 0/1/2, never <=.
describe('V88 bounded potency conditions', () => {
  it.each([
    [2, ['resisted', 'resisted', 'resisted']],
    [0, ['resisted', 'applied', 'applied']],
    [-1, ['applied', 'applied', 'applied']],
  ] as const)('Bury the Point against Might %s', (might, statuses) => {
    const definition = compileAbility(warrior('Bury the Point'));
    for (const [index, dice] of (
      [
        { d10a: 4, d10b: 5 },
        { d10a: 6, d10b: 6 },
        { d10a: 8, d10b: 8 },
      ] as const
    ).entries()) {
      const facts = gToH();
      facts.dice = dice;
      facts.resourcePool = { resource: 'malice', current: 2, legalFloor: 0 };
      facts.conditionFacts = {
        targets: [{ targetId: 'H', kind: 'hero', characteristics: { M: might } }],
      };
      const outcome = resolved(definition, facts);
      expect(outcome.effects[1]).toMatchObject({
        kind: 'condition',
        status: statuses[index],
        threshold: index,
        thresholdSource: { kind: 'printed', value: index },
        targetScore: might,
        condition: 'bleeding',
        duration: 'save-ends',
        requirements: [],
      });
    }
  });

  it('RAY1 uses evaluated Reason potency even with higher Intuition', () => {
    const definition = compileAbility(hero('Ray of Agonizing Self-Reflection'));
    const facts = hToG();
    facts.actor.characteristics = { M: 0, A: 0, R: 2, I: 3, P: 0 };
    facts.conditionFacts = {
      targets: [{ targetId: 'G', kind: 'foe', characteristics: { R: 1 } }],
      potency: { characteristic: 'R', weak: 0, average: 1, strong: 2 },
    };
    for (const [index, dice] of (
      [
        { d10a: 4, d10b: 5 },
        { d10a: 6, d10b: 6 },
        { d10a: 8, d10b: 8 },
      ] as const
    ).entries()) {
      facts.dice = dice;
      const outcome = resolved(definition, facts);
      expect(outcome.effects[1]).toMatchObject({
        kind: 'condition',
        threshold: index,
        potencyCharacteristic: 'R',
        status: index === 2 ? 'applied' : 'resisted',
      });
      if (index === 1) expect(outcome.roll.damageApplications[0]?.incoming).toBe(6);
    }
    delete facts.conditionFacts.potency;
    expect(resolved(definition, facts).effects[1]).toMatchObject({
      status: 'fact-needed',
      requirements: ['actor.potency.strong'],
    });
  });

  it('WD3 keeps class-named potency independent of Might or Agility roll and damage choices', () => {
    const definition = compileAbility(hero('The Wode Defends'));
    for (const selected of ['M', 'A'] as const) {
      const facts = hToG();
      facts.actor.characteristics = { M: 2, A: 3, R: 2, I: 0, P: 0 };
      facts.selectedCharacteristic = selected;
      facts.selectedDamageCharacteristic = selected;
      facts.dice = { d10a: 6, d10b: 6 };
      facts.conditionFacts = {
        targets: [{ targetId: 'G', kind: 'foe', characteristics: { A: 0 } }],
        potency: { characteristic: 'R', weak: 0, average: 1, strong: 2 },
      };
      const average = resolved(definition, facts);
      expect(average.roll.targets[0]).toMatchObject({
        tier: 2,
        damage: { rolledDamage: selected === 'M' ? 5 : 6 },
      });
      expect(average.effects[1]).toMatchObject({
        kind: 'condition',
        status: 'applied',
        characteristic: 'A',
        condition: 'slowed',
        threshold: 1,
        thresholdSource: { kind: 'potency', tier: 'average' },
        potencyCharacteristic: 'R',
      });
      facts.dice = { d10a: 8, d10b: 8 };
      const strong = resolved(definition, facts);
      expect(strong.roll.targets[0]).toMatchObject({
        tier: 3,
        damage: { rolledDamage: selected === 'M' ? 7 : 8 },
      });
      expect(strong.effects[1]).toMatchObject({
        kind: 'condition',
        status: 'applied',
        condition: 'restrained',
        threshold: 2,
        thresholdSource: { kind: 'potency', tier: 'strong' },
        potencyCharacteristic: 'R',
      });
    }
  });

  it.each(['hero', 'foe', 'object', 'squad'] as const)(
    'missing or excluded %s scores stay fact-needed',
    kind => {
      const facts = gToH();
      facts.resourcePool = { resource: 'malice', current: 2, legalFloor: 0 };
      facts.conditionFacts = {
        targets: [
          {
            targetId: 'H',
            kind,
            ...(kind === 'object' || kind === 'squad' ? { characteristics: { M: -1 } } : {}),
          },
        ],
      };
      const effect = resolved(compileAbility(warrior('Bury the Point')), facts).effects[1];
      expect(effect).toMatchObject({ kind: 'condition', status: 'fact-needed' });
      expect(effect).not.toHaveProperty('targetScore');
      if (effect?.kind === 'condition')
        expect(effect.requirements).toContain('target:H.characteristics.M');
    },
  );

  // V113 admits bare prone, EoT and push/condition runs (see tests/scripts/tier-effects.test.ts).
  // V119 admits a bare grab (condition/grabbed.md); an EoT grab stays unsupported.
  // V153 admits "M < 1 dazed and slowed (save ends)" and "taunted (EoT), slide 1"
  // (tests/scripts/compound-conditions.test.ts); a potency before condition and movement stays out.
  it.each([
    'A < 2 grabbed (EoT)',
    'M < 1 slowed',
    "A < STRONG, prone and can't stand (save ends)",
    'M < 1 bleeding (save ends) then shift 1',
    'M < 1 slowed (save ends), slide 1',
    'M < 1 vertical push 3',
  ])('keeps unsafe remainder %s unsupported', remainder => {
    const input = warrior('Bury the Point');
    input.blocks = input.blocks.map(block =>
      block.kind === 'roll'
        ? {
            ...block,
            tiers: block.tiers.map(text => `${text.split(';')[0]}; ${remainder}`) as [
              string,
              string,
              string,
            ],
          }
        : block,
    );
    input.markdown = input.markdown.replace(
      /(^.*(?:≤11|12-16|17\+).*?;)[^\n]+/gm,
      `$1 ${remainder}`,
    );
    const definition = compileAbility(input);
    expect(definition.execution).toBe('manual');
    expect(definition.tiers.flat().some(node => node.kind === 'condition')).toBe(false);
    expect(definition.diagnostics.some(d => d.code === 'unsafe-tier-remainder')).toBe(true);
  });
});
