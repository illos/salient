// SPDX-License-Identifier: GPL-3.0-only
/** V138 Summoner levels two and three for every circle, ward and 7-essence ability, through authenticated public operations. */
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
import type levelOneLedger from '../../tests/fixtures/v107-summoner-expected.json';
import type sourceLedger from '../../tests/fixtures/v138-summoner-three-expected.json';
const levelOne = JSON.parse(
  readFileSync('tests/fixtures/v107-summoner-expected.json', 'utf8'),
) as typeof levelOneLedger;
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v138-summoner-three-expected.json', 'utf8'),
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
/** Every Summoner use is a named manual record (V107): cost and source, no automation. */
type Records = Record<string, number>;
const withoutResource = (state: Saved['liveState']) => {
  if (!state) return state;
  const { heroicResource: _resource, ...rest } = state;
  return rest;
};
type Witness = (typeof ledger.witnesses)[number];
const withoutPerk = (actions: Record<string, number | undefined>): Record<string, number> =>
  Object.fromEntries(
    Object.entries(actions).filter(
      (entry): entry is [string, number] =>
        !entry[0].startsWith('Perk: ') && entry[1] !== undefined,
    ),
  );
/**
 * The ledger's printed actions plus this slice's manual notes: the Summoner's Kit strike change
 * (feature/summoner/level-3/summoners-kit.md) and Howling Ward's aura (howling-ward.md).
 */
const recordsOf = (w: Witness): Records => ({
  ...withoutPerk(w.actionsAddedAtLevel2),
  ...withoutPerk(w.actionsAddedAtLevel3),
  "Summoner: Summoner Strike: Summoner's Kit": 0,
  ...(w.ward.name === 'Howling Ward' ? { 'Summoner: Howling Ward': 0 } : {}),
  ...(w.sevenEssenceAbility.name === 'Essence Funnel'
    ? { 'Summoner: Essence Funnel: Sacrifice minions': 0 }
    : {}),
});
const featuresOf = (w: Witness) => [
  "Summoner's Dominion",
  'New Portfolio Minion',
  w.level3.dominionFixture.name,
  w.newPortfolioMinion.name,
  "Summoner's Kit",
  w.ward.name,
  w.level2Selections['class.summoner.level-2.perk'],
];

export async function runSummonerLevelThree({
  actors: { director, peer },
  run,
  runId,
}: ScenarioContext) {
  await run(
    'Summoner levels 2–3: twelve builds, level edits and every new record persist',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 3 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Summoner 3 ${runId}`,
      });
      const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
      const builds = ledger.witnesses.map(w => ({
        id: w.id,
        w,
        seventh: w.level3Selections['class.summoner.level-3.ability-7'],
      }));
      const ids: string[] = [];
      const sheets: HeroSheet[] = [];
      for (const [index, b] of builds.entries()) {
        const selections = {
          ...(b.w.level1Selections as unknown as EvaluationInput['selections']),
          'class.summoner.level-2.perk': b.w.level2Selections['class.summoner.level-2.perk'],
          [`class.summoner.portfolio.${b.w.circle.toLowerCase()}.5`]: b.w.newPortfolioMinion.name,
          'class.summoner.level-3.ward': b.w.level3Selections['class.summoner.level-3.ward'],
          'class.summoner.level-3.ability-7': b.seventh,
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
        const expected = b.w.level3;
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
        for (const feature of featuresOf(b.w))
          assert.ok(
            [...sheet.features, ...sheet.abilities].some(f => f.name === feature),
            `${name} feature ${feature}`,
          );
        assert.equal(hero.summoner?.fixture?.stamina, expected.dominionFixture.stamina, name);
        assert.equal(hero.summoner?.strike?.damage, expected.summonerStrike.damage, name);
        assert.equal(hero.summoner?.strike?.potency, expected.summonerStrike.potency, name);
        assert.equal(hero.summoner?.strike?.distance, expected.summonerStrike.distanceValue, name);
        for (const [record, amount] of Object.entries(recordsOf(b.w))) {
          const granted = sheet.abilities.find(a => a.name === record);
          assert.ok(granted?.content?.text, `${name} ${record} source`);
          assert.deepEqual(
            granted.cost,
            amount ? { resource: 'essence', amount } : undefined,
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
      assert.ok(down.removed.includes('class.summoner.level-3.ability-7'));
      saved = await persist(2, down.selections);
      assert.equal(saved.level, 2);
      assert.equal(saved.evaluation.status, 'complete');
      for (const key of ['staminaMaximum', 'recoveryValue', 'windedValue'] as const)
        assert.equal(saved.evaluation.baseline?.[key].value, first.w.level2[key], key);
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
      assert.ok(!draftSheet.abilities.some(a => a.name === `Summoner: ${first.seventh}`));
      const effective = await director.query<HeroSheet>('characters:sheet', { characterId });
      assert.equal(effective.build?.baseline?.level.value, 3);
      assert.ok(effective.abilities.some(a => a.name === `Summoner: ${first.seventh}`));

      // Every new source ability and embedded use, once, with payment and persisted readback.
      const targetId = await director.mutation<string>('characters:create', {
        commandId: cid(),
        targetLevel: 1,
        authored: {
          name: `Summoner 3 target ${runId}`,
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
            assert.equal(actorAfter.liveState?.heroicResource.current, 0, `${name} Essence`);
            // V107: Summoner effects are recorded for manual resolution.
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
          ledger.abilities.filter(a => !a.name.startsWith('Perk: ')).length + 3,
          "every printed level-2/3 action plus the Summoner's Kit, Howling Ward and Essence Funnel notes",
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
