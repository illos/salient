// SPDX-License-Identifier: GPL-3.0-only
/**
 * V109 whole-section grammar. Inputs have display markup removed by abilityGrammar.plain.
 * Each alternative describes table work independent of the current roll/damage, or a reader
 * explicitly deferred until damage completes. No substring or ability-name dispatch is allowed.
 * Parameters remain printed instructions: this module does not execute movement or award resources.
 */
export interface EffectRider {
  shape:
    | 'shift'
    | 'teleport'
    | 'recovery'
    | 'temporary-stamina'
    | 'surges'
    | 'bane'
    | 'taunt'
    | 'terrain'
    | 'free-strike'
    | 'push-followup'
    | 'forced-movement'
    | 'end-effect';
  /**
   * V152 `after-effects`: the section reads a tier outcome other than damage (Choke's "made
   * restrained by this ability"), so it waits for that target's condition outcomes too.
   */
  dependency: 'independent' | 'after-damage' | 'after-movement' | 'after-effects';
  /**
   * V110: `target` wording ("the target", a tier outcome) was written for one target. Pinned
   * rule/dice/ability-roll.md, "Abilities With Damage and Effects": with several targets, tiers can
   * differ and the user picks the applicable tier; such sections stay manual on multi/area envelopes.
   */
  subject: 'use' | 'target';
}

// Source examples below are relative to the pinned Compendium en/unified/md.
const CHARACTERISTIC = '(?:Might|Agility|Reason|Intuition|Presence)';
const independent: readonly [EffectRider['shape'], RegExp, EffectRider['dependency']?][] = [
  // feature/ability/fury/level-1/hit-and-run.md; null/level-1/inertial-step.md;
  // shadow/level-1/get-in-get-out.md. Optional timing stays visible, never auto-movement.
  ['shift', /^You can shift (?:up to )?\d+ squares?\.$/],
  ['shift', /^You can shift up to (?:half )?your speed before or after you make this strike\.$/],
  [
    'shift',
    /^You can shift up to your speed, dividing that movement before or after your strike as desired\.$/,
  ],
  // feature/ability/elementalist/level-1/grasp-of-beyond.md.
  [
    'teleport',
    /^You can teleport up to (?:\d+ squares|a number of squares equal to your (?:Might|Agility|Reason|Intuition|Presence) score)\.$/,
  ],
  // feature/ability/conduit/level-1/drain.md; censor/level-1/the-gods-punish-and-defend.md.
  ['recovery', /^(?:You|The target|You or one ally within distance) can spend a Recovery\.$/],
  [
    'recovery',
    /^You can spend a Recovery to allow yourself or one ally within \d+ squares to regain Stamina equal to your recovery value\.$/,
  ],
  // feature/ability/conduit/level-1/warriors-prayer.md.
  [
    'temporary-stamina',
    /^You or one ally within distance gains temporary Stamina equal to your (?:Might|Agility|Reason|Intuition|Presence) score\.$/,
  ],
  // feature/ability/talent/level-1/spirit-sword.md (Strained section still blocks execution).
  // feature/ability/shadow/level-1/gasping-in-pain.md.
  ['surges', /^You gain \d+ surges?\.$/],
  ['surges', /^One ally within \d+ squares of the target gains \d+ surges?\.$/],
  // kit/raider.md; feature/ability/censor/level-1/behold-a-shield-of-faith.md.
  [
    'bane',
    /^The target takes a bane on their next power roll made before the end of their next turn\.$/,
  ],
  [
    'bane',
    /^Until the start of your next turn, enemies take a bane on ability rolls made against you or any ally adjacent to you\.$/,
  ],
  // kit/shining-armor.md; feature/ability/troubadour/level-1/instigator.md.
  ['taunt', /^The target is taunted until the end of their next turn\.$/],
  [
    'taunt',
    /^The target is taunted by you or a willing ally adjacent to you until the end of the target's next turn\.$/,
  ],
  // elementalist/level-1/unquiet-ground.md; troubadour/level-1/quick-rewrite.md (area stays blocked).
  ['terrain', /^(?:The area|The ground beneath the area) is difficult terrain for enemies\.$/],
  // beastheart/level-1/come-on.md. Companion/allied free strikes stay separate table work;
  // monster/war-dog/1st-echelon/statblock/war-dog-subcommander.md, Command Saber.
  [
    'free-strike',
    /^Your companion can make a melee free strike\. You both shift up to a number of squares equal to your Intuition score\.$/,
  ],
  [
    'free-strike',
    /^One ally within \d+ squares of the [a-z]+(?: [a-z]+)* can make a free strike against the target\.$/,
  ],
  // kit/raden.md; kit/swashbuckler.md; censor/level-1/driving-assault.md.
  // These follow actual table movement, not the calculated maximum push allowance.
  [
    'push-followup',
    /^You can shift up to the same number of squares that you pushed the target\.$/,
  ],
  ['push-followup', /^You can shift into any square the target leaves after you push them\.$/],
  [
    'push-followup',
    /^You can shift up to your speed in a straight line toward the target after pushing them\.$/,
  ],
  // V152. shadow/level-1/disorienting-strike.md; kit/pugilist.md (Let's Dance).
  [
    'push-followup',
    /^You can shift into any square the target leaves (?:when|after) you slide them\.$/,
  ],
  // conduit/level-3/soul-siphon.md; conduit/level-3/words-of-wrath-and-grace.md;
  // tactician/level-2/ive-got-your-back.md. Each creature spends through their own Recovery action.
  ['recovery', /^One ally within distance can spend any number of Recoveries\.$/],
  ['recovery', /^Each ally in the area can spend a Recovery\.$/],
  ['recovery', /^One ally adjacent to the target can spend a Recovery\.$/],
  // elementalist/level-1/afflict-a-bountiful-decay.md; elementalist/level-1/test-of-rain.md.
  // rule/general/saving-throw.md and rule/combat/end-of-turn.md name the two effect kinds.
  [
    'end-effect',
    /^Choose yourself or one ally within distance\. That character can end one effect on them that is ended by a saving throw or that ends at the end of their turn\.$/,
  ],
  [
    'end-effect',
    /^You can end one effect on yourself that is ended by a saving throw or that ends at the end of your turn\. Each ally in the area also gains this benefit\.$/,
  ],
  // conduit/level-1/sacrificial-offer.md. The bane is entered when that later roll is made.
  [
    'bane',
    /^Choose yourself or one ally within distance\. That character can impose a bane on one power roll made against them before the end of their next turn\.$/,
  ],
  // conduit/level-1/lightfall.md.
  [
    'teleport',
    /^You can teleport yourself and each ally in the area to unoccupied spaces in the area\.$/,
  ],
  // troubadour/level-3/infernal-gavotte.md; kit/corven.md (Wing Buffet);
  // null/level-1/a-squad-unto-myself.md (Disengage, feature/common/move-actions).
  ['shift', /^Each ally in the area can shift up to \d+ squares?\.$/],
  ['shift', /^You can shift up to \d+ squares? before or after making the power roll\.$/],
  [
    'shift',
    /^You can take the Disengage move action as a free maneuver before or after you use this ability\.$/,
  ],
  // Forced movement of creatures other than the tier's target (movement/forced-movement.md):
  // censor/level-1/your-allies-cannot-save-you.md; elementalist/level-1/the-green-within-the-green-without.md;
  // null/level-1/dance-of-blows.md.
  [
    'forced-movement',
    new RegExp(
      `^Each enemy adjacent to the target is pushed away from the target up to a number of squares equal to your ${CHARACTERISTIC} score\\.$`,
    ),
  ],
  [
    'forced-movement',
    /^You slide one creature within \d+ squares of the target up to \d+ squares?\.$/,
  ],
  [
    'forced-movement',
    new RegExp(
      `^You can slide one adjacent enemy up to a number of squares equal to your ${CHARACTERISTIC} score\\.$`,
    ),
  ],
  // talent/level-1/choke.md: the stability exception reads the tier's restrained outcome.
  [
    'forced-movement',
    /^You can vertical pull the target up to \d+ squares?\. If the target is made restrained by this ability, this forced movement ignores their stability\.$/,
    'after-effects',
  ],
  // shadow/level-3/misdirecting-strike.md. The taunting creature is the chosen ally.
  [
    'taunt',
    /^The target is taunted by a willing ally within \d+ squares of you until the end of the target's next turn\.$/,
  ],
  // troubadour/level-2/en-garde.md.
  [
    'free-strike',
    /^The target can make a melee free strike against you\. If they do, you can make a melee free strike against the target\.$/,
  ],
];

