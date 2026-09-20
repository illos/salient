import { PERK_ABILITIES } from './perk-abilities.ts';
// SPDX-License-Identifier: GPL-3.0-only
/** V37 core background choices. Audited source: docs/research/v37-backgrounds.{json,md}.
 * Compendium fb83a789da8f0327a389c277a0c790b1648d5810 is the rules authority.
 * This module stores build choices, not gameplay resolution or renewable initial rewards.
 */
import type { DecisionDefinitions, DecisionOption } from '../evaluate/definitions.ts';
import { SUPPORTING_KITS, ORDINARY_KIT_NAMES } from './supporting-kits.ts';

interface CareerDefinition {
  name: string;
  slug: string;
  source: string;
  fixedSkills: string[];
  skills: { groups: string[]; names: string[]; count: number }[];
  skillQuote: string;
  languages: number;
  perkGroup: string;
}
export interface CareerBenefit {
  renown: number;
  wealth: number;
  projectPoints: number;
  source: string;
  quotes: { renown: string; wealth: string; projectPoints: string };
}
export interface CareerIncident {
  name: string;
  text: string;
  number: number;
  source: string;
}

const CAREERS: CareerDefinition[] = [
  {
    name: 'Agent',
    slug: 'agent',
    source: 'en/unified/md/career/agent.md',
    fixedSkills: ['Sneak'],
    skills: [
      {
        groups: ['interpersonal'],
        names: [],
        count: 1,
      },
      {
        groups: ['intrigue'],
        names: [],
        count: 1,
      },
    ],
    skillQuote:
      'The Sneak skill from the intrigue skill group, plus one skill from the interpersonal group and one other skill from the intrigue group',
    languages: 2,
    perkGroup: 'intrigue',
  },
  {
    name: 'Aristocrat',
    slug: 'aristocrat',
    source: 'en/unified/md/career/aristocrat.md',
    fixedSkills: [],
    skills: [
      {
        groups: ['interpersonal'],
        names: [],
        count: 1,
      },
      {
        groups: ['lore'],
        names: [],
        count: 1,
      },
    ],
    skillQuote: 'One skill from the interpersonal skill group and one skill from the lore group',
    languages: 1,
    perkGroup: 'lore',
  },
  {
    name: 'Artisan',
    slug: 'artisan',
    source: 'en/unified/md/career/artisan.md',
    fixedSkills: [],
    skills: [
      {
        groups: ['crafting'],
        names: [],
        count: 2,
      },
    ],
    skillQuote: 'Two skills from the crafting skill group',
    languages: 1,
    perkGroup: 'crafting',
  },
  {
    name: 'Beggar',
    slug: 'beggar',
    source: 'en/unified/md/career/beggar.md',
    fixedSkills: ['Rumors'],
    skills: [
      {
        groups: ['exploration'],
        names: [],
        count: 1,
      },
      {
        groups: ['interpersonal'],
        names: [],
        count: 1,
      },
    ],
    skillQuote:
      'The Rumors skill (from the lore skill group), plus one skill from the exploration group and one skill from the interpersonal group',
    languages: 2,
    perkGroup: 'interpersonal',
  },
  {
    name: 'Criminal',
    slug: 'criminal',
    source: 'en/unified/md/career/criminal.md',
    fixedSkills: ['Criminal Underworld'],
    skills: [
      {
        groups: ['intrigue'],
        names: [],
        count: 2,
      },
    ],
    skillQuote:
      'The Criminal Underworld skill (from the lore skill group), plus two skills from the intrigue group',
    languages: 1,
    perkGroup: 'intrigue',
  },
  {
    name: 'Disciple',
    slug: 'disciple',
    source: 'en/unified/md/career/disciple.md',
    fixedSkills: ['Religion'],
    skills: [
      {
        groups: ['lore'],
        names: [],
        count: 2,
      },
    ],
    skillQuote:
      'The Religion skill (from the lore skill group), plus two more skills from the lore group',
    languages: 0,
    perkGroup: 'supernatural',
  },
  {
    name: 'Explorer',
    slug: 'explorer',
    source: 'en/unified/md/career/explorer.md',
    fixedSkills: ['Navigate'],
    skills: [
      {
        groups: ['exploration'],
        names: [],
        count: 2,
      },
    ],
    skillQuote:
      'The Navigate skill (from the exploration skill group), plus two more skills from the exploration group',
    languages: 2,
    perkGroup: 'exploration',
  },
  {
    name: 'Farmer',
    slug: 'farmer',
    source: 'en/unified/md/career/farmer.md',
    fixedSkills: ['Handle Animals'],
    skills: [
      {
        groups: ['exploration'],
        names: [],
        count: 2,
      },
    ],
    skillQuote:
      'The Handle Animals skill (from the interpersonal skill group), plus two skills from the exploration group',
    languages: 1,
    perkGroup: 'exploration',
  },
  {
    name: 'Gladiator',
    slug: 'gladiator',
    source: 'en/unified/md/career/gladiator.md',
    fixedSkills: [],
    skills: [
      {
        groups: ['exploration'],
        names: [],
        count: 2,
      },
    ],
    skillQuote: 'Two skills from the exploration skill group',
    languages: 1,
    perkGroup: 'exploration',
  },
  {
    name: 'Laborer',
    slug: 'laborer',
    source: 'en/unified/md/career/laborer.md',
    fixedSkills: ['Endurance'],
    skills: [
      {
        groups: ['crafting', 'exploration'],
        names: [],
        count: 2,
      },
    ],
    skillQuote:
      'The Endurance skill (from the exploration skill group), plus two skills from either the crafting group or the exploration group',
    languages: 1,
    perkGroup: 'exploration',
  },
  {
    name: "Mage's Apprentice",
    slug: 'mages-apprentice',
    source: 'en/unified/md/career/mages-apprentice.md',
    fixedSkills: ['Magic'],
    skills: [
      {
        groups: ['lore'],
        names: [],
        count: 2,
      },
    ],
    skillQuote:
      'The Magic skill (from the lore skill group), plus two other skills from the lore group',
    languages: 1,
    perkGroup: 'supernatural',
  },
  {
    name: 'Performer',
    slug: 'performer',
    source: 'en/unified/md/career/performer.md',
    fixedSkills: [],
    skills: [
      {
        groups: [],
        names: ['Music', 'Perform'],
        count: 1,
      },
      {
        groups: ['interpersonal'],
        names: [],
        count: 2,
      },
    ],
    skillQuote:
      'The Music or Perform skill (from the interpersonal skill group), plus two more skills from the interpersonal group',
    languages: 0,
    perkGroup: 'interpersonal',
  },
  {
    name: 'Politician',
    slug: 'politician',
    source: 'en/unified/md/career/politician.md',
    fixedSkills: [],
    skills: [
      {
        groups: ['interpersonal'],
        names: [],
        count: 2,
      },
    ],
    skillQuote: 'Two skills from the interpersonal skill group',
    languages: 1,
    perkGroup: 'interpersonal',
  },
  {
    name: 'Sage',
    slug: 'sage',
    source: 'en/unified/md/career/sage.md',
    fixedSkills: [],
    skills: [
      {
        groups: ['lore'],
        names: [],
        count: 2,
      },
    ],
    skillQuote: 'Two skills from the lore skill group',
    languages: 1,
    perkGroup: 'lore',
  },
  {
    name: 'Sailor',
    slug: 'sailor',
    source: 'en/unified/md/career/sailor.md',
    fixedSkills: ['Swim'],
    skills: [
      {
        groups: ['exploration'],
        names: [],
        count: 2,
      },
    ],
    skillQuote:
      'Swim (from the exploration skill group), plus two more skills from the exploration group',
    languages: 2,
    perkGroup: 'exploration',
  },
  {
    name: 'Soldier',
    slug: 'soldier',
    source: 'en/unified/md/career/soldier.md',
    fixedSkills: [],
    skills: [
      {
        groups: ['exploration'],
        names: [],
        count: 1,
      },
      {
        groups: ['intrigue'],
        names: [],
        count: 1,
      },
    ],
    skillQuote: 'One skill from the exploration skill group and one skill from the intrigue group',
    languages: 2,
    perkGroup: 'exploration',
  },
  {
    name: 'Warden',
    slug: 'warden',
    source: 'en/unified/md/career/warden.md',
    fixedSkills: ['Nature'],
    skills: [
      {
        groups: ['exploration'],
        names: [],
        count: 1,
      },
      {
        groups: ['intrigue'],
        names: [],
        count: 1,
      },
    ],
    skillQuote:
      'Nature (from the lore skill group), plus one skill from the exploration group and one skill from the intrigue group',
    languages: 1,
    perkGroup: 'exploration',
  },
  {
    name: 'Watch Officer',
    slug: 'watch-officer',
    source: 'en/unified/md/career/watch-officer.md',
    fixedSkills: ['Alertness'],
    skills: [
      {
        groups: ['intrigue'],
        names: [],
        count: 2,
      },
    ],
    skillQuote:
      'Alertness (from the intrigue skill group), plus two more skills from the intrigue group',
    languages: 2,
    perkGroup: 'exploration',
  },
];

