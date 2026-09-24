// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { DraftSelection } from '../../shared/characterDraft.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type { SelectionValue } from '../../shared/contracts/characterEvaluation.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import { vendorPath } from '../lib/vendor.ts';

type Saved = {
  revision: number;
  authored: { name: string; appearance: string; biography: string; notes: string };
  selections: DraftSelection[];
  status: string;
  liveState: unknown;
};
const values = (selected: DraftSelection[]) =>
  Object.fromEntries(selected.map(s => [s.decisionId, s.value]));
const title = (text: string) => text.replace(/\b\w/g, letter => letter.toUpperCase());

/** Read expected defaults independently from the pinned book, never the application catalog. */
function sourcePresets() {
  const book = readFileSync(
    vendorPath('vendor/steel-compendium/en/unified/md/chapter/background.md'),
    'utf8',
  );
  return ['Typical Ancestry Cultures Table', 'Archetypical Cultures Table'].flatMap(
    (heading, index) => {
      const section = book.split(`###### ${heading}\n`)[1]!.split(/\n#{1,6} /)[0]!;
      return section
        .split('\n')
        .filter(line => line.startsWith('| '))
        .slice(1)
        .map(line => {
          const cells = line
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .split('|')
            .slice(1, -1)
            .map(s => s.trim());
          const [name, ...fields] = cells;
          const language = index === 0 ? fields.shift() : undefined;
          return {
            name: title(name!),
            language,
            environment: fields[0]!,
            organization: fields[1]!,
            upbringing: fields[2]!,
          };
        });
    },
  );
}

export async function runCulturePresets({ actors: { player, peer }, run, runId }: ScenarioContext) {
  await run(
    'culture presets: all book defaults persist independently of ancestry and remain customizable',
    async () => {
      const { definitions } = await player.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        {},
      );
      const fixture = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8')) as {
        selections: Record<string, SelectionValue>;
      };
      const selections = Object.fromEntries(
        Object.entries(fixture.selections).filter(([id]) => !id.startsWith('ancestry.')),
      );
      Object.assign(selections, {
        'ancestry.choice': 'Human',
        'ancestry.human.purchased-traits': ['Determination', 'Resist the Unnatural'],
        'career.soldier.languages': [null, null],
      });
      const characterId = await player.mutation<string>('characters:create', {
        commandId: crypto.randomUUID(),
        authored: {
          name: `Culture proof ${runId}`,
          appearance: 'Blue cloak',
          biography: 'Raised abroad',
          notes: 'Private culture proof',
        },
        selections: draftSelectionsFrom(selections, definitions),
      });
      let saved = await player.query<Saved>('characters:get', { characterId });
      const authored = saved.authored;
      const live = saved.liveState;
      async function transition(id: string, value: SelectionValue) {
        const changed = await player.query<{ selections: DraftSelection[]; removed: string[] }>(
          'characterWizard:transition',
          {
            characterId,
            selections: saved.selections,
            decisionId: id,
            value,
          },
        );
        saved = { ...saved, selections: changed.selections };
        return changed;
      }
      async function persist() {
        // Presets supply aspects, never choose the player's skills. Complete those independently.
        for (const id of [
          'culture.environment.skill',
          'culture.organization.skill',
          'culture.upbringing.skill',
        ]) {
          if (values(saved.selections)[id] !== undefined) continue;
          const discovered = await player.query<{
            decisions: { id: string; supportedValues: string[] }[];
          }>('characterWizard:discover', { characterId, selections: saved.selections });
          const options = discovered.decisions.find(d => d.id === id)!.supportedValues;
          assert.ok(options.length, `Legal skill choices for ${id}`);
          const used = new Set(Object.values(values(saved.selections)).flat());
          const selected = options.find(option => !used.has(option));
          assert.ok(selected, `Distinct legal skill for ${id}`);
          await transition(id, selected);
        }
        await player.mutation('characters:save', {
          characterId,
          commandId: crypto.randomUUID(),
          expectedRevision: saved.revision,
          authored: saved.authored,
          selections: saved.selections,
        });
        saved = await player.query<Saved>('characters:get', { characterId });
        assert.equal(
          saved.status,
          'complete',
          `Complete culture ${String(values(saved.selections)['culture.name'])}`,
        );
        assert.deepEqual(saved.authored, authored);
        assert.deepEqual(saved.liveState, live);
      }
      const witnesses = sourcePresets();
      assert.equal(witnesses.length, 27);
      for (const witness of witnesses) {
        const previousLanguage = values(saved.selections)['culture.language'];
        await transition('culture.preset', witness.name);
        await persist();
        const actual = values(saved.selections);
        assert.equal(actual['culture.preset'], witness.name);
        assert.equal(actual['culture.name'], witness.name);
        assert.equal(actual['culture.environment'], witness.environment);
        assert.equal(actual['culture.organization'], witness.organization);
        assert.equal(actual['culture.upbringing'], witness.upbringing);
        assert.equal(actual['culture.language'], witness.language ?? previousLanguage);
        assert.equal(actual['ancestry.choice'], 'Human');
        assert.deepEqual(actual['ancestry.human.purchased-traits'], [
          'Determination',
          'Resist the Unnatural',
        ]);
      }
      await transition('culture.preset', 'Dwarf');
      await persist();
      assert.equal(values(saved.selections)['culture.language'], 'Zaliac');
      const dwarfSkills = values(saved.selections);
      await transition('culture.environment', 'Wilderness');
      assert.equal(values(saved.selections)['culture.preset'], 'Bespoke');
      assert.equal(
        values(saved.selections)['culture.organization.skill'],
        dwarfSkills['culture.organization.skill'],
      );
      await persist();
      assert.equal(
        values(saved.selections)['culture.name'],
        'Dwarf',
        'Customizing retains the authored name',
      );
      const beforeBespoke = values(saved.selections);
      await transition('culture.preset', 'Bespoke');
      assert.deepEqual(
        values(saved.selections),
        beforeBespoke,
        'Bespoke keeps the existing choices',
      );
      await assert.rejects(
        peer.query('characterWizard:transition', {
          characterId,
          selections: saved.selections,
          decisionId: 'culture.preset',
          value: 'Orc',
        }),
      );
    },
  );
}