/** Sections whose printed subject or measure is the (single) target or its tier outcome. */
const targetSubject = /\bthe target\b|\btier outcome\b/i;

export function effectRider(text: string): EffectRider | undefined {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const subject = targetSubject.test(normalized) ? 'target' : 'use';
  // beastheart/level-1/i-feed-on-your-pain.md and conduit/level-1/blessed-light.md.
  if (
    /^If the target is killed by this damage, or is winded or bleeding after taking this damage, you gain \d+ surges\.$/.test(
      normalized,
    ) ||
    /^One ally within distance gains a number of surges equal to the tier outcome of your power roll\.$/.test(
      normalized,
    )
  )
    return { shape: 'surges', dependency: 'after-damage', subject };
  const match = independent.find(([, pattern]) => pattern.test(normalized));
  return match
    ? {
        shape: match[0],
        dependency: match[2] ?? (match[0] === 'push-followup' ? 'after-movement' : 'independent'),
        subject,
      }
    : undefined;
}

/**
 * V154 tier instructions: a whole tier clause that is table work for that target's outcome. Like
 * section riders they never change state; the table records them. Printed casing is matched.
 */
const tierInstructions: readonly [EffectRider['shape'], RegExp, ('actor' | 'target')?][] = [
  // feature/ability/shadow/level-2/in-a-puff-of-ash.md.
  ['teleport', /^you can teleport the target (?:up to )?\d+ squares?$/],
  // kit/cloak-and-dagger.md (Fade).
  ['shift', /^you can shift (?:up to )?\d+ squares?$/, 'actor'],
  // feature/ability/tactician/level-1/inspiring-strike.md. The edge is entered at that later roll.
  ['recovery', /^you or one ally within \d+ squares of you can spend a Recovery$/, 'actor'],
  [
    'recovery',
    /^you and one ally within \d+ squares of you can spend a Recovery, and each of you gains an edge on the next ability roll you make during the encounter$/,
    'actor',
  ],
  // feature/ability/tactician/level-1/battle-cry.md. Surges stay table work, as V109's riders.
  ['surges', /^Each target gains \d+ surges?$/],
];

/**
 * `actor` instructions are about the creature using the ability, which rule/dice/ability-roll.md
 * ("Abilities With Damage and Effects") says happens once, not once per target: they are admitted
 * only on single-target abilities.
 */
export function tierInstruction(
  text: string,
): { shape: EffectRider['shape']; subject: 'actor' | 'target' } | undefined {
  const normalized = text.replace(/\s+/g, ' ').trim().replace(/\.$/, '');
  const match = tierInstructions.find(([, pattern]) => pattern.test(normalized));
  return match ? { shape: match[0], subject: match[2] ?? 'target' } : undefined;
}
