# V188: Follow-up ability records show the printed body, not frontmatter

Rules review: not required (display text only; no rule, value or grant changes). Depends on: none.

## Goal

Follow-up ability records (records with a `parent`, e.g. "Out of the Way!: Follow" and
"Lines of Force: Enhance" on a level-2 Berserker Fury) render their source on every sheet (live,
draft, history) and in the table ability list without the Compendium file's YAML frontmatter. The
V187 capture (`test-artifacts/V187-ccd9c67/capture/screens/history-preview.png`) showed
"Effect: — action_type: 'Main action' class: fury cost: 3 Ferocity …" before the rendered ability.

## Cause

Each class's follow-up text builder (`furyActionText`, `censorActionText`, `conduitActionText`,
`elementalistSourceText`, `talentActionText`, `nullActionText`, `troubadourActionText`,
`beastheartSourceText`, `summonerSourceText`, Tactician's `source`) returned the Compendium entry's
`text`, which is the byte-exact file including frontmatter (`shared/contracts/content.ts`). The
sheet (`convex/characters.ts` `abilityView`) and the table (`convex/lib/resolve.ts`) put that text in
the ability's single `Effect` clause, and `shared/presentation/ability.ts` renders it as
`**Effect:** ---\naction_type: …`, so the presentation layer's leading-frontmatter strip never
applied. Provenance quotes built from the same functions carried the frontmatter too.

## Scope

- New `shared/content/source-body.ts` `sourceBody()` removes leading frontmatter; every class
  follow-up text builder above uses it. Structured facts still come from `structured`.
- Affected before the fix: every follow-up record of ten classes, 641 in total (Beastheart 151,
  Censor 34, Conduit 45, Elementalist 51, Fury 23, Null 27, Summoner 221, Tactician 10, Talent 50,
  Troubadour 29). Shadow, ancestry, perk, item and complication follow-ups use quoted passages and
  were unaffected.
- No Convex or UI change; the fix is shared, so live, draft and history sheets and the table all
  read the corrected text.

## Acceptance checks

1. `tests/character-v188-follow-up-content.test.ts`: no follow-up record of any class has a `---`
   line or a frontmatter key (`action_type:`, `scc:`, `type:`, `class:`) in its source text; the
   "Out of the Way!: Follow" text equals the body of
   `en/unified/md/feature/ability/fury/level-1/out-of-the-way.md` after its closing `---`, read from
   the pinned Compendium. Both fail before the fix.
2. A level-2 Fury sheet shows "Out of the Way!: Follow" without frontmatter (visual spot check for
   TESTER).

## Work log

- 2026-09-25 WIZARD3: cause traced to the class follow-up text builders; `sourceBody()` added and
  applied; focused test added (fails before, passes after). Ready for gate.
- Independent review PASS (2026-09-25). sourceBody matched an independent strip on all 1,881 Compendium entries. There are no engine, report or snapshot dependents, so no regeneration is needed.
