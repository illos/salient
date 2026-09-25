// SPDX-License-Identifier: GPL-3.0-only
/** Audited manual entries for the explicitly deferred companion combat integration. */
import abilitySources from '../../compendium/ability.json' with { type: 'json' };
import featureSources from '../../compendium/feature.json' with { type: 'json' };
import { sourceBody } from '../../source-body.ts';
export interface BeastheartAction {
  name: string;
  parent: string;
  sourcePath: string;
  performer: string;
  actionType: string;
  activationCondition: string;
  cost?: number;
  trigger?: string;
}
export const BEASTHEART_ACTIONS: BeastheartAction[] = [
  {
    name: 'Beastheart: All of You Versus All of Me',
    parent: 'All of You Versus All of Me',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/all-of-you-versus-all-of-me.md',
    performer: 'Beastheart',
    actionType: 'Maneuver',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 5,
  },
  {
    name: 'Beastheart: All of You Versus All of Me: Spend option 1 (1 Ferocity)',
    parent: 'All of You Versus All of Me',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/all-of-you-versus-all-of-me.md',
    performer: 'Beastheart',
    actionType: 'Part of parent ability',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. This ability also affects a 3 burst originating from your companion. Targets in this second area are [taunted](scc.v1:mcdm.heroes.v1/condition/taunted) by your companion. An enemy in both areas is [taunted](scc.v1:mcdm.heroes.v1/condition/taunted) only by you.',
    cost: 1,
  },
  {
    name: 'Beastheart: Avalanche Rush',
    parent: 'Avalanche Rush',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/avalanche-rush.md',
    performer: 'Beastheart',
    actionType: 'Maneuver',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Beastheart: Avalanche Rush: Spend option 1 (1 Ferocity)',
    parent: 'Avalanche Rush',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/avalanche-rush.md',
    performer: 'Beastheart',
    actionType: 'Part of parent ability',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. If the target has M < STRONG, they are knocked [prone](scc.v1:mcdm.heroes.v1/condition/prone).',
    cost: 1,
  },
  {
    name: 'Beastheart: Bodyswap',
    parent: 'Bodyswap',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/bodyswap.md',
    performer: 'Beastheart',
    actionType: 'Main action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Bring the Thunder',
    parent: 'Bring the Thunder',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/bring-the-thunder.md',
    performer: 'Companion',
    actionType: 'Main action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 3,
  },
  {
    name: 'Companion: Bring the Thunder: Spend option 1 (1 Ferocity)',
    parent: 'Bring the Thunder',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/bring-the-thunder.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. This ability also affects a 2 burst originating from you. An enemy in both areas is only affected once.',
    cost: 1,
  },
  {
    name: 'Beastheart: Come On!',
    parent: 'Come On!',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/come-on.md',
    performer: 'Beastheart',
    actionType: 'Main action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Beastheart: Covering Fire',
    parent: 'Covering Fire',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/covering-fire.md',
    performer: 'Beastheart',
    actionType: 'Main action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Feral Strike',
    parent: 'Feral Strike',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/feral-strike.md',
    performer: 'Companion',
    actionType: 'Main action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Beastheart: Heart of the Beast',
    parent: 'Heart of the Beast',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/heart-of-the-beast.md',
    performer: 'Beastheart',
    actionType: 'Maneuver',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Beastheart: Heart of the Beast: Spend option 1 (1 Ferocity)',
    parent: 'Heart of the Beast',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/heart-of-the-beast.md',
    performer: 'Beastheart',
    actionType: 'Part of parent ability',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. Your partner can [shift](scc.v1:mcdm.heroes.v1/movement/shifting) up to their speed.',
    cost: 1,
  },
  {
    name: 'Beastheart: Heart of the Beast: Spend option 2 (1 Ferocity)',
    parent: 'Heart of the Beast',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/heart-of-the-beast.md',
    performer: 'Beastheart',
    actionType: 'Part of parent ability',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. Your partner gains additional temporary Stamina equal to their Might score for each ferocity spent this way.',
    cost: 1,
  },
  {
    name: 'Beastheart: Heart of the Beast: Spend option 2 (2 Ferocity)',
    parent: 'Heart of the Beast',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/heart-of-the-beast.md',
    performer: 'Beastheart',
    actionType: 'Part of parent ability',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. Your partner gains additional temporary Stamina equal to their Might score for each ferocity spent this way.',
    cost: 2,
  },
  {
    name: 'Beastheart: Heart of the Beast: Spend option 2 (3 Ferocity)',
    parent: 'Heart of the Beast',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/heart-of-the-beast.md',
    performer: 'Beastheart',
    actionType: 'Part of parent ability',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. Your partner gains additional temporary Stamina equal to their Might score for each ferocity spent this way.',
    cost: 3,
  },
  {
    name: 'Beastheart: Heart of the Beast: Spend option 2 (4 Ferocity)',
    parent: 'Heart of the Beast',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/heart-of-the-beast.md',
    performer: 'Beastheart',
    actionType: 'Part of parent ability',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. Your partner gains additional temporary Stamina equal to their Might score for each ferocity spent this way.',
    cost: 4,
  },
  {
    name: 'Beastheart: Heart of the Beast: Spend option 2 (5 Ferocity)',
    parent: 'Heart of the Beast',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/heart-of-the-beast.md',
    performer: 'Beastheart',
    actionType: 'Part of parent ability',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. Your partner gains additional temporary Stamina equal to their Might score for each ferocity spent this way.',
    cost: 5,
  },
  {
    name: 'Beastheart: Heart of the Beast: Spend option 3 (5 Ferocity)',
    parent: 'Heart of the Beast',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/heart-of-the-beast.md',
    performer: 'Beastheart',
    actionType: 'Part of parent ability',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. You restore your dead partner to life with 1 Stamina, even if their body was destroyed. They gain no temporary Stamina if you use this ability this way.',
    cost: 5,
  },
  {
    name: 'Companion: Heart of the Beast',
    parent: 'Heart of the Beast',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/heart-of-the-beast.md',
    performer: 'Companion',
    actionType: 'Maneuver',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Heart of the Beast: Spend option 1 (1 Ferocity)',
    parent: 'Heart of the Beast',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/heart-of-the-beast.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. Your partner can [shift](scc.v1:mcdm.heroes.v1/movement/shifting) up to their speed.',
    cost: 1,
  },
  {
    name: 'Companion: Heart of the Beast: Spend option 2 (1 Ferocity)',
    parent: 'Heart of the Beast',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/heart-of-the-beast.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. Your partner gains additional temporary Stamina equal to their Might score for each ferocity spent this way.',
    cost: 1,
  },
  {
    name: 'Companion: Heart of the Beast: Spend option 2 (2 Ferocity)',
    parent: 'Heart of the Beast',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/heart-of-the-beast.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. Your partner gains additional temporary Stamina equal to their Might score for each ferocity spent this way.',
    cost: 2,
  },
  {
    name: 'Companion: Heart of the Beast: Spend option 2 (3 Ferocity)',
    parent: 'Heart of the Beast',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/heart-of-the-beast.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. Your partner gains additional temporary Stamina equal to their Might score for each ferocity spent this way.',
    cost: 3,
  },
  {
    name: 'Companion: Heart of the Beast: Spend option 2 (4 Ferocity)',
    parent: 'Heart of the Beast',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/heart-of-the-beast.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. Your partner gains additional temporary Stamina equal to their Might score for each ferocity spent this way.',
    cost: 4,
  },
  {
    name: 'Companion: Heart of the Beast: Spend option 2 (5 Ferocity)',
    parent: 'Heart of the Beast',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/heart-of-the-beast.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. Your partner gains additional temporary Stamina equal to their Might score for each ferocity spent this way.',
    cost: 5,
  },
  {
    name: 'Companion: Heart of the Beast: Spend option 3 (5 Ferocity)',
    parent: 'Heart of the Beast',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/heart-of-the-beast.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. You restore your dead partner to life with 1 Stamina, even if their body was destroyed. They gain no temporary Stamina if you use this ability this way.',
    cost: 5,
  },
  {
    name: 'Companion: Herd the Sheep',
    parent: 'Herd the Sheep',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/herd-the-sheep.md',
    performer: 'Companion',
    actionType: 'Main action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 3,
  },
  {
    name: 'Companion: Hungry Like the Wolf',
    parent: 'Hungry Like the Wolf',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/hungry-like-the-wolf.md',
    performer: 'Companion',
    actionType: 'Main action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 3,
  },
  {
    name: 'Beastheart: I Feed On Your Pain!',
    parent: 'I Feed On Your Pain!',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/i-feed-on-your-pain.md',
    performer: 'Beastheart',
    actionType: 'Main action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 5,
  },
  {
    name: 'Beastheart: Jaws of the Storm',
    parent: 'Jaws of the Storm',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/jaws-of-the-storm.md',
    performer: 'Beastheart',
    actionType: 'Maneuver',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Beastheart: Jaws of the Storm: Spend option 1 (1 Ferocity)',
    parent: 'Jaws of the Storm',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/jaws-of-the-storm.md',
    performer: 'Beastheart',
    actionType: 'Part of parent ability',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. The size of the cube increases by 1.',
    cost: 1,
  },
  {
    name: 'Beastheart: Lightning Leap',
    parent: 'Lightning Leap',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/lightning-leap.md',
    performer: 'Beastheart',
    actionType: 'Maneuver',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Beastheart: Lightning Leap: Spend option 1 (1 Ferocity)',
    parent: 'Lightning Leap',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/lightning-leap.md',
    performer: 'Beastheart',
    actionType: 'Part of parent ability',
    activationCondition:
      "Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. Your jump doesn't provoke opportunity attacks.",
    cost: 1,
  },
  {
    name: 'Beastheart: Living Arrow',
    parent: 'Living Arrow',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/living-arrow.md',
    performer: 'Beastheart',
    actionType: 'Maneuver',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Beastheart: Living Arrow: Spend option 1 (1 Ferocity)',
    parent: 'Living Arrow',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/living-arrow.md',
    performer: 'Beastheart',
    actionType: 'Part of parent ability',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. The distance increases to ranged 15.',
    cost: 1,
  },
  {
    name: 'Companion: Pushover',
    parent: 'Pushover',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/pushover.md',
    performer: 'Companion',
    actionType: 'Main action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 3,
  },
  {
    name: 'Beastheart: Pyre',
    parent: 'Pyre',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/pyre.md',
    performer: 'Beastheart',
    actionType: 'Triggered Action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Beastheart: Pyre: Spend option 1 (1 Ferocity)',
    parent: 'Pyre',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/pyre.md',
    performer: 'Beastheart',
    actionType: 'Part of parent ability',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. When you [teleport](scc.v1:mcdm.heroes.v1/movement/teleport) this way, each enemy adjacent to your original space takes lightning or fire damage (your choice) equal to your Intuition score.',
    cost: 1,
  },
  {
    name: 'Companion: Pyre',
    parent: 'Pyre',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/pyre.md',
    performer: 'Companion',
    actionType: 'Triggered Action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Pyre: Spend option 1 (1 Ferocity)',
    parent: 'Pyre',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/pyre.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. When you [teleport](scc.v1:mcdm.heroes.v1/movement/teleport) this way, each enemy adjacent to your original space takes lightning or fire damage (your choice) equal to your Intuition score.',
    cost: 1,
  },
  {
    name: 'Beastheart: Rain of Fire',
    parent: 'Rain of Fire',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/rain-of-fire.md',
    performer: 'Beastheart',
    actionType: 'Main action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 5,
  },
  {
    name: 'Beastheart: Shadow in the Mist',
    parent: 'Shadow in the Mist',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/shadow-in-the-mist.md',
    performer: 'Beastheart',
    actionType: 'Triggered Action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Beastheart: Shadow in the Mist: Spend option 1 (1 Ferocity)',
    parent: 'Shadow in the Mist',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/shadow-in-the-mist.md',
    performer: 'Beastheart',
    actionType: 'Part of parent ability',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. You can move up to a number of squares equal to twice your Intuition score and ignore [difficult terrain](scc.v1:mcdm.heroes.v1/movement/difficult-terrain) during this movement.',
    cost: 1,
  },
  {
    name: 'Companion: Shadow in the Mist',
    parent: 'Shadow in the Mist',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/shadow-in-the-mist.md',
    performer: 'Companion',
    actionType: 'Triggered Action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Shadow in the Mist: Spend option 1 (1 Ferocity)',
    parent: 'Shadow in the Mist',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/shadow-in-the-mist.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. You can move up to a number of squares equal to twice your Intuition score and ignore [difficult terrain](scc.v1:mcdm.heroes.v1/movement/difficult-terrain) during this movement.',
    cost: 1,
  },
  {
    name: 'Beastheart: Stormrage',
    parent: 'Stormrage',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/stormrage.md',
    performer: 'Beastheart',
    actionType: 'Main action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Stormrage: Follow-up',
    parent: 'Stormrage',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/stormrage.md',
    performer: 'Companion',
    actionType: 'Triggered free action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Spend one shared surge without its benefit, reuse the original power roll on a different target; no further follow-up.',
  },
  {
    name: 'Beastheart: The Pack Defends',
    parent: 'The Pack Defends',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/the-pack-defends.md',
    performer: 'Beastheart',
    actionType: 'Triggered Action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Beastheart: The Pack Defends: Spend option 1 (1 Ferocity)',
    parent: 'The Pack Defends',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/the-pack-defends.md',
    performer: 'Beastheart',
    actionType: 'Part of parent ability',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. You spend a Recovery without regaining Stamina, and the target regains Stamina equal to your recovery value.',
    cost: 1,
  },
  {
    name: 'Companion: The Pack Defends',
    parent: 'The Pack Defends',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/the-pack-defends.md',
    performer: 'Companion',
    actionType: 'Triggered Action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: The Pack Defends: Spend option 1 (1 Ferocity)',
    parent: 'The Pack Defends',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/the-pack-defends.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. You spend a Recovery without regaining Stamina, and the target regains Stamina equal to your recovery value.',
    cost: 1,
  },
  {
    name: 'Beastheart: Thunderclap',
    parent: 'Thunderclap',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/thunderclap.md',
    performer: 'Beastheart',
    actionType: 'Triggered Action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Beastheart: Thunderclap: Spend option 1 (1 Ferocity)',
    parent: 'Thunderclap',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/thunderclap.md',
    performer: 'Beastheart',
    actionType: 'Part of parent ability',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. The [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) distance is doubled.',
    cost: 1,
  },
  {
    name: 'Companion: Thunderclap',
    parent: 'Thunderclap',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/thunderclap.md',
    performer: 'Companion',
    actionType: 'Triggered Action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Thunderclap: Spend option 1 (1 Ferocity)',
    parent: 'Thunderclap',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/thunderclap.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. The [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) distance is doubled.',
    cost: 1,
  },
  {
    name: 'Beastheart: You Let Me Get Too Close',
    parent: 'You Let Me Get Too Close',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-1/you-let-me-get-too-close.md',
    performer: 'Beastheart',
    actionType: 'Main action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 5,
  },
  {
    name: 'Companion: Petrify',
    parent: 'Petrify',
    sourcePath: 'en/unified/md/feature/ability/companion/beastheart/basilisk/level-1/petrify.md',
    performer: 'Companion',
    actionType: 'Maneuver',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Petrify: Spend option 1 (1 Ferocity)',
    parent: 'Petrify',
    sourcePath: 'en/unified/md/feature/ability/companion/beastheart/basilisk/level-1/petrify.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. While stoned this way, the target is also [slowed](scc.v1:mcdm.heroes.v1/condition/slowed).',
    cost: 1,
  },
  {
    name: 'Companion: Backhand',
    parent: 'Backhand',
    sourcePath: 'en/unified/md/feature/ability/companion/beastheart/bear/level-1/backhand.md',
    performer: 'Companion',
    actionType: 'Maneuver',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Backhand: Spend option 1 (1 Ferocity)',
    parent: 'Backhand',
    sourcePath: 'en/unified/md/feature/ability/companion/beastheart/bear/level-1/backhand.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      "Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. The target is [force moved](scc.v1:mcdm.heroes.v1/movement/forced-movement) up to a number of additional squares equal to the bear's Might score.",
    cost: 1,
  },
  {
    name: 'Companion: Gore',
    parent: 'Gore',
    sourcePath: 'en/unified/md/feature/ability/companion/beastheart/boar/level-1/gore.md',
    performer: 'Companion',
    actionType: 'Maneuver',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Gore: Spend option 1 (1 Ferocity)',
    parent: 'Gore',
    sourcePath: 'en/unified/md/feature/ability/companion/beastheart/boar/level-1/gore.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. The target is [bleeding](scc.v1:mcdm.heroes.v1/condition/bleeding) until the end of their next turn.',
    cost: 1,
  },
  {
    name: 'Companion: Flurry of Wings',
    parent: 'Flurry of Wings',
    sourcePath:
      'en/unified/md/feature/ability/companion/beastheart/condor/level-1/flurry-of-wings.md',
    performer: 'Companion',
    actionType: 'Maneuver',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Flurry of Wings: Spend option 1 (1 Ferocity)',
    parent: 'Flurry of Wings',
    sourcePath:
      'en/unified/md/feature/ability/companion/beastheart/condor/level-1/flurry-of-wings.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. An enemy who would be [weakened](scc.v1:mcdm.heroes.v1/condition/weakened) by this ability is [taunted](scc.v1:mcdm.heroes.v1/condition/taunted) instead.',
    cost: 1,
  },
  {
    name: 'Companion: Terrible Claws',
    parent: 'Terrible Claws',
    sourcePath:
      'en/unified/md/feature/ability/companion/beastheart/deinonychus/level-1/terrible-claws.md',
    performer: 'Companion',
    actionType: 'Maneuver',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Terrible Claws: Spend option 1 (1 Ferocity)',
    parent: 'Terrible Claws',
    sourcePath:
      'en/unified/md/feature/ability/companion/beastheart/deinonychus/level-1/terrible-claws.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. A target who has M < STRONG is [bleeding](scc.v1:mcdm.heroes.v1/condition/bleeding) (save ends).',
    cost: 1,
  },
  {
    name: 'Companion: Drake Breath',
    parent: 'Drake Breath',
    sourcePath: 'en/unified/md/feature/ability/companion/beastheart/drake/level-1/drake-breath.md',
    performer: 'Companion',
    actionType: 'Maneuver',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Drake Breath: Spend option 1 (1 Ferocity)',
    parent: 'Drake Breath',
    sourcePath: 'en/unified/md/feature/ability/companion/beastheart/drake/level-1/drake-breath.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. This ability affects a 3 cube (if you spend 1 ferocity) or a 4 cube (if you spend 2 ferocity) within 1.',
    cost: 1,
  },
  {
    name: 'Companion: Drake Breath: Spend option 1 (2 Ferocity)',
    parent: 'Drake Breath',
    sourcePath: 'en/unified/md/feature/ability/companion/beastheart/drake/level-1/drake-breath.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. This ability affects a 3 cube (if you spend 1 ferocity) or a 4 cube (if you spend 2 ferocity) within 1.',
    cost: 2,
  },
  {
    name: 'Companion: Static Shock',
    parent: 'Static Shock',
    sourcePath:
      'en/unified/md/feature/ability/companion/beastheart/elemental-spark/level-1/static-shock.md',
    performer: 'Companion',
    actionType: 'Maneuver',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Static Shock: Spend option 1 (1 Ferocity)',
    parent: 'Static Shock',
    sourcePath:
      'en/unified/md/feature/ability/companion/beastheart/elemental-spark/level-1/static-shock.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. The distance increases to melee 5.',
    cost: 1,
  },
  {
    name: 'Companion: Absorb',
    parent: 'Absorb',
    sourcePath: 'en/unified/md/feature/ability/companion/beastheart/gummy-ball/level-1/absorb.md',
    performer: 'Companion',
    actionType: 'Maneuver',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Absorb: Spend option 1 (1 Ferocity)',
    parent: 'Absorb',
    sourcePath: 'en/unified/md/feature/ability/companion/beastheart/gummy-ball/level-1/absorb.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      "Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. A target [grabbed](scc.v1:mcdm.heroes.v1/condition/grabbed) this way takes acid damage equal to the ball's Might score at the end of each of the ball's turns.",
    cost: 1,
  },
  {
    name: 'Companion: Fire Breath',
    parent: 'Fire Breath',
    sourcePath:
      'en/unified/md/feature/ability/companion/beastheart/hellhound/level-1/fire-breath.md',
    performer: 'Companion',
    actionType: 'Maneuver',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Fire Breath: Spend option 1 (1 Ferocity)',
    parent: 'Fire Breath',
    sourcePath:
      'en/unified/md/feature/ability/companion/beastheart/hellhound/level-1/fire-breath.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      "Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. This ability gains a bonus to either its damage or distance equal to the hellhound's Intuition score.",
    cost: 1,
  },
  {
    name: 'Companion: Sparking Tail Whip',
    parent: 'Sparking Tail Whip',
    sourcePath:
      'en/unified/md/feature/ability/companion/beastheart/lightbender/level-1/sparking-tail-whip.md',
    performer: 'Companion',
    actionType: 'Maneuver',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Sparking Tail Whip: Spend option 1 (1 Ferocity)',
    parent: 'Sparking Tail Whip',
    sourcePath:
      'en/unified/md/feature/ability/companion/beastheart/lightbender/level-1/sparking-tail-whip.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. A dazzled creature also takes a bane on strikes.',
    cost: 1,
  },
  {
    name: 'Companion: Pounce',
    parent: 'Pounce',
    sourcePath: 'en/unified/md/feature/ability/companion/beastheart/panther/level-1/pounce.md',
    performer: 'Companion',
    actionType: 'Maneuver',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Pounce: Spend option 1 (1 Ferocity)',
    parent: 'Pounce',
    sourcePath: 'en/unified/md/feature/ability/companion/beastheart/panther/level-1/pounce.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. The panther can jump up to a number of squares equal to their speed before using this ability. If they jump at least 1 square in this way, a target who has M < STRONG is knocked [prone](scc.v1:mcdm.heroes.v1/condition/prone).',
    cost: 1,
  },
  {
    name: 'Companion: Web Shot',
    parent: 'Web Shot',
    sourcePath: 'en/unified/md/feature/ability/companion/beastheart/spider/level-1/web-shot.md',
    performer: 'Companion',
    actionType: 'Maneuver',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Web Shot: Spend option 1 (1 Ferocity)',
    parent: 'Web Shot',
    sourcePath: 'en/unified/md/feature/ability/companion/beastheart/spider/level-1/web-shot.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. If the target has M < STRONG, they are [restrained](scc.v1:mcdm.heroes.v1/condition/restrained) (save ends).',
    cost: 1,
  },
  {
    name: 'Companion: Spore Puff',
    parent: 'Spore Puff',
    sourcePath:
      'en/unified/md/feature/ability/companion/beastheart/sporeling/level-1/spore-puff.md',
    performer: 'Companion',
    actionType: 'Maneuver',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Spore Puff: Spend option 1 (1 Ferocity)',
    parent: 'Spore Puff',
    sourcePath:
      'en/unified/md/feature/ability/companion/beastheart/sporeling/level-1/spore-puff.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. If the target has M < STRONG, they are [dazed](scc.v1:mcdm.heroes.v1/condition/dazed) until the end of their next turn.',
    cost: 1,
  },
  {
    name: 'Companion: Clamping Jaws',
    parent: 'Clamping Jaws',
    sourcePath: 'en/unified/md/feature/ability/companion/beastheart/wolf/level-1/clamping-jaws.md',
    performer: 'Companion',
    actionType: 'Maneuver',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Clamping Jaws: Spend option 1 (1 Ferocity)',
    parent: 'Clamping Jaws',
    sourcePath: 'en/unified/md/feature/ability/companion/beastheart/wolf/level-1/clamping-jaws.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. If the target has M < STRONG, they are [grabbed](scc.v1:mcdm.heroes.v1/condition/grabbed) by the wolf.',
    cost: 1,
  },
  {
    name: 'Beastheart: Change companion',
    parent: 'Companion',
    sourcePath: 'en/unified/md/feature/beastheart/level-1/companion-rules.md',
    performer: 'Beastheart',
    actionType: 'Respite activity',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Release or recall companion through the character editor during respite.',
  },
  {
    name: 'Beastheart: Communicate',
    parent: 'Companion Rules',
    sourcePath: 'en/unified/md/feature/beastheart/level-1/companion-rules.md',
    performer: 'Beastheart',
    actionType: 'Source activity',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Within one mile, share vague images and feelings, not words.',
  },
  {
    name: 'Companion: Shared Catch Breath',
    parent: 'Companion Rules',
    sourcePath: 'en/unified/md/feature/beastheart/level-1/companion-rules.md',
    performer: 'Companion',
    actionType: 'Triggered free action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. When partner uses Catch Breath; Recovery expenditure is from hero pool, healing goes to acting companion.',
  },
  {
    name: 'Beastheart: Shared Catch Breath',
    parent: 'Companion Rules',
    sourcePath: 'en/unified/md/feature/beastheart/level-1/companion-rules.md',
    performer: 'Beastheart',
    actionType: 'Triggered free action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. When companion uses Catch Breath.',
  },
  {
    name: 'Companion: Shared Escape Grab',
    parent: 'Companion Rules',
    sourcePath: 'en/unified/md/feature/beastheart/level-1/companion-rules.md',
    performer: 'Companion',
    actionType: 'Triggered free action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. When partner uses Escape Grab.',
  },
  {
    name: 'Beastheart: Shared Escape Grab',
    parent: 'Companion Rules',
    sourcePath: 'en/unified/md/feature/beastheart/level-1/companion-rules.md',
    performer: 'Beastheart',
    actionType: 'Triggered free action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. When partner uses Escape Grab.',
  },
  {
    name: 'Companion: Shared Hide',
    parent: 'Companion Rules',
    sourcePath: 'en/unified/md/feature/beastheart/level-1/companion-rules.md',
    performer: 'Companion',
    actionType: 'Triggered free action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. When partner uses Hide.',
  },
  {
    name: 'Beastheart: Shared Hide',
    parent: 'Companion Rules',
    sourcePath: 'en/unified/md/feature/beastheart/level-1/companion-rules.md',
    performer: 'Beastheart',
    actionType: 'Triggered free action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. When partner uses Hide.',
  },
  {
    name: 'Companion: Shared Stand Up',
    parent: 'Companion Rules',
    sourcePath: 'en/unified/md/feature/beastheart/level-1/companion-rules.md',
    performer: 'Companion',
    actionType: 'Triggered free action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. When partner uses Stand Up.',
  },
  {
    name: 'Beastheart: Shared Stand Up',
    parent: 'Companion Rules',
    sourcePath: 'en/unified/md/feature/beastheart/level-1/companion-rules.md',
    performer: 'Beastheart',
    actionType: 'Triggered free action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. When partner uses Stand Up.',
  },
  {
    name: 'Companion: Melee free strike',
    parent: 'Companion Rules',
    sourcePath: 'en/unified/md/feature/beastheart/level-1/companion-rules.md',
    performer: 'Companion',
    actionType: 'Free strike',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use the species printed Free Strike value; no ranged free strike. Player-companion roll interpretation remains manual.',
  },
  {
    name: 'Companion: Rampage',
    parent: 'Rampage',
    sourcePath: 'en/unified/md/feature/beastheart/level-1/rampage.md',
    performer: 'Companion',
    actionType: 'Source-timed effect',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. After actual Ferocity payment add that amount to Rampage manually; waived payment adds none. At 8, end-turn Feral Strike; at 12, Intuition damage immunity. End encounter clears Rampage. Higher-level thresholds unavailable.',
  },
  {
    name: 'Beastheart: Ferocity',
    parent: 'Ferocity',
    sourcePath: 'en/unified/md/feature/beastheart/level-1/ferocity.md',
    performer: 'Beastheart',
    actionType: 'Source-timed effect',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Levels 1–6: the app adds Victories at combat start and 1d3 at each own-turn start, and clears ferocity at encounter end; claim the first adjacent-to-companion damage each round with /resource claim trigger=beastheart-companion-adjacent-damage (+2, +3 from level 4) and do not also adjust by hand. Level 7+: resolve these gains manually. Outside combat track each paid effect until Victory/respite; variable budget equals Victories.',
  },
  {
    name: 'Beastheart: Use treasure for companion',
    parent: 'Beasthearts and Magic Treasure',
    sourcePath: 'en/unified/md/feature/beastheart/level-1/beasthearts-and-magic-treasure.md',
    performer: 'Beastheart',
    actionType: 'Source activity',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Adjacent companion; only printed eligible consumables and equipment; pay required action.',
  },
  {
    name: 'Companion: Stoned',
    parent: 'Stoned',
    sourcePath: 'en/unified/md/feature/companion/beastheart/basilisk/level-1/stoned.md',
    performer: 'Companion',
    actionType: 'Source-timed effect',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Affected or adjacent creature: Stoned: Cut away stone',
    parent: 'Stoned',
    sourcePath: 'en/unified/md/feature/companion/beastheart/basilisk/level-1/stoned.md',
    performer: 'Affected or adjacent creature',
    actionType: 'Maneuver',
    activationCondition:
      'Affected or adjacent creature performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Eligible affected creature or adjacent creature acts; ends stoned and deals unreducible twice basilisk Might. This is a manual contextual record, not a grant of a basilisk-owned action.',
  },
  {
    name: 'Companion: Spiteful Endurance',
    parent: 'Spiteful Endurance',
    sourcePath: 'en/unified/md/feature/companion/beastheart/boar/level-1/spiteful-endurance.md',
    performer: 'Companion',
    actionType: 'Source-timed effect',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Moving Target',
    parent: 'Moving Target',
    sourcePath: 'en/unified/md/feature/companion/beastheart/condor/level-1/moving-target.md',
    performer: 'Companion',
    actionType: 'Source-timed effect',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Blood Frenzy',
    parent: 'Blood Frenzy',
    sourcePath: 'en/unified/md/feature/companion/beastheart/deinonychus/level-1/blood-frenzy.md',
    performer: 'Companion',
    actionType: 'Source-timed effect',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Electric Surge',
    parent: 'Electric Surge',
    sourcePath:
      'en/unified/md/feature/companion/beastheart/elemental-spark/level-1/electric-surge.md',
    performer: 'Companion',
    actionType: 'Source-timed effect',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Gelatinous',
    parent: 'Gelatinous',
    sourcePath: 'en/unified/md/feature/companion/beastheart/gummy-ball/level-1/gelatinous.md',
    performer: 'Companion',
    actionType: 'Source-timed effect',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Avoidance',
    parent: 'Avoidance',
    sourcePath: 'en/unified/md/feature/companion/beastheart/lightbender/level-1/avoidance.md',
    performer: 'Companion',
    actionType: 'Source-timed effect',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Mighty Spring',
    parent: 'Mighty Spring',
    sourcePath: 'en/unified/md/feature/companion/beastheart/panther/level-1/mighty-spring.md',
    performer: 'Companion',
    actionType: 'Source-timed effect',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Come Into My Parlor',
    parent: 'Come Into My Parlor',
    sourcePath: 'en/unified/md/feature/companion/beastheart/spider/level-1/come-into-my-parlor.md',
    performer: 'Companion',
    actionType: 'Source-timed effect',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Skulker',
    parent: 'Skulker',
    sourcePath: 'en/unified/md/feature/companion/beastheart/sporeling/level-1/skulker.md',
    performer: 'Companion',
    actionType: 'Source-timed effect',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Retriever',
    parent: 'Retriever',
    sourcePath: 'en/unified/md/feature/companion/beastheart/wolf/level-1/retriever.md',
    performer: 'Companion',
    actionType: 'Source-timed effect',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
  },
  {
    name: 'Companion: Fetch!',
    parent: 'Fetch!',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-2/fetch.md',
    performer: 'Companion',
    actionType: 'Main action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 5,
  },
  {
    name: 'Companion: Omnomnom',
    parent: 'Omnomnom',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-2/omnomnom.md',
    performer: 'Companion',
    actionType: 'Main action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 5,
  },
  {
    name: 'Companion: Omnomnom: Regurgitate',
    parent: 'Omnomnom',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-2/omnomnom.md',
    performer: 'Companion',
    actionType: 'Free maneuver',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Only while your companion has a creature swallowed: regurgitate it; it lands prone in an unoccupied square adjacent to your companion.',
  },
  {
    name: 'Companion: Jump Scare',
    parent: 'Jump Scare',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-2/jump-scare.md',
    performer: 'Companion',
    actionType: 'Main action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 5,
  },
  {
    name: 'Companion: On You Like Your Shadow',
    parent: 'On You Like Your Shadow',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-2/on-you-like-your-shadow.md',
    performer: 'Companion',
    actionType: 'Main action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 5,
  },
  {
    name: 'Companion: Foe Bowling',
    parent: 'Foe Bowling',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-2/foe-bowling.md',
    performer: 'Companion',
    actionType: 'Main action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 5,
  },
  {
    name: "Companion: One Roar and We're Back In the Fight",
    parent: "One Roar and We're Back In the Fight",
    sourcePath:
      'en/unified/md/feature/ability/beastheart/level-2/one-roar-and-were-back-in-the-fight.md',
    performer: 'Companion',
    actionType: 'Maneuver',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 5,
  },
  {
    name: 'Companion: Burning Lash',
    parent: 'Burning Lash',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-2/burning-lash.md',
    performer: 'Companion',
    actionType: 'Main action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 5,
  },
  {
    name: 'Companion: Howling Gale',
    parent: 'Howling Gale',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-2/howling-gale.md',
    performer: 'Companion',
    actionType: 'Main action',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 5,
  },
  {
    name: 'Companion: Burning Lash: Spend option 1 (1 Ferocity)',
    parent: 'Burning Lash',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-2/burning-lash.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. If you are within distance of the target, you can use a free maneuver to wield a second whip, dealing extra fire or lightning damage equal to your Intuition score. Who wields the second whip is resolved manually (interpretation; see the V137 ledger).',
    cost: 1,
  },
  {
    name: "Beastheart: This One's Yours",
    parent: "This One's Yours",
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-2/this-ones-yours.md',
    performer: 'Beastheart',
    actionType: 'Free triggered action',
    trigger: 'A creature force moved by another creature enters a space adjacent to you.',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Once per turn. You end the forced movement, then can push the creature up to 1 + your Might squares; it takes 1 damage per square.',
  },
  {
    name: "Beastheart: This One's Yours: Spend option 1 (1 Ferocity)",
    parent: "This One's Yours",
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-2/this-ones-yours.md',
    performer: 'Beastheart',
    actionType: 'Part of parent ability',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. You and your companions can each use this free triggered action on the same turn.',
    cost: 1,
  },
  {
    name: "Companion: This One's Yours",
    parent: "This One's Yours",
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-2/this-ones-yours.md',
    performer: 'Companion',
    actionType: 'Free triggered action',
    trigger: 'A creature force moved by another creature enters a space adjacent to you.',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Once per turn. You end the forced movement, then can push the creature up to 1 + your Might squares; it takes 1 damage per square.',
  },
  {
    name: "Companion: This One's Yours: Spend option 1 (1 Ferocity)",
    parent: "This One's Yours",
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-2/this-ones-yours.md',
    performer: 'Companion',
    actionType: 'Part of parent ability',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Use only with the parent ability. You and your companions can each use this free triggered action on the same turn.',
    cost: 1,
  },
  {
    name: "Companion: Everyone's Best Friend",
    parent: "Everyone's Best Friend",
    sourcePath: 'en/unified/md/feature/beastheart/level-2/everyones-best-friend.md',
    performer: 'Companion',
    actionType: 'During a montage test',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Once per round during a montage test, when you or another character makes a test, the companion can increase the tier outcome by one tier (to a maximum of tier 3).',
  },
  {
    name: 'Beastheart: Death and Violence',
    parent: 'Death and Violence',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-3/death-and-violence.md',
    performer: 'Beastheart',
    actionType: 'Triggered action',
    trigger: 'Your companion uses an ability that reduces the target to 0 Stamina.',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 7,
  },
  {
    name: 'Beastheart: Head to Head',
    parent: 'Head to Head',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-3/head-to-head.md',
    performer: 'Beastheart',
    actionType: 'Main action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 7,
  },
  {
    name: 'Beastheart: Jaws of Death',
    parent: 'Jaws of Death',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-3/jaws-of-death.md',
    performer: 'Beastheart',
    actionType: 'Main action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 7,
  },
  {
    name: 'Beastheart: Jaws of Death: Pull',
    parent: 'Jaws of Death',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-3/jaws-of-death.md',
    performer: 'Beastheart',
    actionType: 'Free triggered action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Only while a target is weakened by Jaws of Death: pull it up to a number of squares equal to your Intuition score.',
    trigger:
      'A target more than 3 squares away from you fails the saving throw while weakened by Jaws of Death.',
  },
  {
    name: 'Beastheart: Shieldbreaker',
    parent: 'Shieldbreaker',
    sourcePath: 'en/unified/md/feature/ability/beastheart/level-3/shieldbreaker.md',
    performer: 'Beastheart',
    actionType: 'Main action',
    activationCondition:
      'Beastheart performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. ',
    cost: 7,
  },
  {
    name: 'Companion: Foes Forever Frozen',
    parent: 'Foes Forever Frozen',
    sourcePath:
      'en/unified/md/feature/companion/beastheart/basilisk/level-3/foes-forever-frozen.md',
    performer: 'Companion',
    actionType: 'While rampaging',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Level 3 companion advancement feature; its rampage or ability rider is resolved manually.',
  },
  {
    name: 'Companion: Foe Thresher',
    parent: 'Foe Thresher',
    sourcePath: 'en/unified/md/feature/companion/beastheart/bear/level-3/foe-thresher.md',
    performer: 'Companion',
    actionType: 'While rampaging',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Level 3 companion advancement feature; its rampage or ability rider is resolved manually.',
  },
  {
    name: 'Companion: Greased Pig',
    parent: 'Greased Pig',
    sourcePath: 'en/unified/md/feature/companion/beastheart/boar/level-3/greased-pig.md',
    performer: 'Companion',
    actionType: 'While rampaging',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Level 3 companion advancement feature; its rampage or ability rider is resolved manually.',
  },
  {
    name: 'Companion: Dive Bomb',
    parent: 'Dive Bomb',
    sourcePath: 'en/unified/md/feature/companion/beastheart/condor/level-3/dive-bomb.md',
    performer: 'Companion',
    actionType: 'While rampaging',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Level 3 companion advancement feature; its rampage or ability rider is resolved manually.',
  },
  {
    name: 'Companion: Tear You to Ribbons',
    parent: 'Tear You to Ribbons',
    sourcePath:
      'en/unified/md/feature/companion/beastheart/deinonychus/level-3/tear-you-to-ribbons.md',
    performer: 'Companion',
    actionType: 'While rampaging',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Level 3 companion advancement feature; its rampage or ability rider is resolved manually.',
  },
  {
    name: 'Companion: Endless Breath',
    parent: 'Endless Breath',
    sourcePath: 'en/unified/md/feature/companion/beastheart/drake/level-3/endless-breath.md',
    performer: 'Companion',
    actionType: 'Part of Drake Breath',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Level 3 companion advancement feature; its rampage or ability rider is resolved manually.',
  },
  {
    name: 'Companion: Electroshock',
    parent: 'Electroshock',
    sourcePath:
      'en/unified/md/feature/companion/beastheart/elemental-spark/level-3/electroshock.md',
    performer: 'Companion',
    actionType: 'While rampaging',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Level 3 companion advancement feature; its rampage or ability rider is resolved manually.',
  },
  {
    name: 'Companion: Suck It Up',
    parent: 'Suck It Up',
    sourcePath: 'en/unified/md/feature/companion/beastheart/gummy-ball/level-3/suck-it-up.md',
    performer: 'Companion',
    actionType: 'While rampaging',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Level 3 companion advancement feature; its rampage or ability rider is resolved manually.',
  },
  {
    name: 'Companion: Infernal Apparition',
    parent: 'Infernal Apparition',
    sourcePath:
      'en/unified/md/feature/companion/beastheart/hellhound/level-3/infernal-apparition.md',
    performer: 'Companion',
    actionType: 'While rampaging',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Level 3 companion advancement feature; its rampage or ability rider is resolved manually.',
  },
  {
    name: 'Companion: Hit and Run',
    parent: 'Hit and Run',
    sourcePath: 'en/unified/md/feature/companion/beastheart/lightbender/level-3/hit-and-run.md',
    performer: 'Companion',
    actionType: 'While rampaging',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Level 3 companion advancement feature; its rampage or ability rider is resolved manually.',
  },
  {
    name: 'Companion: Cat and Mouse',
    parent: 'Cat and Mouse',
    sourcePath: 'en/unified/md/feature/companion/beastheart/panther/level-3/cat-and-mouse.md',
    performer: 'Companion',
    actionType: 'While rampaging',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Level 3 companion advancement feature; its rampage or ability rider is resolved manually.',
  },
  {
    name: 'Companion: Dripping Fangs',
    parent: 'Dripping Fangs',
    sourcePath: 'en/unified/md/feature/companion/beastheart/spider/level-3/dripping-fangs.md',
    performer: 'Companion',
    actionType: 'While rampaging',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Level 3 companion advancement feature; its rampage or ability rider is resolved manually.',
  },
  {
    name: 'Companion: Slowing Spores',
    parent: 'Slowing Spores',
    sourcePath: 'en/unified/md/feature/companion/beastheart/sporeling/level-3/slowing-spores.md',
    performer: 'Companion',
    actionType: 'While rampaging',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Level 3 companion advancement feature; its rampage or ability rider is resolved manually.',
  },
  {
    name: 'Companion: My, What Big Teeth You Have',
    parent: 'My, What Big Teeth You Have',
    sourcePath:
      'en/unified/md/feature/companion/beastheart/wolf/level-3/my-what-big-teeth-you-have.md',
    performer: 'Companion',
    actionType: 'While rampaging',
    activationCondition:
      'Companion performs this effect. Record and resolve manually using the chosen companion and the printed source; no companion combat actor, damage, healing, conditions, movement, or Rampage is applied. Level 3 companion advancement feature; its rampage or ability rider is resolved manually.',
  },
];
export function beastheartSourceText(a: BeastheartAction): string {
  const source = [...abilitySources, ...featureSources].find(
    s => s.sourcePath === `vendor/steel-compendium/${a.sourcePath}`,
  );
  if (!source) throw new Error(`Missing Beastheart source: ${a.sourcePath}`);
  return sourceBody(source.text);
}
export function beastheartActionText(a: BeastheartAction): string {
  return `${a.activationCondition}\n\n${beastheartSourceText(a)}`;
}
