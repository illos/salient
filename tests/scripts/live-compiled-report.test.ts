// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { liveCompiledSupportReport } from '../../scripts/report-live-compiled-abilities.ts';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility } from '../../shared/resolve/compileAbility.ts';
import { resolveCompiledAbility } from '../../shared/resolve/compiledOutcome.ts';

// This inventory assertion catches an unnoticed new live migration; it is not runtime dispatch.
test('V72 availability follows current grants and loading, not catalog presence', () => {
  const report = liveCompiledSupportReport();
  expect(
    report.entries
      .filter(e => e.live === 'compiled')
      .map(e => e.name)
      .sort(),
  ).toEqual(
    [
      'Behold a Shield of Faith!',
      'Blessed Light',
      'Command Saber',
      'Drain',
      'Driving Assault',
      'Driving Pounce',
      'Fancy Footwork',
      'Get In Get Out',
      'Grasp of Beyond',
      'Hamstring Shot',
      'Hit and Run',
      'Inertial Step',
      'Instigator',
      "Raider's Awe",
      'Protective Attack',
      'The Gods Punish and Defend',
      "Warrior's Prayer",
      // V87 seeds the full core corpus: both Worg Bite and Ghoul Razor Claws are reachable.
      'Bite',
      'Bola Knock',
      'Brutal Slam',
      'Bury the Point',
      // V94: the Tactician's 3-Focus Concussive Strike is reachable through the class ability choice.
      'Concussive Strike',
      'Curse of Terror',
      'Cutting Sarcasm',
      // V92: the Shadow's 3-Insight Eviscerate is reachable through the class ability choice.
      'Eviscerate',
      'Eye Flash',
      'Eye of Surlach',
      'Halt Miscreant!',
      'Melee Weapon Free Strike',
      'Meteoric Introduction',
      'Pinning Shot',
      'Power Chord',
      'Pressure Points',
      'Ranged Weapon Free Strike',
      'Ray of Agonizing Self-Reflection',
      'Razor Claws',
      'Repent!',
      'Spear Charge',
      'The Wode Defends',
      'Viscous Fire',
      // V110: counted and area envelopes; each name is a whole-envelope source review in V110.
      'Back Blasphemer!',
      'Back!',
      'Bifurcated Incineration',
      'Draconian Pride',
      'Quick Rewrite',
      'Two Throats at Once',
      'Unquiet Ground',
      'Forward Thrust, Backward Smash',
      'Two Shot',
      'Bloodletting Claws',
      'Corrosive Claws',
      'Flurry of Bites',
      'Force Redirected',
      'Gatling Bolt Gun',
      'Gore',
      'Ice Lob',
      'Leg Blade',
      'Mind Jolt',
      'Natural Weapon',
      'Pneumatic Punch',
      'Psionic Intrusion',
      'Reclamation',
      'Roar',
      'Seismic Slam',
      'Shadow Chains',
      'Snake Bites',
      'Spinning Spit',
      'Spittlesplash',
      'Stunning Blast',
      'Toxic Vapors',
      'Wild Swing',
      // V113: tier forced movement, EoT and prone conditions and effect runs after damage.
      'Blade Rake',
      'Elemental Charge',
      'Entropic Field',
      'Explosion',
      'Extension of My Arm',
      'Flamelash',
      'Flaming Kick',
      'Gasping in Pain',
      'Heavy Crossbolt',
      'Holy Lash',
      'Magnetic Strike',
      'Natural Weapon',
      'Natural Weapon',
      'Net and Stab',
      'Overwhelming Rend',
      'Reverberating Blast',
      'Shield Bash',
      'Shield Bash',
      'Staggering Curse',
      'Suffusing Strike',
      'Synlirii Grafts',
      'Telekinetic Beam',
      'The Writhing Green',
      'Toothful Thrashing',
      'Tumbling Gore',
      'Unbalancing Attack',
      'Where I Want You',
      'Whip Frenzy',
      // V119: a bare grab (condition/grabbed.md) after damage.
      'Joint Lock',
      'Bear Claws',
      'Gravitic Strike',
      'Tentacle',
      'Killer Claws',
      'Nature Judges Thee',
      'Rotten Smash',
      "Volcano's Embrace",
      "Saint's Tempest",
      // V152: whole Effect sections that are table work (movement, Recoveries, ended effects).
      'Your Allies Cannot Save You!',
      'Lightfall',
      'Sacrificial Offer',
      'Soul Siphon',
      'Words of Wrath and Grace',
      'Afflict a Bountiful Decay',
      'Test of Rain',
      'The Green Within, the Green Without',
      'A Squad Unto Myself',
      'Dance of Blows',
      'Disorienting Strike',
      'Misdirecting Strike',
      "I've Got Your Back",
      'Choke',
      'En Garde!',
      'Infernal Gavotte',
      'Wing Buffet',
      "Let's Dance",
      // V153: compound conditions with one shared save, and a condition then forced movement.
      'Death... Death!',
      'Kinetic Strike',
      'Stunning Blow',
      'Stun',
      'Disarrange Thoughts',
      'Incapacitate',
      'Deaden',
      'Disorientate',
      'Numb',
      'Poison Fumes',
      // V154: tiers without damage and whole tier clauses that are table work.
      'In a Puff of Ash',
      'Battle Cry',
      'Inspiring Strike',
      'Power Chord',
      'Fade',
      'Muddle the Mind',
      'Web',
      // V155: prone and a timed restriction on standing (automation rulings, section 5).
      "Judgment's Hammer",
      'Staggering Blow',
      'Mindpunk',
      'Dizzying Hex',
      // V157: abilities without a power roll; gains applied, other clauses recorded in order.
      'Steelbreaker',
      "Saint's Raiment",
      'Sermon of Grace',
      'Now!',
      'Squad! Forward!',
      'Shadowstrike',
      'Blur',
      // V158: a lasting Effect section that is table work, tracked as an effect instance.
      'Relentless Nemesis',
      // V159: a stability modifier the engine applies, and 2 surges (effect-only).
      'Squad! On Me!',
      // V170: a Strained section the engine applies when the Talent is strained.
      'Mind Spike',
      'Spirit Sword',
      // V171: watchers the engine fires (a turn end, and damage the target deals).
      'Blessing of Insight',
      'Violence Will Not Aid Thee',
      // V173: triggered actions offered on observed damage (effect-only).
      'Feedback Loop',
      'Riposte',
      // V174: responses that revise the triggering damage (effect-only, with a Spend section).
      'Inertial Shield',
      'Skin Like Castle Walls',
      'Parry',
      'Defensive Roll',
      'In All This Confusion',
      'Unearthly Reflexes',
      // V175: the Tactician's Mark, and two level-3 abilities that watch damage to marked creatures.
      'Mark',
      "Hit 'Em Hard!",
      'Stay Strong and Focus!',
    ].sort(),
  );
  expect(
    report.entries
      .filter(e => e.execution === 'supported' && e.live === 'not-reachable')
      .map(e => e.name)
      .sort(),
  ).toEqual([]);
});

