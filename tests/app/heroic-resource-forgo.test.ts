// SPDX-License-Identifier: GPL-3.0-only
// V150: the Self-Taught complication's forgo. Pinned complication/self-taught.md: "At the start of
// each of your turns during combat, you can forgo gaining your Heroic Resource until the start of
// your next turn." Shadow gains come from feature/shadow/level-1/insight.md (1d3 each turn start,
// the once-per-round surge claim). The Shadow is built with the Self-Taught complication.
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
        ...(shadowLedger.witnesses[0]!.selections as unknown as EvaluationInput['selections']),
        'complication.choice': 'Self-Taught',
        'details.name': 'Shade',
      },
      definitions,
    ),
  );
  const baseline = (await t.run(ctx => ctx.db.get(shadow)))!.derivedBaseline as {
    features: { name: string; kind: string }[];
  };
  expect(baseline.features).toContainEqual(
    expect.objectContaining({ name: 'Self-Taught', kind: 'complication' }),
  );
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

  // Declared before the turn: that turn start adds nothing; claims are refused until the next.
  await command(`${ref} /resource forgo`, true);
  await command(`${ref} /turn take`, true);
  expect((await live()).heroicResource.current).toBe(0);
  expect((await live()).forgoing).toBe(true);
  await expect(claim()).rejects.toThrow(/forgoing/);
  await command(`${ref} /turn end`, true);
  // Still forgoing on another creature's turn.
  await command('@Thorn /turn take', true);
  await expect(claim()).rejects.toThrow(/forgoing/);
  await command('@Thorn /turn end', true);

  // The next turn start ends it: the 1d3 applies and claims reopen.
  await command(`${ref} /turn take`, true);
  expect((await live()).forgoing).toBe(false);
  const gained = (await live()).heroicResource.current;
  expect(gained).toBeGreaterThanOrEqual(1);
  expect(gained).toBeLessThanOrEqual(3);

  // After a claim this turn the pool has moved, so forgoing now is refused (V150 review R4), even
  // when a later change brings it back to the post-gain value (QC1 R1: claim +1, then spend 1).
  await claim();
  await expect(command(`${ref} /resource forgo value=now`, true)).rejects.toThrow(/changed/);
  await command(`${ref} /adjust heroic-resource value=${gained}`);
  expect((await live()).heroicResource.current).toBe(gained);
  await expect(command(`${ref} /resource forgo value=now`, true)).rejects.toThrow(/changed/);
  await command('/history undo');
  await command('/history undo', true);
  // QC1 R1b: if the gain's journal entry can't be found, the pool can't be confirmed untouched.
  const kept = (await live()).lastTurnGain!;
  await t.run(async ctx => {
    const hero = (await ctx.db.get(shadow))!;
    await ctx.db.patch(shadow, {
      liveState: { ...hero.liveState!, lastTurnGain: { ...kept, eventId: 'missing-anchor' } },
    });
  });
  await expect(command(`${ref} /resource forgo value=now`, true)).rejects.toThrow(/changed/);
  await t.run(async ctx => {
    const hero = (await ctx.db.get(shadow))!;
    await ctx.db.patch(shadow, { liveState: { ...hero.liveState!, lastTurnGain: kept } });
  });
  // Decided at this turn's start after the gain: value=now removes this turn's gain and forgoes.
  await command(`${ref} /resource forgo value=now`, true);
  expect((await live()).heroicResource.current).toBe(0);
  expect((await live()).forgoing).toBe(true);
  await expect(claim()).rejects.toThrow(/forgoing/);
  await expect(command(`${ref} /resource forgo value=now`, true)).rejects.toThrow(/already/);

  // A keep-mode void clears the forgo so the next combat starts clean.
  await command(`${ref} /resource forgo`, true);
  await command('/combat void mode=keep');
  expect((await live()).forgoing).toBe(false);
  expect((await live()).forgoNext).toBe(false);
});
