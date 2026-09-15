# Official pregenerated character PDFs

Inspected 2026-09-15 at the user's request:
[MCDM Draw Steel resources](https://www.mcdmproductions.com/draw-steel-resources).
The user suggested completed sheets as possible early character-wizard parity milestones.
This is an evaluation of supplied examples, not a change to the pinned Compendium's authority
for rules research. No broader online rules research was performed.

## Available examples

The Pregen Characters section links nine two-page PDFs, one per core class:

| Example | Download |
| --- | --- |
| Dwarf Fury | [PDF](https://files.mcdmproductions.com/DrawSteel/DwarfFury.pdf) |
| High Elf Tactician | [PDF](https://files.mcdmproductions.com/DrawSteel/HighElfTactician.pdf) |
| Human Censor | [PDF](https://files.mcdmproductions.com/DrawSteel/HumanCensor.pdf) |
| Human Null | [PDF](https://files.mcdmproductions.com/DrawSteel/HumanNull.pdf) |
| Human Talent | [PDF](https://files.mcdmproductions.com/DrawSteel/HumanTalent.pdf) |
| Orc Conduit | [PDF](https://files.mcdmproductions.com/DrawSteel/OrcConduit.pdf) |
| Polder Elementalist | [PDF](https://files.mcdmproductions.com/DrawSteel/PolderElementalist.pdf) |
| Polder Shadow | [PDF](https://files.mcdmproductions.com/DrawSteel/PolderShadow.pdf) |
| Wode Elf Troubadour | [PDF](https://files.mcdmproductions.com/DrawSteel/WodeElfTroubadour.pdf) |

All nine have an unfilled Level field. They appear to be starter builds, but verify the intended
level from their choices and pinned rules before creating a level-one fixture. Do not confuse
the printed Wealth value with Level when extracting text: PDF reading order puts some values
far from their labels. A rendered Dwarf Fury page was inspected, and each PDF's Level region
and corresponding empty form field were checked programmatically.

There are no Beastheart or Summoner pregens in that section at inspection. The same resource page
links their dedicated blank sheets and a Minion Tracker; these are potential later UI references,
not completed character examples inspected here.

## Recommended use

Treat these as independent examples to reconstruct through actual wizard choices. They are useful
even at starting level because they combine ancestry, culture, career, class, subclass, equipment,
skills, languages, abilities and derived values in one recognizable result.

An early comparison milestone should:

1. Record the PDF's stated selections and totals independently of the evaluator. Identify any
   missing choices or assumptions, including the intended level.
2. Trace choices and grants against the pinned Compendium, using Forge Steel to understand choice
   structure. Investigate discrepancies; do not change rules calculations merely to match a PDF.
3. Build the character through normal UI and equivalent headless operations, then save and reopen.
4. Compare supported characteristics, Stamina/Recoveries, movement values, skills/languages,
   features and abilities. Compare adjusted ability values carefully: sheets can already include
   bonuses, so the app must not apply them twice.
5. Record a supported match, an explained source/version difference, or an unresolved mismatch.
   Distinguish missing PDF information from missing editor support. Do not call an unresolved
   numerical mismatch a parity pass.

Start with Fury and Elementalist as their slices become available, then Conduit and Tactician,
and eventually all nine. Reconstructing these exact examples needs ancestry/background coverage
beyond the current Devil/Soldier prototype, so they should not silently enlarge the first bounded
Elementalist slice. This is functional character parity, not a requirement to copy the PDF layout.

These examples supplement the eleven-class coverage plan. They do not cover every subclass,
higher-level transition, progression restoration, supplemental class, or file interchange. Create
additional source-backed cases for those. A PDF is not a Forge Steel hero-data file and cannot
prove import/export compatibility.

## Provenance and verification

[The manifest](official-pregen-pdfs.json) retains official URLs, inspection date, page counts,
blank-level observations and SHA-256 fingerprints of the downloaded files. Future checks should
identify a changed file before comparing results. These fingerprints identify example versions;
they do not establish rules correctness.

All nine PDFs were downloaded for inspection to a temporary local directory; the PDFs and rendered
image are not committed or redistributed as application assets. The repository retains the links
and inspection metadata. No recreation fixtures, application behavior or passing parity tests are
claimed by this note. The PDFs' complete build legality and all printed totals have not been audited.
