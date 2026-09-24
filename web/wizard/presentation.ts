// SPDX-License-Identifier: GPL-3.0-only
import type { Decision, Step } from '../../shared/evaluate/definitions';
import type { RuleReference } from '../rules/reference';
import { sectionId } from '../rules/reference';

export const DECISION_LABELS: Record<string, string> = {
  'think.prompts': 'Imagine your hero',
  'ancestry.choice': 'Choose an ancestry',
  'ancestry.devil.base-statistics': 'Starting statistics',
  'ancestry.polder.base-statistics': 'Starting statistics',
  'ancestry.polder.signature-trait': 'Signature trait',
  'ancestry.polder.purchased-traits': 'Choose ancestry traits',
  'ancestry.devil.signature-trait': 'Signature trait',
  'ancestry.devil.silver-tongue-skill': 'Silver Tongue skill',
  'ancestry.devil.purchased-traits': 'Choose ancestry traits',
  'culture.name': 'Culture name',
  'culture.preset': 'Culture',
  'culture.caelian': 'Common language',
  'culture.language': 'Additional language',
  'culture.environment': 'Environment',
  'culture.environment.skill': 'Environment skill',
  'culture.organization': 'Organization',
  'culture.organization.skill': 'Organization skill',
  'culture.upbringing': 'Upbringing',
  'culture.upbringing.skill': 'Upbringing skill',
  'culture.edge': 'Using your culture',
  'career.choice': 'Choose a career',
  'career.soldier.skill.exploration': 'Exploration skill',
  'career.soldier.skill.intrigue': 'Intrigue skill',
  'career.soldier.languages': 'Career languages',
  'career.soldier.renown': 'Starting Renown',
  'career.soldier.perk': 'Career perk',
  'career.soldier.inciting-incident': 'Inciting incident',
  'career.what-was-taken': 'What was taken from you?',
  'class.choice': 'Choose a class',
  'class.level': 'Starting level',
  'class.elementalist.fixed-characteristics': 'Reason',
  'class.elementalist.characteristic-array': 'Choose characteristic values',
  'class.elementalist.array-assignment': 'Assign characteristic values',
  'class.elementalist.baseline': 'Starting class statistics',
  'class.elementalist.skill.magic': 'Class skill',
  'class.elementalist.skills': 'Additional class skills',
  'class.elementalist.magic-replacement': 'Replacement for duplicate Magic skill',
  'career.mages-apprentice.skill.magic': 'Career skill',
  'class.elementalist.features': 'Class features',
  'class.elementalist.specialization': 'Elemental specialization',
  'class.elementalist.enchantment': 'Enchantment',
  'class.elementalist.ward': 'Ward',
  'class.elementalist.signature-abilities': 'Signature abilities',
  'class.elementalist.ability-3': '3-Essence ability',
  'class.elementalist.ability-5': '5-Essence ability',
  'class.summoner.circle': 'Summoner circle',
  'class.summoner.formation': 'Formation',
  'class.summoner.quick-command': 'Quick command',
  'class.summoner.ability-5': '5-Essence ability',
  'class.summoner.portfolio.blight.1': 'Blight signature minions (choose two)',
  'class.summoner.portfolio.blight.3': 'Blight 3-Essence minions (choose two)',
  'class.summoner.portfolio.graves.1': 'Graves signature minions (choose two)',
  'class.summoner.portfolio.graves.3': 'Graves 3-Essence minions (choose two)',
  'class.summoner.portfolio.spring.1': 'Spring signature minions (choose two)',
  'class.summoner.portfolio.spring.3': 'Spring 3-Essence minions (choose two)',
  'class.summoner.portfolio.storms.1': 'Storms signature minions (choose two)',
  'class.summoner.portfolio.storms.3': 'Storms 3-Essence minions (choose two)',
  'class.beastheart.wild-nature': 'Wild nature',
  'class.beastheart.companion': 'Companion species',
  'class.beastheart.drake-attunement': 'Drake damage type',
  'class.beastheart.companion-melee-bonus': 'Companion melee damage bonus',
  'class.beastheart.signature-ability': 'Signature ability',
  'class.beastheart.ability-3': '3-Ferocity companion ability',
  'class.beastheart.ability-5': '5-Ferocity ability',
  'class.talent.tradition': 'Talent tradition',
  'class.talent.augmentation': 'Psionic augmentation',
  'class.talent.ward': 'Psionic ward',
  'class.talent.skills': 'Two interpersonal or lore skills',
  'class.talent.signature-abilities': 'Two signature abilities',
  'class.talent.ability-3': '3-Clarity ability',
  'class.talent.ability-5': '5-Clarity ability',
  'class.null.tradition': 'Null tradition',
  'class.null.augmentation': 'Psionic augmentation',
  'class.null.skills': 'Two interpersonal or lore skills',
  'class.null.signature-abilities': 'Two signature abilities',
  'class.null.ability-3': '3-Discipline ability',
  'class.null.ability-5': '5-Discipline ability',
  'class.troubadour.class-act': 'Class act',
  'class.troubadour.skills.interpersonal': 'Two interpersonal skills',
  'class.troubadour.skills.intrigue-lore': 'Intrigue or lore skill',
  'class.troubadour.ability-3': '3-Drama ability',
  'class.troubadour.ability-5': '5-Drama ability',
  'class.conduit.fixed-characteristics': 'Intuition',
  'class.conduit.characteristic-array': 'Choose characteristic values',
  'class.conduit.array-assignment': 'Assign characteristic values',
  'class.conduit.baseline': 'Starting class statistics',
  'class.conduit.skills': 'Class skills',
  'class.conduit.features': 'Class features',
  'class.conduit.prayer': 'Prayer',
  'class.conduit.ward': 'Conduit ward',
  'class.conduit.triggered-action': 'Triggered action',
  'class.conduit.signature-abilities': 'Two signature abilities',
  'class.conduit.ability-3': '3-Piety ability',
  'class.conduit.ability-5': '5-Piety ability',
  'class.censor.fixed-characteristics': 'Might and Presence',
  'class.censor.characteristic-array': 'Choose characteristic values',
  'class.censor.array-assignment': 'Assign characteristic values',
  'class.censor.baseline': 'Starting class statistics',
  'class.censor.skills': 'Class skills',
  'class.censor.features': 'Class features',
  'class.censor.order': 'Censor order',
  'class.censor.signature-ability': 'Signature ability',
  'class.censor.ability-3': '3-Wrath ability',
  'class.censor.ability-5': '5-Wrath ability',
  'class.shadow.fixed-characteristics': 'Agility',
  'class.shadow.characteristic-array': 'Choose characteristic values',
  'class.shadow.array-assignment': 'Assign characteristic values',
  'class.shadow.baseline': 'Starting class statistics',
  'class.shadow.skills.fixed': 'Class skills',
  'class.shadow.skills': 'Additional class skills',
  'class.shadow.features': 'Class features',
  'class.shadow.college': 'Shadow college',
  'class.shadow.signature-ability': 'Signature ability',
  'class.shadow.ability-3': '3-Insight ability',
  'class.shadow.ability-5': '5-Insight ability',
  'class.shadow.level-4.agility': 'Level 4 Agility',
  'class.shadow.level-4.keep-it-down': 'Keep It Down',
  'class.shadow.level-4.night-watch': 'Night Watch',
  'class.shadow.level-4.surge-of-insight': 'Surge of Insight',
  'class.shadow.level-5.trail-of-cinders': 'Trail of Cinders',
  'class.shadow.level-5.volatile-reagents': 'Volatile Reagents',
  'class.shadow.level-5.harlequin-gambit': 'Harlequin Gambit',
  'class.shadow.level-6.umbral-form': 'Umbral Form',
  'class.shadow.level-4.stamina': 'Level 4 Stamina',
  'class.shadow.level-5.stamina': 'Level 5 Stamina',
  'class.shadow.level-6.stamina': 'Level 6 Stamina',
  'class.shadow.level-3.stamina': 'Level 3 Stamina',
  'class.shadow.level-3.careful-observation': 'Careful Observation',
  'class.shadow.level-3.ability-7': 'Level 3 7-Insight ability',
  'class.shadow.level-2.perk': 'Level 2 perk',
  'class.shadow.level-2.stamina': 'Level 2 Stamina',
  'class.shadow.level-2.burning-ash': 'Burning Ash',
  'class.shadow.level-2.trained-assassin': 'Trained Assassin',
  'class.shadow.level-2.friend': 'Friend!',
  'class.tactician.fixed-characteristics': 'Might and Reason',
  'class.tactician.characteristic-array': 'Choose characteristic values',
  'class.tactician.array-assignment': 'Assign characteristic values',
  'class.tactician.baseline': 'Starting class statistics',
  'class.tactician.skills.fixed': 'Class skill',
  'class.tactician.skills': 'Additional class skills',
  'class.tactician.features': 'Class features',
  'class.tactician.doctrine': 'Tactical doctrine',
  'class.tactician.doctrine-skill': 'Doctrine skill',
  'class.tactician.ability-3': '3-Focus ability',
  'class.tactician.ability-5': '5-Focus ability',
  'class.tactician.second-kit': 'Second kit (Field Arsenal)',
  'class.tactician.level-2.stamina': 'Level 2 Stamina',
  'class.tactician.level-2.perk': 'Level 2 perk',
  'class.tactician.level-2.infiltration-tactics': 'Infiltration Tactics',
  'class.tactician.level-2.goaded': 'Goaded',
  'class.tactician.level-2.melee-superiority': 'Melee Superiority',
  'class.tactician.level-2.insurgent-ability': 'Level 2 Insurgent ability',
  'class.tactician.level-2.mastermind-ability': 'Level 2 Mastermind ability',
  'class.tactician.level-2.vanguard-ability': 'Level 2 Vanguard ability',
  'class.tactician.level-3.stamina': 'Level 3 Stamina',
  'class.tactician.level-3.out-of-position': 'Out of Position',
  'class.tactician.level-3.ability-7': 'Level 3 7-Focus ability',
  'class.censor.level-2.stamina': 'Level 2 Stamina',
  'class.censor.level-2.perk': 'Level 2 perk',
  'class.censor.level-2.exorcist-features': 'Exorcist order features',
  'class.censor.level-2.oracle-features': 'Oracle order features',
  'class.censor.level-2.paragon-features': 'Paragon order features',
  'class.censor.level-2.exorcist-ability': 'Level 2 Exorcist ability',
  'class.censor.level-2.oracle-ability': 'Level 2 Oracle ability',
  'class.censor.level-2.paragon-ability': 'Level 2 Paragon ability',
  'class.censor.level-3.stamina': 'Level 3 Stamina',
  'class.censor.level-3.look-on-my-work-and-despair': 'Look On My Work and Despair',
  'class.censor.level-3.ability-7': 'Level 3 7-Wrath ability',
  'class.troubadour.level-2.stamina': 'Level 2 Stamina',
  'class.troubadour.level-2.appeal-to-the-muses': 'Appeal to the Muses',
  'class.troubadour.level-2.invocation': 'Level 2 invocation',
  'class.troubadour.level-2.perk': 'Level 2 perk',
  'class.troubadour.level-2.auteur-ability': 'Level 2 Auteur ability',
  'class.troubadour.level-2.duelist-ability': 'Level 2 Duelist ability',
  'class.troubadour.level-2.virtuoso-ability': 'Level 2 Virtuoso ability',
  'class.troubadour.level-3.stamina': 'Level 3 Stamina',
  'class.troubadour.level-3.missed-cue': 'Missed Cue',
  'class.troubadour.level-3.foil': 'Foil',
  'class.troubadour.level-3.second-album': 'Second Album',
  'class.troubadour.level-3.ability-7': 'Level 3 7-Drama ability',
  'class.null.level-2.stamina': 'Level 2 Stamina',
  'class.null.level-2.perk': 'Level 2 perk',
  'class.null.level-2.rapid-processing': 'Rapid Processing',
  'class.null.level-2.entropic-adaptability': 'Entropic Adaptability',
  'class.null.level-2.inertial-sink': 'Inertial Sink',
  'class.null.level-2.chronokinetic-ability': 'Level 2 Chronokinetic ability',
  'class.null.level-2.cryokinetic-ability': 'Level 2 Cryokinetic ability',
  'class.null.level-2.metakinetic-ability': 'Level 2 Metakinetic ability',
  'class.null.level-3.stamina': 'Level 3 Stamina',
  'class.null.level-3.features': 'Psionic Leap and Reorder',
  'class.null.level-3.ability-7': 'Level 3 7-Discipline ability',
  'class.elementalist.level-2.stamina': 'Level 2 Stamina',
  'class.elementalist.level-2.perk': 'Level 2 perk',
  'class.elementalist.level-2.disciple-of-earth': 'Disciple of Earth',
  'class.elementalist.level-2.disciple-of-fire': 'Disciple of Fire',
  'class.elementalist.level-2.disciple-of-the-green': 'Disciple of the Green',
  'class.elementalist.level-2.there-is-no-space-between': 'There Is No Space Between',
  'class.elementalist.level-2.ability-5': 'Level 2 new 5-Essence ability',
  'class.elementalist.level-3.stamina': 'Level 3 Stamina',
  'class.elementalist.level-3.earth-accepts-me': 'Earth Accepts Me',
  'class.elementalist.level-3.a-conversation-with-fire': 'A Conversation With Fire',
  'class.elementalist.level-3.remember-growth-and-sun-and-rain': 'Remember Growth and Sun and Rain',
  'class.elementalist.level-3.distance-is-only-memory': 'Distance Is Only Memory',
  'class.elementalist.level-3.ability-7': 'Level 3 7-Essence ability',
  'class.conduit.level-2.stamina': 'Level 2 Stamina',
  'class.conduit.level-2.the-lists-of-heaven': 'The Lists of Heaven',
  'class.conduit.level-2.perk': 'Level 2 perk',
  'class.conduit.level-2.domain-ability': 'Level 2 domain ability',
  'class.conduit.level-3.stamina': 'Level 3 Stamina',
  'class.conduit.level-3.minor-miracle': 'Minor Miracle',
  'class.conduit.level-3.ability-7': 'Level 3 7-Piety ability',
  'career.mages-apprentice.skills': 'Career skills',
  'career.mages-apprentice.perk': 'Career perk',
  'career.mages-apprentice.inciting-incident': 'Inciting incident',
  'career.mages-apprentice.languages': 'Career languages',
  'career.mages-apprentice.renown': 'Starting Renown',
  'class.fury.fixed-characteristics': 'Might and Agility',
  'class.fury.characteristic-array': 'Choose characteristic values',
  'class.fury.array-assignment': 'Assign characteristic values',
  'class.fury.baseline': 'Starting class statistics',
  'class.fury.skill.nature': 'Class skill',
  'class.fury.skills': 'Additional class skills',
  'class.fury.features': 'Class features',
  'class.fury.level-2.perk': 'Level 2 perk',
  'class.fury.level-2.aspect-ability': 'Level 2 Berserker ability',
  'class.fury.level-2.aspect-feature': 'Level 2 Berserker feature',
  'class.fury.level-2.stamina': 'Level 2 Stamina',
  'class.fury.level-2.reaver-ability': 'Level 2 Reaver ability',
  'class.fury.level-2.reaver-feature': 'Inescapable Wrath',
  'class.fury.level-2.stormwight-ability': 'Level 2 Stormwight ability',
  'class.fury.level-2.stormwight-feature': 'Tooth and Claw',
  'class.fury.level-3.stamina': 'Level 3 Stamina',
  'class.fury.level-3.immovable-object': 'Immovable Object',
  'class.fury.level-3.see-through-their-tricks': 'See Through Their Tricks',
  'class.fury.level-3.natures-knight': "Nature's Knight",
  'class.fury.level-3.ability-7': 'Level 3 7-Ferocity ability',
  'class.fury.aspect': 'Primordial aspect',
  'class.fury.signature-ability': 'Signature ability',
  'class.fury.ability-3': '3-Ferocity ability',
  'class.fury.ability-5': '5-Ferocity ability',
  'kit.choice': 'Choose a kit',
  'kit.mountain.contributions': 'Kit bonuses',
  'free-strikes.grant': 'Free strikes',
  'complication.choice': 'Complication',
  'details.name': 'Hero name',
  'details.appearance': 'Appearance',
  'details.backstory-and-personality': 'Backstory and personality',
  'connections.notes': 'Connections',
};
export function decisionLabel(id: string): string {
  const known = DECISION_LABELS[id];
  if (known) return known;
  if (id.endsWith('.inciting-incident')) return 'Inciting incident';
  if (/^career\..+\.perk$/.test(id)) return 'Career perk';
  if (/^career\..+\.languages$/.test(id)) return 'Career languages';
  if (/^career\..+\.skills$/.test(id)) return 'Career skills';
  if (id.endsWith('.renown')) return 'Starting Renown';
  if (id.endsWith('.wealth')) return 'Starting Wealth';
  return id
    .split('.')
    .at(-1)!
    .replace(/-/g, ' ')
    .replace(/^./, letter => letter.toUpperCase());
}
export function stepReference(step: Step): RuleReference {
  return {
    id: 'mcdm.heroes.v1/chapter/making-a-hero',
    section: sectionId(step.sourceStep),
    label: step.sourceStep,
  };
}
/** Source-only records in the old decision table map to their imported chapter sections. */
export function decisionReference(decision: Decision, step: Step): RuleReference {
  const label = decision.label ?? decisionLabel(decision.id);
  if (decision.source.endsWith('/making-a-hero.md')) return { ...stepReference(step), label };
  if (decision.id === 'ancestry.devil.base-statistics')
    return { id: 'mcdm.heroes.v1/ancestry/devil', label };
  if (decision.id.startsWith('culture.')) {
    const part = decision.id.split('.')[1];
    const section = part === 'edge' ? 'using-culture' : part === 'caelian' ? 'language' : part;
    return { id: 'mcdm.heroes.v1/chapter/background', section, label };
  }
  if (decision.id === 'career.what-was-taken')
    return { id: 'mcdm.heroes.v1/chapter/background', section: 'what-was-taken-from-you', label };
  return { sourcePath: decision.source, label };
}
/** Replace technical decision references inside evaluator guidance, preserving its meaning. */
export function readableGuidance(text: string): string {
  if (text.startsWith('Required choice missing:')) return 'Needs a selection';
  for (const id of Object.keys(DECISION_LABELS).sort((a, b) => b.length - a.length))
    text = text.replaceAll(id, decisionLabel(id));
  return text;
}

