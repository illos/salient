// SPDX-License-Identifier: GPL-3.0-only
/** V151 source-granted follow-up actions (QC1 V135 R1), used once each through the shared route. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation.ts';
import type { HeroSheet } from '../../shared/contracts/characterSheet.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import { evaluateCharacter } from '../../shared/evaluate/character.ts';
import { getDefinitions } from '../../shared/content/character-decisions.ts';
import type followUpLedger from '../../tests/fixtures/v151-follow-up-actions.json';
type Selections = EvaluationInput['selections'];
const read = <T>(path: string) => JSON.parse(readFileSync(path, 'utf8')) as T;
const followUps = read<typeof followUpLedger>('tests/fixtures/v151-follow-up-actions.json');
type Witness = {
  base: string;
  tradition?: string;
  wildNature?: string;
  levelTwo: { addedSelections: Record<string, string> };
  levelThree: { addedSelections: Record<string, string> };
};
type Ledger = { witnesses: Record<string, Witness> };
type LevelOne = { witnesses: { id: string; selections: unknown }[] };
type Saved = { liveState: { heroicResource: { current: number }; stamina: number } | null };
type Log = {
  id: string;
  kind: string;
  payload?: {
    data?: { manual?: boolean; ability?: { name?: string; effects?: { text: string }[] } };
  };
};
const cid = () => crypto.randomUUID();
const classes = {
  Elementalist: {
    ledger: read<Ledger>('tests/fixtures/v135-elementalist-three-expected.json'),
    one: read<LevelOne>('tests/fixtures/v104-elementalist-expected.json'),
    slots: (_w: Witness) => [
      'class.elementalist.level-2.ability-5',
      'class.elementalist.level-3.ability-7',
    ],
    picks: (w: Witness) => ({
      'class.elementalist.level-2.perk': w.levelTwo.addedSelections.perk!,
      'class.elementalist.level-2.ability-5': w.levelTwo.addedSelections.ability5!,
      'class.elementalist.level-3.ability-7': w.levelThree.addedSelections.ability7!,
    }),
  },
  Talent: {
    ledger: read<Ledger>('tests/fixtures/v136-talent-three-expected.json'),
    one: read<LevelOne>('tests/fixtures/v105-talent-expected.json'),
    slots: (w: Witness) => [`class.talent.level-2.${w.tradition!.toLowerCase()}-ability`],
    picks: (w: Witness) => ({
      'class.talent.level-2.perk': w.levelTwo.addedSelections.perk!,
      [`class.talent.level-2.${w.tradition!.toLowerCase()}-ability`]:
        w.levelTwo.addedSelections.traditionAbility!,
      'class.talent.level-3.ability-7': w.levelThree.addedSelections.ability7!,
    }),
  },
  Beastheart: {
    ledger: read<Ledger>('tests/fixtures/v137-beastheart-three-expected.json'),
    one: read<LevelOne>('tests/fixtures/v106-beastheart-expected.json'),
    slots: (w: Witness) => [
      `class.beastheart.level-2.${w.wildNature!.toLowerCase()}-ability`,
      'class.beastheart.level-3.ability-7',
    ],
    picks: (w: Witness) => ({
      'class.beastheart.level-2.perk': w.levelTwo.addedSelections.perk!,
      [`class.beastheart.level-2.${w.wildNature!.toLowerCase()}-ability`]:
        w.levelTwo.addedSelections.natureAbility!,
      'class.beastheart.level-3.ability-7': w.levelThree.addedSelections.ability7!,
    }),
  },
} as const;
const evaluate = (selections: Selections, level: number) =>
  evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: followUps.compendiumRevision,
      level,
      selections,
    },
    getDefinitions(level),
  );
/** A complete level-3 witness build (parent swapped into an ability slot if needed) granting the action. */
function buildFor(action: (typeof followUps.actions)[number]): Selections {
  const c = classes[action.class as keyof typeof classes];
  for (const w of Object.values(c.ledger.witnesses)) {
    const base = {
      ...(c.one.witnesses.find(b => b.id === w.base)!.selections as Selections),
      ...c.picks(w),
    };
    for (const selections of [
      base,
      ...c.slots(w).map(slot => ({ ...base, [slot]: action.parent })),
    ]) {
      const result = evaluate(selections, 3);
      if (
        result.status === 'complete' &&
        result.baseline!.abilities.some(a => a.name === action.name)
      )
        return selections;
    }
  }
  throw new Error(`No level-3 witness build grants ${action.name}`);
}
const withoutResource = (state: Saved['liveState']) => {
  if (!state) return state;
  const { heroicResource: _resource, ...rest } = state;
  return rest;
};

