// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { DraftSelection } from '../../shared/characterDraft.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type { HeroSheet } from '../../shared/contracts/characterSheet.ts';
import type { SelectionValue } from '../../shared/contracts/characterEvaluation.ts';

type Choices = Record<string, SelectionValue>;
type Saved = {
  authored: { name: string; appearance: string; biography: string; notes: string };
  revision: number;
  selections: DraftSelection[];
  status: string;
  liveState: unknown;
};
type Witness = {
  ancestry: string;
  purchaseId?: string;
  traits: string[];
  signature: string[];
  extra?: Choices;
  actions: [string, string][];
  speed: number;
  immunities?: [string, number][];
  conditions?: string[];
};
// One source-derived representative per ancestry. Exhaustive option matching belongs to Forge.
const witnesses: Witness[] = [
  {
    ancestry: 'Revenant',
    purchaseId: 'ancestry.revenant.memonek.purchased-traits',
    traits: ['Keeper of Order'],
    signature: ['Former Life', 'Tough But Withered'],
    extra: { 'ancestry.revenant.former-life': 'Memonek' },
    actions: [['Keeper of Order', 'triggered']],
    speed: 5,
    immunities: [
      ['cold', 1],
      ['corruption', 1],
      ['lightning', 1],
      ['poison', 1],
    ],
  },
  {
    ancestry: 'Dragon Knight',
    traits: ['Dragon Breath', 'Prismatic Scales'],
    signature: ['Wyrmplate'],
    extra: {
      'ancestry.dragon-knight.wyrmplate-immunity': 'fire',
      'ancestry.dragon-knight.prismatic-scales-immunity': 'cold',
    },
    actions: [['Dragon Breath', 'main']],
    speed: 5,
    immunities: [
      ['fire', 1],
      ['cold', 1],
    ],
  },
  {
    ancestry: 'High Elf',
    traits: ['Glamor of Terror', 'Graceful Retreat'],
    signature: ['High Elf Glamor'],
    actions: [['Glamor of Terror', 'triggered']],
    speed: 5,
  },
  {
    ancestry: 'Memonek',
    traits: ['Keeper of Order', 'Unphased', 'Useful Emotion'],
    signature: ['Fall Lightly', 'Lightweight'],
    actions: [['Keeper of Order', 'triggered']],
    speed: 5,
    conditions: ['surprised'],
  },
  {
    ancestry: 'Time Raider',
    traits: ['Beyondsight', 'Psionic Gift'],
    signature: ['Psychic Scar'],
    extra: { 'ancestry.time-raider.psionic-gift.ability': 'Psionic Bolt' },
    actions: [
      ['Beyondsight', 'maneuver'],
      ['Psionic Bolt', 'main'],
    ],
    speed: 5,
    immunities: [['psychic', 1]],
  },
  {
    ancestry: 'Wode Elf',
    traits: ['Swift', 'The Wode Defends'],
    signature: ['Wode Elf Glamor'],
    actions: [['The Wode Defends', 'main']],
    speed: 6,
  },
];
const slug = (name: string) => name.toLowerCase().replaceAll(' ', '-');
function choices(witness: Witness): Choices {
  const fixture = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8')) as {
    selections: Choices;
  };
  const selected = Object.fromEntries(
    Object.entries(fixture.selections).filter(([key]) => !key.startsWith('ancestry.')),
  );
  return {
    ...selected,
    'ancestry.choice': witness.ancestry,
    [witness.purchaseId ?? `ancestry.${slug(witness.ancestry)}.purchased-traits`]: witness.traits,
    ...witness.extra,
  };
}
function drafts(selected: Choices, definitions: DecisionDefinitions): DraftSelection[] {
  return Object.entries(selected)
    .filter(([id]) => !id.startsWith('details.'))
    .map(([decisionId, value]) => {
      const step = definitions.steps.find(s => s.decisions.some(d => d.id === decisionId));
      const decision = step?.decisions.find(d => d.id === decisionId);
      assert.ok(step && decision, `Discovered decision ${decisionId}`);
      return {
        decisionId,
        value,
        ownerBranchId: step.id,
        sources: [
          { id: decisionId, path: decision.source, revision: definitions.compendiumRevision },
        ],
      };
    });
}
export async function runRemainingAncestries({
  actors: { player, peer },
  run,
  runId,
}: ScenarioContext) {
  await run(
    'remaining ancestry wizard choices persist with sourced traits, actions, and parent replacement',
    async () => {
      const { definitions } = await player.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        {},
      );
      for (const witness of witnesses) {
        const characterId = await player.mutation<string>('characters:create', {
          commandId: crypto.randomUUID(),
          authored: {
            name: `${witness.ancestry} ${runId}`,
            appearance: '',
            biography: '',
            notes: '',
          },
        });
        let saved = await player.query<Saved>('characters:get', { characterId });
        await player.mutation('characters:save', {
          characterId,
          commandId: crypto.randomUUID(),
          expectedRevision: saved.revision,
          authored: saved.authored,
          selections: drafts(choices(witness), definitions),
        });
        saved = await player.query<Saved>('characters:get', { characterId });
        assert.equal(saved.status, 'complete', witness.ancestry);
        const sheet = await player.query<HeroSheet>('characters:sheet', { characterId });
        const baseline = sheet.build?.baseline;
        assert.ok(baseline, `${witness.ancestry} saved baseline`);
        assert.equal(baseline.size.value, '1M', witness.ancestry);
        assert.equal(baseline.speed.value, witness.speed, witness.ancestry);
        assert.equal(baseline.stability.value, 2, witness.ancestry);
        assert.equal(baseline.staminaMaximum.value, 30, witness.ancestry);
        assert.deepEqual(
          baseline.traits.map(t => t.name).sort(),
          [...witness.signature, ...witness.traits].sort(),
          witness.ancestry,
        );
        for (const trait of sheet.features.filter(f => f.kind.startsWith('ancestry-')))
          assert.ok(trait.content?.text, `${trait.name} readable source`);
        for (const [type, value] of witness.immunities ?? [])
          assert.equal(
            baseline.damageImmunities?.find(i => i.damageType === type)?.value.value,
            value,
            `${witness.ancestry} ${type}`,
          );
        assert.deepEqual(
          (baseline.conditionImmunities ?? []).map(i => i.condition).sort(),
          [...(witness.conditions ?? [])].sort(),
          witness.ancestry,
        );
        for (const [name, group] of witness.actions) {
          const actions = sheet.abilities.filter(a => a.name === name);
          assert.equal(actions.length, 1, `${witness.ancestry} ${name}`);
          assert.equal(actions[0]!.group, group, name);
          assert.ok(actions[0]!.content?.text, `${name} readable source`);
        }
        if (witness.ancestry === 'Revenant') {
          assert.equal(
            baseline.damageWeaknesses?.find(i => i.damageType === 'fire')?.value.value,
            5,
          );
          assert.ok(!baseline.traits.some(t => ['Fall Lightly', 'Lightweight'].includes(t.name)));
          let changed = await player.query<{ selections: DraftSelection[]; removed: string[] }>(
            'characterWizard:transition',
            {
              characterId,
              selections: saved.selections,
              decisionId: 'ancestry.revenant.former-life',
              value: 'Time Raider',
            },
          );
          assert.ok(changed.removed.includes('ancestry.revenant.memonek.purchased-traits'));
          for (const [decisionId, value] of [
            ['ancestry.revenant.time-raider.purchased-traits', ['Psionic Gift']],
            ['ancestry.revenant.time-raider.psionic-gift.ability', 'Psionic Bolt'],
          ] as const)
            changed = await player.query('characterWizard:transition', {
              characterId,
              selections: changed.selections,
              decisionId,
              value,
            });
          await player.mutation('characters:save', {
            characterId,
            commandId: crypto.randomUUID(),
            expectedRevision: saved.revision,
            authored: saved.authored,
            selections: changed.selections,
          });
          const updated = await player.query<Saved>('characters:get', { characterId });
          assert.equal(updated.status, 'complete');
          assert.ok(
            !updated.selections.some(s => s.decisionId.startsWith('ancestry.revenant.memonek.')),
          );
          const after = await player.query<HeroSheet>('characters:sheet', { characterId });
          assert.ok(after.abilities.some(a => a.name === 'Psionic Bolt'));
          assert.ok(!after.abilities.some(a => a.name === 'Keeper of Order'));
          assert.ok(!after.build?.baseline?.traits.some(t => t.name === 'Psychic Scar'));
          assert.equal(
            after.build?.baseline?.damageWeaknesses?.find(i => i.damageType === 'fire')?.value
              .value,
            5,
          );
        }
        if (witness.ancestry === 'Time Raider') {
          await assert.rejects(peer.query('characters:get', { characterId }));
          await assert.rejects(
            peer.mutation('characters:save', {
              characterId,
              commandId: crypto.randomUUID(),
              expectedRevision: saved.revision,
              authored: saved.authored,
              selections: saved.selections,
            }),
          );
          const changed = await player.query<{ selections: DraftSelection[]; removed: string[] }>(
            'characterWizard:transition',
            {
              characterId,
              selections: saved.selections,
              decisionId: 'ancestry.time-raider.purchased-traits',
              value: ['Foresight', 'Unstoppable Mind'],
            },
          );
          assert.ok(changed.removed.includes('ancestry.time-raider.psionic-gift.ability'));
          await player.mutation('characters:save', {
            characterId,
            commandId: crypto.randomUUID(),
            expectedRevision: saved.revision,
            authored: saved.authored,
            selections: changed.selections,
          });
          const updated = await player.query<Saved>('characters:get', { characterId });
          assert.equal(updated.status, 'complete');
          assert.ok(
            !updated.selections.some(
              s => s.decisionId === 'ancestry.time-raider.psionic-gift.ability',
            ),
          );
          assert.deepEqual(updated.liveState, saved.liveState);
          const after = await player.query<HeroSheet>('characters:sheet', { characterId });
          assert.ok(after.abilities.some(a => a.name === 'Foresight'));
          assert.ok(!after.abilities.some(a => ['Psionic Bolt', 'Beyondsight'].includes(a.name)));
        }
      }
    },
  );
}
