// SPDX-License-Identifier: GPL-3.0-only
/**
 * V173 triggered actions (docs/build/V173-triggered-actions.md,
 * docs/lasting-effects-design.md#4-triggered-actions-and-reactions). A participating hero's compiled
 * triggered ability is offered as a response card on the log entry whose damage set it off:
 * - Holders are written once, at combat commit, from the hero documents that operation already
 *   read (`triggerHolders`), so a damage write finds them with one indexed read.
 * - The damage writer's observation (convex/lib/watchers.ts observeDamage) is the only event
 *   source; there is no second event bus.
 * - A card is an `interactions` row of kind `triggered-offer` whose continuation is the ability's
 *   own `ability.use`, bound to the owning hero; the owning player or the Director answers it
 *   (docs/decisions/2026-09-24-automation-rulings.md, ruling 4). Its row is journaled with the
 *   triggering operation, so undo of that operation withdraws the card.
 * - Eligibility (rule/combat/triggered-action.md) is checked when offered and again when accepted.
 * - Windows (docs/table-spec.md, "Inline interaction cards in the game log"): a card stays open
 *   until the next individual turn starts, the owner commits another ability, it is passed
 *   (`card.close`), or combat ends (closeout closes the encounter's cards).
 * Distance and line of effect have no map: the card names the printed distance and accepting it is
 * the table's confirmation.
 */
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { BoundActor } from '../../shared/commands/envelope';
import {
  distanceNote,
  triggerEligibility,
  triggerTarget,
  triggerTargetFor,
  triggerTargetForTurn,
  type TriggerCreature,
  type TriggerEligibilityInput,
  type TriggerSpec,
} from '../../shared/resolve/triggers';
import type { BoundaryEvent } from '../../shared/contracts/clock';
import { baselineOf } from './characterBuild';
import { committedEncounter } from './encounters';
import { appendEvent } from './events';
import { journalInsert, journalPatch, type JournalScope } from './journal';
import type { TableContext } from './registry';
import { abilitiesFor } from './resolve';
import type { CompiledAbility } from '../../shared/resolve/compileAbility';

export const OFFER_KIND = 'triggered-offer';

/** What a `triggered-offer` card carries (interactions.offer). */
export interface TriggerOffer {
  encounterId: Id<'encounters'>;
  round: number;
  owner: BoundActor;
  abilityId: string;
  abilityName: string;
  actionType: 'triggered action' | 'free triggered action';
  trigger: TriggerSpec;
  target: BoundActor;
  /** The log entry whose damage set the trigger off (V202: the clock's boundary entry). */
  triggeringEventId: Id<'events'>;
  /**
   * The triggering damage: Stamina and temporary Stamina lost, after immunity and weakness. 0 for
   * a V202 turn boundary, which has no damage.
   */
  damage: number;
  /** V202: the turn boundary that set the trigger off, and whose turn it was. */
  boundary?: { kind: 'turn-start' | 'turn-end'; turnId: Id<'turns'>; creature: BoundActor };
  /** V202: the response has its user take their turn after the triggering hero. */
  takesTurn?: boolean;
  /** V202: the optional Spend section of a response that doesn't revise damage. */
  spend?: NonNullable<OfferRevision['spend']>;
  /** V174: the creature that took the triggering damage (the target of a damage-taken response). */
  damaged?: BoundActor;
  /**
   * V174: accepting revises the hit (convex/lib/damageRevisions.ts). `spend` is the optional Spend
   * section, answered with `spend` (and `potency` for "one effect").
   */
  revision?: OfferRevision;
  distance: string;
  /** The card's text, for the log and headless readers. */
  text: string;
}

/** V174: what a card needs to say about a damage-changing response. */
export interface OfferRevision {
  confirm?: 'self-or-adjacent';
  spend?: {
    cost: string;
    resource: string;
    amount: number;
    variable: boolean;
    effect: 'potency-one' | 'potency-any' | 'instruction';
  };
}

