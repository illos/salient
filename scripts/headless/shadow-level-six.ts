// SPDX-License-Identifier: GPL-3.0-only
/** V108 cumulative editor choices and source-timed actions through authenticated public routes. */
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
import type SourceLedger from '../../tests/fixtures/v108-shadow-six-expected.json';
const ledger = JSON.parse(readFileSync('tests/fixtures/v108-shadow-six-expected.json', 'utf8')) as {
  witnesses: (Omit<(typeof SourceLedger)['witnesses'][number], 'selections' | 'actions'> & {
    selections: EvaluationInput['selections'];
    actions: {
      name: string;
      cost: number;
      mode: string;
      damageByTier?: number[];
      manual?: string;
    }[];
  })[];
};
type Saved = {
  level: number;
  revision: number;
  authored: { name: string; appearance: string; biography: string; notes: string };
  selections: DraftSelection[];
  evaluation: EvaluationResult;
  liveState: {
    heroicResource: { current: number };
    stamina: number;
    conditions?: Record<string, boolean>;
    [key: string]: unknown;
  } | null;
};
type Transition = { selections: DraftSelection[]; removed: string[]; evaluation: EvaluationResult };
type Log = {
  id: string;
  kind: string;
  payload?: {
    data?: { manual?: boolean; ability?: { name?: string }; result?: AbilityRollResult };
  };
};
const cid = () => crypto.randomUUID();
const withoutResource = (state: Saved['liveState']) => {
  if (!state) return state;
  const { heroicResource: _resource, ...rest } = state;
  return rest;
};
const sorted = (a: string[]) => [...a].sort();
export async function runShadowLevelSix({
  actors: { director, peer },
  run,
  runId,
}: ScenarioContext) {
  await run(
    'Shadow through six: eight builds, level/college edits and thirty-two new action uses persist',
    async () => {
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Shadow6 ${runId}`,
      });
      const definitions = new Map<number, DecisionDefinitions>();
      for (const targetLevel of [3, 4, 5, 6])
        definitions.set(
          targetLevel,
          (
            await director.query<{ definitions: DecisionDefinitions }>('characterWizard:discover', {
              targetLevel,
            })
          ).definitions,
        );
      const ids: string[] = [];
      const sheets: HeroSheet[] = [];
      const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
      const create = (
        level: number,
        selections: EvaluationInput['selections'],
        name: string,
        wizardDraft = false,
      ) =>
        director.mutation<string>('characters:create', {
          commandId: cid(),
          targetLevel: level,
          wizardDraft,
          authored: { name, appearance: '', biography: '', notes: '' },
          selections: draftSelectionsFrom(selections, definitions.get(level)!),
        });
      for (const [index, w] of ledger.witnesses.entries()) {
        const id = await create(
          w.level,
          w.selections as EvaluationInput['selections'],
          index === 0 ? '' : `${w.id} ${runId}`,
          index === 0,
        );
        ids.push(id);
        let saved = await get(id);
        assert.equal(saved.level, w.level);
        assert.equal(
          saved.evaluation.status,
          'complete',
          `${w.id}: ${JSON.stringify(saved.evaluation.diagnostics)}`,
        );
        if (index === 0) {
          assert.equal(await director.query('characters:wizardDraft', {}), id);
          assert.equal(
            (
              await director.query<{ targetLevel: number }>('characterWizard:discover', {
                characterId: id,
              })
            ).targetLevel,
            4,
          );
          await director.mutation('characters:save', {
            commandId: cid(),
            characterId: id,
            expectedRevision: saved.revision,
            targetLevel: 4,
            authored: { ...saved.authored, name: `${w.id} ${runId}` },
            selections: saved.selections,
            list: true,
          });
          saved = await get(id);
          assert.equal(saved.authored.name, `${w.id} ${runId}`);
          assert.equal(await director.query('characters:wizardDraft', {}), null);
        }
        await director.mutation('characters:submit', {
          commandId: cid(),
          campaignId,
          characterId: id,
        });
        const sheet = await director.query<HeroSheet>('characters:sheet', { characterId: id });
        sheets.push(sheet);
        const b = sheet.build?.baseline;
        assert.ok(b);
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
          assert.equal(b[key].value, w.expected[key], `${w.id} ${key}`);
        assert.deepEqual(
          Object.fromEntries(Object.entries(b.characteristics).map(([k, v]) => [k, v.value])),
          w.expected.characteristics,
        );
        assert.deepEqual(
          Object.fromEntries(Object.entries(b.potency).map(([k, v]) => [k, v.value])),
          w.expected.potency,
        );
        assert.equal(b.kit?.echelon.value, 2);
        assert.deepEqual(
          sorted(sheet.abilities.map(a => a.name)),
          sorted(w.expected.abilities),
          `${w.id} abilities`,
        );
        for (const field of ['perks', 'features', 'skills'] as const)
          assert.deepEqual(
            sorted(b[field].map(x => x.name)),
            sorted(w.expected[field]),
            `${w.id} ${field}`,
          );
        assert.equal((await get(id)).liveState?.stamina, w.expected.staminaMaximum);
        const watch = sheet.abilities.find(a => a.name === 'Night Watch');
        assert.ok(watch?.content?.text);
        assert.match(watch.metadata.distance ?? '', /5$/);
        if (index === 0) assert.equal(b.kit?.rangedDistanceBonus.value, 5); // Night Watch is Ranged+Weapon: printed5 plus Cloak5.
        assert.ok(
          !b.damageImmunities?.some(x => x.damageType === 'corruption'),
          'Form is conditional',
        );
      }
      // Saved full-build edits preserve effective admission and enforce owner/revision checks.
      const id = ids[2]!;
      const original = await get(id);
      await assert.rejects(
        peer.query('characterWizard:transitionLevel', {
          characterId: id,
          fromLevel: 6,
          targetLevel: 3,
          selections: original.selections,
        }),
        /owner/i,
      );
      await assert.rejects(
        director.query('characterWizard:transitionLevel', {
          characterId: id,
          fromLevel: 6,
          targetLevel: 7,
          selections: original.selections,
        }),
        /Unsupported/,
      );
      const down = await director.query<Transition>('characterWizard:transitionLevel', {
        characterId: id,
        fromLevel: 6,
        targetLevel: 3,
        selections: original.selections,
      });
      assert.ok(down.removed.includes('class.shadow.level-4.characteristic'));
      assert.ok(down.removed.includes('class.shadow.level-6.black-ash-ability'));
      const persist = async (level: number, selections: DraftSelection[]) => {
        const saved = await get(id);
        await director.mutation('characters:save', {
          commandId: cid(),
          characterId: id,
          expectedRevision: saved.revision,
          targetLevel: level,
          authored: saved.authored,
          selections,
        });
        return get(id);
      };
      const lowered = await persist(3, down.selections);
      assert.equal(lowered.evaluation.baseline?.staminaMaximum.value, 33);
      assert.equal(lowered.evaluation.baseline?.characteristics.A.value, 2);
      await assert.rejects(
        director.mutation('characters:save', {
          commandId: cid(),
          characterId: id,
          expectedRevision: original.revision,
          targetLevel: 6,
          authored: original.authored,
          selections: original.selections,
        }),
        /changed|Reload/i,
      );
      const up = await director.query<Transition>('characterWizard:transitionLevel', {
        characterId: id,
        fromLevel: 3,
        targetLevel: 6,
        selections: lowered.selections,
      });
      assert.equal((await persist(6, up.selections)).evaluation.status, 'incomplete');
      const draft = await director.query<HeroSheet>('characters:sheet', {
        characterId: id,
        view: 'draft',
      });
      assert.ok(!draft.abilities.some(a => a.name === 'Black Ash Eruption'));
      const effective = await director.query<HeroSheet>('characters:sheet', { characterId: id });
      assert.equal(effective.build?.baseline?.level.value, 6);
      assert.ok(effective.abilities.some(a => a.name === 'Black Ash Eruption'));
      await persist(6, original.selections);
      const changed = await director.query<Transition>('characterWizard:transition', {
        characterId: id,
        targetLevel: 6,
        selections: original.selections,
        decisionId: 'class.shadow.college',
        value: 'Harlequin Mask',
      });
      assert.ok(changed.removed.includes('class.shadow.level-6.black-ash-ability'));
      const collegeDraft = await persist(6, changed.selections);
      assert.equal(collegeDraft.evaluation.status, 'incomplete');
      assert.ok(
        collegeDraft.selections.some(s => s.decisionId === 'class.shadow.level-5.ability-9'),
      );
      const collegeSheet = await director.query<HeroSheet>('characters:sheet', {
        characterId: id,
        view: 'draft',
      });
      assert.ok(
        !collegeSheet.abilities.some(
          a => a.name.startsWith('Trail of Cinders') || a.name === 'Black Ash Eruption',
        ),
      );
      await persist(6, original.selections);
      // Native and borrowed Spark must persist the second-echelon contribution, never merely preview it.
      let targetId = '';
      for (const ancestry of ['Dwarf', 'Revenant']) {
        const selections: EvaluationInput['selections'] = {
          ...ledger.witnesses[2]!.selections,
        } as EvaluationInput['selections'];
        for (const key of Object.keys(selections))
          if (key.startsWith('ancestry.')) delete selections[key];
        selections['ancestry.choice'] = ancestry;
        if (ancestry === 'Dwarf')
          selections['ancestry.dwarf.purchased-traits'] = ['Spark Off Your Skin', 'Grounded'];
        else {
          selections['ancestry.revenant.former-life'] = 'Dwarf';
          selections['ancestry.revenant.dwarf.purchased-traits'] = ['Spark Off Your Skin'];
        }
        const sparkId = await create(6, selections, `${ancestry} Spark ${runId}`);
        if (ancestry === 'Dwarf') targetId = sparkId;
        await director.mutation('characters:submit', {
          commandId: cid(),
          campaignId,
          characterId: sparkId,
        });
        const sheet = await director.query<HeroSheet>('characters:sheet', { characterId: sparkId });
        const b = sheet.build?.baseline;
        assert.ok(b);
        assert.equal(b.staminaMaximum.value, 66);
        assert.equal(b.recoveryValue.value, 22);
        assert.equal(b.windedValue.value, 33);
        assert.equal(
          b.staminaMaximum.provenance.find(p => p.selection === 'Spark Off Your Skin')?.amount,
          12,
        );
        assert.equal((await get(sparkId)).liveState?.stamina, 66);
      }
      const sessionId = await director.mutation<string>('sessions:start', {
        commandId: cid(),
        campaignId,
        selectedPlayerIds: [],
      });
      const invoke = (actorId: string, operation: string, args: Record<string, unknown> = {}) =>
        director.mutation<{ eventId: string }>('commands:invoke', {
          campaignId,
          commandId: cid(),
          operation,
          actor: { refKind: 'character', id: actorId },
          arguments: args,
        });
      const event = async (eventId: string) =>
        (await director.query<{ events: Log[] }>('events:list', { campaignId })).events.find(
          e => e.id === eventId,
        );
      const target = { refKind: 'character', id: targetId };
      try {
        for (const operation of ['combat.start', 'combat.commit'])
          await director.mutation('commands:invoke', {
            campaignId,
            commandId: cid(),
            operation,
            arguments: {},
          });
        const names = new Set<string>();
        for (const [i, w] of ledger.witnesses.entries())
          for (const a of w.actions) {
            assert.ok(!names.has(a.name));
            names.add(a.name);
            const actorId = ids[i]!;
            const shown = sheets[i]!.abilities.find(x => x.name === a.name);
            assert.ok(shown?.content?.text, a.name);
            assert.deepEqual(
              shown.cost,
              a.cost ? { resource: 'insight', amount: a.cost } : undefined,
              `${a.name} source cost`,
            );
            await invoke(actorId, 'adjust.heroic-resource', { value: a.cost });
            await invoke(targetId, 'adjust.stamina', { value: 42 });
            const before = await get(targetId);
            const actorBefore = await get(actorId);
            const used = await invoke(actorId, 'ability.use', {
              ability: a.name,
              targets: [target],
            });
            const persisted = await event(used.eventId);
            const after = await get(targetId);
            assert.equal(
              (await get(actorId)).liveState?.heroicResource.current,
              0,
              `${a.name} payment`,
            );
            if (a.mode === 'rolled') {
              assert.equal(persisted?.kind, 'ability.use', a.name);
              const result = persisted?.payload?.data?.result;
              assert.ok(result, a.name);
              const outcome = result.targets[0]!;
              const damage = a.damageByTier![outcome.tier - 1]!;
              assert.equal(outcome.damage?.rolledDamage ?? 0, damage, a.name);
              assert.equal(after.liveState?.stamina, before.liveState!.stamina - damage, a.name);
              assert.match(
                JSON.stringify([outcome.unresolvedClauses, result.manualResolutions]),
                new RegExp(a.manual!, 'i'),
                a.name,
              );
              if (a.name === 'You Talk Too Much') {
                assert.match(JSON.stringify(outcome.unresolvedClauses), /dazed/i);
                assert.deepEqual(
                  after.liveState?.conditions,
                  before.liveState?.conditions,
                  'Dazed clause remains manual with communication remainder',
                );
              }
            } else {
              assert.equal(persisted?.kind, 'ability.recorded', a.name);
              assert.equal(persisted?.payload?.data?.manual, true, a.name);
              assert.equal(persisted?.payload?.data?.ability?.name, a.name);
              assert.deepEqual(
                withoutResource(after.liveState),
                withoutResource(before.liveState),
                `${a.name} manual target unchanged`,
              );
              assert.deepEqual(
                withoutResource((await get(actorId)).liveState),
                withoutResource(actorBefore.liveState),
                `${a.name} manual actor unchanged`,
              );
            }
            if (a.cost) {
              const blocked = await invoke(actorId, 'ability.use', {
                ability: a.name,
                targets: [target],
              });
              assert.equal((await event(blocked.eventId))?.kind, 'ability.blocked', a.name);
              assert.equal((await get(actorId)).liveState?.heroicResource.current, 0);
            }
          }
        assert.equal(names.size, 32, '11 envelopes and21 embedded uses');
        // Earlier signature still uses new Agility3, but its kit bonus remains1 (not multiplied by echelon).
        await invoke(targetId, 'adjust.stamina', { value: 42 });
        const oldUse = await invoke(ids[2]!, 'ability.use', {
          ability: 'Gasping in Pain',
          targets: [target],
        });
        const roll = (await event(oldUse.eventId))?.payload?.data?.result;
        assert.ok(roll);
        const damage = [7, 9, 12][roll.targets[0]!.tier - 1]!;
        assert.equal(roll.targets[0]!.damage?.rolledDamage, damage);
        assert.equal((await get(targetId)).liveState?.stamina, 42 - damage);
        // Paid delayed action outside combat remains free, with the same no-premature-damage boundary.
        await director.mutation('commands:invoke', {
          campaignId,
          commandId: cid(),
          operation: 'combat.end',
          arguments: {},
        });
        await director.mutation('commands:invoke', {
          campaignId,
          commandId: cid(),
          operation: 'combat.victories',
          arguments: { amount: 0, recipients: [] },
        });
        await director.mutation('commands:invoke', {
          campaignId,
          commandId: cid(),
          operation: 'combat.finish',
          arguments: {},
        });
        const outActor = ids[1]!;
        await invoke(outActor, 'adjust.heroic-resource', { value: 0 });
        const before = await get(targetId);
        const free = await invoke(outActor, 'ability.use', {
          ability: 'Into the Shadows',
          targets: [target],
        });
        assert.equal((await event(free.eventId))?.kind, 'ability.recorded');
        assert.equal((await get(outActor)).liveState?.heroicResource.current, 0);
        assert.deepEqual((await get(targetId)).liveState, before.liveState);
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