export async function runFollowUpActions({ actors: { director }, run, runId }: ScenarioContext) {
  await run(
    'Level 2–3 follow-up actions are listed and recorded through the shared route',
    async () => {
      const definitions = (
        await director.query<{ definitions: DecisionDefinitions }>('characterWizard:discover', {
          targetLevel: 3,
        })
      ).definitions;
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Follow-up actions ${runId}`,
      });
      const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
      const create = async (name: string, level: number, selections: Selections) => {
        const characterId = await director.mutation<string>('characters:create', {
          commandId: cid(),
          targetLevel: level,
          authored: { name: `${name} ${runId}`, appearance: '', biography: '', notes: '' },
          selections: draftSelectionsFrom(
            selections,
            level === 3
              ? definitions
              : (
                  await director.query<{ definitions: DecisionDefinitions }>(
                    'characterWizard:discover',
                    { targetLevel: level },
                  )
                ).definitions,
          ),
        });
        await director.mutation('characters:submit', { commandId: cid(), campaignId, characterId });
        return characterId;
      };
      const builds = new Map<string, { selections: Selections; actions: string[] }>();
      for (const action of followUps.actions) {
        const selections = buildFor(action);
        const key = JSON.stringify(selections);
        builds.set(key, {
          selections,
          actions: [...(builds.get(key)?.actions ?? []), action.name],
        });
      }
      const ids = new Map<string, string>();
      for (const [key, build] of builds)
        ids.set(key, await create(`Follow-up ${ids.size}`, 3, build.selections));
      const targetId = await create(
        'Follow-up target',
        1,
        classes.Elementalist.one.witnesses[0]!.selections as Selections,
      );
      // Great-cat eligibility: a level-2 Green Elementalist lists Animal Form but not the jump.
      const jump = followUps.actions.find(a => a.name.endsWith('Great Cat Jump'))!;
      const green = buildFor(jump);
      const greenTwo = await create(
        'Follow-up green 2',
        2,
        Object.fromEntries(
          Object.entries(green).filter(([id]) => !id.includes('.level-3.')),
        ) as Selections,
      );
      const twoSheet = await director.query<HeroSheet>('characters:sheet', {
        characterId: greenTwo,
      });
      assert.ok(twoSheet.abilities.some(a => a.name === 'Disciple of the Green: Animal Form'));
      assert.ok(!twoSheet.abilities.some(a => a.name === jump.name), 'no great-cat jump at 2nd');

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
        await assert.rejects(
          invoke(greenTwo, 'ability.use', {
            ability: jump.name,
            targets: [{ refKind: 'character', id: targetId }],
          }),
          /ability|available|known|not found/i,
        );
        for (const [key, build] of builds) {
          const id = ids.get(key)!;
          const sheet = await director.query<HeroSheet>('characters:sheet', { characterId: id });
          for (const name of build.actions) {
            const listed = sheet.abilities.find(a => a.name === name);
            assert.ok(listed?.content?.text, `${name} listed with its source`);
            assert.ok(listed.activationCondition, `${name} listed with its condition`);
            const printedTarget = (listed.metadata.target ?? '').replace(
              /\[([^\]]*)\]\([^)]*\)/g,
              '$1',
            );
            const affectedId = printedTarget.trim().toLowerCase() === 'self' ? id : targetId;
            const target = { refKind: 'character', id: affectedId };
            const before = await get(affectedId);
            const actorBefore = await get(id);
            const use = await invoke(id, 'ability.use', { ability: name, targets: [target] });
            const persisted = await event(use.eventId);
            assert.equal(persisted?.kind, 'ability.recorded', name);
            assert.equal(persisted?.payload?.data?.manual, true, name);
            assert.equal(persisted?.payload?.data?.ability?.name, name);
            if (affectedId !== id)
              assert.deepEqual(
                (await get(affectedId)).liveState,
                before.liveState,
                `${name} target`,
              );
            assert.deepEqual(
              withoutResource((await get(id)).liveState),
              withoutResource(actorBefore.liveState),
              `${name} actor`,
            );
            used.add(name);
          }
        }
        assert.equal(used.size, followUps.actions.length, 'every V151 follow-up action');
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