/**
 * Wizard names for steps the app calls something other than the book does (V96). The source step
 * name stays on the step's reference, so the rulebook link still reaches "9. Determine Details".
 */
const STEP_NAMES: Record<string, string> = {
  'step.details': 'Finalize',
};

/** The step name without its source number: "5. Class" → "Class". */
export function stepName(step: Step): string {
  return STEP_NAMES[step.id] ?? step.sourceStep.replace(/^\d+\.\s*/, '');
}

/**
 * One-sentence excerpts from the pinned Compendium's step descriptions
 * (vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md, "Step-by-Step Hero Making"),
 * quoted verbatim for the step description line and the SOURCE TEXT callout. Presentation only;
 * the readable reference behind the rulebook icon is the full section.
 */
const STEP_EXCERPTS: Record<string, string> = {
  'step.think': 'The first thing you should do is think about the kind of hero you want to make.',
  'step.ancestry':
    "Choose your hero's humanoid ancestry from among the range of ancestries available in the game.",
  'step.culture': "Choose or create your hero's culture.",
  'step.career':
    "Choose your hero's career, which describes what you did for a living before you became a hero.",
  'step.class':
    "Choose your hero's class. This choice has the biggest impact on how your hero interacts with the rules of the game, particularly the rules for combat.",
  'step.kit':
    'Your class might grant your hero a kit that helps define your approach to martial combat.',
  'step.free-strikes':
    "A free strike is a combat ability you can use when it's not your turn, representing the simplest and most basic weapon attack you can make.",
  'step.complication':
    'Complications represent those dramatic moments in a character’s backstory that give them pathos, a dramatic reason to be an outsider, doubts about the meaning of life, an urge to avoid intimacy, or an unstoppable vendetta against an enemy from the past.',
  'step.details':
    "Once you've created your hero, it's time to determine the additional details of their backstory, appearance, and personality.",
  'step.connections': 'Ask the Director if all the heroes start the campaign knowing each other.',
};
export function stepExcerpt(step: Step): string | undefined {
  return STEP_EXCERPTS[step.id];
}

/** The decision whose selected value the step rail shows at the right of the step row. */
const PRIMARY_DECISIONS: Record<string, string> = {
  'step.ancestry': 'ancestry.choice',
  'step.culture': 'culture.preset',
  'step.career': 'career.choice',
  'step.class': 'class.choice',
  'step.kit': 'kit.choice',
  'step.complication': 'complication.choice',
  'step.details': 'details.name',
};
export function primaryDecisionId(step: Step): string | undefined {
  return PRIMARY_DECISIONS[step.id];
}