// V157: the seven effect-only abilities, V159's Squad! On Me!, V171's Blessing of Insight and V173's
// Feedback Loop and Riposte, V174's six damage-changing responses, and V175's Mark, Hit 'Em Hard!
// and Stay Strong and Focus! are counted; no foe ability is effect-only.
test('V157 effect-only abilities are counted in the live report', () => {
  const report = liveCompiledSupportReport();
  const effectOnly = report.entries.filter(e => e.live === 'compiled' && e.effectOnly);
  expect(report.liveCounts.compiledEffectOnly).toBe(20);
  expect(effectOnly.every(e => e.context.corpus === 'hero-standalone')).toBe(true);
});

// Pinned Ghoul and Worg source: fixed +2 roll, constant 3/4/5 damage. No Agility damage bonus.
// These comparisons add no live creature or grant and execute none of the parent traits.
test.each([
  ['Razor Claws', /\/ghoul$/],
  ['Bite', /\/worg$/],
] as const)('%s retains independently checked pure constant-damage arithmetic', (name, parent) => {
  const inputs = readInputs();
  const source = buildCorpus(inputs).envelopes.find(
    e => e.name === name && parent.test(e.parent ?? ''),
  )!;
  const definition = compileAbility(compilerEnvelope(source, inputs));
  expect(definition.execution).toBe('supported');
  for (const [a, b, tier, damage] of [
    [4, 5, 1, 3],
    [7, 7, 2, 4],
    [8, 7, 3, 5],
  ] as const) {
    const outcome = resolveCompiledAbility(definition, {
      actor: { actorId: 'source', characteristics: { M: 0, A: 2, R: -2, I: 0, P: -1 } },
      targets: [{ targetId: 'hero', edges: 0, banes: 0 }],
      dice: { d10a: a, d10b: b },
      inCombat: true,
      targetFacts: [
        {
          targetId: 'hero',
          kind: 'hero',
          stamina: 30,
          maxStamina: 30,
          temporaryStamina: 0,
          immunities: [],
          weaknesses: [],
        },
      ],
    });
    expect(outcome.kind).toBe('resolved');
    if (outcome.kind !== 'resolved') throw new Error('Missing pure resolution');
    expect(outcome.roll.targets[0]).toMatchObject({
      total: a + b + 2,
      tier,
      damage: { rolledDamage: damage },
    });
    expect(outcome.roll.damageApplications[0]).toMatchObject({ staminaAfter: 30 - damage });
    expect(outcome.effects.filter(e => e.kind === 'push')).toEqual([]);
    const manual = outcome.effects.filter(e => e.kind === 'condition');
    expect(manual).toHaveLength(name === 'Razor Claws' && tier === 3 ? 1 : 0);
    if (manual.length) expect(manual[0]!.clause).toMatch(/M < 2 .*bleeding.*save ends/);
  }
});

