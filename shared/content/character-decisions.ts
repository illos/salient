import { extendCultureDefinitions } from './culture-presets.ts';
// SPDX-License-Identifier: GPL-3.0-only
/** Level-qualified wizard content. Rules contract: docs/research/v32-fury-progression-contract.md. */
import { extendBackgroundDefinitions } from './supporting-backgrounds.ts';
import { extendComplicationDefinitions } from './supporting-complications.ts';
import type { CharacterChoiceOrigins } from '../contracts/characterEvaluation.ts';
import { extendSkillReplacements } from './supporting-replacements.ts';
import { definitions as legacyLevelOne } from './level-one-decisions.ts';
import type { DecisionDefinitions } from '../evaluate/definitions.ts';

import { levelTwoDecisions } from './classes/fury/level-two.ts';
import { levelTwoDecisions as shadowLevelTwo } from './classes/shadow/level-two.ts';
import { levelThreeDecisions as shadowLevelThree } from './classes/shadow/level-three.ts';
import { shadowLaterDecisions } from './classes/shadow/level-four-to-six.ts';
export { FURY_LEVEL_TWO_PERK_GROUPS } from './classes/fury/level-two.ts';

const levelOne: DecisionDefinitions = structuredClone(legacyLevelOne);
const levelTwo: DecisionDefinitions = structuredClone(levelOne);
levelTwo.level = 2;
const classStep = levelTwo.steps.find(step => step.id === 'step.class')!;
const levelDecision = classStep.decisions.find(decision => decision.id === 'class.level')!;
levelDecision.quote =
  "Each time you gain a new level in your class, your Stamina increases, and you gain new features or abilities according to your class's advancement, as detailed in Chapter 5: Classes.";
levelDecision.grants = [{ kind: 'level', value: '2' }];
classStep.decisions.push(...structuredClone([...levelTwoDecisions, ...shadowLevelTwo]));

const levelThree: DecisionDefinitions = structuredClone(levelTwo);
levelThree.level = 3;
const thirdClassStep = levelThree.steps.find(step => step.id === 'step.class')!;
thirdClassStep.decisions.find(decision => decision.id === 'class.level')!.grants = [
  { kind: 'level', value: '3' },
];
thirdClassStep.decisions.push(...structuredClone(shadowLevelThree));

const levels = [levelOne, levelTwo, levelThree];
for (const level of [4, 5, 6]) {
  const definitions = structuredClone(levels[level - 2]!);
  definitions.level = level;
  const step = definitions.steps.find(s => s.id === 'step.class')!;
  step.decisions.find(d => d.id === 'class.level')!.grants = [
    { kind: 'level', value: String(level) },
  ];
  step.decisions.push(...structuredClone(shadowLaterDecisions[level]!));
  levels.push(definitions);
}
for (const definitions of levels) {
  definitions.supportingChoicesVersion = 'v37';
  extendBackgroundDefinitions(definitions);
  extendCultureDefinitions(definitions);
  extendComplicationDefinitions(definitions);
  for (const step of definitions.steps)
    for (const decision of step.decisions)
      if (decision.id.startsWith('culture.') && decision.id !== 'culture.caelian')
        (decision.conditions ??= []).push({
          decision: 'complication.choice',
          value: 'Raised by Beasts',
          not: true,
        });
  const skill = definitions.steps
    .flatMap(s => s.decisions)
    .find(d => d.id === 'class.shadow.level-4.skill');
  if (skill)
    skill.supportedInV001 = (skill.optionsFrom as string[]).flatMap(
      id => definitions.pools[id]?.values ?? [],
    );
  extendSkillReplacements(definitions);
}

/** The legacy level-one object and schema remain intact; unknown levels are diagnosed by evaluation. */
export function getDefinitions(
  level: number,
  choiceOrigins?: CharacterChoiceOrigins,
): DecisionDefinitions {
  const definitions = levels[level - 1] ?? { ...levelOne, level };
  return choiceOrigins
    ? { ...definitions, choiceOrigins: structuredClone(choiceOrigins) }
    : definitions;
}
