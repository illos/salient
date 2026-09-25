// SPDX-License-Identifier: GPL-3.0-only
/**
 * V174 damage-changing responses (docs/build/V174-damage-reactions.md). Accepting a response card
 * whose ability revises the triggering damage ("take half the damage", Parry) revises that hit
 * (docs/decisions/2026-09-24-automation-rulings.md, ruling 3, option B;
 * docs/lasting-effects-design.md#5b-response-revision-accounting-ruling-3-option-b):
 * - The hit is found on the triggering entry: a rolled use's effective record (`abilityResults`,
 *   including any correction), an ability without a power roll's triggered damage, or a creature
 *   free strike's recorded application. The recorded damage must be the card's triggering damage.
 * - It is recomputed from the **current accepted revision**: the latest response already accepted
 *   on this hit for this creature, else the hit itself. A second response never re-applies what the
 *   first adjusted.
 * - Stamina and temporary Stamina get the difference back. Winded, dying and dead are read from
 *   Stamina, so they follow.
 * - Consequences the revised hit no longer earns are reversed: heroic-resource gains (V142, V149),
 *   the spent part of which stands and is logged; open offers of this hit get the revised damage.
 *   Consequences that are still true stand.
 * - Consequences the engine can't reverse exactly refuse the acceptance (the card stays open, so
 *   the table can rewind to the hit or use the ability by hand): a watcher firing (V171) whose event
 *   the revision undoes, an effect that ended because the hit made its owner dying (V158), a
 *   Persistent Magic break (V148), temporary Stamina changed since the hit, a potency condition
 *   whose saving throw was already rolled or that replaced another taunt.
 * - A potency reduction (Parry's Effect, the Spend sections) re-checks the hit's compiled potency
 *   conditions on the damaged creature (rule/character/potency.md) and ends those no longer
 *   imposed. Potency effects the table resolved by hand get an instruction.
 * Every write is in the accepting use's journal scope, so undo of the acceptance restores the hit.
 */
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { DamageApplication } from '../../shared/contracts/rollResolution';
import type { CompiledResult } from '../../shared/contracts/compiledResult';
import type { CompiledConditionOutcome } from '../../shared/resolve/compiledOutcome';
import type { CompiledAbility } from '../../shared/resolve/compileAbility';
import {
  damageTaken,
  eventsNoLongerTrue,
  halveApplication,
  potencyRevision,
  revisionDelta,
  unspentGain,
  type DamageEvent,
  type PotencyEffect,
} from '../../shared/resolve/damageRevision';
import { generationProfile, triggersFor } from '../../shared/resolve/heroicResourceGeneration';
import { heroicResourceFloor } from '../../shared/resolve/resourceFloor';
import { baselineOf, requireHeroLive } from './characterBuild';
import { endConditionInstance, hasRolledConditionSave, replacedByUse } from './conditionInstances';
import { committedEncounter } from './encounters';
import { appendEvent } from './events';
import { journalPatch, type JournalScope } from './journal';
import { MARK_OFFER_KIND, OFFER_KIND, type TriggerOffer } from './triggeredActions';
import type { MarkOffer } from './marks';

/** The events a lost hit event undoes for watchers (convex/lib/watchers.ts damageEvents). */
const WATCHED: Record<DamageEvent, string[]> = {
  // V175: a mark owner's `marked-damaged` watchers fired from the same damage.
  'damage-taken': ['damage-taken', 'damage-dealt', 'marked-damaged'],
  'made-winded': ['made-winded'],
  dying: ['dying'],
  dead: [],
};

interface GainReversal {
  characterId: Id<'characters'>;
  name: string;
  resource: string;
  claimEventId: string;
  label: string;
  before: number;
  after: number;
  spent: number;
}

export interface RevisionPlan {
  hitEventId: Id<'events'>;
  damaged: Doc<'characters'>;
  current: DamageApplication;
  revised: DamageApplication;
  /** What the revision gives back, as written (Stamina capped at the maximum). */
  stamina: { before: number; after: number };
  temporaryStamina: { before: number; after: number };
  gains: GainReversal[];
  ended: PotencyEffect[];
  /**
   * The accepted potency reductions per effect occurrence after this revision (cumulative: the
   * earlier revisions' and this one's), saved on the revision outcome so the next one starts there.
   */
  potencyReductions: Record<string, number>;
  /** The hit's events this revision no longer makes true (for the Mark cards at commit). */
  lost: DamageEvent[];
  turnDamage?: { turnId: string; amount: number };
  /** For the log: reversals, what stands, and table work. */
  notes: string[];
}

