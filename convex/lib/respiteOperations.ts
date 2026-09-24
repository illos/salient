// SPDX-License-Identifier: GPL-3.0-only
/**
 * V165 respite loop (docs/table-spec.md#respite-mode; user rulings 2026-09-24): the Director starts a
 * respite for chosen heroes (the attached party by default) and ends it one of three ways.
 *
 * - `/respite start`: record each participant's state; the session cannot close while it is open.
 * - `/respite cancel`: every participant's live values return to their state at the start. Build
 *   changes (a level-up or approved edit) are separate operations and are not reverted.
 * - `/respite interrupt`: it ends early without its completion benefits; what happened stands
 *   (rule/resource/respite.md: "the respite ends early and you don't gain the benefits").
 * - `/respite complete`: each participant regains all Stamina and Recoveries and converts Victories
 *   to XP (rule/resource/respite.md; rule/resource/experience.md "you gain XP equal to your Victories,
 *   then your Victories reset to 0"); each XP threshold crossed grants one pending level-up, taken later
 *   (docs/character-wizard-spec.md#level-up). Complete is final.
 *
 * Standard advancement thresholds are 16 XP per level (chapter/making-a-hero.md, Heroic Advancement
 * table: 0, 16, 32 … 144 for levels 1–10). The campaign XP-per-level setting is later work.
 * Feature-specific respite effects remain manual.
 */
import { ConvexError, v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { OperationDefinition, Role, TableContext } from './registry';
import { journalPatch } from './journal';
import { baselineOf } from './characterBuild';
import { revisionLevel } from './characterProgression';
import { sessionEncounter } from './combatOperations';

const XP_PER_LEVEL = 16;
const MAX_LEVEL = 10;
const DIRECTOR_RUNNING: { roles: Role[]; session: 'running' } = {
  roles: ['director'],
  session: 'running',
};
const characterArg = v.object({ refKind: v.literal('character'), id: v.string() });

type OpenRespite = NonNullable<Doc<'sessions'>['respite']>;

function openRespite(context: TableContext): OpenRespite {
  const respite = context.session?.respite;
  if (!respite) throw new ConvexError('No respite is open.');
  return respite;
}

async function participants(ctx: MutationCtx, respite: OpenRespite) {
  return Promise.all(
    respite.participants.map(async p => {
      const hero = await ctx.db.get(p.characterId);
      if (!hero) throw new ConvexError('A respite participant is unavailable.');
      return { hero, snapshot: p };
    }),
  );
}

/** Level-ups granted by an XP gain: thresholds crossed, capped at level 10 (V165). */
export function levelUpsEarned(
  xpBefore: number,
  xpAfter: number,
  entryOffset: number,
  levelAfterPending: number,
): number {
  const crossed =
    Math.floor((xpAfter + entryOffset) / XP_PER_LEVEL) -
    Math.floor((xpBefore + entryOffset) / XP_PER_LEVEL);
  return Math.max(0, Math.min(crossed, MAX_LEVEL - levelAfterPending));
}

const start: OperationDefinition = {
  id: 'respite.start',
  family: 'respite',
  verb: 'start',
  title: 'Start a respite',
  description:
    'Director: start a respite for chosen heroes (default: every hero attached to this campaign). It ends by Cancel, Interrupt or Complete; the session cannot close while it is open.',
  args: { characters: v.optional(v.array(characterArg)) },
  argDescriptions: {
    characters: 'Resting heroes, as @{character:id}; omit for every attached hero.',
  },
  ...DIRECTOR_RUNNING,
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const session = context.session!;
    if (session.respite) throw new ConvexError('A respite is already open.');
    if (await sessionEncounter(ctx, context))
      throw new ConvexError('Finish or void combat before starting a respite.');
    const chosen = args.characters as { id: string }[] | undefined;
    const heroes: Doc<'characters'>[] = chosen?.length
      ? await Promise.all(
          chosen.map(async reference => {
            const id = ctx.db.normalizeId('characters', reference.id);
            const hero = id ? await ctx.db.get(id) : null;
            if (!hero) throw new ConvexError('Character unavailable.');
            return hero;
          }),
        )
      : (
          await ctx.db
            .query('characters')
            .withIndex('by_campaign', q => q.eq('campaignId', context.campaign._id))
            .collect()
        ).filter(hero => hero.liveState);
    if (new Set(heroes.map(hero => hero._id)).size !== heroes.length)
      throw new ConvexError('Name each hero once.');
    for (const hero of heroes)
      if (hero.campaignId !== context.campaign._id || !hero.liveState)
        throw new ConvexError(`${hero.authored.name} is not an admitted hero in this campaign.`);
    if (!heroes.length) throw new ConvexError('No hero can rest in this campaign.');
    const names = heroes.map(hero => hero.authored.name).join(', ');
    return {
      kind: 'respite.started',
      description: `Respite started: ${names}.`,
      data: { characters: heroes.map(hero => hero._id) },
      commit: async (mctx, scope) => {
        await journalPatch(mctx, scope, 'sessions', session._id, {
          respite: {
            startedAt: Date.now(),
            participants: heroes.map(hero => ({
              characterId: hero._id,
              liveState: hero.liveState!,
            })),
          },
        });
      },
    };
  },
};

