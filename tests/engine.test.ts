import test from 'node:test';
import assert from 'node:assert/strict';
import { loadScenario } from '../src/content.ts';
import { parseAbility } from '../src/parser.ts';
import { applyManual, resolveAbility } from '../src/engine.ts';
import type { AbilityCommand, GameState } from '../src/contracts.ts';

const source = await loadScenario({ includeSquad: true });
const initial = () => structuredClone(source.state);
const parsed = (id: string) => parseAbility(source.abilities[id]);
function action(actorId = 'warrior', abilityId = 'warrior:spear-charge', targetId = 'fury'): AbilityCommand {
  return { kind: 'use-ability', id: 'attack', actorId, abilityId, targetIds: [targetId], roll: [5, 5], facts: { targetsConfirmed: true, distances: { [targetId]: 1 }, edges: 0, banes: 0, furyFerocityPeak: 0 } };
}
const slam = () => action('fury', 'fury:brutal-slam', 'warrior');
function assertUntouched(before: GameState, returned: GameState) { assert.deepEqual(returned, before); }

test('real Spear Charge changes actual Fury Stamina and gains Ferocity once per round', () => {
  // Goblin Warrior tier2: 4 damage. Fury Ferocity: first damage each round +1.
  const before = initial(), snapshot = structuredClone(before);
  const first = resolveAbility(before, parsed('warrior:spear-charge'), action());
  assert.equal(first.status, 'resolved');
  assert.equal(first.state.entities.fury.stamina, 26);
  assert.equal(first.state.entities.fury.resources.ferocity, 1);
  const second = resolveAbility(first.state, parsed('warrior:spear-charge'), { ...action(), id: 'again' });
  assert.equal(second.state.entities.fury.stamina, 22);
  assert.equal(second.state.entities.fury.resources.ferocity, 1);
  const newRound = applyManual(second.state, { kind: 'manual', id: 'round2', reason: 'Table begins round two', changes: [{ kind: 'round', value: 2 }] });
  const third = resolveAbility(newRound.state, parsed('warrior:spear-charge'), { ...action(), id: 'third' });
  assert.equal(third.state.entities.fury.stamina, 18);
  assert.equal(third.state.entities.fury.resources.ferocity, 2);
  assert.deepEqual(before, snapshot, 'Input state remains immutable');
});

test('first becoming winded requests its d3 before committing any damage or resource gain', () => {
  const before = initial(); before.entities.fury.stamina = 18;
  const missing = resolveAbility(before, parsed('warrior:spear-charge'), action());
  assert.equal(missing.status, 'needs-input'); assertUntouched(before, missing.state);
  const done = resolveAbility(before, parsed('warrior:spear-charge'), { ...action(), ferocityRoll: 2 });
  assert.equal(done.state.entities.fury.stamina, 14);
  assert.equal(done.state.entities.fury.resources.ferocity, 3);
  assert.equal(done.state.entities.fury.fury?.windedTriggered, true);
  const again = resolveAbility(done.state, parsed('warrior:spear-charge'), { ...action(), id: 'again' });
  assert.equal(again.state.entities.fury.stamina, 10);
  assert.equal(again.state.entities.fury.resources.ferocity, 3);
});

test('temporary Stamina absorbs damage but still triggers first-damage Ferocity', () => {
  const before = initial(); before.entities.fury.temporaryStamina = 10;
  const done = resolveAbility(before, parsed('warrior:spear-charge'), action());
  assert.equal(done.state.entities.fury.stamina, 30);
  assert.equal(done.state.entities.fury.temporaryStamina, 6);
  assert.equal(done.state.entities.fury.resources.ferocity, 1);
});