/** The hit on `damagedId` recorded by the triggering entry, as its effective record holds it. */
async function recordedHit(
  ctx: MutationCtx,
  hitEvent: Doc<'events'>,
  damagedId: string,
): Promise<{
  application: DamageApplication;
  compiled?: CompiledResult;
  /** Another creature took damage from the same entry (its dealer's damage-dealt still happened). */
  othersDamaged: boolean;
  /** The creature whose use dealt the damage, when the effective record names it. */
  dealerId?: string;
} | null> {
  const result = await ctx.db
    .query('abilityResults')
    .withIndex('by_event', q => q.eq('eventId', hitEvent._id))
    .unique();
  const compiled = result?.compiled as CompiledResult | undefined;
  if (result?.effectOnly) {
    const effect = compiled?.effects.find(
      o => o.effect.kind === 'triggered-damage' && o.effect.targetId === damagedId,
    )?.effect;
    const othersDamaged = (compiled?.effects ?? []).some(
      o =>
        o.effect.kind === 'triggered-damage' &&
        o.effect.targetId !== damagedId &&
        !!o.effect.application &&
        damageTaken(o.effect.application) > 0,
    );
    return effect?.kind === 'triggered-damage' && effect.application
      ? { application: effect.application, othersDamaged, dealerId: result.actor.id }
      : null;
  }
  if (result) {
    const entry = result.targets.find(t => t.target.id === damagedId);
    const applied = (entry?.applied as DamageApplication | null | undefined) ?? undefined;
    const othersDamaged = result.targets.some(
      t =>
        t.target.id !== damagedId && !!t.applied && damageTaken(t.applied as DamageApplication) > 0,
    );
    return applied
      ? {
          application: applied,
          othersDamaged,
          dealerId: result.actor.id,
          ...(compiled ? { compiled } : {}),
        }
      : null;
  }
  // A creature free strike records its application on the entry only.
  const damage = (
    hitEvent.payload as {
      data?: { damage?: { target: { id: string }; application: DamageApplication | null }[] };
    }
  )?.data?.damage;
  const application = damage?.find(d => d.target.id === damagedId)?.application;
  const othersDamaged = (damage ?? []).some(
    d => d.target.id !== damagedId && !!d.application && damageTaken(d.application) > 0,
  );
  return application ? { application, othersDamaged } : null;
}

/**
 * The current accepted revision of this hit for each creature it revised (design 5b "Recompute"):
 * the latest accepted response to the same trigger that revised it, with the potency reductions
 * accepted so far per effect occurrence (cumulative, so each revision works from the current
 * accepted potency). The resolved cards are read once for all targets; the hit's resolved Mark
 * cards come back with them.
 */
async function revisionsOf(
  ctx: MutationCtx,
  campaignId: Id<'campaigns'>,
  hitEventId: string,
): Promise<{
  latest: Map<string, { application: DamageApplication; potency: Record<string, number> }>;
  markCards: Doc<'interactions'>[];
}> {
  const resolved = (
    await ctx.db
      .query('interactions')
      .withIndex('by_campaign_status', q => q.eq('campaignId', campaignId).eq('status', 'resolved'))
      .order('desc')
      .take(200)
  ).filter(
    card =>
      (card.offer as { triggeringEventId?: string } | undefined)?.triggeringEventId === hitEventId,
  );
  const answered = resolved
    .filter(card => card.kind === OFFER_KIND && card.resolvedEventId)
    .sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0));
  const latest = new Map<
    string,
    { application: DamageApplication; potency: Record<string, number> }
  >();
  for (const card of answered) {
    const result = await ctx.db
      .query('abilityResults')
      .withIndex('by_event', q => q.eq('eventId', card.resolvedEventId!))
      .unique();
    for (const { effect } of (result?.compiled as CompiledResult | undefined)?.effects ?? [])
      if (
        effect.kind === 'damage-revision' &&
        effect.status === 'calculated' &&
        effect.application &&
        !latest.has(effect.targetId)
      )
        latest.set(effect.targetId, {
          application: effect.application,
          potency: effect.potencyReductions ?? {},
        });
  }
  return { latest, markCards: resolved.filter(card => card.kind === MARK_OFFER_KIND) };
}

