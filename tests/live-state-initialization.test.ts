import { readPinnedSource } from './helpers/pinned-source.ts';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { parseFrontmatter, splitFrontmatter } from '../scripts/lib/frontmatter.ts';
import type { ContentEntry } from '../shared/contracts/content.ts';
import type { DerivedBaseline, EvaluationResult } from '../shared/contracts/characterEvaluation.ts';
import type { FoeEntity, HeroEntity } from '../shared/contracts/entities.ts';
import type { ConditionId } from '../shared/contracts/liveState.ts';

// R03 acceptance checks 1 to 4 for the two worked projections embedded in
// docs/live-state-initialization.md. Expected values are read from the pinned Compendium files, the
// S01 snapshot entries and R02's example JSON, never from application code.

const root = process.cwd();
const doc = readFileSync(join(root, 'docs/live-state-initialization.md'), 'utf8');
const revision = execFileSync(
  'git',
  ['-C', join(root, 'vendor/steel-compendium'), 'rev-parse', 'HEAD'],
  {
    encoding: 'utf8',
  },
).trim();

function example<T>(name: string): T {
  const blocks = [...doc.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m => JSON.parse(m[1]));
  const found = blocks.find(b => b.$example === name);
  assert.ok(found, `document has no ${name} example`);
  return found as T;
}
const vendor = (rel: string) => readPinnedSource(root, rel);
const snapshot = <K extends string>(kind: K) =>
  JSON.parse(
    readFileSync(join(root, `shared/content/compendium/${kind}.json`), 'utf8'),
  ) as ContentEntry[];
const conditionIds: ConditionId[] = [
  'bleeding',
  'dazed',
  'frightened',
  'grabbed',
  'prone',
  'restrained',
  'slowed',
  'taunted',
  'weakened',
];
const coreConditions = JSON.parse(
  readFileSync(join(root, 'shared/content/core-conditions.json'), 'utf8'),
) as { conditions: { id: string }[] };
const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

const hero = example<HeroEntity & { $example: string }>('hero-fixture');
const foe = example<FoeEntity & { $example: string }>('goblin-warrior');
const r02 = JSON.parse(
  readFileSync(join(root, 'shared/content/character-evaluation-examples.json'), 'utf8'),
) as { examples: { complete: { expected: EvaluationResult } } };
const baseline = r02.examples.complete.expected.baseline as DerivedBaseline;

