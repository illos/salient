import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import type { AbilitySource, Entity, Scenario } from './contracts.ts';
import { plain } from './parser.ts';

export const SOURCE_REVISION = 'fb83a789da8f0327a389c277a0c790b1648d5810';
const defaultRoot = fileURLToPath(new URL('../vendor/steel-compendium/', import.meta.url));
const git = promisify(execFile);
async function verifyRevision(root: string): Promise<void> {
  const { stdout } = await git('git', ['-C', root, 'rev-parse', 'HEAD']);
  if (stdout.trim() !== SOURCE_REVISION) throw new Error('Compendium revision differs from this experiment pin; review the content update before loading.');
}
type RecordData = Record<string, any>;
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function ability(data: RecordData, id: string, path: string, text: string, sourceId: string): AbilitySource {
  const roll = data.effects?.find((entry: RecordData) => entry.roll);
  return {
    id, name: data.name, source: { path: `en/unified/md/${path}.md`, id: sourceId, revision: SOURCE_REVISION }, text,
    usage: plain(data.usage ?? data.action_type ?? ''), distance: plain(data.distance ?? ''), target: plain(data.target ?? ''),
    keywords: (data.keywords ?? []).map(plain),
    ...(data.cost ? { cost: plain(data.cost) } : {}),
    ...(roll ? { roll: roll.roll, tiers: [roll.tier1, roll.tier2, roll.tier3] as [string, string, string] } : {}),
  };
}
async function record(path: string, root: string): Promise<{ data: RecordData; text: string }> {
  if (path.split('/').includes('..') || path.startsWith('/')) throw new Error('Content path must be relative to corpus category root.');
  await verifyRevision(root);
  const [json, text] = await Promise.all([readFile(join(root, `en/unified/json/${path}.json`), 'utf8'), readFile(join(root, `en/unified/md/${path}.md`), 'utf8')]);
  return { data: JSON.parse(json), text };
}
/** Generic source adapter for held-out hero abilities, including full Markdown. */
export async function loadHeroAbility(path: string, id: string, corpusRoot = defaultRoot): Promise<AbilitySource> {
  const { data, text } = await record(path, corpusRoot);
  const scc = data.metadata.scc;
  const source = ability(data, id, path, text, Array.isArray(scc) ? scc[0] : scc);
  const kitCategory = /^feature\/ability\/([^/]+)\/[^/]+$/.exec(path)?.[1];
  if (kitCategory) {
    // Kit signatures already include kit bonuses. Confirm category membership
    // against the actual kit definition instead of an ability-name exception.
    const kit = await record(`kit/${kitCategory}`, corpusRoot);
    if (kit.data.signature_ability?.name !== source.name) throw new Error(`Ability is not the declared signature of kit ${kitCategory}`);
    source.kitBonusesIncluded = true;
  }
  return source;
}
/** Generic source adapter. Full boxed text is retained, including unprojected lists. */
export async function loadMonster(path: string, entityId: string, prefix: string, corpusRoot = defaultRoot): Promise<{ entity: Entity; abilities: AbilitySource[] }> {
  const { data, text } = await record(path, corpusRoot);
  const starts = [...text.matchAll(/^> [^\s*|>\-]+ \*\*[^*\n]+\*\*[ \t]*$/gm)];
  const abilities: AbilitySource[] = [];
  for (const feature of data.features.filter((entry: RecordData) => entry.feature_type === 'ability')) {
    const index = starts.findIndex(match => {
      const title = plain(match[0]).replace(/^[^\p{L}\p{N}]+/u, '');
      return title === feature.name || title.startsWith(`${feature.name} (`);
    });
    if (index < 0) throw new Error(`Cannot locate full ability text for ${feature.name} in ${path}`);
    const id = `${prefix}:${slug(feature.name)}`;
    const full = text.slice(starts[index].index, starts[index + 1]?.index ?? text.length).trim();
    abilities.push(ability(feature, id, path, full, data.metadata.scc));
  }
  const traits = data.features.filter((entry: RecordData) => entry.feature_type === 'trait').map((entry: RecordData) => `source-trait:${slug(entry.name)}`);
  const knownFields = new Set(['features', 'metadata', 'name', 'type', 'level', 'stamina', 'might', 'agility', 'reason', 'intuition', 'presence', 'size', 'stability', 'free_strike', 'ev', 'organization', 'role', 'keywords', 'speed', 'movement', 'with_captain']);
  for (const [key, value] of Object.entries(data)) {
    if (!knownFields.has(key) && value !== undefined && value !== null) traits.push(`unsupported-field:${key}:${JSON.stringify(value)}`);
  }
  return { abilities, entity: {
    id: entityId, name: data.name, definitionId: data.metadata.scc, kind: 'monster', side: 'foes', level: data.level,
    stamina: Number(data.stamina), maxStamina: Number(data.stamina), temporaryStamina: 0,
    characteristics: { M: data.might, A: data.agility, R: data.reason, I: data.intuition, P: data.presence },
    size: parseInt(data.size, 10), ...(parseInt(data.size, 10) === 1 ? { sizeCategory: data.size } : {}), stability: data.stability,
    abilities: abilities.map(entry => entry.id), resources: {}, conditions: [], traits, meleeDamageBonus: [0, 0, 0], freeStrikeDamage: data.free_strike,
  } };
}

