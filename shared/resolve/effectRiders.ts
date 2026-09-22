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
    | 'push-followup';
  dependency: 'independent' | 'after-damage' | 'after-movement';
}

// Source examples below are relative to the pinned Compendium en/unified/md.
const independent: readonly [EffectRider['shape'], RegExp][] = [
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
];

export function effectRider(text: string): EffectRider | undefined {
  const normalized = text.replace(/\s+/g, ' ').trim();
  // beastheart/level-1/i-feed-on-your-pain.md and conduit/level-1/blessed-light.md.
  if (
    /^If the target is killed by this damage, or is winded or bleeding after taking this damage, you gain \d+ surges\.$/.test(
      normalized,
    ) ||
    /^One ally within distance gains a number of surges equal to the tier outcome of your power roll\.$/.test(
      normalized,
    )
  )
    return { shape: 'surges', dependency: 'after-damage' };
  const match = independent.find(([, pattern]) => pattern.test(normalized));
  return match
    ? {
        shape: match[0],
        dependency: match[0] === 'push-followup' ? 'after-movement' : 'independent',
      }
    : undefined;
}
