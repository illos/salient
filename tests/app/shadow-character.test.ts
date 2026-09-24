// SPDX-License-Identifier: GPL-3.0-only
/** V92 persisted Shadow coverage. Expected values come from the independent ledger witness 1. */
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { actorRollFacts } from '../../convex/lib/resolve';
import { definitions } from '../../shared/content/level-one-decisions';
import type { EvaluationInput, EvaluationResult } from '../../shared/contracts/characterEvaluation';
import type { HeroSheet } from '../../shared/contracts/characterSheet';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import ledger from '../fixtures/v92-shadow-expected.json';
import { backend, table, admitHero } from './fixtures/table';
import { vendorPath } from '../../scripts/lib/vendor.ts';

const witness = ledger.witnesses[0]!;
const selections = () =>
  draftSelectionsFrom(witness.selections as EvaluationInput['selections'], definitions);
const insightCost = (amount: number) => ({ resource: 'insight', amount });

// Catches the Shadow's kit-fed vitals, Insight resource, Insight costs, college grants and kit melee
// bonus failing to survive the public create/save/submit/approve path and the sheet projection, and
// a saved college replacement that keeps the old college's grants.
test('Shadow saves, reads back the ledger sheet with Insight costs and kit facts, then swaps college through the wizard route', async () => {
  const t = backend();
  const { player, director, campaignId } = await table(t, { session: false });
  await t.action(internal.content.reseed, {});
  const id = await admitHero(t, player, director, campaignId, 'Shadow', selections());
  const saved = await player.client.query(api.characters.get, { characterId: id });
  const evaluated = saved.evaluation as EvaluationResult;
  expect(evaluated.status).toBe('complete');
  const b = evaluated.baseline!;
  for (const key of ['staminaMaximum', 'speed', 'disengage', 'recoveriesMaximum'] as const)
    expect(b[key].value, key).toBe(witness.expected[key]);
  expect(b.heroicResource.name.value).toBe(witness.expected.heroicResource);

  const sheet = (await player.client.query(api.characters.sheet, { characterId: id })) as HeroSheet;
  expect(sheet.live?.heroicResource).toEqual({
    name: 'insight',
    current: witness.expected.heroicResourceCurrent,
  });
  const ability = (name: string) => sheet.abilities.find(entry => entry.name === name);
  for (const name of [
    witness.selections['class.shadow.signature-ability'],
    witness.selections['class.shadow.ability-3'],
    witness.selections['class.shadow.ability-5'],
    'Hesitation Is Weakness',
    'Black Ash Teleport',
    'In All This Confusion',
    'Fade',
    'Melee Weapon Free Strike',
    'Ranged Weapon Free Strike',
  ]) {
    const grant = ability(name);
    expect(grant, name).toBeDefined();
    expect(grant!.content, name).not.toBeNull();
    expect(grant!.content!.text, name).toBe(
      readFileSync(vendorPath(grant!.content!.sourcePath), 'utf8'),
    );
  }
  expect(ability(witness.selections['class.shadow.ability-3'])!.cost).toEqual(insightCost(3));
  expect(ability(witness.selections['class.shadow.ability-5'])!.cost).toEqual(insightCost(5));

  // Kit Bonuses in vendor/steel-compendium/en/unified/md/kit/cloak-and-dagger.md: melee and ranged
  // damage bonus +1/+1/+1.
  const persisted = (await t.run(ctx => ctx.db.get(id)))!;
  const actor = { kind: 'character' as const, id, name: 'Shadow' };
  expect(actorRollFacts(actor, { character: persisted })).toMatchObject({
    kitMeleeDamageBonus: [1, 1, 1],
    kitRangedDamageBonus: [1, 1, 1],
  });

  const changed = await player.client.query(api.characterWizard.transition, {
    characterId: id,
    selections: saved.selections,
    decisionId: 'class.shadow.college',
    value: 'Harlequin Mask',
  });
  expect(changed.removed).toEqual([]);
  await player.client.mutation(api.characters.save, {
    characterId: id,
    commandId: 'college-to-harlequin',
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
  expect(skills).toContain('Lie');
  expect(skills).not.toContain('Magic');
  const abilities = updated.abilities.map(entry => entry.name);
  expect(abilities).toEqual(expect.arrayContaining(["I'm No Threat", 'Clever Trick']));
  expect(abilities).not.toContain('Black Ash Teleport');
  expect(abilities).not.toContain('In All This Confusion');
  expect(abilities).toContain(witness.selections['class.shadow.signature-ability']);
});
