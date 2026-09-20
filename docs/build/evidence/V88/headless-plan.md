# V88 public headless proof plan

`scripts/v88-headless.ts` is opt-in and is executed only by TESTER. This plan is not a
passing result. The runner creates disposable real BetterAuth accounts, a campaign,
publicly authored/approved heroes and publicly loaded foes; gameplay uses the registered
`scripts/app.ts command` route. No gameplay rows or dice-stream state are imported.
Records and source hashes are retained in a unique `v88-headless-<run UUID>.json` file,
including sanitized failure stages. Session tokens and passwords are never recorded.
Sign-in sessions are closed in `finally`; campaign data is retained.

## Target and invocation

Use the frozen V88 candidate from `.worktrees/engine-potency`, `slice/V88`. Supply the
exact 40-character source commit as `SALIENT_V88_EXPECTED_COMMIT`. The runner also checks
that the application content matches the committed manifest. TESTER must verify the
actual backend source correspondence before invoking it; the local Git check verifies
runner source, not an independently hosted backend's source.

Both permitted targets require an anonymous development deployment in `.env.local`;
production, hosted, and injected deployment/admin credentials are refused. Supply explicit
`DEV_WEB_URL`, `VITE_SITE_URL` (same URL), `VITE_CONVEX_URL`, and
`VITE_CONVEX_SITE_URL`. The frontend URL must equal `SALIENT_V88_EXPECTED_URL`.

- Local: frontend/backend/site endpoints must be loopback; run from the exact worktree.
- CT114: use named `engine-potency`; the frontend must match
  `https://salient-engine-potency-dev-<environment hash>.tail41404c.ts.net` and backend/site
  use HTTP hostname `backend`. Mount the coordinator's actual `/runtime-source.json`
  snapshot with the engine-potency checkout, commit, dirty flag and checkout identity.
  The runner starts no services and makes no deployment calls.

With those explicit environment values configured by TESTER:

```sh
SALIENT_V88_HEADLESS=1 \
SALIENT_V88_EXPECTED_URL="$DEV_WEB_URL" \
SALIENT_V88_EXPECTED_COMMIT="<exact tested source commit>" \
SALIENT_V88_ARTIFACT_DIR="<unique coordinator artifact directory>" \
node scripts/v88-headless.ts
```

Do not run this command independently of the testing queue. Use coordinator-selected
local or CT114 capacity; no browser, production, shared data reset or environment revival.

## Source-derived fixtures and expected outcomes

Pin: `fb83a789da8f0327a389c277a0c790b1648d5810`. The runner imports no resolver/compiler
and computes expected tier/damage from printed constants, accepted dice, the documented
edge/bane rule and the confirmed natural 19/20 override.

| Fixture | Public selection and checked fact | Expected |
| --- | --- | --- |
| H, Devil Fury | Existing complete Fury example, I 0/R 1/P 0 array; M 2; Impressive Horns retained | Bury always resisted; Eye applies at tier 2 or 3; saving throw succeeds on 5+ from the evaluated trait |
| E, Polder Elementalist | Existing V25 Bethell selections, legal 2/1/0/0 array assigned M 0/A 1/I 2/P 0 | Bury applies at tier 2 or 3; Eye always resisted; save 6+ |
| W, Wode Elf Fury | Fury fixture with ancestry choices replaced by The Wode Defends + Forest Walk | Fury named M potency 2 produces 0/1/2 thresholds; M roll and damage choice 2; save 6+ |
| Goblin Warrior | Public `foes.definitions` + `foes.add`; Director `foes.detail` asserts A 2 | Always resists Wode potency up to 2 |
| Goblin Cursespitter | Existing seeded loader row | Eye costs no Malice; printed damage 3/4/5, I thresholds 0/1/2 |
| Dwarf Warden | Existing seeded loader row; Director `foes.detail` asserts A 0 | Wode applies at tier 2 or 3; foe save 6+ |

Every use supplies two edges, ensuring at least tier 2 with actual campaign dice. The
fixture records those explicit adjudicated modifiers; it does not infer a fictional
spatial source. Printed Bury damage is 5/6/7 with Malice cost 2 and M thresholds 0/1/2.
Wode damage is 2/3/5 plus chosen M 2; its Magic attack receives no melee Weapon kit bonus.
Tier 3 Wode imposes restrained; tier 2 imposes slowed. Scores and choices are asserted
against real evaluated baselines and seeded source readback before use.

## Live witnesses

- BP6 resisted and BP7 applied: tier/damage/cost, source occurrence, live instance,
  existing toggle, registration link, source log, refused manual disposition and roster
  unchanged by refusal. Director/controller see hero score; unrelated observer does not.
- BP9: one correction to two banes reuses the original accepted dice. Expected tier and
  applied/resisted status are asserted. The record states whether that natural roll
  permits a flip; no repeats are made to force one. Rewind restores the original compiled
  result exactly. Deterministic complete flip coverage belongs to the persisted suite.
- BP8/BP10: actual end-turn save, evaluated threshold and provenance, registration/work
  link, one d10, correct success/failure state and named manual hero-token follow-up;
  correction refuses with the explicit already-rolled-save reason and unchanged state.
  Rewind restores the exact roster, redo restores the recorded outcome and identical die
  without another save event, then a rewind exposes the active instance for manual off.
- Eye resisted against I 2 and applied against I 0. A manual weakened toggle is set before
  the latter instance; it remains on after its save regardless of the roll, including a
  success. This also proves the retained Impressive Horns 5+ threshold live. The random
  roll determines which save branch is witnessed; deterministic tests prove both.
- WD1 resisted against Goblin A 2 and WD2 applied against Dwarf A 0. Symbolic threshold
  origin and named potency M are exposed. Foe target scores appear for the Director only,
  never for the acting controller or observer. The foe's public end-turn route rolls a
  save, then the same exact history restoration/manual-off checks apply.

Direct queue-table reads are intentionally unnecessary: an active hero instance's
registration ID is checked against the emitted saving-throw event, which names its work,
creature and occurrence. Foe public projections expose source instances and the actual
clock event proves scheduling. Persisted tests inspect registration retirement directly.

RAY1, unequal hero characteristic/roll-choice WD3, both deterministic save branches,
outside-encounter timing and all grammar counterexamples remain pure/persisted test
coverage. Existing V72 regressions are separate TESTER jobs. This runner does not claim
those checks from its live results.