/** V174: the card facts of a compiled response that revises the triggering damage, if it is one. */
function offerRevision(definition: CompiledAbility): OfferRevision | undefined {
  const revision = definition.sections.find(node => node.kind === 'damage-revision');
  if (!revision) return undefined;
  const spend = definition.sections.find(node => node.kind === 'response-spend');
  return {
    ...(revision.confirm ? { confirm: revision.confirm } : {}),
    ...(spend
      ? {
          spend: {
            cost: spend.cost,
            resource: spend.resource,
            amount: spend.amount,
            variable: spend.variable,
            effect:
              spend.effect.kind === 'potency'
                ? spend.effect.scope === 'one'
                  ? 'potency-one'
                  : 'potency-any'
                : 'instruction',
          },
        }
      : {}),
  };
}

/**
 * V202: the optional Spend section of a response whose effect is table work (no revision), for the
 * card's "Accept and spend".
 */
function offerSpend(definition: CompiledAbility): TriggerOffer['spend'] | undefined {
  if (definition.sections.some(node => node.kind === 'damage-revision')) return undefined;
  const spend = definition.sections.find(node => node.kind === 'response-spend');
  if (!spend || spend.effect.kind !== 'instruction') return undefined;
  return {
    cost: spend.cost,
    resource: spend.resource,
    amount: spend.amount,
    variable: spend.variable,
    effect: 'instruction',
  };
}

/** V202: the response's effect has its user take their turn after the triggering hero. */
const takesTurn = (definition: CompiledAbility) =>
  definition.sections.some(node => node.kind === 'instruction' && node.shape === 'turn-order');

const side = (kind: string): TriggerCreature['side'] =>
  kind === 'character' ? 'heroes' : 'director';

/**
 * Writes the compiled triggered abilities of the participating heroes. `heroes` are the documents
 * combat commit already read (a large party stays under the per-mutation read limit).
 */
export async function registerTriggerHolders(
  ctx: MutationCtx,
  scope: JournalScope,
  encounterId: Id<'encounters'>,
  heroes: readonly Doc<'characters'>[],
): Promise<void> {
  for (const hero of heroes) {
    if (!hero.liveState) continue;
    const owner: BoundActor = { kind: 'character', id: hero._id, name: hero.authored.name };
    for (const ability of await abilitiesFor(ctx, owner, { character: hero })) {
      const definition =
        ability.compilation?.mode === 'compiled' ? ability.compilation.definition : undefined;
      const actionType = definition?.activation?.actionType;
      if (
        !definition?.trigger ||
        (actionType !== 'triggered action' && actionType !== 'free triggered action')
      )
        continue;
      await journalInsert(ctx, scope, 'triggerHolders', {
        campaignId: scope.campaignId,
        encounterId,
        owner,
        abilityId: ability.abilityId,
        abilityName: ability.name,
        actionType,
        trigger: definition.trigger,
        target: definition.envelope.target,
        distance: definition.envelope.distance,
        sourcePath: ability.source.path,
        ...(offerRevision(definition) ? { revision: offerRevision(definition) } : {}),
        ...(offerSpend(definition) ? { spend: offerSpend(definition) } : {}),
        ...(takesTurn(definition) ? { takesTurn: true } : {}),
      });
    }
  }
}

/** The encounter whose round a triggered action counts against, when turns are being taken. */
export async function roundOf(ctx: MutationCtx, campaignId: Id<'campaigns'>) {
  const campaign = await ctx.db.get(campaignId);
  const encounter = campaign ? await committedEncounter(ctx, campaign) : null;
  if (!encounter || encounter.phase !== 'turns' || (encounter.round ?? 0) < 1) return null;
  return encounter;
}

/**
 * The facts eligibility reads for an owner: whether their ordinary triggered action was used this
 * round (actionUses of this encounter's round), and the printed preventions on them: dazed
 * (condition/dazed.md) and surprised (rule/combat/surprised.md, cleared at the end of round 1).
 */
