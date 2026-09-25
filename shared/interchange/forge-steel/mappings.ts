// SPDX-License-Identifier: GPL-3.0-only
/**
 * Scoped Forge Steel → Salient decision mappings (V09 part a, extended to class levels 1–3 for all
 * eleven classes by V182). Keys are `<scope>#<forge feature id>` where the scope is the owning branch
 * from walker.ts (ancestry, career, class@level or class/subclass@level), never a bare Forge id: Forge
 * ids repeat across branches (docs/character-wizard-spec.md#8-content-and-forge-steel-compatibility).
 *
 * Proof: the retained real Forge exports (tests/fixtures/v45-reference: Devil and Polder ancestries,
 * Soldier and Mage's Apprentice careers, Fury levels 1–2, Elementalist level 1) and, for the class
 * rules below, the Forge-built witnesses of scripts/forge/import-witnesses.ts (V182), built from the
 * pinned Forge class definitions and the level-three ledgers in tests/fixtures/level-three-builds.ts.
 * Any other active choice becomes a diagnostic. Every value is still checked against the decision's
 * own Compendium-sourced options, so a rule only says where a Forge choice goes, never what it may be.
 */

export type FeatureRule =
  /**
   * The Forge selection is this decision's value (names converted by the decision's shape). `ids`
   * translates a selected Forge option id to the Salient value where Forge's option name is not the
   * Compendium's option name; each table cites the Compendium passage that names the options.
   */
  | { kind: 'decision'; decision: string; ids?: Record<string, string> }
  /**
   * Forge models a fixed Compendium grant as a free choice. The selection must equal `expected`
   * (as a set); the grant itself comes from Salient's own content, so no value is written.
   */
  | {
      kind: 'fixed';
      expected: string | string[];
      source: string;
      /**
       * When the same fixed skill is also granted by the hero's class, Forge stores the duplicate
       * replacement in this slot. Keyed by Forge class id; the value is the Salient replacement
       * decision (chapter/making-a-hero.md: "If you gain the same specific skill from two
       * different sources ... you can pick a different skill from any skill group.").
       */
      duplicateReplacement?: Record<string, string>;
    }
  /**
   * One Forge list feeds several single-choice decisions, in Forge's order. `interpretation` states
   * why the order carries no rules meaning.
   */
  | { kind: 'split'; decisions: string[]; interpretation: string }
  /** Forge records the parent choice but not this Salient decision; the owner chooses it in Salient. */
  | { kind: 'unrecorded'; decision: string; reason: string }
  /** Forge models this choice differently from the Compendium; always a diagnostic. */
  | { kind: 'unmapped'; reason: string };

const decision = (id: string, ids?: Record<string, string>): FeatureRule =>
  ids ? { kind: 'decision', decision: id, ids } : { kind: 'decision', decision: id };
const fixed = (expected: string | string[], source: string): FeatureRule => ({
  kind: 'fixed',
  expected,
  source,
});
const md = (path: string) => `en/unified/md/${path}`;

/**
 * Level-two perk rules for one class (feature/<class>/level-2/perk.md). Forge nests the chosen perk
 * under the class Perk feature; perks with their own choice map to the Salient per-perk decision
 * (perk/<name>.md), and perks whose target Forge does not record are reported as open.
 */
function perkRules(slug: string, forgeClass: string, perkFeature: string) {
  const scope = `class:${forgeClass}@2`;
  const base = `class.${slug}.level-2.perk`;
  return {
    [`${scope}#${perkFeature}`]: decision(base),
    [`${scope}#perk-eidetic-memory`]: decision(`${base}.eidetic-memory.currentSkill`),
    [`${scope}#perk-linguist-2`]: decision(`${base}.linguist.languages`),
    [`${scope}#perk-area-of-expertise`]: {
      kind: 'unrecorded',
      decision: `${base}.area-of-expertise.target`,
      reason: 'Forge does not record the Area of Expertise skill; choose it in Salient.',
    },
    [`${scope}#perk-specialist`]: {
      kind: 'unrecorded',
      decision: `${base}.specialist.target`,
      reason: 'Forge does not record the Specialist skill; choose it in Salient.',
    },
  } satisfies Record<string, FeatureRule>;
}

