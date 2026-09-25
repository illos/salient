// SPDX-License-Identifier: GPL-3.0-only
/**
 * V175 marks (docs/build/V175-marks.md, docs/lasting-effects-design.md#5-marks-and-similar-statuses).
 * Pure: the whole printed text of the Tactician's Mark read as one mark spec, who gets the Mark
 * edge, which benefits a trigger offers, what a chosen benefit does, and the one place that decides
 * whether players see marks. There is no substring or ability-name dispatch: the Mark is read by
 * matching its printed paragraphs whole, and a changed paragraph leaves the ability manual.
 *
 * Source: pinned Compendium `en/unified/md/feature/ability/tactician/level-1/mark.md` (Maneuver,
 * Ranged 10, One creature). Judgment (Censor) is not read here: it gets its own reading from its own
 * file, and is not assumed to share these rules (design section 5).
 */
import type { EffectEndTrigger, MarkBenefitKind } from '../contracts/liveState.ts';
import { blocksFromMarkdown, plain, readMarkdownItems, type Envelope } from './abilityGrammar.ts';

export const MARK_SOURCE = 'feature/ability/tactician/level-1/mark.md';

/**
 * The printed paragraphs of mark.md, display markup removed, in order. The first is the structured
 * Effect section; the rest follow it in the printed Effect block.
 */
const EFFECT =
  'The target is marked by you until the end of the encounter, until you are dying, or until you use this ability again. You can willingly end your mark on a creature (no action required), and if another tactician marks a creature, your mark on that creature ends. When a creature marked by you is reduced to 0 Stamina, you can use a free triggered action to mark a new target within distance.';
const PARAGRAPHS = [
  // Target count: one creature at levels 1–4 (Anticipation, level 5, is outside the V1 target).
  "You can initially mark only one creature using this ability, though other tactician abilities allow you to mark additional creatures at the same time. The mastermind tactical doctrine's Anticipation feature allows you to target additional creatures with this ability starting at 5th level.",
  'While a creature marked by you is within your line of effect, you and allies within your line of effect gain an edge on power rolls made against that creature. Additionally, whenever you or any ally uses an ability to deal rolled damage to a creature marked by you, you can spend 1 focus to gain one of the following benefits as a free triggered action:',
  '- The ability deals extra damage equal to twice your Reason score.',
  '- The creature dealing the damage can spend a Recovery.',
  '- The creature dealing the damage can shift up to a number of squares equal to your Reason score.',
  '- If you damage a creature marked by you with a melee ability, the creature is taunted by you until the end of their next turn.',
  "You can't gain more than one benefit from the same trigger.",
] as const;

/** The printed benefit list (mark.md), each with its printed line. */
export const MARK_BENEFITS: readonly { kind: MarkBenefitKind; text: string }[] = [
  { kind: 'extra-damage', text: PARAGRAPHS[2].slice(2) },
  { kind: 'recovery', text: PARAGRAPHS[3].slice(2) },
  { kind: 'shift', text: PARAGRAPHS[4].slice(2) },
  { kind: 'taunt', text: PARAGRAPHS[5].slice(2) },
];

/**
 * The Mark as printed. Every field is a printed clause of mark.md:
 * - `duration`/`endsWhen`: "until the end of the encounter, until you are dying, or until you use
 *   this ability again"; "You can willingly end your mark on a creature (no action required)".
 * - `exclusive`: "if another tactician marks a creature, your mark on that creature ends" — a source
 *   exception to "Stacking Unique Effects", applied explicitly when a mark is stored.
 * - `retarget`: "When a creature marked by you is reduced to 0 Stamina, you can use a free triggered
 *   action to mark a new target within distance." `distance` is the printed distance.
 * - `edge`: "you and allies … gain an edge on power rolls made against that creature", with both
 *   printed line-of-effect conditions, which the table confirms (there is no map).
 * - `benefit`: "whenever you or any ally uses an ability to deal rolled damage to a creature marked
 *   by you, you can spend 1 focus to gain one of the following benefits as a free triggered
 *   action", and "You can't gain more than one benefit from the same trigger."
 */