export async function eligibilityFacts(
  ctx: MutationCtx,
  encounter: Doc<'encounters'>,
  owner: { id: string },
  actionType: TriggerEligibilityInput['actionType'],
  /** V202: the response has its user take their turn, so it needs a turn left this round. */
  needsTurn = false,
): Promise<TriggerEligibilityInput> {
  const round = encounter.round ?? 0;
  const uses = await ctx.db
    .query('actionUses')
    .withIndex('by_encounter_actor', q =>
      q.eq('encounterId', encounter._id).eq('actor.id', owner.id),
    )
    .take(200);
  const ordinaryUsedThisRound = uses.some(
    use => use.round === round && use.actionType === 'triggered action',
  );
  const preventions: TriggerEligibilityInput['preventions'][number][] = [];
  const hero = await ctx.db.get(owner.id as Id<'characters'>);
  if (hero?.liveState?.conditions.dazed) preventions.push('dazed');
  // rule/health/dying.md: dead at Stamina at or below the negative of the winded value (the test
  // respiteOperations.ts uses). A dying hero "can still act" and is still offered.
  const baseline = baselineOf(hero?.derivedBaseline);
  if (hero?.liveState && baseline && hero.liveState.stamina <= -baseline.windedValue.value)
    preventions.push('dead');
  const entries = await ctx.db
    .query('turnEntries')
    .withIndex('by_encounter', q => q.eq('encounterId', encounter._id))
    .take(200);
  if (entries.some(entry => entry.actor.id === owner.id && entry.surprised))
    preventions.push('surprised');
  return {
    actionType,
    ordinaryUsedThisRound,
    preventions,
    ...(needsTurn
      ? {
          turnLeft: entries.some(
            entry => entry.actor.id === owner.id && entry.spentRound !== round,
          ),
        }
      : {}),
  };
}

export interface ObservedDamage {
  damaged: BoundActor;
  dealer?: BoundActor;
  amount: number;
  meleeStrike?: boolean;
}

/**
 * Offers every eligible holder's triggered ability for one damage write, as cards on the
 * triggering log entry (`scope.eventId`). Outside combat there is no round for the one-per-round
 * limit and no turn to close a window, so nothing is offered; the ability is used by hand.
 */
