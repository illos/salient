import {
  startingItemAbilities,
  startingItemAbilitySource,
} from '../../shared/evaluate/startingItemAbilities';
import {
  complicationAbilities,
  complicationAbilitySource,
  complicationAbilityMetadata,
} from '../../shared/evaluate/complicationAbilities';
import { perkAbilities, perkAbilitySource } from '../../shared/evaluate/perkAbilities';
import {
  extractEmbeddedAbility,
  type EmbeddedAbilityMetadata,
} from '../../shared/resolve/embeddedAbility';
import { ancestryAbilities, ancestryAbilitySource } from '../../shared/evaluate/ancestryAbilities';
// SPDX-License-Identifier: GPL-3.0-only
/**
 * Adapter between the application's records and the pure R04 engine (shared/resolve/index.ts):
 * ability definitions from the S01 content snapshot (hero ability entries, stat-block features and
 * the common actions), actor roll facts, damage-target facts, and the journaled application of a
 * damage record to a foe or hero. Nothing here computes a game value; it reads source metadata
 * verbatim, hands facts to the engine and writes the engine's record back.
 *
 * Owning specifications: docs/roll-and-damage-resolution.md (sections 1.1, 1.8, 4.1, 4.2, 4.4,
 * 6.2, 9), docs/table-spec.md#roster-targeting-controls (target shapes), #v001-defend-and-aid-attack,
 * #v001-catch-breath, docs/pre-alpha-design-gaps.md#game-basics-first--current-runtime-scope
 * (generic operations consume known sourced inputs; unknown facts stay explicit),
 * docs/live-state-initialization.md sections 4 and 5 (AbilityProjection field meanings).
 */
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { ReadCtx } from './access';
import type { BoundActor } from '../../shared/commands/envelope';
import type {
  AbilityRollMetadata,
  ActionType,
  ActorRollFacts,
  Characteristic,
  DamageApplication,
  DamageModifierEntry,
  DamageTargetFacts,
  ResourceCost,
  SourceRef,
} from '../../shared/contracts/rollResolution';
import { manifest } from '../../shared/content/compendium/index';
import { parseTierText, plainText } from '../../shared/resolve/index';
import { findContent, requireContent } from '../content';
import { journalPatch, type JournalScope } from './journal';
import { baselineOf, requireHeroLive, type HeroLive } from './characterBuild';
import {
  compileLiveEntry,
  compileLiveKit,
  compileLiveFoeAbility,
  type LiveCompilation,
} from './compiledSource';

export const MELEE_FREE_STRIKE_ID =
  'mcdm.heroes.v1/feature.ability.common/melee-weapon-free-strike';
export const RANGED_FREE_STRIKE_ID =
  'mcdm.heroes.v1/feature.ability.common/ranged-weapon-free-strike';
export const CREATURE_FREE_STRIKE_ID = 'mcdm.heroes.v1/feature.common.main-actions/free-strike';
export const CATCH_BREATH_ID = 'mcdm.heroes.v1/feature.common.maneuvers/catch-breath';
export const DEFEND_ID = 'mcdm.heroes.v1/feature.common.main-actions/defend';
export const AID_ATTACK_ID = 'mcdm.heroes.v1/feature.common.maneuvers/aid-attack';
export const RECOVERIES_RULE_ID = 'mcdm.heroes.v1/rule.health/recoveries';
export const CREATURE_FREE_STRIKE_RULE_ID = 'mcdm.monsters.v1/rule.monster/creature-free-strike';

export type TargetShape =
  | { kind: 'self' }
  | { kind: 'single' }
  | { kind: 'multi'; max: number }
  | { kind: 'area' }
  | { kind: 'unknown'; text: string };

