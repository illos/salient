// SPDX-License-Identifier: GPL-3.0-only
/** V137 Beastheart levels two and three for every wild nature and companion, through authenticated public operations. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type {
  EvaluationInput,
  EvaluationResult,
} from '../../shared/contracts/characterEvaluation.ts';
import type { AbilityRollResult } from '../../shared/contracts/rollResolution.ts';
import type { HeroSheet } from '../../shared/contracts/characterSheet.ts';
import type { DraftSelection } from '../../shared/characterDraft.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import type levelOneLedger from '../../tests/fixtures/v106-beastheart-expected.json';
import type sourceLedger from '../../tests/fixtures/v137-beastheart-three-expected.json';
const levelOne = JSON.parse(
  readFileSync('tests/fixtures/v106-beastheart-expected.json', 'utf8'),
) as typeof levelOneLedger;
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v137-beastheart-three-expected.json', 'utf8'),
) as typeof sourceLedger;
type Saved = {
  level: number;
  revision: number;
  selections: DraftSelection[];
  authored: { name: string; appearance: string; biography: string; notes: string };
  evaluation: EvaluationResult;
  liveState: { heroicResource: { current: number }; stamina: number } | null;
};
type Log = {
  id: string;
  kind: string;
  payload?: {
    data?: {
      manual?: boolean;
      ability?: { name?: string; effects?: { text: string }[] };
      result?: AbilityRollResult;
    };
  };
};
type Transition = { selections: DraftSelection[]; removed: string[]; evaluation: EvaluationResult };
const cid = () => crypto.randomUUID();
/** Every Beastheart use is a named manual record (V106): performer, cost and source, no automation. */
type Records = Record<string, number>;
const withoutResource = (state: Saved['liveState']) => {
  if (!state) return state;
  const { heroicResource: _resource, ...rest } = state;
  return rest;
};
const recordsOf = (w: {
  levelTwo: { addedRecords: Records };
  levelThree: { addedRecords: Records };
}) => ({
  ...w.levelTwo.addedRecords,
  ...w.levelThree.addedRecords,
});
const features = [
  "Everyone's Best Friend",
  'Watchdog',
  'Supersniffer',
  "This One's Yours",
  'Stormheart',
];

