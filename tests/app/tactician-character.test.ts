// SPDX-License-Identifier: GPL-3.0-only
/** V94 persisted Tactician coverage. Expected values come from the independent ledger witness 1. */
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { actorRollFacts } from '../../convex/lib/resolve';
import { definitions } from '../../shared/content/level-one-decisions';
import type { EvaluationInput, EvaluationResult } from '../../shared/contracts/characterEvaluation';
import type { HeroSheet } from '../../shared/contracts/characterSheet';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import ledger from '../fixtures/v94-tactician-expected.json';
import { backend, table, admitHero } from './fixtures/table';

const witness = ledger.witnesses[0]!;
const selections = () =>
  draftSelectionsFrom(witness.selections as EvaluationInput['selections'], definitions);
const focusCost = (amount: number) => ({ resource: 'focus', amount });

// Catches the Tactician's Field Arsenal vitals, Focus resource and costs, doctrine grants, both kit
// signatures and the merged kit damage bonuses failing to survive the public create/save/submit/
// approve path and the sheet projection, and a saved doctrine replacement that keeps the old
// doctrine's grants or its skill.
test('Tactician saves, reads back the ledger sheet with Focus costs and arsenal facts, then swaps doctrine through the wizard route', async () => {
  const t = backend();
  const { player, director, campaignId } = await table(t, { session: false });
  await t.action(internal.content.reseed, {});
  const id = await admitHero(t, player, director, campaignId, 'Tactician', selections());
  const saved = await player.client.query(api.characters.get, { characterId: id });
  const evaluated = saved.evaluation as EvaluationResult;
  expect(evaluated.status).toBe('complete');
  const b = evaluated.baseline!;
  for (const key of ['staminaMaximum', 'speed', 'disengage', 'stability'] as const)
    expect(b[key].value, key).toBe(witness.expected[key]);
  expect(b.heroicResource.name.value).toBe(witness.expected.heroicResource);
  expect(b.kits?.map(kit => kit.name.value)).toEqual(witness.expected.kits);

  const sheet = (await player.client.query(api.characters.sheet, { characterId: id })) as HeroSheet;
  expect(sheet.live?.heroicResource).toEqual({
    name: 'focus',
    current: witness.expected.heroicResourceCurrent,
  });
  const ability = (name: string) => sheet.abilities.find(entry => entry.name === name);
  for (const name of [
    witness.selections['class.tactician.ability-3'],
    witness.selections['class.tactician.ability-5'],
    'Mark',
    '"Strike Now!"',
    'Advanced Tactics',
    'Protective Attack',
    'Patient Shot',
    'Melee Weapon Free Strike',
    'Ranged Weapon Free Strike',
  ]) {
    const grant = ability(name);
    expect(grant, name).toBeDefined();
    expect(grant!.content, name).not.toBeNull();
    expect(grant!.content!.text, name).toBe(readFileSync(grant!.content!.sourcePath, 'utf8'));
  }
  expect(ability(witness.selections['class.tactician.ability-3'])!.cost).toEqual(focusCost(3));
  expect(ability(witness.selections['class.tactician.ability-5'])!.cost).toEqual(focusCost(5));
  expect(sheet.abilities.filter(entry => entry.kind === 'kit-signature').map(e => e.name)).toEqual([
    'Protective Attack',
    'Patient Shot',
  ]);

  // Kit Bonuses: kit/shining-armor.md melee +2/+2/+2; kit/sniper.md ranged +0/+0/+4 (Kits table).
  const persisted = (await t.run(ctx => ctx.db.get(id)))!;
  const actor = { kind: 'character' as const, id, name: 'Tactician' };
  expect(actorRollFacts(actor, { character: persisted })).toMatchObject({
    kitMeleeDamageBonus: witness.expected.mergedKitBonuses.meleeDamage,
    kitRangedDamageBonus: witness.expected.mergedKitBonuses.rangedDamage,
  });

  const doctrine = await player.client.query(api.characterWizard.transition, {
    characterId: id,
    selections: saved.selections,
    decisionId: 'class.tactician.doctrine',
    value: 'Vanguard',
  });
  // The Insurgent's intrigue skill is not an interpersonal option; the wizard drops it with the doctrine.
  expect(doctrine.removed).toEqual(['class.tactician.doctrine-skill']);
  const changed = await player.client.query(api.characterWizard.transition, {
    characterId: id,
    selections: doctrine.selections,
    decisionId: 'class.tactician.doctrine-skill',
    value: 'Persuade',
  });
  expect(changed.removed).toEqual([]);
  await player.client.mutation(api.characters.save, {
    characterId: id,
    commandId: 'doctrine-to-vanguard',
    expectedRevision: saved.revision,
    authored: saved.authored,
    selections: changed.selections,
  });
  const after = await player.client.query(api.characters.get, { characterId: id });
  expect((after.evaluation as EvaluationResult).status).toBe('complete');
  const updated = (await player.client.query(api.characters.sheet, {
    characterId: id,
    view: 'draft',
  })) as HeroSheet;
  const skills = updated.build!.baseline!.skills.map(skill => skill.name);
  expect(skills).toContain('Persuade');
  expect(skills).not.toContain('Hide');
  const abilities = updated.abilities.map(entry => entry.name);
  expect(abilities).toContain('Parry');
  expect(abilities).not.toContain('Advanced Tactics');
  expect(abilities).toEqual(expect.arrayContaining(['Protective Attack', 'Patient Shot']));
  const features = updated.features.map(feature => feature.name);
  expect(features).toContain('Commanding Presence');
  expect(features).not.toContain('Covert Operations');
});

