# V46 Forge Steel counterparts

Same-build counterparts for every option this unit newly supports, required by
[the per-option delivery gate](../../character-verification.md#per-option-delivery-gate).

## Capture mode

Built in the **pinned Forge Steel application**, cloned on CT114 from the allowlisted vendor URL at
commit `5a846aadb623a9855a023e9403bb887a956c341f` (package version 14.197.0), installed from its own
`package-lock.json` and built with its own `vite build`, then served from `dist` on a loopback port
inside a disposable container. The repository's `vendor/forge-steel` checkout was never built,
installed into or otherwise touched, and `pnpm check-vendor` confirms both submodules remain at
their pinned commits and unmodified.

This capture mode is permitted by
[the 2026-09-19 clarification](../../character-verification.md#2-build-and-capture-the-reference)
and was directed by the integration lead. **It is not a claim of parity with the current public
website**, which is ahead of the pin: the V45 recovery recorded website versions 14.198.0 and
14.199.0 against this 14.197.0 pin. Using the pin removes website drift as an explanation for any
mismatch, at the cost of saying nothing about the current site.

Each hero was built by driving the real editor: the ancestry, culture, career, class and details
tabs in turn, every chooser opened and its option clicked, then `Save Changes`, then
`Export` → `Export as Data`. The editor reported no outstanding choices for any witness
(`editorWarnings: []` in the manifest). No export was constructed programmatically and no selection
was written into storage behind the editor.

## Manifest

[`tests/fixtures/v46-devil/counterparts.json`](../../../../tests/fixtures/v46-devil/counterparts.json)
records, per witness: label, template, chosen traits and signature skill, hero name, export and
sheet file names, byte count, SHA-256 of both, the enabled `sourcebookIDs` read back out of the
export itself, and the editor's outstanding-choice list at save time.
[`tests/character-v46-forge.test.ts`](../../../../tests/character-v46-forge.test.ts) re-reads those
bytes on every run: it checks the hashes, that each export's active selections are the template's,
that the union of witnessed options is exactly the seven traits and thirteen skills and nothing
else, and that Forge's own encoding agrees with the Compendium sentences.

## Structural agreement, and what it does and does not prove

Forge encodes each trait as a typed feature, which is an independent corroboration of how the
source sentence is meant to act — not a substitute for the source:

| Trait | Forge feature type | Agrees with |
| --- | --- | --- |
| Beast Legs | `Speed`, `speed: 6` | "You have speed 6" as a replacement, not a bonus |
| Impressive Horns | `Save Threshold`, `value: 5` | "you succeed on a roll of 5 or higher" |
| Glowing Eyes | nested `Ability` | a triggered action, not a passive statistic |
| Wings | nested movement-mode feature | "While using your wings to fly" grants flight |
| Barbed Tail, Hellsight, Prehensile Tail | `Text` | no statistic changes in either builder |

Two observations worth recording rather than smoothing over:

- **Forge's wording differs from the pinned Compendium in places.** Forge renders Beast Legs as
  "Your powerful legs improve your speed. Your Speed is 6." where the pin reads "Your powerful legs
  make you faster. You have speed 6.", and Impressive Horns as "larger than your average devil's"
  where the pin reads "larger than the average devil's". Salient displays the pinned text. These
  are reference-wording differences, not mechanical ones.
- **Forge and Salient resolve the Wings aloft minimum differently.** Forge substitutes the raw
  Might score into the sentence and leaves the "(minimum 1 round)" clause as prose — with Might
  unassigned it renders "equal to 0 (minimum 1 round)". Salient records the resolved limit,
  `max(1, Might)`. Both are faithful to the same sentence; Salient resolves what Forge leaves to
  the reader. This is the reason template D keeps Bethell's Might of -1: it is the only witness
  where the clause changes the answer.

## Witness ledger

Every newly supported option appears in at least one completed build. Templates A, B and C hold the
audited Grug Berserker Fury baseline constant and vary only the purchased traits and the signature
skill; template D is the Bethell Fire Elementalist with its ancestry changed to Devil, which also
supplies the ancestry-switch comparison the reference procedure asks for.

See `counterparts.json` for the authoritative per-witness record; the fixture's `witnessLedger`
states the intended mapping and the test proves the captured builds realize it.