export async function runBeastheartLevelThree({
  actors: { director, peer },
  run,
  runId,
}: ScenarioContext) {
  await run(
    'Beastheart levels 2–3: fourteen builds, level edits and thirty-two new records persist',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 3 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Beastheart 3 ${runId}`,
      });
      const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
      const builds = Object.entries(ledger.witnesses).map(([id, w]) => ({
        id,
        w,
        base: levelOne.witnesses.find(b => b.id === w.base)!,
        second: w.levelTwo.addedSelections.natureAbility,
        seventh: w.levelThree.addedSelections.ability7,
        perk: w.levelTwo.addedSelections.perk,
      }));
      const ids: string[] = [];
      const sheets: HeroSheet[] = [];
      for (const [index, b] of builds.entries()) {
        const selections = {
          ...(b.base.selections as unknown as EvaluationInput['selections']),
          'class.beastheart.level-2.perk': b.perk,
          [`class.beastheart.level-2.${b.w.wildNature.toLowerCase()}-ability`]: b.second,
          'class.beastheart.level-3.ability-7': b.seventh,
        };
        const name = `${b.id} ${runId}`;
        const characterId = await director.mutation<string>('characters:create', {
          commandId: cid(),
          targetLevel: 3,
          wizardDraft: index === 0,
          authored: { name: index === 0 ? '' : name, appearance: '', biography: '', notes: '' },
          selections: draftSelectionsFrom(selections, definitions),
        });
        ids.push(characterId);
        let saved = await get(characterId);
        assert.equal(saved.level, 3);
        assert.equal(saved.evaluation.status, 'complete', name);
        if (index === 0) {
          assert.equal(await director.query('characters:wizardDraft', {}), characterId);
          const resumed = await director.query<{ targetLevel: number }>(
            'characterWizard:discover',
            {
              characterId,
            },
          );
          assert.equal(resumed.targetLevel, 3);
          await director.mutation('characters:save', {
            commandId: cid(),
            characterId,
            expectedRevision: saved.revision,
            targetLevel: 3,
            authored: { ...saved.authored, name },
            selections: saved.selections,
            list: true,
          });
          saved = await get(characterId);
          assert.equal(await director.query('characters:wizardDraft', {}), null);
          assert.equal(saved.level, 3);
        }
        await director.mutation('characters:submit', { commandId: cid(), campaignId, characterId });
        const sheet = await director.query<HeroSheet>('characters:sheet', { characterId });
        sheets.push(sheet);
        const hero = sheet.build!.baseline!;
        const expected = b.w.levelThree;
        for (const key of [
          'level',
          'staminaMaximum',
          'recoveriesMaximum',
          'recoveryValue',
          'windedValue',
          'speed',
          'stability',
          'disengage',
        ] as const)
          assert.equal(hero[key].value, expected[key], `${name} ${key}`);
        for (const feature of [...b.w.levelTwo.addedFeatures, ...expected.addedFeatures, b.perk])
          if (
            features.includes(feature) ||
            feature === b.perk ||
            b.w.levelThree.addedFeatures.indexOf(feature) === 1
          )
            assert.ok(
              sheet.features.some(f => f.name === feature),
              `${name} feature ${feature}`,
            );
        for (const [record, amount] of Object.entries(recordsOf(b.w))) {
          const granted = sheet.abilities.find(a => a.name === record);
          assert.ok(granted?.content?.text, `${name} ${record} source`);
          assert.deepEqual(
            granted.cost,
            amount ? { resource: 'ferocity', amount } : undefined,
            `${name} ${record}`,
          );
        }
      }

      // Full-edit level changes: lowering revokes level-3 grants, raising asks for the choice again.
      const characterId = ids[0]!;
      const first = builds[0]!;
      let saved = await get(characterId);
      await assert.rejects(
        peer.query('characterWizard:transitionLevel', {
          characterId,
          fromLevel: 3,
          targetLevel: 2,
          selections: saved.selections,
        }),
        /owner/i,
      );
      const persist = async (level: number, selections: DraftSelection[]) => {
        const current = await get(characterId);
        await director.mutation('characters:save', {
          commandId: cid(),
          characterId,
          expectedRevision: current.revision,
          targetLevel: level,
          authored: current.authored,
          selections,
        });
        return get(characterId);
      };
      const down = await director.query<Transition>('characterWizard:transitionLevel', {
        characterId,
        fromLevel: 3,
        targetLevel: 2,
        selections: saved.selections,
      });
      assert.ok(down.removed.includes('class.beastheart.level-3.ability-7'));
      saved = await persist(2, down.selections);
      assert.equal(saved.level, 2);
      assert.equal(saved.evaluation.status, 'complete');
      for (const key of ['staminaMaximum', 'recoveryValue', 'windedValue'] as const)
        assert.equal(saved.evaluation.baseline?.[key].value, first.w.levelTwo[key], key);
      const up = await director.query<Transition>('characterWizard:transitionLevel', {
        characterId,
        fromLevel: 2,
        targetLevel: 3,
        selections: saved.selections,
      });
      saved = await persist(3, up.selections);
      assert.equal(saved.evaluation.status, 'incomplete');
      const draftSheet = await director.query<HeroSheet>('characters:sheet', {
        characterId,
        view: 'draft',
      });
      assert.ok(!draftSheet.abilities.some(a => a.name === `Beastheart: ${first.seventh}`));
      const effective = await director.query<HeroSheet>('characters:sheet', { characterId });
      assert.equal(effective.build?.baseline?.level.value, 3);
      assert.ok(effective.abilities.some(a => a.name === `Beastheart: ${first.seventh}`));

      // Every new source ability and embedded use, once, with payment and persisted readback.
      const targetId = await director.mutation<string>('characters:create', {
        commandId: cid(),
        targetLevel: 1,
        authored: {
          name: `Beastheart 3 target ${runId}`,
          appearance: '',
          biography: '',
          notes: '',
        },
        selections: draftSelectionsFrom(
          levelOne.witnesses[0]!.selections as unknown as EvaluationInput['selections'],
          (
            await director.query<{ definitions: DecisionDefinitions }>('characterWizard:discover', {
              targetLevel: 1,
            })
          ).definitions,
        ),
      });
      await director.mutation('characters:submit', {
        commandId: cid(),
        campaignId,
        characterId: targetId,
      });
      const sessionId = await director.mutation<string>('sessions:start', {
        commandId: cid(),
        campaignId,
        selectedPlayerIds: [],
      });
      const invoke = (id: string, operation: string, args: Record<string, unknown> = {}) =>
        director.mutation<{ eventId: string }>('commands:invoke', {
          campaignId,
          commandId: cid(),
          operation,
          actor: { refKind: 'character', id },
          arguments: args,
        });
      const event = async (id: string) =>
        (await director.query<{ events: Log[] }>('events:list', { campaignId })).events.find(
          e => e.id === id,
        );
      const used = new Set<string>();
      try {
        for (const operation of ['combat.start', 'combat.commit'])
          await director.mutation('commands:invoke', {
            campaignId,
            commandId: cid(),
            operation,
            arguments: {},
          });
        for (const [index, b] of builds.entries()) {
          const id = ids[index]!;
          const names = Object.keys(recordsOf(b.w));
          for (const name of names) {
            if (used.has(name)) continue;
            used.add(name);
            // Every use is listed with its source; embedded uses ("Parent: Use") carry activation text.
            const listed = sheets[index]!.abilities.find(a => a.name === name);
            assert.ok(listed?.content?.text, `${b.id} ${name} listed with its source`);
            if (name.includes(':'))
              assert.ok(listed.activationCondition, `${b.id} ${name} listed with its condition`);
            const cost = recordsOf(b.w)[name]!;
            // A printed target of exactly "Self" is self-only on the table (targetShapeOf).
            const printedTarget = (listed.metadata.target ?? '').replace(
              /\[([^\]]*)\]\([^)]*\)/g,
              '$1',
            );
            const affectedId = printedTarget.trim().toLowerCase() === 'self' ? id : targetId;
            const target = { refKind: 'character', id: affectedId };
            await invoke(id, 'adjust.heroic-resource', { value: cost });
            await invoke(affectedId, 'adjust.stamina', { value: 30 });
            const before = await get(affectedId);
            const actorBefore = await get(id);
            const use = await invoke(id, 'ability.use', { ability: name, targets: [target] });
            const persisted = await event(use.eventId);
            const actorAfter = await get(id);
            assert.equal(actorAfter.liveState?.heroicResource.current, 0, `${name} Ferocity`);
            // companion-rules.md and V106: companion effects are recorded for manual resolution.
            assert.equal(persisted?.kind, 'ability.recorded', name);
            assert.equal(persisted?.payload?.data?.manual, true, name);
            assert.equal(persisted?.payload?.data?.ability?.name, name);
            assert.match(
              JSON.stringify(persisted?.payload?.data?.ability?.effects),
              /Record and resolve manually/,
            );
            if (affectedId !== id)
              assert.deepEqual(
                (await get(affectedId)).liveState,
                before.liveState,
                `${name} no fabricated target effect`,
              );
            assert.deepEqual(
              withoutResource(actorAfter.liveState),
              withoutResource(actorBefore.liveState),
              `${name} no fabricated actor effect`,
            );
            if (cost) {
              const blocked = await invoke(id, 'ability.use', { ability: name, targets: [target] });
              assert.equal((await event(blocked.eventId))?.kind, 'ability.blocked', name);
            }
          }
        }
        assert.equal(
          used.size,
          32,
          'eight nature and four 7-Ferocity abilities, spends, triggers and features',
        );
      } finally {
        const session = await director.query<{ revision: number }>('sessions:get', { sessionId });
        await director.mutation('sessions:transition', {
          sessionId,
          expectedRevision: session.revision,
          action: 'close',
          voidMode: 'keep',
          commandId: cid(),
        });
      }
    },
  );
}
