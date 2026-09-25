// SPDX-License-Identifier: GPL-3.0-only
/**
 * V185: a compact comparison of a recorded build with the current effective build, for the build
 * History page (docs/character-wizard-spec.md#5-progression-history). It reads two recorded
 * baselines and computes nothing new: level, the Stamina and Recoveries maxima, and granted
 * features (traits included), abilities and perks by name. `added` are grants the recorded build
 * has that the current build lacks, i.e. what restoring it would add; `removed` the reverse.
 */
import type { PartialBaseline } from '../contracts/characterEvaluation.ts';
import type { BuildDifference, NameChange, ValueChange } from '../contracts/characterSheet.ts';

function names(grants: { name: string }[] | undefined): Set<string> {
  return new Set((grants ?? []).map(grant => grant.name));
}
function compare(current: Set<string>, snapshot: Set<string>): NameChange {
  return {
    added: [...snapshot].filter(name => !current.has(name)).sort(),
    removed: [...current].filter(name => !snapshot.has(name)).sort(),
  };
}

export function buildDifference(
  current: PartialBaseline | null,
  snapshot: PartialBaseline | null,
): BuildDifference {
  const value = (
    baseline: PartialBaseline | null,
    field: 'level' | 'staminaMaximum' | 'recoveriesMaximum',
  ) => baseline?.[field]?.value ?? null;
  const change = (field: 'level' | 'staminaMaximum' | 'recoveriesMaximum'): ValueChange => ({
    current: value(current, field),
    snapshot: value(snapshot, field),
  });
  const difference = {
    hasCurrent: current !== null,
    level: change('level'),
    staminaMaximum: change('staminaMaximum'),
    recoveriesMaximum: change('recoveriesMaximum'),
    features: compare(
      names([...(current?.traits ?? []), ...(current?.features ?? [])]),
      names([...(snapshot?.traits ?? []), ...(snapshot?.features ?? [])]),
    ),
    abilities: compare(names(current?.abilities), names(snapshot?.abilities)),
    perks: compare(names(current?.perks), names(snapshot?.perks)),
  };
  const same =
    (['level', 'staminaMaximum', 'recoveriesMaximum'] as const).every(
      field => difference[field].current === difference[field].snapshot,
    ) &&
    (['features', 'abilities', 'perks'] as const).every(
      field => !difference[field].added.length && !difference[field].removed.length,
    );
  return { ...difference, same };
}
