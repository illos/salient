// SPDX-License-Identifier: GPL-3.0-only
/** Q-CHAR-11: fixed collisions create distinct unrestricted replacement entitlements. */
import type { Decision, DecisionDefinitions } from '../evaluate/definitions.ts';

export function extendSkillReplacements(definitions: DecisionDefinitions): void {
  const all = definitions.steps.flatMap(step => step.decisions);
  const legacyStep = definitions.steps.find(step =>
    step.decisions.some(decision => decision.replacesDuplicateSkill === 'Magic'),
  );
  const legacy = all.find(decision => decision.replacesDuplicateSkill === 'Magic');
  const detailsStep = definitions.steps.find(step => step.id === 'step.details')!;
  for (const step of definitions.steps)
    step.decisions = step.decisions.filter(decision => !decision.replacesDuplicateSkill);
  const fixed = new Set<string>();
  for (const decision of all)
    for (const grant of [
      ...(decision.grants ?? []),
      ...(decision.options ?? []).flatMap(option => option.grants ?? []),
    ])
      if (grant.kind === 'skill') fixed.add(grant.value);
  const groups = Object.keys(definitions.pools).filter(id => id.startsWith('pool.skills.'));
  const skills = [...new Set(groups.flatMap(id => definitions.pools[id]!.values))];
  const replacements: Decision[] = [];
  // The supported ancestry/class/career/complication sources can supply at most three fixed
  // copies of one skill. Each additional copy has its own slot and source provenance.
  for (const skill of [...fixed].sort())
    for (const occurrence of [2, 3]) {
      replacements.push({
        id:
          skill === 'Magic' && occurrence === 2 && legacy
            ? legacy.id
            : `details.fixed-skill.${skill.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${occurrence}`,
        label:
          skill === 'Magic' && occurrence === 2 && legacy
            ? 'Replacement for duplicate Magic skill'
            : `Replace duplicate ${skill}${occurrence > 2 ? ` (${occurrence - 1})` : ''}`,
        kind: 'choice',
        shape: { type: 'single', count: 1 },
        source: 'en/unified/md/chapter/making-a-hero.md',
        quote:
          'If you gain the same specific skill from two different sources (for instance, from a career and a class), you can pick a different skill from any skill group.',
        duplicateFixedSkill: { skill, occurrence },
        replacesDuplicateSkill: skill,
        selectionRole: 'skill',
        optionsFrom: groups,
        supportedInV001: skills,
      });
    }
  // Keep the existing Magic selection's owner stable for saved drafts and imports.
  for (const replacement of replacements)
    (replacement.id === legacy?.id && legacyStep ? legacyStep : detailsStep).decisions.push(
      replacement,
    );
}
