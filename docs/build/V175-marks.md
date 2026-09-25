# V175: Marks (Tactician Mark lifecycle and benefits)

Rules review: required. Depends on: V174 (stacked on `slice/V174` `52246cfe`, itself on V173, V172,
V171, V170 and V159, none merged yet).

## Goal

The Tactician's Mark works as printed. A use stores a `mark` effect instance on the target with the
printed lifecycle. The Mark edge is an automatic contribution to power rolls against the marked
creature, and the table can exclude it. Rolled damage to the marked creature offers the owner a
free-triggered benefit card, and reducing it to 0 Stamina offers a card to mark a new target. This is
the first half of item 6 of the
[lasting effects design](../lasting-effects-design.md#8-delivery-plan). It is built on V158 effect
instances, V159 modifiers, V171 watchers and V173 cards. Judgments and auras are out of scope. Censor
Judgment keeps its manual path, because the design does not assume it shares the Mark's rules.

## Scope

- **Grammar** (`shared/resolve/marks.ts`, `shared/resolve/compileAbility.ts`):
  - `readMarkAbility` reads the Mark whole. The structured Effect section must be the printed first
    paragraph, and the printed Effect block must be exactly the printed paragraphs of
    `feature/ability/tactician/level-1/mark.md`, in order. It must also be a Maneuver with the target
    One creature.
  - The result is a `mark` section node with a `MarkSpec`:
    - `duration`, and `endsWhen: owner-dying, reused, willingly-ended`;
    - `exclusive: one-tactician`;
    - the retarget, as a free triggered action within the printed distance;
    - the edge, one edge on power rolls for the owner and allies;
    - the benefit: a free triggered action for 1 focus on rolled damage, four options, one per
      trigger.
  - The compiler counts those paragraphs as the node's, so they are not unaccounted.
    `resolveEffectOnly` reads the node again and refuses a tampered spec.
  - Other mark sources at levels 1–3 stay manual. Each gets a precise `mark-manual` diagnostic
    (`markManualReason`).
- **Storage and lifecycle** (`convex/lib/marks.ts` `applyMark`, in `ability.use`):
  - A mark is an effect instance of kind `mark` (payload `{ kind: 'mark', mark: { retargetDistance }
    }`), held by the marked hero or foe, with the owner's pointer.
  - "until the end of the encounter": combat-end expiry, as for V158 instances.
  - "until you are dying": V158 `owner-dying`, found by the damage writer.
  - "until you use this ability again": V158 `reused`, run before the new use stores its mark.
  - "You can willingly end your mark … (no action required)": the registered `effect.end`, which
    records no action use.
  - "if another tactician marks a creature, your mark on that creature ends": `applyMark` ends every
    other owner's active mark on the subject first, with a linked `effect.ended`. This source
    exception to "Stacking Unique Effects" is written out, not left to the generic stacking boundary.
  - A squad member or an object holds no mark the engine tracks, so that outcome is `manual`.
- **Edge** (`shared/resolve/modifiers.ts` `markEdge`): "While a creature marked by you is within your
  line of effect, you and allies within your line of effect gain an edge on power rolls made against
  that creature."
  - `rollContributions` takes the roller's side (`rule/combat/side.md`) and adds one `target`
    contribution against a marked creature for the owner or an ally. It counts once, whichever marks
    exist, and tests get none.
  - The label names both line-of-effect conditions. `exclude=[markId]` records the contribution as
    excluded and applies nothing (design section 2).
- **Benefit card** (`observeMarks` in the damage writer's `observeDamage`; `mark.benefit` in
  `convex/lib/markOperations.ts`):
  - The trigger: rolled damage (`rule/damage/rolled-damage.md`; the rolled path of `ability.use` and
    its corrections pass `rolled`) from the owner or an ally to a marked creature.
  - The owner is offered a `mark-offer` card. It shares V173's windows (next turn start, early close,
    closeout) and eligibility (dazed, surprised, dead; free triggered actions don't count against
    the round). A card opened by the same use is not closed as an earlier offer.
  - The taunt is offered only for the owner's own melee ability ("If you damage … with a melee
    ability"). Accepting re-checks the round, eligibility, that the mark is active, the 1 focus and
    "You can't gain more than one benefit from the same trigger" (`markBenefits` on the instance).
  - The benefits:
    - **Extra damage** of twice the owner's Reason is applied to a foe outside a squad with no damage
      immunity or weakness, since they apply to the ability's damage as a whole
      (`rule/damage/damage-immunity.md`). It goes through the damage writer as `partOfHit`, so it
      changes Stamina, winded and 0 Stamina but is not a second damage event (no damage-taken
      watchers, cards or benefit). Otherwise the table adds it.
    - **Recovery**: a hero dealer spends one (`rule/health/recoveries.md`, capped at the maximum).
    - **Shift** and **taunt** are table instructions (no map; taunt riders stay table work as in
      V109).
  - Every write is in the accepting operation's journal, so undo restores the focus, the damage, the
    benefit record and the card.