/** One ability as the operations see it: verbatim source plus the printed metadata. */
export interface AbilityDefinition {
  abilityId: string;
  name: string;
  /**
   * `rolled`: a power roll resolved by the engine. `creature-free-strike`: a stat block's Free Strike
   * value with no roll (R04 4.4). `catch-breath`: the Recovery maneuver (R04 7). `recorded`: a common
   * action recorded with its full text and no automated effect (Defend, Aid Attack).
   */
  kind: 'rolled' | 'creature-free-strike' | 'catch-breath' | 'recorded';
  contentId: string;
  source: SourceRef;
  /** Verbatim source text: the whole entry, or the stat-block ability's blockquote. */
  text: string;
  usage: string;
  actionType: ActionType | null;
  distance: string;
  target: string;
  keywords: string[];
  cost?: string;
  fixedCost?: ResourceCost;
  roll?: string;
  tiers?: [string, string, string];
  effects?: { label: string; text: string }[];
  targetShape: TargetShape;
  /** Present for `rolled`. */
  metadata?: AbilityRollMetadata;
  /** A printed cost the app cannot read as `N Resource`; the ability then resolves manually (R04 9). */
  unknownCost?: string;
  /** Present for `creature-free-strike`. */
  freeStrikeValue?: number;
  /** V72 selected-source execution gate; never contains the whole foe stat block. */
  compilation?: LiveCompilation;
}

const ACTION_TYPES: ActionType[] = [
  'main action',
  'maneuver',
  'move action',
  'triggered action',
  'free triggered action',
  'free maneuver',
];

function actionTypeOf(text: string): ActionType | null {
  const plain = plainText(text).toLowerCase();
  return ACTION_TYPES.find(type => type === plain) ?? null;
}

const NAMES: Record<string, Characteristic> = {
  might: 'M',
  agility: 'A',
  reason: 'R',
  intuition: 'I',
  presence: 'P',
};

/** "Power Roll + Might or Agility" → ['M', 'A']; "Power Roll + 2" → fixed bonus 2. */
function rollEntry(rollText: string | undefined): {
  permitted: Characteristic[];
  fixedRollBonus?: number;
} {
  if (!rollText) return { permitted: [] };
  const plain = plainText(rollText).replace(/^Power Roll\s*\+\s*/i, '');
  if (/^-?\d+$/.test(plain)) return { permitted: [], fixedRollBonus: Number(plain) };
  const permitted: Characteristic[] = [];
  for (const word of plain.split(/\s+or\s+/i)) {
    const c = NAMES[word.trim().toLowerCase()];
    if (!c) return { permitted: [] };
    if (!permitted.includes(c)) permitted.push(c);
  }
  return { permitted };
}

export function parseCost(cost: string | undefined): {
  fixedCost?: ResourceCost;
  unknownCost?: string;
} {
  if (!cost) return {};
  const match = /^(\d+)\s+([A-Za-z]+)$/.exec(plainText(cost));
  if (!match) return { unknownCost: cost };
  const amount = Number(match[1]);
  if (!Number.isSafeInteger(amount)) return { unknownCost: cost };
  return { fixedCost: { resource: match[2]!.toLowerCase(), amount } };
}

const COUNT_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

export function targetShapeOf(target: string, keywords: string[]): TargetShape {
  const plain = plainText(target).toLowerCase();
  if (plain === 'self') return { kind: 'self' };
  if (/^one (creature|enemy|ally)( or object)?$/.test(plain)) return { kind: 'single' };
  const upTo = /^(?:up to )?(\w+) (creatures|enemies|allies)( or objects)?$/.exec(plain);
  if (upTo) {
    const max = COUNT_WORDS[upTo[1]!] ?? Number(upTo[1]);
    if (Number.isInteger(max) && max > 0)
      return max === 1 ? { kind: 'single' } : { kind: 'multi', max };
  }
  const area = keywords.some(k => plainText(k).toLowerCase() === 'area');
  if (area || /in the area|in the line|in the burst|in the cube/.test(plain))
    return { kind: 'area' };
  return { kind: 'unknown', text: target };
}