// Embedded source actions must survive both projections and the shared operation route. Manual
// effects stay manual, but fixed Focus payment and the action's source event must persist.
test('embedded Tactician actions record source outcomes and pay Mark Focus through ability.use', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const mastermind = ledger.witnesses[1]!;
  const characterId = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Planner',
    draftSelectionsFrom(mastermind.selections as EvaluationInput['selections'], definitions),
  );
  const actor = { refKind: 'character' as const, id: characterId };
  const sheet = await f.player.client.query(api.characters.sheet, { characterId });
  if (sheet.audience === 'peer') throw new Error('Expected owner sheet');
  for (const name of ['Mark: Trigger', 'Mark: Retarget', 'Studied Commander: Prepare']) {
    const action = sheet.abilities.find(entry => entry.name === name);
    expect(action?.activationCondition).toBeTruthy();
    expect(action?.metadata.effects?.[0]?.text).toContain(
      name.startsWith('Mark:') ? "You can't gain more than one benefit" : '24 hours',
    );
  }
  const invoke = (commandId: string, ability: string) =>
    f.player.client.mutation(api.commands.invoke, {
      campaignId: f.campaignId,
      commandId: commandId.replace(/[^A-Za-z0-9_-]/g, '-'),
      operation: 'ability.use',
      actor,
      arguments: { ability, targets: [actor] },
    });
  for (const name of ['Mark: Retarget', 'Studied Commander: Prepare']) {
    const result = await invoke(`record-${name}`, name);
    const stored = (await t.run(ctx => ctx.db.get(result.eventId)))!;
    expect(stored.kind).toBe('ability.recorded');
    expect(stored.payload.data).toMatchObject({ manual: true, ability: { name } });
  }
  for (const operation of ['combat.start', 'combat.commit'])
    await f.director.client.mutation(api.commands.invoke, {
      campaignId: f.campaignId,
      commandId: operation.replaceAll('.', '-'),
      operation,
      arguments: {},
    });
  await f.director.client.mutation(api.commands.invoke, {
    campaignId: f.campaignId,
    commandId: 'give-focus',
    operation: 'adjust.heroic-resource',
    actor,
    arguments: { value: 2 },
  });
  const used = await invoke('paid-mark-trigger', 'Mark: Trigger');
  const event = (await t.run(ctx => ctx.db.get(used.eventId)))!;
  expect(event.kind).toBe('ability.recorded');
  expect(event.payload.data).toMatchObject({
    manual: true,
    cost: { resource: 'focus', amount: 1, before: 2, after: 1 },
  });
  const persisted = await f.player.client.query(api.characters.get, { characterId });
  expect(persisted.liveState?.heroicResource).toEqual({ name: 'focus', current: 1 });
  const tableSheet = await f.player.client.query(api.abilities.sheet, {
    campaignId: f.campaignId,
    actor: { kind: 'character', id: characterId, name: 'Planner' },
  });
  expect(tableSheet.abilities.find(entry => entry.name === 'Mark: Trigger')?.fixedCost).toEqual({
    resource: 'focus',
    amount: 1,
  });
});
