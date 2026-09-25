// SPDX-License-Identifier: GPL-3.0-only
/**
 * V188: follow-up ability records (a `parent` plus the parent's source file) must show the printed
 * body of that file, never its YAML frontmatter, on every sheet and in the table ability list.
 */
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'vitest';
import { readPinnedSource } from './helpers/pinned-source.ts';
import { BEASTHEART_ACTIONS } from '../shared/content/classes/beastheart/abilities.ts';
import { CENSOR_ACTIONS } from '../shared/content/classes/censor/abilities.ts';
import { CONDUIT_ACTIONS } from '../shared/content/classes/conduit/abilities.ts';
import { ELEMENTALIST_ACTIONS } from '../shared/content/classes/elementalist/abilities.ts';
import { FURY_ACTIONS } from '../shared/content/classes/fury/abilities.ts';
import { NULL_ACTIONS } from '../shared/content/classes/null/abilities.ts';
import { SUMMONER_ACTIONS } from '../shared/content/classes/summoner/abilities.ts';
import { TACTICIAN_ACTIONS } from '../shared/content/classes/tactician/abilities.ts';
import { TALENT_ACTIONS } from '../shared/content/classes/talent/abilities.ts';
import { TROUBADOUR_ACTIONS } from '../shared/content/classes/troubadour/abilities.ts';
import { beastheartAbilitySource } from '../shared/evaluate/beastheartAbilities.ts';
import { censorAbilitySource } from '../shared/evaluate/censorAbilities.ts';
import { conduitAbilitySource } from '../shared/evaluate/conduitAbilities.ts';
import { elementalistAbilitySource } from '../shared/evaluate/elementalistAbilities.ts';
import { furyAbilitySource } from '../shared/evaluate/furyAbilities.ts';
import { nullAbilitySource } from '../shared/evaluate/nullAbilities.ts';
import { summonerAbilitySource } from '../shared/evaluate/summonerAbilities.ts';
import { tacticianAbilitySource } from '../shared/evaluate/tacticianAbilities.ts';
import { talentAbilitySource } from '../shared/evaluate/talentAbilities.ts';
import { troubadourAbilitySource } from '../shared/evaluate/troubadourAbilities.ts';

type Ref = { name: string; sourcePath: string; kind: 'class' };
type Source = (ref: Ref) => { text: string } | undefined;
const classes: [string, { name: string; sourcePath: string }[], Source][] = [
  ['Beastheart', BEASTHEART_ACTIONS, beastheartAbilitySource],
  ['Censor', CENSOR_ACTIONS, censorAbilitySource],
  ['Conduit', CONDUIT_ACTIONS, conduitAbilitySource],
  ['Elementalist', ELEMENTALIST_ACTIONS, elementalistAbilitySource],
  ['Fury', FURY_ACTIONS, furyAbilitySource],
  ['Null', NULL_ACTIONS, nullAbilitySource],
  ['Summoner', SUMMONER_ACTIONS, summonerAbilitySource],
  ['Tactician', TACTICIAN_ACTIONS, tacticianAbilitySource],
  ['Talent', TALENT_ACTIONS, talentAbilitySource],
  ['Troubadour', TROUBADOUR_ACTIONS, troubadourAbilitySource],
];

test('no follow-up ability text carries source frontmatter', () => {
  const leaks: string[] = [];
  for (const [label, actions, source] of classes)
    for (const action of actions) {
      const text = source({
        name: action.name,
        sourcePath: action.sourcePath,
        kind: 'class',
      })?.text;
      assert.ok(text, `${label}: ${action.name} has no source text`);
      if (/^---\r?$/m.test(text) || /^(action_type|scc|type|class):/m.test(text))
        leaks.push(`${label}: ${action.name}`);
    }
  assert.deepEqual(leaks, []);
});

test('Out of the Way!: Follow shows the printed body of its Compendium file', () => {
  // vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/out-of-the-way.md: the
  // frontmatter is the block between the first two `---` lines; the printed body follows it.
  const root = join(import.meta.dirname, '..');
  const file = readPinnedSource(
    root,
    'vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/out-of-the-way.md',
  );
  const lines = file.split('\n');
  const close = lines.indexOf('---', 1);
  const body = lines
    .slice(close + 1)
    .join('\n')
    .replace(/^\n+/, '');
  assert.ok(body.startsWith('*Your enemies will clear your path'));
  const action = FURY_ACTIONS.find(a => a.name === 'Out of the Way!: Follow')!;
  assert.equal(furyAbilitySource({ ...action, kind: 'class' })?.text, body);
});
