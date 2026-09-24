// SPDX-License-Identifier: GPL-3.0-only
/**
 * V95 account deletion (docs/accounts-and-access-spec.md#campaign-and-account-deletion). The
 * campaigns the account owns go with everything campaign-owned: memberships, requests, sessions
 * and their history, encounters and their initiative, turns, clock, snapshots, journal, events,
 * rolls, dice state, foes, squads, cards, presence, chat and drafts. Other players' characters
 * attached to those campaigns are detached with their campaign values cleared and their build,
 * revisions and authored details intact. The account's own characters are deleted wherever they
 * are, including at another table. Memberships and requests elsewhere, command receipts and the
 * portrait go; the profile row goes last. Past actions and chat in retained campaigns keep the
 * name snapshots those records already carry (events.actorName, chatMessages.authorName).
 *
 * Runs from the Better Auth user-delete trigger (convex/auth.ts) inside that transaction. Every
 * step is idempotent, so a very large account spends its document budget and finishes in
 * scheduled steps (convex/account.ts continuePurge) that re-run the same passes.
 *
 * Interpretations: detachment clears `liveState`, which holds XP and Victories together with the
 * current Stamina and resources; the spec's proposal to preserve a copy of the current recorded
 * state first is not implemented because nothing reads such a copy yet. A deleted character in
 * another campaign's committed encounter leaves participant references that resolve to nothing;
 * closeout and actor lookups already tolerate a missing hero, and the spec leaves the affected
 * combat participation contract open.
 */
import { internal } from '../_generated/api';
import type { Doc, Id, TableNames } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';

/** Documents removed per mutation before the purge continues in a scheduled step. */
export const PURGE_BUDGET = 2000;
/**
 * Stored Forge payload bytes read per mutation (V09). An import row holds up to 512 KB, so a
 * document count alone would let 100 of them read about 50 MB in one transaction; imports are
 * instead deleted one row at a time until this many payload bytes have been read.
 */
export const PURGE_IMPORT_BYTES = 2 * 1024 * 1024;
const PAGE = 200;

class Budget {
  used = 0;
  bytes = 0;
  constructor(readonly limit: number) {}
  get exhausted() {
    return this.used >= this.limit || this.bytes >= PURGE_IMPORT_BYTES;
  }
  spend(bytes = 0) {
    this.used += 1;
    this.bytes += bytes;
  }
}

type Row = { _id: Id<TableNames> };
type Page = () => Promise<Row[]>;

/** Deletes everything `page` returns until it is empty; false when the budget ran out first. */
async function drain(ctx: MutationCtx, budget: Budget, page: Page): Promise<boolean> {
  for (;;) {
    if (budget.exhausted) return false;
    const rows = await page();
    for (const row of rows) {
      if (budget.exhausted) return false;
      await ctx.db.delete(row._id);
      budget.spend();
    }
    if (rows.length < PAGE) return true;
  }
}

async function drainAll(ctx: MutationCtx, budget: Budget, pages: Page[]): Promise<boolean> {
  for (const page of pages) if (!(await drain(ctx, budget, page))) return false;
  return true;
}

/** Deletes one row once the budget allows it. */
async function remove(ctx: MutationCtx, budget: Budget, id: Id<TableNames>): Promise<boolean> {
  if (budget.exhausted) return false;
  await ctx.db.delete(id);
  budget.spend();
  return true;
}

/** The character and its revisions, reviews, secrets, roll facts and import records. */
async function deleteCharacter(
  ctx: MutationCtx,
  budget: Budget,
  characterId: Id<'characters'>,
): Promise<boolean> {
  const pages: Page[] = [
    () =>
      ctx.db
        .query('characterRevisions')
        .withIndex('by_character_and_revision', q => q.eq('characterId', characterId))
        .take(PAGE),
    () =>
      ctx.db
        .query('characterReviews')
        .withIndex('by_character', q => q.eq('characterId', characterId))
        .take(PAGE),
    () =>
      ctx.db
        .query('characterSecrets')
        .withIndex('by_character_campaign', q => q.eq('characterId', characterId))
        .take(PAGE),
    () =>
      ctx.db
        .query('heroRollFacts')
        .withIndex('by_character', q => q.eq('characterId', characterId))
        .take(PAGE),
  ];
  if (!(await drainAll(ctx, budget, pages))) return false;
  // Import rows carry their payload, so they are read singly under the byte budget.
  for (;;) {
    if (budget.exhausted) return false;
    const record = await ctx.db
      .query('characterImports')
      .withIndex('by_character', q => q.eq('characterId', characterId))
      .first();
    if (!record) break;
    await ctx.db.delete(record._id);
    budget.spend(record.payloadBytes);
  }
  return remove(ctx, budget, characterId);
}

