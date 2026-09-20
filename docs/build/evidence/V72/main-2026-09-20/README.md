# V72 shared-main live proof — 2026-09-20

**Result: PASS.** Run `e31357a7-4a78-4f56-a79b-c3d2265b262a`, exit 0, 14 records, stage `complete`, elapsed 14891 ms.

- Target: shared CT114 main, `https://salient-dev-fc4f48cb09a0.tail41404c.ts.net` (target `main`), Compose `salient-dev-b90776c53141`.
- Source: canonical checkout `/srv/presidium/projects/salient/code`, commit `dbfb61d7032dec6fca2844b1960501a6b0e65258`, dirty=False; runner `scripts/v72-headless-main.ts` sha256 `9d2aefbb963803a0e7c6cf9ef2ee6b7e93dac7b42eff58a8efd1f538c52faffc`.
- Runtime hashes: history `8c52992a1bd5c1d1387445f646cc56c3cb28d62dd508ed60af2d0fb59211ec68`, historyRead `e4075fcc6acca4c3a017cbba642231c584a122e4c25ec064775f6362fabae80a`; source pin `fb83a789da8f0327a389c277a0c790b1648d5810`.
- Method: Real BetterAuth HTTP, scripts/app.ts commands and authenticated public Convex readback; real random accepted dice; no browser, database import, reset or gameplay row seeding
- Invocation (from the canonical checkout, run by the integrating lead): `presidium-dev run build -- env SALIENT_V72_MAIN_HEADLESS=1 SALIENT_V72_TARGET=main node scripts/v72-headless-main.ts`.
- Real dice: natural 8, total 10, tier 1, compiled damage 5, printed push 1, push subtotal 2 (allowance not fabricated; coverage named), Goblin Stamina after 10.
- Cases in order: `setup-identity`, `setup`, `initial-slam`, `player-first-correction`, `player-second-correction`, `player-undo`, `player-redo`, `director-correction`, `player-denied-after-director`, `manual-disposition`, `director-denied-after-disposition`, `rewind-disposition`, `unrelated-turn-end`, `director-denied-after-turn-end`.
- Disposable accounts/campaign only; no import, reset or seed; existing play data untouched.

Files: [readback](v72-headless-main-readback.json), [output](v72-headless-main-output.txt), [exit](v72-headless-main-exit.txt).
The isolated-environment proofs and reviews are in [the integration evidence](../integration/README.md).
