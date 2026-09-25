// SPDX-License-Identifier: GPL-3.0-only
/**
 * V175 marks (docs/build/V175-marks.md, docs/lasting-effects-design.md#5-marks-and-similar-statuses).
 * A mark is an effect instance of kind `mark` on the marked creature, owned by the Tactician who
 * marked it (feature/ability/tactician/level-1/mark.md):
 * - Storing a mark ends every other Tactician's mark on that creature first ("if another tactician
 *   marks a creature, your mark on that creature ends"): a source exception to "Stacking Unique
 *   Effects", applied here explicitly rather than through the generic stacking boundary.
 * - It lasts until the end of the encounter (clock), until the owner is dying (the damage writer,
 *   V158 `owner-dying`) or until the owner uses Mark again (`reused`); it can be ended willingly
 *   with `effect.end`, which takes no action.
 * - Its edge is an automatic contribution to power rolls against the marked creature by the owner
 *   and the owner's allies (shared/resolve/modifiers.ts), which the table excludes with `exclude`.
 * - The damage writer's observation (convex/lib/watchers.ts observeDamage) is the only event
 *   source: rolled damage from the owner or an ally offers the owner a benefit card, the creature
 *   reduced to 0 Stamina offers a retarget card, and `marked-damaged` watchers (Hit 'Em Hard!, Stay
 *   Strong and Focus!) fire. Cards share the V173 windows (convex/lib/triggeredActions.ts).
 * Every write is journaled in the operation that makes it, so undo restores it.
 */
import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { BoundActor } from '../../shared/commands/envelope';
import type {
  EffectInstance,
  EffectParty,
  MarkBenefitKind,
} from '../../shared/contracts/liveState';
import { describeDuration } from '../../shared/resolve/lastingEffects';
import {
  MARK_BENEFITS,
  markBenefitOptions,
  ownerOrAlly,
  type MarkParty,
  type MarkSpec,
} from '../../shared/resolve/marks';
import { distanceNote, triggerEligibility } from '../../shared/resolve/triggers';
import {
  applyEffectInstance,
  endEffectInstance,
  readHolder,
  type EffectHolder,
} from './effectInstances';
import { appendEvent } from './events';
import { resolveHistoricalId } from './history';
import { journalInsert, type JournalScope } from './journal';
import { MARK_OFFER_KIND, eligibilityFacts, roundOf } from './triggeredActions';
import type { DamageObservation, ObserveOptions } from './watchers';

export { MARK_OFFER_KIND };

/** What a Mark card carries (interactions.offer); the shared window fields match TriggerOffer. */
export interface MarkOffer {
  encounterId: Id<'encounters'>;
  round: number;
  owner: BoundActor;
  abilityId: string;
  abilityName: string;
  actionType: 'free triggered action';
  /** The log entry whose damage set the trigger off. */
  triggeringEventId: Id<'events'>;
  text: string;
  mark: {
    kind: 'benefit' | 'retarget';
    instanceId: string;
    holder: EffectHolder;
    subject: BoundActor;
    sourcePath: string;
    /** `benefit`: the creature dealing the damage, and the benefits this trigger offers. */
    dealer?: BoundActor;
    meleeAbility?: boolean;
    options?: { kind: MarkBenefitKind; text: string }[];
    cost?: { resource: 'focus'; amount: 1 };
    /** `retarget`: the printed distance, and the other creatures in the encounter to pick from. */
    distance?: string;
    candidates?: BoundActor[];
  };
}

const side = (kind: string): MarkParty['side'] => (kind === 'character' ? 'heroes' : 'director');

/** The payload text: the printed clause without its duration (mark.md). */
const MARK_CLAUSE = 'The target is marked by you.';

/** Marks the engine tracks on a creature's stored effects. */
export function activeMarks(instances: readonly EffectInstance[]): EffectInstance[] {
  return instances.filter(
    instance =>
      instance.kind === 'mark' &&
      instance.status === 'active' &&
      !instance.manualStacking &&
      instance.payload.kind === 'mark' &&
      instance.owner.kind === 'character',
  );
}

