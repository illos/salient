// SPDX-License-Identifier: GPL-3.0-only
import { ConvexError, v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import { requireMember, type ReadCtx } from './access';
import { journalPatch } from './journal';
import type { OperationDefinition } from './registry';
const SOURCE = 'en/unified/md/feature/trait/dwarf/runic-carving.md';

export async function runeContext(ctx: ReadCtx, characterId: Id<'characters'>, user: Doc<'users'>) {
  const character = await ctx.db.get(characterId);
  if (!character) throw new ConvexError('Character unavailable.');
  const campaign = character.campaignId
    ? await requireMember(ctx, character.campaignId, user._id)
    : null;
  if (!campaign && character.ownerId !== user._id) throw new ConvexError('Character unavailable.');
  const buildId = campaign ? character.effectiveRevisionId : character.draftRevisionId;
  const build = buildId ? await ctx.db.get(buildId) : null;
  if (!build?.selections.some(s => s.decisionId === 'ancestry.choice' && s.value === 'Dwarf'))
    return null;
  const session = campaign?.activeSessionId ? await ctx.db.get(campaign.activeSessionId) : null;
  const role =
    campaign?.ownerId === user._id
      ? ('director' as const)
      : session?.selectedPlayerIds.includes(user._id)
        ? ('player' as const)
        : ('observer' as const);
  let reason: string | null = null;
  if (campaign) {
    if (session?.status !== 'running') reason = 'Runic Carving needs a running session.';
    else if (role === 'observer' || (role !== 'director' && character.ownerId !== user._id))
      reason = 'Only the active controller or Director can change this rune.';
  }
  const encounter = session?.encounterId ? await ctx.db.get(session.encounterId) : null;
  if (character.combatLocked || encounter?.status === 'committed')
    reason = 'Runic Carving needs 10 uninterrupted minutes outside combat.';
  return { character, build, campaign, session, role, reason };
}

export interface RuneChange {
  rune: 'Detection' | 'Light' | 'Voice' | null;
  expectedVersion: number;
  expectedBuildRevisionId: string;
  completedTenMinutes: boolean;
}
export function runePatch(
  state: NonNullable<Awaited<ReturnType<typeof runeContext>>>,
  user: Doc<'users'>,
  args: RuneChange,
) {
  if (state.reason) throw new ConvexError(state.reason);
  if (state.build._id !== args.expectedBuildRevisionId)
    throw new ConvexError('The character build changed. Reload before carving a rune.');
  const previous = state.character.activeRune;
  if ((previous?.version ?? 0) !== args.expectedVersion)
    throw new ConvexError('The active rune changed. Reload before carving a rune.');
  if (!args.completedTenMinutes)
    throw new ConvexError('Confirm 10 uninterrupted minutes of work have been completed.');
  if (!previous?.kind && args.rune === null)
    throw new ConvexError('There is no active rune to remove.');
  return {
    activeRune: {
      kind: args.rune,
      version: (previous?.version ?? 0) + 1,
      updatedAt: Date.now(),
      updatedById: user._id,
      sourcePath: SOURCE,
    },
  };
}
export const runeOperation: OperationDefinition = {
  id: 'rune.change',
  family: 'rune',
  verb: 'change',
  title: 'Change Runic Carving',
  description:
    'Record carving, changing or removing a Dwarf rune after 10 uninterrupted minutes outside combat.',
  args: {
    rune: v.union(
      v.literal('Detection'),
      v.literal('Light'),
      v.literal('Voice'),
      v.literal('None'),
    ),
    expectedVersion: v.number(),
    expectedBuildRevisionId: v.string(),
    completedTenMinutes: v.boolean(),
  },
  argDescriptions: {
    rune: 'The new rune, or None to remove it.',
    expectedVersion: 'Current rune version.',
    expectedBuildRevisionId: 'Current effective build revision ID.',
    completedTenMinutes: 'Confirm 10 uninterrupted minutes completed.',
  },
  roles: ['director', 'player'],
  session: 'running',
  actor: 'required',
  execute: async (ctx, { context, actor, args }) => {
    if (actor?.kind !== 'character')
      throw new ConvexError('Runic Carving requires a Dwarf character.');
    const characterId = ctx.db.normalizeId('characters', actor.id);
    const state = characterId ? await runeContext(ctx, characterId, context.user) : null;
    if (!state || state.campaign?._id !== context.campaign._id)
      throw new ConvexError('This character does not have Runic Carving at this table.');
    const change = {
      ...args,
      rune: args.rune === 'None' ? null : args.rune,
    } as unknown as RuneChange;
    const patch = runePatch(state, context.user, change);
    return {
      kind: 'rune.changed',
      description: `${state.character.authored.name} ${change.rune ? `carved the ${change.rune} rune` : 'removed their rune'} after 10 uninterrupted minutes.`,
      data: {
        characterId,
        before: state.character.activeRune?.kind ?? null,
        after: change.rune,
        version: patch.activeRune.version,
        sourcePath: SOURCE,
      },
      commit: async (mctx, scope) => {
        await journalPatch(mctx, scope, 'characters', state.character._id, patch);
      },
    };
  },
};