test('Brutal Slam applies sourced tier damage and size bonus, preserving unresolved movement', () => {
  // Brutal Slam tier2: 6+M=8. Mountain tier2 damage bonus=0.
  // Size 1M > 1S adds 1 to Melee Weapon push2 => max3.
  const before = initial();
  const done = resolveAbility(before, parsed('fury:brutal-slam'), slam());
  assert.equal(done.status, 'needs-input');
  assert.equal(done.state.entities.warrior.stamina, 7);
  assert.equal(done.state.pending.length, 1);
  assert.equal(done.state.pending[0].maxDistance, 3);
  const blocked = resolveAbility(done.state, parsed('warrior:spear-charge'), action());
  assertUntouched(done.state, blocked.state);
  const complete = applyManual(done.state, { kind: 'manual', id: 'move', reason: 'Table pushed warrior three squares; no collision, hazards, falling, or other triggers.', changes: [], completePendingIds: [done.state.pending[0].id] });
  assert.equal(complete.status, 'resolved'); assert.equal(complete.state.pending.length, 0);
  assert.equal(complete.state.entities.warrior.stamina, 7, 'Manual movement completion never repeats damage');
  const duplicate = applyManual(complete.state, { kind: 'manual', id: 'move-again', reason: 'Duplicate completion', changes: [], completePendingIds: [done.state.pending[0].id] });
  assert.equal(duplicate.status, 'rejected'); assertUntouched(complete.state, duplicate.state);
});

test('Mountain tier3 bonus applies to Melee Weapon rolled damage; movement may be declined', () => {
  const command = slam(); command.roll = [8, 8];
  command.facts.movement = { warrior: { distance: 0, stabilityReduction: 0, collision: false } };
  const done = resolveAbility(initial(), parsed('fury:brutal-slam'), command);
  assert.equal(done.status, 'resolved');
  assert.equal(done.state.entities.warrior.stamina, 0); // 9+2+4 = 15
  assert.equal(done.state.entities.warrior.defeated, true);
  const nonStrike = structuredClone(parsed('fury:brutal-slam'));
  nonStrike.source.keywords = ['Melee', 'Weapon'];
  assert.equal(resolveAbility(initial(), nonStrike, command).state.entities.warrior.stamina, 0, 'Kit damage does not require Strike keyword');
  const ranged = structuredClone(parsed('fury:brutal-slam'));
  ranged.source.keywords = ['Ranged', 'Strike', 'Weapon'];
  const withoutKit = resolveAbility(initial(), ranged, command);
  assert.equal(withoutKit.state.entities.warrior.stamina, 4); // 9+2, no melee kit bonus
  const alreadyIncluded = structuredClone(parsed('fury:brutal-slam'));
  alreadyIncluded.source.kitBonusesIncluded = true;
  assert.equal(resolveAbility(initial(), alreadyIncluded, command).state.entities.warrior.stamina, 4, 'Already-included kit bonuses are not applied twice');
});

test('Bury the Point spends shared Malice once and uses strict potency comparison', () => {
  const before = initial(); before.malice = 2;
  const command = action('warrior', 'warrior:bury-the-point'); command.roll = [8, 8];
  const immuneByPotency = resolveAbility(before, parsed(command.abilityId), command);
  assert.equal(immuneByPotency.status, 'resolved');
  assert.equal(immuneByPotency.state.malice, 0);
  assert.equal(immuneByPotency.state.entities.fury.stamina, 23);
  assert.equal(immuneByPotency.state.entities.fury.conditions.length, 0, 'M2 is not less than 2');
  const weaker = structuredClone(before); weaker.entities.fury.characteristics.M = 1;
  const bleeding = resolveAbility(weaker, parsed(command.abilityId), command);
  assert.equal(bleeding.state.entities.fury.conditions[0]?.name, 'bleeding');
  assert.equal(bleeding.state.entities.fury.conditions[0]?.duration, 'save ends');
  assert.equal(before.malice, 2);
  const noFunds = resolveAbility(initial(), parsed(command.abilityId), command);
  assert.equal(noFunds.status, 'rejected'); assertUntouched(initial(), noFunds.state);
});

