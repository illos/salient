// SPDX-License-Identifier: GPL-3.0-only
/**
 * Owned characters: drafts, the shared evaluation read, the audience-projected sheet read, review
 * reads, and the admission mutations that delegate to the registered `character.*` operations
 * (convex/lib/characterOperations.ts). Owning specifications:
 * docs/character-wizard-spec.md#7-revision-and-review-lifecycle and
 * #9-shared-operations-and-reliability (drafts, submit/withdraw/approve/decline, one evaluator),
 * docs/character-sheet-spec.md#views-permissions-and-persistence (one payload per audience,
 * owner-private notes excluded server-side), docs/accounts-and-access-spec.md#characters,
 * docs/table-spec.md#party-sheets-and-resource-visibility (peers: Stamina and Recoveries).
 * Live values are never written here (docs/live-state-initialization.md section 3).
 */
import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { requireUser, type ReadCtx } from './lib/access';
import { command } from './lib/commands';
import { invoke } from './lib/registry';
import { findContent } from './content';
import { manifest } from '../shared/content/compendium/index';
import {
  authoredValidator,
  heroLiveValidator,
  reviewKindValidator,
  reviewStatusValidator,
  revisionStatusValidator,
  selectionValidator,
  unreconciledValidator,
} from './characterTables';
import { isJsonValue, type CharacterAuthored, type DraftSelection } from '../shared/characterDraft';
import {
  baselineOf,
  evaluateSelections,
  latestReview,
  pendingReview,
  requireEditable,
} from './lib/characterBuild';
import type {
  DerivedBaseline,
  EvaluationResult,
  GrantedAbility,
  GrantedFeature,
  Provenance,
} from '../shared/contracts/characterEvaluation';
import type {
  ActionGroup,
  CharacterSheet,
  CommonAction,
  HeroSheet,
  SheetAbility,
  SheetAbilityMetadata,
  SheetContent,
  SheetFeature,
} from '../shared/contracts/characterSheet';

async function owned(ctx: ReadCtx, id: Id<'characters'>, userId: Id<'users'>) {
  const character = await ctx.db.get(id);
  if (!character || character.ownerId !== userId) throw new ConvexError('Character unavailable.');
  return character;
}
function authored(input: CharacterAuthored): CharacterAuthored {
  const name = input.name.trim();
  if (!name || name.length > 100)
    throw new ConvexError('Enter a character name of 1–100 characters.');
  for (const value of [input.appearance, input.biography, input.notes]) {
    if (value.length > 10000)
      throw new ConvexError('Each description or notes field supports up to 10,000 characters.');
  }
  return { ...input, name };
}
const reviewValidator = v.object({
  id: v.id('characterReviews'),
  kind: reviewKindValidator,
  status: reviewStatusValidator,
  revision: v.number(),
  campaignId: v.id('campaigns'),
  campaignName: v.string(),
  submittedAt: v.number(),
});
async function reviewView(ctx: ReadCtx, review: Doc<'characterReviews'>) {
  return {
    id: review._id,
    kind: review.kind,
    status: review.status,
    revision: review.revision,
    campaignId: review.campaignId,
    campaignName: (await ctx.db.get(review.campaignId))?.name ?? 'Unavailable campaign',
    submittedAt: review.submittedAt,
  };
}
const summary = v.object({
  id: v.id('characters'),
  name: v.string(),
  revision: v.number(),
  status: revisionStatusValidator,
  campaignId: v.union(v.id('campaigns'), v.null()),
  campaignName: v.union(v.string(), v.null()),
  attached: v.boolean(),
  review: v.union(reviewValidator, v.null()),
});
const detail = v.object({
  id: v.id('characters'),
  authored: authoredValidator,
  revision: v.number(),
  selections: v.array(selectionValidator),
  status: revisionStatusValidator,
  /** The R02 EvaluationResult of the draft revision (shared/contracts/characterEvaluation.ts). */
  evaluation: v.union(v.any(), v.null()),
  combatLocked: v.boolean(),
  campaignId: v.union(v.id('campaigns'), v.null()),
  campaignName: v.union(v.string(), v.null()),
  effectiveRevisionId: v.union(v.id('characterRevisions'), v.null()),
  effectiveRevision: v.union(v.number(), v.null()),
  /** True when the draft revision is the effective one (nothing pending to submit). */
  draftIsEffective: v.boolean(),
  derivedBaseline: v.union(v.any(), v.null()),
  liveState: v.union(v.null(), heroLiveValidator),
  unreconciled: v.array(unreconciledValidator),
  review: v.union(reviewValidator, v.null()),
});

