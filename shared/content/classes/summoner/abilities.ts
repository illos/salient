// SPDX-License-Identifier: GPL-3.0-only
import abilitySources from '../../compendium/ability.json' with { type: 'json' };
import featureSources from '../../compendium/feature.json' with { type: 'json' };
import statblockSources from '../../compendium/statblock.json' with { type: 'json' };
export interface SummonerAction {
  name: string;
  parent: string;
  sourcePath: string;
  actionType: string;
  activationCondition: string;
  cost?: number;
  trigger?: string;
}
export const SUMMONER_ACTIONS: SummonerAction[] = [
  {
    name: 'Summoner: Distraction Tactics',
    parent: 'Distraction Tactics',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/distraction-tactics.md',
    actionType: 'Free maneuver',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. ',
    cost: 5,
  },
  {
    name: 'Summoner: Essence Transfer',
    parent: 'Essence Transfer',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/essence-transfer.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. ',
    cost: 5,
  },
  {
    name: 'Summoner: Explosive Parade',
    parent: 'Explosive Parade',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/explosive-parade.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. ',
    cost: 5,
  },
  {
    name: 'Summoner: Focus Fire!',
    parent: 'Focus Fire!',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/focus-fire.md',
    actionType: 'Triggered',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. ',
    trigger:
      'The target deals [damage](scc.v1:mcdm.heroes.v1/rule.damage/damage) to another creature.',
  },
  {
    name: 'Summoner: Focus Fire!: 1 Essence option',
    parent: 'Focus Fire!',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/focus-fire.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use only with the parent ability. If the triggering damage is from an ability that uses a [power roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll), the [power roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) gains an [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge).',
    cost: 1,
  },
  {
    name: 'Summoner: Halt!',
    parent: 'Halt!',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/halt.md',
    actionType: 'Triggered',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. ',
    trigger:
      'The target starts their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn), moves, or is [force moved](scc.v1:mcdm.heroes.v1/movement/forced-movement).',
  },
  {
    name: 'Summoner: Minion Bridge',
    parent: 'Minion Bridge',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/minion-bridge.md',
    actionType: 'Maneuver',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. ',
  },
  {
    name: 'Summoner: Minion Bridge: 1 Essence option',
    parent: 'Minion Bridge',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/minion-bridge.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use only with the parent ability. An adjacent ally can [shift](scc.v1:mcdm.heroes.v1/movement/shifting) alongside you during this movement. They must end their movement in an unoccupied square adjacent to the last minion you moved through.',
    cost: 1,
  },
  {
    name: 'Summoner: Not Yet!',
    parent: 'Not Yet!',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/not-yet.md',
    actionType: 'Triggered',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. ',
    trigger: 'The target receives enough damage to die or be destroyed.',
  },
  {
    name: 'Summoner: Rallying Cry',
    parent: 'Rallying Cry',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/rallying-cry.md',
    actionType: 'Maneuver',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. ',
    cost: 5,
  },
  {
    name: 'Summoner: Shield!',
    parent: 'Shield!',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/shield.md',
    actionType: 'Triggered',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. ',
    trigger: 'The target is targeted by a [strike](scc.v1:mcdm.heroes.v1/rule.combat/strike).',
  },
  {
    name: 'Summoner: Shield!: 1 Essence option',
    parent: 'Shield!',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/shield.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use only with the parent ability. Instead of commanding an existing minion, you summon a signature minion into an unoccupied space [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to the target to take the strike.',
    cost: 1,
  },
  {
    name: 'Summoner: Shields of Essence',
    parent: 'Shields of Essence',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/shields-of-essence.md',
    actionType: 'Maneuver',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. ',
    cost: 5,
  },
  {
    name: 'Summoner: Strike for Me',
    parent: 'Strike for Me',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/strike-for-me.md',
    actionType: 'Free triggered',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. ',
    trigger:
      'You use a [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) to make a [free strike](scc.v1:mcdm.heroes.v1/feature.common.main-actions/free-strike) or use a [signature ability](scc.v1:mcdm.heroes.v1/rule.combat/signature-ability).',
  },
  {
    name: 'Summoner: Summoner Strike',
    parent: 'Summoner Strike',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/summoner-strike.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. ',
  },
  {
    name: "Summoner: Summoner's Sword",
    parent: "Summoner's Sword",
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/summoners-sword.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. ',
    cost: 5,
  },
  {
    name: 'Summoner: Halt!: Reposition minion',
    parent: 'Halt!',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/halt.md',
    actionType: 'Triggered',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use the alternative shift instead of summoning.',
  },
  {
    name: 'Summoner: Essence Transfer: Recovery',
    parent: 'Essence Transfer',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/essence-transfer.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Spend 1 rolled charge; target spends a Recovery manually.',
  },
  {
    name: 'Summoner: Essence Transfer: Surge',
    parent: 'Essence Transfer',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/essence-transfer.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Spend 1 rolled charge; grant a surge manually.',
  },
  {
    name: 'Summoner: Essence Transfer: Signature minion',
    parent: 'Essence Transfer',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/essence-transfer.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Spend 2 rolled charges.',
  },
  {
    name: 'Summoner: Shields of Essence: Reduce damage',
    parent: 'Shields of Essence',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/shields-of-essence.md',
    actionType: 'Free triggered action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Protected creature acts when damaged, then loses this effect.',
  },
  {
    name: 'Summoner: Rallying Cry: Surges',
    parent: 'Rallying Cry',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/rallying-cry.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Target chooses 2 surges.',
  },
  {
    name: 'Summoner: Rallying Cry: Damage bonus',
    parent: 'Rallying Cry',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/rallying-cry.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Target chooses Reason damage on their next strike.',
  },
  {
    name: 'Summoner: Death Snap',
    parent: 'Death Snap',
    sourcePath: 'en/unified/md/feature/summoner/level-1/death-snap.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Demon dies unwillingly; damage before death.',
  },
  {
    name: 'Summoner: Soulsense',
    parent: 'Soulsense',
    sourcePath: 'en/unified/md/feature/summoner/level-1/soulsense.md',
    actionType: 'Source activity',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Line of effect; trail for 5 minutes at level one; respite exception.',
  },
  {
    name: 'Summoner: Dead Men Tell All Tales',
    parent: 'Dead Men Tell All Tales',
    sourcePath: 'en/unified/md/feature/summoner/level-1/dead-men-tell-all-tales.md',
    actionType: 'Source activity',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Corpse died within one week; additional questions need medium Reason test.',
  },
  {
    name: 'Summoner: Rise!',
    parent: 'Rise!',
    sourcePath: 'en/unified/md/feature/summoner/level-1/rise.md',
    actionType: 'Triggered action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Once per round; unwilling death in range; squad required; cannot act until next turn; free if minion.',
  },
  {
    name: 'Summoner: Fairy Whispers',
    parent: 'Fairy Whispers',
    sourcePath: 'en/unified/md/feature/summoner/level-1/fairy-whispers.md',
    actionType: 'Source activity',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Returned minion rumor; Reason test and cumulative banes.',
  },
  {
    name: 'Summoner: Pixie Dust',
    parent: 'Pixie Dust',
    sourcePath: 'en/unified/md/feature/summoner/level-1/pixie-dust.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Fey dies in range; spend a Recovery manually; adjacent non-minion allies gain twice Reason temporary Stamina.',
  },
  {
    name: 'Summoner: Elemental Affinity',
    parent: 'Elemental Affinity',
    sourcePath: 'en/unified/md/feature/summoner/level-1/elemental-affinity.md',
    actionType: 'Part of Call Forth',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Non-signature elemental Call Forth: bonus signature of matching element or mote; manually track cap and squads.',
  },
  {
    name: 'Summoner: Heart of Nature',
    parent: 'Heart of Nature',
    sourcePath: 'en/unified/md/feature/summoner/level-1/heart-of-nature.md',
    actionType: 'Source activity',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Elemental or Dragon within one mile; Intuition social tests minimum tier 2.',
  },
  {
    name: 'Summoner: Leader Formation',
    parent: 'Leader Formation',
    sourcePath: 'en/unified/md/feature/summoner/level-1/leader-formation.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Choose to take damage for minion within range.',
  },
  {
    name: 'Summoner: Platoon Formation',
    parent: 'Platoon Formation',
    sourcePath: 'en/unified/md/feature/summoner/level-1/platoon-formation.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. One target takes Reason additional damage after damaging squad ability.',
  },
  {
    name: 'Summoner: Essence',
    parent: 'Essence',
    sourcePath: 'en/unified/md/feature/summoner/level-1/essence.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Levels 1–6: the app adds Victories at combat start and +2 at each own-turn start, and clears essence at encounter end; claim the first unwilling minion death in range each round with /resource claim trigger=summoner-minion-death (+1, +2 from level 4) and do not also adjust by hand. Level 7+: resolve these gains manually. Track outside-combat reuse until Victory/respite.',
  },
  {
    name: 'Summoner: Minions',
    parent: 'Minions',
    sourcePath: 'en/unified/md/feature/summoner/level-1/minions.md',
    actionType: 'Source activity',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Commands, squad allocation and summon limits tracked manually.',
  },
  {
    name: 'Summoner: Formation',
    parent: 'Formation',
    sourcePath: 'en/unified/md/feature/summoner/level-1/formation.md',
    actionType: 'Respite activity',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Change formation and quick command together through editor after intense study.',
  },
  {
    name: 'Summoner: Sacrifice minions',
    parent: 'Essence',
    sourcePath: 'en/unified/md/feature/summoner/level-1/essence.md',
    actionType: 'Part of paid effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Eligible minions in range cannot have used main action or maneuver this turn; record sacrifice and adjust Essence manually for the printed reduction before paying the normal action cost.',
  },
  {
    name: 'Summoner: Start of combat summons',
    parent: 'Minions',
    sourcePath: 'en/unified/md/feature/summoner/level-1/minions.md',
    actionType: 'No action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon up to two signature minions at no cost.',
  },
  {
    name: 'Summoner: Start of turn summons',
    parent: 'Minions',
    sourcePath: 'en/unified/md/feature/summoner/level-1/minions.md',
    actionType: 'No action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon up to three signature minions, or four with Horde, at no cost.',
  },
  {
    name: 'Summoner: Outside combat summons',
    parent: 'Minions',
    sourcePath: 'en/unified/md/feature/summoner/level-1/minions.md',
    actionType: 'Source activity',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Maximum four minions; non-signature requires Victories at least cost and printed batch.',
  },
  {
    name: 'Summoner: Dismiss minions',
    parent: 'Minions',
    sourcePath: 'en/unified/md/feature/summoner/level-1/minions.md',
    actionType: 'Source activity',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Finish tasks then dismiss at encounter end or combat start for outside-combat minions.',
  },
  {
    name: 'Call Forth: Archer Spittlich',
    parent: 'Archer Spittlich',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 2 Archer Spittlich; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 3; no summoned actors are created.',
    cost: 3,
  },
  {
    name: 'Minion Archer Spittlich: Free strike',
    parent: 'Archer Spittlich',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/archer-spittlich.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Archer Spittlich: Splash Strike',
    parent: 'Archer Spittlich',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/archer-spittlich.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Archer Spittlich: Soulsight',
    parent: 'Archer Spittlich',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/archer-spittlich.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Ensnarer',
    parent: 'Ensnarer',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 1 Ensnarer; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 1; no summoned actors are created.',
    cost: 1,
  },
  {
    name: 'Minion Ensnarer: Free strike',
    parent: 'Ensnarer',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/ensnarer.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Ensnarer: Extended Barbed Strike',
    parent: 'Ensnarer',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/ensnarer.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Ensnarer: Soulsight',
    parent: 'Ensnarer',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/ensnarer.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Fanged Musilex',
    parent: 'Fanged Musilex',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 2 Fanged Musilex; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 3; no summoned actors are created.',
    cost: 3,
  },
  {
    name: 'Minion Fanged Musilex: Free strike',
    parent: 'Fanged Musilex',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/fanged-musilex.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Fanged Musilex: Mawful Strike',
    parent: 'Fanged Musilex',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/fanged-musilex.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Fanged Musilex: Soulsight',
    parent: 'Fanged Musilex',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/fanged-musilex.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Rasquine',
    parent: 'Rasquine',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 1 Rasquine; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 1; no summoned actors are created.',
    cost: 1,
  },
  {
    name: 'Minion Rasquine: Free strike',
    parent: 'Rasquine',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/rasquine.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Rasquine: Skulker',
    parent: 'Rasquine',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/rasquine.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Rasquine: Soulsight',
    parent: 'Rasquine',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/rasquine.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Razor',
    parent: 'Razor',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 1 Razor; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 1; no summoned actors are created.',
    cost: 1,
  },
  {
    name: 'Minion Razor: Free strike',
    parent: 'Razor',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/razor.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Razor: Teeth!',
    parent: 'Razor',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/razor.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Razor: Soulsight',
    parent: 'Razor',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/razor.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Twisted Bengrul',
    parent: 'Twisted Bengrul',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 2 Twisted Bengrul; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 3; no summoned actors are created.',
    cost: 3,
  },
  {
    name: 'Minion Twisted Bengrul: Free strike',
    parent: 'Twisted Bengrul',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/twisted-bengrul.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Twisted Bengrul: Mind Twist',
    parent: 'Twisted Bengrul',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/twisted-bengrul.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Twisted Bengrul: Soulsight',
    parent: 'Twisted Bengrul',
    sourcePath: 'en/unified/md/monster/minion/summoner/demon/statblock/twisted-bengrul.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Grave Knight',
    parent: 'Grave Knight',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 2 Grave Knight; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 3; no summoned actors are created.',
    cost: 3,
  },
  {
    name: 'Minion Grave Knight: Free strike',
    parent: 'Grave Knight',
    sourcePath: 'en/unified/md/monster/minion/summoner/undead/statblock/grave-knight.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Grave Knight: Knight Strike',
    parent: 'Grave Knight',
    sourcePath: 'en/unified/md/monster/minion/summoner/undead/statblock/grave-knight.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Grave Knight: To the Grave',
    parent: 'Grave Knight',
    sourcePath: 'en/unified/md/monster/minion/summoner/undead/statblock/grave-knight.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Husk',
    parent: 'Husk',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 1 Husk; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 1; no summoned actors are created.',
    cost: 1,
  },
  {
    name: 'Minion Husk: Free strike',
    parent: 'Husk',
    sourcePath: 'en/unified/md/monster/minion/summoner/undead/statblock/husk.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Husk: Rotting Strike',
    parent: 'Husk',
    sourcePath: 'en/unified/md/monster/minion/summoner/undead/statblock/husk.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Shrieker',
    parent: 'Shrieker',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 1 Shrieker; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 1; no summoned actors are created.',
    cost: 1,
  },
  {
    name: 'Minion Shrieker: Free strike',
    parent: 'Shrieker',
    sourcePath: 'en/unified/md/monster/minion/summoner/undead/statblock/shrieker.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Shrieker: Howling Strike',
    parent: 'Shrieker',
    sourcePath: 'en/unified/md/monster/minion/summoner/undead/statblock/shrieker.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Shrieker: Shrill Alarm',
    parent: 'Shrieker',
    sourcePath: 'en/unified/md/monster/minion/summoner/undead/statblock/shrieker.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Skeleton',
    parent: 'Skeleton',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 1 Skeleton; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 1; no summoned actors are created.',
    cost: 1,
  },
  {
    name: 'Minion Skeleton: Free strike',
    parent: 'Skeleton',
    sourcePath: 'en/unified/md/monster/minion/summoner/undead/statblock/skeleton.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Skeleton: Bonetrops',
    parent: 'Skeleton',
    sourcePath: 'en/unified/md/monster/minion/summoner/undead/statblock/skeleton.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Stalker Shade',
    parent: 'Stalker Shade',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 2 Stalker Shade; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 3; no summoned actors are created.',
    cost: 3,
  },
  {
    name: 'Minion Stalker Shade: Free strike',
    parent: 'Stalker Shade',
    sourcePath: 'en/unified/md/monster/minion/summoner/undead/statblock/stalker-shade.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Stalker Shade: Shadow Strike',
    parent: 'Stalker Shade',
    sourcePath: 'en/unified/md/monster/minion/summoner/undead/statblock/stalker-shade.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Stalker Shade: Shadow Phasing',
    parent: 'Stalker Shade',
    sourcePath: 'en/unified/md/monster/minion/summoner/undead/statblock/stalker-shade.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Zombie Lumberer',
    parent: 'Zombie Lumberer',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 2 Zombie Lumberer; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 3; no summoned actors are created.',
    cost: 3,
  },
  {
    name: 'Minion Zombie Lumberer: Free strike',
    parent: 'Zombie Lumberer',
    sourcePath: 'en/unified/md/monster/minion/summoner/undead/statblock/zombie-lumberer.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Zombie Lumberer: Zombie Clutch',
    parent: 'Zombie Lumberer',
    sourcePath: 'en/unified/md/monster/minion/summoner/undead/statblock/zombie-lumberer.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Zombie Lumberer: Death Grasp',
    parent: 'Zombie Lumberer',
    sourcePath: 'en/unified/md/monster/minion/summoner/undead/statblock/zombie-lumberer.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Nixie Soakreed',
    parent: 'Nixie Soakreed',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 1 Nixie Soakreed; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 1; no summoned actors are created.',
    cost: 1,
  },
  {
    name: 'Minion Nixie Soakreed: Free strike',
    parent: 'Nixie Soakreed',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/nixie-soakreed.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Nixie Soakreed: Water Weird',
    parent: 'Nixie Soakreed',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/nixie-soakreed.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Nixie Soakreed: Soaking Bog',
    parent: 'Nixie Soakreed',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/nixie-soakreed.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Nixie Soakreed: Minuscule',
    parent: 'Nixie Soakreed',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/nixie-soakreed.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Pixie Bellringer',
    parent: 'Pixie Bellringer',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 1 Pixie Bellringer; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 1; no summoned actors are created.',
    cost: 1,
  },
  {
    name: 'Minion Pixie Bellringer: Free strike',
    parent: 'Pixie Bellringer',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/pixie-bellringer.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Pixie Bellringer: Ringing Strike',
    parent: 'Pixie Bellringer',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/pixie-bellringer.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Pixie Bellringer: Fairy Chime',
    parent: 'Pixie Bellringer',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/pixie-bellringer.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Pixie Bellringer: Minuscule',
    parent: 'Pixie Bellringer',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/pixie-bellringer.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Pixie Hydrain',
    parent: 'Pixie Hydrain',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 2 Pixie Hydrain; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 3; no summoned actors are created.',
    cost: 3,
  },
  {
    name: 'Minion Pixie Hydrain: Free strike',
    parent: 'Pixie Hydrain',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/pixie-hydrain.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Pixie Hydrain: Burning/Healing Rain',
    parent: 'Pixie Hydrain',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/pixie-hydrain.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Pixie Hydrain: Minuscule',
    parent: 'Pixie Hydrain',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/pixie-hydrain.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Pixie Loftlilly',
    parent: 'Pixie Loftlilly',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 2 Pixie Loftlilly; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 3; no summoned actors are created.',
    cost: 3,
  },
  {
    name: 'Minion Pixie Loftlilly: Free strike',
    parent: 'Pixie Loftlilly',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/pixie-loftlilly.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Pixie Loftlilly: Floating Toxins',
    parent: 'Pixie Loftlilly',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/pixie-loftlilly.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Pixie Loftlilly: Minuscule',
    parent: 'Pixie Loftlilly',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/pixie-loftlilly.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Sprite Dandeknight',
    parent: 'Sprite Dandeknight',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 1 Sprite Dandeknight; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 1; no summoned actors are created.',
    cost: 1,
  },
  {
    name: 'Minion Sprite Dandeknight: Free strike',
    parent: 'Sprite Dandeknight',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/sprite-dandeknight.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Sprite Dandeknight: Magic Strike',
    parent: 'Sprite Dandeknight',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/sprite-dandeknight.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Sprite Dandeknight: Staccato Swings',
    parent: 'Sprite Dandeknight',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/sprite-dandeknight.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Sprite Dandeknight: Minuscule',
    parent: 'Sprite Dandeknight',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/sprite-dandeknight.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Sprite Orchiguard',
    parent: 'Sprite Orchiguard',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 2 Sprite Orchiguard; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 3; no summoned actors are created.',
    cost: 3,
  },
  {
    name: 'Minion Sprite Orchiguard: Free strike',
    parent: 'Sprite Orchiguard',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/sprite-orchiguard.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Sprite Orchiguard: Fairy Guard',
    parent: 'Sprite Orchiguard',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/sprite-orchiguard.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Sprite Orchiguard: Minuscule',
    parent: 'Sprite Orchiguard',
    sourcePath: 'en/unified/md/monster/minion/summoner/fey/statblock/sprite-orchiguard.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Brisk Gale',
    parent: 'Brisk Gale',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 1 Brisk Gale; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 1; no summoned actors are created.',
    cost: 1,
  },
  {
    name: 'Minion Brisk Gale: Free strike',
    parent: 'Brisk Gale',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/brisk-gale.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Brisk Gale: Cutting the Air',
    parent: 'Brisk Gale',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/brisk-gale.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Brisk Gale: Whirlwind',
    parent: 'Brisk Gale',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/brisk-gale.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Crux of Ash',
    parent: 'Crux of Ash',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 2 Crux of Ash; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 3; no summoned actors are created.',
    cost: 3,
  },
  {
    name: 'Minion Crux of Ash: Free strike',
    parent: 'Crux of Ash',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/crux-of-ash.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Crux of Ash: Soot Strike',
    parent: 'Crux of Ash',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/crux-of-ash.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Crux of Ash: Ashen Cloud',
    parent: 'Crux of Ash',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/crux-of-ash.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
    cost: 1,
  },
  {
    name: 'Call Forth: Desolation of Sand',
    parent: 'Desolation of Sand',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 2 Desolation of Sand; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 3; no summoned actors are created.',
    cost: 3,
  },
  {
    name: 'Minion Desolation of Sand: Free strike',
    parent: 'Desolation of Sand',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/desolation-of-sand.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Desolation of Sand: Burying Strike',
    parent: 'Desolation of Sand',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/desolation-of-sand.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Desolation of Sand: Sand Through Your Fingers',
    parent: 'Desolation of Sand',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/desolation-of-sand.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Desolation of Sand: Shifting Sand Pit',
    parent: 'Desolation of Sand',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/desolation-of-sand.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
    cost: 1,
  },
  {
    name: 'Call Forth: Elemental Mote',
    parent: 'Elemental Mote',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 1 Elemental Mote; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 1; no summoned actors are created.',
    cost: 1,
  },
  {
    name: 'Minion Elemental Mote: Free strike',
    parent: 'Elemental Mote',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/elemental-mote.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Elemental Mote: Dweomer Burst',
    parent: 'Elemental Mote',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/elemental-mote.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Elemental Mote: Catalyst',
    parent: 'Elemental Mote',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/elemental-mote.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Elemental Mote: Catalyst outside portfolio',
    parent: 'Elemental Mote',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/elemental-mote.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Once per turn; transform into an elemental signature minion not in portfolio; treat the replacement as newly summoned and reassign squad. Resolve new minion traits manually from its source.',
    cost: 1,
  },
  {
    name: 'Call Forth: Fire Plume',
    parent: 'Fire Plume',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 1 Fire Plume; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 1; no summoned actors are created.',
    cost: 1,
  },
  {
    name: 'Minion Fire Plume: Free strike',
    parent: 'Fire Plume',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/fire-plume.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Fire Plume: Spitfire Strike',
    parent: 'Fire Plume',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/fire-plume.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Fire Plume: Pyre',
    parent: 'Fire Plume',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/fire-plume.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Call Forth: Flow of Magma',
    parent: 'Flow of Magma',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 2 Flow of Magma; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 3; no summoned actors are created.',
    cost: 3,
  },
  {
    name: 'Minion Flow of Magma: Free strike',
    parent: 'Flow of Magma',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/flow-of-magma.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Flow of Magma: Molten Strike',
    parent: 'Flow of Magma',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/flow-of-magma.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Flow of Magma: Eruption',
    parent: 'Flow of Magma',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/flow-of-magma.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
    cost: 1,
  },
  {
    name: 'Call Forth: Walking Boulder',
    parent: 'Walking Boulder',
    sourcePath: 'en/unified/md/feature/ability/summoner/level-1/call-forth.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Summon 1 Walking Boulder; requires portfolio, range, unoccupied spaces, minion and squad capacity. Outside combat requires signature or Victories ≥ 1; no summoned actors are created.',
    cost: 1,
  },
  {
    name: 'Minion Walking Boulder: Free strike',
    parent: 'Walking Boulder',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/walking-boulder.md',
    actionType: 'Main action',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Use selected minion printed free strike and any traits; summoner Reason replaces R, not minion Reason.',
  },
  {
    name: 'Minion Walking Boulder: Obstruct',
    parent: 'Walking Boulder',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/walking-boulder.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
  },
  {
    name: 'Minion Walking Boulder: Pile Up',
    parent: 'Walking Boulder',
    sourcePath: 'en/unified/md/monster/minion/summoner/elemental/statblock/walking-boulder.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Record and resolve manually using the printed source. Summoned creatures, squads, damage, healing, conditions, movement and turn timing are not applied. Essence payment is automatic unless waived outside combat; track paid-effect reuse until a Victory or respite manually. Requires this summoned minion and its printed trigger/conditions.',
    cost: 1,
  },
];
export function summonerSourceText(a: SummonerAction): string {
  const source = [...abilitySources, ...featureSources, ...statblockSources].find(
    s => s.sourcePath === 'vendor/steel-compendium/' + a.sourcePath,
  );
  if (!source) throw new Error('Missing Summoner source: ' + a.sourcePath);
  return source.text;
}
export function summonerActionText(a: SummonerAction): string {
  return a.activationCondition + '\n\n' + summonerSourceText(a);
}
