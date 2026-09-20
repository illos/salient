# V88 seeded-inventory public proof addendum

This is an execution plan, not a passing result. TESTER owns all execution. Source is
`.worktrees/engine-potency-seeded`, branch `slice/V88-seeded-inventory`, based on `c721d0b`
with the V87 1151-row content snapshot. Record the final frozen candidate commit.

The existing `scripts/v88-headless.ts` cases and assertions remain intact and run first
with ordinary, unpositioned campaign randomness. The addendum follows them and proves the
four newly reachable compiled abilities. The runner now admits only the seeded worktree;
its anonymous local or named CT114 engine-potency/engine-potency-seeded target is still
explicitly checked against `SALIENT_V88_EXPECTED_URL` and `SALIENT_V88_EXPECTED_COMMIT`.
The coordinator must independently verify deployed backend bytes against that source.

## Real public setup and concrete evaluated targets

The original H/E/W builds are unchanged. Two additional heroes are created, saved,
submitted and approved through the same public character API before the encounter:

- N: V25 Elementalist selections, legal `2, 1, 0, 0` array assigned Might 0, Agility 0,
  Intuition 2 and Presence 1. Polder traits stay intact. N applies Bola's A potency and
  Razor Claws' M potency. Neither ability deals corruption damage, so the retained
  Polder immunity is irrelevant.
- P: original Devil Fury choices, legal `2, −1, −1` array assigned Presence 2,
  Intuition −1 and Reason −1. Fixed Might/Agility remain 2. P resists Eye Flash's tier-2
  `P < 2` and Power Chord's tier-3 `P < 2` at equality.
- Original H: Might 2, Agility 2 and Presence 0. H resists Bola/Ghoul at equality and
  receives Eye Flash/Power Chord. Impressive Horns remains granted: H's actual save
  threshold is 5, asserted through its evaluated baseline and logged save provenance.

All target scores are checked against the actual saved evaluation. Actors are loaded
from public `foes.definitions`/`foes.add`: Lizardfolk Bloodeye, Hobgoblin Redglare,
Orc Godcaller and Ghoul. The Director action sheet proves the named source-bearing
ability is available without a cost. Full source/action readbacks are retained; other
parent traits/actions are not declared automated by these cases.

## Pinned arithmetic and cases

Pin `fb83a789da8f0327a389c277a0c790b1648d5810`; paths below are relative to the pinned
`en/unified/md/` source root. Values were read from the four stat blocks before authoring.

| Ability/source | Accepted attack faces and modifiers | Expected live coverage |
| --- | --- | --- |
| Bola Knock, `monster/lizardfolk/statblock/lizardfolk-bloodeye.md` | +2, 6+6 no modifiers; 8+8 no modifiers | BK1: tier 2, 7 damage, N A0 < 1 restrained. BK2: tier 3, 9 damage, H A2 < 2 resists. BK3: same 6+6, two banes → tier 1, 5 damage and A0 < 0 resists; restore tier 2. BK4: actual source-linked save. |
| Eye Flash, `monster/hobgoblin/statblock/hobgoblin-redglare.md` | +3, 6+6 no modifiers | EF1: tier 2, 14 corruption, H P0 < 2 restrained. EF2: tier 2, 14 corruption, P P2 < 2 resists. EF3: same 6+6, two banes → tier 1, 9 corruption/slowed; two edges → tier 3, 17 corruption/restrained, obsolete source condition removed. EF4: actual source-linked save. |
| Power Chord, `monster/orc/statblock/orc-godcaller.md` | +2, 6+6 two edges; 8+8 no modifiers | PC1: tier 3, 9 sonic, H P0 < 2 weakened. PC2: tier 3, 9 sonic, P P2 < 2 resists. PC3: same 6+6, two banes → tier 1 damage 5 with no condition; no modifiers → tier 2 damage 7 with no condition; two edges restores tier 3. PC4: actual save. PC5: separate tier-2 public use confirms no condition. |
| Razor Claws, `monster/undead/1st-echelon/statblock/ghoul.md` | +2, 6+6 two edges; 8+8 no modifiers | RC1: tier 3, 5 damage, N M0 < 2 bleeding. RC2: tier 3, 5 damage, H M2 < 2 resists. RC3: same 6+6, two banes → tier 1 damage 3 with no condition; no modifiers → tier 2 damage 4 with no condition; two edges restores tier 3. RC4: actual save. RC5: separate tier-2 public use confirms no condition. |

Each use checks actual accepted dice, pinned damage, persisted Stamina from the disclosed
50-Stamina starting adjustment, unchanged Malice, condition source/identity/duration,
registration link, live toggle, refusal of manual disposition and public score audiences.
The Director and hero controller see the target score; the unrelated member does not.
Existing WD1/WD2 still prove foe-score Director-only behavior. Each correction preserves
accepted dice, reconciles damage once and clears the obsolete source condition.

The existing save/history helper runs for all four applied cases after their corrections:
one actual campaign d10, evaluated hero save threshold, instance/toggle outcome, explicit
post-save correction refusal, rewind/redo without a new save event or die, and manual off
with source logging. No actor trait consequence is inferred or executed by this proof.

## Disclosed dice positioning and coordinator procedure

Tier-specific added cases require deterministic positions without rerolling until a desired
tier appears. `scripts/v88-seeded-dice-import.mjs` narrowly adapts the existing V72 helper.
It runs against an **already running exclusively reserved anonymous target**, and starts no
stack. It accepts at most 12 requests during 20 minutes (10 expected for this runner),
locks its artifact directory, binds requests to the first disposable campaign and checks
the exact source/target again on every request. It reads a bounded complete `diceStates`
snapshot, changes only that campaign's seed/counter, imports it, then proves unrelated
rows including identities/counters are unchanged. It refuses incomplete snapshots.
No outcome, event, condition, character or foe rows are fabricated/imported. Every actual
attack/save still uses the authenticated registered operation and shared campaign roller.

TESTER configures both processes with:

- `SALIENT_V88_HEADLESS=1`
- `SALIENT_V88_EXPECTED_COMMIT=<frozen candidate commit>`
- `SALIENT_V88_EXPECTED_URL=<explicit local or named CT114 frontend>`
- `DEV_WEB_URL` and `VITE_SITE_URL` equal that expected URL
- Existing anonymous backend `VITE_CONVEX_URL` / site `VITE_CONVEX_SITE_URL`
- `SALIENT_V88_DICE_DIR=<one shared isolated artifact directory>`
- `SALIENT_V88_ARTIFACT_DIR=<unique runner artifact directory>`

For local execution, both processes run from the exact seeded worktree with loopback URLs;
the helper verifies the anonymous deployment's configured cloud/site ports. For CT114,
the helper runs via qualified `docker exec` in the existing backend container (`/app`,
`/tmp/backend-ready`, matching `/runtime-source.json`); backend/site URLs use hostname
`backend` with the configured ports. The runner executes in the matching build context
and sees the same dice artifact directory. Do not use `presidium-dev run backend` to
start another backend or silently modify a shared deployment.

Start the helper (`node scripts/v88-seeded-dice-import.mjs`), wait for its `ready.json`,
then execute `node scripts/v88-headless.ts` with the same guarded configuration. The runner
writes requests only in the added-case section, after the ordinary V88 proof. Request IDs,
chosen faces, reproducible seeds and preservation results are included in readback. The
runner signals `done` on completion/failure after attaching to the helper. If it fails
before that section, TESTER stops the helper and verifies exit; the helper has its own
bounded deadline. Preserve every failed/passing artifact and retain disposable play data.
No browser, production route, new grant/loader mechanism or independent stack is involved.
