// SPDX-License-Identifier: GPL-3.0-only
/** Saved public-API comparisons; consumes independently executed Forge output. No browser. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createActor, failureDetails, type ActorSession } from '../headless/character-client.ts';
import type { DraftSelection } from '../../shared/characterDraft.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type {
  EvaluationResult,
  SelectionValue,
} from '../../shared/contracts/characterEvaluation.ts';
import type { HeroSheet } from '../../shared/contracts/characterSheet.ts';

type Discovery = {
  definitions: DecisionDefinitions;
  selections: DraftSelection[];
  evaluation: EvaluationResult;
};
type Counterpart = {
  id: string;
  ancestry: string;
  purchasedTraits: string[];
  selections: Record<string, SelectionValue>;
  forge: {
    complete: boolean;
    baseline: Record<string, unknown>;
    skills: string[];
    languages: string[];
    abilities: string[];
    conditionImmunities: string[];
    damageImmunities: { damageType: string; value: number }[];
    ancestryFeatures: string[];
  };
};
const output = process.env.SALIENT_FORGE_OUTPUT;
if (!output || process.env.SALIENT_HEADLESS_TARGET !== 'https://different-bat-943.convex.cloud')
  throw new Error('headless-target-validation-failed');
const sessions: ActorSession[] = [];
const results: unknown[] = [];
const runId = crypto.randomUUID();
const started = Date.now();
const source = process.env.SALIENT_HEADLESS_SOURCE;
assert.ok(source && /^[a-f0-9]{40}$/.test(source), 'Provide actual adapter source commit');
const report = () =>
  writeFileSync(
    join(output, 'live-comparison.json'),
    JSON.stringify(
      {
        runId,
        source,
        target: process.env.SALIENT_HEADLESS_TARGET,
        elapsedMs: Date.now() - started,
        results,
      },
      null,
      2,
    ) + '\n',
  );
const timer = setTimeout(() => {
  results.push({ status: 'fail', reason: 'run-deadline' });
  report();
  process.exit(1);
}, 240_000);
const names = (values: string[]) =>
  [
    ...new Set(
      values.map(value => value.replaceAll('’', "'").replace(/^Pain For Pain$/, 'Pain for Pain')),
    ),
  ].sort();
const values = (selections: DraftSelection[]) =>
  Object.fromEntries(selections.map(s => [s.decisionId, s.value]));
try {
  const counterparts = JSON.parse(
    readFileSync(join(output, 'counterparts.json'), 'utf8'),
  ) as Counterpart[];
  assert.ok(
    counterparts.length > 0 && counterparts.every(w => w.forge.complete),
    'Forge completion prerequisite',
  );
  const actor = await createActor(
    'forge',
    runId,
    {
      url: 'https://different-bat-943.convex.cloud',
      siteUrl: 'https://different-bat-943.convex.site',
      origin: 'https://salient-dev.rdxx.workers.dev',
      active: () => Date.now() - started < 210_000,
    },
    session => sessions.push(session),
  );
  const discovery = await actor.query<Discovery>('characterWizard:discover', {});
  for (const witness of counterparts) {
    try {
      const selections: DraftSelection[] = Object.entries(witness.selections)
        .filter(([id]) => !id.startsWith('details.'))
        .map(([decisionId, value]) => {
          const step = discovery.definitions.steps.find(step =>
            step.decisions.some(d => d.id === decisionId),
          );
          const decision = step?.decisions.find(d => d.id === decisionId);
          assert.ok(step && decision, `Discovery missing ${decisionId}`);
          return {
            decisionId,
            value,
            ownerBranchId: step.id,
            sources: [
              {
                id: decisionId,
                path: decision.source,
                revision: discovery.definitions.compendiumRevision,
              },
            ],
          };
        });
      const preview = await actor.query<Discovery>('characterWizard:discover', { selections });
      assert.equal(preview.evaluation.status, 'complete', 'Salient counterpart completeness');
      // Never let canonicalization hide a dropped/changed supplied choice.
      for (const [id, value] of Object.entries(values(selections)))
        assert.deepEqual(values(preview.selections)[id], value, `Preview choice ${id}`);
      const characterId = await actor.mutation<string>('characters:create', {
        commandId: crypto.randomUUID(),
        authored: {
          name: `Forge ${witness.id} ${runId}`,
          appearance: '',
          biography: 'V73 headless counterpart',
          notes: '',
        },
        selections: preview.selections,
      });
      const saved = await actor.query<{ status: string; selections: DraftSelection[] }>(
        'characters:get',
        { characterId },
      );
      const sheet = await actor.query<HeroSheet>('characters:sheet', { characterId });
      // Retain real readbacks even when a comparison fails.
      writeFileSync(
        join(output, `${witness.id}-salient.json`),
        JSON.stringify({ characterId, saved, sheet }, null, 2) + '\n',
      );
      assert.equal(saved.status, 'complete', 'Saved counterpart completeness');
      assert.deepEqual(values(saved.selections), values(preview.selections), 'Saved choices');
      const baseline = sheet.build?.baseline;
      assert.ok(baseline, 'Persisted build baseline');
      const mismatches: { field: string; actual: unknown; expected: unknown }[] = [];
      const compare = (field: string, actual: unknown, expected: unknown) => {
        try {
          assert.deepEqual(actual, expected);
        } catch {
          mismatches.push({ field, actual, expected });
        }
      };
      for (const [field, expected] of Object.entries(witness.forge.baseline)) {
        const actual =
          field === 'characteristics'
            ? Object.fromEntries(
                Object.entries(baseline.characteristics).map(([name, value]) => [
                  name,
                  value.value,
                ]),
              )
            : (baseline[field as keyof typeof baseline] as { value?: unknown })?.value;
        compare(field, actual, expected);
      }
      compare('skills', names(baseline.skills.map(s => s.name)), names(witness.forge.skills));
      compare(
        'languages',
        names(baseline.languages.map(l => l.name)),
        names(witness.forge.languages),
      );
      // Compendium-reviewed activations Forge retains only as trait text. They are additional
      // Salient actions, not missing Forge grants. Preserve the distinction in the report.
      const textOnlyActions = [
        ...(witness.ancestry === 'Dwarf' ? ['Runic Carving: Carve, Change, or Remove Rune'] : []),
        ...(witness.ancestry === 'Orc' ? ['Relentless'] : []),
        ...['Stone Singer', 'Doomsight'].filter(name => witness.purchasedTraits.includes(name)),
      ];
      compare(
        'abilities',
        names(sheet.abilities.map(a => a.name)),
        names([...witness.forge.abilities, ...textOnlyActions]),
      );
      compare(
        'conditionImmunities',
        names((baseline.conditionImmunities ?? []).map(c => c.condition.toLowerCase())),
        names(witness.forge.conditionImmunities.map(c => c.toLowerCase())),
      );
      compare(
        'damageImmunities',
        (baseline.damageImmunities ?? [])
          .map(d => ({ damageType: d.damageType.toLowerCase(), value: d.value.value }))
          .sort((a, b) => a.damageType.localeCompare(b.damageType)),
        witness.forge.damageImmunities,
      );
      // Forge also names technical Size/Speed/skill-choice features; retain all in evidence.
      // Compare the actual named signature/purchased traits separately from those containers.
      const technical = new Set(['Size', 'Speed']);
      const salientTraits = names(baseline.traits.map(t => t.name));
      const forgeTraits = names(
        witness.forge.ancestryFeatures.filter(name => !technical.has(name)),
      );
      compare(
        'ancestryTraits',
        salientTraits.filter(name => !technical.has(name)),
        forgeTraits,
      );
      for (const trait of witness.purchasedTraits)
        compare(
          `trait:${trait}`,
          sheet.features.some(f => f.name === trait),
          true,
        );
      results.push({
        id: witness.id,
        characterId,
        status: mismatches.length ? 'fail' : 'pass',
        mismatches,
        compendiumActionsBeyondForge: textOnlyActions,
      });
      if (mismatches.length) process.exitCode = 1;
    } catch (error) {
      results.push({ id: witness.id, status: 'fail', ...failureDetails(error) });
      process.exitCode = 1;
      // Infrastructure failures are a blocker, not a retry loop over thirty more requests.
      if (!(error instanceof Error && error.name === 'AssertionError')) break;
    }
    report();
  }
} catch (error) {
  results.push({ status: 'fail', ...failureDetails(error) });
  process.exitCode = 1;
} finally {
  for (const session of sessions) {
    try {
      await session.close();
    } catch (error) {
      results.push({ status: 'fail', ...failureDetails(error) });
      process.exitCode = 1;
    }
  }
  report();
  clearTimeout(timer);
}
console.log(
  JSON.stringify({
    runId,
    cases: results.length,
    report: join(output, 'live-comparison.json'),
    failed: process.exitCode === 1,
  }),
);
