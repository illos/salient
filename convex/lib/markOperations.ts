// SPDX-License-Identifier: GPL-3.0-only
/**
 * V175 Mark operations (docs/build/V175-marks.md): the continuations of the two Mark cards that
 * convex/lib/marks.ts offers, registered in convex/lib/registry.ts so the card, the palette, slash
 * text and headless calls share one route. Kept apart from marks.ts, which the damage writer
 * imports, so the operation modules keep their import order.
 */
import { ConvexError, v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { BoundActor, Reference } from '../../shared/commands/envelope';
import type { MarkBenefitKind } from '../../shared/contracts/liveState';
import { benefitTaken, planMarkBenefit, type MarkSpec } from '../../shared/resolve/marks';
import { heroicResourceFloor } from '../../shared/resolve/resourceFloor';
import { applyDamage } from '../../shared/resolve/index';
import { triggerEligibility } from '../../shared/resolve/triggers';
import { baselineOf, requireHeroLive } from './characterBuild';
import {
  endReusedEffects,
  patchEffectInstance,
  readHolder,
  type EffectHolder,
} from './effectInstances';
import { resolveHistoricalId } from './history';
import { journalPatch, type JournalScope } from './journal';
import type { OperationDefinition, Outcome, TableContext } from './registry';
import { abilitiesFor, damageTargetFacts, writePlannedDamage, type TargetRecord } from './resolve';
import { appendEvent } from './events';
import { allowanceFor, bindTarget, planTracking, recordUse } from './abilityOperations';
import { MARK_OFFER_KIND, eligibilityFacts, roundOf } from './triggeredActions';
import { applyMark, type MarkOffer } from './marks';

// ---------------------------------------------------------------------------------------------
// Operations: the continuations of the two Mark cards.

/** The Mark card this execution answers, re-checked against current state (design section 4). */
async function answeredCard(
  ctx: MutationCtx,
  context: TableContext,
  interactionId: Id<'interactions'> | undefined,
  kind: MarkOffer['mark']['kind'],
  actor: BoundActor,
): Promise<{ card: Doc<'interactions'>; offer: MarkOffer; encounter: Doc<'encounters'> }> {
  const card = interactionId ? await ctx.db.get(interactionId) : null;
  const offer = card?.offer as MarkOffer | undefined;
  if (!card || card.kind !== MARK_OFFER_KIND || offer?.mark.kind !== kind)
    throw new ConvexError(
      kind === 'benefit'
        ? 'A Mark benefit answers its card: use /card respond on the Mark benefit card, or record "Mark: Trigger" by hand.'
        : 'A Mark retarget answers its card: use /card respond on the retarget card, or record "Mark: Retarget" by hand.',
    );
  if (offer.owner.id !== actor.id)
    throw new ConvexError(`This card is ${offer.owner.name}'s Mark, not ${actor.name}'s.`);
  const encounter = await roundOf(ctx, context.campaign._id);
  if (!encounter || encounter._id !== offer.encounterId)
    throw new ConvexError('This offer’s combat is no longer running.');
  if ((encounter.round ?? 0) !== offer.round)
    throw new ConvexError(`This offer was for round ${offer.round}; its window has passed.`);
  const eligibility = triggerEligibility(
    await eligibilityFacts(ctx, encounter, offer.owner, 'free triggered action'),
  );
  if (!eligibility.eligible)
    throw new ConvexError(
      `${offer.owner.name} can't use a free triggered action now: ${offer.owner.name} ${eligibility.reason}.`,
    );
  return { card, offer, encounter };
}

async function resolveCard(
  ctx: MutationCtx,
  scope: JournalScope,
  card: Doc<'interactions'>,
  answer: unknown,
) {
  await journalPatch(ctx, scope, 'interactions', card._id, {
    status: 'resolved',
    revision: card.revision + 1,
    resolvedEventId: scope.eventId,
    answer,
    resolvedAt: Date.now(),
  });
}

/** The free triggered action is recorded against the owner's allowance (it doesn't count). */
async function recordFreeTriggered(
  ctx: MutationCtx,
  scope: JournalScope,
  context: TableContext,
  owner: BoundActor,
  label: string,
  keepTriggeringEventId: string,
) {
  const allowance = await allowanceFor(ctx, context, owner);
  await recordUse(
    ctx,
    scope,
    allowance,
    owner,
    'free triggered action',
    label,
    planTracking(allowance, owner, 'free triggered action'),
    { keepTriggeringEventId },
  );
}

const markBenefit: OperationDefinition = {
  id: 'mark.benefit',
  family: 'mark',
  verb: 'benefit',
  title: 'Gain a Mark benefit',
  description:
    'Answer a Mark benefit card (feature/ability/tactician/level-1/mark.md): spend 1 focus for one printed benefit as a free triggered action. Extra damage (twice your Reason) and the dealer’s Recovery are applied when the engine can; the shift and the taunt are table work. One benefit per trigger.',
  args: { benefit: v.string() },
  argDescriptions: {
    benefit: 'One of the card’s benefits: extra-damage, recovery, shift or taunt.',
  },
  roles: ['director', 'player'],
  session: 'running',
  actor: 'required',
  execute: async (ctx, { context, actor, args, respondsTo }): Promise<Outcome> => {
    const { card, offer } = await answeredCard(
      ctx,
      context,
      respondsTo?.interactionId,
      'benefit',
      actor!,
    );
    const chosen = String(args.benefit) as MarkBenefitKind;
    const options = offer.mark.options ?? [];
    if (!options.some(option => option.kind === chosen))
      throw new ConvexError(
        `This trigger offers ${options.map(o => o.kind).join(', ')}; "${String(args.benefit)}" is not one of them.`,
      );
    const holder: EffectHolder = {
      kind: offer.mark.holder.kind,
      id: await resolveHistoricalId(ctx, context.campaign._id, offer.mark.holder.id),
    };
    const record = await readHolder(ctx, holder);
    const found = record?.effectInstances.find(item => item.id === offer.mark.instanceId);
    // The trigger happened while the creature was marked, so the order in which the owner answers
    // this trigger's cards doesn't matter: a mark ended afterwards by the same trigger's retarget
    // (mark.retarget answering a card of this triggering event) still gives its benefit.
    const endedByRetarget =
      found?.status === 'ended' && found.endedEventId
        ? await (async () => {
            const ender = await ctx.db.get(found.endedEventId as Id<'events'>);
            const data = (ender?.payload as { data?: { triggeringEventId?: string } } | undefined)
              ?.data;
            return (
              ender?.kind === 'mark.retarget' && data?.triggeringEventId === offer.triggeringEventId
            );
          })()
        : false;
    const instance = found?.status === 'active' || endedByRetarget ? found : undefined;
    if (!instance)
      throw new ConvexError(
        `${offer.owner.name}'s mark on ${offer.mark.subject.name} has ended; its benefit can no longer be gained.`,
      );
    // mark.md: "You can't gain more than one benefit from the same trigger."
    if (benefitTaken(instance.markBenefits, offer.triggeringEventId))
      throw new ConvexError(
        `${offer.owner.name} already gained a Mark benefit from this trigger (mark.md: "You can't gain more than one benefit from the same trigger").`,
      );
    // The cost: 1 focus (mark.md), checked again when accepted.
    const owner = await ctx.db.get(offer.owner.id as Id<'characters'>);
    const ownerLive = owner?.liveState;
    const ownerBaseline = owner ? baselineOf(owner.derivedBaseline) : null;
    if (!owner || !ownerLive || !ownerBaseline)
      throw new ConvexError(`${offer.owner.name} has no live record.`);
    const pool = ownerLive.heroicResource;
    const floor = heroicResourceFloor(ownerBaseline, 'focus');
    if (pool.name.toLowerCase() !== 'focus' || pool.current - 1 < floor)
      throw new ConvexError(
        `${offer.owner.name} can't spend 1 focus (focus ${pool.current}). The card stays open.`,
      );
    // The marked creature and the dealer, as they are now.
    const subjectRecord: TargetRecord | null =
      holder.kind === 'foe'
        ? await (async () => {
            const foe = await ctx.db.get(holder.id as Id<'foes'>);
            if (!foe) return null;
            const squad = foe.squadId ? await ctx.db.get(foe.squadId) : null;
            return {
              actor: { kind: 'foe', id: foe._id, name: foe.name },
              foe,
              ...(squad ? { squad } : {}),
            };
          })()
        : null;
    const facts = subjectRecord && !subjectRecord.squad ? damageTargetFacts(subjectRecord) : null;
    const dealerRef = offer.mark.dealer!;
    const dealer =
      dealerRef.kind === 'character'
        ? await ctx.db.get(
            (await resolveHistoricalId(
              ctx,
              context.campaign._id,
              dealerRef.id,
            )) as Id<'characters'>,
          )
        : null;
    const dealerBaseline = dealer ? baselineOf(dealer.derivedBaseline) : null;
    const plan = planMarkBenefit(chosen, {
      reason: ownerBaseline.characteristics.R.value,
      target: {
        damageable: !!facts && 'facts' in facts,
        immunityOrWeakness:
          !!facts &&
          'facts' in facts &&
          ((facts.facts.immunities?.length ?? 0) > 0 || (facts.facts.weaknesses?.length ?? 0) > 0),
        name: offer.mark.subject.name,
      },
      dealer: { hero: !!dealer?.liveState && !!dealerBaseline, name: dealerRef.name },
      ownerName: offer.owner.name,
    });
    let applied = '';
    let damage: { record: TargetRecord; application: ReturnType<typeof applyDamage> } | undefined;
    let recovery:
      | { character: Doc<'characters'>; stamina: number; recoveries: number; healed: number }
      | undefined;
    if (plan.status === 'apply' && plan.kind === 'extra-damage' && facts && 'facts' in facts) {
      const application = applyDamage(facts.facts, {
        targetId: facts.facts.targetId,
        amount: plan.amount,
        causeLabel: `${offer.owner.name}'s Mark`,
      });
      damage = { record: subjectRecord!, application };
      // Interpretation (Q-MARK-1 point 7): only the marked creature whose damage set off the
      // trigger takes it; the alternative is every creature the ability damaged. The Stamina
      // figures are logged from the write itself (the linked entry below).
      applied = `${offer.mark.subject.name} takes ${plan.amount} extra damage (twice ${offer.owner.name}'s Reason ${ownerBaseline.characteristics.R.value}); the linked entry records the Stamina change.`;
    }
    if (
      plan.status === 'apply' &&
      plan.kind === 'recovery' &&
      dealer?.liveState &&
      dealerBaseline
    ) {
      // rule/health/recoveries.md: spending a Recovery regains Stamina equal to the recovery value,
      // up to the Stamina maximum (as hero.recover and Catch Breath apply it).
      const live = dealer.liveState;
      if (live.recoveries < 1)
        throw new ConvexError(
          `${dealerRef.name} has no Recoveries left to spend; choose another benefit. The card stays open.`,
        );
      const stamina = Math.min(
        dealerBaseline.staminaMaximum.value,
        live.stamina + dealerBaseline.recoveryValue.value,
      );
      recovery = {
        character: dealer,
        stamina,
        recoveries: live.recoveries - 1,
        healed: stamina - live.stamina,
      };
      applied = `${dealerRef.name} spends a Recovery (${live.recoveries} → ${live.recoveries - 1}) and regains ${stamina - live.stamina} Stamina (${live.stamina} → ${stamina}).`;
    }
    if (plan.status === 'instruction') applied = `For the table: ${plan.text}`;
    const description = `${offer.owner.name} spends 1 focus (${pool.current} → ${pool.current - 1}) for a Mark benefit (free triggered action) on ${offer.mark.subject.name}: ${chosen}. ${applied}`;
    return {
      kind: 'mark.benefit',
      description,
      data: {
        benefit: chosen,
        plan,
        markInstanceId: instance.id,
        triggeringEventId: offer.triggeringEventId,
        interactionId: card._id,
        cost: { resource: 'focus', amount: 1, before: pool.current, after: pool.current - 1 },
        ...(recovery
          ? { recovery: { characterId: recovery.character._id, healed: recovery.healed } }
          : {}),
        sourcePath: instance.sourcePath,
      },
      commit: async (mctx, scope) => {
        await resolveCard(mctx, scope, card, respondsTo!.answer);
        const current = requireHeroLive((await mctx.db.get(owner._id))!);
        await journalPatch(mctx, scope, 'characters', owner._id, {
          liveState: {
            ...current,
            heroicResource: {
              ...current.heroicResource,
              current: current.heroicResource.current - 1,
            },
          },
        });
        await patchEffectInstance(mctx, scope, holder, instance.id, stored => ({
          ...stored,
          markBenefits: [
            ...(stored.markBenefits ?? []),
            { triggeringEventId: offer.triggeringEventId, benefit: chosen, eventId: scope.eventId },
          ].slice(-200),
        }));
        if (recovery) {
          const live = requireHeroLive((await mctx.db.get(recovery.character._id))!);
          await journalPatch(mctx, scope, 'characters', recovery.character._id, {
            liveState: { ...live, stamina: recovery.stamina, recoveries: recovery.recoveries },
          });
        }
        // The extra damage is part of the ability's damage (mark.md, "The ability deals extra
        // damage"): it changes Stamina, winded and 0 Stamina, but is not a second damage event.
        if (damage) {
          const written = await writePlannedDamage(mctx, scope, damage.record, damage.application, {
            dealer: {
              kind: dealerRef.kind as 'character' | 'foe',
              id: dealerRef.id,
              name: dealerRef.name,
            },
            partOfHit: true,
          });
          const cause = (await mctx.db.get(scope.eventId))!;
          await appendEvent(mctx, {
            campaignId: scope.campaignId,
            sessionId: cause.sessionId,
            encounterId: cause.encounterId,
            origin: 'engine',
            commandId: cause.commandId,
            causeEventId: scope.eventId,
            kind: 'mark.extra-damage',
            description: `${offer.mark.subject.name} takes ${written.afterImmunity} extra damage from ${offer.owner.name}'s Mark; Stamina ${written.staminaBefore} → ${written.staminaAfter}${written.absorbedByTemporaryStamina ? ` (${written.absorbedByTemporaryStamina} absorbed by temporary Stamina)` : ''}.`,
            payload: { data: { application: written, sourcePath: instance.sourcePath } },
          });
        }
        await recordFreeTriggered(
          mctx,
          scope,
          context,
          offer.owner,
          'Mark benefit',
          offer.triggeringEventId,
        );
      },
    };
  },
};

const referenceValidator = v.union(
  v.object({ name: v.string() }),
  v.object({ refKind: v.string(), id: v.string() }),
);

const markRetarget: OperationDefinition = {
  id: 'mark.retarget',
  family: 'mark',
  verb: 'retarget',
  title: 'Mark a new target',
  description:
    'Answer a Mark retarget card (feature/ability/tactician/level-1/mark.md): when a creature you marked is reduced to 0 Stamina, use a free triggered action to mark a new target within distance. The new mark follows the Mark’s printed lifecycle.',
  args: { targets: v.array(referenceValidator) },
  argDescriptions: { targets: 'The new target, one creature, as [@Name].' },
  roles: ['director', 'player'],
  session: 'running',
  actor: 'required',
  execute: async (ctx, { context, actor, args, respondsTo }): Promise<Outcome> => {
    const { card, offer, encounter } = await answeredCard(
      ctx,
      context,
      respondsTo?.interactionId,
      'retarget',
      actor!,
    );
    const references = args.targets as Reference[];
    if (references.length !== 1)
      throw new ConvexError('Mark a new target: give exactly one creature (mark.md).');
    const target = await bindTarget(ctx, context, references[0]!, actor);
    // rule/combat/target.md: you aren't an eligible target of your own ability unless it says so;
    // the Mark targets "One creature".
    if (target.actor.id === offer.owner.id)
      throw new ConvexError(
        `${offer.owner.name} can't mark themself (the Mark targets one creature).`,
      );
    if (target.squad)
      throw new ConvexError(
        `${target.actor.name} is in a squad, which holds no mark the engine tracks; record "Mark: Retarget" by hand instead.`,
      );
    if (target.actor.kind !== 'character' && target.actor.kind !== 'foe')
      throw new ConvexError('The Mark targets one creature.');
    const holder: EffectHolder = {
      kind: offer.mark.holder.kind,
      id: await resolveHistoricalId(ctx, context.campaign._id, offer.mark.holder.id),
    };
    const old = (await readHolder(ctx, holder))?.effectInstances.find(
      item => item.id === offer.mark.instanceId,
    );
    const spec = (await markSpecOf(ctx, context, offer.owner, offer.abilityId)) ?? undefined;
    if (!spec || !old)
      throw new ConvexError(`${offer.owner.name}'s Mark is no longer one the engine resolves.`);
    const description = `${offer.owner.name} uses a free triggered action to mark ${target.actor.name} (${offer.mark.distance ?? 'within distance'}: accepting confirms it), after ${offer.mark.subject.name} was reduced to 0 Stamina.`;
    return {
      kind: 'mark.retarget',
      description,
      data: {
        target: target.actor,
        previous: { instanceId: old.id, subject: offer.mark.subject },
        triggeringEventId: offer.triggeringEventId,
        interactionId: card._id,
        sourcePath: old.sourcePath,
        interpretation:
          'Q-MARK-1: the new mark is a Mark mark with the printed lifecycle, so the earlier Mark marks end ("until you use this ability again").',
      },
      commit: async (mctx, scope) => {
        await resolveCard(mctx, scope, card, respondsTo!.answer);
        // Q-MARK-1 (labelled interpretation): marking a new target is a use of the Mark, so the
        // owner's earlier Mark marks end, as "until you use this ability again" says.
        await endReusedEffects(mctx, scope, offer.owner, offer.abilityId);
        const event = (await mctx.db.get(scope.eventId))!;
        await applyMark(
          mctx,
          scope,
          {
            id: JSON.stringify([scope.eventId, 'mark.retarget', target.actor.id]),
            owner: offer.owner,
            subject: {
              kind: target.actor.kind as 'character' | 'foe',
              id: target.actor.id,
              name: target.actor.name,
            },
            sourceUseEventId: scope.eventId,
            abilityId: offer.abilityId,
            abilityName: offer.abilityName,
            sourcePath: old.sourcePath,
            clause: old.clause,
            spec,
            appliedSequence: event.sequence,
          },
          encounter._id,
        );
        await recordFreeTriggered(
          mctx,
          scope,
          context,
          offer.owner,
          'Mark (new target)',
          offer.triggeringEventId,
        );
      },
    };
  },
};

/** The owner's compiled Mark spec, read from their current ability list (never from the card). */
async function markSpecOf(
  ctx: MutationCtx,
  context: TableContext,
  owner: BoundActor,
  abilityId: string,
): Promise<MarkSpec | null> {
  const character = await ctx.db.get(owner.id as Id<'characters'>);
  if (!character || character.campaignId !== context.campaign._id) return null;
  const ability = (await abilitiesFor(ctx, owner, { character })).find(
    item => item.abilityId === abilityId,
  );
  const node =
    ability?.compilation?.mode === 'compiled'
      ? ability.compilation.definition.sections.find(section => section.kind === 'mark')
      : undefined;
  return node?.kind === 'mark' ? node.spec : null;
}

export const markOperations: OperationDefinition[] = [markBenefit, markRetarget];