const cancel: OperationDefinition = {
  id: 'respite.cancel',
  family: 'respite',
  verb: 'cancel',
  title: 'Cancel the respite',
  description:
    'Director: cancel the open respite. Every participant returns to their state from when it started.',
  args: {},
  argDescriptions: {},
  ...DIRECTOR_RUNNING,
  actor: 'none',
  execute: async (ctx, { context }) => {
    const respite = openRespite(context);
    const rows = await participants(ctx, respite);
    return {
      kind: 'respite.canceled',
      description: 'Respite canceled: every participant is back to their state before it.',
      data: { characters: rows.map(({ hero }) => hero._id) },
      commit: async (mctx, scope) => {
        for (const { hero, snapshot } of rows)
          await journalPatch(
            mctx,
            scope,
            'characters',
            hero._id,
            { liveState: snapshot.liveState },
            hero,
          );
        await journalPatch(mctx, scope, 'sessions', context.session!._id, { respite: null });
      },
    };
  },
};

const interrupt: OperationDefinition = {
  id: 'respite.interrupt',
  family: 'respite',
  verb: 'interrupt',
  title: 'Interrupt the respite',
  description:
    'Director: the respite ends early. What already happened stands; there is no restoration, XP or level-up. Ordinary play resumes (start combat normally for an ambush).',
  args: {},
  argDescriptions: {},
  ...DIRECTOR_RUNNING,
  actor: 'none',
  execute: async (_ctx, { context }) => {
    const respite = openRespite(context);
    return {
      kind: 'respite.interrupted',
      description: 'Respite interrupted: it ends early without its benefits.',
      data: { characters: respite.participants.map(p => p.characterId) },
      commit: async (mctx, scope) => {
        await journalPatch(mctx, scope, 'sessions', context.session!._id, { respite: null });
      },
    };
  },
};

const complete: OperationDefinition = {
  id: 'respite.complete',
  family: 'respite',
  verb: 'complete',
  title: 'Complete the respite',
  description:
    'Director: finish the respite. Each participant regains all Stamina and Recoveries, converts Victories to XP and gains a pending level-up for each XP threshold crossed. This is final.',
  args: {},
  argDescriptions: {},
  ...DIRECTOR_RUNNING,
  actor: 'none',
  execute: async (ctx, { context }) => {
    const respite = openRespite(context);
    const rows = await participants(ctx, respite);
    const results = await Promise.all(
      rows.map(async ({ hero }) => {
        const live = hero.liveState;
        const baseline = baselineOf(hero.derivedBaseline);
        if (!live || !baseline)
          throw new ConvexError(`${hero.authored.name} has no effective build to restore.`);
        const effective = hero.effectiveRevisionId
          ? await ctx.db.get(hero.effectiveRevisionId)
          : null;
        const level = effective ? revisionLevel(effective) : 1;
        const pending = hero.pendingLevelUps ?? 0;
        const xp = live.xp + live.victories;
        const earned = levelUpsEarned(live.xp, xp, hero.entryLevelXpOffset ?? 0, level + pending);
        return {
          hero,
          before: { stamina: live.stamina, recoveries: live.recoveries, xp: live.xp },
          liveState: {
            ...live,
            stamina: baseline.staminaMaximum.value,
            recoveries: baseline.recoveriesMaximum.value,
            xp,
            victories: 0,
          },
          pendingLevelUps: pending + earned,
          earned,
        };
      }),
    );
    const summary = results
      .map(
        r =>
          `${r.hero.authored.name}: restored, XP ${r.before.xp} → ${r.liveState.xp}${r.earned ? `, ${r.earned} level-up${r.earned > 1 ? 's' : ''} granted` : ''}`,
      )
      .join('; ');
    return {
      kind: 'respite.completed',
      description: `Respite complete. ${summary}.`,
      data: {
        characters: results.map(r => ({
          characterId: r.hero._id,
          staminaBefore: r.before.stamina,
          staminaAfter: r.liveState.stamina,
          recoveriesBefore: r.before.recoveries,
          recoveriesAfter: r.liveState.recoveries,
          xpBefore: r.before.xp,
          xpAfter: r.liveState.xp,
          levelUpsGranted: r.earned,
        })),
      },
      commit: async (mctx, scope) => {
        for (const r of results)
          await journalPatch(
            mctx,
            scope,
            'characters',
            r.hero._id,
            { liveState: r.liveState, pendingLevelUps: r.pendingLevelUps },
            r.hero,
          );
        await journalPatch(mctx, scope, 'sessions', context.session!._id, { respite: null });
      },
    };
  },
};

export const respiteOperations: OperationDefinition[] = [start, cancel, interrupt, complete];
export type RespiteParticipant = { characterId: Id<'characters'> };