test('R03 check 3: the Goblin Warrior projection equals the snapshot entry and the vendor file', () => {
  const entry = snapshot('statblock').find(e => e.id === foe.contentId);
  assert.ok(entry, 'snapshot has the Goblin Warrior');
  const raw = vendor(entry.sourcePath);
  assert.equal(entry.text, raw);
  assert.equal(foe.text, raw);
  assert.equal(foe.source.path, entry.sourcePath);
  assert.equal(foe.source.revision, revision);
  const fm = parseFrontmatter(splitFrontmatter(raw).frontmatter) as Record<string, unknown>;
  assert.equal(fm.stamina, '15');
  assert.equal(foe.maxima.staminaMaximum, Number(fm.stamina));
  assert.equal(foe.maxima.freeStrike, fm.free_strike);
  assert.equal(foe.maxima.speed, fm.speed);
  assert.equal(foe.maxima.stability, fm.stability);
  assert.equal(foe.maxima.sizeCategory, fm.size);
  assert.equal(foe.level, fm.level);
  assert.deepEqual(foe.characteristics, {
    M: fm.might,
    A: fm.agility,
    R: fm.reason,
    I: fm.intuition,
    P: fm.presence,
  });
  assert.ok(
    vendor('vendor/steel-compendium/en/unified/md/rule/health/winded.md').includes('half your'),
  );
  assert.equal(foe.maxima.windedValue, Math.floor(foe.maxima.staminaMaximum / 2));
  assert.ok(raw.includes('| **-**<br>Immunity |') && raw.includes('**-**<br>Weakness'));
  assert.deepEqual(foe.maxima.immunities, []);
  assert.deepEqual(foe.maxima.weaknesses, []);
  // Initial live values: printed Stamina, no temporary Stamina, every toggle off, not Slain.
  assert.equal(foe.live.stamina, foe.maxima.staminaMaximum);
  assert.equal(foe.live.temporaryStamina, 0);
  assert.deepEqual(Object.keys(foe.live.conditions), conditionIds);
  assert.deepEqual(
    coreConditions.conditions.map(c => c.id),
    conditionIds,
  );
  assert.ok(Object.values(foe.live.conditions).every(v => v === false));
  assert.equal(foe.labels.slain, false);
  assert.equal(foe.labels.winded, false);
  assert.ok(
    vendor('vendor/steel-compendium/en/unified/md/rule/health/stamina.md').includes(
      'Director-controlled creatures die or are destroyed when their',
    ),
  );
  // Abilities and traits are exactly the entry's features, in printed order, with verbatim blocks.
  const features = entry.features as Record<string, unknown>[];
  const abilities = features.filter(f => f.feature_type === 'ability');
  const traits = features.filter(f => f.feature_type === 'trait');
  assert.equal(foe.abilities.length, abilities.length);
  foe.abilities.forEach((a, i) => {
    const f = abilities[i];
    const effect = (f.effects as Record<string, string>[])[0];
    assert.equal(a.name, f.name);
    assert.equal(a.usage, f.usage);
    assert.equal(a.distance, f.distance);
    assert.equal(a.target, f.target);
    assert.deepEqual(a.keywords, f.keywords);
    assert.equal(a.cost, f.cost);
    assert.equal(a.roll, effect.roll);
    assert.deepEqual(a.tiers, [effect.tier1, effect.tier2, effect.tier3]);
    assert.equal(a.kind, f.ability_type === 'Signature Ability' ? 'signature' : 'malice');
    assert.ok(raw.includes(a.text), `${a.name} block is verbatim in the stat block`);
    assert.ok(a.text.startsWith(`> 🗡 **${a.name}`));
    assert.equal(a.metadata.fixedRollBonus, 2);
    assert.equal(a.metadata.actionType, 'main action');
    assert.deepEqual(a.metadata.fixedCost, f.cost ? { resource: 'malice', amount: 2 } : undefined);
  });
  assert.deepEqual(
    foe.abilities.map(a => a.name),
    ['Spear Charge', 'Bury the Point'],
  );
  assert.equal(foe.traits.length, traits.length);
  assert.equal(foe.traits[0].name, 'Crafty');
  assert.ok(raw.includes(foe.traits[0].text));
  assert.ok(foe.traits[0].text.includes((traits[0].effects as { effect: string }[])[0].effect));
});

test('R03 check 2: the hero projection lists exactly the R02-granted abilities with verbatim source', () => {
  assert.deepEqual(
    hero.abilities.map(a => a.name),
    baseline.abilities.map(a => a.name),
  );
  const abilityEntries = snapshot('ability');
  hero.abilities.forEach((a, i) => {
    const grant = baseline.abilities[i];
    assert.equal(a.kind, grant.kind);
    assert.equal(a.metadata.kitBonusesIncluded, grant.kitBonusesIncluded);
    assert.ok(vendor(a.source.path), `${a.source.path} exists in the pinned source`);
    assert.equal(a.source.revision, revision);
    const raw = vendor(a.source.path);
    assert.equal(a.text, raw, `${a.name}: text is the complete pinned file`);
    const fm = parseFrontmatter(splitFrontmatter(raw).frontmatter) as Record<string, unknown>;
    assert.equal(a.abilityId, fm.scc);
    assert.equal(a.name, fm.name);
    assert.equal(a.usage, fm.action_type);
    assert.equal(a.distance, fm.distance);
    assert.equal(a.target, fm.target);
    assert.deepEqual(a.keywords, fm.keywords);
    assert.equal(a.cost, fm.cost);
    if (fm.tier1) assert.deepEqual(a.tiers, [fm.tier1, fm.tier2, fm.tier3]);
    else assert.equal(a.tiers, undefined);
    assert.equal(a.trigger, fm.trigger);
    assert.deepEqual(a.metadata.keywords, (fm.keywords as string[]).map(plain));
    const cost = /^(\d+) (\w+)$/.exec(String(fm.cost ?? ''));
    assert.deepEqual(
      a.metadata.fixedCost,
      cost ? { resource: cost[2].toLowerCase(), amount: Number(cost[1]) } : undefined,
    );
    const entry = abilityEntries.find(e => e.id === a.abilityId);
    if (a.name === 'Pain for Pain') {
      assert.equal(entry, undefined, 'the kit signature ability has no standalone snapshot entry');
      assert.equal(a.contentId, 'mcdm.heroes.v1/kit/mountain');
      const kit = snapshot('kit').find(e => e.id === a.contentId);
      assert.ok(kit && kit.text.includes('###### Pain for Pain'));
    } else {
      assert.ok(entry, `${a.abilityId} is in the snapshot`);
      assert.equal(entry.text, a.text);
      assert.equal(a.contentId, entry.id);
    }
  });
  assert.equal(hero.abilities.length, 7);
  assert.deepEqual(
    hero.features.map(f => f.name),
    [...baseline.traits, ...baseline.features, ...baseline.perks].map(f => f.name),
  );
  for (const f of hero.features) {
    const raw = vendor(f.source.path);
    if (f.contentId) assert.equal(f.text, raw);
    else assert.ok(raw.includes(f.text), `${f.name}: sentence is verbatim in ${f.source.path}`);
  }
});