/** Another player's character leaves the deleted campaign: campaign values cleared, build kept. */
async function detachCharacter(
  ctx: MutationCtx,
  budget: Budget,
  character: Doc<'characters'>,
  campaignId: Id<'campaigns'>,
): Promise<boolean> {
  const pages: Page[] = [
    () =>
      ctx.db
        .query('heroRollFacts')
        .withIndex('by_character', q => q.eq('characterId', character._id))
        .take(PAGE),
    () =>
      ctx.db
        .query('characterSecrets')
        .withIndex('by_character_campaign', q =>
          q.eq('characterId', character._id).eq('campaignId', campaignId),
        )
        .take(PAGE),
  ];
  if (!(await drainAll(ctx, budget, pages))) return false;
  if (budget.exhausted) return false;
  await ctx.db.patch(character._id, { campaignId: null, liveState: null, combatLocked: false });
  budget.spend();
  return true;
}

async function deleteEncounter(
  ctx: MutationCtx,
  budget: Budget,
  encounterId: Id<'encounters'>,
): Promise<boolean> {
  const pages: Page[] = [
    () =>
      ctx.db
        .query('snapshots')
        .withIndex('by_encounter', q => q.eq('encounterId', encounterId))
        .take(PAGE),
    () =>
      ctx.db
        .query('initiativeGroups')
        .withIndex('by_encounter', q => q.eq('encounterId', encounterId))
        .take(PAGE),
    () =>
      ctx.db
        .query('turnEntries')
        .withIndex('by_encounter', q => q.eq('encounterId', encounterId))
        .take(PAGE),
    () =>
      ctx.db
        .query('turns')
        .withIndex('by_encounter', q => q.eq('encounterId', encounterId))
        .take(PAGE),
    () =>
      ctx.db
        .query('clockRegistrations')
        .withIndex('by_encounter', q => q.eq('encounterId', encounterId))
        .take(PAGE),
    () =>
      ctx.db
        .query('actionUses')
        .withIndex('by_encounter_actor', q => q.eq('encounterId', encounterId))
        .take(PAGE),
    () =>
      ctx.db
        .query('actionOpportunities')
        .withIndex('by_encounter_actor', q => q.eq('encounterId', encounterId))
        .take(PAGE),
  ];
  if (!(await drainAll(ctx, budget, pages))) return false;
  return remove(ctx, budget, encounterId);
}

async function deleteSession(
  ctx: MutationCtx,
  budget: Budget,
  sessionId: Id<'sessions'>,
): Promise<boolean> {
  const pages: Page[] = [
    () =>
      ctx.db
        .query('historyCursors')
        .withIndex('by_session', q => q.eq('sessionId', sessionId))
        .take(PAGE),
    () =>
      ctx.db
        .query('historyUnits')
        .withIndex('by_session_command', q => q.eq('sessionId', sessionId))
        .take(PAGE),
  ];
  if (!(await drainAll(ctx, budget, pages))) return false;
  return remove(ctx, budget, sessionId);
}

/** The campaign deletion policy applied to a campaign the deleted account owns. */
async function deleteCampaign(
  ctx: MutationCtx,
  budget: Budget,
  campaign: Doc<'campaigns'>,
  userId: Id<'users'>,
): Promise<boolean> {
  const campaignId = campaign._id;
  for (;;) {
    const attached = await ctx.db
      .query('characters')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .take(PAGE);
    for (const character of attached) {
      const ok =
        character.ownerId === userId
          ? await deleteCharacter(ctx, budget, character._id)
          : await detachCharacter(ctx, budget, character, campaignId);
      if (!ok) return false;
    }
    if (attached.length < PAGE) break;
  }
  for (;;) {
    const encounters = await ctx.db
      .query('encounters')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .take(PAGE);
    for (const encounter of encounters)
      if (!(await deleteEncounter(ctx, budget, encounter._id))) return false;
    if (encounters.length < PAGE) break;
  }
  for (;;) {
    const sessions = await ctx.db
      .query('sessions')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .take(PAGE);
    for (const session of sessions)
      if (!(await deleteSession(ctx, budget, session._id))) return false;
    if (sessions.length < PAGE) break;
  }
  const pages: Page[] = [
    () =>
      ctx.db
        .query('characterReviews')
        .withIndex('by_campaign_status', q => q.eq('campaignId', campaignId))
        .take(PAGE),
    () =>
      ctx.db
        .query('interactions')
        .withIndex('by_campaign_status', q => q.eq('campaignId', campaignId))
        .take(PAGE),
    () =>
      ctx.db
        .query('changes')
        .withIndex('by_campaign_command', q => q.eq('campaignId', campaignId))
        .take(PAGE),
    () =>
      ctx.db
        .query('rolls')
        .withIndex('by_campaign_command', q => q.eq('campaignId', campaignId))
        .take(PAGE),
    () =>
      ctx.db
        .query('diceStates')
        .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
        .take(PAGE),
    () =>
      ctx.db
        .query('abilityResults')
        .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
        .take(PAGE),
    () =>
      ctx.db
        .query('historyAliases')
        .withIndex('by_campaign_former', q => q.eq('campaignId', campaignId))
        .take(PAGE),
    () =>
      ctx.db
        .query('events')
        .withIndex('by_campaign_sequence', q => q.eq('campaignId', campaignId))
        .take(PAGE),
    () =>
      ctx.db
        .query('foes')
        .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
        .take(PAGE),
    () =>
      ctx.db
        .query('squads')
        .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
        .take(PAGE),
    () =>
      ctx.db
        .query('foeSettings')
        .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
        .take(PAGE),
    () =>
      ctx.db
        .query('targetingDrafts')
        .withIndex('by_campaign_user', q => q.eq('campaignId', campaignId))
        .take(PAGE),
    () =>
      ctx.db
        .query('presence')
        .withIndex('by_campaign_user', q => q.eq('campaignId', campaignId))
        .take(PAGE),
    () =>
      ctx.db
        .query('chatMessages')
        .withIndex('by_campaign_created', q => q.eq('campaignId', campaignId))
        .take(PAGE),
    () =>
      ctx.db
        .query('joinRequests')
        .withIndex('by_campaign_user', q => q.eq('campaignId', campaignId))
        .take(PAGE),
    () =>
      ctx.db
        .query('memberships')
        .withIndex('by_campaign_user', q => q.eq('campaignId', campaignId))
        .take(PAGE),
  ];
  if (!(await drainAll(ctx, budget, pages))) return false;
  return remove(ctx, budget, campaignId);
}

