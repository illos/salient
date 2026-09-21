// SPDX-License-Identifier: GPL-3.0-only
/** Verified editor boundaries, separate from the presence of readable source definitions. */
import type { SelectionValue } from '../contracts/characterEvaluation.ts';

interface SupportRequirement {
  decisionId: string;
  value: string;
  message: string;
}

/** Level one still validates individual class/ancestry/option support through its definitions. */
export const CHARACTER_LEVEL_SUPPORT: Readonly<Record<number, readonly SupportRequirement[]>> = {
  1: [],
  4: [
    {
      decisionId: 'class.choice',
      value: 'Shadow',
      message: 'Level 4 currently supports Shadow only.',
    },
  ],
  5: [
    {
      decisionId: 'class.choice',
      value: 'Shadow',
      message: 'Level 5 currently supports Shadow only.',
    },
  ],
  6: [
    {
      decisionId: 'class.choice',
      value: 'Shadow',
      message: 'Level 6 currently supports Shadow only.',
    },
  ],

  3: [
    {
      decisionId: 'class.choice',
      value: 'Shadow',
      message: 'Level three currently supports Shadow only.',
    },
  ],
  2: [
    {
      decisionId: 'class.choice',
      value: 'Fury',
      message: 'Level two currently supports Shadow and Berserker Fury.',
    },
    {
      decisionId: 'class.fury.aspect',
      value: 'Berserker',
      message: 'Level two currently supports the Berserker aspect only.',
    },
  ],
};

export function isSupportedDefinitionLevel(level: number): boolean {
  return Number.isInteger(level) && Object.hasOwn(CHARACTER_LEVEL_SUPPORT, level);
}

export function characterSupportDiagnostics(
  level: number,
  selections: Record<string, SelectionValue>,
) {
  if (!isSupportedDefinitionLevel(level))
    return [
      {
        decisionId: 'class.level',
        message: `Level ${level} has no supported character definitions; level two supports Shadow and Berserker Fury; levels three through six support Shadow.`,
      },
    ];
  if (level === 2 && selections['class.choice'] === 'Shadow') return [];
  return CHARACTER_LEVEL_SUPPORT[level]!.filter(
    requirement => selections[requirement.decisionId] !== requirement.value,
  ).map(({ decisionId, message }) => ({ decisionId, message }));
}

/** No new transition is enabled by this refactor. Future transitions need their own verified unit. */
export const CURRENT_ADVANCEMENT = {
  fromLevel: 1,
  targetLevel: 2,
  className: 'Fury',
  subclassName: 'Berserker',
  requiredXp: 16,
  unavailableReason: 'This slice supports a complete level-one Fury advancing to level two.',
} as const;

export function supportsCurrentAdvancement(
  level: number,
  className: string | undefined,
  subclassName: string | undefined,
): boolean {
  return (
    level === CURRENT_ADVANCEMENT.fromLevel &&
    className === CURRENT_ADVANCEMENT.className &&
    subclassName === CURRENT_ADVANCEMENT.subclassName
  );
}