/**
 * V175: whether the revised hit no longer triggers a Mark card about the damaged creature: a
 * retarget needs it reduced to 0 Stamina (for a hero, the `dying` crossing), a benefit rolled
 * damage taken (mark.md).
 */
function markCardInvalid(
  card: Doc<'interactions'>,
  damagedId: string,
  lost: readonly DamageEvent[],
): boolean {
  const offer = card.offer as MarkOffer | undefined;
  if (!offer?.mark || offer.mark.holder.id !== damagedId) return false;
  return offer.mark.kind === 'retarget' ? lost.includes('dying') : lost.includes('damage-taken');
}

/** V174: a correction of a hit an accepted response revised is refused (rewind instead). */
export async function assertNotRevised(
  ctx: MutationCtx,
  campaignId: Id<'campaigns'>,
  hitEventId: Id<'events'>,
): Promise<void> {
  if ((await revisionsOf(ctx, campaignId, hitEventId)).latest.size)
    throw new ConvexError(
      'An accepted response revised this hit; undo that response or rewind to the hit instead of correcting it.',
    );
}

/** The hit's potency conditions on the damaged creature (V88 compiled occurrences). */
function potencyEffects(compiled: CompiledResult | undefined, damagedId: string): PotencyEffect[] {
  return (compiled?.effects ?? []).flatMap(occurrence => {
    const effect = occurrence.effect;
    if (effect.kind !== 'condition' || effect.targetId !== damagedId || !effect.characteristic)
      return [];
    const condition = effect as CompiledConditionOutcome;
    return [
      {
        id: occurrence.id,
        effect: condition.group ?? condition.nodeId,
        condition: condition.condition,
        status: condition.status,
        ...(condition.threshold !== undefined ? { threshold: condition.threshold } : {}),
        ...(condition.targetScore !== undefined ? { targetScore: condition.targetScore } : {}),
      },
    ];
  });
}

/**
 * Plans the revision of the hit an accepted card answers, or refuses it (the card stays open).
 * Read-only: `commitRevision` writes the plan in the use's journal scope.
 */