test('R03 check 1: every hero initial value equals its baseline field or its sourced constant', () => {
  const v = <T>(d: { value: T }): T => d.value;
  assert.equal(hero.live.stamina, v(baseline.staminaMaximum));
  assert.equal(hero.live.stamina, 30);
  assert.equal(hero.live.recoveries, v(baseline.recoveriesMaximum));
  assert.equal(hero.live.heroicResource.name, v(baseline.heroicResource.name));
  assert.equal(hero.live.heroicResource.current, v(baseline.heroicResource.startingValue));
  assert.equal(hero.live.temporaryStamina, 0);
  assert.equal(hero.live.surges, 0);
  assert.equal(hero.live.victories, 0);
  assert.equal(hero.live.xp, 0);
  assert.deepEqual(Object.keys(hero.live.conditions), conditionIds);
  assert.ok(Object.values(hero.live.conditions).every(x => x === false));
  const md = 'vendor/steel-compendium/en/unified/md/';
  assert.ok(
    vendor(`${md}rule/resource/victories.md`).includes(
      'At the start of an adventure, your hero has 0 Victories.',
    ),
  );
  assert.ok(
    vendor(`${md}rule/resource/surge.md`).includes(
      'At the end of combat, you lose any surges you have remaining.',
    ),
  );
  assert.ok(
    vendor(`${md}rule/health/temporary-stamina.md`).includes(
      'disappears at the end of an encounter',
    ),
  );
  assert.ok(/\| 1st\s+\| 0-15\s+\|/.test(vendor(`${md}chapter/making-a-hero.md`)));
  assert.ok(vendor(`${md}rule/resource/respite.md`).includes('you regain all your'));
  assert.ok(vendor(`${md}rule/combat/condition.md`).includes('called conditions to a creature'));
  // Maxima and kit copy the baseline; labels follow R04 6.3/6.4.
  assert.equal(hero.maxima.staminaMaximum, v(baseline.staminaMaximum));
  assert.equal(hero.maxima.recoveriesMaximum, v(baseline.recoveriesMaximum));
  assert.equal(hero.maxima.recoveryValue, v(baseline.recoveryValue));
  assert.equal(hero.maxima.windedValue, v(baseline.windedValue));
  assert.equal(hero.maxima.speed, v(baseline.speed));
  assert.equal(hero.maxima.stability, v(baseline.stability));
  assert.equal(hero.maxima.sizeCategory, v(baseline.size));
  assert.equal(hero.maxima.savingThrowThreshold, v(baseline.savingThrowThreshold));
  assert.deepEqual(hero.kit?.meleeDamageBonus, v(baseline.kit!.meleeDamageBonus));
  assert.equal(hero.kit?.staminaBonusApplied, v(baseline.kit!.staminaBonusApplied));
  for (const k of ['M', 'A', 'R', 'I', 'P'] as const)
    assert.equal(hero.characteristics[k], v(baseline.characteristics[k]));
  assert.equal(hero.labels.windedValue, Math.floor(hero.maxima.staminaMaximum / 2));
  assert.equal(hero.labels.winded, hero.live.stamina <= hero.labels.windedValue);
  assert.equal(hero.labels.winded, false);
  assert.equal(hero.labels.dying, false);
  assert.deepEqual(hero.uncertainties, baseline.uncertainties);
});

test('R03 check 4: the one-sentence rule and every cited question id are present', () => {
  assert.ok(
    doc.includes(
      '**In one sentence: saving a draft and re-evaluating a build recompute only the derived baseline',
    ),
  );
  const questions = readFileSync(join(root, 'docs/rules-questions-for-user.md'), 'utf8');
  for (const id of [
    'Q-CHAR-2',
    'Q-R-200',
    'Q-R-201',
    ...hero.uncertainties,
    ...foe.uncertainties,
  ]) {
    assert.ok(doc.includes(id), `document mentions ${id}`);
    assert.ok(questions.includes(`### ${id}:`), `${id} is in the questions file`);
  }
});
