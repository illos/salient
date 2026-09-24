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
      value: 'Shadow|Fury|Tactician|Censor|Troubadour|Null|Conduit|Elementalist|Talent',
      message:
        'Level three currently supports Shadow, Fury, Tactician, Censor, Troubadour, Null, Conduit, Elementalist and Talent.',
    },
  ],
  2: [
    {
      decisionId: 'class.choice',
      value: 'Shadow|Fury|Tactician|Censor|Troubadour|Null|Conduit|Elementalist|Talent',
      message:
        'Level two currently supports Shadow, Fury, Tactician, Censor, Troubadour, Null, Conduit, Elementalist and Talent.',
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
        message: `Level ${level} has no supported character definitions; levels two and three support Shadow, Fury, Tactician, Censor, Troubadour, Null, Conduit, Elementalist and Talent; levels four through six support Shadow.`,
      },
    ];
  return CHARACTER_LEVEL_SUPPORT[level]!.filter(
    requirement =>
      !requirement.value.split('|').includes(String(selections[requirement.decisionId])),
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