/** The class ability slots: signature, 3, 5 and the level-three 7-cost ability (class/<name>.md). */
function abilityRules(
  slug: string,
  forgeClass: string,
  ids: { signature?: string; three?: string; five?: string; seven: string },
  signatureDecision = `class.${slug}.signature-ability`,
) {
  const one = `class:${forgeClass}@1`;
  const rules: Record<string, FeatureRule> = {
    [`class:${forgeClass}@3#${ids.seven}`]: decision(`class.${slug}.level-3.ability-7`),
  };
  if (ids.signature) rules[`${one}#${ids.signature}`] = decision(signatureDecision);
  if (ids.three) rules[`${one}#${ids.three}`] = decision(`class.${slug}.ability-3`);
  if (ids.five) rules[`${one}#${ids.five}`] = decision(`class.${slug}.ability-5`);
  return rules;
}

export const featureRules: Record<string, FeatureRule> = {
  // Devil (ancestry/devil.md, feature/trait/devil/silver-tongue.md)
  'ancestry:ancestry-devil#devil-feature-1b': decision('ancestry.devil.silver-tongue-skill'),

  // Soldier (career/soldier.md)
  'career:career-soldier#career-soldier-feature-1': decision('career.soldier.skill.exploration'),
  'career:career-soldier#career-soldier-feature-2': decision('career.soldier.skill.intrigue'),
  'career:career-soldier#career-soldier-feature-3': decision('career.soldier.languages'),
  'career:career-soldier#career-soldier-feature-5': decision('career.soldier.perk'),

  // Mage's Apprentice (career/mages-apprentice.md: "The Magic skill (from the lore skill group),
  // plus two other skills from the lore group")
  'career:career-mages-apprentice#mages-apprentice-feature-1': {
    kind: 'fixed',
    expected: 'Magic',
    source: md('career/mages-apprentice.md'),
    duplicateReplacement: { 'class-elementalist': 'class.elementalist.magic-replacement' },
  },
  'career:career-mages-apprentice#mages-apprentice-feature-2': decision(
    'career.mages-apprentice.skills',
  ),
  'career:career-mages-apprentice#mages-apprentice-feature-3': decision(
    'career.mages-apprentice.languages',
  ),
  'career:career-mages-apprentice#mages-apprentice-feature-5': decision(
    'career.mages-apprentice.perk',
  ),

  // ---- Fury (class/fury.md; feature/fury/level-*/) ----
  'class:class-fury@1#fury-1-1': fixed('Nature', md('class/fury.md')),
  'class:class-fury@1#fury-1-2': decision('class.fury.skills'),
  ...abilityRules('fury', 'class-fury', {
    signature: 'fury-1-5',
    three: 'fury-1-6',
    five: 'fury-1-7',
    seven: 'fury-3-1',
  }),
  ...perkRules('fury', 'class-fury', 'fury-2-1'),
  // feature/fury/level-1/primordial-aspect.md: Berserker Lift, Reaver Hide, Stormwight Track.
  'class:class-fury/fury-sub-1@1#fury-sub-1-1-1': fixed(
    'Lift',
    md('feature/fury/level-1/primordial-aspect.md'),
  ),
  'class:class-fury/fury-sub-2@1#fury-sub-2-1-1': fixed(
    'Hide',
    md('feature/fury/level-1/primordial-aspect.md'),
  ),
  'class:class-fury/fury-sub-3@1#fury-sub-3-1-1': fixed(
    'Track',
    md('feature/fury/level-1/primordial-aspect.md'),
  ),
  // Kit (feature/fury/level-1/kit.md) and Stormwight beast shape; options per aspect from kit.choice.
  'class:class-fury/fury-sub-1@1#fury-sub-1-1-2': decision('kit.choice'),
  'class:class-fury/fury-sub-2@1#fury-sub-2-1-2': decision('kit.choice'),
  'class:class-fury/fury-sub-3@1#fury-sub-3-1-2': decision('kit.choice'),
  // feature/fury/level-2/2nd-level-aspect-ability.md
  'class:class-fury/fury-sub-1@2#fury-sub-1-2-2': decision('class.fury.level-2.aspect-ability'),
  'class:class-fury/fury-sub-2@2#fury-sub-2-2-2': decision('class.fury.level-2.reaver-ability'),
  'class:class-fury/fury-sub-3@2#fury-sub-3-2-2': decision('class.fury.level-2.stormwight-ability'),

  // ---- Elementalist (class/elementalist.md; feature/elementalist/level-*/) ----
  'class:class-elementalist@1#elementalist-1-1': fixed('Magic', md('class/elementalist.md')),
  'class:class-elementalist@1#elementalist-1-2': decision('class.elementalist.skills'),
  'class:class-elementalist@1#elementalist-1-7': decision('class.elementalist.enchantment'),
  'class:class-elementalist@1#elementalist-1-8': decision('class.elementalist.ward'),
  ...abilityRules(
    'elementalist',
    'class-elementalist',
    {
      signature: 'elementalist-1-9',
      three: 'elementalist-1-10',
      five: 'elementalist-1-11',
      seven: 'elementalist-3-1',
    },
    'class.elementalist.signature-abilities',
  ),
  ...perkRules('elementalist', 'class-elementalist', 'elementalist-2-1'),
  // feature/elementalist/level-2/new-5-essence-ability.md
  'class:class-elementalist@2#elementalist-2-2': decision('class.elementalist.level-2.ability-5'),

  // ---- Shadow (class/shadow.md: "You gain the Hide and Sneak skills ... choose any five") ----
  'class:class-shadow@1#shadow-1-1': fixed(['Hide', 'Sneak'], md('class/shadow.md')),
  'class:class-shadow@1#shadow-1-3': decision('class.shadow.skills'),
  'class:class-shadow@1#shadow-1-5a': decision('kit.choice'),
  ...abilityRules('shadow', 'class-shadow', {
    signature: 'shadow-1-6',
    three: 'shadow-1-7',
    five: 'shadow-1-8',
    seven: 'shadow-3-2',
  }),
  ...perkRules('shadow', 'class-shadow', 'shadow-2-1'),
  // feature/shadow/level-1/shadow-college.md: Black Ash Magic, Caustic Alchemy Alchemy, Harlequin Lie.
  'class:class-shadow/shadow-sub-1@1#shadow-sub-1-1-1': fixed(
    'Magic',
    md('feature/shadow/level-1/shadow-college.md'),
  ),
  'class:class-shadow/shadow-sub-2@1#shadow-sub-2-1-1': fixed(
    'Alchemy',
    md('feature/shadow/level-1/shadow-college.md'),
  ),
  'class:class-shadow/shadow-sub-3@1#shadow-sub-3-1-1': fixed(
    'Lie',
    md('feature/shadow/level-1/shadow-college.md'),
  ),
  // feature/shadow/level-2/2nd-level-college-ability.md
  'class:class-shadow/shadow-sub-1@2#shadow-sub-1-2-1': decision(
    'class.shadow.level-2.burning-ash-ability',
  ),
  'class:class-shadow/shadow-sub-2@2#shadow-sub-2-2-1': decision(
    'class.shadow.level-2.trained-assassin-ability',
  ),
  'class:class-shadow/shadow-sub-3@2#shadow-sub-3-2-1': decision(
    'class.shadow.level-2.friend-ability',
  ),

  // ---- Tactician (class/tactician.md; feature/tactician/level-*/) ----
  'class:class-tactician@1#tactician-1-1': fixed('Lead', md('class/tactician.md')),
  'class:class-tactician@1#tactician-1-2': decision('class.tactician.skills'),
  // feature/tactician/level-1/field-arsenal.md: "You can use and gain the benefits of two kits".
  'class:class-tactician@1#tactician-1-4': {
    kind: 'split',
    decisions: ['kit.choice', 'class.tactician.second-kit'],
    interpretation:
      'Field Arsenal treats both kits alike; Forge order fills the first and second kit slots. Alternative considered: diagnosing the pair; rejected because swapping the slots changes nothing the passage decides.',
  },
  ...abilityRules('tactician', 'class-tactician', {
    three: 'tactician-1-7',
    five: 'tactician-1-8',
    seven: 'tactician-3-2',
  }),
  ...perkRules('tactician', 'class-tactician', 'tactician-2-1'),
  // feature/tactician/level-1/tactical-doctrine.md: a skill from the doctrine's group.
  'class:class-tactician/tactician-sub-1@1#tactician-sub-1-1-1': decision(
    'class.tactician.doctrine-skill',
  ),
  'class:class-tactician/tactician-sub-2@1#tactician-sub-2-1-1': decision(
    'class.tactician.doctrine-skill',
  ),
  'class:class-tactician/tactician-sub-3@1#tactician-sub-3-1-1': decision(
    'class.tactician.doctrine-skill',
  ),
  // feature/tactician/level-2/2nd-level-doctrine-ability.md
  'class:class-tactician/tactician-sub-1@2#tactician-sub-1-2-2': decision(
    'class.tactician.level-2.insurgent-ability',
  ),
  'class:class-tactician/tactician-sub-2@2#tactician-sub-2-2-2': decision(
    'class.tactician.level-2.mastermind-ability',
  ),
  'class:class-tactician/tactician-sub-3@2#tactician-sub-3-2-2': decision(
    'class.tactician.level-2.vanguard-ability',
  ),

  // ---- Censor (class/censor.md; feature/censor/level-*/) ----
  'class:class-censor@1#censor-1-1': decision('class.censor.skills'),
  'class:class-censor@1#censor-1-5': decision('kit.choice'),
  ...abilityRules('censor', 'class-censor', {
    signature: 'censor-1-8',
    three: 'censor-1-9',
    five: 'censor-1-10',
    seven: 'censor-3-2',
  }),
  ...perkRules('censor', 'class-censor', 'censor-2-1'),
  // feature/censor/level-1/censor-order.md: Exorcist Read Person, Oracle Magic, Paragon Lead.
  'class:class-censor/censor-sub-1@1#censor-sub-1-1-1': fixed(
    'Read Person',
    md('feature/censor/level-1/censor-order.md'),
  ),
  'class:class-censor/censor-sub-2@1#censor-sub-2-1-1': fixed(
    'Magic',
    md('feature/censor/level-1/censor-order.md'),
  ),
  'class:class-censor/censor-sub-3@1#censor-sub-3-1-1': fixed(
    'Lead',
    md('feature/censor/level-1/censor-order.md'),
  ),
  // feature/censor/level-2/2nd-level-order-ability.md
  'class:class-censor/censor-sub-1@2#censor-sub-1-2-3': decision(
    'class.censor.level-2.exorcist-ability',
  ),
  'class:class-censor/censor-sub-2@2#censor-sub-2-2-3': decision(
    'class.censor.level-2.oracle-ability',
  ),
  'class:class-censor/censor-sub-3@2#censor-sub-3-2-3': decision(
    'class.censor.level-2.paragon-ability',
  ),

  // ---- Conduit (class/conduit.md; feature/conduit/level-*/) ----
  'class:class-conduit@1#conduit-1-1': decision('class.conduit.skills'),
  'class:class-conduit@1#conduit-1-7': decision('class.conduit.triggered-action'),
  'class:class-conduit@1#conduit-1-8': decision('class.conduit.prayer'),
  'class:class-conduit@1#conduit-1-9': decision('class.conduit.ward'),
  ...abilityRules(
    'conduit',
    'class-conduit',
    {
      signature: 'conduit-1-10',
      three: 'conduit-1-11',
      five: 'conduit-1-12',
      seven: 'conduit-3-2',
    },
    'class.conduit.signature-abilities',
  ),
  ...perkRules('conduit', 'class-conduit', 'conduit-2-2'),

  // ---- Troubadour (class/troubadour.md; feature/troubadour/level-*/) ----
  'class:class-troubadour@1#troubadour-3': fixed('Read Person', md('class/troubadour.md')),
  'class:class-troubadour@1#troubadour-4': decision('class.troubadour.skills.interpersonal'),
  'class:class-troubadour@1#troubadour-5': decision('class.troubadour.skills.intrigue-lore'),
  'class:class-troubadour@1#troubadour-7': decision('kit.choice'),
  ...abilityRules('troubadour', 'class-troubadour', {
    signature: 'troubadour-12',
    three: 'troubadour-13',
    five: 'troubadour-14',
    seven: 'troubadour-21',
  }),
  ...perkRules('troubadour', 'class-troubadour', 'troubadour-20'),
  'class:class-troubadour@2#troubadour-16': decision('class.troubadour.level-2.invocation'),
  // feature/troubadour/level-1/troubadour-class-act.md: Auteur Brag, Duelist Gymnastics, Virtuoso Music.
  'class:class-troubadour/troubadour-auteur@1#troubadour-auteur-1': fixed(
    'Brag',
    md('feature/troubadour/level-1/troubadour-class-act.md'),
  ),
  'class:class-troubadour/troubadour-duelist@1#troubadour-duelist-1': fixed(
    'Gymnastics',
    md('feature/troubadour/level-1/troubadour-class-act.md'),
  ),
  'class:class-troubadour/troubadour-virtuoso@1#troubadour-virtuoso-1': fixed(
    'Music',
    md('feature/troubadour/level-1/troubadour-class-act.md'),
  ),
  'class:class-troubadour/troubadour-auteur@2#troubadour-auteur-5': decision(
    'class.troubadour.level-2.auteur-ability',
  ),
  'class:class-troubadour/troubadour-duelist@2#troubadour-duelist-5': decision(
    'class.troubadour.level-2.duelist-ability',
  ),
  'class:class-troubadour/troubadour-virtuoso@2#troubadour-virtuoso-7': decision(
    'class.troubadour.level-2.virtuoso-ability',
  ),

  // ---- Null (class/null.md; feature/null/level-*/) ----
  'class:class-null@1#null-1-1': fixed('Psionics', md('class/null.md')),
  'class:class-null@1#null-1-2': decision('class.null.skills'),
  'class:class-null@1#null-1-7': decision('class.null.augmentation'),
  ...abilityRules(
    'null',
    'class-null',
    { signature: 'null-1-9', three: 'null-1-10', five: 'null-1-11', seven: 'null-3-3' },
    'class.null.signature-abilities',
  ),
  ...perkRules('null', 'class-null', 'null-2-1'),
  // feature/null/level-1/null-tradition.md: one skill from the tradition's group.
  'class:class-null/null-sub-1@1#null-sub-1-1-1': decision(
    'class.null.tradition-skill.chronokinetic',
  ),
  'class:class-null/null-sub-2@1#null-sub-2-1-1': decision(
    'class.null.tradition-skill.cryokinetic',
  ),
  'class:class-null/null-sub-3@1#null-sub-3-1-1': decision(
    'class.null.tradition-skill.metakinetic',
  ),
  // feature/null/level-2/2nd-level-tradition-ability.md
  'class:class-null/null-sub-1@2#null-sub-1-2-2': decision(
    'class.null.level-2.chronokinetic-ability',
  ),
  'class:class-null/null-sub-2@2#null-sub-2-2-2': decision(
    'class.null.level-2.cryokinetic-ability',
  ),
  'class:class-null/null-sub-3@2#null-sub-3-2-2': decision(
    'class.null.level-2.metakinetic-ability',
  ),

  // ---- Talent (class/talent.md; feature/talent/level-*/) ----
  'class:class-talent@1#talent-skill-a': fixed(['Psionics', 'Read Person'], md('class/talent.md')),
  'class:class-talent@1#talent-skill-c': decision('class.talent.skills'),
  // feature/talent/level-1/telepathic-speech.md: "You know the Mindspeech language".
  'class:class-talent@1#talent-1-3': fixed(
    'Mindspeech',
    md('feature/talent/level-1/telepathic-speech.md'),
  ),
  'class:class-talent@1#talent-1-5': decision('class.talent.augmentation'),
  'class:class-talent@1#talent-1-6': decision('class.talent.ward'),
  ...abilityRules(
    'talent',
    'class-talent',
    { signature: 'talent-1-7', three: 'talent-1-8', five: 'talent-1-9', seven: 'talent-3-2' },
    'class.talent.signature-abilities',
  ),
  ...perkRules('talent', 'class-talent', 'talent-2-1'),
  // feature/talent/level-2/2nd-level-tradition-ability.md
  'class:class-talent/talent-sub-1@2#talent-sub-1-2-2': decision(
    'class.talent.level-2.chronopathy-ability',
  ),
  'class:class-talent/talent-sub-2@2#talent-sub-2-2-2': decision(
    'class.talent.level-2.telekinesis-ability',
  ),
  'class:class-talent/talent-sub-3@2#talent-sub-3-2-2': decision(
    'class.talent.level-2.telepathy-ability',
  ),

  // ---- Beastheart (class/beastheart.md; feature/beastheart/level-*/) ----
  // class/beastheart.md: "You gain the Animal Handling skill", linked to skill.interpersonal/handle-animals.
  'class:class-beastheart@1#beastheart-1-1a': fixed('Handle Animals', md('class/beastheart.md')),
  'class:class-beastheart@1#beastheart-1-1b': decision('class.beastheart.skills'),
  // feature/beastheart/level-1/companion.md
  'class:class-beastheart@1#beastheart-1-2a': decision('class.beastheart.companion'),
  'class:class-beastheart@1#beastheart-1-5': decision('kit.choice'),
  ...abilityRules('beastheart', 'class-beastheart', {
    signature: 'beastheart-1-7',
    three: 'beastheart-1-8',
    five: 'beastheart-1-9',
    seven: 'beastheart-3-1',
  }),
  ...perkRules('beastheart', 'class-beastheart', 'beastheart-2-1'),
  // feature/beastheart/level-1/wild-nature.md: Guardian Read Person, Prowler Hide, Punisher
  // Endurance, Spark Magic.
  'class:class-beastheart/beastheart-sub-1@1#beastheart-sub-1-1-1': fixed(
    'Read Person',
    md('feature/beastheart/level-1/wild-nature.md'),
  ),
  'class:class-beastheart/beastheart-sub-2@1#beastheart-sub-2-1-1': fixed(
    'Hide',
    md('feature/beastheart/level-1/wild-nature.md'),
  ),
  'class:class-beastheart/beastheart-sub-3@1#beastheart-sub-3-1-1': fixed(
    'Endurance',
    md('feature/beastheart/level-1/wild-nature.md'),
  ),
  'class:class-beastheart/beastheart-sub-4@1#beastheart-sub-4-1-1': fixed(
    'Magic',
    md('feature/beastheart/level-1/wild-nature.md'),
  ),
  // feature/beastheart/level-2/2nd-level-wild-nature-ability.md
  'class:class-beastheart/beastheart-sub-1@2#beastheart-sub-1-2-2': decision(
    'class.beastheart.level-2.guardian-ability',
  ),
  'class:class-beastheart/beastheart-sub-2@2#beastheart-sub-2-2-2': decision(
    'class.beastheart.level-2.prowler-ability',
  ),
  'class:class-beastheart/beastheart-sub-3@2#beastheart-sub-3-2-2': decision(
    'class.beastheart.level-2.punisher-ability',
  ),
  'class:class-beastheart/beastheart-sub-4@2#beastheart-sub-4-2-2': decision(
    'class.beastheart.level-2.spark-ability',
  ),

  // ---- Summoner (class/summoner.md; feature/summoner/level-*/) ----
  'class:class-summoner@1#summoner-1-1': fixed(['Magic', 'Strategy'], md('class/summoner.md')),
  'class:class-summoner@1#summoner-1-1c': decision('class.summoner.skills'),
  // feature/summoner/level-1/formation.md: "Choose one of the following formations: horde,
  // platoon, elite, or leader." Forge names the options "<Name> Formation"; its ids are mapped.
  'class:class-summoner@1#summoner-1-7': decision('class.summoner.formation', {
    'summoner-1-7a': 'Horde',
    'summoner-1-7b': 'Platoon',
    'summoner-1-7c': 'Elite',
    'summoner-1-7d': 'Leader',
  }),
  // feature/summoner/level-1/quick-command.md (Forge "Tactic Call")
  'class:class-summoner@1#summoner-1-8': decision('class.summoner.quick-command'),
  'class:class-summoner@1#summoner-1-9': decision('class.summoner.ability-5'),
  ...perkRules('summoner', 'class-summoner', 'summoner-2-1'),
  // feature/summoner/level-3/*-ward.md
  'class:class-summoner@3#summoner-3-2': decision('class.summoner.level-3.ward'),
  'class:class-summoner@3#summoner-3-3': decision('class.summoner.level-3.ability-7'),
  // feature/summoner/level-1/portfolio.md and feature/summoner/level-2/new-portfolio-minion.md
  'class:class-summoner/summoner-sub-1@1#summoner-1-1-4': decision(
    'class.summoner.portfolio.blight.1',
  ),
  'class:class-summoner/summoner-sub-1@1#summoner-1-1-5': decision(
    'class.summoner.portfolio.blight.3',
  ),
  'class:class-summoner/summoner-sub-1@2#summoner-1-2-2': decision(
    'class.summoner.portfolio.blight.5',
  ),
  'class:class-summoner/summoner-sub-4@1#summoner-4-1-4': decision(
    'class.summoner.portfolio.graves.1',
  ),
  'class:class-summoner/summoner-sub-4@1#summoner-4-1-5': decision(
    'class.summoner.portfolio.graves.3',
  ),
  'class:class-summoner/summoner-sub-4@2#summoner-4-2-2': decision(
    'class.summoner.portfolio.graves.5',
  ),
  'class:class-summoner/summoner-sub-3@1#summoner-3-1-4': decision(
    'class.summoner.portfolio.spring.1',
  ),
  'class:class-summoner/summoner-sub-3@1#summoner-3-1-5': decision(
    'class.summoner.portfolio.spring.3',
  ),
  'class:class-summoner/summoner-sub-3@2#summoner-3-2-2': decision(
    'class.summoner.portfolio.spring.5',
  ),
  // Forge grants Elemental Mote outright and offers one more signature minion; Salient's
  // class.summoner.portfolio.storms.1 is a choice of two that includes Elemental Mote.
  'class:class-summoner/summoner-sub-2@1#summoner-2-1-5': {
    kind: 'unmapped',
    reason:
      'Forge fixes Elemental Mote and offers one more signature minion; choose the two Storms signature minions in Salient.',
  },
  'class:class-summoner/summoner-sub-2@1#summoner-2-1-6': decision(
    'class.summoner.portfolio.storms.3',
  ),
  'class:class-summoner/summoner-sub-2@2#summoner-2-2-2': decision(
    'class.summoner.portfolio.storms.5',
  ),

  // Every hero: Forge offers a Common language; the Compendium fixes it (Draw Steel Heroes.md,
  // "All player characters know Caelian!").
  'hero#default-language': fixed('Caelian', 'en/books/heroes/clean/Draw Steel Heroes.md'),
};

/**
 * Salient decisions no pinned Forge hero field records (V182). The importer reports each one that
 * applies to the imported build, with this reason; the decision stays open for the owner.
 */
export const forgeAbsentDecisions: Record<string, string> = {
  // feature/beastheart/level-1/kit.md: the companion chooses the kit's melee damage bonus or +0/+0/+4.
  'class.beastheart.companion-melee-bonus':
    'Forge does not record the companion melee damage bonus choice.',
  // feature/companion/beastheart/drake/level-1/elementally-attuned.md
  'class.beastheart.drake-attunement': "Forge does not record the drake's attuned damage type.",
  // feature/tactician/level-1/field-arsenal.md: "If both kits grant you the same benefit, you take
  // one or the other"; the choice exists only while the two kits print different values.
  ...Object.fromEntries(
    [
      'stamina',
      'speed',
      'stability',
      'disengage',
      'meleeDamage',
      'rangedDamage',
      'meleeDistance',
      'rangedDistance',
    ].map(benefit => [
      `class.tactician.arsenal.${benefit}`,
      `Forge does not record which kit's ${benefit} bonus Field Arsenal takes.`,
    ]),
  ),
};

export const ruleKey = (scope: string, featureId: string) => `${scope}#${featureId}`;