export async function offerForDamage(
  ctx: MutationCtx,
  scope: JournalScope,
  damage: ObservedDamage,
): Promise<void> {
  if (damage.amount <= 0) return;
  const encounter = await roundOf(ctx, scope.campaignId);
  if (!encounter) return;
  const holders = await ctx.db
    .query('triggerHolders')
    .withIndex('by_encounter', q => q.eq('encounterId', encounter._id))
    .take(200);
  if (!holders.length) return;
  const cause = (await ctx.db.get(scope.eventId))!;
  const occurrence = {
    damaged: { id: damage.damaged.id, side: side(damage.damaged.kind) },
    ...(damage.dealer ? { dealer: { id: damage.dealer.id, side: side(damage.dealer.kind) } } : {}),
    amount: damage.amount,
    ...(damage.meleeStrike !== undefined ? { meleeStrike: damage.meleeStrike } : {}),
  };
  for (const holder of holders) {
    const target = triggerTarget(holder.target);
    if (!target) continue;
    const spec = holder.trigger as TriggerSpec;
    const targetId = triggerTargetFor(
      { owner: { id: holder.owner.id, side: side(holder.owner.kind) }, spec, target },
      occurrence,
    );
    if (!targetId) continue;
    const eligibility = triggerEligibility(
      await eligibilityFacts(ctx, encounter, holder.owner, holder.actionType),
    );
    if (!eligibility.eligible) continue;
    const owner = holder.owner as BoundActor;
    const hero = await ctx.db.get(owner.id as Id<'characters'>);
    if (!hero) continue;
    const targetActor =
      targetId === damage.damaged.id ? damage.damaged : (damage.dealer ?? damage.damaged);
    const distance = distanceNote(holder.distance);
    const revision = holder.revision as OfferRevision | undefined;
    // V174: accepting a damage-changing response revises the hit (ruling 3, option B).
    const revises = revision
      ? ` Accepting revises the hit: ${targetActor.name} takes half the damage.${revision.confirm && targetActor.id !== owner.id ? ` Accept only if ${owner.name} ends the shift adjacent to ${targetActor.name}: the table confirms.` : ''}${revision.spend ? ` Optional: ${revision.spend.cost} (answer spend=${revision.spend.amount}${revision.spend.variable ? ' or more' : ''}).` : ''}`
      : '';
    // V202: the Spend section of a response whose effect is table work (My Life for Yours).
    const spend = holder.spend as TriggerOffer['spend'] | undefined;
    const optional = spend
      ? ` Optional: ${spend.cost} (answer spend=${spend.amount}${spend.variable ? ' or more' : ''}).`
      : '';
    const text = `${owner.name} may use ${holder.abilityName} (${holder.actionType}) on ${targetActor.name}: "${spec.text}" Distance ${distance}.${revises}${optional} Other preventions (unconscious, an effect that forbids triggered actions) are the table's check. Accept or pass.`;
    const offer: TriggerOffer = {
      encounterId: encounter._id,
      round: encounter.round ?? 0,
      owner,
      abilityId: holder.abilityId,
      abilityName: holder.abilityName,
      actionType: holder.actionType,
      trigger: spec,
      target: targetActor,
      triggeringEventId: scope.eventId,
      damage: damage.amount,
      damaged: damage.damaged,
      ...(revision ? { revision } : {}),
      ...(spend ? { spend } : {}),
      distance,
      text,
    };
    await journalInsert(ctx, scope, 'interactions', {
      campaignId: scope.campaignId,
      sessionId: cause.sessionId,
      status: 'awaiting-input',
      kind: OFFER_KIND,
      operation: 'ability.use',
      actorLabel: owner.name,
      boundActor: owner,
      requesterId: hero.ownerId,
      requiredInputs: [],
      continuation: {
        schemaVersion: 1,
        campaignId: scope.campaignId,
        operation: 'ability.use',
        actor: { refKind: 'character', id: owner.id },
        arguments: {
          ability: holder.abilityId,
          targets: [{ refKind: targetActor.kind, id: targetActor.id }],
        },
      },
      revision: 0,
      openedEventId: scope.eventId,
      resolvedEventId: null,
      answer: null,
      createdAt: Date.now(),
      resolvedAt: null,
      offer,
    });
    await appendEvent(ctx, {
      campaignId: scope.campaignId,
      sessionId: cause.sessionId,
      encounterId: cause.encounterId,
      origin: 'engine',
      commandId: cause.commandId,
      causeEventId: scope.eventId,
      kind: 'trigger.offered',
      description: `Offer: ${text}`,
      payload: { data: { ...offer, sourcePath: holder.sourcePath } },
    });
  }
}

/**
 * V202: offers every eligible holder's triggered ability for one turn boundary, as cards on the
 * clock's boundary entry (`boundaryEventId`), after the boundary's own work has fired (so a holder
 * that work left dead or dazed is not offered). Journaled with the operation that caused the
 * boundary (Take turn, End turn), so undo of it withdraws the cards. One indexed holder read per
 * boundary; a hero is read only for a matching holder.
 */
