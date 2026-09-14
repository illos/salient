#!/usr/bin/env python3
"""Generate a pinned-source inventory, never a rules evaluator or a coverage certificate.

Run from any directory with Python 3. --check compares the committed artifacts.
Reads upstream files/Git objects without executing Forge Steel or changing either pin.
"""
import argparse
import collections
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
COMP = ROOT / "vendor/steel-compendium"
FORGE = ROOT / "vendor/forge-steel"
CORE = ["censor", "conduit", "elementalist", "fury", "null", "shadow", "tactician", "talent", "troubadour"]
CATEGORIES = {"ancestry", "culture", "career", "kit", "perk", "complication", "skill", "religion", "class", "feature"}


def git(repo, *args):
    return subprocess.check_output(["git", "-C", str(repo), *args], text=True).strip()


def plain(s):
    return re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s)


def field(md, name):
    front = md.split("---", 2)[1]
    match = re.search(r"^" + re.escape(name) + r":\s*(.+)$", front, re.M)
    return match.group(1).strip().strip("\"'") if match else None


def source(slug):
    path = COMP / "en/unified/md" / (slug + ".md")
    md = path.read_text()
    if not (field(md, "scc") or "").startswith("mcdm.heroes.v1/"):
        md = git(COMP, "show", "HEAD:en/books/heroes/md/" + slug + ".md")
        location = "vendor/steel-compendium@" + git(COMP, "rev-parse", "HEAD") + ":en/books/heroes/md/" + slug + ".md"
    else:
        location = str(path.relative_to(ROOT))
    return md, location


def ref(slug):
    md, location = source(slug)
    result = {"name": field(md, "name"), "scc": field(md, "scc"), "source": location}
    if not result["scc"]:
        raise ValueError("Missing SCC: " + slug)
    for key in ["class", "subclass", "ancestry", "kit", "level", "cost", "ability_type"]:
        value = field(md, key)
        if value is not None:
            result[key] = value
    return result


def link(row):
    path = row["source"]
    return f'[{row["name"]}](../../{path})' if "@" not in path else row["name"] + " (book-specific Git source)"


