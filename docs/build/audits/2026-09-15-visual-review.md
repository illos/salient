# Independent visual review — 2026-09-15

Reviewer: Codex `visual_review`, independent of the A08 implementation and current UI repairs.
Scope: desktop visual structure, readability and role presentation for A08, A02 and A07.
This report does not substitute for the independent rules reviews or backend authority tests.

## Authority and evidence

Read `agent.MD`, [A08](../A08-design-tokens-theme.md), the
[mockup authority and departures](../../design-mockups/v1/README.md), stylesheet, theme tests,
router, wizard, character sheet controls and closeout/Void components. Compared the actual
`login.png` and `campaign-home.png` reference images using image inspection.

The six `.playtest/a08/` images initially present were dated 2026-09-14 20:49 UTC. They show the
post-integration implementation reviewed in the earlier A08 audit, but are not evidence of the
final September 15 repair build. Refreshed evidence is recorded below.

Viewed the September 15 00:25 UTC A07 images directly: `.playtest/a07/closeout-director.png`,
`closeout-player.png`, `closeout-observer.png` and `paused-reset.png`. These exercise the new
closeout surfaces, before the final coordinated audit synchronization.

## Structural comparison

The login keeps the reference's two columns, left wordmark and large headline, hard vertical
separator, right form with a heading rule, uppercase field metadata and brick-red primary action.
Campaign home keeps top navigation, the broad session/log column and narrower invitation/member/foe
column, hard section rules and rectangular cards. The different copy and extra console come from
implemented workflow requirements; the reference explicitly supplies style, not exact content.
The prohibited compatibility footer, Library navigation, Request test, token and respite-request
controls are absent from the inspected screens. Pixel matching and mobile polish are not v0.01 gates.

The A07 screenshots have distinct, readable foe, center and hero columns. The Director sees
cleanup completion and foe/Malice controls. The player sees their selected sheet and the shared
closeout result; the observer sees the compact health presentation and no command console or
completion control. The paused-reset view clearly labels the paused session and disables gameplay
buttons. Full-page capture makes these tall pages look small; actual content remains desktop-sized.
No overlapping panes or clipped primary closeout control was visible in those captures.

## Findings

1. **Repaired: dark error contrast.** In `web/style.css`, dark `--destructive: #c4524f`
   gives 3.98:1 against the card surface `#171717`, and approximately 3.64:1 in the
   `bg-destructive/10` error notice. These are small, actionable diagnostic/error messages.
   Calculated directly using the sRGB relative-luminance formula. A lighter error token such as
   `#e07470` yields 5.89:1 on the card and 5.17:1 in the notice while preserving the primary action's
   brick red. Applied this token change after coordinator authorization. The dark pending-request
   count previously using `text-primary` was only 2.82:1 on a card; it now uses `text-foreground`
   (14.05:1). Link-button hover uses the brighter text token in dark mode too. Updated the token
   document with measured ratios; the primary button remains unchanged. The coordinator's
   independent cross-check also caught the unused destructive button variant's stronger dark
   fills: changed normal/hover tint to 10%/15%, independently recalculating 5.17:1/4.79:1.
2. **Unreproduced stress risk.** The top navigation accepts an 80-character display name without
   truncation. The current 1280-pixel wizard capture shows no source-path or column overflow; the
   80-character-name edge case has not been exercised. Do not turn unsupported mobile widths into
   a prototype gate.
3. **Minor duplication.** The A07 selected sheet shows both “Catch Breath” and “Spend a Recovery”.
   Both controls remain legible; their shared operation parity belongs to the A05/A06 audit, and
   removing this duplication is not required for the structural visual acceptance check.

The normal text tokens are readable: muted text on a light card is 4.53:1, muted text on a dark card
is 5.19:1 and white primary-button text on brick red is 6.35:1. The component scan for raw hex,
`rgb()` and `hsl()` colors returned no matches. These spot checks are not a claim of complete
accessibility certification.

## Refreshed evidence and verdict: pass for desktop visual scope

Viewed September 15 00:31 UTC refreshed login/campaign screenshots in both themes, and the new
`.playtest/audit-2026-09-15/wizard-assignment.png`, `sheet-owner.png`, `sheet-director.png`, and
`sheet-peer.png`. The login and campaign structural comparison passes. The wizard presents sourced
steps, the characteristic assignment, and a distinct hero-so-far column; no horizontal clipping is
visible at 1280 pixels. The initial full-page wizard screenshot painted its sticky nav partway down because
it was captured after scrolling; the fresh 00:39 capture inspected afterward correctly starts at the
top. That later capture catches the hero summary during its brief “Evaluating…” state; the earlier
settled capture supplies evidence of its populated layout. The owner/Director full sheet and compact peer health sheet are readable.

The initial browser run found integration failures; the coordinator repaired them. In the final
rerun, closeout, combat, the basic journey, the table audit and all three theme tests pass. The
extended connected wizard journey subsequently passed in `browser-wizard-final.log` (one test,
1.8 minutes). This report certifies the inspected visual scope; backend/rules evidence remains in
the owning audits.

Two additional narrow repairs were authorized by the coordinator after the fresh captures:
removed obsolete campaign-log and foe-footer claims that combat actions are unavailable; and hid
recovery controls in a compact table sheet when `sheet.viewer.controls` is false. The latter fixes
an observer who owns an admitted hero seeing disabled action buttons in the table, while retaining
full owner data access and standalone-sheet disabled controls. The final browser table audience assertions
pass, and its fresh observer-owned sheet screenshot has no recovery controls. No backend or rule
calculation changed here.

Final evidence inspected directly after the repairs:

