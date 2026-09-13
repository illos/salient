# Rules skills design

Status: proposed design with confirmed decisions identified below, following the accepted rules-review
trial. No skills or runners are installed by this document. Design the researcher first; the reviewer's
detailed instructions follow separately.
The [development process](development-process.md) owns the accepted workflow and
[adaptation principles](rules-adaptation-principles.md) own product behavior.

## Two separate roles

| Proposed skill | Question it answers | Output |
| --- | --- | --- |
| `draw-steel-research` | What do the pinned sources establish for this mechanic in this situation? | A compact source-backed research brief. |
| `draw-steel-review` | Does this specific implementation faithfully express the relevant rules and approved adaptation? | Independent findings and a scoped review verdict. |

Research is useful during design, implementation, debugging, and test-expectation work. A research brief
does not approve implementation. The reviewer independently opens the corpus and establishes expected
behavior; it does not treat the researcher's conclusions or an existing passing test as authority.

## Researcher invocation

Invoke when a task needs to establish, change, or rely on Draw Steel mechanical meaning: formulas,
prerequisites, target rules, timing, conditions, character derivation, stat-block clauses, or the expected
outcome of a scenario. Do not spawn a separate lookup for every repeated mention of the same finding.
Pure presentation work without a mechanical claim does not need a new research run.

The caller supplies the repository root, one bounded question or closely related batch, relevant actors or
source identities when known, and the facts of the situation. It may supply source leads; those are starting
points, not an exhaustive approved bibliography. Distinguish a desired product behavior from a factual rules
claim. A leading question or user recollection must be checked against the corpus like any other premise.

Research should normally run in a dedicated fresh-context worker. Give that worker the actual skill path,
project instruction path, question, and relevant facts, rather than the implementation conversation or a
large summary of prior conclusions. The worker reads the skill and mandatory project references itself.
The launching agent remains responsible for user communication and subsequent implementation.

## Researcher's essential instructions

The proposed `SKILL.md` should contain this small core, plus links to existing project references:

1. Read project instructions and the [adaptation principles](rules-adaptation-principles.md). Use the
   [navigation guide](compendium-navigation.md) to locate rules and recover book context. Confirm the
   question's scope before interpreting it; establish ordinary source facts yourself rather than asking
   the user to explain the rules.
2. Inspect the actual pinned Compendium revision and any working-tree differences. Use a coherent recorded
   revision for findings, keeping upstream files unmodified. Never update the dependency as part of lookup
   or label modified checkout text as the clean pinned source. Core-only scope applies; corpus presence
   does not admit supplemental mechanics.
3. Locate and read the relevant full entry and its mechanical context. Search filenames/indexes first,
   then text; use exact SCC identities with their book qualifiers. A search snippet is a lead, not sufficient
   evidence. JSON and Markdown are two representations of the same corpus, not independent confirmation.
4. Follow dependencies that can affect the answer: general resolution rules, defined terms, actor traits,
   target restrictions, timing, choices, conditions and exceptions. Recover source-order/book-specific text
   when extraction leaves a reference incomplete or a unified chapter belongs to another book. Investigate
   relevant interactions without expanding the task into an audit of the entire rules corpus.
5. Explain the resulting behavior from the sources. Link each consequential claim to its precise supporting
   passage; distinguish verbatim evidence, interpretation, and a product choice. Do not infer mechanical
   equivalence from familiar names, another RPG, nearby implementation, or model memory. Read existing code
   only if needed to understand the caller's scenario; it is not rules evidence.
