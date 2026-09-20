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
  if (text.startsWith('Required choice missing:')) return 'Make a selection to continue.';
  for (const id of Object.keys(DECISION_LABELS).sort((a, b) => b.length - a.length))
    text = text.replaceAll(id, decisionLabel(id));
  return text;
}

/** The step name without its source number: "5. Class" → "Class". */
export function stepName(step: Step): string {
  return step.sourceStep.replace(/^\d+\.\s*/, '');
}

/**
 * The step's number in the source's hero-making sequence: "9. Determine Details" → 9. The rail
 * shows this rather than the step's position in the presented list, so the numbers match the book
 * and the gap left by a step this milestone does not offer (8. Complication) stays visible.
 */
export function stepNumber(step: Step): number | null {
  const match = /^(\d+)\./.exec(step.sourceStep);
  return match ? Number(match[1]) : null;
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