def render():
    paths = git(COMP, "ls-tree", "-r", "--name-only", "HEAD", "en/books/heroes/json").splitlines()
    slugs = sorted(p.removeprefix("en/books/heroes/json/").removesuffix(".json") for p in paths if p.endswith(".json") and p.split("/")[4] in CATEGORIES)
    records = []
    for slug in slugs:
        category = slug.split("/")[0]
        row = {"category": category, **ref(slug)}
        if category in {"career", "religion", "kit"}:
            data = json.loads((COMP / ("en/unified/json/" + slug + ".json")).read_text())
            keys = {"career": ["skills", "language", "perk", "renown", "wealth", "project_points"],
                    "religion": ["domains", "patron"],
                    "kit": ["kit_type", "equipment_text", "stamina_bonus", "speed_bonus", "stability_bonus",
                            "melee_damage_bonus", "ranged_damage_bonus", "melee_distance_bonus", "ranged_distance_bonus", "disengage_bonus"]}[category]
            row["sourceFields"] = {k: data[k] for k in keys if k in data}
        records.append(row)
    counts = dict(sorted(collections.Counter(r["category"] for r in records).items()))
    classes = []
    for slug in CORE:
        d = json.loads((COMP / f"en/unified/json/class/{slug}.json").read_text())
        md, _ = source("class/" + slug)
        rows = []
        for line in md.splitlines():
            if not re.match(r"\|\s*\d+(?:st|nd|rd|th)\s*\|", line):
                continue
            cells = [x.strip() for x in line.strip().strip("|").split("|")]
            rows.append({"level": int(re.search(r"\d+", cells[0]).group()),
                         "sourceCells": cells[1:],
                         "references": re.findall(r"scc\.v1:([^\s)]+)", line)})
        if [r["level"] for r in rows] != list(range(1, 11)):
            raise ValueError("Unexpected advancement table: " + slug)
        forge_path = f"src/data/classes/{slug}/{slug}.ts"
        forge_text = (FORGE / forge_path).read_text()
        branch_files = sorted(p for p in (FORGE / f"src/data/classes/{slug}").glob("*.ts") if p.stem != slug)
        branches = []
        for p in branch_files:
            s = p.read_text()
            match = re.search(r"\n\s*name: '([^']+)'", s)
            branches.append({"name": match.group(1), "source": str(p.relative_to(ROOT))})
        classes.append({"slug": slug, **ref("class/" + slug),
                        "sourceBasics": {k: d[k] for k in ["primary_characteristics", "starting_stamina", "stamina_per_level", "recoveries", "weak_potency", "average_potency", "strong_potency", "skills"]},
                        "forgeSource": "vendor/forge-steel/" + forge_path,
                        "forgeSubclassCount": int(re.search(r"subclassCount: (\d+)", forge_text).group(1)),
                        "forgeBranchReferences": branches, "advancement": rows})
    # Source headings can hold real options that have no standalone entry/SCC.
    embedded = []
    for slug in slugs:
        if not slug.startswith("feature/trait/"):
            continue
        md, location = source(slug)
        for name, cost in re.findall(r"^#+ (.+?) \((\d+) Points?\)\s*$", md, re.M):
            embedded.append({"name": name, "cost": int(cost), "parentScc": field(md, "scc"), "source": location,
                             "section": name + f" ({cost} Points)", "identity": "source-section; not a new SCC"})
    clean = git(COMP, "show", "HEAD:en/books/heroes/clean/Draw Steel Heroes.md")
    section_tables = []
    for heading in ["Vaslorian Human Languages Table", "Languages by Ancestry Table"]:
        match = re.search(r"^###### " + re.escape(heading) + r"\n(.*?)(?=^#|\Z)", clean, re.M | re.S)
        if not match:
            raise ValueError("Missing source table: " + heading)
        rows = [[plain(x.strip()) for x in line.strip().strip("|").split("|")]
                for line in match.group(1).splitlines() if line.startswith("|") and not re.match(r"\|[ -]+\|", line)]
        section_tables.append({"heading": heading, "parentScc": "mcdm.heroes.v1/chapter/background",
                               "source": "en/books/heroes/clean/Draw Steel Heroes.md", "columns": rows[0], "rows": rows[1:]})
    all_source_sccs = set()
    for p in (COMP / "en/unified/md").rglob("*.md"):
        s = p.read_text()
        if s.startswith("---"):
            all_source_sccs.add(field(s, "scc"))
    unresolved = sorted({s for c in classes for row in c["advancement"] for s in row["references"] if s not in all_source_sccs})
    output = {"purpose": "Source inventory only. Counts, metadata and advancement cells are not evaluated decision definitions, reviewed effects or implemented support.",
              "compendiumRevision": git(COMP, "rev-parse", "HEAD"), "forgeRevision": git(FORGE, "rev-parse", "HEAD"),
              "scope": "Heroes book categories listed in categoryCounts. Core scope comes from the book-specific Git tree, not all unified records.",
              "categoryCounts": counts, "classes": classes, "records": records, "languageSourceTables": section_tables,
              "embeddedTraitOptions": embedded, "unresolvedAdvancementReferences": unresolved,
              "limits": ["Forge branch names are structural references, not SCC mappings or validated rules.",
                         "Preserved sourceFields are extraction evidence, not normalized rules. Stormwight kits are labeled Martial in kit_type; their real eligibility and bonuses require the Fury sections.",
                         "A class ability's presence does not prove eligibility for a choice pool.",
                         "Embedded choices, languages, domain portfolios and option timing require the companion contracts and source context.",
                         "Source inventory is not exhaustive semantic review of every ability, perk or complication."]}
    lines = ["# V1 wizard core source matrix", "", "Generated by `python3 docs/research/build-v1-wizard-index.py`; verify with `--check`.", "",
             "**Source inventory, not implementation or rules certification.** Read [the V1 contracts](../v1-character-wizard-contracts.md) for interpreted behavior, examples and unresolved decisions.", "",
             f'Compendium `{output["compendiumRevision"]}`; Forge Steel `{output["forgeRevision"]}`.', "",
             "Core membership is selected from the pinned Heroes book tree. Every row retains its full SCC and source path in [the JSON index](v1-wizard-source-index.json).", "",
             "## Coverage denominators", "", "| Source category | Records |", "| --- | ---: |"]
    lines += [f"| {k} | {v} |" for k, v in counts.items()]
    lines += ["", "The 25 kits are 21 ordinary kits and four Stormwight kits. Skill records include skill-group entries; feature records include abilities, ancestry traits and parent sections. These are source-record counts, not player-choice counts. The 90 class/level rows below require individual acceptance evidence before being called supported.", "",
              "## All ancestries and trait budgets", "", "Budgets and exceptions are interpreted in the companion contracts. Here, costs reproduce metadata and retain the parent entries so missing metadata cannot silently remove an option.", ""]
    for ancestry in [r for r in records if r["category"] == "ancestry"]:
        slug = ancestry["scc"].split("/")[-1]
        traits = [r for r in records if r["scc"].startswith("mcdm.heroes.v1/feature.trait." + slug + "/")]
        lines += [f'### {ancestry["name"]}', "", "| Trait/source section | Printed cost |", "| --- | --- |"]
        lines += [f'| {link(r)} | {r.get("cost", "—; read signature/parent text")} |' for r in traits]
        lines += [f'| {link(r)} — embedded section | {r["cost"]} points |' for r in embedded if "/" + slug + "/" in r["source"]]
        lines.append("")
    lines += ["## Class-by-level source requirements", "", "Rows preserve the advancement table's **cumulative ability columns**; they must not be interpreted as granting every listed ability again at each level. Feature entries and actual selection paragraphs establish each transition.", ""]
    for c in classes:
        lines += [f'### {c["name"]}', "", f'Source: {link(c)}. Forge branch reference: ' + (", ".join(b["name"] for b in c["forgeBranchReferences"]) or "no SubClass objects; inspect domain choices") + ".", "",
                  "| Level | Features in source table | Cumulative ability columns |", "| --- | --- | --- |"]
        for row in c["advancement"]:
            cells = [plain(x).replace("|", "\\|") for x in row["sourceCells"]]
            lines.append(f'| {row["level"]} | {cells[0]} | {"; ".join(cells[1:])} |')
        lines.append("")
    lines += ["## Other selectable source records", "", "Each entry needs a grant/choice contract and verification appropriate to its effects. Source availability alone is the current generated status.", ""]
    for category in ["culture", "career", "kit", "perk", "complication", "religion"]:
        lines += [f"### {category.title()}", "", "; ".join(link(r) for r in records if r["category"] == category) + ".", ""]
    lines += ["## Printed deity and saint portfolios", "", "These reproduce each religion record's domains; do not impose a uniform four-domain limit or substitute a saint's patron's full portfolio.", "",
              "| Deity or saint | Printed domains |", "| --- | --- |"]
    lines += [f'| {link(r)} | {", ".join(r["sourceFields"].get("domains", [])) or "not extracted; inspect source"} |'
              for r in records if r["category"] == "religion"]
    lines += ["", "## Language source tables", "", "Caelian's common grant is in Culture Benefits. The remaining table-defined language identities below use the Background chapter plus named section; they have no standalone SCC. Source: pinned Heroes clean text.", ""]
    for table in section_tables:
        lines += ["### " + table["heading"], "", "| " + " | ".join(table["columns"]) + " |",
                  "| " + " | ".join("---" for _ in table["columns"]) + " |"]
        lines += ["| " + " | ".join(row) + " |" for row in table["rows"]]
        lines.append("")
    lines += ["## Extraction gaps", "", "Unresolved advancement SCC references: " + (", ".join(unresolved) or "none") + ".", "",
              "Embedded purchased-trait sections detected: " + ", ".join(r["name"] for r in embedded) + ". These must remain selectable even without standalone SCC records.", "",
              "Languages and domain portfolios also occur inside book sections/tables; they are not represented by a `language/` or `domain/` directory in this pin. See the companion contracts. The matrix intentionally does not assign a semantic-review or implementation pass to any source record.", ""]
    return {"v1-wizard-source-index.json": json.dumps(output, ensure_ascii=False, indent=2) + "\n",
            "v1-wizard-coverage-matrix.md": "\n".join(lines)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    for name, content in render().items():
        path = Path(__file__).parent / name
        if args.check:
            if not path.exists() or path.read_text() != content:
                raise SystemExit("Out of date: " + str(path))
        else:
            path.write_text(content)
        print(("Verified " if args.check else "Generated ") + name)