/** One pass over everything the account still owns; false when the budget ran out. */
async function purgeSteps(ctx: MutationCtx, budget: Budget, user: Doc<'users'>): Promise<boolean> {
  const userId = user._id;
  for (;;) {
    const owned = await ctx.db
      .query('campaigns')
      .withIndex('by_owner', q => q.eq('ownerId', userId))
      .take(PAGE);
    for (const campaign of owned)
      if (!(await deleteCampaign(ctx, budget, campaign, userId))) return false;
    if (owned.length < PAGE) break;
  }
  for (;;) {
    const own = await ctx.db
      .query('characters')
      .withIndex('by_owner', q => q.eq('ownerId', userId))
      .take(PAGE);
    for (const character of own)
      if (!(await deleteCharacter(ctx, budget, character._id))) return false;
    if (own.length < PAGE) break;
  }
  for (;;) {
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_user', q => q.eq('userId', userId))
      .take(PAGE);
    for (const membership of memberships) {
      const campaignId = membership.campaignId;
      const pages: Page[] = [
        () =>
          ctx.db
            .query('presence')
            .withIndex('by_campaign_user', q => q.eq('campaignId', campaignId).eq('userId', userId))
            .take(PAGE),
        () =>
          ctx.db
            .query('targetingDrafts')
            .withIndex('by_campaign_user', q => q.eq('campaignId', campaignId).eq('userId', userId))
            .take(PAGE),
      ];
      if (!(await drainAll(ctx, budget, pages))) return false;
      if (!(await remove(ctx, budget, membership._id))) return false;
    }
    if (memberships.length < PAGE) break;
  }
  const rest: Page[] = [
    () =>
      ctx.db
        .query('portraitUploads')
        .withIndex('by_user', q => q.eq('userId', userId))
        .take(PAGE),
    () =>
      ctx.db
        .query('joinRequests')
        .withIndex('by_user', q => q.eq('userId', userId))
        .take(PAGE),
    () =>
      ctx.db
        .query('commands')
        .withIndex('by_user_command', q => q.eq('userId', userId))
        .take(PAGE),
  ];
  if (!(await drainAll(ctx, budget, rest))) return false;
  if (budget.exhausted) return false;
  if (user.portraitId) await ctx.storage.delete(user.portraitId);
  await ctx.db.delete(userId);
  budget.spend();
  return true;
}

/** Purges the app data of a profile; schedules a continuation when the budget runs out. */
export async function purgeUser(
  ctx: MutationCtx,
  user: Doc<'users'>,
): Promise<'done' | 'continued'> {
  const budget = new Budget(PURGE_BUDGET);
  if (await purgeSteps(ctx, budget, user)) return 'done';
  await ctx.scheduler.runAfter(0, internal.account.continuePurge, { userId: user._id });
  return 'continued';
}

/** Entry point for the Better Auth user-delete trigger: no profile means nothing to purge. */
export async function purgeAccount(
  ctx: MutationCtx,
  authId: string,
): Promise<'done' | 'continued' | 'none'> {
  const user = await ctx.db
    .query('users')
    .withIndex('by_authId', q => q.eq('authId', authId))
    .unique();
  if (!user) return 'none';
  return purgeUser(ctx, user);
}
