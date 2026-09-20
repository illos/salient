# V67: Pure compiled ability definitions and outcomes

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Engine implementer with independent implementation and rules reviewers |
| Rules review | required |
| Depends on | V26 design, R04 shared arithmetic, V64 source envelope audit |
| Unblocks | V26 live wiring and occurrence-aware log rendering |
| Status | Headless acceptance and independent implementation/rules reviews PASS; branch only |

## Goal

Compile bounded source envelopes into serializable ordered damage, push and unsupported nodes,
then calculate pure outcomes with the existing resolver. Preserve every mechanical section and
refuse unsafe source projections. These definitions are not connected to gameplay operations.

## Spec references

- `docs/build/V26-compiled-ability-effects.md#1-source-to-compiled-definition`
- `docs/build/V26-compiled-ability-effects.md#2-definition-to-outcome`
- `docs/build/V26-compiled-ability-effects.md#acceptance-checks`
- `docs/build/V26-ability-designs.md` — independent expected arithmetic and source boundaries.

## In scope

- Extract V64's pure envelope readers/classifier and vocabulary without changing audit semantics.
- Compile a single roll and three tiers into ordered nodes with content revision, source locator,
  verbatim structured clause and occurrence identity (ability + section + ordinal + clause hash).
- Reconcile full printed blocks, header facts, title annotations and source-declared flavor.
  Unknown paragraphs, additional rolls, contradictory tiers or title costs are diagnostics.
- Preserve bounded potency clauses as post-damage unsupported work; retain every other section
  as unsafe manual work. Kit, granted and Malice populations do not gain compiled execution.
- Call R04 for dice, tier, damage, cost, kit/build modifiers, immunity and health arithmetic.
- Calculate push subtotal and allowance from explicit precise sizes and movement coverage;
  known stability remains optional, unhandled/missing facts remain named manual requirements.
- Reuse V64's discovered corpus for a deterministic compiler support report.

## Out of scope

Live queries/mutations, journal/history writes, source-to-runtime migration, minion execution,
rendered log changes, actual movement, Effect/Trigger/Malice execution and new ability designs.
V67 does not stack on V63’s corrections branch. The user resumed normal non-browser verification;
all workloads run on CT114. Browser testing remains paused until further notice.

## Inputs and dependencies

Branch `slice/V67-compiled-effects-pure`, worktree `.worktrees/engine-compiler`, base main
`2f5544fb7f1f3eda46ec39e1604d4eaf1fb578d2`. Source pin remains Compendium
`fb83a789da8f0327a389c277a0c790b1648d5810`. Pure module callers supply a complete bounded
Envelope, sourceRevision and explicit source-declared flavor. Report adapters take these from
committed source metadata. Parent facts are preserved for developer/minion comparisons; a later
public record adapter must not publish a private whole-stat-block parentContext.

## Deliverables

- `shared/resolve/abilityGrammar.ts`: existing readers, classification and shape vocabulary.
- `shared/resolve/compileAbility.ts`: version 1 definitions and strict source coverage.
- `shared/resolve/compiledOutcome.ts`: pure outcomes and explicit forced-movement requirements.
- `scripts/report-compiled-abilities.ts`: uses V64 corpus, reports by population and source identity.
- `tests/scripts/compiled-ability.test.ts`: source changes, repeated identities and numeric examples.
- [Provisional independent review](reviews/V67-compiled-effects-pure-review.md).

## Acceptance checks

Execution evidence is recorded below as checks complete; final independent review remains required.

1. Focused source-backed fixtures must reject omitted mechanics, extra rolls, contradictory
   roll/tier/section/title facts and undeclared italic mechanics. Renamed/renumbered input must
   compile generically; repeated identical unsupported clauses must retain separate stable IDs.
2. Pure numeric cases must prove BS1–7, SC1–4, BP cost/blocking/remainder, MI2, RA2 and VF2 through
   R04. BS8/BP5 persistence/disposition remain V26/V63 integration responsibilities, not pure claims.
3. Axe tier 2 must preserve damage 4 then push 3 and full Minion/captain context, with manual
   execution boundary. Meteoric Introduction and Ray remain compile-only comparisons.