- `.playtest/a08/`: all six login, campaign and character-list captures, refreshed September 15
  00:38 UTC; both themes preserve readable controls, borders and the reference structure. The
  campaign captures confirm obsolete combat-unavailable copy is gone.
- `.playtest/fixes/table-{director,player,observer}-{light,dark}.png`: all six captures, refreshed
  00:38 UTC. The observer-owned hero remains readable without recovery/target controls, the player
  retains controls for their hero, and the Director retains foe/resource controls. Long source text
  wraps within its pane. The passing browser scenario checks document overflow at 1280 and 1440
  pixels for all three roles.
- `.playtest/a07/closeout-{director,player,observer}.png` and `paused-reset.png`: refreshed
  00:35–00:36 UTC; all inspected again. Closeout controls and role differences remain readable,
  and the closeout scenario passes.

No blocking visual defect remains in these desktop captures. Some full-page Director captures
retain a sticky-header position from their current scroll offset; this is an evidence-capture
artifact. The inspector did not mistake it for layout overlap in normal viewport use. Long pages,
raw readable source references and duplicate recovery entry points remain prototype presentation
limits, not new gameplay requirements. The 80-character navigation-name stress case was not run;
this report does not claim every possible input fits every width.

The coordinator independently reviewed the narrow visual fixes and verified the contrast ratios.
No new product or rules question is raised: the applicable boundaries are already settled by the
written specifications. Rules research is not required for color, copy removal or visibility based
on an existing authority flag; A02/A05/A07 rules behavior remains covered by their separate audits.

## Follow-up: readable ability summaries

The coordinator's cross-review of the tall Director table capture identified excessive Markdown
link destinations in compact ability metadata. Independently reviewed the resulting display-only
`summaryText` change in `web/table/targeting.tsx`: the short action/cost/distance/target/roll line
and tier summaries render link labels, while Read still renders `ability.text` directly and verbatim.
Operation arguments, source storage, damage calculations and rules execution are unchanged.

Exercised representative pinned-source Markdown forms: the bleeding comparison retains
`M < 0 bleeding (save ends)`, characteristic alternatives retain `Might or Agility`, and a damage/push
clause retains its numbers and `push 1`. No semantic text is discarded for these source forms.
This is a narrow summary renderer, not a general Markdown parser. Independent code verdict: pass.
Viewed the final `.playtest/audit-2026-09-15/combat-0.png`, `combat-1.png` and `combat-2.png`
directly after the passing connected-journey rerun. The Director and player ability summaries now
show compact human-readable link labels, including roll characteristics and damage/push clauses;
raw `scc.v1` destinations no longer dominate those summaries. The Director retains foe/Malice
controls; the player retains their action controls; the observer has read-only initiative, foe
health and peer hero health with no command console. The readable-summary visual verdict is pass.

## Performance evidence limits

The first 40.247-second, 30-toggle sample had an invalid `logRows` selector returning zero and was
superseded. It must not support memory-per-row claims. Reviewed the corrected
`.playtest/audit-2026-09-15/performance.json`: Chromium 153.0.8010.12, three reactive contexts,
60 real condition toggles during one active turn, 84.388 seconds, forced-GC samples every ten cycles.
The corrected selector is `li[data-disposition]`; the test asserts 1–50 rows at every sample and
exactly 50 after cycle 40. Each role measured 24, 34, 44, then 50 rows for the remaining samples.

| Role | Peak DOM nodes | Final DOM nodes | Initial post-GC heap | Final post-GC heap |
| --- | ---: | ---: | ---: | ---: |
| Director | 5,210 | 5,153 | 19,358,600 bytes | 24,269,092 bytes |
| Player | 4,778 | 4,721 | 20,584,516 bytes | 24,393,468 bytes |
| Observer | 1,440 | 1,383 | 13,794,068 bytes | 17,218,252 bytes |

The mounted log reaches its 50-row bound and DOM counts stop growing in the final samples.
Heap usage still rises after the row cap is reached: from cycle 30 to 60, by 1,336,860 bytes for
the Director, 1,277,824 for the player and 1,161,384 for the observer. The final increment is
smaller, but seven samples across 84 seconds cannot establish stable long-session memory or exclude
retained-resource leaks. Initial page settling also affects raw DOM/heap comparisons. This is
successful short local interaction and bounded-log evidence, not one-hour/six-hour soak certification.
No numeric product performance threshold has been selected.

Inspected all three refreshed `combat-0.png`, `combat-1.png`, and `combat-2.png` captures from the
corrected run (September 15, approximately 01:01 UTC). The readable summaries and role-specific
controls remain intact, with Older activity available beneath the bounded log. Visual verdict stays
pass. The coordinator retains responsibility for the final full-suite run after the invitation-link
repair below.

## Follow-up: invitation sign-in link semantics

Independently reviewed the narrow `web/campaigns.tsx` repair: the invitation's “Sign in to request
membership” is an actual TanStack `Link`, styled with the already exported `buttonVariants`,
without a Base UI Button wrapper assigning button semantics. It preserves `/login` and the
`next: /join/${shareCode}` search value, so authentication still returns to the invitation.
The label, appearance variant and hover styling remain unchanged; the anchor retains native link
activation and navigation semantics. No authentication or membership authority logic changed.
Independent code verdict: pass. The existing journey assertion locates this control by link role;
the coordinator's final full-suite run passed that scenario in 25.3 seconds, including its link-role
assertion, real account and invitation flow, saved draft, live CLI and reconnect checks.

The coordinator preserved this independently inspected 84.388-second sample as
`.playtest/audit-2026-09-15/performance-reviewed.json`; subsequent acceptance reruns may replace
`performance.json`. The measured values above refer to the preserved sample.