// Shadow/level-3/pinning-shot: A < weak/average/strong, restrained (save ends).
// Sniper: +0/+0/+4 ranged damage; no other combat modifiers.
test('Pinning Shot evaluates each source potency threshold strictly after tier damage', () => {
  const inputs = readInputs();
  const source = buildCorpus(inputs).envelopes.find(e => e.name === 'Pinning Shot')!;
  const definition = compileAbility(compilerEnvelope(source, inputs));
  expect(definition.execution).toBe('supported');
  for (const [d10a, d10b, tier, threshold, damage] of [
    [4, 5, 1, 0, 10],
    [7, 7, 2, 1, 14],
    [8, 7, 3, 2, 22],
  ] as const) {
    for (const [agility, status] of [
      [threshold - 1, 'applied'],
      [threshold, 'resisted'],
    ] as const) {
      const outcome = resolveCompiledAbility(definition, {
        actor: {
          actorId: 'shadow',
          characteristics: { M: 2, A: 2, R: 1, I: 1, P: -1 },
          kitRangedDamageBonus: [0, 0, 4],
        },
        targets: [{ targetId: 'target', edges: 0, banes: 0 }],
        dice: { d10a, d10b },
        inCombat: true,
        resourcePool: { resource: 'insight', current: 7, legalFloor: 0 },
        targetFacts: [
          {
            targetId: 'target',
            kind: 'hero',
            stamina: 30,
            maxStamina: 30,
            temporaryStamina: 0,
            immunities: [],
            weaknesses: [],
          },
        ],
        conditionFacts: {
          potency: { characteristic: 'A', weak: 0, average: 1, strong: 2 },
          targets: [{ targetId: 'target', kind: 'hero', characteristics: { A: agility } }],
        },
      });
      expect(outcome.kind).toBe('resolved');
      if (outcome.kind !== 'resolved') throw new Error('Pinning Shot did not resolve');
      expect(outcome.roll.targets[0]).toMatchObject({ tier, damage: { rolledDamage: damage } });
      expect(outcome.roll.cost).toMatchObject({ amount: 7, after: 0 });
      expect(outcome.effects.find(e => e.kind === 'condition')).toMatchObject({
        status,
        condition: 'restrained',
        duration: 'save-ends',
        threshold,
        targetScore: agility,
      });
    }
  }
});