6. Return the required facts/choices, resulting effects and dependencies, and representative expected
   outcomes. Preserve distinctions such as optional versus mandatory, eligibility versus choice, and
   supplied table facts versus facts the engine could determine. Source-defined restrictions become
   compliance findings under the app's warn-without-blocking policy, subject to its explicit exceptions.
   In particular, the user confirmed blocking unaffordable ability execution on 2026-09-13; preserve source-
   legal payment rules. See [the affordability exception](rules-adaptation-principles.md#confirmed-exception-resource-affordability).
7. Identify exactly what remains unresolved. Separate contradictory/ambiguous source text, missing source
   evidence, missing scenario facts, and product decisions. Missing scenario facts can yield conditional
   answers; they need not become human rules questions. Unsupported automation is an implementation status,
   not proof that a rule is ambiguous. For genuine interpretive ambiguity, recommend a reading, explain
   why its evidence is stronger than the alternatives, and identify what could change that recommendation.
   Do not manufacture missing evidence or facts to produce a recommendation.

Research is read-only except for a requested research artifact. It does not write implementation, change
source data, approve a PR, or introduce a campaign house rule. Never search online for Draw Steel rules,
ambiguities or other Draw Steel content, including external discussion as a lead. The pinned local
Compendium is the only permitted research source; this restriction applies to delegated workers too.
If the corpus cannot establish the answer, report what was checked and what evidence is missing.

## Research brief

Use a compact human-readable record, with detail proportional to the question. A simple definition can be
a short answer and citation; a compound action needs its dependencies and examples. No fixed paragraph,
citation, example, or test quota applies.

```text
Question and scope:
  The exact mechanic/situation covered; material exclusions.

Answer:
  What the sources establish, with supporting source references beside the claims.
  Any interpretation is identified separately from direct source statements.

Evidence:
  Actual corpus revision; source-book identity; SCC/path and section or JSON field.
  Short exact passages where wording matters; links to the full relevant text.

Behavior:
  Needed facts and choices; results; relevant order, conditions and exceptions.
  Which general rules or actor/target traits affect this answer.

Examples, when useful:
  Concrete supplied inputs and independently derived expected outcomes.
  A meaningful boundary or exception where it distinguishes interpretations.

Unresolved:
  Specific uncertainty, its effect on behavior, and the missing fact/evidence/decision.
  Which findings can still be used independently of it.

Recommendation, for genuine interpretive ambiguity:
  The recommended reading, supporting reasoning, material alternatives and consequences.
  Linked user ruling when one is subsequently made; preserve the original recommendation.
```

Do not assign a model-generated confidence percentage. State what evidence establishes and what it leaves
open. A returned brief is research evidence, not a certification that a mechanic is implemented or correct.

## Keeping context and maintenance small

The durable artifact belongs with its bounded task/change, not in a second per-rule registry. Persist a brief
when downstream work needs it; ordinary conversational lookups do not require a permanent new file. The
caller carries forward its location and scope instead of repeatedly paraphrasing it through agent chains.

Reuse source evidence from a brief only when its source revision, relevant facts, and assumptions still
apply; a past user ruling is not reusable authority for another case. Reopen the relevant
passages before making a new mechanical claim or changing the interpretation. A new interaction, source
revision, or exception triggers targeted research. If a task outgrows its worker's context, preserve supported
findings and exact outstanding questions, then continue with a fresh worker; do not guess to close the task.
Avoid recursively spawning a new agent per dependency.

Proposed packaging is repository-local skills so their instructions can be versioned with this project.
Codex supports repository `.agents/skills` folders and loads full skill instructions when a skill is selected.
[Official skill documentation](https://learn.chatgpt.com/docs/build-skills)

A discoverable skill is not an enforcement mechanism. The task runner must explicitly supply/load the
research instructions and launch the separate worker; the later CI gate checks the required review evidence.
If fresh-context delegation is unavailable, report that limitation rather than calling an in-context pass
independent. Start with instructions and the existing navigation guide; add deterministic lookup helpers only
when a pilot shows repeated retrieval work or a concrete reliability gap.

## Reviewer handoff boundary

The reviewer gets the actual change scope, code revision/diff, applicable accepted adaptation decisions,
corpus access and project principles. It must discover omitted dependencies and unreported mechanical changes
as well as inspect declared claims. The researcher does not become its only retrieval channel.

An explicit user exception governs only its stated case. The reviewer distinguishes faithful source behavior
from faithful implementation of that approved exception, without rejecting the exception merely for
departing from a general guideline or extending it to other mechanics.

The reviewer records its independent source interpretation before using the implementation narrative to
compare reasoning. Its exact output format, reproduction checks, revision binding, correction loop and CI
integration will be designed next. Fresh review is a separate invocation, not a researcher renaming its role
or reviewing code it just wrote.

## Proposed pilot

When the skill is created, evaluate it with bounded raw requests and pinned sources, without handing the
worker the expected conclusion: a straightforward definition, a clause depending on a general rule or actor
trait, an incomplete extraction requiring book context, and a question with missing facts or a false premise.
Check correct scope, source retrieval, supported conclusions, and precise uncertainty. Reuse real repository
examples; do not create a large synthetic test suite or treat formatting checks as behavioral validation.

## Confirmed: recommendations and the user's rulings

The user confirmed that the researcher should recommend its interpretation of genuinely ambiguous sources.
Track how the user rules on those recommendations so accumulated evidence can inform whether less review
is appropriate later. A reduction in review is a possible future policy, not an automatic consequence or a
change to the currently accepted independent implementation-review gate. Ordinary source-backed reasoning
does not require a new human approval step.

Preserve the initial recommendation before user feedback, then link the user's actual ruling to it. Do not
rewrite the initial recommendation to match the answer, infer acceptance from silence, or count a case with
no ruling as a success. Later corrections or revised rulings remain distinguishable from the first decision.
Record actual decisions made during normal work; do not create a manual review requirement for every rule.

The following lightweight record and reporting details are proposed:

- Keep the record with the research brief/change. Identify the question, applicable situation, source
  references/revision, original recommendation, alternatives, and research run/skill version where available.
- Append the user's ruling, date and conversation/task reference, final interpretation, and the reason when
  supplied. Preserve the user's words where needed; do not invent a rationale or demand an essay.
- Distinguish agreement, partial agreement, rejection, and deferred decisions. Separately distinguish a
  source interpretation from a deliberate table/product preference or house-rule departure. Approval for
  convenience is not evidence that the researcher misread or correctly read the source.
- Summarize counts from the records, including pending cases and later corrections. Show initial agreement
  on comparable interpretation decisions with its denominator; keep partial agreements and deliberate
  departures separate. A few successes or many repetitions of one ruling do not establish broad reliability.
- Where useful, group findings by mechanic and researcher/skill version so success on simple numerical
  questions does not imply success on trigger sequencing. Continuing work on an already-decided case is not
  a fresh independent prediction; do not count it as another successful recommendation.

Agreement with the user measures usefulness and consistency with the user's adjudication, not objective
rules correctness. The user has explicitly noted that their own rules understanding is imperfect. Source
evidence and independent implementation verification retain their separate roles; a human ruling does not
retroactively make an ambiguous source unambiguous.

If the track record becomes strong, propose a narrowly scoped reduction in human interpretation review
with the supporting cases and remaining failure patterns. No trust score, threshold, or automatic promotion
is selected yet. Any future policy must say which review is reduced; source citations and faithful
implementation checks are not implicitly waived by fewer interpretation questions.

## Confirmed: isolated decisions, no automatic precedent

The user rejected standing rulings and automatic reuse for now. Keep each interpretation and adjudication
scoped to its original case. Continue honoring it while implementing or reviewing that case; isolation does
not require asking for the same approval again within the authorized work. A later case must be assessed on
its own sources and circumstances, even if it appears identical or closely related.

The adaptation principles are design guidelines. The user may explicitly choose a case-specific departure
for taste even when the researcher's interpretation and recommendation are reasonable and consistent with
both the sources and those guidelines. Record what the rules support, what the researcher recommended, and
what the user chose separately. Do not rewrite evidence to justify the preference or manufacture an error
in the researcher's source interpretation.

Taste-based departures do not count as research errors; they also do not prove research correctness when
the user has not evaluated that question. If the reason is unclear, leave it unclassified rather than
assuming either a mistake or a preference. Aggregate feedback may inform later review policy, but agents
must not extrapolate new rules or a general model of the user's taste from individual rulings.

No broader precedent, automatic reduction in review, or general exception to the guidelines is created by
recording a decision. The researcher recommendation and isolation questions are settled; the reviewer's
detailed skill design remains the next topic.
