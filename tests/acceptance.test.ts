import { test } from 'vitest';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadHeroAbility, loadMonster, loadScenario } from '../src/content.ts';
import { parseAbility } from '../src/parser.ts';
import { applyManual, resolveAbility } from '../src/engine.ts';
import { createRun, currentState, navigate, readRun, submitCommand, writeRun } from '../src/history.ts';
import type { AbilityCommand, AbilitySource, Command, GameState, Scenario } from '../src/contracts.ts';

function action(id: string, actorId: string, abilityId: string, targetId: string): AbilityCommand {
  return { kind: 'use-ability', id, actorId, abilityId, targetIds: [targetId], roll: [5, 5],
    facts: { targetsConfirmed: true, edges: 0, banes: 0, distances: { [targetId]: 1 }, furyFerocityPeak: 0 } };
}
const evaluate = (scenario: Scenario) => (state: GameState, command: Command) => command.kind === 'manual'
  ? applyManual(state, command)
  : resolveAbility(state, parseAbility(scenario.abilities[command.abilityId]), command);

test('unsupported real ability can be completed manually, saved, rewound, and deduplicated', async () => {
  const scenario = await loadScenario();
  const run = createRun(scenario);
  const dir = await mkdtemp(join(tmpdir(), 'ds-acceptance-'));
  const path = join(dir, 'manual.json');
  let calls = 0;
  const modifier = (state: GameState, command: Command) => { calls++; return evaluate(scenario)(state, command); };
  const persist = async (record: typeof run) => writeRun(path, record);
  try {
    await submitCommand(run, { kind: 'manual', id: 'turn-start', reason: 'Supplied first-turn d3 was 3', changes: [{ kind: 'resource', entityId: 'fury', resource: 'ferocity', value: 3 }] }, modifier, { persist });
    const unsupported = action('slide', 'fury', 'fury:out-of-the-way', 'warrior');
    unsupported.facts.furyFerocityPeak = 3;
    const pending = await submitCommand(run, unsupported, modifier, { persist });
    assert.equal(pending.output?.status, 'manual-required');
    assert.equal(pending.after.entities.fury.resources.ferocity, 3, 'Unsupported action has not spent its cost');
    assert.equal(pending.after.entities.warrior.stamina, 15, 'Recognized damage fragment is not prematurely applied');
    assert.match(scenario.abilities[unsupported.abilityId].text, /opportunity attack/);
    // Out of the Way tier2 at M2: 5+2 damage, cost3. Table chooses no slide,
    // hence no following movement or opportunity-attack damage sharing.
    const completion: Command = { kind: 'manual', id: 'finish-slide', reason: 'Out of the Way tier2: 7 damage, spend 3 Ferocity; choose zero slide, no following movement.',
      changes: [{ kind: 'resource', entityId: 'fury', resource: 'ferocity', value: 0 }, { kind: 'stamina', entityId: 'warrior', value: 8 }],
      completePendingIds: pending.after.pending.map(p => p.id) };
    await submitCommand(run, completion, modifier, { persist });
    const final = currentState(run);
    assert.equal(final.entities.warrior.stamina, 8);
    assert.equal(final.entities.fury.resources.ferocity, 0);
    assert.deepEqual(final.pending, []);
    await submitCommand(run, completion, modifier, { persist });
    assert.equal(calls, 3);
    const reopened = await readRun(path);
    assert.deepEqual(currentState(reopened), final);
    assert.deepEqual(navigate(reopened, -1), pending.after);
    assert.deepEqual(navigate(reopened, -2), scenario.state);
    assert.deepEqual(navigate(reopened, 3), final);
    assert.equal(calls, 3, 'History navigation never calls a modifier');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('shared history records squad pool casualties and a surviving minion action', async () => {
  const scenario = await loadScenario({ includeSquad: true });
  const run = createRun(scenario), modifier = evaluate(scenario);
  const slam = action('cleave-squad', 'fury', 'fury:brutal-slam', 'spine-1');
  slam.roll = [8, 8]; // total18, tier3: 9+M2+Mountain4 =15
  slam.facts.casualtyOrder = ['spine-1', 'spine-2', 'spine-3'];
  slam.facts.movement = { 'spine-1': { distance: 0, stabilityReduction: 0, collision: false } };
  const hit = await submitCommand(run, slam, modifier);
  assert.equal(hit.output?.status, 'resolved');
  assert.equal(hit.after.squads['spine-squad'].stamina, 5);
  assert.deepEqual(['spine-1', 'spine-2', 'spine-3'].map(id => hit.after.entities[id].defeated), [true, true, true]);
  const answer = action('last-minion', 'spine-4', 'spine:axe', 'fury');
  answer.facts.squadAttackers = ['spine-4'];
  answer.facts.movement = { fury: { distance: 0, stabilityReduction: 0, collision: false } };
  const retaliate = await submitCommand(run, answer, modifier);
  assert.equal(retaliate.output?.status, 'resolved');
  assert.equal(retaliate.after.entities.fury.stamina, 26, 'Axe tier2 is 4 damage');
  assert.equal(retaliate.after.entities.fury.resources.ferocity, 1);
  const final = currentState(run);
  assert.deepEqual(navigate(run, -2), scenario.state);
  assert.deepEqual(navigate(run, 2), final);
});

test('held-out monster ability and renamed numeric homebrew use the same grammar; extra hero effect stays visible', async () => {
  // These abilities were reserved by the integration reviewer, outside parser development fixtures.
  const runner = await loadMonster('monster/goblin/statblock/goblin-runner', 'runner', 'runner');
  const club = runner.abilities.find(a => a.name === 'Club Charge')!;
  const parsed = parseAbility(club);
  assert.deepEqual(parsed.diagnostics, []);
  assert.deepEqual(parsed.roll, { constant: 2 });
  assert.deepEqual(parsed.tiers, [1, 2, 3].map(constant => [{ kind: 'damage', amount: { constant } }]));

  const scenario = await loadScenario();
  const spear = scenario.abilities['warrior:spear-charge'];
  const homebrew: AbilitySource = { ...structuredClone(spear), id: 'homebrew:glass-pike', name: 'Glass Pike',
    source: { id: 'homebrew:glass-pike', path: 'inline', revision: 'test-v1' },
    text: spear.text.replaceAll('Spear Charge', 'Glass Pike').replaceAll('4 damage', '7 damage'),
    tiers: spear.tiers!.map(tier => tier.replaceAll('4 damage', '7 damage')) as [string, string, string] };
  scenario.state.entities.warrior.abilities.push(homebrew.id);
  const brew = parseAbility(homebrew);
  assert.deepEqual(brew.diagnostics, []);
  const hit = resolveAbility(scenario.state, brew, action('brew', 'warrior', homebrew.id, 'fury'));
  assert.equal(hit.status, 'resolved');
  assert.equal(hit.state.entities.fury.stamina, 23, 'Changed text produces changed damage without a named handler');

  const thunder = await loadHeroAbility('feature/ability/conduit/level-1/call-the-thunder-down', 'holdout:thunder');
  const unsupported = parseAbility(thunder);
  assert.ok(unsupported.diagnostics.some(d => /willing ally/.test(d)), 'Full extra effect cannot disappear behind recognized tiers');
  assert.match(unsupported.source.text, /ignoring.*stability/);
});