export async function offerForBoundary(
  ctx: MutationCtx,
  scope: JournalScope,
  encounterId: Id<'encounters'>,
  event: BoundaryEvent,
  boundaryEventId: Id<'events'>,
): Promise<void> {
  if ((event.kind !== 'turn-start' && event.kind !== 'turn-end') || !event.turn) return;
  const boundary = event.kind;
  const encounter = await roundOf(ctx, scope.campaignId);
  if (!encounter || encounter._id !== encounterId) return;
  const holders = await ctx.db
    .query('triggerHolders')
    .withIndex('by_encounter', q => q.eq('encounterId', encounterId))
    .take(200);
  const relevant = holders.filter(holder => (holder.trigger as TriggerSpec).event === boundary);
  if (!relevant.length) return;
  const turn = await ctx.db.get(event.turn.turnId as Id<'turns'>);
  if (!turn) return;
  const creature = turn.actor as BoundActor;
  const cause = (await ctx.db.get(boundaryEventId))!;
  for (const holder of relevant) {
    const target = triggerTarget(holder.target);
    if (!target) continue;
    const spec = holder.trigger as TriggerSpec;
    const targetId = triggerTargetForTurn(
      { owner: { id: holder.owner.id, side: side(holder.owner.kind) }, spec, target },
      {
        boundary,
        creature: { id: creature.id, side: turn.side },
        hero: creature.kind === 'character',
        startedByThis: turn.startedBy?.sourcePath === holder.sourcePath,
      },
    );
    if (!targetId) continue;
    const eligibility = triggerEligibility(
      await eligibilityFacts(
        ctx,
        encounter,
        holder.owner,
        holder.actionType,
        holder.takesTurn === true,
      ),
    );
    if (!eligibility.eligible) continue;
    const owner = holder.owner as BoundActor;
    const hero = await ctx.db.get(owner.id as Id<'characters'>);
    if (!hero) continue;
    const targetActor = targetId === creature.id ? creature : owner;
    const distance = distanceNote(holder.distance);
    const spend = holder.spend as TriggerOffer['spend'] | undefined;
    const when = `${creature.name}'s turn ${boundary === 'turn-start' ? 'start' : 'end'}`;
    const text = `${owner.name} may use ${holder.abilityName} (${holder.actionType})${targetActor.id === owner.id && target.others === 'none' ? '' : ` on ${targetActor.name}`} at ${when}: "${spec.text}"${spec.within ? ` ${creature.name} within ${spec.within} squares: the table confirms.` : ''} Distance ${distance}.${spend ? ` Optional: ${spend.cost} (answer spend=${spend.amount}${spend.variable ? ' or more' : ''}).` : ''}${holder.takesTurn ? ` Accepting lets ${owner.name} take their turn next, after ${creature.name}.` : ''} Other preventions (unconscious, an effect that forbids triggered actions) are the table's check. Accept or pass.`;
    const offer: TriggerOffer = {
      encounterId,
      round: encounter.round ?? 0,
      owner,
      abilityId: holder.abilityId,
      abilityName: holder.abilityName,
      actionType: holder.actionType,
      trigger: spec,
      target: targetActor,
      triggeringEventId: boundaryEventId,
      damage: 0,
      boundary: { kind: boundary, turnId: turn._id, creature },
      ...(holder.takesTurn ? { takesTurn: true } : {}),
      ...(spend ? { spend } : {}),
      distance,
      text,
    };
    await journalInsert(ctx, scope, 'interactions', {
      campaignId: scope.campaignId,
      sessionId: cause.sessionId,
      status: 'awaiting-input',
      kind: OFFER_KIND,
      operation: 'ability.use',
      actorLabel: owner.name,
      boundActor: owner,
      requesterId: hero.ownerId,
      requiredInputs: [],
      continuation: {
        schemaVersion: 1,
        campaignId: scope.campaignId,
        operation: 'ability.use',
        actor: { refKind: 'character', id: owner.id },
        arguments: {
          ability: holder.abilityId,
          targets: [{ refKind: targetActor.kind, id: targetActor.id }],
        },
      },
      revision: 0,
      openedEventId: boundaryEventId,
      resolvedEventId: null,
      answer: null,
      createdAt: Date.now(),
      resolvedAt: null,
      offer,
    });
    await appendEvent(ctx, {
      campaignId: scope.campaignId,
      sessionId: cause.sessionId,
      encounterId,
      origin: 'engine',
      commandId: cause.commandId,
      causeEventId: boundaryEventId,
      kind: 'trigger.offered',
      description: `Offer: ${text}`,
      payload: { data: { ...offer, sourcePath: holder.sourcePath } },
    });
  }
}