export interface MarkSpec {
  effect: 'mark';
  subject: 'target';
  duration: { kind: 'encounter' };
  endsWhen: EffectEndTrigger[];
  exclusive: 'one-tactician';
  retarget: { actionType: 'free triggered action'; distance: string };
  edge: { edges: 1; scope: 'power-roll'; rollers: 'owner-and-allies' };
  benefit: {
    actionType: 'free triggered action';
    cost: { resource: 'focus'; amount: 1 };
    trigger: 'rolled-damage';
    options: MarkBenefitKind[];
    perTrigger: 1;
  };
  /** The printed Effect block, display markup removed. */
  text: string;
}

const normalize = (text: string) => plain(text).replace(/\s+/g, ' ').trim();

/**
 * Reads a whole envelope as the Mark, or `undefined`. The structured Effect section must be the
 * printed first paragraph, and the printed Effect block (the full source) must be exactly the
 * printed paragraphs in order; any other text, cost, action or target leaves the ability manual.
 * `paragraphs` are the printed paragraphs the spec accounts for, so the compiler doesn't report them
 * as unaccounted.
 */
export function readMarkAbility(
  envelope: Pick<Envelope, 'blocks' | 'markdown' | 'name' | 'usage' | 'target' | 'distance'> & {
    cost?: string;
  },
): { spec: MarkSpec; paragraphs: string[] } | undefined {
  const [block, ...rest] = envelope.blocks;
  if (
    !block ||
    rest.length ||
    block.kind !== 'section' ||
    block.label !== 'Effect' ||
    block.cost ||
    envelope.cost ||
    normalize(block.text) !== EFFECT ||
    normalize(envelope.usage).toLowerCase() !== 'maneuver' ||
    normalize(envelope.target).toLowerCase() !== 'one creature'
  )
    return undefined;
  const printed = blocksFromMarkdown(readMarkdownItems(envelope.markdown, envelope.name)).blocks;
  const full = [EFFECT, ...PARAGRAPHS].join(' ');
  if (
    printed.length !== 1 ||
    printed[0]!.kind !== 'section' ||
    printed[0]!.label !== 'Effect' ||
    normalize(printed[0]!.text) !== full
  )
    return undefined;
  return {
    spec: {
      effect: 'mark',
      subject: 'target',
      duration: { kind: 'encounter' },
      endsWhen: ['owner-dying', 'reused', 'willingly-ended'],
      exclusive: 'one-tactician',
      retarget: { actionType: 'free triggered action', distance: normalize(envelope.distance) },
      edge: { edges: 1, scope: 'power-roll', rollers: 'owner-and-allies' },
      benefit: {
        actionType: 'free triggered action',
        cost: { resource: 'focus', amount: 1 },
        trigger: 'rolled-damage',
        options: MARK_BENEFITS.map(benefit => benefit.kind),
        perTrigger: 1,
      },
      text: full,
    },
    paragraphs: [...PARAGRAPHS],
  };
}

/** Two specs read from the same printed text are the same, field by field (tamper check). */
export function sameMarkSpec(a: MarkSpec, b: MarkSpec): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---------------------------------------------------------------------------------------------
// Who marks and who rolls. rule/combat/side.md: the heroes and their allies are one side.

export interface MarkParty {
  id: string;
  side: 'heroes' | 'director';
}

/** "you and allies" / "you or any ally": the owner, or a creature on the owner's side. */
export function ownerOrAlly(owner: MarkParty, creature: MarkParty): boolean {
  return creature.id === owner.id || creature.side === owner.side;
}

/**
 * The label of the Mark edge on a roll. Both printed line-of-effect conditions are the table's to
 * confirm (there is no map); either failing is the table's `exclude` (design section 5).
 */
export function markEdgeConditions(ownerName: string, subjectName: string): string {
  return `only while ${subjectName} is within ${ownerName}'s line of effect and the roller is within ${ownerName}'s line of effect (mark.md); exclude it if either fails`;
}

/** The sheet line of a mark (mark.md), for the active-effects lists. */
export function describeMark(ownerName: string, subjectName: string): string {
  return `${subjectName} is marked by ${ownerName}: ${ownerName} and allies gain an edge on power rolls against it (${markEdgeConditions(ownerName, subjectName)}); rolled damage to it offers ${ownerName} a Mark benefit for 1 focus; at 0 Stamina, ${ownerName} can mark a new target`;
}

