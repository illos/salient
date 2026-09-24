// SPDX-License-Identifier: GPL-3.0-only
/**
 * V165 respite loop (docs/table-spec.md#respite-mode; user rulings 2026-09-24): the Director starts a
 * respite for chosen heroes (the attached party by default) and ends it one of three ways.
 *
 * - `/respite start`: record each participant's state; the session cannot close while it is open.
 * - `/respite cancel`: every participant's live values return to their state at the start; Stamina
 *   and Recoveries return to the damage taken and Recoveries spent then (Q-CHAR-2 against the current
 *   maxima). Implementation interpretation (Q-RESPITE-1): build changes made meanwhile (a level-up, an
 *   approved edit) are separate operations and are not reverted; V166's respite kit swaps will be.
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
import { activateRevision, baselineOf, evaluateSelections, pendingReview } from './characterBuild';
import { canonicalChoiceOrigins } from './characterChoiceOrigins';
import { getDefinitions } from '../../shared/content/character-decisions';
import { changeChoice } from '../../shared/evaluate/choiceTransition';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { selectionsFrom } from '../../shared/evaluate/character';
import type { SelectionValue } from '../../shared/contracts/characterEvaluation';
import { revisionLevel } from './characterProgression';
import { sessionEncounter } from './combatOperations';
import { reconciledCurrent } from '../../shared/evaluate/liveReconciliation';

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

/** Participants still admitted in this campaign, and the names of any that have left since. */
async function participants(ctx: MutationCtx, respite: OpenRespite, campaignId: Id<'campaigns'>) {
  const rows = await Promise.all(
    respite.participants.map(async p => ({ hero: await ctx.db.get(p.characterId), snapshot: p })),
  );
  const present = rows.filter(
    (row): row is { hero: Doc<'characters'>; snapshot: (typeof respite.participants)[number] } =>
      !!row.hero && row.hero.campaignId === campaignId && !!row.hero.liveState,
  );
  const left = rows
    .filter(row => !present.includes(row as never))
    .map(row => row.hero?.authored.name ?? 'A removed hero');
  return { present, left };
}
const leftNote = (left: string[]) =>
  left.length ? ` No longer in the campaign, unchanged: ${left.join(', ')}.` : '';

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
            participants: heroes.map(hero => {
              const baseline = baselineOf(hero.derivedBaseline);
              return {
                characterId: hero._id,
                liveState: hero.liveState!,
                staminaMaximum: baseline?.staminaMaximum.value ?? hero.liveState!.stamina,
                recoveriesMaximum: baseline?.recoveriesMaximum.value ?? hero.liveState!.recoveries,
              };
            }),
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
    const { present, left } = await participants(ctx, respite, context.campaign._id);
    // A respite kit change is reverted by recording the earlier build again (V166); any later
    // build change (a level-up or edit) is kept (Q-RESPITE-1).
    const restored = await Promise.all(
      present.map(async ({ hero, snapshot }) => {
        const revert =
          snapshot.kitChange && hero.effectiveRevisionId === snapshot.kitChange.to
            ? await ctx.db.get(snapshot.kitChange.from)
            : null;
        const baseline = baselineOf(revert ? revert.derivedBaseline : hero.derivedBaseline);
        const stamina = baseline?.staminaMaximum.value ?? snapshot.staminaMaximum;
        const recoveries = baseline?.recoveriesMaximum.value ?? snapshot.recoveriesMaximum;
        return {
          hero,
          revert,
          liveState: {
            ...snapshot.liveState,
            stamina: reconciledCurrent(
              'stamina',
              snapshot.liveState.stamina,
              snapshot.staminaMaximum,
              stamina,
            ),
            recoveries: reconciledCurrent(
              'recoveries',
              snapshot.liveState.recoveries,
              snapshot.recoveriesMaximum,
              recoveries,
            ),
          },
        };
      }),
    );
    return {
      kind: 'respite.canceled',
      description: `Respite canceled: every participant is back to their state before it.${leftNote(left)}`,
      data: {
        characters: restored.map(({ hero }) => hero._id),
        kitsReverted: restored.filter(r => r.revert).map(({ hero }) => hero._id),
        left,
      },
      commit: async (mctx, scope) => {
        for (const { hero, revert, liveState } of restored) {
          if (revert) {
            const fresh = (await mctx.db.get(hero._id))!;
            await activateNewBuild(mctx, fresh, context.campaign._id, {
              parentRevisionId: fresh.effectiveRevisionId,
              level: revisionLevel(revert),
              kind: 'restore',
              baseEffectiveRevisionId: fresh.effectiveRevisionId,
              restoredFromRevisionId: revert._id,
              selections: revert.selections,
              ...(revert.choiceOrigins ? { choiceOrigins: revert.choiceOrigins } : {}),
              status: revert.status,
              evaluation: revert.evaluation,
              derivedBaseline: revert.derivedBaseline,
            });
          }
          await journalPatch(
            mctx,
            scope,
            'characters',
            hero._id,
            { liveState },
            revert ? undefined : hero,
          );
        }
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
    const { present, left } = await participants(ctx, respite, context.campaign._id);
    // rule/health/dying.md: a dead hero (Stamina at or below the negative of their winded value)
    // "can't be brought back to life" by resting; leave them unchanged for the table.
    const dead = present.filter(({ hero }) => {
      const baseline = baselineOf(hero.derivedBaseline);
      return !!baseline && hero.liveState!.stamina <= -baseline.windedValue.value;
    });
    const rows = present.filter(row => !dead.includes(row));
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
    // docs/table-spec.md (completing with unused options): unused activities lapse but are named.
    const unused = present
      .filter(({ snapshot }) => !snapshot.activity)
      .map(({ hero }) => hero.authored.name);
    const unusedNote = unused.length ? ` No respite activity used: ${unused.join(', ')}.` : '';
    const deadNote = dead.length
      ? ` Dead, unchanged (resolve manually): ${dead.map(({ hero }) => hero.authored.name).join(', ')}.`
      : '';
    return {
      kind: 'respite.completed',
      description: `Respite complete.${summary ? ` ${summary}.` : ''}${unusedNote}${deadNote}${leftNote(left)}`,
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
        dead: dead.map(({ hero }) => hero._id),
        unusedActivities: unused,
        left,
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

// ---------------------------------------------------------------------------------------------
// V166 respite activities: rule/resource/respite.md "You can also undertake one respite activity,
// such as making a project roll … or changing your kit"; chapter/kits.md, Changing Your Kit.

function participantIndex(respite: OpenRespite, characterId: Id<'characters'>) {
  const index = respite.participants.findIndex(p => p.characterId === characterId);
  if (index < 0) throw new ConvexError('This hero is not resting in the open respite.');
  if (respite.participants[index]!.activity)
    throw new ConvexError(
      `This hero already undertook a respite activity (${respite.participants[index]!.activity}).`,
    );
  return index;
}

async function requireActingOwner(
  ctx: MutationCtx,
  context: TableContext,
  characterId: Id<'characters'>,
): Promise<Doc<'characters'>> {
  const hero = await ctx.db.get(characterId);
  if (!hero || hero.campaignId !== context.campaign._id || !hero.liveState)
    throw new ConvexError('Character unavailable.');
  // The owner takes their own activity; the Director may act for any hero.
  if (context.role !== 'director' && hero.ownerId !== context.user._id)
    throw new ConvexError('Only the character owner or the Director can do this.');
  return hero;
}

/** Record a new complete build and activate it without review (the respite kit change), atomically. */
async function activateNewBuild(
  ctx: MutationCtx,
  hero: Doc<'characters'>,
  campaignId: Id<'campaigns'>,
  fields: Omit<Doc<'characterRevisions'>, '_id' | '_creationTime' | 'characterId' | 'revision'>,
) {
  const revision = hero.revision + 1;
  const id = await ctx.db.insert('characterRevisions', {
    ...fields,
    characterId: hero._id,
    revision,
  });
  const saved = (await ctx.db.get(id))!;
  const { reconciliation } = await activateRevision(ctx, hero, saved, campaignId, Date.now());
  const base = hero.effectiveRevisionId;
  await ctx.db.patch(hero._id, {
    revision,
    staleFullEditRevisionId: hero.draftRevisionId !== base ? hero.draftRevisionId : null,
    ...(hero.draftRevisionId === base ? { draftRevisionId: id } : {}),
  });
  const pending = await pendingReview(ctx, hero._id);
  if (pending) await ctx.db.patch(pending._id, { status: 'stale' });
  return { id, reconciliation };
}

const changeKit: OperationDefinition = {
  id: 'respite.change-kit',
  family: 'respite',
  verb: 'change-kit',
  title: 'Change kit (respite activity)',
  description:
    'During an open respite, a resting hero changes their kit as their one respite activity. The new build takes effect without Director review; Cancel reverts it.',
  args: { selections: v.array(v.object({ decisionId: v.string(), value: v.any() })) },
  argDescriptions: {
    selections:
      'The kit decisions to change, e.g. [{"decisionId":"kit.choice","value":"Mountain"}]; a Tactician also chooses the second kit and arsenal values.',
  },
  roles: ['director', 'player'],
  session: 'running',
  actor: 'required',
  execute: async (ctx, { context, actor, args }) => {
    const respite = openRespite(context);
    const hero = await requireActingOwner(ctx, context, actor!.id as Id<'characters'>);
    const index = participantIndex(respite, hero._id);
    const base = hero.effectiveRevisionId ? await ctx.db.get(hero.effectiveRevisionId) : null;
    if (!base || base.status !== 'complete')
      throw new ConvexError('The effective build is not complete.');
    const level = revisionLevel(base);
    const definitions = getDefinitions(level, base.choiceOrigins);
    const kitIds = new Set(
      definitions.steps.find(step => step.id === 'step.kit')?.decisions.map(d => d.id) ?? [],
    );
    const changes = args.selections as { decisionId: string; value: SelectionValue }[];
    if (!changes.length || changes.some(c => !kitIds.has(c.decisionId)))
      throw new ConvexError('A kit change accepts only kit decisions.');
    let working = selectionsFrom(base.selections);
    for (const change of changes)
      working = changeChoice(working, definitions, change.decisionId, change.value).selections;
    const selections = draftSelectionsFrom(working, definitions);
    const choiceOrigins = canonicalChoiceOrigins(selections, level, base);
    const evaluation = evaluateSelections(selections, level, choiceOrigins);
    if (evaluation.status !== 'complete')
      throw new ConvexError(
        `The new kit leaves the build ${evaluation.status}; choose every kit decision it needs.`,
      );
    const kit = String(working['kit.choice'] ?? '');
    return {
      kind: 'respite.kit-changed',
      description: `${hero.authored.name} changed kit to ${kit} as their respite activity.`,
      data: { characterId: hero._id, kit },
      commit: async (mctx, scope) => {
        const fresh = (await mctx.db.get(hero._id))!;
        const { id } = await activateNewBuild(mctx, fresh, context.campaign._id, {
          parentRevisionId: base._id,
          level,
          kind: 'respite-kit',
          choiceOrigins,
          baseEffectiveRevisionId: base._id,
          selections,
          evaluation,
          status: evaluation.status,
          derivedBaseline: evaluation.baseline,
        });
        const participants = respite.participants.map((p, i) =>
          i === index ? { ...p, activity: 'Change kit', kitChange: { from: base._id, to: id } } : p,
        );
        await journalPatch(mctx, scope, 'sessions', context.session!._id, {
          respite: { ...respite, participants },
        });
      },
    };
  },
};

const activity: OperationDefinition = {
  id: 'respite.activity',
  family: 'respite',
  verb: 'activity',
  title: 'Record a respite activity',
  description:
    'During an open respite, record the one respite activity a resting hero undertakes (for example a project roll or a class feature that changes as a respite activity). Its effects are resolved manually.',
  args: { name: v.string() },
  argDescriptions: { name: 'The activity, e.g. "Project roll".' },
  roles: ['director', 'player'],
  session: 'running',
  actor: 'required',
  execute: async (ctx, { context, actor, args }) => {
    const respite = openRespite(context);
    const hero = await requireActingOwner(ctx, context, actor!.id as Id<'characters'>);
    const index = participantIndex(respite, hero._id);
    const name = String(args.name).trim().slice(0, 80);
    if (!name) throw new ConvexError('Name the respite activity.');
    return {
      kind: 'respite.activity',
      description: `${hero.authored.name}'s respite activity: ${name}. Resolve it manually.`,
      data: { characterId: hero._id, name },
      commit: async (mctx, scope) => {
        const participants = respite.participants.map((p, i) =>
          i === index ? { ...p, activity: name } : p,
        );
        await journalPatch(mctx, scope, 'sessions', context.session!._id, {
          respite: { ...respite, participants },
        });
      },
    };
  },
};

export const respiteOperations: OperationDefinition[] = [
  start,
  cancel,
  interrupt,
  complete,
  changeKit,
  activity,
];
export type RespiteParticipant = { characterId: Id<'characters'> };