/**
 * The shared evaluation operation (docs/character-wizard-spec.md#9-shared-operations-and-reliability):
 * the wizard's live "hero so far", headless callers and `save` all use it. Pure: nothing is written.
 */
export const evaluate = query({
  args: { selections: v.array(selectionValidator) },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return evaluateSelections(args.selections);
  },
});
export const listMine = query({
  args: {},
  returns: v.array(summary),
  handler: async ctx => {
    const user = await requireUser(ctx);
    const characters = await ctx.db
      .query('characters')
      .withIndex('by_owner', q => q.eq('ownerId', user._id))
      .order('desc')
      .take(100);
    return Promise.all(
      characters.map(async character => {
        const draft = character.draftRevisionId
          ? await ctx.db.get(character.draftRevisionId)
          : null;
        const review = await latestReview(ctx, character._id);
        return {
          id: character._id,
          name: character.authored.name,
          revision: character.revision,
          status: draft?.status ?? ('awaiting-rules-evaluation' as const),
          campaignId: character.campaignId,
          campaignName: character.campaignId
            ? ((await ctx.db.get(character.campaignId))?.name ?? null)
            : null,
          attached: character.effectiveRevisionId !== null,
          review: review ? await reviewView(ctx, review) : null,
        };
      }),
    );
  },
});
export const get = query({
  args: { characterId: v.id('characters') },
  returns: detail,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await owned(ctx, args.characterId, user._id);
    const draft = character.draftRevisionId ? await ctx.db.get(character.draftRevisionId) : null;
    const effective = character.effectiveRevisionId
      ? await ctx.db.get(character.effectiveRevisionId)
      : null;
    const review = await latestReview(ctx, character._id);
    return {
      id: character._id,
      authored: character.authored,
      revision: character.revision,
      selections: draft?.selections ?? [],
      status: draft?.status ?? ('awaiting-rules-evaluation' as const),
      evaluation: draft?.evaluation ?? null,
      combatLocked: character.combatLocked,
      campaignId: character.campaignId,
      campaignName: character.campaignId
        ? ((await ctx.db.get(character.campaignId))?.name ?? null)
        : null,
      effectiveRevisionId: character.effectiveRevisionId,
      effectiveRevision: effective?.revision ?? null,
      draftIsEffective:
        character.effectiveRevisionId !== null &&
        character.effectiveRevisionId === character.draftRevisionId,
      derivedBaseline: character.derivedBaseline,
      liveState: character.liveState,
      unreconciled: character.unreconciled ?? [],
      review: review ? await reviewView(ctx, review) : null,
    };
  },
});
export const create = mutation({
  args: { commandId: v.string(), authored: authoredValidator },
  returns: v.id('characters'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const receipt = await command(ctx, user._id, args.commandId, 'characters.create', args);
    if (receipt.previous) return receipt.previous.result as Id<'characters'>;
    const fields = authored(args.authored);
    const existing = await ctx.db
      .query('characters')
      .withIndex('by_owner', q => q.eq('ownerId', user._id))
      .take(100);
    if (existing.length >= 100) throw new ConvexError('Prototype limit of 100 characters reached.');
    const id = await ctx.db.insert('characters', {
      ownerId: user._id,
      authored: fields,
      revision: 1,
      draftRevisionId: null,
      effectiveRevisionId: null,
      derivedBaseline: null,
      liveState: null,
      campaignId: null,
      combatLocked: false,
    });
    const evaluation = evaluateSelections([]);
    const revisionId = await ctx.db.insert('characterRevisions', {
      characterId: id,
      revision: 1,
      parentRevisionId: null,
      selections: [],
      status: evaluation.status,
      evaluation,
      derivedBaseline: evaluation.baseline,
    });
    await ctx.db.patch(id, { draftRevisionId: revisionId });
    await receipt.save(id);
    return id;
  },
});
export const save = mutation({
  args: {
    commandId: v.string(),
    characterId: v.id('characters'),
    expectedRevision: v.number(),
    authored: authoredValidator,
    selections: v.optional(v.array(selectionValidator)),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await owned(ctx, args.characterId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, 'characters.save', args);
    if (receipt.previous) return Number(receipt.previous.result);
    await requireEditable(ctx, character);
    if (args.expectedRevision !== character.revision)
      throw new ConvexError(
        'This character changed since you opened it. Reload the saved version before saving.',
      );
    const fields = authored(args.authored);
    const old = character.draftRevisionId ? await ctx.db.get(character.draftRevisionId) : null;
    const selections = args.selections ?? old?.selections ?? [];
    if (
      selections.length > 100 ||
      JSON.stringify(selections).length > 64000 ||
      selections.some(
        selection =>
          !selection.decisionId.trim() ||
          !selection.ownerBranchId.trim() ||
          selection.sources.length === 0 ||
          selection.sources.some(
            source => !source.id.trim() || !source.path.trim() || !source.revision.trim(),
          ) ||
          !isJsonValue(selection.value),
      )
    )
      throw new ConvexError(
        'Selections must contain bounded JSON values and complete decision, branch and source references.',
      );
    if (
      new Set(
        selections.map(selection =>
          JSON.stringify([selection.ownerBranchId, selection.decisionId]),
        ),
      ).size !== selections.length
    )
      throw new ConvexError('A decision can only be saved once within its owning branch.');
    const revision = character.revision + 1;
    // Draft saves evaluate the build and never touch live values (R03 section 3).
    const evaluation = evaluateSelections(selections);
    const revisionId = await ctx.db.insert('characterRevisions', {
      characterId: character._id,
      revision,
      parentRevisionId: character.draftRevisionId,
      selections,
      status: evaluation.status,
      evaluation,
      derivedBaseline: evaluation.baseline,
    });
    await ctx.db.patch(character._id, { authored: fields, revision, draftRevisionId: revisionId });
    // A pending submission no longer matches the owner's latest saved revision: approval of the
    // older submission must never activate unseen edits (wizard spec section 7, rule 4).
    const pending = await pendingReview(ctx, character._id);
    if (pending) await ctx.db.patch(pending._id, { status: 'stale' });
    await receipt.save(String(revision));
    return revision;
  },
});

