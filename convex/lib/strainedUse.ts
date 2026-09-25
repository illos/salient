// SPDX-License-Identifier: GPL-3.0-only
/**
 * V170: the user's own damage from a strained use (shared/resolve/strained.ts). Planned before the
 * use commits, so the log states it, and written after the use's other effects in printed order,
 * against the user's pools at that point (commitStrained).
 *
 * - "You also take N damage that can't be reduced in any way": immunity does not apply (Q-RES-6,
 *   labelled interpretation shared with feature/conduit/level-1/piety.md); temporary Stamina still
 *   absorbs it first (rule/health/temporary-stamina.md).
 * - Outside combat, a declared strain costs "1d6 damage" (feature/talent/level-1/clarity-and-strain.md,
 *   Clarity Outside of Combat). That damage can be reduced, so for a Talent whose damage immunity the
 *   table tracks by hand (Steel Ward, Force Orbs: the V146 turn-end strain list) it is logged as due
 *   and left to the table, as the turn-end strain is.
 * Features that react to the user taking damage (the same list, with Vanishing Ward) are named in
 * the log for the table.
 */
import type { Doc } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { DieResult } from '../../shared/contracts/history';
import type { DamageApplication, DamageTargetFacts } from '../../shared/contracts/rollResolution';
import type { StrainedNode } from '../../shared/resolve/compileAbility';
import type { CompiledStrainedOutcome } from '../../shared/resolve/compiledOutcome';
import { generationProfile } from '../../shared/resolve/heroicResourceGeneration';
import { applyDamage } from '../../shared/resolve/index';
import { describeStrainedBasis, type StrainedState } from '../../shared/resolve/strained';
import { baselineOf } from './characterBuild';
import { rollDice } from './dice';
import type { JournalScope } from './journal';
import { damageTargetFacts, writePlannedDamage, type TargetRecord } from './resolve';

export interface StrainedPlan {
  state: StrainedState;
  /** Outside combat: the 1d6 rolled to incur the effect, applied unless a ward holds it. */
  incur?: { die: DieResult; application?: DamageApplication; heldBy?: string };
  /** The unreducible damage to the user, when the section prints one and it can be applied. */
  self?: DamageApplication;
  requirements: string[];
  /** Owned features that react to the user taking damage; the table resolves them. */
  reactions: string[];
  text: string;
}

/**
 * The strained section's work on the user. `actorAfterTargets` is the user's damage facts after
 * this use's damage to its targets (the user may be one of them).
 */