4. On CT114, run the focused script suite plus the existing V64/R04 suites
   and type/lint checks appropriate to this extraction. Do not run these workloads on Presidium.
5. Run `node scripts/report-compiled-abilities.ts <destination>` twice with separate destinations;
   compare JSON and Markdown bytes. Preserve actual reports only after generation. Generated
   support counts describe pure compilation only.
6. Finish independent implementation and pinned-source rules review after execution evidence.
   Do not merge or wire to live operations from a provisional review.

## Ability design and playtest evidence

All affected designs are in the [V26 appendix](V26-ability-designs.md). Brutal Slam, Spear Charge,
Bury the Point, both weapon free strikes, Viscous Fire, Meteoric Introduction and Ray are bounded
source comparisons; Spinecleaver Axe is minion compile-only. Pain for Pain and Thunder Roar
retain their compatibility/manual boundary. Lines of Force and Out of the Way! remain manual
outside the safe subset. Every discovered envelope is eligible for reporting, not live migration.
Designs are established; implementation is drafted; no V67 test or live playtest has run.

## Rules research

Pinned full sources and general rules already cited by V26: Brutal Slam, Goblin Warrior and
Spinecleaver; Elementalist Meteoric Introduction, Ray and Viscous Fire; Power Roll Outcomes,
Ability Roll, Kits, Forced Movement, Size and Stability. Shared R04 arithmetic remains authoritative.
Push is printed distance plus one for a larger melee-weapon creature actor; precise size subtypes
matter, target stability is voluntary, and conditions/traits/modifiers never default to absent.

## Open questions

None for this pure scope.

## Work log

- 2026-09-20: Fable assigned V67 in Chords597. Accepted with explicit preservation of the user's
  browser/testing pause and project CT114-only rule; the peer suggestion of local vitest does not
  override either. No runtime was started.
- Extracted existing V64 pure readers and classifier; no Convex file or live resolver changed.
  Added strict compilation alongside recognition, plus pure outcomes through existing R04.
- Independent static pre-review found title/cost annotations were too permissive. Added exact
  known title/cost matching and authored counterexamples. No execution confirms the fix yet.
- No formatting tool, tests, report generation, build or runtime command has run. Provisional
  source review and manual code inspection are distinct from formal completion gates.

- Follow-up static review found report provenance used the foe catalog revision for every
  population. Corrected per-source attribution and added a mixed/missing snapshot guard before
  corpus compilation, plus authored rejection cases. Reviewer inspected both fixes; no remaining
  definite blocker was found within this bounded static review, without a formal PASS.
- Authored Thunder Roar TR1 arithmetic comparison separately from compiled execution: its
  area/Effect envelope still refuses the compiled evaluator. Existing R04 calculates known
  constant damage and one payment; no push execution or compatibility migration is introduced.

- Renumbered compiler V66 to V67 to preserve main's V66 browser-harness reservation; rebased
  onto `2f5544f`. Browser testing is deferred under the site-wide moratorium and is not an
  acceptance blocker. The separate direct user testing pause still holds headless/unit execution
  in this thread until clarified; a peer message does not revoke it.

### Resumed headless verification — 2026-09-20

The user resumed normal development and non-browser tests. The first focused CT114 run passed
70 tests: 19 existing R04 resolver cases, 12 V64 audit cases, and 39 compiler/outcome/report cases.
Remote Prettier output was retrieved into this worktree; the full check is running against those
same source bytes. Browser testing remains paused; this pure scope introduces no UI journey.

Full CT114 `pnpm check` passed 742 tests (284 engine, 458 app/scripts) and all lint/type/content/build
gates. Two actual report CLI runs matched byte-for-byte in JSON and Markdown; regenerated V64
outputs also matched their original committed bytes. The report identifies 6 hero and 4 foe
pure-supported envelopes; every entry remains not wired to live execution. All six tested source
hashes match the candidate. [Evidence and commands](evidence/V67/README.md) distinguish the dirty
initial sync identity from the actual tested formatted bytes. Named services remain stopped and
CT114 was released; independent final implementation and pinned-source rules reviews both [PASS](reviews/V67-headless-final-review.md). Fable owns integration.
