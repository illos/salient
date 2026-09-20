// SPDX-License-Identifier: GPL-3.0-only
/** V83 public-route witnesses. Expected grants come from the pinned perk/kit source files,
 * independently of the application's action catalogs. Also run against convex-test unchanged. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Actor, ScenarioContext } from './character-client.ts';
import type { DraftSelection } from '../../shared/characterDraft.ts';
import type { SelectionValue } from '../../shared/contracts/characterEvaluation.ts';
import type { HeroSheet, ActionGroup } from '../../shared/contracts/characterSheet.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';

type Choices = Record<string, SelectionValue>;
type Saved = {
  revision: number;
  authored: { name: string; appearance: string; biography: string; notes: string };
  selections: DraftSelection[];
  status: string;
  liveState: { stamina: number; recoveries: number } | null;
};
type TableSheet = {
  abilities: {
    name: string;
    kind: string;
    actionType: string | null;
    text: string | null;
    sourcePath: string;
    fixedCost: { resource: string; amount: number } | null;
  }[];
};
const commandId = () => crypto.randomUUID();
const slug = (s: string) =>
  s.toLowerCase().replaceAll("'", '').replaceAll('!', '').replaceAll('.', '').replaceAll(' ', '-');
const base = JSON.parse(
  readFileSync(new URL('../../tests/fixtures/v25-fury.json', import.meta.url), 'utf8'),
) as { selections: Choices };
const careerChoices: Record<string, Choices> = {
  Soldier: Object.fromEntries(
    Object.entries(base.selections).filter(([id]) => id.startsWith('career.')),
  ),
  "Mage's Apprentice": {
    'career.mages-apprentice.skills': ['History', 'Monsters'],
    'career.mages-apprentice.languages': ['Vaslorian'],
    'career.mages-apprentice.inciting-incident': 'Forgotten Memories',
  },
  Agent: {
    'career.agent.skills.1': 'Lead',
    'career.agent.skills.2': 'Alertness',
    'career.agent.languages': ['Vaslorian', null],
    'career.agent.inciting-incident': 'Disavowed',
  },
  Artisan: {
    'career.artisan.skills.1': ['Alchemy', 'Tailoring'],
    'career.artisan.languages': ['Vaslorian'],
    'career.artisan.inciting-incident': 'Continue the Work',
  },
  Politician: {
    'career.politician.skills.1': ['Lead', 'Music'],
    'career.politician.languages': ['Vaslorian'],
    'career.politician.inciting-incident': 'Diplomatic Immunity',
  },
  Aristocrat: {
    'career.aristocrat.skills.1': 'Lead',
    'career.aristocrat.skills.2': 'History',
    'career.aristocrat.languages': ['Vaslorian'],
    'career.aristocrat.inciting-incident': 'Blood Money',
  },
};
function choices(career: string, perk: string, kit = 'Mountain'): Choices {
  return {
    ...Object.fromEntries(
      Object.entries(base.selections).filter(([id]) => !id.startsWith('career.')),
    ),
    ...careerChoices[career],
    'career.choice': career,
    [`career.${slug(career)}.perk`]: perk,
    'kit.choice': kit,
    ...(perk === 'Area of Expertise'
      ? { 'career.artisan.perk.area-of-expertise.target': 'Blacksmithing' }
      : {}),
  };
}
// Names/action groups transcribed from Compendium perk text, not the implementation catalog.
const perks: { perk: string; career: string; actions: [string, ActionGroup][] }[] = [
  { perk: 'Arcane Trick', career: "Mage's Apprentice", actions: [['Arcane Trick', 'main']] },
  {
    perk: 'Creature Sense',
    career: "Mage's Apprentice",
    actions: [['Creature Sense', 'maneuver']],
  },
  {
    perk: 'Familiar',
    career: "Mage's Apprentice",
    actions: [
      ['Familiar: Restore', 'main'],
      ['Familiar: Restore During Respite', 'other'],
    ],
  },
  {
    perk: 'Invisible Force',
    career: "Mage's Apprentice",
    actions: [['Invisible Force', 'maneuver']],
  },
  {
    perk: 'Psychic Whisper',
    career: "Mage's Apprentice",
    actions: [['Psychic Whisper', 'maneuver']],
  },
  { perk: 'Friend Catapult', career: 'Soldier', actions: [['Friend Catapult', 'maneuver']] },
  { perk: "I've Got You!", career: 'Soldier', actions: [["I've Got You!", 'triggered']] },
  { perk: 'Gum Up the Works', career: 'Agent', actions: [['Gum Up the Works', 'triggered']] },
  {
    perk: 'Area of Expertise',
    career: 'Artisan',
    actions: [['Area of Expertise: Inspect Object', 'other']],
  },
  { perk: 'Criminal Contacts', career: 'Agent', actions: [['Criminal Contacts', 'other']] },
  {
    perk: 'Eidetic Memory',
    career: 'Aristocrat',
    actions: [['Eidetic Memory: Memorize Text', 'other']],
  },
  {
    perk: 'Engrossing Monologue',
    career: 'Politician',
    actions: [['Engrossing Monologue', 'other']],
  },
  { perk: 'Forgettable Face', career: 'Agent', actions: [['Forgettable Face', 'other']] },
  {
    perk: 'Improvisation Creation',
    career: 'Artisan',
    actions: [['Improvisation Creation', 'other']],
  },
  {
    perk: "I've Read About This Place",
    career: 'Aristocrat',
    actions: [["I've Read About This Place", 'other']],
  },
  { perk: 'Lie Detector', career: 'Politician', actions: [['Lie Detector', 'other']] },
  { perk: 'Open Book', career: 'Politician', actions: [['Open Book', 'other']] },
  { perk: 'Ritualist', career: "Mage's Apprentice", actions: [['Ritualist', 'other']] },
  { perk: 'Slipped Lead', career: 'Agent', actions: [['Slipped Lead: Escape Bonds', 'other']] },
  { perk: 'So Tell Me...', career: 'Politician', actions: [['So Tell Me...', 'other']] },
  { perk: 'Thingspeaker', career: "Mage's Apprentice", actions: [['Thingspeaker', 'other']] },
  { perk: 'Traveling Artisan', career: 'Artisan', actions: [['Traveling Artisan', 'other']] },
  { perk: 'Traveling Sage', career: 'Aristocrat', actions: [['Traveling Sage', 'other']] },
];
const kits: [string, string][] = [
  ['Arcane Archer', 'Exploding Arrow'],
  ['Battlemind', 'Unmooring'],
  ['Cloak and Dagger', 'Fade'],
  ['Dual Wielder', 'Double Strike'],
  ['Guisarmier', 'Forward Thrust, Backward Smash'],
  ['Martial Artist', 'Battle Grace'],
  ['Mountain', 'Pain for Pain'],
  ['Panther', 'Devastating Rush'],
  ['Pugilist', "Let's Dance"],
  ['Raider', "Raider's Awe"],
  ['Ranger', 'Hamstring Shot'],
  ['Rapid-Fire', 'Two Shot'],
  ['Retiarius', 'Net and Stab'],
  ['Shining Armor', 'Protective Attack'],
  ['Sniper', 'Patient Shot'],
  ['Spellsword', 'Leaping Lightning'],
  ['Stick and Robe', 'Where I Want You'],
  ['Swashbuckler', 'Fancy Footwork'],
  ['Sword and Board', 'Shield Bash'],
  ['Warrior Priest', 'Weakening Brand'],
  ['Whirlwind', 'Extension of My Arm'],
];
async function create(player: Actor, name: string) {
  return player.mutation<string>('characters:create', {
    commandId: commandId(),
    authored: { name, appearance: '', biography: '', notes: '' },
  });
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
  assert.equal(after.status, 'complete', 'Supporting choices produce a complete saved character');
  return after;
}

export async function runSupportingChoices({ actors: { player }, run, runId }: ScenarioContext) {
  // Catches source actions missing from persisted grants, lost grant provenance, stale replacement,
  // and kit signatures silently falling into Other after their metadata is projected.
  await run(
    'supporting choices: persisted perk grants and all ordinary kit signatures',
    async () => {
      const { definitions } = await player.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        {},
      );
      const characterId = await create(player, `Supporting choices ${runId}`);
      let previous: string[] = [];
      for (const witness of perks) {
        await save(player, characterId, choices(witness.career, witness.perk), definitions);
        const sheet = await player.query<HeroSheet>('characters:sheet', { characterId });
        assert.ok(
          sheet.features.some(f => f.name === witness.perk),
          `${witness.perk} retained feature`,
        );
        const names = witness.actions.map(([name]) => name);
        for (const name of previous.filter(name => !names.includes(name)))
          assert.ok(
            !sheet.abilities.some(a => a.name === name),
            `${name} removed after perk replacement`,
          );
        for (const [name, group] of witness.actions) {
          const matches = sheet.abilities.filter(a => a.name === name);
          assert.equal(matches.length, 1, `${name} granted exactly once`);
          const action = matches[0]!;
          assert.equal(action.group, group, `${name} action grouping`);
          assert.equal(
            action.grantedBy.decisionId,
            `career.${slug(witness.career)}.perk`,
            `${name} grant decision`,
          );
          assert.equal(
            action.content?.sourcePath,
            `vendor/steel-compendium/en/unified/md/perk/${slug(witness.perk)}.md`,
            `${name} source`,
          );
          assert.ok(action.content?.text, `${name} readable source`);
        }
        previous = names;
      }
      for (const [kit, signature] of kits) {
        const saved = await save(
          player,
          characterId,
          choices('Soldier', 'Teamwork', kit),
          definitions,
        );
        assert.ok(saved.selections.some(s => s.decisionId === 'kit.choice' && s.value === kit));
        const sheet = await player.query<HeroSheet>('characters:sheet', { characterId });
        const grants = sheet.abilities.filter(a => kits.some(([, name]) => name === a.name));
        assert.deepEqual(
          grants.map(a => a.name),
          [signature],
          `${kit} sole current kit signature`,
        );
        assert.equal(grants[0]!.group, 'main', `${kit} main action`);
        assert.equal(grants[0]!.metadata.tiers?.length, 3, `${kit} printed power roll tiers`);
        assert.ok(grants[0]!.metadata.distance, `${kit} printed distance`);
        assert.ok(grants[0]!.metadata.target, `${kit} printed target`);
        assert.ok(grants[0]!.content?.text.includes(signature), `${kit} readable signature source`);
        for (const name of previous) assert.ok(!sheet.abilities.some(a => a.name === name));
      }
    },
  );
}

export async function runSupportingTable({
  actors: { director, player, peer },
  run,
  runId,
}: ScenarioContext) {
  // Catches prose actions absent at the table, Recovery costs healing/using the wrong pool,
  // unaffordable use mutating state, and pending perk edits leaking into effective actions.
  await run(
    'supporting actions: manual use, Recovery debit, undo and reviewed replacement',
    async () => {
      const { definitions } = await player.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        {},
      );
      const characterId = await create(player, `Supporting table ${runId}`);
      await save(player, characterId, choices("Mage's Apprentice", 'Familiar'), definitions);
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: commandId(),
        name: `Supporting ${runId}`,
      });
      const campaign = await director.query<{ shareCode: string }>('campaigns:get', { campaignId });
      await player.mutation('campaigns:requestJoin', {
        commandId: commandId(),
        shareCode: campaign.shareCode,
      });
      const pending = await director.query<{ pendingRequests: { id: string; userId: string }[] }>(
        'campaigns:get',
        { campaignId },
      );
      const request = pending.pendingRequests[0]!;
      await director.mutation('campaigns:approveRequest', {
        commandId: commandId(),
        requestId: request.id,
      });
      await player.mutation('characters:submit', {
        commandId: commandId(),
        characterId,
        campaignId,
      });
      await director.mutation('characters:approve', { commandId: commandId(), characterId });
      const sessionId = await director.mutation<string>('sessions:start', {
        commandId: commandId(),
        campaignId,
        selectedPlayerIds: [request.userId],
      });
      const actor = { refKind: 'character', id: characterId };
      const tableArgs = {
        campaignId,
        actor: { kind: 'character', id: characterId, name: `Supporting table ${runId}` },
      };
      const invoke = (who: Actor, operation: string, args: Record<string, unknown> = {}) =>
        who.mutation<{ eventId: string }>('commands:invoke', {
          campaignId,
          commandId: commandId(),
          operation,
          ...(operation.startsWith('history.') ? {} : { actor }),
          arguments: args,
        });
      const get = () => player.query<Saved>('characters:get', { characterId });
      const table = () => player.query<TableSheet>('abilities:sheet', tableArgs);
      const familiar = (await table()).abilities.find(a => a.name === 'Familiar: Restore');
      assert.ok(familiar, 'Familiar restoration exposed at table');
      assert.equal(familiar.kind, 'recorded');
      assert.deepEqual(familiar.fixedCost, { resource: 'recovery', amount: 1 });
      await assert.rejects(peer.query('abilities:sheet', tableArgs));
      await assert.rejects(
        invoke(peer, 'ability.use', { ability: 'Familiar: Restore', targets: [actor] }),
      );
      await invoke(director, 'adjust.stamina', { value: 17 });
      await invoke(director, 'adjust.recoveries', { value: 1 });
      const before = (await get()).liveState!;
      // The owner is a manual reference, not a modeled familiar or invented source target.
      const used = await invoke(player, 'ability.use', {
        ability: 'Familiar: Restore',
        targets: [actor],
      });
      assert.deepEqual(
        (await get()).liveState,
        { ...before, recoveries: 0 },
        'Familiar spends a Recovery without healing',
      );
      const events = await player.query<{
        events: {
          id: string;
          kind: string;
          payload?: { data?: { manual?: boolean; ability?: { name?: string } } };
        }[];
      }>('events:list', { campaignId });
      const event = events.events.find(e => e.id === used.eventId);
      assert.equal(event?.kind, 'ability.recorded');
      assert.equal(event?.payload?.data?.manual, true);
      assert.equal(event?.payload?.data?.ability?.name, 'Familiar: Restore');
      const zero = await invoke(player, 'ability.use', {
        ability: 'Familiar: Restore',
        targets: [actor],
      });
      const blockedEvents = await player.query<{
        events: { id: string; kind: string; description: string }[];
      }>('events:list', { campaignId });
      const zeroEvent = blockedEvents.events.find(e => e.id === zero.eventId);
      assert.equal(zeroEvent?.kind, 'ability.blocked', 'Zero Recoveries blocks restoration');
      assert.match(zeroEvent!.description, /Recovery 0 < cost 1/);
      assert.deepEqual((await get()).liveState, { ...before, recoveries: 0 });
      await invoke(player, 'history.undo');
      assert.deepEqual((await get()).liveState, before, 'Undo restores the spent Recovery');
      await invoke(player, 'history.redo');
      assert.deepEqual(
        (await get()).liveState,
        { ...before, recoveries: 0 },
        'Redo restores exact debit',
      );
      await invoke(player, 'ability.use', {
        ability: 'Familiar: Restore During Respite',
        targets: [actor],
      });
      assert.deepEqual(
        (await get()).liveState,
        { ...before, recoveries: 0 },
        'Respite restoration has no Recovery cost',
      );
      for (const perk of ['Creature Sense', 'Arcane Trick']) {
        const previous = perk === 'Creature Sense' ? 'Familiar: Restore' : 'Creature Sense';
        const liveBefore = (await get()).liveState;
        await save(player, characterId, choices("Mage's Apprentice", perk), definitions);
        await player.mutation('characters:submit', {
          commandId: commandId(),
          characterId,
          campaignId,
        });
        assert.ok(
          (await table()).abilities.some(a => a.name === previous),
          'Pending perk edit keeps effective old action',
        );
        assert.ok(
          !(await table()).abilities.some(a => a.name === perk),
          'Pending perk edit does not leak new action',
        );
        await director.mutation('characters:approve', { commandId: commandId(), characterId });
        const projected = await table();
        assert.ok(
          !projected.abilities.some(a => a.name === previous),
          'Approved replacement removes old action',
        );
        const action = projected.abilities.find(a => a.name === perk);
        assert.equal(action?.kind, 'recorded');
        assert.ok(action?.text?.includes(perk), 'Table action retains readable source');
        await invoke(player, 'ability.use', {
          ability: perk,
          targets: perk === 'Creature Sense' ? [actor] : [],
        });
        assert.deepEqual(
          (await get()).liveState,
          liveBefore,
          'Manual perk use preserves resources',
        );
      }
      // Hero tokens have no supported live pool yet: expose the source action, but never
      // record success or silently waive its cost. This remains a documented dependency.
      await save(player, characterId, choices('Politician', 'Lie Detector'), definitions);
      await player.mutation('characters:submit', {
        commandId: commandId(),
        characterId,
        campaignId,
      });
      await director.mutation('characters:approve', { commandId: commandId(), characterId });
      assert.deepEqual((await table()).abilities.find(a => a.name === 'Lie Detector')?.fixedCost, {
        resource: 'herotoken',
        amount: 1,
      });
      const beforeBlocked = (await get()).liveState;
      const unavailable = await invoke(player, 'ability.use', {
        ability: 'Lie Detector',
        targets: [actor],
      });
      const unavailableEvents = await player.query<{
        events: { id: string; kind: string; description: string }[];
      }>('events:list', { campaignId });
      const unavailableEvent = unavailableEvents.events.find(e => e.id === unavailable.eventId);
      assert.equal(
        unavailableEvent?.kind,
        'ability.blocked',
        'Unrecorded HeroToken pool blocks use',
      );
      assert.match(unavailableEvent!.description, /Herotoken pool is not recorded/);
      assert.deepEqual(
        (await get()).liveState,
        beforeBlocked,
        'Unsupported HeroToken cost cannot mutate live state',
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
export async function runSupportingActions(context: ScenarioContext) {
  await runSupportingChoices(context);
  await runSupportingTable(context);
}