/** Load only this experiment's selection; definitions remain in the pinned corpus. */
export async function loadScenario(options: { includeSquad?: boolean; corpusRoot?: string } = {}): Promise<Scenario> {
  const root = options.corpusRoot ?? defaultRoot;
  const abilities: Record<string, AbilitySource> = {};
  const selected = ['brutal-slam', 'out-of-the-way', 'thunder-roar', 'lines-of-force'];
  const sources = await Promise.all([
    ...selected.map(name => loadHeroAbility(`feature/ability/fury/level-1/${name}`, `fury:${name}`, root)),
    loadHeroAbility('feature/ability/mountain/pain-for-pain', 'mountain:pain-for-pain', root),
  ]);
  const warrior = await loadMonster('monster/goblin/statblock/goblin-warrior', 'warrior', 'warrior', root);
  for (const source of [...sources, ...warrior.abilities]) abilities[source.id] = source;
  const fury: Entity = {
    id: 'fury', name: 'Grug, Devil Berserker Fury', definitionId: 'fixture:level-1-devil-fury-mountain', kind: 'hero', side: 'heroes', level: 1,
    stamina: 30, maxStamina: 30, temporaryStamina: 0, characteristics: { M: 2, A: 2, R: 0, I: 1, P: 0 },
    size: 1, sizeCategory: '1M', stability: 2, abilities: [...selected.map(name => `fury:${name}`), 'mountain:pain-for-pain'],
    resources: { ferocity: 0, victories: 0, recoveries: 10, surges: 0 }, conditions: [],
    traits: ['fury:ferocity', 'fury:berserker-growing-ferocity', 'fury:primordial-strength', 'fury:mighty-leaps', 'devil:silver-tongue', 'devil:beast-legs', 'devil:impressive-horns', 'perk:teamwork'],
    meleeDamageBonus: [0, 0, 4], fury: { windedTriggered: false },
  };
  const scenario: Scenario = {
    name: 'Level-one Devil Fury and Goblins', sourceRevision: SOURCE_REVISION,
    state: { entities: { fury, warrior: warrior.entity }, squads: {}, round: 1, malice: 0, pending: [] }, abilities,
    notes: [
      'Prepared fixture, not a character wizard. See docs/hero-fixture.md for choices and source references.',
      'Initial state is encounter start with zero Victories, before first Fury turn. Turn-start 1d3 Ferocity and round-start Malice require recorded manual operations.',
      'Combat automation is limited to explicit selected abilities; full source text and unsupported mechanics remain visible.',
      'Manual features: Lines of Force, Pain for Pain, Out of the Way!, Thunder Roar, Mighty Leaps, Silver Tongue, Impressive Horns saves (5+), Teamwork. Beast Legs speed is 6; movement geometry is supplied by the table.',
      'Berserker Growing Ferocity: Knockback bonus at 2; first-push surge at 4; test/Knockback edge at 6; benefits persist until turn end. Unsupported branches must be resolved manually.',
      'Primordial Strength object strikes and collisions need manual handling. Crafty prevents movement opportunity attacks; captain bonuses are absent because this squad has no captain.',
      'Mountain kit: heavy armor/heavy weapon, 30 maximum Stamina, recovery value 10, 10 maximum Recoveries, stability 2, tiered melee weapon bonus +0/+0/+4.',
    ],
  };
  if (options.includeSquad) {
    const spine = await loadMonster('monster/goblin/statblock/goblin-spinecleaver', 'spine-1', 'spine', root);
    for (const source of spine.abilities) abilities[source.id] = source;
    const memberIds = Array.from({ length: 4 }, (_, index) => `spine-${index + 1}`);
    for (const id of memberIds) scenario.state.entities[id] = { ...structuredClone(spine.entity), id, name: `Goblin Spinecleaver ${id.slice(-1)}`, squadId: 'spine-squad' };
    scenario.state.squads['spine-squad'] = { id: 'spine-squad', memberIds, stamina: 20, maxStamina: 20, memberStamina: 5 };
    scenario.notes.push('Four Spinecleavers share one 20-Stamina pool (5 each). Per-member Stamina is definition/display data; damage must use the squad pool. No captain.');
  }
  return scenario;
}