export async function planStrained(
  ctx: MutationCtx,
  input: {
    campaignId: Doc<'campaigns'>['_id'];
    commandId: string;
    issuer: Doc<'users'>['_id'];
    actor: TargetRecord;
    actorLabel: string;
    node: StrainedNode;
    state: StrainedState;
    /** The user's application as a target of this use, when it was one and took damage. */
    asTarget?: DamageApplication;
  },
): Promise<StrainedPlan> {
  const { state, node } = input;
  const basis = describeStrainedBasis(state);
  if (!state.applies)
    return {
      state,
      requirements: [],
      reactions: [],
      text: ` ${capitalize(basis)}: the Strained effect does not apply.`,
    };
  const requirements: string[] = [];
  const baseline = input.actor.character ? baselineOf(input.actor.character.derivedBaseline) : null;
  const strain = generationProfile(baseline)?.turnEndStrain;
  const owned = (name: string) =>
    !!baseline &&
    [...baseline.features.map(f => f.name), ...baseline.abilities.map(a => a.name)].some(
      have => have === name || have.startsWith(`${name}:`),
    );
  const heldBy = strain?.heldBy?.find(entry => owned(entry.name))?.name;
  const reactions = [...(strain?.heldBy ?? []), ...(strain?.notedBy ?? [])]
    .filter(entry => owned(entry.name))
    .map(entry => entry.name);
  const found = input.actor.squad ? undefined : damageTargetFacts(input.actor);
  let facts: DamageTargetFacts | undefined =
    found && 'facts' in found
      ? {
          ...found.facts,
          ...(input.asTarget
            ? {
                stamina: input.asTarget.staminaAfter,
                temporaryStamina: input.asTarget.temporaryStaminaAfter,
              }
            : {}),
        }
      : undefined;
  const parts: string[] = [];
  let incur: StrainedPlan['incur'];
  if (state.incurDamage) {
    const rolled = await rollDice(
      ctx,
      input.campaignId,
      `strain_${input.commandId}`.slice(0, 128),
      [{ id: 'strain', sides: 6 }],
      input.issuer,
    );
    const die = rolled.dice[0]!;
    if (heldBy || !facts) {
      incur = { die, ...(heldBy ? { heldBy } : {}) };
      requirements.push(heldBy ? `actor.damageImmunity (${heldBy})` : 'actor.damageFacts');
      parts.push(
        `${input.actorLabel} takes 1d6 (${die.value}) damage to incur it; ${heldBy ? `${heldBy}'s damage immunity may reduce it, so it` : 'it'} is not applied automatically: apply it with /adjust stamina`,
      );
    } else {
      const application = applyDamage(facts, {
        targetId: facts.targetId,
        amount: die.value,
        causeLabel: 'incurring a strain effect outside combat',
      });
      incur = { die, application };
      facts = {
        ...facts,
        stamina: application.staminaAfter,
        temporaryStamina: application.temporaryStaminaAfter,
      };
      parts.push(
        `${input.actorLabel} takes 1d6 (${die.value}) damage to incur it${stamina(application)}`,
      );
    }
  }
  let self: DamageApplication | undefined;
  const printed = node.spec.selfDamage;
  if (printed) {
    const type = printed.damageType ? ` ${printed.damageType}` : '';
    if (!facts) {
      requirements.push('actor.damageFacts');
      parts.push(
        `${input.actorLabel} takes ${printed.amount}${type} damage that can't be reduced; the app can't apply it here: apply it with /adjust stamina`,
      );
    } else {
      self = applyDamage(
        { ...facts, immunities: [] },
        {
          targetId: facts.targetId,
          amount: printed.amount,
          ...(printed.damageType ? { damageType: printed.damageType } : {}),
          causeLabel: 'strained (can’t be reduced)',
        },
      );
      parts.push(
        `${input.actorLabel} takes ${self.afterImmunity}${type} damage that can't be reduced${stamina(self)}`,
      );
    }
  }
  const extra = node.spec.targetExtraDamage;
  if (extra)
    parts.unshift(
      `the target's damage includes an extra ${extra.amount}${extra.damageType ? ` ${extra.damageType}` : ''}`,
    );
  return {
    state,
    ...(incur ? { incur } : {}),
    ...(self ? { self } : {}),
    requirements,
    reactions,
    text: ` ${capitalize(basis)}: ${parts.join('; ')}.${reactions.length ? ` ${reactions.join(', ')} react${reactions.length === 1 ? 's' : ''} to this damage: resolve at the table.` : ''}`,
  };
}

/** The saved outcome with what the use applied. */
export function withStrainedPlan(
  outcome: CompiledStrainedOutcome,
  plan: StrainedPlan,
): CompiledStrainedOutcome {
  return {
    ...outcome,
    ...(plan.self ? { selfApplication: plan.self } : {}),
    ...(plan.requirements.length
      ? { status: 'manual' as const, requirements: [...outcome.requirements, ...plan.requirements] }
      : {}),
  };
}

/**
 * Writes the user's damage in order: the 1d6 to incur the effect, then the section's own. Each is
 * planned before the use commits but taken from the user's pools as they are when it is written
 * (QC1 train 13 R1): the use's damage to its targets can set off a watcher that damages the user
 * first (Violence Will Not Aid Thee), and that damage stands. The amount after immunity is the
 * planned one, so "can't be reduced" still skips immunity only (Q-STRAIN-1) and temporary Stamina
 * still absorbs first (rule/health/temporary-stamina.md). Returns what was applied.
 */
export async function commitStrained(
  ctx: MutationCtx,
  scope: JournalScope,
  actor: TargetRecord,
  plan: StrainedPlan,
): Promise<{ incur?: DamageApplication; self?: DamageApplication }> {
  const incur = plan.incur?.application
    ? await writePlannedDamage(ctx, scope, actor, plan.incur.application)
    : undefined;
  const self = plan.self ? await writePlannedDamage(ctx, scope, actor, plan.self) : undefined;
  return { ...(incur ? { incur } : {}), ...(self ? { self } : {}) };
}

function stamina(application: DamageApplication): string {
  return ` (${application.absorbedByTemporaryStamina ? `${application.absorbedByTemporaryStamina} absorbed by temporary Stamina; ` : ''}Stamina ${application.staminaBefore} → ${application.staminaAfter})`;
}
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