// Censor/level-1: Halt Miscreant! tests P, Repent! tests I; both strict P-derived 0/1/2 potency.
test.each([
  ['Halt Miscreant!', 'P', 'slowed', [4, 7, 9], 0, 'wrath'],
  ['Repent!', 'I', 'dazed', [7, 10, 13], 3, 'wrath'],
  // Conduit/level-1/curse-of-terror: I-derived potency, 6/9/13 + I holy, 5 Piety.
  ['Curse of Terror', 'I', 'frightened', [8, 11, 15], 5, 'piety'],
  // Troubadour/level-1/cutting-sarcasm: P-derived bleeding, printed 2/5/7 + P psychic.
  ['Cutting Sarcasm', 'P', 'bleeding', [4, 7, 9], 0, 'drama'],
  // Null Pressure Points: A roll2, I-derived potency; target Agility, strict thresholds.
  ['Ray of Agonizing Self-Reflection', 'R', 'slowed', [4, 6, 8], 0, 'essence'],
  ['Pressure Points', 'A', 'weakened', [6, 9, 11], 0, 'discipline'],
] as const)(
  '%s retains each strict source threshold and resource cost',
  (name, characteristic, condition, damages, cost, resource) => {
    const inputs = readInputs();
    const source = buildCorpus(inputs).envelopes.find(e => e.name === name)!;
    const definition = compileAbility(compilerEnvelope(source, inputs));
    for (const [d10a, d10b, tier, threshold] of [
      [4, 5, 1, 0],
      [7, 7, 2, 1],
      [8, 7, 3, 2],
    ] as const) {
      for (const [score, status] of [
        [threshold - 1, 'applied'],
        [threshold, 'resisted'],
      ] as const) {
        const outcome = resolveCompiledAbility(definition, {
          actor: {
            actorId: 'censor',
            characteristics: {
              M: 2,
              A: resource === 'discipline' ? 2 : 1,
              R: resource === 'essence' ? 2 : 1,
              I: ['piety', 'discipline'].includes(resource) ? 2 : -1,
              P: 2,
            },
          },
          targets: [{ targetId: 'target', edges: 0, banes: 0 }],
          dice: { d10a, d10b },
          inCombat: true,
          resourcePool: { resource, current: cost, legalFloor: 0 },
          targetFacts: [
            {
              targetId: 'target',
              kind: 'hero',
              stamina: 30,
              maxStamina: 30,
              temporaryStamina: 0,
              immunities: [],
              weaknesses: [],
            },
          ],
          conditionFacts: {
            potency: {
              characteristic:
                resource === 'essence'
                  ? 'R'
                  : ['piety', 'discipline'].includes(resource)
                    ? 'I'
                    : 'P',
              weak: 0,
              average: 1,
              strong: 2,
            },
            targets: [
              { targetId: 'target', kind: 'hero', characteristics: { [characteristic]: score } },
            ],
          },
        });
        expect(outcome.kind).toBe('resolved');
        if (outcome.kind !== 'resolved') throw new Error(name);
        expect(outcome.roll.targets[0]).toMatchObject({
          tier,
          damage: { rolledDamage: damages[tier - 1] },
        });
        if (cost) expect(outcome.roll.cost).toMatchObject({ amount: cost, after: 0 });
        expect(outcome.effects.find(e => e.kind === 'condition')).toMatchObject({
          status,
          condition,
          duration: 'save-ends',
          threshold,
          targetScore: score,
        });
      }
    }
  },
);
