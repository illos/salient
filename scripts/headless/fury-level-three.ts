// SPDX-License-Identifier: GPL-3.0-only
/** V114 Fury levels two and three for every aspect, through authenticated public operations. */
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
import type levelOneLedger from '../../tests/fixtures/v101-fury-expected.json';
import type sourceLedger from '../../tests/fixtures/v114-fury-three-expected.json';
const levelOne = JSON.parse(
  readFileSync('tests/fixtures/v101-fury-expected.json', 'utf8'),
) as typeof levelOneLedger;
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v114-fury-three-expected.json', 'utf8'),
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
    data?: { manual?: boolean; ability?: { name?: string }; result?: AbilityRollResult };
  };
};
type Transition = { selections: DraftSelection[]; removed: string[]; evaluation: EvaluationResult };
const cid = () => crypto.randomUUID();
const abilityDecision: Record<string, string> = {
  Berserker: 'class.fury.level-2.aspect-ability',
  Reaver: 'class.fury.level-2.reaver-ability',
  Stormwight: 'class.fury.level-2.stormwight-ability',
};
/** Source clauses granted as separate timed uses (feature/fury/level-2, abilities at levels 2/3). */
const embedded: Record<string, string> = {
  'Unstoppable Force': 'Unstoppable Force: Charge With Ability',
  'Tooth and Claw': 'Tooth and Claw: Adjacent Damage',
  'Special Delivery': 'Special Delivery: Ally Free Strike',
  'Apex Predator': 'Apex Predator: Pursue',
  'You Are Already Dead': 'You Are Already Dead: Free Strike',
};
/** Printed "Self" targets; their uses record against the Fury, never a separate target. */
const selfTargets = [
  'Wrecking Ball',
  'Phalanx-Breaker',
  'Demon Unleashed',
  'Face the Storm!',
  'Steelbreaker',
];
/** Single-target strikes whose printed damage the table rolls; conditions stay manual text. */
const rolledRemainder: Record<string, RegExp> = {
  'Death... Death!': /dazed/i,
  'Apex Predator': /slowed/i,
};