test('minion damage changes squad pool and chooses actual casualties, never individual counters', () => {
  const before = initial(), command = slam(); command.targetIds = ['spine-1']; command.roll = [8, 8];
  command.facts.distances = { 'spine-1': 1 };
  command.facts.movement = { 'spine-1': { distance: 0, stabilityReduction: 0, collision: false } };
  const missing = resolveAbility(before, parsed(command.abilityId), command);
  assert.equal(missing.status, 'needs-input'); assertUntouched(before, missing.state);
  command.facts.casualtyOrder = ['spine-1', 'spine-2', 'spine-3'];
  const done = resolveAbility(before, parsed(command.abilityId), command);
  assert.equal(done.status, 'resolved');
  assert.equal(done.state.squads['spine-squad'].stamina, 5);
  assert.equal(done.state.entities['spine-1'].stamina, 5, 'Member field is definition/display data, not individual health');
  assert.deepEqual(['spine-1', 'spine-2', 'spine-3'].map(id => done.state.entities[id].defeated), [true, true, true]);
  assert.ok(!done.state.entities['spine-4'].defeated);
});

test('three Spinecleavers use one tier result plus two free-strike bonuses and one push', () => {
  const command = action('spine-1', 'spine:axe'); command.roll = [8, 8];
  command.facts.squadAttackers = ['spine-1', 'spine-2', 'spine-3'];
  command.facts.movement = { fury: { distance: 2, stabilityReduction: 2, collision: false, effectsConfirmed: true } };
  const done = resolveAbility(initial(), parsed(command.abilityId), command);
  assert.equal(done.status, 'resolved');
  assert.equal(done.state.entities.fury.stamina, 21, 'Axe tier3 5 + 2 + 2 free strikes = 9');
  assert.equal(done.state.entities.fury.resources.ferocity, 1);
  assert.equal(done.effects.filter(e => e.kind === 'push').length, 1);
  command.facts.squadAttackers.push('spine-4');
  const excessive = resolveAbility(initial(), parsed(command.abilityId), command);
  assert.equal(excessive.status, 'rejected'); assertUntouched(initial(), excessive.state);
});

test('rejects malformed inputs, ownership, range, and invalid movement without partial application', () => {
  const invalidCommands = [
    { ...action(), roll: [0, 10] },
    { ...action(), actorId: 'missing' },
    { ...action(), targetIds: ['missing'] },
    { ...action(), abilityId: 'fury:brutal-slam' },
    { ...action(), targetIds: ['fury', 'fury'] },
    { ...action(), facts: { ...action().facts, distances: { fury: 2 } } },
    { ...action(), facts: { ...action().facts, edges: NaN } },
  ] as AbilityCommand[];
  for (const command of invalidCommands) {
    const before = initial(), done = resolveAbility(before, parsed('warrior:spear-charge'), command);
    assert.equal(done.status, 'rejected'); assertUntouched(before, done.state);
  }
  const command = slam(); command.facts.movement = { warrior: { distance: 9, stabilityReduction: 0, collision: false } };
  const before = initial(), invalidPush = resolveAbility(before, parsed(command.abilityId), command);
  assert.equal(invalidPush.status, 'rejected'); assertUntouched(before, invalidPush.state);
});

test('unsupported conditions, critical hits, traits, and Growing Ferocity are visible whole-action manual work', () => {
  const before = initial(), cases: [GameState, AbilityCommand][] = [];
  const crit = action(); crit.roll = [10, 9]; cases.push([initial(), crit]);
  const highFerocity = initial(); highFerocity.entities.fury.resources.ferocity = 4;
  const push = slam(); push.facts.furyFerocityPeak = 4; cases.push([highFerocity, push]);
  const bleeding = initial(); bleeding.entities.warrior.conditions.push({ name: 'bleeding', sourceId: 'earlier', duration: 'save ends' }); cases.push([bleeding, action()]);
  const unknown = initial(); unknown.entities.warrior.traits.push('source-trait:reflect-all-damage'); cases.push([unknown, slam()]);
  for (const [state, command] of cases) {
    const done = resolveAbility(state, parsed(command.abilityId), command);
    assert.equal(done.status, 'manual-required'); assert.equal(done.state.pending.length, 1);
    assert.deepEqual(done.state.entities, state.entities); assert.equal(done.state.malice, state.malice);
  }
  const unsupported = action('fury', 'fury:out-of-the-way', 'warrior');
  const done = resolveAbility(before, parsed(unsupported.abilityId), unsupported);
  assert.equal(done.status, 'manual-required'); assert.equal(done.effects.length, 0);
});