async function log(
  ctx: MutationCtx,
  scope: JournalScope,
  kind: string,
  description: string,
  payload: Record<string, unknown>,
) {
  const cause = (await ctx.db.get(scope.eventId))!;
  await appendEvent(ctx, {
    campaignId: scope.campaignId,
    sessionId: cause.sessionId,
    encounterId: cause.encounterId,
    origin: 'engine',
    commandId: cause.commandId,
    causeEventId: scope.eventId,
    kind,
    description,
    payload,
  });
}

/**
 * Stores one mark on its subject. Another Tactician's mark on the subject ends first, with a
 * linked `effect.ended` entry (mark.md). A squad member or an object holds no mark the engine
 * tracks: the result is `untracked` and the table tracks it.
 */
export async function applyMark(
  ctx: MutationCtx,
  scope: JournalScope,
  input: {
    id: string;
    owner: BoundActor;
    subject: EffectParty;
    sourceUseEventId: Id<'events'>;
    abilityId: string;
    abilityName: string;
    sourcePath: string;
    clause: string;
    spec: MarkSpec;
    appliedSequence: number;
  },
  encounterId: Id<'encounters'> | undefined,
): Promise<{ instance?: EffectInstance; replaced: EffectInstance[] }> {
  const replaced: EffectInstance[] = [];
  const holds = input.subject.kind === 'character' || input.subject.kind === 'foe';
  if (holds) {
    const holder = { kind: input.subject.kind, id: input.subject.id } as EffectHolder;
    const record = await readHolder(ctx, holder);
    for (const other of activeMarks(record?.effectInstances ?? []))
      if (other.owner.id !== input.owner.id) {
        const ended = await endEffectInstance(
          ctx,
          scope,
          holder,
          other.id,
          `${input.owner.name}, another tactician, marked ${input.subject.name} (mark.md: "if another tactician marks a creature, your mark on that creature ends")`,
        );
        if (ended) replaced.push(ended);
      }
  }
  for (const ended of replaced)
    await log(
      ctx,
      scope,
      'effect.ended',
      `${ended.actorLabel}'s ${ended.abilityName} on ${ended.subject.name} ends: ${ended.endedReason}.`,
      {
        effectInstanceId: ended.id,
        sourceUseEventId: ended.sourceUseEventId,
        reason: ended.endedReason,
        sourcePath: ended.sourcePath,
      },
    );
  const result = holds
    ? await applyEffectInstance(
        ctx,
        scope,
        {
          id: input.id,
          kind: 'mark',
          sourceUseEventId: input.sourceUseEventId,
          sourceActorId: input.owner.id,
          abilityId: input.abilityId,
          abilityName: input.abilityName,
          actorLabel: input.owner.name,
          sourcePath: input.sourcePath,
          clause: input.clause,
          owner: { kind: input.owner.kind, id: input.owner.id, name: input.owner.name },
          subject: input.subject,
          payload: {
            kind: 'mark',
            text: MARK_CLAUSE,
            mark: { retargetDistance: input.spec.retarget.distance },
          },
          printedDuration: input.spec.duration,
          endsWhen: input.spec.endsWhen,
          appliedSequence: input.appliedSequence,
        },
        encounterId,
      )
    : undefined;
  const stored = result && 'instance' in result && !result.manualGroup ? result : undefined;
  const lasts = describeDuration(input.spec.duration, input.spec.endsWhen);
  await log(
    ctx,
    scope,
    stored ? 'effect.applied' : 'effect.untracked',
    stored
      ? `${input.owner.name} marks ${input.subject.name}, ${lasts} (or until ${input.owner.name} ends it). ${input.owner.name} and allies gain an edge on power rolls against ${input.subject.name} while it and the roller are within ${input.owner.name}'s line of effect; rolled damage to it offers ${input.owner.name} a Mark benefit.${stored.instance.registrationIds.length ? '' : ' Outside a committed encounter nothing is scheduled: end it with /effect end.'}`
      : `${input.owner.name} marks ${input.subject.name}: a ${input.subject.kind === 'squad' || input.subject.kind === 'object' ? input.subject.kind : 'squad member'} holds no mark the engine tracks; track it at the table.`,
    {
      sourceUseEventId: input.sourceUseEventId,
      occurrence: input.id,
      effectInstanceId: stored?.instance.id ?? null,
      holder: result?.holder ?? null,
      replaced: replaced.map(r => r.id),
      sourcePath: input.sourcePath,
    },
  );
  return { ...(stored ? { instance: stored.instance } : {}), replaced };
}