- **Retarget card** (`mark.retarget`): Stamina going from above 0 to 0 or lower offers the owner a
  card naming the encounter's other creatures. Accepting it with `targets=[…]` is a free triggered
  action that marks the new target with the Mark's lifecycle and ends the owner's earlier Mark marks
  (Q-MARK-1, point 2).
- **Watchers** (`shared/resolve/watchers.ts`, `convex/lib/watchers.ts`): a new `marked-damaged`
  event (the owner or an ally deals damage to a creature the owner marked) and a `dealer` response
  recipient.
  - Hit 'Em Hard! gives the dealer 2 surges.
  - Stay Strong and Focus! leaves the dealer's Recovery to the table.
  - V174 revisions treat those firings as undone damage and refuse.
- **Visibility**: `MARKS_VISIBLE_TO_PLAYERS` (`shared/resolve/marks.ts`) is the one place deciding
  whether players see marks. It gates exactly the roster's foe projection and `effect.list`. It
  does not gate the game log text of the Mark use and its linked entries, the Mark cards and their
  `trigger.offered` lines, or hero sheets (shown only to the hero's player and the Director). It is
  set to the design's recommendation (yes), pending the user's answer (Q-MARK-2).
- **UI (minimal)**:
  - The foe and hero active-effects lists show a "Mark: …" line.
  - `web/table/trigger-offers.tsx` shows mark cards with one button per benefit or per candidate.
  - The ability card labels a mark outcome.

Spec: `docs/lasting-effects-design.md#5-marks-and-similar-statuses`,
`docs/lasting-effects-design.md#4-triggered-actions-and-reactions`,
`docs/lasting-effects-design.md#2-modifier-pipeline`.
Rules questions: [Q-MARK-1](../rules-questions-for-user.md#q-mark-1-marks-from-abilities-other-than-mark-the-retarget-and-reduced-to-0-stamina-v175),
[Q-MARK-2](../rules-questions-for-user.md#q-mark-2-can-players-see-marks-on-foes-v175-product).

## Acceptance checks

1. `tests/scripts/marks.test.ts`:
   - Mark compiles with the printed spec. A changed paragraph or a tampered spec is manual. Squad,
     object and self targets are refused or left manual.
   - The edge goes to the owner and an ally, not to the other side or a test. Excluding it applies
     nothing, and two marks still give one edge.
   - Benefit options, one per trigger, and each plan (twice Reason 2 is 4).
   - Hit 'Em Hard! and Stay Strong and Focus! compile as `marked-damaged` watchers.
   - The other sources have precise `mark-manual` reasons.
   - The visibility rule.
2. `tests/app/marks.test.ts` (convex-test, `transactionLimits: true`, registered operations,
   persisted readback). The level-3 Mastermind is `v94-tactician-2` (Reason 2, Hit 'Em Hard!), the
   Rival is `v94-tactician-1`, and Thorn the fixture Fury.
   - Mark is stored on the goblin with the printed lifecycle and the owner's pointer, and is visible
     in the player's roster.
   - Thorn's Brutal Slam gets the edge: 11 + 2 = 13, tier 2, 8 damage. With `exclude` it is 11, tier
     1, 5 damage, and the contribution is recorded as excluded.
   - Rolled damage opens the benefit card, without the taunt for an ally. Extra damage takes 10 → 6
     and focus 2 → 1. A second benefit from the same trigger is refused. Undo restores all of it.
     The Director answers the other card with Thorn's Recovery.
   - A kill offers the retarget. Accepting it marks goblin 2 and ends the first mark.
   - The Rival's Mark ends the Planner's, and undo restores it.
   - `effect.end` uses no action.
   - The Rival going 1 → −3 ends their mark ("Rival is dying"), and combat end expires the last one.
   - Hit 'Em Hard! gives Thorn 2 surges for damage to the marked goblin and none for the unmarked
     one. The Planner's own melee free strike offers the taunt. The focus is checked again on accept
     and the card stays open.
3. Both reports: `node scripts/report-live-compiled-abilities.ts --check` matches, and the V64 audit
   regenerates unchanged.
4. TESTER: `pnpm check` and the `tactician-level-three` journey (assertions updated, not run here).
5. Independent review, then QC1.

## Work log

- 2026-09-25: `slice/V175` in `.worktrees/marks`, stacked on `slice/V174` `52246cfe`.
  Implementation commit: `8836ace3`, rebased by the coordinator onto V174 `aa2b1584` (QC1 train
  13) as `56c43e49` (implementation) and `2219197f` (docs), pushed.
- Flipped to fully compiled (all without a power roll):
  - **Mark** (`feature/ability/tactician/level-1/mark.md`).
  - **Hit 'Em Hard!** (`feature/ability/tactician/level-3/hit-em-hard.md`).
  - **Stay Strong and Focus!** (`feature/ability/tactician/level-3/stay-strong-and-focus.md`).
  - The live report goes from 168 to **171** reachable compiled (without a power roll 17 → 20).
    Compatibility goes from 1453 to 1450. No foe ability changes. The V64 audit regenerates
    unchanged.
- Read in the Compendium and kept manual, each with a `mark-manual` diagnostic:
  - **Mind Game** (`level-1/mind-game.md`): "You mark the target." prints no duration (Q-MARK-1).
    Its Recovery watcher's "the first time … before the start of your next turn" is a once-only limit
    V171 lacks.
  - **Fog of War** and **Targets of Opportunity** (`level-2`): their marks are Q-MARK-1. Their "Mark
    Benefit" is a paid response to a strike before its outcome: an extra target changes a resolved
    strike, and the forced free strike is the marked creature's own use.
  - **Rout** (`level-3/rout.md`): "frightened of the creature who dealt the damage", gated by
    `R < AVERAGE`, needs a watcher condition with a potency check and a source other than the owner.
  - **Frontal Assault** (`level-3/frontal-assault.md`): the push and shift are movement, and the
    Charge substitution is a permission tied to the first sentence's duration.
  - **Judgment** (Censor) is not read as a mark.
- Journeys and tests checked for the flipped names:
  - `scripts/headless/tactician-level-three.ts`: Hit 'Em Hard! and Stay Strong and Focus! are now
    `ability.use` with a `marked-damaged` watcher on the Tactician. Updated, not run.
  - `scripts/headless/tactician.ts` uses only the by-hand "Mark: Trigger" and "Mark: Retarget"
    labels, which stay as the manual fallback. Their sheet notes now point to the cards. No journey
    uses Mark itself.
  - `tests/scripts/live-compiled-report.test.ts` lists the three and counts 20 without a power roll.
  - The `ability.use` syntax is unchanged; the new operations are `mark.benefit` and
    `mark.retarget`.
- Decisions:
  - Q-MARK-1 records a question and three labelled interpretations:
    - the duration of marks from other abilities (open; those abilities stay manual);
    - the retarget as a use of Mark;
    - "reduced to 0 Stamina" including below 0;
    - accepting the Recovery benefit as the dealer's confirmation.
  - Q-MARK-2 records the product question on visibility.
  - Offers are made only in combat, as for V173 (Q-TRIG-1 point 3).
- Known limits:
  - A correction of rolled damage to a marked creature from the owner's side is refused ("rewind to
    the use"), as V173 does for triggered actions.
  - A V174 revision of a hit on a marked hero doesn't revise that hit's mark cards (fixed after
    QC1 train 16 R2, below).
  - The Focus gain for damaging a marked creature (`feature/tactician/level-1/focus.md`) is still a
    V120 table claim. The mark observation could automate it next.
  - Mark cards on a squad minion don't exist, because the mark is table work.
- Authoring checks run (worktree):
  - `pnpm -s lint`: pass.
  - `pnpm -s tsc --noEmit` and `pnpm -s tsc -p tsconfig.web.json --noEmit`: pass.
  - `node scripts/report-live-compiled-abilities.ts --check`: matches. `node
    scripts/audit-ability-grammar.ts`: regenerated, no diff.
  - `vitest run --maxWorkers=2`, all passed:
    - `tests/scripts`: marks, live-compiled-report, watchers, triggered-actions, effect-only,
      compiled-ability, modifiers, audit-ability-grammar, damage-reactions.
    - `tests/app`: marks, triggered-actions, damage-reactions, watchers, modifiers,
      effect-instances, party-read-limit, abilities, tactician-character, heroic-resource-tactician,
      effect-only.
- Review (changes required, 2026-09-25), fixed on top of `2219197f`:
  1. **Order of a trigger's cards.** When the retarget card was accepted first, it ended the old
     mark, and the same trigger's benefit card was then refused. The trigger happened while the
     creature was marked, so `mark.benefit` now also accepts a mark ended by a `mark.retarget` that
     answered a card of the same triggering event.
  2. **Dying owner** (QC1 train 13 `endedAtApplication`). A Mark used by a Tactician who is already
     dying is stored ended as it is applied. It ends no other Tactician's mark (Q-MARK-1 point 5).
     Its `effect.applied` entry says it ends as it is applied, worded as the modifier and watcher
     paths word it.
  3. Q-MARK-1 labels two more interpretations: Hit 'Em Hard!'s "that creature" is the dealer
     (point 6), and the extra damage goes only to the marked creature (point 7).
  4. **Visibility scope.** The constant's comment, this document and Q-MARK-2 now say exactly what
     `MARKS_VISIBLE_TO_PLAYERS` gates: the foe roster and `effect.list`. The log, the cards and hero
     sheets are not gated.
  5. `effect.end` on a mark: only the owner's player or the Director ("You can willingly end your
     mark"). The marked hero's player is refused.
  6. The extra damage is written through `writePlannedDamage`. A linked `mark.extra-damage` entry
     takes its Stamina figures from what the write returns.
  - Tests added to `tests/app/marks.test.ts`:
    - retarget first, then the benefit;
    - a dying Tactician's Mark;
    - who may end a mark;
    - the extra-damage entry's figures.
- QC1 train 16 R2 (the project's `review-artifacts/2026-09-25-train16-QC1.md`): a V174 revision now
  reconciles this hit's Mark cards on the revised hero (`convex/lib/damageRevisions.ts`
  `markCardInvalid`). mark.md: "When a creature marked by you is reduced to 0 Stamina" (for a hero,
  the crossing to 0 or lower) and "whenever you or any ally uses an ability to deal rolled damage to
  a creature marked by you". An open retarget whose 0 crossing the revision removes, or an open
  benefit whose damage the revision takes to 0, closes in the revision's journal, so undo reopens
  it. One already accepted refuses the revision (rewind to the hit), with the card left open. The
  check compares the recorded hit and its revision, not current Stamina. Tests in
  `tests/app/damage-reactions.test.ts`: the revision closes the retarget and undo reopens it; an
  accepted retarget refuses the revision; a revision to 0 damage closes the benefit.
