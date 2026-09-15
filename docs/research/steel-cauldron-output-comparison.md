# Steel Cauldron: generated undead output comparison

Research: 2026-09-15. User-authorized comparison of generated output, not a new rules source.

## Purpose and reuse boundary

The user confirmed that Steel Cauldron is an example of another working tool, not code to adapt
directly without a clear license. Study its observable behavior and generated stat blocks as a
completeness cross-check. Do not copy its application code, styles or importer into this project.
Our implementation and expected rules content come from our specifications and pinned Compendium.
Keep third-party comparison output separate from authoritative fixtures and production content.

The earlier license inspection found no explicit software license file or GitHub-detected license;
the site's About source describes it as open source and cites the Draw Steel Creator License.
That does not establish a specific software reuse grant for our purposes. This records the user's
working boundary, not a legal determination about every file.

## Material inspected

- Public project: [Steel Cauldron repository](https://github.com/erik-meier/monster-library).
- Comparison revision: `eba4b8bb8bc1baf947f15e67e9e923951092fd89`.
- Eleven generated JSON files in that revision's `data/monsters/`: Crawling Claw, Decrepit Skeleton,
  Ghost, Ghoul, Rotting Zombie, Shade, Skeleton, Soulwight, Specter, Umbral Stalker and Zombie.
- Generated `data/malice/undead-malice.json` at that same revision.
- Authority for our expected content: Compendium pin `fb83a789da8f0327a389c277a0c790b1648d5810`,
  `en/unified/json/monster/undead/1st-echelon/` and corresponding Markdown. The previous
  [core inventory](foe-catalog-kickoff.md) checked the book-specific population.

External files were read into temporary research storage, not added to our source package or fixtures.
This is a generated-data comparison, not a screenshot/rendering audit or proof of the live site's
deployed revision. Our undead importer has not been implemented yet; the comparison is against
our pinned source and agreed data requirements, not claimed generated app output.

## Observations

All eleven generated monsters have the same ordered feature names/counts as our pinned source:
**23 abilities and 13 traits**. All **110** checked baseline values agree after comparing number/string
representations: size, speed, Stamina, stability, free strike and the five characteristics.
Their separate undead Malice file includes the same four named features.

Comparison normalized Markdown link labels, display HTML/entities, whitespace around potency operators
and the roll-label spelling. Across the 36 embedded features, 181 of 185 compared source fields matched
after this normalization. The other four comparisons were three empty-keyword representations
(`null` versus a list containing a dash) and a difference in how Zombie Dust divides its effect and
roll into JSON objects. Those are representation differences, not observed missing rules text.

A second check compared the collection of effect-text, roll and tier fields for all **40 features**
(36 embedded plus four Malice): all matched after presentation normalization, including Zombie Dust's
split representation. That check ignores object grouping and ordering; it is not a substitute for
full-section and source-order validation. The Malice output omits some duplicate source fields such
as `body`, `intro` and `sections`, while retaining the compared content in `effects`.

Both projects draw from the Compendium ecosystem. Agreement is useful cross-checking, not independent
confirmation that a rule is correct. No conclusion about unrelated monsters follows from this sample.

## Useful completeness examples

| Generated example | Observed retained content | Our acceptance case |
| --- | --- | --- |
| [Skeleton](https://github.com/erik-meier/monster-library/blob/eba4b8bb8bc1baf947f15e67e9e923951092fd89/data/monsters/skeleton.json) | Both abilities, the Arise trait and paragraphs after tier results | Complete sections must survive beyond their numeric outcomes. |
| [Ghost](https://github.com/erik-meier/monster-library/blob/eba4b8bb8bc1baf947f15e67e9e923951092fd89/data/monsters/ghost.json) | Optional spending, triggered-action trigger, three villain labels, long post-roll text and two traits | Distinguish labels, triggers and extra sections without discarding any of them. |
| [Zombie](https://github.com/erik-meier/monster-library/blob/eba4b8bb8bc1baf947f15e67e9e923951092fd89/data/monsters/zombie.json) | Introductory effect before a roll and a longer-lived consequence after an attack | Preserve full text and source order; do not flatten everything into three tiers. |
| [Decrepit Skeleton](https://github.com/erik-meier/monster-library/blob/eba4b8bb8bc1baf947f15e67e9e923951092fd89/data/monsters/decrepit-skeleton.json) | Captain benefit, per-minion target wording, extra effect and death trait | Preserve contextual fields and targets alongside the ordinary stat table. |
| [Undead Malice](https://github.com/erik-meier/monster-library/blob/eba4b8bb8bc1baf947f15e67e9e923951092fd89/data/malice/undead-malice.json) | Four group features, variable spending label, target-test text and follow-up effect | Supporting features need their own records and links, rather than disappearing outside creature files. |

## Additional requirements for our format

The inspected generated files carry embedded feature objects but no per-feature IDs. Their source
metadata names a book/license but lacks the SCC and pinned revision we retain. Some effect strings
contain display HTML. All four minion files store numeric EV without its original per-four quantity
text; this observation does not establish how the application calculates or displays minion EV.

Our format must additionally preserve independent feature identities, source-qualified provenance,
raw source text, EV quantity basis and a separation between content and themed presentation. A visible
dash should not become a real searchable keyword. Differences in these data choices should inform our
tests rather than prompt adoption of the external schema or unverified corrections to our source.

## How to use this during the first slice

Build our importer from the pinned source. Derive expected text/fields from that source, including the
examples above. Compare our generated records against source, and optionally inspect both tools'
rendered versions for missing visible sections. Verify lookup/search/sharing references and themed
views independently. Record any discrepancy as extraction, presentation, source-version difference or
unresolved evidence before changing data. External output is a secondary comparison, never a replacement
for the source or proof that engine behavior works.