export async function runFuryLevelThree({
  actors: { director, peer },
  run,
  runId,
}: ScenarioContext) {
  await run('Fury levels 2–3: eight builds, level edits and fifteen new uses persist', async () => {
    const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
      'characterWizard:discover',
      { targetLevel: 3 },
    );
    const campaignId = await director.mutation<string>('campaigns:create', {
      commandId: cid(),
      name: `Fury 3 ${runId}`,
    });
    const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
    // Six ledger witnesses plus two alternates so all six level-two abilities are chosen.
    const builds = ledger.witnesses.map(w => {
      const base = levelOne.witnesses.find(b => b.id === w.id)!;
      const two = w.levelTwo.addedSelections as Record<string, string>;
      const three = w.levelThree.addedSelections as Record<string, string>;
      return {
        w,
        base,
        second: two['class.fury.level-2.aspect-ability']!,
        seventh: three['class.fury.level-3.7-ferocity-ability']!,
        perk: two['class.fury.level-2.perk']!,
      };
    });
    for (const [id, second] of [
      ['v101-mountain', 'Special Delivery'],
      ['v101-panther', 'Phalanx-Breaker'],
    ] as const)
      builds.push({ ...builds.find(b => b.w.id === id)!, second });
    const ids: string[] = [];
    const sheets: HeroSheet[] = [];
    for (const [index, b] of builds.entries()) {
      const selections = {
        ...(b.base.selections as unknown as EvaluationInput['selections']),
        'class.fury.level-2.perk': b.perk,
        [abilityDecision[b.w.subclass]!]: b.second,
        'class.fury.level-3.ability-7': b.seventh,
      };
      const name = `${b.w.id} ${b.second} ${runId}`;
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
      assert.equal(saved.evaluation.status, 'complete', `${name}`);
      if (index === 0) {
        // Resume the owned wizard draft at its target level, then save it to the list.
        assert.equal(await director.query('characters:wizardDraft', {}), characterId);
        const resumed = await director.query<{ targetLevel: number }>('characterWizard:discover', {
          characterId,
        });
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
      for (const feature of [b.w.levelTwo.addedFeatures[0]!, ...expected.addedFeatures])
        assert.ok(
          sheet.features.some(f => f.name === feature),
          `${name} feature ${feature}`,
        );
      assert.ok(
        sheet.features.some(f => f.name === b.perk),
        `${name} perk ${b.perk}`,
      );
      for (const [ability, amount] of [
        [b.second, 5],
        [b.seventh, 7],
      ] as const) {
        const granted = sheet.abilities.find(a => a.name === ability);
        assert.ok(granted?.content?.text, `${name} ${ability} source`);
        assert.deepEqual(granted.cost, { resource: 'ferocity', amount }, `${name} ${ability}`);
      }
      for (const parent of [b.w.levelTwo.addedFeatures[0]!, b.second, b.seventh])
        if (embedded[parent])
          assert.ok(
            sheet.abilities.find(a => a.name === embedded[parent])?.activationCondition,
            `${name} ${embedded[parent]}`,
          );
    }

    // Full-edit level changes: lowering revokes level-3 grants, raising asks for the choice again.
    const characterId = ids[0]!;
    const mountain = builds[0]!.w;
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
    assert.ok(down.removed.includes('class.fury.level-3.ability-7'));
    saved = await persist(2, down.selections);
    assert.equal(saved.level, 2);
    assert.equal(saved.evaluation.status, 'complete');
    for (const key of ['staminaMaximum', 'recoveryValue', 'windedValue', 'stability'] as const)
      assert.equal(saved.evaluation.baseline?.[key].value, mountain.levelTwo[key], key);
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
    assert.ok(!draftSheet.abilities.some(a => a.name === builds[0]!.seventh));
    const effective = await director.query<HeroSheet>('characters:sheet', { characterId });
    assert.equal(effective.build?.baseline?.level.value, 3);
    assert.ok(effective.abilities.some(a => a.name === builds[0]!.seventh));

    // Every new source ability and embedded use, once, with payment and persisted readback.
    const targetId = await director.mutation<string>('characters:create', {
      commandId: cid(),
      targetLevel: 1,
      authored: { name: `Fury 3 target ${runId}`, appearance: '', biography: '', notes: '' },
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
    // Tier conditions compile into occurrences (V113/V153); the remainder may appear there.
    const compiledClauses = async (id: string) =>
      (
        (
          await director.query<{ compiled?: { effects: { effect: { clause?: string } }[] } }[]>(
            'abilities:results',
            { campaignId, eventIds: [id] },
          )
        )[0]?.compiled?.effects ?? []
      ).map(o => o.effect.clause ?? '');
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
        const names = [b.w.levelTwo.addedFeatures[0]!, b.second, b.seventh].flatMap(parent =>
          [parent, embedded[parent]].filter(
            (name): name is string => !!name && sheets[index]!.abilities.some(a => a.name === name),
          ),
        );
        for (const name of names) {
          if (used.has(name)) continue;
          used.add(name);
          const cost = name === b.second ? 5 : name === b.seventh ? 7 : 0;
          const affectedId = selfTargets.includes(name) ? id : targetId;
          const target = { refKind: 'character', id: affectedId };
          await invoke(id, 'adjust.heroic-resource', { value: cost });
          await invoke(affectedId, 'adjust.stamina', { value: 30 });
          const before = await get(affectedId);
          const use = await invoke(id, 'ability.use', { ability: name, targets: [target] });
          const persisted = await event(use.eventId);
          const after = await get(affectedId);
          assert.equal((await get(id)).liveState?.heroicResource.current, 0, `${name} Ferocity`);
          const remainder = rolledRemainder[name];
          if (remainder) {
            assert.equal(persisted?.kind, 'ability.use', name);
            const result = persisted?.payload?.data?.result;
            assert.ok(result, name);
            const outcome = result.targets[0]!;
            const printed = ledger.abilities.find(a => a.name === name)!.damageByTierWithKit as
              Record<string, number[]> | undefined;
            const damage = printed![b.w.kit]![outcome.tier - 1]!;
            assert.equal(outcome.damage?.rolledDamage, damage, `${name} ${b.w.kit}`);
            assert.equal(after.liveState?.stamina, before.liveState!.stamina - damage, name);
            assert.match(
              JSON.stringify([
                outcome.unresolvedClauses,
                result.manualResolutions,
                await compiledClauses(use.eventId),
              ]),
              remainder,
              name,
            );
          } else if (name === 'Steelbreaker') {
            // V157: compiled without a power roll. feature/ability/fury/level-3/steelbreaker.md:
            // "You gain 20 temporary Stamina."; the greater amount is kept
            // (rule/health/temporary-stamina.md).
            assert.equal(persisted?.kind, 'ability.use', name);
            type Gains = { stamina: number; temporaryStamina: number };
            const was = before.liveState as unknown as Gains;
            const now = after.liveState as unknown as Gains;
            assert.equal(now.stamina, was.stamina, `${name} no damage`);
            assert.equal(now.temporaryStamina, Math.max(was.temporaryStamina, 20), name);
          } else {
            assert.equal(persisted?.kind, 'ability.recorded', name);
            assert.equal(persisted?.payload?.data?.manual, true, name);
            assert.equal(persisted?.payload?.data?.ability?.name, name);
            assert.equal(after.liveState?.stamina, before.liveState?.stamina, `${name} no damage`);
          }
          if (cost) {
            const blocked = await invoke(id, 'ability.use', { ability: name, targets: [target] });
            assert.equal((await event(blocked.eventId))?.kind, 'ability.blocked', name);
          }
        }
      }
      assert.equal(used.size, 15, 'six level-2 and four level-3 abilities plus five embedded uses');
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
  });
}