export const CAREER_BENEFITS: Record<string, CareerBenefit> = {
  Agent: {
    renown: 0,
    wealth: 0,
    projectPoints: 0,
    source: 'en/unified/md/career/agent.md',
    quotes: {
      renown: 'Renown: +0',
      wealth: 'Wealth: +0',
      projectPoints: 'Project Points: 0',
    },
  },
  Aristocrat: {
    renown: 1,
    wealth: 1,
    projectPoints: 0,
    source: 'en/unified/md/career/aristocrat.md',
    quotes: {
      renown: 'Renown: +1',
      wealth: 'Wealth: +1',
      projectPoints: 'Project Points: 0',
    },
  },
  Artisan: {
    renown: 0,
    wealth: 0,
    projectPoints: 240,
    source: 'en/unified/md/career/artisan.md',
    quotes: {
      renown: 'Renown: +0',
      wealth: 'Wealth: +0',
      projectPoints: 'Project Points: 240',
    },
  },
  Beggar: {
    renown: 0,
    wealth: 0,
    projectPoints: 0,
    source: 'en/unified/md/career/beggar.md',
    quotes: {
      renown: 'Renown: +0',
      wealth: 'Wealth: +0',
      projectPoints: 'Project Points: 0',
    },
  },
  Criminal: {
    renown: 0,
    wealth: 0,
    projectPoints: 120,
    source: 'en/unified/md/career/criminal.md',
    quotes: {
      renown: 'Renown: +0',
      wealth: 'Wealth: +0',
      projectPoints: 'Project Points: 120',
    },
  },
  Disciple: {
    renown: 0,
    wealth: 0,
    projectPoints: 240,
    source: 'en/unified/md/career/disciple.md',
    quotes: {
      renown: 'Renown: +0',
      wealth: 'Wealth: +0',
      projectPoints: 'Project Points: 240',
    },
  },
  Explorer: {
    renown: 0,
    wealth: 0,
    projectPoints: 0,
    source: 'en/unified/md/career/explorer.md',
    quotes: {
      renown: 'Renown: +0',
      wealth: 'Wealth: +0',
      projectPoints: 'Project Points: 0',
    },
  },
  Farmer: {
    renown: 0,
    wealth: 0,
    projectPoints: 120,
    source: 'en/unified/md/career/farmer.md',
    quotes: {
      renown: 'Renown: +0',
      wealth: 'Wealth: +0',
      projectPoints: 'Project Points: 120',
    },
  },
  Gladiator: {
    renown: 2,
    wealth: 0,
    projectPoints: 0,
    source: 'en/unified/md/career/gladiator.md',
    quotes: {
      renown: 'Renown: +2',
      wealth: 'Wealth: +0',
      projectPoints: 'Project Points: 0',
    },
  },
  Laborer: {
    renown: 0,
    wealth: 0,
    projectPoints: 120,
    source: 'en/unified/md/career/laborer.md',
    quotes: {
      renown: 'Renown: +0',
      wealth: 'Wealth: +0',
      projectPoints: 'Project Points: 120',
    },
  },
  "Mage's Apprentice": {
    renown: 1,
    wealth: 0,
    projectPoints: 0,
    source: 'en/unified/md/career/mages-apprentice.md',
    quotes: {
      renown: 'Renown: +1',
      wealth: 'Wealth: +0',
      projectPoints: 'Project Points: 0',
    },
  },
  Performer: {
    renown: 2,
    wealth: 0,
    projectPoints: 0,
    source: 'en/unified/md/career/performer.md',
    quotes: {
      renown: 'Renown: +2',
      wealth: 'Wealth: +0',
      projectPoints: 'Project Points: 0',
    },
  },
  Politician: {
    renown: 1,
    wealth: 1,
    projectPoints: 0,
    source: 'en/unified/md/career/politician.md',
    quotes: {
      renown: 'Renown: +1',
      wealth: 'Wealth: +1',
      projectPoints: 'Project Points: 0',
    },
  },
  Sage: {
    renown: 0,
    wealth: 0,
    projectPoints: 240,
    source: 'en/unified/md/career/sage.md',
    quotes: {
      renown: 'Renown: +0',
      wealth: 'Wealth: +0',
      projectPoints: 'Project Points: 240',
    },
  },
  Sailor: {
    renown: 0,
    wealth: 0,
    projectPoints: 0,
    source: 'en/unified/md/career/sailor.md',
    quotes: {
      renown: 'Renown: +0',
      wealth: 'Wealth: +0',
      projectPoints: 'Project Points: 0',
    },
  },
  Soldier: {
    renown: 1,
    wealth: 0,
    projectPoints: 0,
    source: 'en/unified/md/career/soldier.md',
    quotes: {
      renown: 'Renown: +1',
      wealth: 'Wealth: +0',
      projectPoints: 'Project Points: 0',
    },
  },
  Warden: {
    renown: 0,
    wealth: 0,
    projectPoints: 120,
    source: 'en/unified/md/career/warden.md',
    quotes: {
      renown: 'Renown: +0',
      wealth: 'Wealth: +0',
      projectPoints: 'Project Points: 120',
    },
  },
  'Watch Officer': {
    renown: 0,
    wealth: 0,
    projectPoints: 0,
    source: 'en/unified/md/career/watch-officer.md',
    quotes: {
      renown: 'Renown: +0',
      wealth: 'Wealth: +0',
      projectPoints: 'Project Points: 0',
    },
  },
};