export async function planRevision(
  ctx: MutationCtx,
  campaignId: Id<'campaigns'>,
  offer: TriggerOffer,
  ability: { name: string; definition: CompiledAbility },
  options: { spend?: number; potencyChoice?: string },
): Promise<RevisionPlan> {
  const refuse = (why: string): never => {
    throw new ConvexError(
      `${offer.owner.name} can't revise this hit with ${ability.name}: ${why} The card stays open; pass it and use ${ability.name} by hand if the table resolves it.`,
    );
  };
  const damagedRef = offer.damaged ?? offer.target;
  if (damagedRef.kind !== 'character')
    refuse('only a hero’s hit is revised (the heroes’ responses protect heroes).');
  const hitEvent = await ctx.db.get(offer.triggeringEventId);
  const damaged = await ctx.db.get(damagedRef.id as Id<'characters'>);
  const baseline = baselineOf(damaged?.derivedBaseline);
  if (!hitEvent || !damaged?.liveState || !baseline)
    return refuse('the triggering entry or the damaged hero is no longer recorded.');
  const hit = await recordedHit(ctx, hitEvent, damaged._id);
  // Design 5b: the current accepted revision, which open cards of this hit were updated to.
  const revisions = await revisionsOf(ctx, campaignId, hitEvent._id);
  const accepted = revisions.latest.get(damaged._id);
  const current = accepted?.application ?? hit?.application;
  const priorPotency = accepted?.potency ?? {};
  if (!hit || !current || damageTaken(current) !== offer.damage)
    return refuse(
      `the triggering entry records no single hit on ${damaged.authored.name} of ${offer.damage} damage the engine can recompute.`,
    );
  if (options.potencyChoice !== undefined) {
    const spendNode = ability.definition.sections.find(node => node.kind === 'response-spend');
    if (
      options.spend === undefined ||
      spendNode?.effect.kind !== 'potency' ||
      spendNode.effect.scope !== 'one'
    )
      refuse(
        '"potency" names the one effect whose potency a spend reduces; this answer reduces no single effect’s potency.',
      );
  }
  const revised = halveApplication(current, 'hero');
  const delta = revisionDelta(current, revised);
  const live = requireHeroLive(damaged);
  const name = damaged.authored.name;
  const notes: string[] = [];
  // rule/health/temporary-stamina.md: a later gain keeps the greater amount, so the difference
  // can't be given back onto temporary Stamina that changed since the hit.
  if (delta.temporaryStamina > 0 && live.temporaryStamina !== current.temporaryStaminaAfter)
    refuse(
      `${name}'s temporary Stamina changed since the hit (${current.temporaryStaminaAfter} → ${live.temporaryStamina}), so the absorbed damage can't be given back exactly; rewind to the hit instead.`,
    );
  const lost = eventsNoLongerTrue(current, revised, 'hero');
  // V175 marks (feature/ability/tactician/level-1/mark.md): a retarget answers "When a creature
  // marked by you is reduced to 0 Stamina", a benefit "whenever you or any ally uses an ability to
  // deal rolled damage to a creature marked by you". An already accepted one the
  // revised hit no longer triggers can't be taken back exactly, so the revision is refused; open
  // ones close at commit.
  const takenMarks = revisions.markCards.filter(card => markCardInvalid(card, damaged._id, lost));
  if (takenMarks.length)
    refuse(
      `${takenMarks.map(card => (card.offer as MarkOffer).owner.name + "'s Mark " + (card.offer as MarkOffer).mark.kind).join(', ')} was already taken on this hit, and the revised hit no longer triggers it. Rewind to the hit instead.`,
    );

  // The hit's linked consequences: every entry the hit's command logged as caused by it.
  const logged = (
    await ctx.db
      .query('events')
      .withIndex('by_campaign_command', q =>
        q.eq('campaignId', campaignId).eq('commandId', hitEvent.commandId),
      )
      .take(1000)
  ).filter(entry => entry.causeEventId === hitEvent._id && entry.disposition !== 'undone');
  const data = (entry: Doc<'events'>) =>
    ((entry.payload as { data?: Record<string, unknown> } | undefined)?.data ?? {}) as Record<
      string,
      unknown
    >;
  // V171 "rewind to the use": a watcher's firing whose event the revision undoes.
  // Only firings about the revised creature: its own watchers of what it took, and the dealer's
  // damage-dealt when no other creature took damage from the same entry.
  const unwatched = new Set(lost.flatMap(event => WATCHED[event]));
  const dealerId = hit.dealerId;
  const fired = logged.filter(entry => {
    if (entry.kind !== 'effect.watcher-fired') return false;
    const event = String(data(entry).event);
    const holder = (data(entry).holder as { id?: string } | undefined)?.id;
    if (!unwatched.has(event)) return false;
    // V175: a `marked-damaged` firing is held by the mark's owner; when this hit damaged no other
    // creature, it was this creature's damage.
    if (event === 'marked-damaged') return !hit.othersDamaged;
    return event === 'damage-dealt'
      ? !hit.othersDamaged && (dealerId === undefined || holder === dealerId)
      : holder === damaged._id;
  });
  if (fired.length)
    refuse(
      `the hit set off a watcher the revision would undo (${fired.map(entry => entry.description).join(' ')}), and the engine never re-derives a watcher's firing (V171). Rewind to the hit instead.`,
    );
  // V158: effects that ended because this hit made their owner dying.
  if (lost.includes('dying')) {
    const ended = logged.filter(
      entry =>
        entry.kind === 'effect.ended' &&
        (entry.payload as { reason?: string } | undefined)?.reason === `${name} is dying`,
    );
    if (ended.length)
      refuse(
        `the hit made ${name} dying and ended ${ended.map(entry => entry.description).join(' ')} The revision leaves ${name} not dying, and the engine can't restart an ended effect. Rewind to the hit instead.`,
      );
  }
  // V148 Persistent Magic: this hit's damage is in the turn's tally.
  if (
    logged.some(
      entry =>
        entry.kind === 'resource.maintenance-ended' && data(entry).characterId === damaged._id,
    )
  )
    refuse(
      `the hit made ${name} stop maintaining persistent abilities (Persistent Magic), which the engine can't restart. Rewind to the hit instead.`,
    );
  const reduced = damageTaken(current) - damageTaken(revised);
  let turnDamage: RevisionPlan['turnDamage'];
  if (live.turnDamage && reduced > 0) {
    const campaign = await ctx.db.get(campaignId);
    const encounter = campaign ? await committedEncounter(ctx, campaign) : null;
    const turnId = encounter?.activeTurnId ?? `between-${hitEvent._id}`;
    if (live.turnDamage.turnId === turnId)
      turnDamage = { turnId, amount: Math.max(0, live.turnDamage.amount - reduced) };
  }

  // Design 5b: heroic-resource gains this hit earned that the revised hit no longer earns. Own
  // triggers link to the hit, other heroes' (the Troubadour's) to the hit and the damaged hero.
  const gains: GainReversal[] = [];
  const pools = new Map<string, number>();
  for (const entry of logged) {
    if (entry.kind !== 'resource.triggered' && entry.kind !== 'resource.forgone') continue;
    const d = data(entry);
    const own = d.useEventId === hitEvent._id && d.characterId === damaged._id;
    const observer = d.useEventId === `${hitEvent._id}:${damaged._id}`;
    if (!own && !observer) continue;
    const hero = await ctx.db.get(d.characterId as Id<'characters'>);
    const heroBaseline = baselineOf(hero?.derivedBaseline);
    const profile = generationProfile(heroBaseline);
    const trigger = profile
      ? triggersFor(profile, heroBaseline).find(t => t.id === d.triggerId)
      : undefined;
    if (!hero?.liveState || !heroBaseline || !trigger) continue;
    // Already reversed by an earlier revision of this hit: its claim was released then.
    if (!(hero.liveState.resourceClaims ?? []).some(claim => claim.eventId === entry._id)) continue;
    const stillTrue =
      trigger.observe === 'damage-taken'
        ? !lost.includes('damage-taken')
        : trigger.observe === 'winded-or-dying'
          ? // resourceTriggers.ts damageSatisfies (Q-RES-2): this revision undoes what earned it.
            !lost.some(event => event === 'made-winded' || event === 'dying') ||
            (revised.staminaBefore > revised.windedValue &&
              revised.staminaAfter <= revised.windedValue) ||
            (revised.staminaBefore > 0 && revised.staminaAfter <= 0)
          : trigger.observe === 'any-hero-winded'
            ? !lost.includes('made-winded')
            : trigger.observe === 'any-hero-dies'
              ? !lost.includes('dead')
              : true;
    if (stillTrue) continue;
    const resource = hero.liveState.heroicResource.name;
    const poolNow = pools.get(hero._id) ?? hero.liveState.heroicResource.current;
    const gain = Number(d.delta ?? 0);
    const { reversed, spent } =
      entry.kind === 'resource.forgone'
        ? { reversed: 0, spent: 0 }
        : unspentGain({
            current: poolNow,
            afterGain: Number(d.after ?? poolNow),
            gain,
            floor: heroicResourceFloor(heroBaseline, resource),
          });
    pools.set(hero._id, poolNow - reversed);
    gains.push({
      characterId: hero._id,
      name: hero.authored.name,
      resource,
      claimEventId: entry._id,
      label: trigger.label,
      before: poolNow,
      after: poolNow - reversed,
      spent,
    });
  }

  // Potency: Parry's Effect ("the potency is decreased by 1") and the potency Spend sections.
  const revisionNode = ability.definition.sections.find(node => node.kind === 'damage-revision');
  const spendNode = ability.definition.sections.find(node => node.kind === 'response-spend');
  const spendPotency =
    options.spend !== undefined && spendNode?.effect.kind === 'potency'
      ? spendNode.effect.scope
      : undefined;
  const scope = revisionNode?.potency === 'any' ? 'any' : spendPotency;
  let ended: PotencyEffect[] = [];
  const potencyReductions = { ...priorPotency };
  if (scope) {
    // Each revision works from the current accepted potency: the earlier reductions of this hit's
    // effects (rule/character/potency.md: applied only while the potency exceeds the score).
    const effects = potencyEffects(hit.compiled, damaged._id).map(e => {
      const prior = priorPotency[e.id] ?? 0;
      if (!prior || e.threshold === undefined || e.targetScore === undefined) return e;
      const threshold = e.threshold - prior;
      return {
        ...e,
        threshold,
        status: e.status === 'applied' && !(e.targetScore < threshold) ? 'resisted' : e.status,
      };
    });
    // A potency condition the engine didn't evaluate is the table's to re-check.
    const unevaluated = effects.filter(
      e => e.threshold === undefined || e.targetScore === undefined,
    );
    if (unevaluated.length)
      notes.push(
        `For the table: ${unevaluated.map(e => e.condition).join(', ')} was not evaluated by the engine; reduce its potency by 1 for ${name} when resolving it (rule/character/potency.md).`,
      );
    const outcome = potencyRevision(effects, scope, options.potencyChoice);
    if (outcome.kind === 'choose')
      refuse(
        `the potency of one effect is reduced, and more than one would change: answer with potency set to one of ${outcome.options.join(', ')}.`,
      );
    if (outcome.kind === 'unknown-choice')
      refuse(`potency names none of this hit's potency effects (${outcome.options.join(', ')}).`);
    if (
      outcome.kind === 'none' &&
      !unevaluated.length &&
      hit.compiled &&
      spendPotency &&
      revisionNode?.potency !== 'any'
    )
      refuse(
        `the damage has no potency effect on ${name}, so the ${spendNode!.cost} section has nothing to reduce; accept without spending.`,
      );
    if (outcome.kind === 'none' && !hit.compiled)
      notes.push(
        `For the table: the hit's effects were recorded for manual resolution; reduce the potency of ${scope === 'one' ? 'one effect' : 'any effect'} of this damage by 1 for ${name} (rule/character/potency.md).`,
      );
    if (outcome.kind === 'revised') {
      ended = outcome.ended;
      for (const e of [...outcome.ended, ...outcome.unchanged])
        potencyReductions[e.id] = (potencyReductions[e.id] ?? 0) + 1;
      for (const effect of ended) {
        const target = { kind: 'character' as const, id: damaged._id };
        if (await hasRolledConditionSave(ctx, target, hitEvent._id))
          refuse(
            `a saving throw was already rolled for the hit's conditions on ${name}; recorded saves are never replayed. Rewind the save first.`,
          );
        if (await replacedByUse(ctx, target, new Set([effect.id])))
          refuse(`the hit's taunt replaced another creature's taunt; rewind to the hit instead.`);
      }
      notes.push(
        ...ended.map(
          e =>
            `Potency ${e.threshold} → ${e.threshold! - 1} against ${name}'s ${e.targetScore}: no longer ${e.condition} (rule/character/potency.md).`,
        ),
        ...outcome.unchanged.map(
          e =>
            `Potency ${e.threshold} → ${e.threshold! - 1} against ${name}'s ${e.targetScore}: ${e.status === 'applied' ? `still ${e.condition}` : `${e.condition} still resisted`}.`,
        ),
      );
    }
  }
  for (const gain of gains)
    notes.push(
      `${gain.name}: ${gain.label} no longer applies — ${gain.resource} ${gain.before} → ${gain.after}${gain.spent ? `; ${gain.spent} of it was already spent and stands (design 5b)` : ''}.`,
    );
  const staminaMaximum = baseline.staminaMaximum.value;
  const staminaAfter = Math.min(staminaMaximum, live.stamina + delta.stamina);
  if (live.stamina + delta.stamina > staminaMaximum)
    notes.push(`Stamina is capped at the maximum of ${staminaMaximum}.`);
  return {
    hitEventId: hitEvent._id,
    damaged,
    current,
    revised,
    stamina: { before: live.stamina, after: staminaAfter },
    temporaryStamina: {
      before: live.temporaryStamina,
      after: live.temporaryStamina + delta.temporaryStamina,
    },
    gains,
    ended,
    potencyReductions,
    lost,
    ...(turnDamage ? { turnDamage } : {}),
    notes,
  };
}

