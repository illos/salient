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
      value:
        'Shadow|Fury|Tactician|Censor|Troubadour|Null|Conduit|Elementalist|Talent|Beastheart|Summoner',
      message:
        'Level three currently supports Shadow, Fury, Tactician, Censor, Troubadour, Null, Conduit, Elementalist, Talent, Beastheart and Summoner.',
    },
  ],
  2: [
    {
      decisionId: 'class.choice',
      value:
        'Shadow|Fury|Tactician|Censor|Troubadour|Null|Conduit|Elementalist|Talent|Beastheart|Summoner',
      message:
        'Level two currently supports Shadow, Fury, Tactician, Censor, Troubadour, Null, Conduit, Elementalist, Talent, Beastheart and Summoner.',
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
        message: `Level ${level} has no supported character definitions; levels two and three support Shadow, Fury, Tactician, Censor, Troubadour, Null, Conduit, Elementalist, Talent, Beastheart and Summoner; levels four through six support Shadow.`,
      },
    ];
  return CHARACTER_LEVEL_SUPPORT[level]!.filter(
    requirement =>
      !requirement.value.split('|').includes(String(selections[requirement.decisionId])),
  ).map(({ decisionId, message }) => ({ decisionId, message }));
}

/**
 * The level a hero at `level` advances to (V163): the next level, when that level's definitions exist
 * and support this build's class. docs/character-wizard-spec.md#level-up: one level per level-up.
 */
export function levelUpTarget(
  level: number,
  selections: Record<string, SelectionValue>,
): { targetLevel: number; reason: string | null } {
  const targetLevel = level + 1;
  const diagnostics = characterSupportDiagnostics(targetLevel, selections);
  return {
    targetLevel,
    reason: diagnostics.length
      ? `Level ${targetLevel} is not yet available for this class: ${diagnostics[0]!.message}`
      : null,
  };
}