// ---------------------------------------------------------------------------------------------
// Benefits.

/** What the damage that set off a benefit trigger was, as the damage writer saw it. */
export interface MarkTriggerFacts {
  /** The creature dealing the damage is the mark's owner ("If you damage …"). */
  dealerIsOwner: boolean;
  /** The ability is a melee ability: the Melee keyword, used in melee (rule/combat/melee.md). */
  meleeAbility: boolean;
}

/**
 * The benefits a trigger offers. The taunt benefit is printed "If you damage a creature marked by
 * you with a melee ability", so it is offered only for the owner's own melee ability; the others
 * are offered for every trigger.
 */
export function markBenefitOptions(facts: MarkTriggerFacts): MarkBenefitKind[] {
  return MARK_BENEFITS.map(b => b.kind).filter(
    kind => kind !== 'taunt' || (facts.dealerIsOwner && facts.meleeAbility),
  );
}

/** A chosen benefit, planned. `apply` work changes state; `instruction` is the table's. */
export type MarkBenefitPlan =
  | { kind: 'extra-damage'; status: 'apply'; amount: number }
  | { kind: 'recovery'; status: 'apply' }
  | { kind: MarkBenefitKind; status: 'instruction'; text: string };

/**
 * Plans one benefit (mark.md). `reason` is the owner's Reason score ("your Reason score").
 * - Extra damage "equal to twice your Reason score" is applied only when adding it separately gives
 *   the same result as adding it to the ability's damage: the marked creature has no damage
 *   immunity or weakness (rule/damage/damage-immunity.md and damage-weakness.md apply per damage, so
 *   a separate application would count them twice) or, since V178, the caller sized the extra
 *   against the hit's saved weakness and immunity (`immunityOrWeakness` false; shared/resolve/
 *   damageModifiers.ts `extraDamageAfterModifiers`), it is a creature the engine writes damage to,
 *   and Reason is at least 1 (twice a lower score is not damage the source establishes; labelled,
 *   as V171's bindWatcher). Otherwise the table adds it.
 * - The Recovery is spent by "the creature dealing the damage" (rule/health/recoveries.md), so it
 *   applies to a hero dealer with a live record; otherwise the table resolves it. Interpretation
 *   (Q-MARK-1 point 4): accepting the benefit is the table's confirmation that the dealer spends it;
 *   the alternative is a second card for the dealer.
 * - The shift is movement (no map) and the taunt "until the end of their next turn" stays table
 *   work as the other taunt riders do (V109): both are instructions.
 */
export function planMarkBenefit(
  benefit: MarkBenefitKind,
  facts: {
    reason: number | undefined;
    target: { damageable: boolean; immunityOrWeakness: boolean; name: string };
    dealer: { hero: boolean; name: string };
    ownerName: string;
  },
): MarkBenefitPlan {
  const text = MARK_BENEFITS.find(b => b.kind === benefit)!.text;
  const twice = facts.reason !== undefined ? facts.reason * 2 : undefined;
  switch (benefit) {
    case 'extra-damage':
      if (
        facts.reason !== undefined &&
        facts.reason >= 1 &&
        facts.target.damageable &&
        !facts.target.immunityOrWeakness
      )
        return { kind: benefit, status: 'apply', amount: twice! };
      return {
        kind: benefit,
        status: 'instruction',
        text: `${text} Add ${twice !== undefined ? `${twice} ` : ''}extra damage to ${facts.target.name}'s damage at the table${!facts.target.damageable ? '' : facts.target.immunityOrWeakness ? ' (it has a damage immunity or weakness, which applies to the ability’s damage as a whole)' : ' (Reason below 1)'}.`,
      };
    case 'recovery':
      if (facts.dealer.hero) return { kind: benefit, status: 'apply' };
      return {
        kind: benefit,
        status: 'instruction',
        text: `${text} ${facts.dealer.name} spends it at the table.`,
      };
    case 'shift':
      return {
        kind: benefit,
        status: 'instruction',
        text: `${text} ${facts.dealer.name} can shift up to ${facts.reason ?? 'Reason'} squares (${facts.ownerName}'s Reason); the table moves them (no map).`,
      };
    case 'taunt':
      return {
        kind: benefit,
        status: 'instruction',
        text: `${text} ${facts.target.name} is taunted by ${facts.ownerName} until the end of their next turn; the table applies it.`,
      };
  }
}