export const CAREER_INCIDENTS: Record<string, CareerIncident[]> = {
  Agent: [
    {
      name: 'Disavowed',
      text: 'While on a dangerous espionage assignment, things went sideways. Although you escaped with your life, the mission was a public failure thanks to bad information your agency gave you. They denied you work for them, and you went on the run. Hero work will let you survive and clear your name.',
      number: 1,
      source: 'en/unified/md/career/agent.md',
    },
    {
      name: 'Faceless',
      text: 'Your identity was always hidden. It was your way of protecting those around you because the work you did spying on powerful entities came with dangers. Then your world came crashing down when an enemy [agent](scc.v1:mcdm.heroes.v1/career/agent) unmasked you, causing you to lose everything—your privacy, livelihood, loved ones, all gone in the blink of an eye. Instead of going into hiding, you became a public hero to protect the innocent in the name of those you lost.',
      number: 2,
      source: 'en/unified/md/career/agent.md',
    },
    {
      name: 'Free Agent',
      text: 'There was a time in your life when you used to sell information to the highest bidder. Your acts were unsanctioned by any one organization, but you were well-connected enough to trade in secrets. Politics never mattered much to you until the information you sold wound up causing a ripple effect of harm that eventually destroyed the place you once called home. You became a hero to make up for your past.',
      number: 3,
      source: 'en/unified/md/career/agent.md',
    },
    {
      name: 'Informed',
      text: 'After years of cultivating a rich list of informants, one of those informants risked everything to expose the heinous plans of powerful individuals. You promised to protect your informant, but your agency left them hanging—literally. You cut ties with your employer and swore to always make good on your word as a hero.',
      number: 4,
      source: 'en/unified/md/career/agent.md',
    },
    {
      name: 'Spies and Lovers',
      text: 'While embedded in an undercover assignment, you fell for someone on the other side. They discovered you were a double [agent](scc.v1:mcdm.heroes.v1/career/agent), and though you insisted your feelings were real, the deceit cut too deep for your love interest to ignore. They exposed you, spurned you, or died because of their closeness to you. You left the espionage business to become a hero with nothing to hide.',
      number: 5,
      source: 'en/unified/md/career/agent.md',
    },
    {
      name: 'Turncoat',
      text: 'You spent your life in service of your country or an organization that upheld your values. During your undercover operations, you discovered that everything you had been told was a lie. Whether you confronted your superiors or were exposed, you were stripped of your service medals before you left to become a true hero.',
      number: 6,
      source: 'en/unified/md/career/agent.md',
    },
  ],
  Aristocrat: [
    {
      name: 'Blood Money',
      text: "When you entered adulthood, you heard unsavory whispers about your family's fortune before learning that their wealth came at the cost of others' suffering. Whether you shed light on the secret or not, you left to become a hero stripped of noble title.",
      number: 1,
      source: 'en/unified/md/career/aristocrat.md',
    },
    {
      name: 'Charmed Life',
      text: 'Whether through some [supernatural](scc.v1:mcdm.heroes.v1/rule.general/supernatural) power or your innate persuasiveness, you were able to defraud other aristocrats. You did it for fun. And when you were found out, you lost your status. Whether you served time or escaped punishment, you decided to rehabilitate yourself and became a hero.',
      number: 2,
      source: 'en/unified/md/career/aristocrat.md',
    },
    {
      name: 'Inheritance',
      text: 'The guardians who instilled in you the virtues of doing the right thing were murdered in a senseless petty robbery. Though their wealth was bequeathed to you, it did little to assuage the guilt you felt for being unable to stop the deadly crime. You decided to use your riches to fund your life as a hero, whether publicly or using an alter ego.',
      number: 3,
      source: 'en/unified/md/career/aristocrat.md',
    },
    {
      name: 'Privileged Position',
      text: 'Life outside the manor never piqued your interest. You had everything you wanted. It thus came as a surprise when the peasants came to overthrow your family. You narrowly escaped, and for the first time witnessed the world. It caused you to become a hero for the people, fighting against inequities.',
      number: 4,
      source: 'en/unified/md/career/aristocrat.md',
    },
    {
      name: 'Royal Pauper',
      text: 'Seeking a break from noble duties, you sought a lookalike to switch identities with. It went so well that you made a habit of switching whenever you were bored. Unfortunately, your counterpart became so good at imitating you that they convinced all those around you that you were an impostor. You lost contact with your family, but now pursue a heroic path free of the pomp of your old life.',
      number: 5,
      source: 'en/unified/md/career/aristocrat.md',
    },
    {
      name: 'Wicked Secret',
      text: 'One parent passed away when you were a baby and the other remarried years later. Then that parent died under suspicious circumstances. Their spouse ousted you, and you were banished (and possibly hunted). Rising from tragedy, you now seek to right the wrongs of the world.',
      number: 6,
      source: 'en/unified/md/career/aristocrat.md',
    },
  ],
  Artisan: [
    {
      name: 'Continue the Work',
      text: "A great hero was a fan of the things you created and gave you a generous commission to create your best work for them. While working on this commission, you and the hero became close friends. The day you finished the work was the same day they disappeared. To honor their legacy, you took up the mantle of a hero with the intent of finishing your friend's work.",
      number: 1,
      source: 'en/unified/md/career/artisan.md',
    },
    {
      name: 'Inspired',
      text: "As you traveled the road selling your wares, troll bandits attacked you. One of the bandits claimed an item belonging to someone precious to you—or perhaps claimed that person's life—but the rest were driven off or slain by a group of heroes. Seeing the quick work those heroes made of the bandits inspired you to follow in their footsteps.",
      number: 2,
      source: 'en/unified/md/career/artisan.md',
    },
    {
      name: 'Robbery',
      text: 'A [criminal](scc.v1:mcdm.heroes.v1/career/criminal) gang stole your goods and harmed a number of people who worked for you. You became a hero to prevent such indignities from being visited upon others, to seek revenge for the assault, or to find the thieves and get your stuff back.',
      number: 3,
      source: 'en/unified/md/career/artisan.md',
    },
    {
      name: 'Stolen Passions',
      text: 'Your parents discouraged your artistic [talents](scc.v1:mcdm.heroes.v1/class/talent), instead trying to focus your passions on the family business. You refused to dim your spark and continued your work in secret. Enraged at discovering your disobedience, they sold your work to a traveling merchant. You left your hometown, seeking your lost art and encouraging others to live freely.',
      number: 4,
      source: 'en/unified/md/career/artisan.md',
    },
    {
      name: 'Tarnished Honor',
      text: 'A new patron commissioned some art, but on completion, they refused to pay you and claimed the work as their own. You were accused of plagiarism and run out of town. For you, heroics are about restoring your name and honor.',
      number: 5,
      source: 'en/unified/md/career/artisan.md',
    },
    {
      name: 'Twisted Skill',
      text: 'You had great success that caused an unscrupulous rival to curse you. For a time, everything you tried to create turned to ruin. You broke the curse through adventuring, and in doing so, discovered a new joy and purpose that now defines you.',
      number: 6,
      source: 'en/unified/md/career/artisan.md',
    },
  ],
  Beggar: [
    {
      name: 'Champion',
      text: 'You were never content with your lot. Watching yet another friend fall to preventable circumstances was your last straw. You gathered up what little you had and set off to become a hero, determined to make real change for those society forgot.',
      number: 1,
      source: 'en/unified/md/career/beggar.md',
    },
    {
      name: 'Night Terrors',
      text: "Something killed the other beggars. It came in the night. You barely saw it, but what you did see of it wasn't natural. You survived by hiding, or perhaps it simply passed you over for reasons unknown to you. It still haunts your nightmares, and you kill monsters so no one else has to experience such horrors.",
      number: 2,
      source: 'en/unified/md/career/beggar.md',
    },
    {
      name: 'One Good Deed',
      text: "You ran afoul of the local watch by being in the wrong place when they were in a bad mood. A passing hero intervened on your behalf, shaming the guards into moving on, then gave you enough gold to get you back on your feet. Their kindness kindled a spark in you. You took the gold, bought some secondhand gear, and went to pay that hero's kindness forward.",
      number: 3,
      source: 'en/unified/md/career/beggar.md',
    },
    {
      name: 'Precious',
      text: "No matter how far you'd fallen, there was one belonging you would never part with, no matter how much money it would bring you. When a pickpocket stole that object, you chased them until you were in a part of the city you no longer recognized. With a jolt, you realized you had no desire to return to your previous stomping grounds. You kept going, and you haven't looked back.",
      number: 4,
      source: 'en/unified/md/career/beggar.md',
    },
    {
      name: 'Strange Charity',
      text: "A passerby dropped something in your cup. When you counted your day's collections, you found a magic coin among the coppers. You knew immediately that it was special. When the other beggars—your friends, you thought—showed that they were ready to murder you for it, you killed several of them in self-defense before you fled, leaving behind the only semblance of community you had.",
      number: 5,
      source: 'en/unified/md/career/beggar.md',
    },
    {
      name: 'Witness',
      text: "You witnessed something you weren't meant to. Others would kill you if they knew, and they might be searching for you even now. You remain on the move, terrified of remaining in one place too long lest it all catch up to you. Perhaps if you make a big enough name for yourself, you can become untouchable and finally speak of what happened without fear.",
      number: 6,
      source: 'en/unified/md/career/beggar.md',
    },
  ],
  Criminal: [
    {
      name: 'Antiquity Procurement',
      text: "You stole, smuggled, and sold antiquities. In your haste to make a quick sale, you didn't fully vet a client and they subsequently robbed your warehouse. When the items you had stolen were taken from you, you realized the harm you had caused. Now you adventure to find those items you lost and return them to where they belong.",
      number: 1,
      source: 'en/unified/md/career/criminal.md',
    },
    {
      name: 'Atonement',
      text: 'The last [criminal](scc.v1:mcdm.heroes.v1/career/criminal) job you pulled led to the death of someone or the destruction of something you love. To make up for the loss you caused, you left your [criminal](scc.v1:mcdm.heroes.v1/career/criminal) ways behind and became a hero.',
      number: 2,
      source: 'en/unified/md/career/criminal.md',
    },
    {
      name: 'Friendly Priest',
      text: "You went to prison for your crimes and eventually escaped. An elderly priest took you in and shielded you from the law, convinced that your soul wasn't corrupt. They never judged you for your past, speaking only of the future. Eventually, the priest died, imparting final words that inspired you to become a hero.",
      number: 3,
      source: 'en/unified/md/career/criminal.md',
    },
    {
      name: 'Shadowed Influence',
      text: 'You spent years blackmailing and manipulating nobles for influence and wealth until a scheme went wrong. You were publicly exposed, and after a narrow escape, you reevaluated your life. Under a new identity, you work as a hero and hope no one looks at your past too closely.',
      number: 4,
      source: 'en/unified/md/career/criminal.md',
    },
    {
      name: 'Simply Survival',
      text: 'Stealing was a matter of survival for you and not what defined you—at least in your mind. But when your thieving actions led to innocent folk being harmed, you knew you could be better. You turned your back on your old life, though your old skills still come in handy.',
      number: 5,
      source: 'en/unified/md/career/criminal.md',
    },
    {
      name: 'Stand Against Tyranny',
      text: "When a tyrant rose to power in your homeland, they began cracking down on all criminals with deadly raids and public executions. The nature of the crime didn't matter, with pickpockets and beggars made to kneel before the axe alongside murderers. After losing enough friends, you stood up and joined the resistance—not just against this tyrant, but against authoritarians anywhere.",
      number: 6,
      source: 'en/unified/md/career/criminal.md',
    },
  ],
  Disciple: [
    {
      name: "Angel's Advocate",
      text: "Swayed by an evil faith, your cult was about to unleash horrors upon the world when an angel (figurative or literal) intervened. They convinced you to stop your cult's plots. Now you follow in the footsteps of the angel who showed you the righteous path.",
      number: 1,
      source: 'en/unified/md/career/disciple.md',
    },
    {
      name: 'Dogma',
      text: 'Although you joined your religious institution under the guidance of a kind mentor, others within the house of worship became increasingly fanatical in their convictions. Your mentor sought to be a voice of reason in the rising tide of hatred and was tried as a heretic before being executed. Leaving the institution behind, you became a hero to uphold the beliefs you hold dear.',
      number: 2,
      source: 'en/unified/md/career/disciple.md',
    },
    {
      name: 'Freedom to Worship',
      text: "Your temple was destroyed in a religious conflict. The institution's leaders sought retaliation, but you saw in these actions a ceaseless cycle of destruction that would lead to more conflict. Instead, you became a hero to protect religious freedoms, so all worshippers might practice their faith without fear.",
      number: 3,
      source: 'en/unified/md/career/disciple.md',
    },
    {
      name: 'Lost Faith',
      text: 'You devoted your life to ministering to the sick and needy, alongside other charitable work. Time and time again, tragedy struck those you served without rhyme or reason. Your prayers went unanswered, and your efforts went thankless. Eventually, you lost your faith in a higher power, and you left your church or temple to do good outside of any religious affiliation.',
      number: 4,
      source: 'en/unified/md/career/disciple.md',
    },
    {
      name: 'Near-Death Experience',
      text: 'While serving at a religious institution, you almost died in an accident. When you woke, you had lost all memory of ever having worked for the church or temple. Though the clergy encouraged you to stay, you left to forge a new path. Your sense of altruism—whether instilled in you by your past work or a part of who you naturally are—guides you in your life.',
      number: 5,
      source: 'en/unified/md/career/disciple.md',
    },
    {
      name: 'Taxing Times',
      text: 'The faith-based organization you were once part of became corrupt. It used its status in the community to accumulate wealth through tithes, while its leaders sought political appointments. During a season of drought, the institution stockpiled resources and refused to give aid, resulting in the deaths of many. You became a hero to fight against such corruption and to honor those you lost.',
      number: 6,
      source: 'en/unified/md/career/disciple.md',
    },
  ],
  Explorer: [
    {
      name: 'Awakening',
      text: 'In an uncharted area, you awakened some fell horror. You subsequently turned to the life of a hero to put an end to the dread you unleashed and keep other hidden dangers at bay.',
      number: 1,
      source: 'en/unified/md/career/explorer.md',
    },
    {
      name: 'Missing Piece',
      text: "You made an important but dangerous discovery about a treasure or ancient ritual that could spell mass destruction. Then the unthinkable happened when an unscrupulous colleague, spy, or treasure hunter stole your research notes. You're looking for the thief now, and anyone else who might use such discoveries for ill.",
      number: 2,
      source: 'en/unified/md/career/explorer.md',
    },
    {
      name: 'Nothing Belongs in a Museum',
      text: "Exploring distant lands to collect valuable artifacts for cultural institutions was once your way of life. But when people died trying to reclaim one of the objects you took, you realized the truth. Your work was part of a larger problem of cultural theft, and the best place for these significant objects wasn't in a museum but with the people who created them. Setting out to return what had been taken and to protect others from theft set you on the path to become a hero.",
      number: 3,
      source: 'en/unified/md/career/explorer.md',
    },
    {
      name: 'Unschooled',
      text: 'You delved into dungeons and far-off places by studying them in books. You were an [explorer](scc.v1:mcdm.heroes.v1/career/explorer) who never felt the need to experience the dangers your peers did. Then your theory about a lost world cost you your reputation, and gave you the impetus to go on adventures and stand up for those with different ideas.',
      number: 4,
      source: 'en/unified/md/career/explorer.md',
    },
    {
      name: 'Wanderlust',
      text: 'You saw yourself as an observer and operated within a code of conduct. You swore to never interfere with a group by exposing them to your technology, knowledge, or values. But when faced with a moral conundrum, you either broke your code or stood idly by—and suffered the consequences. During this incident, you lost your observation journal but became a hero who refuses to let evil stand unchecked.',
      number: 5,
      source: 'en/unified/md/career/explorer.md',
    },
    {
      name: 'Wind in Your Sails',
      text: "As a seafaring [explorer](scc.v1:mcdm.heroes.v1/career/explorer), you lived to chart unknown courses. Though travel on the high seas was fraught with danger, the destination was always rewarding in riches, knowledge, or some other meaningful benefit. But your luck ran out when your ship was destroyed by pirates or other enemy forces. Now you've taken to protecting those who seek safe passage while also hoping to avenge your crew.",
      number: 6,
      source: 'en/unified/md/career/explorer.md',
    },
  ],
  Farmer: [
    {
      name: 'Blight',
      text: 'A horrible blight swept over your homeland, sickening the livestock and causing crops to rot. No one knows whether the blight is of natural origin or something more malevolent, but you set out in search of a way to cleanse the land of this affliction.',
      number: 1,
      source: 'en/unified/md/career/farmer.md',
    },
    {
      name: 'Bored',
      text: "You've always wanted so much more than gathering eggs and milking cows. You kept a secret journal of your dreams, filled with all the things you wanted. When your parent found the journal, they burned it and told you to keep your head out of the clouds. In response, you gathered what you could in a pack and left everything else behind, seeking a life of adventure.",
      number: 2,
      source: 'en/unified/md/career/farmer.md',
    },
    {
      name: 'Cursed',
      text: "While tilling your fields, you found something in the dirt. Perhaps it was a chipped and dented weapon, a piece of ancient jewelry, or something altogether unique. Excited by your find, you showed it to a loved one, but when they touched it, something happened. You now know it was a curse conveyed by the item, though you don't know why it affected them and not you. You left your old life in search of answers.",
      number: 3,
      source: 'en/unified/md/career/farmer.md',
    },
    {
      name: 'Hard Times',
      text: 'Your farm had always been prosperous, until the last few years. Changes in the weather caused smaller yields until you could no longer pay your tithe to the local noble. Her soldiers took what items of value they found, including a precious family heirloom. You left the struggling farm behind to find a better life.',
      number: 4,
      source: 'en/unified/md/career/farmer.md',
    },
    {
      name: 'Razed',
      text: "Your animals were killed, your crops and home set ablaze. The culprits might have been wandering bandits, raiders from a nearby kingdom, or hired thugs sent by a rival farm. Whoever they were, they left you with nothing. You couldn't face the thought of starting again from scratch, so you took up a life of heroism to protect others from such villainy.",
      number: 5,
      source: 'en/unified/md/career/farmer.md',
    },
    {
      name: 'Stolen',
      text: 'Your family bred horses—beautiful creatures that few could rival on the track and in the jousting lists. When a local noble arrived with an offer to buy your prized stallion, your father refused. The noble struck him down where he stood and stole the horse. Without that stallion, the [renown](scc.v1:mcdm.heroes.v1/rule.resource/renown)ed bloodline would end. You intend to get them back—and get revenge.',
      number: 6,
      source: 'en/unified/md/career/farmer.md',
    },
  ],
  Gladiator: [
    {
      name: 'Betrayed',
      text: "A local crime lord offered you money to throw your last bout, promising that you'd live through the ordeal and get a cut of all the wagers placed on the match. You upheld your end of the deal—which made the knife in your back after the bout so surprising. You woke in a shallow grave, barely alive, and ready to mete out justice.",
      number: 1,
      source: 'en/unified/md/career/gladiator.md',
    },
    {
      name: 'Heckler',
      text: 'As you stood victorious on the arena sands, a voice cried out among the cheering. "This violence is only for show. You should be ashamed. There are people who need you—who need your skills!" Why did that voice ring so clear? And why did it sound so familiar? You never saw the face of the person who uttered those words, but they weighed heavy on you. The next day, you fled the arena to begin a hero\'s life.',
      number: 2,
      source: 'en/unified/md/career/gladiator.md',
    },
    {
      name: 'Joined the Arena',
      text: 'As a child, you loved gladiatorial matches, captivated by the fierce displays of bravery and bravado, never giving much thought to how the competitors ended up in the ring. Then your friend was wrongly accused of a crime and sentenced to compete. You went in their place. After viewing what life was like for those forced to fight, you survived your sentence and resolved to protect the unfairly condemned.',
      number: 3,
      source: 'en/unified/md/career/gladiator.md',
    },
    {
      name: 'New Challenges',
      text: 'You earned every title you could. You beat every opponent willing to face you in the arena. Your final battle with your rival ended with you victorious—and still you were unsatisfied. Other, greater foes are out there. And you mean to find them.',
      number: 4,
      source: 'en/unified/md/career/gladiator.md',
    },
    {
      name: "Scion's Compassion",
      text: 'You were born a noble, but the duplicitous and power-hungry nature of your family had you seeking your own fortune in the arena. You saw that competitors brought there by circumstance and not choice suffered. You gave all you could of your family money to those lessfortunate folk, and then set out to make a real difference in this cruel world.',
      number: 5,
      source: 'en/unified/md/career/gladiator.md',
    },
    {
      name: "Warriors' Home",
      text: 'The orphanage you grew up in secretly supplied gladiators to the arena. Forced to fight against many childhood friends as an adult, you vowed to dismantle the arena and free other victims. You became a liberator, dedicated to ending the oppression of others until your [dying](scc.v1:mcdm.heroes.v1/rule.health/dying) breath.',
      number: 6,
      source: 'en/unified/md/career/gladiator.md',
    },
  ],
  Laborer: [
    {
      name: 'Deep Sentinel',
      text: "Spending your days cleaning and maintaining the sewers doesn't make you many friends. But you found companionship among the rats. You fought the monsters that hunted your friends, and which others ignored. After making the sewers safe for the rats, you decided to take your [talents](scc.v1:mcdm.heroes.v1/class/talent) to the surface and serve other humanoids who might appreciate your efforts in the same way.",
      number: 1,
      source: 'en/unified/md/career/laborer.md',
    },
    {
      name: 'Disaster',
      text: "A disaster, such as a cave-in, wildfire, or tidal wave, hit the work crew you were in charge of. You saved as many as you could, but the ones you couldn't save weigh heavily on your mind. You took up the life of a hero to save as many people as possible, vowing that what happened to you then won't happen again.",
      number: 2,
      source: 'en/unified/md/career/laborer.md',
    },
    {
      name: 'Embarrassment',
      text: "A noble you worked for admonished you publicly for work done poorly—and more than once. Finally, you'd had enough. You vowed to take up a new path and show this noble you're far more than what they make you out to be.",
      number: 3,
      source: 'en/unified/md/career/laborer.md',
    },
    {
      name: 'Live the Dream',
      text: "You worked with a good friend, and on the job, you would always fantasize about what it would be like to hit the road as adventuring heroes... someday. You didn't expect that your friend would fall ill and pass away. Now it's time to live out that dream for both of you.",
      number: 4,
      source: 'en/unified/md/career/laborer.md',
    },
    {
      name: 'Shining Light',
      text: "You kept a lighthouse along the constantly stormy cliffs of your village with your mentor. On a clear and sunny day, your mentor vanished. Finding only a cryptic notebook filled with his musings on the [supernatural](scc.v1:mcdm.heroes.v1/rule.general/supernatural), you left to find out what really happened. The trail has gone cold for now, and you're helping others find their loved ones in the meantime.",
      number: 5,
      source: 'en/unified/md/career/laborer.md',
    },
    {
      name: 'Slow and Steady',
      text: 'You labored silently as an uncaring boss drove those around you into the ground, pushing you to work harder to lessen the burden on your companions. But when the boss pushed too far and killed a friend of yours, you led an uprising against them. That was the start of your adventuring life.',
      number: 6,
      source: 'en/unified/md/career/laborer.md',
    },
  ],
  "Mage's Apprentice": [
    {
      name: 'Forgotten Memories',
      text: 'While practicing a spell, your inexperience caused the magic to backfire and your memories were wiped, leaving you with only fragments of who you once were. Determined to recall your past, you now dedicate yourself to helping others, hoping your actions will spark some remembrance or lead you to a way to reverse the magic.',
      number: 1,
      source: 'en/unified/md/career/mages-apprentice.md',
    },
    {
      name: 'Magic of Friendship',
      text: "As a sign of your status as a star pupil, your mentor gifted you a familiar as a magic pet. Another jealous apprentice captured the familiar and slipped away in the night. Haunted by your pet's absence, you adventure to find your kidnapped friend and prevent others from feeling your loss.",
      number: 2,
      source: 'en/unified/md/career/mages-apprentice.md',
    },
    {
      name: 'Missing Mage',
      text: "One day you woke up and the mage you worked for was gone. They didn't take any of their belongings and there was no sign of any foul play-only the scent of sulfur in their bedchamber. You set out on your heroic journey in the aftermath and have been looking for them ever since.",
      number: 3,
      source: 'en/unified/md/career/mages-apprentice.md',
    },
    {
      name: 'Nightmares Made Flesh',
      text: 'Your attempts at magic have always been unpredictable. A powerful mage promised to help you gain control. During your training, a terrible nightmare caused your body to flare with magic and pull the monster of your nightmare into the waking world. The horror escaped. You left, seeking to vanquish their vileness.',
      number: 4,
      source: 'en/unified/md/career/mages-apprentice.md',
    },
    {
      name: 'Otherworldly',
      text: "While studying magic, you accidentally sent yourself from your original world to this one. Now you're stranded here, hoping to find ancient texts or powerful magic treasures that might transport you back home. A life of adventure it is!",
      number: 5,
      source: 'en/unified/md/career/mages-apprentice.md',
    },
    {
      name: 'Ultimate Power',
      text: "The mage you worked for was a kindly old soul, but the basic magic they taught you always seemed like a small part of something bigger. It wasn't until you met an adventuring [elementalist](scc.v1:mcdm.heroes.v1/class/elementalist) that you realized hitting the road as a hero was the only way to truly improve and hone your skills. You resigned your apprenticeship and found yourself walking the path of a hero the next day.",
      number: 6,
      source: 'en/unified/md/career/mages-apprentice.md',
    },
  ],
  Performer: [
    {
      name: 'Cursed Audience',
      text: "During a performance, you watched in horror as the audience was suddenly overcome by a curse that caused them to disintegrate before your eyes. You aren't sure what happened, but seeking an answer quickly led you to places where only heroes dare to go.",
      number: 1,
      source: 'en/unified/md/career/performer.md',
    },
    {
      name: 'False Accolades',
      text: 'After a poor performance, you found a script to a wellwritten play left in your dressing room. The accompanying note asked that if you performed the play, you should give the author credit. But after a commanding performance, you claimed to be star and playwright both and the curse hidden on those pages activated. A small portion of your skin has begun to transform into undead flesh, and the only cure is to prove you have become selfless.',
      number: 2,
      source: 'en/unified/md/career/performer.md',
    },
    {
      name: 'Fame and Fortune',
      text: 'You thought you were famous—then that hero came to your show. Suddenly, all eyes were on the dragon-slaying brute instead of on the stage where they belonged. The audience even gave them a standing ovation when they entered the room. All you got was polite applause. Fine. If people want a hero so much, then a hero you shall be.',
      number: 3,
      source: 'en/unified/md/career/performer.md',
    },
    {
      name: 'Songs to the Dead',
      text: 'Your performances have always been tinged with a bit of melancholy. During a particularly soulful performance, spirits disturbed the living audience and sat in their chairs. They begged you to prevent their demise, providing no other details before disappearing. You set out to determine if you could help your most dedicated fans.',
      number: 4,
      source: 'en/unified/md/career/performer.md',
    },
    {
      name: 'Speechless',
      text: "A heckler's mocking words left you utterly speechless during a performance, stinging your pride and stirring your arrogance. The incident strained your legendary voice, and you could speak only in soft whispers. The heckler was a fey trickster who stole your voice, promising to give it back after you accomplished real good in the world.",
      number: 5,
      source: 'en/unified/md/career/performer.md',
    },
    {
      name: 'Tragic Lesson',
      text: 'When a producer who once shortchanged you shouted out on the street for you to stop a thief who had picked their pocket, your spite toward them inspired you to let the thief run right on by. But that decision led to tragedy when the thief later harmed someone you loved. From that moment on, you made it your responsibility to protect others.',
      number: 6,
      source: 'en/unified/md/career/performer.md',
    },
  ],
  Politician: [
    {
      name: 'Diplomatic Immunity',
      text: 'Your political power allowed you to be foolish without consequence. Through sheer carelessness or on a dare, you accidentally harmed or killed an innocent bystander. Due to your position as an official, you faced no consequences. But this event was the final straw for the person you loved or respected most, and they turned away from you. You left the world of political machinations behind to earn back their trust.',
      number: 1,
      source: 'en/unified/md/career/politician.md',
    },
    {
      name: 'Insurrectionist',
      text: 'You secretly funded a rebel organization intent on overthrowing the corrupt establishment. Someone discovered your treason, and you were forced to flee or risk execution. You became a hero to live and fight another day on behalf of those who have no power.',
      number: 2,
      source: 'en/unified/md/career/politician.md',
    },
    {
      name: 'Respected Consul',
      text: 'You were a seneschal to a leader, able to sway their opinions. But gossip convinced the leader you were plotting a coup, and you were ousted from their circle of influence. You became a hero to continue your work making meaningful change in the world.',
      number: 3,
      source: 'en/unified/md/career/politician.md',
    },
    {
      name: 'Right Side of History',
      text: 'You tried to work on policy change from the inside of a bureaucratic organization. There were others like you who were more vocal. You started to notice those colleagues were disappearing overnight. Not wanting to find out if you were next on the list, you left to enact change in more direct ways.',
      number: 4,
      source: 'en/unified/md/career/politician.md',
    },
    {
      name: 'Self-Serving',
      text: 'You used your skills to collect incriminating or scandalous information about your opponents to blackmail them. A rival got one step ahead of you and stole your book of dirty secrets. But instead of using it against you, they gave you an opportunity to leave the world of politics behind. Saved from public humiliation, you now use your skills for the greater good.',
      number: 5,
      source: 'en/unified/md/career/politician.md',
    },
    {
      name: 'Unbound',
      text: 'The red tape required to achieve anything through your political position resulted in a crisis being mishandled and countless people harmed or killed. After that unfortunate event, you resolved to live unfettered by bureaucratic interference, seeking to do good through action, not paperwork.',
      number: 6,
      source: 'en/unified/md/career/politician.md',
    },
  ],
  Sage: [
    {
      name: 'Bookish Ideas',
      text: "You were always content to live a peaceful life in your library, until you found that one book—the one that told the tale of heroes who had saved the timescape. They didn't spend their days behind a desk. They made a real difference. It was time for you to do the same.",
      number: 1,
      source: 'en/unified/md/career/sage.md',
    },
    {
      name: 'Cure the Curse',
      text: "You used to think knowledge could fix everything. You were wrong. When someone you loved fell under a curse, the means to cure them couldn't be found in any of the books you owned. But that wasn't going to stop you. The answers are out there, and you'll find them even if you have to face down death to do so.",
      number: 2,
      source: 'en/unified/md/career/sage.md',
    },
    {
      name: 'Lost Library',
      text: "An evil mage took all your books for themself, cackling at your impotence as they raided your shelves. Now, you're off to search through ancient ruins and secret libraries to rebuild your collection of rare tomes and to find the mage who stole from you.",
      number: 3,
      source: 'en/unified/md/career/sage.md',
    },
    {
      name: 'Paper Guilt',
      text: 'While transcribing ancient texts, you and another scribe discovered a shelf of long-forgotten books. At your suggestion, your companion started work on one and vanished along with the tome. Your guilt drove you to seek out your still-missing friend and prevent others from falling to similar dangers.',
      number: 4,
      source: 'en/unified/md/career/sage.md',
    },
    {
      name: 'Unforeseen Futures',
      text: 'In your pursuit of ancient knowledge, you discovered a prophecy that has yet to come to pass. And that prophecy involves someone who might be... you. Since your discovery, strange dreams have plagued you, driving you to seek out your destiny.',
      number: 5,
      source: 'en/unified/md/career/sage.md',
    },
    {
      name: 'Vanishing',
      text: 'At first you thought it was your imagination, and you brushed off the disappearance of random sentences in historical books. Then as the books changed to entirely blank pages, the disappearances became difficult to ignore, particularly those involving ancient or critical text. Driven by the desire to preserve knowledge, you have made it your purpose to restore and reverse those vanishing texts before they forever disappear.',
      number: 6,
      source: 'en/unified/md/career/sage.md',
    },
  ],
  Sailor: [
    {
      name: 'Alone',
      text: "You joined up with your best friend, sibling, or other loved one, the culmination of a lifelong dream to sail the high seas together. When they died, you lost your taste for the seafaring life. You left at the first opportunity and haven't looked back since.",
      number: 1,
      source: 'en/unified/md/career/sailor.md',
    },
    {
      name: 'Deserter',
      text: "It was in the middle of a pirate raid (whether you were part of it or targeted by it) that you realized you no longer yearned for a [sailor's](scc.v1:mcdm.heroes.v1/career/sailor) life. You used the chaos of the moment to slip away unnoticed. You now work as a hero in an effort to either end the piracy of others or atone for your past deeds, but you fear the day your old crew finds you and punishes you for your desertion.",
      number: 2,
      source: 'en/unified/md/career/sailor.md',
    },
    {
      name: 'Forgotten',
      text: "You awoke aboard your ship with no memory of who you were. Though the other sailors insisted they knew you, you didn't know them. The next time you went ashore, you decided to stay, determined to find out who you really are.",
      number: 3,
      source: 'en/unified/md/career/sailor.md',
    },
    {
      name: 'Jealousy',
      text: 'You had the favor of your captain, which earned you many rivals aboard your ship. One night, your fellow sailors pulled you from your bunk and threw you overboard. By some miracle, you were scooped from the waters by a passing vessel. You worked off your debt to them, then set out on a new life involving less pettiness.',
      number: 4,
      source: 'en/unified/md/career/sailor.md',
    },
    {
      name: 'Marooned',
      text: 'There was a mutiny, and you were on the losing side. You were marooned on an island and escaped when a merchant vessel was blown off course by a storm and found you. Your reputation is ruined among sailors, so you seek adventure elsewhere.',
      number: 5,
      source: 'en/unified/md/career/sailor.md',
    },
    {
      name: 'Water Fear',
      text: "A catastrophic storm hit while you were at sea, destroying your ship and leaving you as the only survivor. Once you recovered, you tried to sign on with another ship, but the thought of the open water turned your legs to jelly. Instead, you've taken on the role of a traveling hero to make ends meet.",
      number: 6,
      source: 'en/unified/md/career/sailor.md',
    },
  ],
  Soldier: [
    {
      name: 'Dishonorable Discharge',
      text: 'You enlisted in the military to protect others, but your commander ordered you to beat and kill civilians. When you refused, things got violent. You barely escaped the brawl that ensued, but now you vow to help people on your own terms.',
      number: 1,
      source: 'en/unified/md/career/soldier.md',
    },
    {
      name: 'Out of Retirement',
      text: 'You had a long and storied career as a [soldier](scc.v1:mcdm.heroes.v1/career/soldier) before deciding to retire to a simpler life. But when you returned to your old home, you found your enemies had laid waste to it. Now the skills you earned on the battlefield are helping you as you become a different kind of warrior one seeking to save others from the fate you suffered.',
      number: 2,
      source: 'en/unified/md/career/soldier.md',
    },
    {
      name: 'Peace Through Healing',
      text: 'Living with constant bloodshed took its toll on you. You seek peace through healing and have dedicated yourself to ending wars before they begin, to spare those around you from the horror.',
      number: 3,
      source: 'en/unified/md/career/soldier.md',
    },
    {
      name: 'Sole Survivor',
      text: 'You were the last surviving member of your unit after an arduous battle or monstrous assault, surviving only through luck. You turned away from the life of a [soldier](scc.v1:mcdm.heroes.v1/career/soldier) then, seeking to become a hero who could stand against such threats.',
      number: 4,
      source: 'en/unified/md/career/soldier.md',
    },
    {
      name: 'Stolen Valor',
      text: 'Tired of eking out an existence on the streets, you enrolled in the military. However, you were unable to escape your lower-status background until the officer leading your unit fell in battle. In the chaos that ensued, you assumed their identity and returned home a hero. But when suspicion arose, you took on the life of an adventurer, staying always on the move.',
      number: 5,
      source: 'en/unified/md/career/soldier.md',
    },
    {
      name: 'Vow of Sacrifice',
      text: "You promised a fellow [soldier](scc.v1:mcdm.heroes.v1/career/soldier) that you'd protect his family if he ever fell in battle. When he did, you traveled to his village, but found its people slain or scattered by war. Driven by your vow, you have dedicated your life to finding any survivors and protecting others from a similar fate.",
      number: 6,
      source: 'en/unified/md/career/soldier.md',
    },
  ],
  Warden: [
    {
      name: 'Betrayed',
      text: 'When outsiders arrived in your lands with the intent to exploit the wilds for their resources, you spoke out against them. However, several other wardens spoke in favor of these outsiders, and allowed them in to despoil nature. Refusing to watch your homeland destroyed, you left. Now you help others avoid such a fate.',
      number: 1,
      source: 'en/unified/md/career/warden.md',
    },
    {
      name: 'Corruption',
      text: "A disease has infected the lands you protect, causing animals to become violent and twisting plants into something sinister. You've tried everything, magical and mundane, to stop the scourge, but it continues to spread. As such, you've set out in search of a cure or an unblighted land to protect.",
      number: 2,
      source: 'en/unified/md/career/warden.md',
    },
    {
      name: 'Exiled',
      text: 'You made a mistake that could not be forgiven. The other wardens of the region decided your fate, exiling you from your lands with an order never to return.',
      number: 3,
      source: 'en/unified/md/career/warden.md',
    },
    {
      name: 'Honor the Fallen',
      text: 'A group of heroes arrived in your territory with trouble close on their heels. You fought alongside them to [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) back the evil, but it was too much. The heroes fell, and your wilderness was forever altered. Though your lands are beyond saving, there are other lands you can help.',
      number: 4,
      source: 'en/unified/md/career/warden.md',
    },
    {
      name: 'Portents',
      text: "There were signs. You tried to ignore them, but when a great beast died at your feet, you had to recognize the truth. You were meant to leave your home territory, meant to fight a battle for the fate of all lands—and so you gave up the only life you've ever known.",
      number: 5,
      source: 'en/unified/md/career/warden.md',
    },
    {
      name: 'Theft',
      text: "You were responsible for guarding something precious, something vital to your region's survival. But you let someone in, and they betrayed your trust by stealing the thing you were meant to guard. You left your chosen territory to atone for your mistake.",
      number: 6,
      source: 'en/unified/md/career/warden.md',
    },
  ],
  'Watch Officer': [
    {
      name: 'Bigger Fish',
      text: "You grew bored and disillusioned with chasing down petty thieves and imprisoning folks just trying to survive. Surely there are greater threats in the world. You will find that evil wherever it may lurk, and you'll be the one to stop it.",
      number: 1,
      source: 'en/unified/md/career/watch-officer.md',
    },
    {
      name: 'Corruption Within',
      text: "You joined the force to help the helpless and bring justice to those wronged. You weren't prepared for the rampant corruption reaching the top of your organization. You refused to cover for your fellow officers and were told in no uncertain terms to leave town or face the consequences. Now you travel as a hero, acting as the protector you always wanted to be.",
      number: 2,
      source: 'en/unified/md/career/watch-officer.md',
    },
    {
      name: 'Frame Job',
      text: "Your partner was murdered. That much is irrefutable. But you didn't do it, despite what the evidence implies. When it became clear you'd take the fall, you fled, leaving everything behind. Not content to cower in the shadows, you decided to adventure under a new name while you work to clear your own.",
      number: 3,
      source: 'en/unified/md/career/watch-officer.md',
    },
    {
      name: 'Missing Mentor',
      text: 'You learned everything you know about the job from someone you always looked up to in a corrupt organization. One night, they sent you a cryptic message saying they had discovered "something big," but before you could find out more, they disappeared. No longer sure who you could trust, you slipped away and sought a new life. Now you do what good you can and search to find the truth.',
      number: 4,
      source: 'en/unified/md/career/watch-officer.md',
    },
    {
      name: 'One That Got Away',
      text: 'A violent or depraved [criminal](scc.v1:mcdm.heroes.v1/career/criminal) began targeting you- perhaps stealing something personal or hurting someone you love—after slipping through your grasp. You left your career to pursue the [criminal](scc.v1:mcdm.heroes.v1/career/criminal), but the trail has gone cold... for now. [Might](scc.v1:mcdm.heroes.v1/rule.character/might) as well help folk in the meantime.',
      number: 5,
      source: 'en/unified/md/career/watch-officer.md',
    },
    {
      name: 'Powerful Enemies',
      text: "You made it your responsibility to root out and bring down the region's foremost crime syndicate. They sent goons to burn down your home and teach you a lesson, leaving you bleeding in the street with nothing left except your life. You've since taken on the life of a hero to gain the power and influence you need to destroy the syndicate once and for all.",
      number: 6,
      source: 'en/unified/md/career/watch-officer.md',
    },
  ],
};