function stringOf(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
function stringsOf(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

type Structured = Record<string, unknown>;

function effectsOf(list: unknown): {
  roll?: string;
  tiers?: [string, string, string];
  effects: { label: string; text: string }[];
} {
  const out: {
    roll?: string;
    tiers?: [string, string, string];
    effects: { label: string; text: string }[];
  } = { effects: [] };
  if (!Array.isArray(list)) return out;
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Structured;
    if (typeof record.roll === 'string' && out.roll === undefined) {
      out.roll = record.roll;
      out.tiers = [stringOf(record.tier1), stringOf(record.tier2), stringOf(record.tier3)];
    } else if (typeof record.effect === 'string')
      out.effects.push({ label: stringOf(record.name) || 'Effect', text: record.effect });
  }
  return out;
}

type ContentSource = Pick<
  Doc<'content'>,
  'contentId' | 'name' | 'sourcePath' | 'revision' | 'text' | 'structured' | 'features'
>;

function sourceOf(entry: ContentSource): SourceRef {
  return { path: entry.sourcePath, revision: entry.revision, id: entry.contentId };
}

function build(
  base: Omit<
    AbilityDefinition,
    'kind' | 'targetShape' | 'metadata' | 'unknownCost' | 'actionType'
  > & {
    kitBonusesIncluded: boolean;
  },
): AbilityDefinition {
  const actionType = actionTypeOf(base.usage);
  const { permitted, fixedRollBonus } = rollEntry(base.roll);
  const { fixedCost, unknownCost } = parseCost(base.cost);
  const rolled = base.tiers !== undefined && (permitted.length > 0 || fixedRollBonus !== undefined);
  const { kitBonusesIncluded, ...rest } = base;
  const definition: AbilityDefinition = {
    ...rest,
    actionType,
    kind: rolled ? 'rolled' : 'recorded',
    targetShape: targetShapeOf(base.target, base.keywords),
    ...(unknownCost ? { unknownCost } : {}),
    ...(fixedCost ? { fixedCost } : {}),
  };
  if (rolled && actionType)
    definition.metadata = {
      abilityId: base.abilityId,
      name: base.name,
      source: base.source,
      actionType,
      keywords: base.keywords.map(plainText),
      permittedCharacteristics: permitted,
      ...(fixedRollBonus !== undefined ? { fixedRollBonus } : {}),
      tiers: [
        parseTierText(base.tiers![0]),
        parseTierText(base.tiers![1]),
        parseTierText(base.tiers![2]),
      ],
      ...(fixedCost ? { fixedCost } : {}),
      kitBonusesIncluded,
    };
  else if (rolled) definition.kind = 'recorded';
  return definition;
}

/** A hero ability content entry (kind `ability`) as a definition. */
export function abilityFromEntry(
  entry: Doc<'content'>,
  options: { kitBonusesIncluded?: boolean } = {},
): AbilityDefinition {
  const s = entry.structured as Structured;
  const parsed = effectsOf(s.effects);
  return build({
    compilation: compileLiveEntry(entry, entry.kind),
    abilityId: entry.contentId,
    name: entry.name,
    contentId: entry.contentId,
    source: sourceOf(entry),
    text: entry.text,
    usage: stringOf(s.action_type),
    distance: stringOf(s.distance),
    target: stringOf(s.target),
    keywords: stringsOf(s.keywords),
    ...(typeof s.cost === 'string' ? { cost: s.cost } : {}),
    ...(parsed.roll ? { roll: parsed.roll, tiers: parsed.tiers } : {}),
    ...(parsed.effects.length ? { effects: parsed.effects } : {}),
    kitBonusesIncluded: options.kitBonusesIncluded ?? false,
  });
}

/** A kit's own named signature, extracted only from its printed section; unknown text stays manual. */
function abilityFromKit(entry: Doc<'content'>, name: string): AbilityDefinition {
  const section = extractEmbeddedAbility(entry.text, name);
  const metadata: Partial<EmbeddedAbilityMetadata> & { keywords: string[] } = section.ok
    ? section.metadata
    : { keywords: [] };
  return build({
    compilation: compileLiveKit(entry, name),
    abilityId: `${entry.contentId}/${slug(name)}`,
    name,
    contentId: entry.contentId,
    source: sourceOf(entry),
    text: section.ok ? section.text : entry.text,
    usage: metadata.actionType ?? '',
    keywords: metadata.keywords,
    distance: metadata.distance ?? '',
    target: metadata.target ?? '',
    ...(metadata.roll ? { roll: metadata.roll, tiers: metadata.tiers } : {}),
    ...(metadata.effects ? { effects: metadata.effects } : {}),
    kitBonusesIncluded: true,
  });
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** The blockquote block of one stat-block feature, byte-exact (R03 AbilityProjection.text). */
function statBlockFeatureText(text: string, name: string): string {
  const starts = [...text.matchAll(/^> [^\s*|>-]+ \*\*[^*\n]+\*\*[ \t]*$/gm)];
  const index = starts.findIndex(match => {
    const title = plainText(match[0]).replace(/^[^\p{L}\p{N}]+/u, '');
    return title === name || title.startsWith(`${name} (`);
  });
  if (index < 0) return '';
  const start = starts[index]!.index!;
  const end = starts[index + 1]?.index ?? text.length;
  return text.slice(start, end).trim();
}

/** Every ability printed in a stat block, in printed order. */
export function abilitiesFromStatBlock(entry: ContentSource): AbilityDefinition[] {
  const out: AbilityDefinition[] = [];
  for (const raw of entry.features ?? []) {
    const feature = raw as Structured;
    if (feature.feature_type !== 'ability' || typeof feature.name !== 'string') continue;
    const parsed = effectsOf(feature.effects);
    out.push(
      build({
        compilation: compileLiveFoeAbility(
          entry,
          feature,
          `${entry.contentId}/${slug(feature.name)}`,
          statBlockFeatureText(entry.text, feature.name),
        ),
        abilityId: `${entry.contentId}/${slug(feature.name)}`,
        name: feature.name,
        contentId: entry.contentId,
        source: sourceOf(entry),
        text: statBlockFeatureText(entry.text, feature.name),
        usage: stringOf(feature.usage),
        distance: stringOf(feature.distance),
        target: stringOf(feature.target),
        keywords: stringsOf(feature.keywords),
        ...(typeof feature.cost === 'string' ? { cost: feature.cost } : {}),
        ...(parsed.roll ? { roll: parsed.roll, tiers: parsed.tiers } : {}),
        ...(parsed.effects.length ? { effects: parsed.effects } : {}),
        kitBonusesIncluded: false,
      }),
    );
  }
  return out;
}

/** Printed stat-block cells: "**-**<br>Immunity" means none; anything else is an unparsed fact. */
function modifierCells(
  text: string,
  label: 'Immunity' | 'Weakness',
): { entries: DamageModifierEntry[]; unparsed?: string } {
  const match = new RegExp(`\\*\\*([^*]+)\\*\\*<br>${label}`).exec(text);
  if (!match) return { entries: [], unparsed: `${label} cell not found in the stat block` };
  const cell = plainText(match[1]!);
  if (cell === '-') return { entries: [] };
  return { entries: [], unparsed: `${label} ${cell}` };
}

export interface FoeSnapshot {
  id: string;
  name: string;
  text: string;
  structured?: Structured;
  features?: unknown[];
  sourcePath?: string;
  revision?: string;
}

export function foeSnapshot(foe: Doc<'foes'>): FoeSnapshot {
  return JSON.parse(foe.sourceSnapshot) as FoeSnapshot;
}

function numberOf(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) return Number(value);
  return undefined;
}

/** A foe's printed characteristics (R04 1.1: monster abilities use a fixed bonus, damage letters would use these). */
export function foeCharacteristics(snapshot: FoeSnapshot): Record<Characteristic, number> {
  const s = snapshot.structured ?? {};
  return {
    M: numberOf(s.might) ?? 0,
    A: numberOf(s.agility) ?? 0,
    R: numberOf(s.reason) ?? 0,
    I: numberOf(s.intuition) ?? 0,
    P: numberOf(s.presence) ?? 0,
  };
}

// ---------------------------------------------------------------------------------------------
// Ability lists per actor.

async function commonActions(ctx: ReadCtx, actor: BoundActor, foe?: Doc<'foes'>) {
  const out: AbilityDefinition[] = [];
  if (actor.kind === 'character') {
    for (const id of [MELEE_FREE_STRIKE_ID, RANGED_FREE_STRIKE_ID]) {
      const entry = await findContent(ctx, id);
      if (entry) out.push(abilityFromEntry(entry));
    }
  } else if (foe) {
    const rule = await findContent(ctx, CREATURE_FREE_STRIKE_ID);
    const snapshot = foeSnapshot(foe);
    const value = numberOf(snapshot.structured?.free_strike);
    if (rule && value !== undefined)
      out.push({
        abilityId: `${snapshot.id}/free-strike`,
        name: 'Free Strike',
        kind: 'creature-free-strike',
        contentId: rule.contentId,
        source: sourceOf(rule),
        text: rule.text,
        usage: 'Main action',
        actionType: 'main action',
        distance: '',
        target: 'One creature or object',
        keywords: [],
        targetShape: { kind: 'single' },
        freeStrikeValue: value,
      });
  }
  const catchBreath = await findContent(ctx, CATCH_BREATH_ID);
  if (catchBreath)
    out.push({
      abilityId: CATCH_BREATH_ID,
      name: catchBreath.name,
      kind: 'catch-breath',
      contentId: catchBreath.contentId,
      source: sourceOf(catchBreath),
      text: catchBreath.text,
      usage: 'Maneuver',
      actionType: 'maneuver',
      distance: '',
      target: 'Self',
      keywords: [],
      targetShape: { kind: 'self' },
    });
  const defend = await findContent(ctx, DEFEND_ID);
  if (defend)
    out.push({
      abilityId: DEFEND_ID,
      name: defend.name,
      kind: 'recorded',
      contentId: defend.contentId,
      source: sourceOf(defend),
      text: defend.text,
      usage: 'Main action',
      actionType: 'main action',
      distance: '',
      target: 'Self',
      keywords: [],
      targetShape: { kind: 'self' },
    });
  const aid = await findContent(ctx, AID_ATTACK_ID);
  if (aid)
    out.push({
      abilityId: AID_ATTACK_ID,
      name: aid.name,
      kind: 'recorded',
      contentId: aid.contentId,
      source: sourceOf(aid),
      text: aid.text,
      usage: 'Maneuver',
      actionType: 'maneuver',
      distance: '',
      target: 'One enemy',
      keywords: [],
      targetShape: { kind: 'single' },
    });
  return out;
}

/** Every ability the actor may select: granted abilities first, then the common actions. */
export async function abilitiesFor(
  ctx: ReadCtx,
  actor: BoundActor,
  records: {
    character?: Doc<'characters'>;
    foe?: Doc<'foes'>;
    facts?: Doc<'heroRollFacts'> | null;
  },
): Promise<AbilityDefinition[]> {
  const granted: AbilityDefinition[] = [];
  if (actor.kind === 'character') {
    const baseline = records.character ? baselineOf(records.character.derivedBaseline) : null;
    for (const grant of [
      ...startingItemAbilities(records.character?.startingRewards),
      ...complicationAbilities(
        baseline?.features ?? [],
        perkAbilities(
          baseline?.perks ?? [],
          ancestryAbilities(
            baseline?.traits ?? [],
            baseline?.abilities ?? [],
            records.character?.activeRune?.kind ?? null,
          ),
        ),
      ),
    ]) {
      const complicationSource = complicationAbilitySource(grant);
      if (
        complicationSource?.complication === 'Dragon Dreams' &&
        (records.character?.liveState?.victories ?? 0) < 5
      )
        continue;
      if (complicationSource?.sourcePath.includes('/feature/ability/')) {
        const contentId = manifest.entries.find(
          e => e.sourcePath === `vendor/steel-compendium/${grant.sourcePath}`,
        )?.id;
        const entry = contentId ? await findContent(ctx, contentId) : null;
        if (entry) {
          const definition = abilityFromEntry(entry, { kitBonusesIncluded: false });
          if (grant.provenance.note === 'Grounded: also granted independently; ranged 5.')
            definition.distance = 'Ranged 5';
          granted.push(definition);
          continue;
        }
      }
      if (complicationSource) {
        const metadata = complicationAbilityMetadata(complicationSource, grant);
        const id = `complication:${complicationSource.complication}/${slug(grant.name)}`;
        granted.push(
          build({
            abilityId: id,
            contentId: id,
            name: grant.name,
            source: { path: grant.sourcePath, revision: grant.provenance.source.revision, id },
            text: complicationSource.text,
            usage: metadata.actionType ?? '',
            keywords: metadata.keywords,
            distance: metadata.distance ?? '',
            target: metadata.target ?? '',
            ...(metadata.cost
              ? {
                  cost:
                    metadata.cost === 'All Heroic Resource'
                      ? `${Math.max(0, records.character?.liveState?.heroicResource.current ?? 0)} ${records.character?.liveState?.heroicResource.name ?? 'HeroicResource'}`
                      : metadata.cost,
                }
              : {}),
            ...(metadata.effects ? { effects: metadata.effects } : {}),
            kitBonusesIncluded: false,
          }),
        );
        continue;
      }
      const itemSource = startingItemAbilitySource(grant);
      if (itemSource) {
        const id = `item:${slug(itemSource.item)}/${slug(grant.name)}`;
        granted.push(
          build({
            abilityId: id,
            contentId: id,
            name: grant.name,
            source: { path: grant.sourcePath, revision: grant.provenance.source.revision, id },
            text: itemSource.quote,
            usage: itemSource.actionType,
            keywords: [],
            distance: '',
            target: '',
            ...(itemSource.cost ? { cost: itemSource.cost } : {}),
            effects: [{ label: 'Effect', text: itemSource.quote }],
            kitBonusesIncluded: false,
          }),
        );
        continue;
      }
      const contentId = manifest.entries.find(
        e => e.sourcePath === `vendor/steel-compendium/${grant.sourcePath}`,
      )?.id;
      if (!contentId) continue;
      const entry = await findContent(ctx, contentId);
      if (!entry) continue;
      const perkSource = perkAbilitySource(grant);
      if (perkSource?.embedded) {
        const parsed = extractEmbeddedAbility(entry.text, grant.name);
        const metadata: Partial<EmbeddedAbilityMetadata> & { keywords: string[] } = parsed.ok
          ? parsed.metadata
          : { keywords: [] };
        granted.push(
          build({
            abilityId: `${entry.contentId}/${slug(grant.name)}`,
            name: grant.name,
            contentId: entry.contentId,
            source: sourceOf(entry),
            text: parsed.ok ? parsed.text : entry.text,
            usage: metadata.actionType ?? '',
            keywords: metadata.keywords,
            distance: metadata.distance ?? '',
            target: metadata.target ?? '',
            ...(metadata.effects ? { effects: metadata.effects } : {}),
            kitBonusesIncluded: false,
          }),
        );
        continue;
      }
      const traitAbility = ancestryAbilitySource(grant) ?? perkSource;
      if (traitAbility) {
        granted.push(
          build({
            abilityId: `${entry.contentId}/${slug(grant.name)}`,
            name: grant.name,
            contentId: entry.contentId,
            source: sourceOf(entry),
            text: entry.text,
            usage: traitAbility.actionType,
            ...(perkSource?.cost ? { cost: perkSource.cost } : {}),
            keywords: [],
            distance: '',
            target: '',
            effects: [{ label: 'Effect', text: traitAbility.quote }],
            kitBonusesIncluded: false,
          }),
        );
        continue;
      }
      granted.push(
        grant.kind === 'kit-signature'
          ? abilityFromKit(entry, grant.name)
          : abilityFromEntry(entry, { kitBonusesIncluded: grant.kitBonusesIncluded }),
      );
    }
  } else if (records.foe) {
    const snapshot = foeSnapshot(records.foe);
    if (snapshot.sourcePath && snapshot.revision)
      granted.push(
        ...abilitiesFromStatBlock({
          contentId: snapshot.id,
          name: snapshot.name,
          text: snapshot.text,
          structured: snapshot.structured ?? {},
          features: snapshot.features,
          sourcePath: snapshot.sourcePath,
          revision: snapshot.revision,
        }),
      );
  }
  const common = await commonActions(ctx, actor, records.foe);
  return [...granted, ...common.filter(a => !granted.some(g => g.abilityId === a.abilityId))];
}

/** Finds an ability by content id, ability id, or exact (case-insensitive) printed name. */
export function findAbility(list: AbilityDefinition[], key: string): AbilityDefinition | undefined {
  const wanted = key.trim().toLowerCase();
  return (
    list.find(a => a.abilityId.toLowerCase() === wanted) ??
    list.find(a => a.contentId.toLowerCase() === wanted) ??
    list.find(a => a.name.toLowerCase() === wanted) ??
    list.find(a => slug(a.name) === slug(key))
  );
}

// ---------------------------------------------------------------------------------------------
// Actor and target facts.

export async function heroFacts(ctx: ReadCtx, characterId: Id<'characters'>) {
  return ctx.db
    .query('heroRollFacts')
    .withIndex('by_character', q => q.eq('characterId', characterId))
    .unique();
}

/** Section 1.1 / 4.2 inputs. A hero needs Director-supplied facts until an evaluated baseline exists. */
export function actorRollFacts(
  actor: BoundActor,
  records: {
    character?: Doc<'characters'>;
    facts?: Doc<'heroRollFacts'> | null;
    foe?: Doc<'foes'>;
  },
): ActorRollFacts {
  if (actor.kind === 'foe') {
    if (!records.foe) throw new ConvexError('Foe unavailable.');
    return { actorId: actor.id, characteristics: foeCharacteristics(foeSnapshot(records.foe)) };
  }
  const baseline = records.character ? baselineOf(records.character.derivedBaseline) : null;
  if (!baseline)
    throw new ConvexError(`${actor.name} has no evaluated effective build; admission supplies it.`);
  return {
    actorId: actor.id,
    characteristics: {
      M: baseline.characteristics.M.value,
      A: baseline.characteristics.A.value,
      R: baseline.characteristics.R.value,
      I: baseline.characteristics.I.value,
      P: baseline.characteristics.P.value,
    },
    ...(baseline.kit
      ? {
          kitMeleeDamageBonus: baseline.kit.meleeDamageBonus.value,
          kitRangedDamageBonus: baseline.kit.rangedDamageBonus.value,
        }
      : {}),
    ...(baseline.abilityModifiers?.length
      ? {
          abilityDamageModifiers: baseline.abilityModifiers.map(modifier => ({
            label: modifier.label ?? modifier.id,
            amount: modifier.amount,
            keywords: modifier.keywords,
            ...(modifier.alternative ? { alternative: modifier.alternative } : {}),
          })),
        }
      : {}),
  };
}

export interface TargetRecord {
  actor: BoundActor;
  character?: Doc<'characters'>;
  foe?: Doc<'foes'>;
}

/** Section 6 inputs, or the reason damage cannot be applied to this creature yet. */
export function damageTargetFacts(
  record: TargetRecord,
): { facts: DamageTargetFacts } | { missing: string } {
  if (record.foe) {
    const snapshot = foeSnapshot(record.foe);
    const immunity = modifierCells(snapshot.text ?? '', 'Immunity');
    const weakness = modifierCells(snapshot.text ?? '', 'Weakness');
    if (immunity.unparsed || weakness.unparsed)
      return {
        missing: `${record.foe.name}'s printed ${[immunity.unparsed, weakness.unparsed].filter(Boolean).join(' and ')} is not read by the app; damage is left for manual application.`,
      };
    return {
      facts: {
        targetId: record.foe._id,
        kind: 'foe',
        stamina: record.foe.live.stamina,
        maxStamina: record.foe.maxStamina,
        temporaryStamina: record.foe.live.temporaryStamina,
        immunities: immunity.entries,
        weaknesses: weakness.entries,
      },
    };
  }
  const live = record.character?.liveState;
  // A02: the maximum comes from the effective build's baseline; live values exist from admission.
  const baseline = record.character ? baselineOf(record.character.derivedBaseline) : null;
  if (!record.character || !live || !baseline)
    return {
      missing: `${record.actor.name} has no evaluated build or live record; admission to the campaign supplies them before damage can apply.`,
    };
  return {
    facts: {
      targetId: record.character._id,
      kind: 'hero',
      stamina: live.stamina,
      maxStamina: baseline.staminaMaximum.value,
      temporaryStamina: live.temporaryStamina,
      ...(baseline.damageImmunities?.length
        ? {
            immunities: baseline.damageImmunities.map(immunity => ({
              type: immunity.damageType,
              value: immunity.value.value,
            })),
          }
        : {}),
    },
  };
}

/** Writes one DamageApplication's resulting pools to the creature, journaled under the event. */
export async function writeDamage(
  ctx: MutationCtx,
  scope: JournalScope,
  target: TargetRecord,
  application: Pick<DamageApplication, 'staminaAfter' | 'temporaryStaminaAfter'>,
): Promise<void> {
  if (target.foe) {
    const current = (await ctx.db.get(target.foe._id))!;
    await journalPatch(ctx, scope, 'foes', current._id, {
      live: {
        ...current.live,
        stamina: application.staminaAfter,
        temporaryStamina: application.temporaryStaminaAfter,
      },
    });
    return;
  }
  const character = (await ctx.db.get(target.character!._id))!;
  const live: HeroLive = requireHeroLive(character);
  await journalPatch(ctx, scope, 'characters', character._id, {
    liveState: {
      ...live,
      stamina: application.staminaAfter,
      temporaryStamina: application.temporaryStaminaAfter,
    },
  });
}

/** Verbatim source record for the game log (the shape web/table/index.tsx EventSource reads). */
export function sourceRecord(entry: Doc<'content'>) {
  return {
    id: entry.contentId,
    name: entry.name,
    text: entry.text,
    sourcePath: entry.sourcePath,
    revision: entry.revision,
  };
}

export async function supportingSource(ctx: ReadCtx, id: string) {
  return sourceRecord(await requireContent(ctx, id));
}