/**
 * "You can't gain more than one benefit from the same trigger." A trigger is one damage write the
 * engine observed: the log entry that dealt the rolled damage.
 */
export function benefitTaken(
  benefits: readonly { triggeringEventId: string }[] | undefined,
  triggeringEventId: string,
): boolean {
  return (benefits ?? []).some(b => b.triggeringEventId === triggeringEventId);
}

// ---------------------------------------------------------------------------------------------
// Other mark sources (levels 1–3) that stay manual, each with the precise missing piece.

/**
 * Why a printed mark clause outside the Mark stays manual. Matched against a manual section's text
 * (display markup removed); each names the source and what the engine lacks.
 */
const MARK_MANUAL: readonly { pattern: RegExp; reason: string }[] = [
  // feature/ability/tactician/level-1/mind-game.md "You mark the target."; level-2/fog-of-war.md and
  // targets-of-opportunity.md "Each target is marked by you, and …".
  {
    pattern: /^(Effect: )?(You mark the target\.|Each target is marked by you, and )/,
    reason:
      'a mark made by an ability other than Mark: its duration, and whether using Mark again ends it, are not printed (Q-MARK-1), so the engine does not store it',
  },
  // mind-game.md: "Before the start of your next turn, the first time any ally deals damage to any
  // target marked by you, that ally can spend a Recovery."
  {
    pattern:
      /^Before the start of your next turn, the first time any ally deals damage to any target marked by you, that ally can spend a Recovery\.$/,
    reason:
      'it watches Mind Game’s own mark (Q-MARK-1), and "the first time … before the start of your next turn" is a once-only limit the V171 watcher limits (turn, round, each) do not have',
  },
  // fog-of-war.md and targets-of-opportunity.md, "Mark Benefit:" sections.
  {
    pattern:
      /Mark Benefit: Until the end of the encounter, whenever you or any ally makes a strike against a creature marked by you, you can spend 2 focus to /,
    reason:
      'a paid response to a strike against a marked creature, before its outcome: adding a target changes a strike the engine already resolved, and the forced free strike is the marked creature’s own use; the marks themselves are Q-MARK-1',
  },
  // level-3/rout.md.
  {
    pattern:
      /whenever you or any ally deals damage to a target marked by you who has R < AVERAGE, the target is frightened of the creature who dealt the damage \(save ends\)/,
    reason:
      'frightened of the creature who dealt the damage, gated by the owner’s Reason potency: a watcher condition response with a potency check and a source other than the owner is not built',
  },
  // level-3/frontal-assault.md.
  {
    pattern:
      /the first time on a turn that you or any ally deals damage to a target marked by you, the creature who dealt the damage can push the target up to 2 squares and then shift up to 2 squares\. Additionally, any ally using the Charge main action/,
    reason:
      'the push and shift are movement (no map), and the Charge substitution is a permission at a later use tied to the first sentence’s duration, which the effect-only reader can’t bind to a sentence of its own',
  },
];

/** The precise reason a manual section about marks stays manual, or `undefined`. */
export function markManualReason(text: string): string | undefined {
  const clause = normalize(text);
  return MARK_MANUAL.find(entry => entry.pattern.test(clause))?.reason;
}

// ---------------------------------------------------------------------------------------------
// Visibility.

/**
 * Whether players see marks on creatures (foes included). Pending the user's answer to the product
 * question in docs/lasting-effects-design.md ("can players see marks on foes? Recommended: yes";
 * Q-MARK-2), marks are table knowledge. This is the one place the decision lives, and it gates
 * exactly two projections: the roster's foe effects (convex/table.ts) and effect.list. It does not
 * gate the game log text of the Mark use and its linked entries, the Mark cards and their
 * `trigger.offered` lines, or hero sheets (shown only to the hero's player and the Director);
 * a "no" would need per-audience log text for those.
 */
export const MARKS_VISIBLE_TO_PLAYERS = true;

/** Whether a reader in `role` sees an effect instance of `kind`. */
export function effectVisibleTo(kind: string, role: 'director' | 'player' | 'observer'): boolean {
  return kind !== 'mark' || role === 'director' || MARKS_VISIBLE_TO_PLAYERS;
}