export const CORE_PERKS: { name: string; source: string; group: string }[] = [
  {
    name: 'Arcane Trick',
    source: 'en/unified/md/perk/arcane-trick.md',
    group: 'supernatural',
  },
  {
    name: 'Area of Expertise',
    source: 'en/unified/md/perk/area-of-expertise.md',
    group: 'crafting',
  },
  {
    name: 'Brawny',
    source: 'en/unified/md/perk/brawny.md',
    group: 'exploration',
  },
  {
    name: 'But I Know Who Does',
    source: 'en/unified/md/perk/but-i-know-who-does.md',
    group: 'lore',
  },
  {
    name: 'Camouflage Hunter',
    source: 'en/unified/md/perk/camouflage-hunter.md',
    group: 'exploration',
  },
  {
    name: 'Charming Liar',
    source: 'en/unified/md/perk/charming-liar.md',
    group: 'interpersonal',
  },
  {
    name: 'Creature Sense',
    source: 'en/unified/md/perk/creature-sense.md',
    group: 'supernatural',
  },
  {
    name: 'Criminal Contacts',
    source: 'en/unified/md/perk/criminal-contacts.md',
    group: 'intrigue',
  },
  {
    name: 'Danger Sense',
    source: 'en/unified/md/perk/danger-sense.md',
    group: 'exploration',
  },
  {
    name: 'Dazzler',
    source: 'en/unified/md/perk/dazzler.md',
    group: 'interpersonal',
  },
  {
    name: 'Eidetic Memory',
    source: 'en/unified/md/perk/eidetic-memory.md',
    group: 'lore',
  },
  {
    name: 'Engrossing Monologue',
    source: 'en/unified/md/perk/engrossing-monologue.md',
    group: 'interpersonal',
  },
  {
    name: 'Expert Artisan',
    source: 'en/unified/md/perk/expert-artisan.md',
    group: 'crafting',
  },
  {
    name: 'Expert Sage',
    source: 'en/unified/md/perk/expert-sage.md',
    group: 'lore',
  },
  {
    name: 'Familiar',
    source: 'en/unified/md/perk/familiar.md',
    group: 'supernatural',
  },
  {
    name: 'Forgettable Face',
    source: 'en/unified/md/perk/forgettable-face.md',
    group: 'intrigue',
  },
  {
    name: 'Friend Catapult',
    source: 'en/unified/md/perk/friend-catapult.md',
    group: 'exploration',
  },
  {
    name: 'Gum Up the Works',
    source: 'en/unified/md/perk/gum-up-the-works.md',
    group: 'intrigue',
  },
  {
    name: 'Handy',
    source: 'en/unified/md/perk/handy.md',
    group: 'crafting',
  },
  {
    name: 'Harmonizer',
    source: 'en/unified/md/perk/harmonizer.md',
    group: 'interpersonal',
  },
  {
    name: 'Improvisation Creation',
    source: 'en/unified/md/perk/improvisation-creation.md',
    group: 'crafting',
  },
  {
    name: 'Inspired Artisan',
    source: 'en/unified/md/perk/inspired-artisan.md',
    group: 'crafting',
  },
  {
    name: 'Invisible Force',
    source: 'en/unified/md/perk/invisible-force.md',
    group: 'supernatural',
  },
  {
    name: "I've Got You!",
    source: 'en/unified/md/perk/ive-got-you.md',
    group: 'exploration',
  },
  {
    name: "I've Read About This Place",
    source: 'en/unified/md/perk/ive-read-about-this-place.md',
    group: 'lore',
  },
  {
    name: 'Lie Detector',
    source: 'en/unified/md/perk/lie-detector.md',
    group: 'interpersonal',
  },
  {
    name: 'Linguist',
    source: 'en/unified/md/perk/linguist.md',
    group: 'lore',
  },
  {
    name: 'Lucky Dog',
    source: 'en/unified/md/perk/lucky-dog.md',
    group: 'intrigue',
  },
  {
    name: 'Master of Disguise',
    source: 'en/unified/md/perk/master-of-disguise.md',
    group: 'intrigue',
  },
  {
    name: 'Monster Whisperer',
    source: 'en/unified/md/perk/monster-whisperer.md',
    group: 'exploration',
  },
  {
    name: 'Open Book',
    source: 'en/unified/md/perk/open-book.md',
    group: 'interpersonal',
  },
  {
    name: 'Pardon My Friend',
    source: 'en/unified/md/perk/pardon-my-friend.md',
    group: 'interpersonal',
  },
  {
    name: 'Polymath',
    source: 'en/unified/md/perk/polymath.md',
    group: 'lore',
  },
  {
    name: 'Power Player',
    source: 'en/unified/md/perk/power-player.md',
    group: 'interpersonal',
  },
  {
    name: 'Psychic Whisper',
    source: 'en/unified/md/perk/psychic-whisper.md',
    group: 'supernatural',
  },
  {
    name: 'Put Your Back Into It!',
    source: 'en/unified/md/perk/put-your-back-into-it.md',
    group: 'exploration',
  },
  {
    name: 'Ritualist',
    source: 'en/unified/md/perk/ritualist.md',
    group: 'supernatural',
  },
  {
    name: 'Slipped Lead',
    source: 'en/unified/md/perk/slipped-lead.md',
    group: 'intrigue',
  },
  {
    name: 'So Tell Me...',
    source: 'en/unified/md/perk/so-tell-me.md',
    group: 'interpersonal',
  },
  {
    name: 'Specialist',
    source: 'en/unified/md/perk/specialist.md',
    group: 'lore',
  },
  {
    name: 'Spot the Tell',
    source: 'en/unified/md/perk/spot-the-tell.md',
    group: 'interpersonal',
  },
  {
    name: 'Team Leader',
    source: 'en/unified/md/perk/team-leader.md',
    group: 'exploration',
  },
  {
    name: 'Teamwork',
    source: 'en/unified/md/perk/teamwork.md',
    group: 'exploration',
  },
  {
    name: 'Thingspeaker',
    source: 'en/unified/md/perk/thingspeaker.md',
    group: 'supernatural',
  },
  {
    name: 'Traveling Artisan',
    source: 'en/unified/md/perk/traveling-artisan.md',
    group: 'crafting',
  },
  {
    name: 'Traveling Sage',
    source: 'en/unified/md/perk/traveling-sage.md',
    group: 'lore',
  },
  {
    name: 'Wood Wise',
    source: 'en/unified/md/perk/wood-wise.md',
    group: 'exploration',
  },
];