/**
 * Whether a correction's changed damage would set off a holder's trigger. A correction never
 * re-derives an offer (design section 7): the table rewinds to the use instead.
 */
export async function assertNoTriggerOnCorrection(
  ctx: MutationCtx,
  scope: JournalScope,
  damage: ObservedDamage,
): Promise<void> {
  if (damage.amount === 0) return;
  const encounter = await roundOf(ctx, scope.campaignId);
  if (!encounter) return;
  const holders = await ctx.db
    .query('triggerHolders')
    .withIndex('by_encounter', q => q.eq('encounterId', encounter._id))
    .take(200);
  const occurrence = {
    damaged: { id: damage.damaged.id, side: side(damage.damaged.kind) },
    ...(damage.dealer ? { dealer: { id: damage.dealer.id, side: side(damage.dealer.kind) } } : {}),
    // Either direction: less damage can remove a trigger as more damage can create one.
    amount: Math.abs(damage.amount),
    ...(damage.meleeStrike !== undefined ? { meleeStrike: damage.meleeStrike } : {}),
  };
  for (const holder of holders) {
    const target = triggerTarget(holder.target);
    if (
      target &&
      triggerTargetFor(
        {
          owner: { id: holder.owner.id, side: side(holder.owner.kind) },
          spec: holder.trigger as TriggerSpec,
          target,
        },
        occurrence,
      )
    )
      throw new ConvexError(
        `${holder.owner.name}'s ${holder.abilityName} is a triggered action this damage sets off, and a correction can't re-derive its offer. Rewind to the use and record it again instead.`,
      );
  }
}

/** V175: Mark cards (convex/lib/marks.ts) share the offer windows. */
export const MARK_OFFER_KIND = 'mark-offer';

/** The open offer cards of this encounter (a bounded read of pending cards). */
async function openOffers(ctx: MutationCtx, campaignId: Id<'campaigns'>) {
  const cards = await ctx.db
    .query('interactions')
    .withIndex('by_campaign_status', q =>
      q.eq('campaignId', campaignId).eq('status', 'awaiting-input'),
    )
    .take(200);
  return cards.filter(card => card.kind === OFFER_KIND || card.kind === MARK_OFFER_KIND);
}

async function closeOffer(
  ctx: MutationCtx,
  scope: JournalScope,
  card: Doc<'interactions'>,
): Promise<void> {
  await journalPatch(ctx, scope, 'interactions', card._id, {
    status: 'closed',
    revision: card.revision + 1,
    resolvedEventId: scope.eventId,
    resolvedAt: Date.now(),
  });
}

/**
 * The outer window: a new individual turn closes every open offer of the encounter
 * (docs/table-spec.md, "Standing action-card/prompt window").
 */
export async function expireOffersAtTurnStart(
  ctx: MutationCtx,
  scope: JournalScope,
  encounterId: Id<'encounters'>,
): Promise<void> {
  for (const card of await openOffers(ctx, scope.campaignId))
    if ((card.offer as TriggerOffer | undefined)?.encounterId === encounterId)
      await closeOffer(ctx, scope, card);
}

/**
 * The early close: committing an unrelated ability passes the character's earlier unused offers
 * (docs/table-spec.md, "Confirmed early-close refinement"). A response to the same trigger as the
 * card being answered (`keepTriggeringEventId`) is not unrelated and stays open.
 */