// ---------------------------------------------------------------------------------------------
// Admission mutations: thin wrappers over the registered operations, so the character page, the
// palette, slash text and headless callers share one path and one receipt.

const operationResult = v.object({
  eventId: v.id('events'),
  sequence: v.number(),
  description: v.string(),
  interactionId: v.union(v.id('interactions'), v.null()),
});
function admissionMutation(operation: string, resolveCampaign: 'argument' | 'review') {
  return mutation({
    args: {
      commandId: v.string(),
      characterId: v.id('characters'),
      campaignId: v.optional(v.id('campaigns')),
    },
    returns: operationResult,
    handler: async (ctx, args) => {
      const user = await requireUser(ctx);
      let campaignId = args.campaignId;
      if (resolveCampaign === 'review' || !campaignId) {
        const character = await ctx.db.get(args.characterId);
        const review = character ? await latestReview(ctx, character._id) : null;
        campaignId = character?.campaignId ?? review?.campaignId ?? campaignId;
      }
      if (!campaignId) throw new ConvexError('Name the campaign to submit this character to.');
      return invoke(ctx, user, {
        schemaVersion: 1,
        commandId: args.commandId,
        campaignId,
        operation,
        actor: null,
        arguments: { character: { refKind: 'character', id: args.characterId } },
      });
    },
  });
}
export const submit = admissionMutation('character.submit', 'argument');
export const withdraw = admissionMutation('character.withdraw', 'review');
export const approve = admissionMutation('character.approve', 'review');
export const decline = admissionMutation('character.decline', 'review');

