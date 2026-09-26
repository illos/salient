"""Render the authored audit into a standalone, offline-capable review document."""
import hashlib
import json
import re
import sys
from pathlib import Path
from source_text import excerpt

ROOT = Path(__file__).resolve().parents[2]
rows = []

def clean(s):
    return s.replace('**', '').replace('`', '').strip()

def add(name, owner, scope, category, source, section, fact, timing, remainder, evidence):
    key = '|'.join([owner, name, source, section, category])
    rows.append(dict(id=hashlib.sha256(key.encode()).hexdigest()[:20], name=clean(name), owner=clean(owner), scope=scope, category=category, source=source, section=clean(section), fact=clean(fact), timing=clean(timing), remainder=clean(remainder), evidence=clean(evidence)))

hero = (ROOT / 'docs/research/spatial-effect-triage-heroes.md').read_text()
category = 'Core candidates'
for line in hero.splitlines():
    if line.startswith('#'):
        if 'boundary' in line.lower() and line.startswith('## '): category = 'Boundary cases'
        if line.startswith('## Supporting sources'): category = 'Source exposure unproved'
        if line.startswith('### Existing lightweight'): category = 'Existing input controls'
    if not line.startswith('| **'): continue
    cells = [x.strip() for x in line.strip('|').split('|')]
    if len(cells) == 4: cells = cells[:3] + ['See source timing', cells[3], 'Source exposure unproved; no runtime claim']
    if len(cells) != 6: raise ValueError(line)
    match = re.search(r'\*\*(.*?)\*\*.*?`([^`]+)`', cells[0])
    if not match: raise ValueError(line)
    name, source = match.groups()
    cat = category
    if 'existing' in cells[5].lower() and ('claim' in cells[5].lower() or 'exclude' in cells[5].lower() or 'accept' in cells[5].lower()): cat = 'Existing input controls'
    add(name, 'Hero / supporting option', 'Heroes', cat, source, cells[1], *cells[2:])

monster = (ROOT / 'docs/research/spatial-effect-triage-monsters.md').read_text()
core = monster.split('## Strict core appendix', 1)[1].split('## Source of Earth', 1)[0]
category = 'Core candidates'
for block in re.split(r'(?m)^#### ', core):
    if '## Secondary appendix' in block: next_category = 'Boundary cases'
    else: next_category = category
    fact = re.search(r'\*\*Unknown fact:\*\*(.*?)\*\*Timing/input burden:\*\*(.*?)\*\*Deterministic portion:\*\*(.*?)(?:\n\n|$)', block, re.S)
    for match in re.finditer(r'- \*\*(V1|Other catalog) — (.*?)\*\*: `([^`]+)` § \*\*(.*?)\*\*', block):
        scope, owner, source, section = match.groups()
        details = fact.groups() if fact else ('See audited context: '+clean(block.split('\n\n')[1]), 'See source section', 'No automation claim')
        add(section, owner, 'V1 monsters' if scope == 'V1' else 'Other monsters', category, source, section, *details, 'Imported catalog; proposed scope is not runtime support. See full monster audit.')
    category = next_category
extension = monster.split('### Additional strict-core candidates', 1)[1].split('### Full 37-record', 1)[0]
for block in re.split(r'(?m)^#### ', extension)[1:]:
    title = block.splitlines()[0]
    match = re.search(r'`([^`]+)` § \*\*(.*?)\*\*', block)
    fact = re.search(r'\*\*Unknown fact:\*\*(.*?)\*\*Timing/input burden:\*\*(.*?)\*\*Deterministic portion:\*\*(.*)', block, re.S)
    if not match or not fact: raise ValueError(title)
    source, section = match.groups()
    add(section, title.split(' — ')[0], 'Summoner minions', 'Core candidates', source, section, *fact.groups(), 'Imported supporting statblock. Summoned actor automation has independent manual limitations.')


context = monster.split('## Related monster group context',1)[1].split('## Borderline exclusions',1)[0]
for line in context.splitlines():
    match = re.match(r'- \*\*(V1|Other catalog) — (.*?)\*\*, `([^`]+)` § \*\*(.*?)\*\*:(.*)', line)
    if not match: continue
    scope, owner, source, section, detail = match.groups()
    fields = re.search(r'\*\*Unknown fact:\*\*(.*?)\*\*Timing/input burden:\*\*(.*?)\*\*Deterministic portion:\*\*(.*)', detail)
    details = fields.groups() if fields else (detail, 'See clause-specific timing above', 'See clause-specific remainder above')
    category = 'Boundary cases' if section == 'Defensive Traits / Stench (2 Points)' else 'Core candidates'
    add(section, owner, 'V1 monsters' if scope == 'V1' else 'Other monsters', category, source, section, *details, 'Group context; applies only when selected. Source evidence, not runtime proof.')

# Keep distinct clauses from the same source; identical repeats get one review field.
unique = {}
for row in rows:
    if row['id'] in unique and unique[row['id']] != row: raise ValueError('Conflicting duplicate: '+row['name'])
    unique[row['id']] = row
rows = list(unique.values())
for row in rows:
    row['sourceText'] = excerpt(row['source'], row['section'])
data = json.dumps({'version':'V234', 'entries':rows}, ensure_ascii=False).replace('<','\\u003c')
out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
(out / 'index.html').write_text((Path(__file__).with_name('template.html')).read_text().replace('__AUDIT_DATA__', data))
for name in ['spatial-effect-triage.md','spatial-effect-triage-heroes.md','spatial-effect-triage-monsters.md']:
    (out / name).write_text((ROOT / 'docs/research' / name).read_text())
print(f'Rendered {len(rows)} entries to {out / "index.html"}')