/** Inserts one Mark card on the triggering entry, with its linked `trigger.offered` line. */
async function offerCard(
  ctx: MutationCtx,
  scope: JournalScope,
  offer: MarkOffer,
  operation: 'mark.benefit' | 'mark.retarget',
  requiredInputs: { name: string; type: string; required: boolean; description: string }[],
) {
  const hero = await ctx.db.get(offer.owner.id as Id<'characters'>);
  if (!hero) return;
  const cause = (await ctx.db.get(scope.eventId))!;
  await journalInsert(ctx, scope, 'interactions', {
    campaignId: scope.campaignId,
    sessionId: cause.sessionId,
    status: 'awaiting-input',
    kind: MARK_OFFER_KIND,
    operation,
    actorLabel: offer.owner.name,
    boundActor: offer.owner,
    requesterId: hero.ownerId,
    requiredInputs,
    continuation: {
      schemaVersion: 1,
      campaignId: scope.campaignId,
      operation,
      actor: { refKind: 'character', id: offer.owner.id },
      arguments: {},
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
    description: `Offer: ${offer.text}`,
    payload: { data: { ...offer, sourcePath: offer.mark.sourcePath } },
  });
}

/** The other creatures taking turns in the encounter, for the retarget card to name. */
async function candidatesOf(
  ctx: MutationCtx,
  encounterId: Id<'encounters'>,
  exclude: readonly string[],
): Promise<BoundActor[]> {
  const entries = await ctx.db
    .query('turnEntries')
    .withIndex('by_encounter', q => q.eq('encounterId', encounterId))
    .take(200);
  const seen = new Set<string>();
  const out: BoundActor[] = [];
  for (const entry of entries) {
    const actor = entry.actor as BoundActor;
    if ((actor.kind !== 'character' && actor.kind !== 'foe') || exclude.includes(actor.id))
      continue;
    if (seen.has(actor.id)) continue;
    seen.add(actor.id);
    out.push({ kind: actor.kind, id: actor.id, name: actor.name });
  }
  return out;
}

/**
 * The marks one damage write touches, observed after the damaged creature's own watchers:
 * - damage the owner or an ally deals to a creature the owner marked sets off the owner's
 *   `marked-damaged` watchers;
 * - rolled damage from the owner or an ally (rule/damage/rolled-damage.md: damage "determined by
 *   making an ability roll") offers the owner a benefit card;
 * - Stamina going from above 0 to 0 or lower offers a retarget card. Interpretation (Q-MARK-1 point
 *   3): "reduced to 0 Stamina" includes going below 0, since the app records a foe's arithmetic
 *   Stamina and rule/health/stamina.md says such creatures die when it "drops to 0"; the
 *   alternative is an exact 0.
 * Outside combat nothing is offered (Q-TRIG-1 point 3: no round, no window); the table uses Mark by
 * hand. A correction never re-derives an offer: it is refused when it would change one (design
 * section 7).
 */
export async function observeMarks(
  ctx: MutationCtx,
  scope: JournalScope,
  observation: DamageObservation,
  lost: number,
  options: ObserveOptions,
  fireWatchers: (owner: EffectHolder, dealerId: string) => Promise<void>,
): Promise<void> {
  const marks = activeMarks(observation.preloaded?.effectInstances ?? []);
  if (!marks.length) return;
  const dealer = observation.dealer;
  const reduced = observation.before.stamina > 0 && observation.after.stamina <= 0;
  const restored = observation.before.stamina <= 0 && observation.after.stamina > 0;
  const subject: BoundActor = {
    kind: observation.target.kind,
    id: observation.target.id,
    name: observation.targetName ?? 'the marked creature',
  };
  for (const mark of marks) {
    const ownerId = await resolveHistoricalId(ctx, scope.campaignId, mark.owner.id);
    const owner: BoundActor = { kind: 'character', id: ownerId, name: mark.owner.name };
    const byOwnerSide =
      dealer !== undefined &&
      ownerOrAlly({ id: ownerId, side: 'heroes' }, { id: dealer.id, side: side(dealer.kind) });
    const damaged = lost !== 0 && !observation.partOfHit && byOwnerSide;
    if (damaged && (lost > 0 || options.correction))
      await fireWatchers({ kind: 'character', id: ownerId }, dealer!.id);
    const benefit = damaged && observation.rolled === true;
    if (options.correction) {
      if (benefit || reduced || restored)
        throw new ConvexError(
          `${mark.actorLabel}'s ${mark.abilityName} on ${subject.name} offers a free triggered action on this damage, and a correction can't re-derive it. Rewind to the use and record it again instead.`,
        );
      continue;
    }
    if (!benefit && !reduced) continue;
    const encounter = await roundOf(ctx, scope.campaignId);
    if (!encounter) continue;
    const eligibility = triggerEligibility(
      await eligibilityFacts(ctx, encounter, owner, 'free triggered action'),
    );
    if (!eligibility.eligible) continue;
    const base = {
      encounterId: encounter._id,
      round: encounter.round ?? 0,
      owner,
      abilityId: mark.abilityId,
      abilityName: mark.abilityName,
      actionType: 'free triggered action' as const,
      triggeringEventId: scope.eventId,
    };
    if (benefit && lost > 0) {
      const dealerActor: BoundActor = {
        kind: dealer!.kind,
        id: dealer!.id,
        name: observation.dealerName ?? 'the dealer',
      };
      const options = markBenefitOptions({
        dealerIsOwner: dealer!.id === ownerId,
        meleeAbility: observation.meleeAbility === true,
      }).map(kind => ({ kind, text: MARK_BENEFITS.find(b => b.kind === kind)!.text }));
      await offerCard(
        ctx,
        scope,
        {
          ...base,
          text: `${owner.name} may spend 1 focus for one Mark benefit (free triggered action): ${dealerActor.name} dealt rolled damage to ${subject.name}, marked by ${owner.name}. ${options.map(o => `${o.kind}: "${o.text}"`).join(' ')} "You can't gain more than one benefit from the same trigger." Accept one (answer benefit=…) or pass.`,
          mark: {
            kind: 'benefit',
            instanceId: mark.id,
            holder: { kind: observation.target.kind, id: observation.target.id },
            subject,
            sourcePath: mark.sourcePath,
            dealer: dealerActor,
            meleeAbility: observation.meleeAbility === true,
            options,
            cost: { resource: 'focus', amount: 1 },
          },
        },
        'mark.benefit',
        [
          {
            name: 'benefit',
            type: 'string',
            required: true,
            description: options.map(o => o.kind).join(', '),
          },
        ],
      );
    }
    if (reduced && mark.payload.kind === 'mark') {
      const distance = distanceNote(mark.payload.mark.retargetDistance);
      await offerCard(
        ctx,
        scope,
        {
          ...base,
          text: `${subject.name}, marked by ${owner.name}, is reduced to 0 Stamina: ${owner.name} may use a free triggered action to mark a new target within distance (${distance}). Accept with the new target (answer targets=[…]) or pass.`,
          mark: {
            kind: 'retarget',
            instanceId: mark.id,
            holder: { kind: observation.target.kind, id: observation.target.id },
            subject,
            sourcePath: mark.sourcePath,
            distance,
            candidates: await candidatesOf(ctx, encounter._id, [ownerId, subject.id]),
          },
        },
        'mark.retarget',
        [
          {
            name: 'targets',
            type: 'reference[]',
            required: true,
            description: 'The new target, one creature within distance, as [@Name].',
          },
        ],
      );
    }
  }
}
