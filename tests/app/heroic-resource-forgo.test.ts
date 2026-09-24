// SPDX-License-Identifier: GPL-3.0-only
// V150: the Self-Taught complication's forgo. Pinned complication/self-taught.md: "At the start of
// each of your turns during combat, you can forgo gaining your Heroic Resource until the start of
// your next turn." Shadow gains come from feature/shadow/level-1/insight.md (1d3 each turn start,
// the once-per-round surge claim). The engine reads only the evaluated features, so the Self-Taught
// complication feature is added to the build directly (building it is the wizard's concern).
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import shadowLedger from '../fixtures/v92-shadow-expected.json' with { type: 'json' };
import { admitHero, backend, table } from './fixtures/table';

let sequence = 0;
test('V150: a Self-Taught Shadow forgoes insight until the start of their next turn', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const shadow = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Shade',
    draftSelectionsFrom(
      {
        ...(shadowLedger.witnesses[0]!.selections as EvaluationInput['selections']),
        'details.name': 'Shade',
      },
      definitions,
    ),
  );
  await t.run(async ctx => {
    const hero = (await ctx.db.get(shadow))!;
    const baseline = hero.derivedBaseline as { features: unknown[] };
    await ctx.db.patch(shadow, {
      derivedBaseline: {
        ...baseline,
        features: [
          ...baseline.features,
          {
            name: 'Self-Taught',
            kind: 'complication',
            sourcePath: 'en/unified/md/complication/self-taught.md',
            provenance: { decisionId: 'complication.choice', value: 'Self-Taught' },
          },
        ],
      },
    });
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `forgo-test-${++sequence}`,
      text,
    });
  const ref = `@{character:${shadow}}`;
  const live = async () => (await t.run(ctx => ctx.db.get(shadow)))!.liveState!;
  const claim = () => command(`${ref} /resource claim trigger=shadow-surge-damage`, true);

  // Thorn has no Self-Taught complication.
  await expect(command('@Thorn /resource forgo', true)).rejects.toThrow(/Self-Taught/);
  await command('/combat start');
  await command('/combat commit');
  await command('/combat first side=heroes');
  await command(`${ref} /resource forgo`, true);
  expect((await live()).forgoNext).toBe(true);
  await command(`${ref} /turn take`, true);
  expect((await live()).heroicResource.current).toBe(0);
  expect((await live()).forgoing).toBe(true);
  await expect(claim()).rejects.toThrow(/forgoing/);
  await command(`${ref} /turn end`, true);
  await command('@Thorn /turn take', true);
  await command('@Thorn /turn end', true);
  // The next turn start ends the forgo: the 1d3 applies and claims are open again.
  await command(`${ref} /turn take`, true);
  expect((await live()).forgoing).toBe(false);
  const gained = (await live()).heroicResource.current;
  expect(gained).toBeGreaterThanOrEqual(1);
  expect(gained).toBeLessThanOrEqual(3);
  await claim();
  expect((await live()).heroicResource.current).toBe(gained + 1);
});