/** Submissions a member may see in a campaign: the Director sees every pending one, an owner theirs. */
export const reviews = query({
  args: { campaignId: v.id('campaigns') },
  returns: v.array(
    v.object({
      id: v.id('characterReviews'),
      characterId: v.id('characters'),
      characterName: v.string(),
      ownerId: v.id('users'),
      ownerName: v.string(),
      kind: reviewKindValidator,
      status: reviewStatusValidator,
      revision: v.number(),
      submittedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_campaign_user', q =>
        q.eq('campaignId', args.campaignId).eq('userId', user._id),
      )
      .unique();
    if (!campaign || !membership) throw new ConvexError('Campaign unavailable.');
    const director = campaign.ownerId === user._id;
    const rows = (
      await ctx.db
        .query('characterReviews')
        .withIndex('by_campaign_status', q => q.eq('campaignId', args.campaignId))
        .take(200)
    ).filter(review => (director ? review.status === 'pending' : review.ownerId === user._id));
    return Promise.all(
      rows.map(async review => ({
        id: review._id,
        characterId: review.characterId,
        characterName: (await ctx.db.get(review.characterId))?.authored.name ?? 'Unavailable',
        ownerId: review.ownerId,
        ownerName: (await ctx.db.get(review.ownerId))?.displayName ?? 'Former player',
        kind: review.kind,
        status: review.status,
        revision: review.revision,
        submittedAt: review.submittedAt,
      })),
    );
  },
});

// ---------------------------------------------------------------------------------------------
// The sheet read.

/** Source path (relative to the Compendium) to content id, from the S01 manifest. */
const CONTENT_ID_BY_PATH = new Map(
  manifest.entries.map(entry => [
    entry.sourcePath.replace(/^vendor\/steel-compendium\//, ''),
    entry.id,
  ]),
);
const CLEAN_HEROES_PATH = 'en/books/heroes/clean/Draw Steel Heroes.md';

function plainText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
}
function groupOf(actionType: string | undefined): ActionGroup {
  if (!actionType) return 'other';
  if (/main action/i.test(actionType)) return 'main';
  if (/maneuver/i.test(actionType)) return 'maneuver';
  if (/move action/i.test(actionType)) return 'move';
  if (/triggered/i.test(actionType)) return 'triggered';
  return 'other';
}
function contentView(row: Doc<'content'>): SheetContent {
  return {
    id: row.contentId,
    name: row.name,
    text: row.text,
    sourcePath: row.sourcePath,
    revision: row.revision,
  };
}
/** Printed frontmatter facts only; a field the source does not print is absent. */
function metadataOf(row: Doc<'content'> | null): SheetAbilityMetadata {
  const s = (row?.structured ?? {}) as Record<string, unknown>;
  const effects = Array.isArray(s.effects) ? (s.effects as Record<string, unknown>[]) : [];
  const roll = effects.find(e => typeof e.roll === 'string')?.roll;
  const tiers =
    typeof s.tier1 === 'string' && typeof s.tier2 === 'string' && typeof s.tier3 === 'string'
      ? ([s.tier1, s.tier2, s.tier3] as [string, string, string])
      : undefined;
  const clauses = effects
    .filter(e => typeof e.effect === 'string')
    .map(e => ({
      label: String(e.cost ?? e.name ?? 'Effect'),
      text: e.effect as string,
    }));
  const actionType = plainText(s.action_type);
  return {
    ...(actionType ? { actionType } : {}),
    keywords: Array.isArray(s.keywords) ? s.keywords.map(k => plainText(k) ?? String(k)) : [],
    ...(typeof s.distance === 'string' ? { distance: s.distance } : {}),
    ...(typeof s.target === 'string' ? { target: s.target } : {}),
    ...(typeof s.cost === 'string' ? { cost: s.cost } : {}),
    ...(typeof roll === 'string' ? { roll } : {}),
    ...(tiers ? { tiers } : {}),
    ...(typeof s.trigger === 'string' ? { trigger: s.trigger } : {}),
    ...(clauses.length ? { effects: clauses } : {}),
  };
}
function grantedBy(provenance: Provenance) {
  return {
    decisionId: provenance.decisionId,
    ...(provenance.selection ? { selection: provenance.selection } : {}),
    quote: provenance.source.quote,
    path: provenance.source.path,
  };
}
async function contentFor(ctx: ReadCtx, sourcePath: string) {
  const id = CONTENT_ID_BY_PATH.get(sourcePath);
  return id ? await findContent(ctx, id) : null;
}
async function abilityView(ctx: ReadCtx, ability: GrantedAbility): Promise<SheetAbility> {
  const row = await contentFor(ctx, ability.sourcePath);
  // A kit's signature ability is carried by the kit entry, whose frontmatter prints no ability
  // metadata: it groups as "other" and the table reads its action type from the text.
  const metadata = row && row.kind === 'ability' ? metadataOf(row) : { keywords: [] };
  const { provenance, ...rest } = ability;
  return {
    ...rest,
    content: row ? contentView(row) : null,
    group: groupOf(metadata.actionType),
    metadata,
    grantedBy: grantedBy(provenance),
  };
}
async function featureView(ctx: ReadCtx, feature: GrantedFeature): Promise<SheetFeature> {
  const row =
    feature.sourcePath === CLEAN_HEROES_PATH ? null : await contentFor(ctx, feature.sourcePath);
  const { provenance, ...rest } = feature;
  return { ...rest, content: row ? contentView(row) : null, grantedBy: grantedBy(provenance) };
}
async function commonActions(ctx: ReadCtx): Promise<CommonAction[]> {
  const rows = await ctx.db
    .query('content')
    .withIndex('by_kind', q => q.eq('kind', 'feature'))
    .take(500);
  return rows
    .filter(row => row.contentId.startsWith('mcdm.heroes.v1/feature.common.'))
    .map(row => {
      const category = row.contentId.split('/')[1]?.split('.').at(-1) ?? '';
      const group: ActionGroup =
        category === 'main-actions'
          ? 'main'
          : category === 'maneuvers'
            ? 'maneuver'
            : category === 'move-actions'
              ? 'move'
              : 'other';
      return { id: row.contentId, name: row.name, group, content: contentView(row) };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}
function selectionText(selections: DraftSelection[], decisionId: string): string | null {
  const value = selections.find(s => s.decisionId === decisionId)?.value;
  return typeof value === 'string' && value.trim() ? value : null;
}
/** R03 section 2.3: labels derived at read time from live values and the baseline maxima. */
function labelsOf(
  live: NonNullable<Doc<'characters'>['liveState']>,
  baseline: DerivedBaseline | null,
) {
  const windedValue =
    baseline?.windedValue.value ?? Math.floor((baseline?.staminaMaximum.value ?? 0) / 2);
  return {
    windedValue,
    winded: live.stamina <= windedValue,
    dying: live.stamina <= 0,
    deadThresholdReached: live.stamina <= -windedValue,
  };
}

export const sheet = query({
  args: {
    characterId: v.id('characters'),
    /** Owner: `draft` previews the saved draft. Director: `proposed` shows a pending submission. */
    view: v.optional(v.union(v.literal('effective'), v.literal('draft'), v.literal('proposed'))),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<CharacterSheet> => {
    const user = await requireUser(ctx);
    const character = await ctx.db.get(args.characterId);
    if (!character) throw new ConvexError('Character unavailable.');
    const owner = character.ownerId === user._id;
    const pending = await pendingReview(ctx, character._id);
    const campaignId = character.campaignId ?? pending?.campaignId ?? null;
    const campaign = campaignId ? await ctx.db.get(campaignId) : null;
    const membership =
      campaign &&
      (await ctx.db
        .query('memberships')
        .withIndex('by_campaign_user', q => q.eq('campaignId', campaign._id).eq('userId', user._id))
        .unique());
    const director = !!campaign && campaign.ownerId === user._id;
    if (!owner && !director && !(campaign && membership && character.campaignId))
      throw new ConvexError('Character unavailable.');
    const ownerName = (await ctx.db.get(character.ownerId))?.displayName ?? 'Former player';
    const baseline = baselineOf(character.derivedBaseline);
    if (!owner && !director) {
      // Peer: Stamina and Recoveries only (docs/table-spec.md#party-sheets-and-resource-visibility).
      return {
        audience: 'peer',
        id: character._id,
        name: character.authored.name,
        ownerName,
        live: character.liveState
          ? { stamina: character.liveState.stamina, recoveries: character.liveState.recoveries }
          : null,
        maxima: baseline
          ? {
              staminaMaximum: baseline.staminaMaximum.value,
              recoveriesMaximum: baseline.recoveriesMaximum.value,
            }
          : null,
      };
    }
    // Which build to show: the effective one by default; the owner's draft or the Director's
    // proposed submission on request, both labeled and never able to act at the table.
    let revision: Doc<'characterRevisions'> | null = null;
    let label: 'effective' | 'draft' | 'proposed' = 'effective';
    const effective = character.effectiveRevisionId
      ? await ctx.db.get(character.effectiveRevisionId)
      : null;
    if (args.view === 'draft' && owner) {
      revision = character.draftRevisionId ? await ctx.db.get(character.draftRevisionId) : null;
      label = 'draft';
    } else if (args.view === 'proposed' && pending) {
      revision = await ctx.db.get(pending.revisionId);
      label = 'proposed';
    } else if (effective) {
      revision = effective;
    } else if (owner || pending) {
      // No effective build yet: the owner sees their draft; the Director sees the submission.
      revision = pending
        ? await ctx.db.get(pending.revisionId)
        : character.draftRevisionId
          ? await ctx.db.get(character.draftRevisionId)
          : null;
      label = pending ? 'proposed' : 'draft';
    }
    const evaluation = (revision?.evaluation ?? null) as EvaluationResult | null;
    const shown = label === 'effective' ? baseline : (evaluation?.baseline ?? null);
    const partial = evaluation?.partial ?? null;
    const granted = shown ?? partial;
    const session = campaign?.activeSessionId ? await ctx.db.get(campaign.activeSessionId) : null;
    const role = !campaign
      ? null
      : director
        ? ('director' as const)
        : session?.selectedPlayerIds.includes(user._id)
          ? ('player' as const)
          : ('observer' as const);
    const selections = revision?.selections ?? [];
    const live = character.liveState;
    const payload: HeroSheet = {
      audience: owner ? 'owner' : 'director',
      id: character._id,
      name: character.authored.name,
      ownerId: character.ownerId,
      ownerName,
      campaign: campaign && character.campaignId ? { id: campaign._id, name: campaign.name } : null,
      viewer: {
        role,
        controls: director || (role === 'player' && owner),
        sessionRunning: session?.status === 'running',
      },
      combatLocked: character.combatLocked,
      build: revision
        ? {
            label,
            revision: revision.revision,
            status: revision.status,
            baseline: shown,
            partial,
            diagnostics: evaluation?.diagnostics ?? {},
          }
        : null,
      abilities: await Promise.all((granted?.abilities ?? []).map(a => abilityView(ctx, a))),
      features: await Promise.all(
        [...(granted?.traits ?? []), ...(granted?.features ?? []), ...(granted?.perks ?? [])].map(
          f => featureView(ctx, f),
        ),
      ),
      commonActions: await commonActions(ctx),
      live: live ? { ...live, labels: labelsOf(live, baseline) } : null,
      unreconciled: (character.unreconciled ?? []).map(
        ({ field, before, after, currentValue, question }) => ({
          field,
          before,
          after,
          currentValue,
          question,
        }),
      ),
      details: {
        cultureName: selectionText(selections, 'culture.name'),
        cultureLanguage: selectionText(selections, 'culture.language'),
        environment: selectionText(selections, 'culture.environment'),
        organization: selectionText(selections, 'culture.organization'),
        upbringing: selectionText(selections, 'culture.upbringing'),
        incitingIncident: selectionText(selections, 'career.soldier.inciting-incident'),
        whatWasTaken: selectionText(selections, 'career.what-was-taken'),
        connections: selectionText(selections, 'connections.notes'),
      },
      // Owner-private notes never leave the owner audience (accounts spec section 7).
      authored: owner
        ? {
            appearance: character.authored.appearance,
            biography: character.authored.biography,
            notes: character.authored.notes,
          }
        : { appearance: character.authored.appearance, biography: character.authored.biography },
      review: pending ? await reviewView(ctx, pending) : null,
    };
    return payload;
  },
});