test('manual changes and pending completion are atomic, including pooled health consistency', () => {
  const before = initial();
  const invalid = applyManual(before, { kind: 'manual', id: 'bad', reason: 'Batch must fail together', changes: [{ kind: 'stamina', entityId: 'fury', value: 20 }, { kind: 'malice', value: -1 }] });
  assert.equal(invalid.status, 'rejected'); assertUntouched(before, invalid.state);
  const individual = applyManual(before, { kind: 'manual', id: 'bad-minion', reason: 'Wrong health model', changes: [{ kind: 'stamina', entityId: 'spine-1', value: 0 }] });
  assert.equal(individual.status, 'rejected');
  const squad = applyManual(before, { kind: 'manual', id: 'squad', reason: 'Table resolves unsupported area damage', changes: [{ kind: 'squad-stamina', squadId: 'spine-squad', value: 10, defeatedIds: ['spine-2', 'spine-3'] }] });
  assert.equal(squad.status, 'resolved'); assert.equal(squad.state.squads['spine-squad'].stamina, 10);
  assert.ok(squad.state.entities['spine-2'].defeated);
});

test('manual Fury damage includes explicit trigger history and does not double-grant Ferocity', () => {
  const before = initial();
  const missingBookkeeping = applyManual(before, { kind: 'manual', id: 'manual-hit', reason: 'First damage this round', changes: [{ kind: 'stamina', entityId: 'fury', value: 26 }, { kind: 'resource', entityId: 'fury', resource: 'ferocity', value: 1 }] });
  assert.equal(missingBookkeeping.status, 'rejected'); assertUntouched(before, missingBookkeeping.state);
  const recorded = applyManual(before, { kind: 'manual', id: 'manual-hit', reason: 'First damage this round', changes: [{ kind: 'stamina', entityId: 'fury', value: 26 }, { kind: 'resource', entityId: 'fury', resource: 'ferocity', value: 1 }, { kind: 'fury-triggers', entityId: 'fury', firstDamageRound: 1, windedTriggered: false }] });
  assert.equal(recorded.status, 'resolved');
  const next = resolveAbility(recorded.state, parsed('warrior:spear-charge'), action());
  assert.equal(next.state.entities.fury.stamina, 22);
  assert.equal(next.state.entities.fury.resources.ferocity, 1);
  // Malformed external JSON must return a rejection, not throw after dereferencing.
  const malformed = { kind: 'manual', id: 'bad', reason: 'Missing entityId', changes: [{ kind: 'stamina', value: 20 }] };
  assert.equal(applyManual(before, malformed as never).status, 'rejected');
});

test('all area targets take damage before ordered movement effects; other action types remain manual', () => {
  const before = initial();
  before.entities.other = { ...structuredClone(before.entities.warrior), id: 'other' };
  const area = structuredClone(parsed('fury:brutal-slam'));
  area.source.keywords.push('Area'); area.source.target = 'Each enemy in the area'; area.source.distance = '2 burst';
  const command = slam(); command.targetIds = ['warrior', 'other'];
  command.facts.movement = { warrior: { distance: 1, stabilityReduction: 0, collision: false, effectsConfirmed: true }, other: { distance: 1, stabilityReduction: 0, collision: false, effectsConfirmed: true } };
  const done = resolveAbility(before, area, command);
  assert.equal(done.status, 'resolved');
  assert.deepEqual(done.effects.map(e => [e.kind, e.targetId]), [['damage', 'warrior'], ['damage', 'other'], ['push', 'warrior'], ['push', 'other']]);
  area.source.usage = 'Triggered action';
  const triggered = resolveAbility(before, area, command);
  assert.equal(triggered.status, 'manual-required'); assert.deepEqual(triggered.state.entities, before.entities);
});
