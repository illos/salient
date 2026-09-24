// SPDX-License-Identifier: GPL-3.0-only
/** V72 saved execution, restored by history without recompilation or replay. */
import type { CompiledAbility } from '../resolve/compileAbility.ts';
import type {
  CompiledAbilityInput,
  CompiledEffectOutcome,
  EffectOnlyInput,
} from '../resolve/compiledOutcome.ts';

export interface EffectOccurrence {
  id: string;
  /** Original use and historical target identities are never replaced by restoration aliases. */
  useEventId: string;
  revision: string;
  effect: CompiledEffectOutcome;
  disposition?: { eventId: string; note: string };
}
export interface CompiledResult {
  version: 1;
  definition: CompiledAbility;
  /**
   * Original private facts are persisted, never included wholesale in public reads. V157: an
   * effect-only use (`definition.effectOnly`) saves its recipients and payment facts instead.
   */
  inputs: CompiledAbilityInput | EffectOnlyInput;
  revision: string;
  effects: EffectOccurrence[];
}
/** The public result deliberately omits private original damage/movement fact snapshots. */
export type PublicCompiledResult = Omit<CompiledResult, 'inputs'>;

export function effectOccurrences(
  useEventId: string,
  revision: string,
  effects: CompiledEffectOutcome[],
): EffectOccurrence[] {
  return effects.map(effect => ({
    id: JSON.stringify([useEventId, effect.nodeId, effect.targetId, revision]),
    useEventId,
    revision,
    effect,
  }));
}
