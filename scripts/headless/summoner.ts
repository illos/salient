// SPDX-License-Identifier: GPL-3.0-only
/** Independent source ledger drives public authoring, admission and manual action readbacks. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type {
  EvaluationInput,
  EvaluationResult,
} from '../../shared/contracts/characterEvaluation.ts';
import type { HeroSheet } from '../../shared/contracts/characterSheet.ts';
import type { DraftSelection } from '../../shared/characterDraft.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import type sourceLedger from '../../tests/fixtures/v107-summoner-expected.json';
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v107-summoner-expected.json', 'utf8'),
) as typeof sourceLedger;
type Saved = {
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
    data?: { manual?: boolean; ability?: { name?: string; effects?: { text: string }[] } };
  };
};
const cid = () => crypto.randomUUID();
const withoutResource = (state: Saved['liveState']) => {
  if (!state) return state;
  const { heroicResource: _resource, ...rest } = state;
  return rest;
};
export async function runSummoner({ actors: { director, peer }, run, runId }: ScenarioContext) {
  await run('Summoner: twelve portfolio builds and 144 manual action records persist', async () => {
    const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
      'characterWizard:discover',
      { targetLevel: 1 },
    );
    const campaignId = await director.mutation<string>('campaigns:create', {
      commandId: cid(),
      name: `Summoner ${runId}`,
    });
    const ids: string[] = [],
      sheets: HeroSheet[] = [];
    const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
    for (const w of ledger.witnesses) {
      const id = await director.mutation<string>('characters:create', {
        commandId: cid(),
        targetLevel: 1,
        authored: { name: `${w.id} ${runId}`, appearance: '', biography: '', notes: '' },
        selections: draftSelectionsFrom(
          w.selections as unknown as EvaluationInput['selections'],
          definitions,
        ),
      });
      ids.push(id);
      assert.equal((await get(id)).evaluation.status, 'complete', w.id);
      await director.mutation('characters:submit', {
        commandId: cid(),
        campaignId,
        characterId: id,
      });
      const sheet = await director.query<HeroSheet>('characters:sheet', { characterId: id });
      sheets.push(sheet);
      const h = sheet.build!.baseline!,
        e = w.expected;
      for (const key of [
        'staminaMaximum',
        'recoveriesMaximum',
        'recoveryValue',
        'windedValue',
        'speed',
        'stability',
        'disengage',
      ] as const)
        assert.equal(h[key].value, e[key], `${w.id} ${key}`);
      assert.deepEqual(
        Object.fromEntries(Object.entries(h.characteristics).map(([k, v]) => [k, v.value])),
        e.characteristics,
      );
      assert.deepEqual(h.skills.map(x => x.name).sort(), e.skills);
      assert.equal(h.kit, null);
      assert.deepEqual(
        [h.potency.weak.value, h.potency.average.value, h.potency.strong.value],
        [0, 1, 2],
      );
      assert.ok(h.summoner);
      const { portfolio, provenance: _provenance, ...summary } = h.summoner;
      const { portfolio: expectedPortfolio, ...expectedSummary } = e.summoner;
      assert.deepEqual(summary, expectedSummary, w.id);
      for (const [i, m] of portfolio.entries()) {
        const { text, provenance, ...value } = m;
        assert.deepEqual(value, expectedPortfolio[i], `${w.id} ${m.name}`);
        assert.ok(text.length);
        assert.ok(provenance.some(p => p.source.path === m.sourcePath));
      }
      assert.ok(!sheet.abilities.some(a => /^(Melee|Ranged) (Weapon )?Free Strike$/i.test(a.name)));
      assert.deepEqual(
        sheet.abilities
          .filter(a => a.grantedBy.decisionId.startsWith('class.summoner.'))
          .map(a => a.name)
          .sort(),
        Object.keys(w.actions).sort(),
      );
      for (const name of Object.keys(w.actions)) {
        const a = sheet.abilities.find(a => a.name === name)!;
        assert.ok(a.content?.text, name);
        assert.match(a.activationCondition ?? '', /Record and resolve manually/);
        assert.ok(!a.grantedBy.quote.includes('Record and resolve manually'));
      }
    }
    const firstCharacter = ids[0]!;
    let saved = await get(firstCharacter);
    await assert.rejects(
      peer.query('characterWizard:transition', {
        characterId: firstCharacter,
        selections: saved.selections,
        decisionId: 'class.summoner.circle',
        value: 'Graves',
      }),
      /owner/i,
    );
    const changed = await director.query<{ selections: DraftSelection[] }>(
      'characterWizard:transition',
      {
        characterId: firstCharacter,
        selections: saved.selections,
        decisionId: 'class.summoner.circle',
        value: 'Graves',
      },
    );
    await director.mutation('characters:save', {
      commandId: cid(),
      characterId: firstCharacter,
      expectedRevision: saved.revision,
      authored: saved.authored,
      selections: changed.selections,
    });
    saved = await get(firstCharacter);
    assert.equal(saved.evaluation.status, 'incomplete');
    assert.ok(
      !saved.selections.some(s => s.decisionId.startsWith('class.summoner.portfolio.blight.')),
    );
    const draft = await director.query<HeroSheet>('characters:sheet', {
      characterId: firstCharacter,
      view: 'draft',
    });
    assert.ok(!draft.abilities.some(a => a.name.includes('Ensnarer')));
    assert.equal(
      (await director.query<HeroSheet>('characters:sheet', { characterId: firstCharacter })).build!
        .baseline!.summoner!.circle,
      'Blight',
    );
    const definitionsForFoes = await director.query<{ definitionId: string }[]>(
      'foes:definitions',
      { campaignId },
    );
    assert.ok(!definitionsForFoes.some(f => f.definitionId.startsWith('mcdm.summoner.v1/')));
    await assert.rejects(
      director.mutation('foes:add', {
        campaignId,
        commandId: cid(),
        definitionId: 'mcdm.summoner.v1/monster.minion.summoner.undead.statblock/skeleton',
      }),
      /manual character references/i,
    );
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
    try {
      const first = ids[0]!,
        targetId = ids[1]!;
      const waived = await invoke(first, 'ability.use', {
        ability: 'Summoner: Distraction Tactics',
        targets: [{ refKind: 'character', id: targetId }],
      });
      assert.equal((await event(waived.eventId))?.kind, 'ability.recorded');
      assert.equal((await get(first)).liveState!.heroicResource.current, 0);
      for (const operation of ['combat.start', 'combat.commit'])
        await director.mutation('commands:invoke', {
          campaignId,
          commandId: cid(),
          operation,
          arguments: {},
        });
      const seen = new Set<string>();
      for (const [i, w] of ledger.witnesses.entries()) {
        const id = ids[i]!,
          affectedId = ids[(i + 1) % ids.length]!;
        for (const [name, cost] of Object.entries(w.actions)) {
          if (seen.has(name)) continue;
          seen.add(name);
          const action = sheets[i]!.abilities.find(a => a.name === name)!;
          assert.deepEqual(
            action.cost,
            cost ? { resource: 'essence', amount: cost } : undefined,
            `${name} source cost`,
          );
          if (cost) assert.equal(action.metadata.cost, `${cost} Essence`);
          await invoke(id, 'adjust.heroic-resource', { value: cost });
          const before = await get(affectedId),
            actorBefore = await get(id);
          const used = await invoke(id, 'ability.use', {
            ability: name,
            targets: [{ refKind: 'character', id: affectedId }],
          });
          const persisted = await event(used.eventId);
          assert.equal(persisted?.kind, 'ability.recorded', name);
          assert.equal(persisted?.payload?.data?.manual, true, name);
          assert.equal(persisted?.payload?.data?.ability?.name, name);
          assert.match(
            JSON.stringify(persisted?.payload?.data?.ability?.effects),
            /Record and resolve manually/,
          );
          assert.deepEqual(
            (await get(affectedId)).liveState,
            before.liveState,
            `${name} no fabricated target effect`,
          );
          const after = await get(id);
          assert.equal(after.liveState!.heroicResource.current, 0, `${name} paid`);
          assert.deepEqual(
            withoutResource(after.liveState),
            withoutResource(actorBefore.liveState),
            `${name} no fabricated actor effect`,
          );
          if (cost) {
            const blocked = await invoke(id, 'ability.use', {
              ability: name,
              targets: [{ refKind: 'character', id: affectedId }],
            });
            assert.equal((await event(blocked.eventId))?.kind, 'ability.blocked', name);
            assert.equal((await get(id)).liveState!.heroicResource.current, 0);
          }
        }
      }
      assert.equal(seen.size, ledger.actionCount);
      await assert.rejects(
        invoke(ids[0]!, 'ability.use', {
          ability: 'Call Forth: Skeleton',
          targets: [{ refKind: 'character', id: ids[1]! }],
        }),
        /ability|available|known|not found/i,
      );
      for (const ability of ['Melee Weapon Free Strike', 'Ranged Weapon Free Strike'])
        await assert.rejects(
          invoke(ids[0]!, 'ability.use', {
            ability,
            targets: [{ refKind: 'character', id: ids[1]! }],
          }),
          /ability|available|known|not found/i,
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
  });
}