export async function closeOffersOnPlay(
  ctx: MutationCtx,
  scope: JournalScope,
  actor: { id: string },
  keepTriggeringEventId?: string,
): Promise<void> {
  for (const card of await openOffers(ctx, scope.campaignId)) {
    const offer = card.offer as TriggerOffer | undefined;
    // V202: a response to a creature's turn start also closes when that creature commits play on
    // it (docs/table-spec.md, "Clarified existing precedent": the cutoff follows the triggering
    // event and subsequent play by the affected character).
    const affected =
      offer?.boundary?.kind === 'turn-start' && offer.boundary.creature.id === actor.id;
    if (
      !offer ||
      (offer.owner.id !== actor.id && !affected) ||
      offer.triggeringEventId === keepTriggeringEventId
    )
      continue;
    // V175: a card this very use opened (the Tactician's own hit on a creature they marked) is not
    // an earlier offer.
    if (offer.triggeringEventId === scope.eventId) continue;
    await closeOffer(ctx, scope, card);
  }
}

/** The offer a card response answers, when it is a triggered-action card. */
export async function offerOf(
  ctx: MutationCtx,
  interactionId: Id<'interactions'>,
): Promise<{ card: Doc<'interactions'>; offer: TriggerOffer } | null> {
  const card = await ctx.db.get(interactionId);
  if (!card || card.kind !== OFFER_KIND || !card.offer) return null;
  return { card, offer: card.offer as TriggerOffer };
}

/**
 * Accepting re-checks the card against current state (design section 4): the same encounter and
 * round's turns are running, the arguments still name the offered ability and target, and the
 * owner is still eligible. Cost is re-checked by the use itself.
 */
export async function recheckOffer(
  ctx: MutationCtx,
  context: TableContext,
  offer: TriggerOffer,
  use: { abilityId: string; actorId: string; targetIds: string[] },
): Promise<void> {
  const encounter = await roundOf(ctx, context.campaign._id);
  if (!encounter || encounter._id !== offer.encounterId)
    throw new ConvexError('This offer’s combat is no longer running.');
  // A stale card can't spend a later round's allowance.
  if ((encounter.round ?? 0) !== offer.round)
    throw new ConvexError(`This offer was for round ${offer.round}; its window has passed.`);
  if (
    use.abilityId !== offer.abilityId ||
    use.actorId !== offer.owner.id ||
    use.targetIds.length !== 1 ||
    use.targetIds[0] !== offer.target.id
  )
    throw new ConvexError(
      `This card offers ${offer.abilityName} on ${offer.target.name}; answer it without changing the ability or target.`,
    );
  const eligibility = triggerEligibility(
    await eligibilityFacts(ctx, encounter, offer.owner, offer.actionType, offer.takesTurn === true),
  );
  if (!eligibility.eligible)
    throw new ConvexError(
      `${offer.owner.name} can't use ${offer.abilityName} now: ${offer.owner.name} ${eligibility.reason}.`,
    );
}

/**
 * The acceptance order of a response among the responses to the same trigger. Players order their
 * own responses by the order they accept them (rule/combat/triggered-action.md); the engine never
 * resolves a response by arrival, so nothing resolves until someone accepts it.
 */
export async function acceptanceOrder(
  ctx: MutationCtx,
  campaignId: Id<'campaigns'>,
  offer: TriggerOffer,
): Promise<number> {
  const answered = (
    await ctx.db
      .query('interactions')
      .withIndex('by_campaign_status', q => q.eq('campaignId', campaignId).eq('status', 'resolved'))
      .order('desc')
      .take(200)
  ).filter(
    other =>
      other.kind === OFFER_KIND &&
      (other.offer as TriggerOffer | undefined)?.triggeringEventId === offer.triggeringEventId,
  ).length;
  return answered + 1;
}

/** Resolves the answered card in the use's journal scope, so undo of the acceptance reopens it. */
export async function resolveOffer(
  ctx: MutationCtx,
  scope: JournalScope,
  card: Doc<'interactions'>,
  answer: unknown,
): Promise<void> {
  await journalPatch(ctx, scope, 'interactions', card._id, {
    status: 'resolved',
    revision: card.revision + 1,
    resolvedEventId: scope.eventId,
    answer,
    resolvedAt: Date.now(),
  });
}
