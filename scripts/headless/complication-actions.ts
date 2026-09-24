// SPDX-License-Identifier: GPL-3.0-only
/** V85 source and public-route witnesses; no browser or test-only operations. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Actor, ScenarioContext } from './character-client.ts';
import type { SelectionValue } from '../../shared/contracts/characterEvaluation.ts';
import type { HeroSheet } from '../../shared/contracts/characterSheet.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import { COMPLICATION_ABILITIES } from '../../shared/content/supporting-complication-abilities.ts';
import { vendorPath } from '../lib/vendor.ts';

type Choices = Record<string, SelectionValue>;
type Saved = {
  revision: number;
  status: string;
  evaluation?: { diagnostics?: unknown };
  authored: { name: string; appearance: string; biography: string; notes: string };
  liveState: {
    stamina: number;
    recoveries: number;
    victories: number;
    heroicResource: { name: string; current: number };
  } | null;
};
type AbilityView = {
  name: string;
  kind: string;
  actionType: string | null;
  text: string | null;
  fixedCost: { resource: string; amount: number } | null;
};
const commandId = () => crypto.randomUUID();
const base = JSON.parse(
  readFileSync(new URL('../../tests/fixtures/v25-fury.json', import.meta.url), 'utf8'),
) as { selections: Choices };
const extras: Record<string, Choices> = {
  'Animal Form': { 'complication.animal-form.animalForm': 'Mouse' },
  'Consuming Interest': { 'complication.consuming-interest.obsessionSkill': 'History' },
  'Secret Identity': { 'complication.secret-identity.skill': 'Sneak' },
  Hunted: { 'complication.hunted.skill': 'Sneak' },
  'Silent Sentinel': { 'complication.silent-sentinel.skill': 'History' },
  'Shared Spirit': {
    'complication.shared-spirit.selfSkills': ['Persuade', 'Endurance', 'Alertness'],
    'complication.shared-spirit.spiritSkills': ['Alchemy', 'History', 'Lead'],
  },
  'Dragon Dreams': {
    'complication.dragon-dreams.traits': ['Draconian Guard', 'Remember Your Oath'],
  },
};
function choices(complication: string, changes: Choices = {}): Choices {
  return {
    ...base.selections,
    'complication.choice': complication,
    ...extras[complication],
    ...changes,
  };
}
async function save(
  player: Actor,
  characterId: string,
  selected: Choices,
  definitions: DecisionDefinitions,
) {
  const before = await player.query<Saved>('characters:get', { characterId });
  await player.mutation('characters:save', {
    characterId,
    commandId: commandId(),
    expectedRevision: before.revision,
    authored: before.authored,
    selections: draftSelectionsFrom(selected, definitions),
  });
  const after = await player.query<Saved>('characters:get', { characterId });
  assert.equal(
    after.status,
    'complete',
    `${selected['complication.choice']} witness is complete: ${JSON.stringify(after.evaluation?.diagnostics)}`,
  );
  return after;
}
const plain = (value: string) =>
  value
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
// Prose timing is independently transcribed from the pinned source; catalog supplies coverage
// inventory only. Structured actions obtain their expected timing from the source table itself.
const proseTiming: Record<string, string> = {
  'Advanced Studies: Study Notebook': 'Respite activity',
  'Animal Form': 'Maneuver',
  'Bereaved: Ask the Spirit': 'Special',
  'Consuming Interest: Study Lore': 'Downtime project',
  'Crash Landed: Activate Power Pack': 'Maneuver',
  'Crash Landed: Deactivate Power Pack': 'Maneuver',
  'Cult Victim: Pass Through Matter': 'During movement',
  'Psychic Blast: Forced Eruption': 'Free triggered action',
  'Telekinetic Grasp: Ranged Free Strike': 'Ranged free strike',
  'Curse of Stone: Stone Appearance': 'Free maneuver',
  'Evanesceria: Absent from Reality': 'Start of combat round',
  'Famous Relative: Summon Relative': 'Maneuver',
  'Feytouched: Accept Fey Power': 'Start of combat encounter',
  'Forbidden Romance: Request Favor': 'Special',
  'Getting Too Old for This: Use Advanced Ability': 'On your turn',
  'Gnoll-Mauled: Retaliate': 'Triggered action',
  'Guilty Conscience: Stay Alive': 'Free triggered action',
  'Hawk Rider: Summon Hawk': '1 uninterrupted minute',
  'Hawk Rider: Dismiss Hawk': 'No action',
  'Hawk Rider: Restore Hawk': 'Respite activity',
  'Host Body: Transfer Host': 'Main action',
  'Hunted: Lay Low': 'Respite activity',
  'Loner: Choose Respite Skill': 'End of respite',
  'Master Chef: Prepare Meal': '1 uninterrupted hour',
  'Preacher: Convert Follower': 'Respite activity',
  'Prisoner of the Synlirii: Telepathy': 'Special',
  'Secret Identity: Resume True Identity': 'Special',
  'Secret Identity: Resume Secret Identity': 'Special',
  'Self-Taught: Forgo Heroic Resource': 'Start of your turn',
  'Shared Spirit: Determine Controller': 'Start of day',
  'Silent Sentinel: Telepathy': 'Special',
  'Stolen Face: Change Face': '5 uninterrupted minutes',
  'Waking Dreams: Receive Vision': 'During respite',
  'War Dog Collar: Reset Collar': '1 uninterrupted minute outside combat',
  'War of Assassins: Call in Favor': 'Special',
  'Draconian Guard': 'Triggered action',
  'Remember Your Oath': 'Maneuver',
};

export async function runComplicationChoices({ actors: { player }, run, runId }: ScenarioContext) {
  // Catches action grants omitted from saved/read sheets, replaced traits retaining actions, and
  // prose/embedded timing or effect text diverging from the pinned source.
  await run(
    'complication choices: source actions persist with original timing and replaced grants disappear',
    async () => {
      const { definitions } = await player.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        {},
      );
      const characterId = await player.mutation<string>('characters:create', {
        commandId: commandId(),
        authored: {
          name: `Complication choices ${runId}`,
          appearance: '',
          biography: '',
          notes: '',
        },
      });
      const complications = [...new Set(COMPLICATION_ABILITIES.map(action => action.complication))];
      const witnesses = complications.flatMap(complication =>
        complication === 'Dragon Dreams'
          ? [
              choices(complication),
              choices(complication, {
                'complication.dragon-dreams.traits': ['Dragon Breath'],
              }),
              choices(complication, { 'complication.dragon-dreams.traits': ['Draconian Pride'] }),
            ]
          : [choices(complication)],
      );
      let previous: string[] = [];
      for (const selected of witnesses) {
        await save(player, characterId, selected, definitions);
        const complication = String(selected['complication.choice']);
        const sheet = await player.query<HeroSheet>('characters:sheet', { characterId });
        assert.ok(
          sheet.features.some(feature => feature.name === complication),
          `${complication} granting feature retained`,
        );
        const expected = COMPLICATION_ABILITIES.filter(
          action =>
            action.complication === complication &&
            (!action.selectedTrait ||
              (selected[action.selectedTrait.decision] as string[] | undefined)?.includes(
                action.selectedTrait.value,
              )),
        );
        const names = expected.map(action => action.name);
        for (const name of previous.filter(name => !names.includes(name)))
          assert.ok(
            !sheet.abilities.some(action => action.name === name),
            `${name} removed with its granting complication`,
          );
        for (const { name, sourcePath } of expected) {
          const matches = sheet.abilities.filter(action => action.name === name);
          assert.equal(matches.length, 1, `${name} is granted once`);
          const ability = matches[0]!;
          const source = readFileSync(vendorPath(`vendor/steel-compendium/${sourcePath}`), 'utf8');
          assert.equal(
            ability.content?.sourcePath,
            `vendor/steel-compendium/${sourcePath}`,
            `${name} readable source path`,
          );
          assert.ok(ability.content?.text, `${name} has readable source`);
          const printed = source
            .replace(/^>\s?/gm, '')
            .match(/^\|.*\|\s*(\*\*[^|]+\*\*)\s*\|\s*$/m)?.[1];
          const expectedTiming = proseTiming[name] ?? (printed ? plain(printed) : undefined);
          assert.ok(expectedTiming, `${name} independently sourced action timing`);
          assert.equal(ability.metadata.actionType, expectedTiming, `${name} action timing`);
          for (const effect of ability.metadata.effects ?? [])
            assert.ok(
              plain(source).includes(plain(effect.text)),
              `${name} effect remains source text`,
            );
          if (proseTiming[name])
            assert.ok(
              ability.metadata.effects?.length,
              `${name} retains prose benefit and drawback`,
            );
        }
        previous = names;
      }
    },
  );
}

export async function runComplicationTable({
  actors: { player, director, peer },
  run,
  runId,
}: ScenarioContext) {
  // Adds persisted resource/payment/history and play-state availability proof beyond sheet grants.
  await run(
    'complication table: manual actions, Recovery undo, all-resource payment and Victory gates',
    async () => {
      const { definitions } = await player.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        {},
      );
      const characterId = await player.mutation<string>('characters:create', {
        commandId: commandId(),
        authored: { name: `Complication table ${runId}`, appearance: '', biography: '', notes: '' },
      });
      await save(player, characterId, choices('Guilty Conscience'), definitions);
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: commandId(),
        name: `Complications ${runId}`,
      });
      const { shareCode } = await director.query<{ shareCode: string }>('campaigns:get', {
        campaignId,
      });
      await player.mutation('campaigns:requestJoin', { commandId: commandId(), shareCode });
      const campaign = await director.query<{ pendingRequests: { id: string; userId: string }[] }>(
        'campaigns:get',
        { campaignId },
      );
      const request = campaign.pendingRequests[0]!;
      await director.mutation('campaigns:approveRequest', {
        commandId: commandId(),
        requestId: request.id,
      });
      const approve = async () => {
        await player.mutation('characters:submit', {
          commandId: commandId(),
          characterId,
          campaignId,
        });
        await director.mutation('characters:approve', { commandId: commandId(), characterId });
      };
      await approve();
      const sessionId = await director.mutation<string>('sessions:start', {
        commandId: commandId(),
        campaignId,
        selectedPlayerIds: [request.userId],
      });
      const actor = { refKind: 'character', id: characterId };
      const invoke = (who: Actor, operation: string, args: Record<string, unknown> = {}) =>
        who.mutation<{ eventId: string }>('commands:invoke', {
          campaignId,
          commandId: commandId(),
          operation,
          ...(!operation.startsWith('history.') ? { actor } : {}),
          arguments: args,
        });
      const get = () => player.query<Saved>('characters:get', { characterId });
      const table = () =>
        player.query<{ abilities: AbilityView[] }>('abilities:sheet', {
          campaignId,
          actor: { kind: 'character', id: characterId, name: `Complication table ${runId}` },
        });
      const event = async (id: string) =>
        (
          await player.query<{
            events: { id: string; kind: string; payload?: { data?: { manual?: boolean } } }[];
          }>('events:list', { campaignId })
        ).events.find(row => row.id === id);
      await assert.rejects(
        invoke(peer, 'ability.use', { ability: 'Guilty Conscience: Stay Alive', targets: [actor] }),
      );
      await invoke(director, 'adjust.recoveries', { value: 1 });
      await invoke(director, 'adjust.stamina', { value: -18 });
      const before = (await get()).liveState!;
      assert.deepEqual(
        (await table()).abilities.find(a => a.name === 'Guilty Conscience: Stay Alive')?.fixedCost,
        { resource: 'recovery', amount: 1 },
      );
      const used = await invoke(player, 'ability.use', {
        ability: 'Guilty Conscience: Stay Alive',
        targets: [actor],
      });
      assert.equal((await event(used.eventId))?.kind, 'ability.recorded');
      assert.equal((await event(used.eventId))?.payload?.data?.manual, true);
      assert.deepEqual(
        (await get()).liveState,
        { ...before, recoveries: 0 },
        'Guilty Conscience pays a Recovery without inventing automatic healing',
      );
      const zero = await invoke(player, 'ability.use', {
        ability: 'Guilty Conscience: Stay Alive',
        targets: [actor],
      });
      assert.equal((await event(zero.eventId))?.kind, 'ability.blocked');
      await invoke(player, 'history.undo');
      assert.deepEqual((await get()).liveState, before, 'Undo restores Guilty Conscience payment');
      await invoke(player, 'history.redo');
      assert.deepEqual((await get()).liveState, { ...before, recoveries: 0 });
      await save(player, characterId, choices('Psychic Eruption'), definitions);
      await approve();
      for (const operation of ['combat.start', 'combat.commit'])
        await director.mutation('commands:invoke', {
          campaignId,
          commandId: commandId(),
          operation,
          arguments: {},
        });
      await invoke(director, 'adjust.heroic-resource', { value: 7 });
      const psychic = (await get()).liveState!;
      assert.deepEqual((await table()).abilities.find(a => a.name === 'Psychic Blast')?.fixedCost, {
        resource: 'ferocity',
        amount: 7,
      });
      await invoke(player, 'ability.use', { ability: 'Psychic Blast', targets: [actor] });
      assert.deepEqual(
        (await get()).liveState,
        { ...psychic, heroicResource: { ...psychic.heroicResource, current: 0 } },
        'Psychic Blast pays all current Heroic Resource',
      );
      await invoke(player, 'history.undo');
      assert.deepEqual((await get()).liveState, psychic, 'Psychic Blast undo restores exact pool');
      await invoke(player, 'ability.use', {
        ability: 'Psychic Blast: Forced Eruption',
        targets: [actor],
      });
      assert.equal(
        (await get()).liveState?.heroicResource.current,
        0,
        'Forced Eruption also pays entire pool',
      );
      await director.mutation('commands:invoke', {
        campaignId,
        commandId: commandId(),
        operation: 'combat.void',
        arguments: { mode: 'keep' },
      });
      await save(player, characterId, choices('Dragon Dreams'), definitions);
      await approve();
      await invoke(director, 'adjust.victories', { value: 4 });
      assert.ok(
        !(await table()).abilities.some(
          a => a.name === 'Draconian Guard' || a.name === 'Remember Your Oath',
        ),
        'Dragon Dreams cannot supply actions at four Victories',
      );
      await assert.rejects(
        invoke(player, 'ability.use', { ability: 'Remember Your Oath', targets: [actor] }),
      );
      await invoke(director, 'adjust.victories', { value: 5 });
      assert.ok((await table()).abilities.some(a => a.name === 'Draconian Guard'));
      const manualBefore = (await get()).liveState;
      const oath = await invoke(player, 'ability.use', {
        ability: 'Remember Your Oath',
        targets: [actor],
      });
      assert.equal((await event(oath.eventId))?.payload?.data?.manual, true);
      assert.deepEqual(
        (await get()).liveState,
        manualBefore,
        'Manual oath does not rewrite live values',
      );
      await invoke(director, 'adjust.victories', { value: 4 });
      assert.ok(
        !(await table()).abilities.some(a => a.name === 'Remember Your Oath'),
        'Dropping below five revokes conditional action',
      );
      await save(
        player,
        characterId,
        choices('Dragon Dreams', {
          'complication.dragon-dreams.traits': ['Dragon Breath'],
        }),
        definitions,
      );
      await approve();
      await invoke(director, 'adjust.victories', { value: 5 });
      assert.equal(
        (await table()).abilities.find(a => a.name === 'Dragon Breath')?.kind,
        'rolled',
        'Dragon Dreams retains structured Dragon Breath execution',
      );
      const session = await director.query<{ revision: number }>('sessions:get', { sessionId });
      await director.mutation('sessions:transition', {
        sessionId,
        expectedRevision: session.revision,
        action: 'close',
        commandId: commandId(),
      });
    },
  );
}
export async function runComplicationActions(context: ScenarioContext) {
  await runComplicationChoices(context);
  await runComplicationTable(context);
}