const ALL_LANGUAGE_POOLS = [
  'pool.languages.by-ancestry',
  'pool.languages.vaslorian-human',
  'pool.languages.dead',
];
const skillGroups = ['crafting', 'exploration', 'interpersonal', 'intrigue', 'lore'];
const key = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("'", '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-$/, '');
const unique = (values: string[]) => [...new Set(values)];
const option = (value: string, source: string): DecisionOption => ({
  id: key(value),
  value,
  source,
  supportedInV001: true,
});
const perkOption = (perk: (typeof CORE_PERKS)[number]): DecisionOption => ({
  ...option(perk.name, perk.source),
  grants: PERK_ABILITIES.filter(source => source.perk === perk.name).map(source => ({
    kind: 'perk-ability',
    value: source.name,
    source: source.sourcePath,
  })),
});

/** Mutates a fresh definition object once, after any level-specific perk sources are appended. */
export function extendBackgroundDefinitions(defs: DecisionDefinitions): void {
  const all = () => defs.steps.flatMap(step => step.decisions);
  const byId = (id: string) => all().find(decision => decision.id === id);
  const values = (pools: string[]) => unique(pools.flatMap(id => defs.pools[id]?.values ?? []));
  const allSkills = values(skillGroups.map(group => `pool.skills.${group}`));
  const allLanguages = values(ALL_LANGUAGE_POOLS).filter(name => name !== 'Caelian');
  for (const group of unique(CORE_PERKS.map(perk => perk.group))) {
    defs.pools[`pool.perks.${group}`] = {
      source: 'en/books/heroes/clean/Draw Steel Heroes.md',
      sourceSection: `${group[0]!.toUpperCase()}${group.slice(1)} Perks`,
      values: CORE_PERKS.filter(perk => perk.group === group).map(perk => perk.name),
    };
  }
  // Existing culture IDs and their precise parent-dependent union pools remain intact.
  for (const decision of all().filter(d => d.id.startsWith('culture.'))) {
    if (decision.options) for (const entry of decision.options) entry.supportedInV001 = true;
    if (decision.id.endsWith('.skill')) {
      decision.supportedInV001 = allSkills;
      decision.selectionRole = 'skill';
      const aspect = decision.id.split('.')[1]!;
      decision.label = `${aspect[0]!.toUpperCase()}${aspect.slice(1)} skill`;
    }
    if (decision.id === 'culture.language') {
      decision.optionsFrom = ALL_LANGUAGE_POOLS;
      decision.supportedInV001 = allLanguages;
      decision.selectionRole = 'language';
      decision.label = 'Additional language';
    }
  }
  // Widen only already-sourced class skill choices, not their classes, subclasses or abilities.
  for (const decision of all().filter(
    d => d.id.startsWith('class.') && /\.skills?(\.|$)/.test(d.id),
  )) {
    if (decision.kind !== 'choice') continue;
    decision.supportedInV001 = allSkills;
    decision.selectionRole = 'skill';
  }
  const careerStep = defs.steps.find(step => step.id === 'step.career')!;
  const careerChoice = byId('career.choice')!;
  careerChoice.options = CAREERS.map(career => ({
    ...option(career.name, career.source),
    id: `career.${career.slug}`,
  }));
  careerChoice.note = 'All core careers retain their source-defined grants and dependent choices.';
  // Replace the old narrow career children. Their stable saved choice IDs are preserved below.
  careerStep.decisions = careerStep.decisions.filter(
    d => !CAREERS.some(c => d.id.startsWith(`career.${c.slug}.`)),
  );
  for (const career of CAREERS) {
    const prefix = `career.${career.slug}`;
    const base = {
      source: career.source,
      availableWhen: { decision: 'career.choice', value: career.name },
      dependsOn: ['career.choice'],
    };
    for (const skill of career.fixedSkills) {
      careerStep.decisions.push({
        ...base,
        id: `${prefix}.skill.${key(skill)}`,
        label: `${career.name}: ${skill}`,
        kind: 'automatic',
        shape: { type: 'none' },
        quote: career.skillQuote,
        grants: [{ kind: 'skill', value: skill, source: career.source, quote: career.skillQuote }],
      });
    }
    career.skills.forEach((pool, index) => {
      // Legacy Soldier and Mage's Apprentice IDs preserve all saved builds/history.
      const suffix =
        career.slug === 'soldier'
          ? `skill.${pool.groups[0]}`
          : career.slug === 'mages-apprentice'
            ? 'skills'
            : `skills.${index + 1}`;
      const names = unique([
        ...pool.names,
        ...values(pool.groups.map(group => `pool.skills.${group}`)),
      ]);
      careerStep.decisions.push({
        ...base,
        id: `${prefix}.${suffix}`,
        label: `${career.name}: choose ${pool.count} skill${pool.count === 1 ? '' : 's'}`,
        kind: 'choice',
        shape:
          pool.count === 1 ? { type: 'single', count: 1 } : { type: 'multi', count: pool.count },
        quote: career.skillQuote,
        selectionRole: 'skill',
        options: names.map(name => option(name, career.source)),
      });
    });
    if (career.languages) {
      careerStep.decisions.push({
        ...base,
        id: `${prefix}.languages`,
        label: `${career.name}: ${career.languages} additional language${career.languages === 1 ? '' : 's'}`,
        kind: 'choice',
        shape: { type: 'multi', count: career.languages, deferrable: true },
        selectionRole: 'language',
        quote: `Languages: ${career.languages === 1 ? 'One language' : 'Two languages'}`,
        optionsFrom: ALL_LANGUAGE_POOLS,
        supportedInV001: allLanguages,
        deferralRule: {
          source: 'en/unified/md/chapter/making-a-hero.md',
          quote:
            "You can choose to leave some of the languages you know open until you discover what might be a good choice for the campaign you're playing in.",
        },
      });
    }
    const benefits = CAREER_BENEFITS[career.name]!;
    for (const field of ['renown', 'wealth', 'projectPoints'] as const) {
      if (!benefits[field]) continue;
      careerStep.decisions.push({
        ...base,
        id: `${prefix}.${field === 'projectPoints' ? 'project-points' : field}`,
        label: `${career.name}: starting ${field === 'projectPoints' ? 'project points' : field}`,
        kind: 'automatic',
        shape: { type: 'none' },
        quote: benefits.quotes[field],
        grants: [{ kind: 'resource', value: benefits.quotes[field], source: career.source }],
        note:
          field === 'projectPoints'
            ? 'Initial project-point entitlement. Spending awaits the downtime workflow; no automatic item or repeated reward on edit.'
            : 'Initial grant only. Preserve current play values when editing or restoring a build.',
      });
    }
    careerStep.decisions.push({
      ...base,
      id: `${prefix}.perk`,
      label: `${career.name}: ${career.perkGroup} perk`,
      kind: 'choice',
      shape: { type: 'single', count: 1 },
      quote: `Perk: One ${career.perkGroup} perk`,
      options: CORE_PERKS.filter(perk => perk.group === career.perkGroup).map(perkOption),
    });
    careerStep.decisions.push({
      ...base,
      id: `${prefix}.inciting-incident`,
      label: `${career.name}: inciting incident`,
      kind: 'choice',
      shape: { type: 'single', count: 1, rollable: 'd6', customAllowed: true },
      quote: 'Inciting Incident',
      options: CAREER_INCIDENTS[career.name]!.map(incident => ({
        ...option(incident.name, incident.source),
        id: `${prefix}.incident.${key(incident.name)}`,
      })),
      note: 'Choose or roll a source incident, or author a narrative with your Director. Narrative details do not add mechanical grants.',
    });
  }
  // All source-eligible core perks, including future per-level granting decisions.
  for (const step of defs.steps) {
    const parents = step.decisions.filter(d => d.id.endsWith('.perk'));
    for (const parent of parents) {
      if (parent.id === 'class.fury.level-2.perk') {
        parent.options = CORE_PERKS.filter(perk =>
          ['crafting', 'exploration', 'intrigue'].includes(perk.group),
        ).map(perkOption);
        parent.note =
          'All source-eligible core choices are supported; per-use gameplay effects remain manual.';
      }
      const offered =
        parent.options?.map(entry => entry.value) ??
        values(
          typeof parent.optionsFrom === 'string'
            ? [parent.optionsFrom]
            : (parent.optionsFrom ?? []),
        );
      for (const [name, group] of [
        ['Area of Expertise', 'crafting'],
        ['Specialist', 'lore'],
      ] as const) {
        if (!offered.includes(name)) continue;
        const id = `${parent.id}.${key(name)}.target`;
        if (byId(id)) continue;
        const perk = CORE_PERKS.find(entry => entry.name === name)!;
        step.decisions.push({
          id,
          label: `${name}: choose an owned ${group} skill`,
          kind: 'choice',
          shape: { type: 'single', count: 1 },
          source: perk.source,
          quote:
            name === 'Area of Expertise'
              ? 'Choose one skill you already have from the crafting skill group.'
              : 'Choose one skill you have from the lore skill group.',
          availableWhen: { decision: parent.id, value: name },
          dependsOn: [parent.id],
          selectionRole: 'skill-target',
          ownedPool: { kind: 'skill', groups: [group] },
          optionsFrom: `pool.skills.${group}`,
          supportedInV001: values([`pool.skills.${group}`]),
          note: 'This selects a modifier target; it does not grant another skill.',
        });
      }
      if (offered.includes('Eidetic Memory') && !byId(`${parent.id}.eidetic-memory.currentSkill`)) {
        step.decisions.push({
          id: `${parent.id}.eidetic-memory.currentSkill`,
          label: 'Eidetic Memory: current respite lore skill (if configured)',
          kind: 'choice',
          optional: true,
          shape: { type: 'single', count: 1 },
          source: 'en/unified/md/perk/eidetic-memory.md',
          quote:
            "When you finish a respite, choose one skill from the lore skill group that you don't have. You have that skill until you finish your next respite.",
          availableWhen: { decision: parent.id, value: 'Eidetic Memory' },
          dependsOn: [parent.id],
          selectionRole: 'skill-conditional',
          ownedPool: { kind: 'skill', groups: ['lore'], exclude: true },
          optionsFrom: 'pool.skills.lore',
          supportedInV001: values(['pool.skills.lore']),
          note: 'Optional current respite configuration. This skill lasts only until the next respite and is not a permanent build grant.',
        });
      }
      if (offered.includes('Linguist') && !byId(`${parent.id}.linguist.languages`)) {
        step.decisions.push({
          id: `${parent.id}.linguist.languages`,
          label: 'Linguist: two languages you have regularly heard or read',
          kind: 'choice',
          shape: { type: 'multi', count: 2, deferrable: true },
          source: 'en/unified/md/perk/linguist.md',
          quote:
            'You automatically learn two new languages, as long as you have regularly heard those languages spoken or seen them written before.',
          availableWhen: { decision: parent.id, value: 'Linguist' },
          dependsOn: [parent.id],
          selectionRole: 'language',
          ownedPool: { kind: 'language', exclude: true },
          optionsFrom: ALL_LANGUAGE_POOLS,
          supportedInV001: allLanguages,
          note: 'Choose only new languages with regular prior exposure. A deferred slot grants no language until filled with an eligible choice. Later immersion and research benefits remain manual.',
        });
      }
    }
  }
  const legacyLabels: Record<string, string> = {
    'career.soldier.skill.exploration': 'Exploration skill',
    'career.soldier.skill.intrigue': 'Intrigue skill',
    'career.soldier.languages': 'Career languages',
    'career.soldier.renown': 'Starting Renown',
    'career.soldier.perk': 'Career perk',
    'career.soldier.inciting-incident': 'Inciting incident',
    'career.mages-apprentice.skill.magic': 'Career skill',
    'career.mages-apprentice.skills': 'Career skills',
    'career.mages-apprentice.perk': 'Career perk',
    'career.mages-apprentice.inciting-incident': 'Inciting incident',
    'career.mages-apprentice.languages': 'Career languages',
    'career.mages-apprentice.renown': 'Starting Renown',
  };
  for (const [id, label] of Object.entries(legacyLabels)) {
    const existing = byId(id);
    if (existing) existing.label = label;
  }
  const kitChoice = byId('kit.choice');
  if (kitChoice) {
    kitChoice.supportedInV001 = [...ORDINARY_KIT_NAMES];
    if (kitChoice.options)
      for (const entry of kitChoice.options)
        entry.supportedInV001 = ORDINARY_KIT_NAMES.includes(entry.value);
    const kitStep = defs.steps.find(step => step.id === 'step.kit')!;
    for (const name of ORDINARY_KIT_NAMES) {
      const kit = SUPPORTING_KITS[name]!;
      const id = `kit.${name.toLowerCase()}.contributions`;
      if (byId(id)) continue;
      kitStep.decisions.push({
        id,
        label: `${name}: kit benefits`,
        kind: 'automatic',
        shape: { type: 'none' },
        source: kit.entryPath,
        quote: kit.equipmentText,
        availableWhen: { decision: 'kit.choice', value: name },
        dependsOn: ['kit.choice'],
        grants: [{ kind: 'ability', value: kit.signatureAbility, source: kit.entryPath }],
        note: 'Printed signature damage and distance already include this kit’s bonuses. Gameplay effects remain manual.',
      });
    }
  }
}
