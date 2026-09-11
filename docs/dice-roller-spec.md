# 3D dice roller adaptation specification

Version 0.2 — 2026-09-10. **Specification only; no roller implementation or upstream dependency added.**

Adapt the useful parts of [Owlbear Rodeo Dice](https://github.com/owlbear-rodeo/dice) into an optional 3D dice tray with drag-and-drop interaction. Dice rolling remains a shared code/CLI capability. The tray requests rolls and presents accepted results; its physics never determines gameplay values.

This records the user's clarification and supersedes the earlier suggestion that the visual physics simulation could supply authoritative dice values. Read alongside the [engine architecture](engine-architecture.md) and [data architecture](data-architecture-spec.md).

## 1. Confirmed requirements

- The desired upstream features are the 3D dice roller and tactile drag-and-drop mechanics.
- This is a UI enhancement. Dice generation, validation, reroll semantics, and recording belong to shared operations usable through the CLI without a browser.
- The deterministic rules engine continues to receive explicit dice results. Random generation is a separate shared operation, not randomness introduced into the rules engine.
- The visual client uses the same gameplay operations as the headless client. Disabling or removing the tray must leave the ability to roll, resolve actions, and inspect recorded results intact.
- Recorded history restores actual recorded state without generating dice or invoking the rules engine again.

The component design, gesture details, animation technique, and implementation sequence below are proposals. The user has requested a specification, not implementation of this feature or the backend.

### Roll visibility and planned tower mode

Confirmed: rolls are public to the permitted table audience by default. A planned dice-tower mode has Director-only results: even the player submitting a tower roll cannot see its result. The exact tower interface remains open; no drag/drop gesture or v1 delivery commitment is established by this addition.

Proposed contract extension: record an audience with each accepted roll and validate it through shared application operations. Keep the authoritative result distinct from the response allowed to the caller. A tower submission returns an acknowledgement to its player; only the Director's authorized view receives the actual faces/totals. Requests, retry recovery, CLI access, subscriptions, logs, and fallback rendering must respect that distinction. The ordinary supplied-face prototype is not a demonstration of a hidden tower roll.

Result-matching animation applies only to viewers authorized to see the result. The submitter's tower animation may show dice entering a hidden area or another non-revealing acknowledgement; never reveal the accepted face values or invent substitute outcomes. The renderer is not the security boundary. A hidden result must not be generated on or sent to an unauthorized player's client.

The retained result remains available to the engine/application and authorized Director independently of the renderer. Later Director reveal, historical readership after Director changes, and disclosure of derived outcome explanations remain open. The table's proposed sharing feature does not automatically publish tower results.

## 2. Scope and current starting point

Propose a first slice with one tray, one dice style, two d10s, mouse/touch pickup and throw, a button alternative, and a textual result. Dragging dice from a picker into the tray is a proposed follow-up within the intended interaction design. Other die types, additional styles, and sound can follow after the result-driven animation works.

The current [prototype contract](../src/contracts.ts) accepts supplied d10 faces through `AbilityCommand.roll`; the CLI currently uses supplied dice. This specification does not claim a random dice service already exists. A small shared roll operation and CLI entry point are prerequisites for the complete feature, while fixed result fixtures are sufficient to explore animation.

Do not adopt Owlbear's whole application shell, advantage/disadvantage controls, recent-roll store, player metadata, or multiplayer protocol. Do not expand Draw Steel rules coverage as part of the visual adaptation. Rule-specific interpretation stays with the engine and its verified content.

## 3. Ownership boundary

| Layer | Owns | Must not depend on |
| --- | --- | --- |
| Shared dice operation | Validated dice requests, random generation or accepted supplied inputs, stable individual results, retry behavior | React, a canvas, pointer input, a physics world, animation completion |
| Rules engine | Deterministic interpretation of explicit dice and other inputs | Rendering or gesture state |
| Application operations | Permissions, action context, accepted roll records, engine invocation, recorded state changes | A visible or mounted tray |
| CLI adapter | Invoking the same shared operations and reporting their results | Browser packages |
| Visual adapter | Preparing a request, collecting gestures, showing status and recorded results | Authority to invent or replace game results |
| 3D presentation | Models, materials, lighting, cosmetic physics, animation, sound | Authority over roll acceptance or game state |

“Code/CLI level” describes shared ownership, not a requirement for the browser to spawn a CLI process. The shared operations can initially be ordinary callable code; deployment and transport remain the application's decisions. The renderer does not choose the engine's language or runtime.

Gesture velocity, release position, cosmetic seeds, frame rate, and collisions must not enter the gameplay random generator. They may affect only presentation. Different gestures can animate the same accepted roll differently without changing any face value or consequence.

## 4. Proposed operation and presentation contracts

Use JSON-serializable values at the boundary. The following are illustrative contracts, not additions to the existing API:

| Message | Minimal content | Owner |
| --- | --- | --- |
| Roll request | Stable request ID, action/context reference when applicable, ordered dice identified individually with their side counts | Shared operation contract |
| Accepted roll | Stable roll ID, originating request ID, each die's ID/side count/value, source such as generated or manually supplied | Shared operation output and application record |
| Presentation request | Accepted roll plus optional cosmetic launch position/direction/strength | Visual adapter |
| Presentation finished/skipped/failed | Roll ID and presentation status | UI only |

The application derives or validates the allowed dice for an action. Arbitrary free rolls, if supported, use an explicit operation rather than changing the dice required by an ability. A reroll is a new validated operation referencing the earlier roll and selected dice; its precise game permissions come from shared behavior, not a draggable mesh.

Return individual face values only to an authorized result viewer, preserving die identities and order. Tower submitters receive acknowledgement rather than those hidden values. Normalize d10 values to 1–10 before they enter the engine or record. Any display of a `0` glyph for ten is a rendering concern. The tray consumes totals, modifiers, and outcome explanations from shared code when needed; it does not implement edges, banes, or tier selection.

For retries, the same request ID with the same gameplay inputs retrieves the same accepted roll through an audience-appropriate response; a tower submitter still cannot retrieve its hidden result. Reusing that ID with different gameplay inputs is rejected. Replaying a presentation uses a roll ID and never submits a new roll request.

The authoritative record must survive independently of animation. How that record and a related action commit are stored follows the data architecture; this spec does not add a separate dice database. An accepted roll is not discarded or regenerated because a dependent action subsequently needs more input or is rejected. Its disposition remains inspectable through shared operations.

## 5. User interaction and lifecycle

1. The player prepares dice or opens an action's prescribed roll. The tray can show unrolled previews.
2. The player drags and releases, or uses the equivalent roll button. One intentional release submits one shared request. Cosmetic throw information stays local to presentation.
3. While awaiting acceptance, show pending status. A pickup or anticipation animation may run, but it must not display an invented final result.
4. Shared code accepts and records the dice values. Application resolution can proceed without waiting for the 3D animation.
5. For authorized result viewers, the tray animates accepted values and settles with each visible die matching its recorded value. Text results remain available independently of animation under the same audience policy. A tower submitter receives no result-bearing animation or text.
6. Skipping, closing the tray, losing the graphics context, or navigating away stops presentation only. Returning reads the accepted record.

Proposed gesture behavior:

- Dragging a picker item into the tray prepares a die; it does not silently roll or commit an action. For an action with prescribed dice, the picker cannot alter the required dice set.
- Dragging an eligible die within the tray and releasing requests a throw/reroll through the shared operation. Historical or otherwise ineligible dice do not gain reroll permission through dragging.
- A tap is distinct from a drag. Use a movement threshold, pointer capture, consistent canvas coordinates, and pointer cancellation handling. A canceled gesture before submission issues no request; cancellation after submission does not retract an accepted roll.
- Once a request is pending, additional input cannot accidentally submit it again or replace the active presentation. Keep the first version to one active request per tray.
- Touch input must coexist with page scrolling outside the active gesture region. Provide a button/keyboard path for every gameplay operation; dragging is optional.

The first implementation should use shared validation to decide whether a throw is available. Do not introduce a new user confirmation screen for ordinary rolling by default.

## 6. Making physics display supplied results

This is the principal adaptation risk. Upstream simulates a throw and reads the final upward face as the roll result. Its existing callback cannot remain the source of gameplay values. Its saved-transform rendering is useful for static display, but is not a ready-made API for animating any supplied result.

The prototype must accept externally supplied results before choosing a final animation path. Cosmetic simulation can provide convincing motion, but a presentation step must ensure the final pose of each numbered die matches the requested face.

Proposed first experiment: reuse the physics and assets for the throw, then apply a controlled final orientation correction to the rendered die as motion settles. Establish the correct target orientation using the actual model's face normals and numbering. Assess whether that correction looks acceptable during ordinary and slow throws; this approach is a hypothesis, not a demonstrated solution.

If correction is visibly distracting, evaluate bounded prerecorded/baked trajectories with result-specific presentation. Avoid an unbounded search that repeatedly simulates throws until the desired face happens to appear. Never change the accepted result to fit a convenient animation.

Acceptance rules for any technique:

- Final visible values match the accepted values for every supported face and die combination.
- Show a stable, plausible final pose without floating or visibly intersecting the tray or neighboring dice.
- Die identity remains correct through movement and any presentation correction; distinguish the two d10s visually when needed.
- An animation timeout or mismatch falls back to a correct static arrangement and text. It does not force-accept the physics result or roll again.
- Dropped frames, background tabs, interrupted gestures, and device performance cannot change values.
- A renderer may use cosmetic randomness; gameplay fairness depends on the shared generator, not statistical tests of cosmetic physics.

Do not treat the result-matching approach as settled until the first prototype proves the tactile experience is usable. If reuse requires excessive correction machinery, a simpler authored animation can retain pickup/throw interaction while still displaying the correct results.

## 7. Upstream extraction plan

Reviewed source: [owlbear-rodeo/dice at `ccc32beceee0888c0a48129fbb23f4a636c710ee`](https://github.com/owlbear-rodeo/dice/tree/ccc32beceee0888c0a48129fbb23f4a636c710ee), commit dated 2024-04-11. This is a research reference; it is not currently vendored in this project.

| Upstream area | Proposed treatment |
| --- | --- |
| `meshes/`, `materials/`, `colliders/`, tray assets | Reuse a minimal subset with provenance; validate numbering and final poses. |
| `dice/Dice.tsx`, `dice/DiceRoll.tsx`, `dice/PhysicsDice.tsx` | Adapt rendering and motion; remove the path from physics-derived faces to accepted gameplay results. |
| `helpers/getValueFromDiceGroup.ts` | Potential visual verification aid; never an authority for the dice record. |
| `dice/InteractiveDice.tsx`, `helpers/DiceThrower.ts` | Reference for tactile movement; rewrite gesture handling and treat throw parameters as cosmetic. |
| `audio/` | Optional later reuse after the core experience works. |
| `controls/`, Zustand gameplay roll store, `plugin/` | Replace with our controls and operation adapter; do not bring Owlbear synchronization into the app. |

The upstream stack is React, Three.js/React Three Fiber, Drei, Rapier, and React Spring for interaction animation, with Material UI, Zustand, and Vite in the surrounding app. Propose retaining the useful rendering/physics libraries for a browser prototype. This does not settle the application's whole frontend stack. Choose and verify compatible dependency versions during implementation instead of copying the old package manifest wholesale.

If source/assets are copied, retain license and attribution, document upstream paths and revision, and add the adopted material to `THIRD_PARTY_NOTICES.md`. Inspect applicable asset and dependency terms separately. Upstream's repository license is GPLv3; our application is `GPL-3.0-only`. No upstream code or assets are imported by this document.

## 8. History, remote views, and failure behavior

The accepted roll record is sufficient for CLI output, text UI, rules resolution, history inspection, and a static 3D presentation. Exact animation trajectories are optional cosmetic data, not required game history.

History navigation reads recorded faces and restores recorded state using existing application history operations. It must not invoke the random generator, reroll operation, or engine. Any optional animation replay is presentation of the existing roll only.

Remote participants consume the same accepted record through the application's shared-state mechanism. Exact matching trajectories and simultaneous animation starts are not required; matching individual results are. Late subscribers can show static results. The renderer consumes only results the current participant is allowed to see; it does not implement hidden-roll access policy.

When submission status is uncertain after a disconnect, recover by request ID through the shared operation. Do not generate a local substitute. When assets, WebGL, audio, or animation fail, continue with the ordinary textual controls and accepted results.

For reduced motion or disabled 3D, render the same result immediately without cosmetic physics. Lazy-load the visual feature, stop work when hidden/idle, and ensure the headless CLI does not load browser rendering dependencies. Phone testing must include real touch interaction and a representative physical device; a resized desktop viewport alone is insufficient performance evidence.

## 9. Implementation sequence and acceptance examples

1. **Shared roll boundary:** implement or expose the smallest shared operation and CLI path needed for the slice. Verify input validation, individual results, accepted-record recovery, and repeated-request behavior without a browser. Keep supplied-dice fixtures usable.
2. **Result-driven visual proof:** use externally supplied d10 fixtures to validate pickup/throw motion, face matching, and fallback behavior. This can be explored independently of backend implementation.
3. **Connect one complete flow:** invoke the shared operation from the tray and button; verify that the CLI and UI consume the same operation contract and that state changes finish without an animation callback.
4. **Expand interaction:** add picker drag-to-add where applicable, eligible rerolls, and history/static views. Add other styles, dice, sound, and remote presentation only after the first slice works.

Use a small set of meaningful checks, not a separate verification framework:

| Example | Required observation |
| --- | --- |
| Supplied results `[1, 10]`, `[10, 1]`, and doubles | Individual rendered faces and textual values match the accepted record; no d10 zero leaks into the engine. Exercise all ten target faces. |
| Same accepted record with different drag strengths and frame rates | Motion may differ; result and gameplay consequences remain identical. |
| Animation skipped or renderer unmounted after acceptance | Accepted dice and related state changes remain available through CLI/readback; no second generation occurs. |
| Duplicate request, retry, and conflicting payload | Same request returns the accepted record once; conflicting reuse is rejected. |
| History back/forward and presentation replay | Recorded state/results are restored; generator and engine are not invoked by navigation. |
| Tower audience | Director can read the accepted result; submitting player and observers cannot read faces/totals through response, retry, animation, text, subscription, or log. Ordinary rolls remain public to the table audience. |
| Invalid or disallowed reroll | Shared operation rejects it; dragging cannot bypass the rejection or alter earlier results. |
| Pointer cancel, release outside canvas, repeated touch | No accidental extra roll or stuck pickup; controls remain usable. |
| WebGL unavailable, reduced motion, timeout | Correct text/static results and normal operations remain available. |

Use controlled dice fixtures to compare CLI and UI behavior. Two independent random requests are not expected to produce identical values. Record measured load/animation behavior on the chosen phone target when the prototype exists; no mobile performance claim is made by this spec.

## 10. Decisions still open

- Whether final-orientation correction looks good enough, or baked/authored trajectories are needed.
- Tray placement and size within the evolving table UI.
- Whether dragging an existing result is the preferred reroll affordance, subject to shared permissions.
- Exact picker behavior, initial additional dice types, styles, sound defaults, and motion settings.
- Shared generator algorithm and deployment location, final API types, and persistence details; these belong to headless/application design, not the renderer.

These choices may change the implementation. They do not reopen the confirmed boundary: dice logic remains usable through shared code and the CLI, and 3D is an optional presentation of its results.
