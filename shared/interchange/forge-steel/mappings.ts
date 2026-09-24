// SPDX-License-Identifier: GPL-3.0-only
/**
 * Scoped Forge Steel → Salient decision mappings (V09 part a). Keys are `<scope>#<forge feature id>`
 * where the scope is the owning branch from walker.ts (ancestry, career, class@level or
 * class/subclass@level), never a bare Forge id: Forge ids repeat across branches
 * (docs/character-wizard-spec.md#8-content-and-forge-steel-compatibility).
 *
 * Only branches proven by the retained Forge exports are listed: Devil and Polder ancestries,
 * Soldier and Mage's Apprentice careers, Fury (Berserker, levels 1–2) and Elementalist (Fire, level
 * 1). Fixtures: tests/fixtures/v45-reference/*.ds-hero against tests/fixtures/v25-fury.json,
 * v25-bethell.json and v32-fury-level-two.json. Any other active choice becomes a diagnostic.
 * Every value is still checked against the decision's own Compendium-sourced options.
 */

export type FeatureRule =
  /** The Forge selection is this decision's value (names converted by the decision's shape). */
  | { kind: 'decision'; decision: string }
  /**
   * Forge models a fixed Compendium grant as a free choice. The selection must equal `expected`;
   * the grant itself comes from Salient's own content, so no value is written.
   */
  | {
      kind: 'fixed';
      expected: string;
      source: string;
      /**
       * When the same fixed skill is also granted by the hero's class, Forge stores the duplicate
       * replacement in this slot. Keyed by Forge class id; the value is the Salient replacement
       * decision (chapter/making-a-hero.md: "If you gain the same specific skill from two
       * different sources ... you can pick a different skill from any skill group.").
       */
      duplicateReplacement?: Record<string, string>;
    };

export const featureRules: Record<string, FeatureRule> = {
  // Devil (ancestry/devil.md, feature/trait/devil/silver-tongue.md)
  'ancestry:ancestry-devil#devil-feature-1b': {
    kind: 'decision',
    decision: 'ancestry.devil.silver-tongue-skill',
  },

  // Soldier (career/soldier.md)
  'career:career-soldier#career-soldier-feature-1': {
    kind: 'decision',
    decision: 'career.soldier.skill.exploration',
  },
  'career:career-soldier#career-soldier-feature-2': {
    kind: 'decision',
    decision: 'career.soldier.skill.intrigue',
  },
  'career:career-soldier#career-soldier-feature-3': {
    kind: 'decision',
    decision: 'career.soldier.languages',
  },
  'career:career-soldier#career-soldier-feature-5': {
    kind: 'decision',
    decision: 'career.soldier.perk',
  },

  // Mage's Apprentice (career/mages-apprentice.md: "The Magic skill (from the lore skill group),
  // plus two other skills from the lore group")
  'career:career-mages-apprentice#mages-apprentice-feature-1': {
    kind: 'fixed',
    expected: 'Magic',
    source: 'en/unified/md/career/mages-apprentice.md',
    duplicateReplacement: { 'class-elementalist': 'class.elementalist.magic-replacement' },
  },
  'career:career-mages-apprentice#mages-apprentice-feature-2': {
    kind: 'decision',
    decision: 'career.mages-apprentice.skills',
  },
  'career:career-mages-apprentice#mages-apprentice-feature-3': {
    kind: 'decision',
    decision: 'career.mages-apprentice.languages',
  },
  'career:career-mages-apprentice#mages-apprentice-feature-5': {
    kind: 'decision',
    decision: 'career.mages-apprentice.perk',
  },

  // Fury level 1 (class/fury.md; feature/fury/level-1/fury-abilities.md)
  'class:class-fury@1#fury-1-1': {
    kind: 'fixed',
    expected: 'Nature',
    source: 'en/unified/md/class/fury.md',
  },
  'class:class-fury@1#fury-1-2': { kind: 'decision', decision: 'class.fury.skills' },
  'class:class-fury@1#fury-1-5': { kind: 'decision', decision: 'class.fury.signature-ability' },
  'class:class-fury@1#fury-1-6': { kind: 'decision', decision: 'class.fury.ability-3' },
  'class:class-fury@1#fury-1-7': { kind: 'decision', decision: 'class.fury.ability-5' },
  // Berserker (feature/fury/level-1/primordial-aspect.md: "You have the Lift skill.")
  'class:class-fury/fury-sub-1@1#fury-sub-1-1-1': {
    kind: 'fixed',
    expected: 'Lift',
    source: 'en/unified/md/feature/fury/level-1/primordial-aspect.md',
  },
  // Fury level 2 (feature/fury/level-2/perk.md, feature/fury/level-2/2nd-level-aspect-ability.md)
  'class:class-fury@2#fury-2-1': { kind: 'decision', decision: 'class.fury.level-2.perk' },
  'class:class-fury/fury-sub-1@2#fury-sub-1-2-2': {
    kind: 'decision',
    decision: 'class.fury.level-2.aspect-ability',
  },

  // Elementalist level 1 (class/elementalist.md; feature/elementalist/level-1/*.md)
  'class:class-elementalist@1#elementalist-1-1': {
    kind: 'fixed',
    expected: 'Magic',
    source: 'en/unified/md/class/elementalist.md',
  },
  'class:class-elementalist@1#elementalist-1-2': {
    kind: 'decision',
    decision: 'class.elementalist.skills',
  },
  'class:class-elementalist@1#elementalist-1-7': {
    kind: 'decision',
    decision: 'class.elementalist.enchantment',
  },
  'class:class-elementalist@1#elementalist-1-8': {
    kind: 'decision',
    decision: 'class.elementalist.ward',
  },
  'class:class-elementalist@1#elementalist-1-9': {
    kind: 'decision',
    decision: 'class.elementalist.signature-abilities',
  },
  'class:class-elementalist@1#elementalist-1-10': {
    kind: 'decision',
    decision: 'class.elementalist.ability-3',
  },
  'class:class-elementalist@1#elementalist-1-11': {
    kind: 'decision',
    decision: 'class.elementalist.ability-5',
  },

  // Every hero: Forge offers a Common language; the Compendium fixes it (Draw Steel Heroes.md,
  // "All player characters know Caelian!").
  'hero#default-language': {
    kind: 'fixed',
    expected: 'Caelian',
    source: 'en/books/heroes/clean/Draw Steel Heroes.md',
  },
};

export const ruleKey = (scope: string, featureId: string) => `${scope}#${featureId}`;
