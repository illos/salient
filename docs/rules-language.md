# Rules language

## Intent and constraints

The engine should read official stat blocks and homebrew using supported Draw Steel wording. Its reusable mechanics should give those descriptions executable meaning. The user describes this as a large parser with a blessed set of formulas.

The project is a hobby, with limited human development time. Earlier attempts invented mechanics, imported assumptions from another game, or became consumed by approval queues and elaborate provenance checks. This attempt must demonstrate correct behavior without requiring the user to certify every rule or maintain a parallel bureaucracy.

## Proposed implementation model

1. **Read the document structure.** Use the existing structured corpus where possible to identify statistics, traits, abilities, costs, targets, and result tiers. A future text-input adapter can produce the same structure.
2. **Parse mechanical language.** Recognize supported phrases and their relationships, preserving references to the original text. Produce a small internal representation of selectors, expressions, effects, durations, prerequisites, and choices.
3. **Check executable meaning.** Verify references, required context, valid combinations, and implementation support. Syntactically recognized text can still describe unsupported behavior.
4. **Interpret mechanics.** Execute shared Draw Steel behavior against supplied state and facts. Return structured effects, requests for decisions or missing facts, and diagnostics.
5. **Present results.** Clients render explanations and apply accepted state changes through their application service.

Prefer a compositional grammar to an unstructured collection of whole-sentence substitutions. Define relationships such as sequencing, conditional application, quantified targets, and duration explicitly as real examples require them. Do not design the entire grammar before testing any behavior.

The common rules still need implementation. A parser cannot learn the meaning of push, a condition, or turn timing merely by recognizing its name. Stat blocks also rely on rules defined elsewhere in the books.

## Examined example

The [Goblin Spinecleaver source](https://github.com/SteelCompendium/data-unified/blob/fb83a789da8f0327a389c277a0c790b1648d5810/en/unified/json/monster/goblin/statblock/goblin-spinecleaver.json) contains structured ability fields and prose result tiers. Its middle Axe tier specifies four damage and push three. It also has a movement-related trait, minion-specific targeting, and a captain-related modifier.

An illustrative parse of that result tier is:

```text
sequence
  damage(amount = 4)
  push(distance = 3)
```

This is a fragment of an executable definition, not a resolved outcome or a complete implementation of Axe. Target binding, minion mechanics, modifiers, forced-movement rules, sequencing, and available spatial facts still determine execution. Their definitions must come from the relevant rules sections.

The [Goblin Malice source](https://github.com/SteelCompendium/data-unified/blob/fb83a789da8f0327a389c277a0c790b1648d5810/en/unified/json/monster/goblin/goblin-malice.json) illustrates other construction types: a timed speed bonus for a selected group, damage based on an adjacency count, and a terrain effect with conditional outcomes. These are candidates for later grammar and runtime scenarios, not verified supported features.

These two records were inspected at revision `fb83a789da8f0327a389c277a0c790b1648d5810`. This is a reproducible sample, not an audit of corpus coverage or confirmation of the latest official errata.

## Homebrew behavior

A new stat block using supported syntax and supported compositions should compile without monster-specific code. Changing a numeric parameter should not require implementing another ability. Combining mechanics can still introduce sequencing or dependency cases that need engine support.

Show an author which clause is unsupported or ambiguous. Preserve the text, but do not silently ignore it, execute a partial ability as though complete, or invent a meaning. Distinguish unsupported wording, unsupported mechanics, ambiguous interpretation, and missing encounter facts.

Partial support is also a normal play mode: show the full ability and the effects actually handled, then let the table complete or correct the remaining mechanics through recorded manual operations. An ability can be available for manual use while unsupported for full automation. Preserve dependencies and distinguish completed effects from outstanding work. Improving the parser should reduce that manual work without changing how clients access the original text or recorded history.

Unusual official mechanics may need an explicit extension implemented once and referenced by content. Report these honestly; do not claim that every special case can already be expressed through a handful of generic effects.

## First proof of feasibility

Build a small runnable importer and interpreter before the complete app or a large parser framework. Choose a handful of related stat blocks, their referenced core mechanics, and deliberately unsupported examples. The exact subset is still to be selected.

Demonstrate that:

- A real supported ability resolves correctly with explicit dice, targets, and state.
- A new homebrew variant using that grammar works without a name-specific implementation branch.
- Missing spatial information produces an explicit requirement or table instruction.
- An unfamiliar mechanical clause produces a useful diagnostic and does not silently succeed.
- A meaningful combination or exception is exercised, so the demonstration goes beyond numeric extraction.

Generate a compact report of executable abilities and unsupported clauses. Expand the most reusable missing constructions based on actual corpus evidence. Count parsed documents separately from fully executable abilities.

Use the report and behavior examples to guide work. Do not require hand-maintained certificates, per-monster approval records, or tests asserting only that a citation exists.
