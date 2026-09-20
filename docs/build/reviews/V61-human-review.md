# V61 Human candidate: independent static review

2026-09-20, Astra `/root/dwarf`; implementation and fresh rules inspection requested by lead.

Result: no production or test-value defect found in the inspected candidate. This is early static
consultation, not formal acceptance: `pnpm check`, corpus regeneration, browser verification,
persisted readbacks and Forge counterparts had not run when reviewed. Revisit the relevant results
before assigning final review/merge status.

Inspected the new Human decision module and evaluator, ancestry composition and evaluator call
sites, corpus selection in `scripts/build-content.ts`, and `tests/character-v61-human.test.ts`.
Source: pinned main Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`,
`en/unified/md/feature/trait/human/*.md`, `rule/character/speed.md`, and class Recoveries entries.
No Opus material or Forge output used for rules conclusions.

Rules match the source: all five purchases have the printed costs within a three-point budget;
Detect the Supernatural is automatic; Staying Power adds two Recoveries rather than healing value.
Class/kit derivation precedes Human contributions and complications follow them. Default size 1M,
speed 5 plus kit, and stability 0 plus kit are retained. Perseverance's slowed speed, Can't Take
Hold's supernatural forced movement mitigation, Determination's maneuver removal, and Resist the
Unnatural's triggered reduction remain readable conditional effects, not permanent statistic or
immunity changes. Complete trait directory inclusion is configured, but generated outputs remain
pending and must ship to make those references readable.

The four tests have distinct value: recovery-count versus healing and separate class/kit paths;
manual effect/grant and shipped-source coverage for remaining options; this budget's invalid-list
bonus leakage; and removal of ancestry-only contributions after parent replacement. Source-derived
numeric expectations are correct (Elementalist 8+2 Recoveries, Fury 10+2). No redundant per-option
snapshots, test-count targets, or implementation replicas found. Browser save/reload and authentic
same-build Forge evidence remain separate required verification; these tests do not prove them.
