// SPDX-License-Identifier: GPL-3.0-only
import {
  COMPLICATION_ABILITIES,
  type ComplicationAbilitySource,
} from '../content/supporting-complication-abilities.ts';
import type { GrantedAbility, GrantedFeature } from '../contracts/characterEvaluation.ts';
import { extractEmbeddedAbility } from '../resolve/embeddedAbility.ts';
import type { SheetAbilityMetadata } from '../contracts/characterSheet.ts';

/** Reconstruct from retained granting features, including saved pre-extraction builds. */
export function complicationAbilities(
  features: GrantedFeature[],
  existing: GrantedAbility[],
): GrantedAbility[] {
  const result = existing.filter(
    a =>
      !COMPLICATION_ABILITIES.some(
        s =>
          s.name === a.name &&
          s.sourcePath === a.sourcePath &&
          a.provenance.decisionId.startsWith('complication.'),
      ),
  );
  for (const source of COMPLICATION_ABILITIES) {
    const parent = features.find(f => f.kind === 'complication' && f.name === source.complication);
    if (!parent) continue;
    if (
      source.selectedTrait &&
      !features.some(
        f =>
          f.provenance.decisionId === source.selectedTrait!.decision &&
          f.name === source.selectedTrait!.value,
      )
    )
      continue;
    const independentlyGrantedEarth =
      source.complication === 'Grounded' &&
      existing.some(
        a =>
          a.name === 'Motivate Earth' &&
          (!a.provenance.decisionId.startsWith('complication.') ||
            a.provenance.note === 'Grounded: also granted independently; ranged 5.'),
      );
    if (independentlyGrantedEarth) {
      for (let index = result.length - 1; index >= 0; index--)
        if (
          result[index]!.name === 'Motivate Earth' &&
          result[index]!.sourcePath === source.sourcePath
        )
          result.splice(index, 1);
    }
    result.push({
      name: source.name,
      kind: source.kind,
      sourcePath: source.sourcePath,
      kitBonusesIncluded: false,
      ...(source.condition ? { activationCondition: source.condition } : {}),
      provenance: {
        ...parent.provenance,
        ...(independentlyGrantedEarth
          ? { note: 'Grounded: also granted independently; ranged 5.' }
          : {}),
        decisionId: source.selectedTrait?.decision ?? source.availability.decision,
        selection: source.selectedTrait?.value ?? source.complication,
        source: { ...parent.provenance.source, path: source.sourcePath, quote: source.text },
      },
    });
  }
  return result;
}
export function complicationAbilitySource(ability: GrantedAbility) {
  return ability.provenance.decisionId.startsWith('complication.')
    ? COMPLICATION_ABILITIES.find(
        s => s.name === ability.name && s.sourcePath === ability.sourcePath,
      )
    : undefined;
}
export function complicationAbilityMetadata(
  source: ComplicationAbilitySource,
  grant?: GrantedAbility,
): SheetAbilityMetadata {
  if (source.actionType)
    return {
      actionType: source.actionType,
      keywords: [],
      ...(source.cost ? { cost: source.cost } : {}),
      ...(source.trigger ? { trigger: source.trigger } : {}),
      effects: [{ label: 'Effect', text: source.text }],
    };
  const heading = /^###### (.+)$/m.exec(source.text)?.[1];
  const parsed = extractEmbeddedAbility(
    heading ? source.text : `###### ${source.name}\n\n${source.text}`,
    heading ?? source.name,
  );
  return parsed.ok
    ? {
        ...parsed.metadata,
        ...(source.cost ? { cost: source.cost } : {}),
        ...(grant?.provenance.note === 'Grounded: also granted independently; ranged 5.'
          ? { distance: 'Ranged 5' }
          : {}),
      }
    : { keywords: [] };
}