/** Writes a planned revision in the accepting use's journal scope (undo restores the hit). */
export async function commitRevision(
  ctx: MutationCtx,
  scope: JournalScope,
  plan: RevisionPlan,
  label: string,
): Promise<void> {
  const damaged = (await ctx.db.get(plan.damaged._id))!;
  const live = requireHeroLive(damaged);
  await journalPatch(ctx, scope, 'characters', damaged._id, {
    liveState: {
      ...live,
      stamina: plan.stamina.after,
      temporaryStamina: plan.temporaryStamina.after,
      ...(plan.turnDamage ? { turnDamage: plan.turnDamage } : {}),
    },
  });
  // Gains no longer earned: the unspent part leaves the pool, the claim (its limit) is released.
  for (const gain of plan.gains) {
    const hero = (await ctx.db.get(gain.characterId))!;
    const heroLive = requireHeroLive(hero);
    await journalPatch(ctx, scope, 'characters', hero._id, {
      liveState: {
        ...heroLive,
        heroicResource: { ...heroLive.heroicResource, current: gain.after },
        resourceClaims: (heroLive.resourceClaims ?? []).filter(
          claim => claim.eventId !== gain.claimEventId,
        ),
      },
    });
  }
  for (const effect of plan.ended)
    await endConditionInstance(
      ctx,
      scope,
      { kind: 'character', id: plan.damaged._id },
      effect.id,
      `potency reduced by 1 (${label})`,
    );
  // Open offers of this hit for the same creature answer the revised damage from now on.
  const taken = damageTaken(plan.revised);
  const open = await ctx.db
    .query('interactions')
    .withIndex('by_campaign_status', q =>
      q.eq('campaignId', scope.campaignId).eq('status', 'awaiting-input'),
    )
    .take(200);
  for (const card of open) {
    // V175: a Mark card of this hit the revised hit no longer triggers closes; undo reopens it.
    if (card.kind === MARK_OFFER_KIND) {
      if (
        (card.offer as { triggeringEventId?: string } | undefined)?.triggeringEventId ===
          plan.hitEventId &&
        markCardInvalid(card, plan.damaged._id, plan.lost)
      )
        await journalPatch(ctx, scope, 'interactions', card._id, {
          status: 'closed',
          revision: card.revision + 1,
          resolvedEventId: scope.eventId,
          resolvedAt: Date.now(),
        });
      continue;
    }
    const offer = card.offer as TriggerOffer | undefined;
    if (
      card.kind !== OFFER_KIND ||
      !offer ||
      offer.triggeringEventId !== plan.hitEventId ||
      (offer.damaged ?? offer.target).id !== plan.damaged._id
    )
      continue;
    // Q-RES-4: zero damage is not damage taken, so the trigger no longer occurred.
    await journalPatch(
      ctx,
      scope,
      'interactions',
      card._id,
      taken > 0
        ? { offer: { ...offer, damage: taken }, revision: card.revision + 1 }
        : {
            status: 'closed',
            revision: card.revision + 1,
            resolvedEventId: scope.eventId,
            resolvedAt: Date.now(),
          },
    );
  }
  const cause = (await ctx.db.get(scope.eventId))!;
  const hit = (await ctx.db.get(plan.hitEventId))!;
  await appendEvent(ctx, {
    campaignId: scope.campaignId,
    sessionId: cause.sessionId,
    ...(hit.encounterId ? { encounterId: hit.encounterId } : {}),
    origin: 'engine',
    commandId: cause.commandId,
    // The accepting use is caused by the hit (its card opened there); this entry is its consequence
    // and names the hit in `hitEventId`, the revision chain's link (design 5b).
    causeEventId: scope.eventId,
    kind: 'damage.revised',
    description: `${label} revises the hit on ${plan.damaged.authored.name}: ${damageTaken(plan.current)} → ${damageTaken(plan.revised)} damage; Stamina ${plan.stamina.before} → ${plan.stamina.after}${plan.temporaryStamina.after !== plan.temporaryStamina.before ? `, temporary Stamina ${plan.temporaryStamina.before} → ${plan.temporaryStamina.after}` : ''}.${plan.notes.length ? ` ${plan.notes.join(' ')}` : ''}`,
    payload: {
      data: {
        hitEventId: plan.hitEventId,
        responseEventId: scope.eventId,
        damaged: { kind: 'character', id: plan.damaged._id },
        before: plan.current,
        after: plan.revised,
        gains: plan.gains,
        endedConditions: plan.ended.map(e => e.id),
      },
    },
  });
}
