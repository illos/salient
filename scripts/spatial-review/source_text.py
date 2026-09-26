"""Read excerpts directly from the single pinned Compendium checkout."""
import re
from pathlib import Path

SOURCE_ROOT = Path('/srv/presidium/projects/salient/code/vendor/steel-compendium/en/unified/md')


def normalized(text):
    text = re.sub(r'\[([^]]+)\]\([^)]*\)', r'\1', text)
    return re.sub(r'[^a-z0-9]+', '', text.lower())


def excerpt(source, section):
    path = (SOURCE_ROOT / source).resolve()
    if not path.is_relative_to(SOURCE_ROOT) or not path.is_file():
        raise ValueError(f'Invalid Compendium source: {source}')
    raw = path.read_text()
    body = re.sub(r'\A---\n.*?\n---\n', '', raw, count=1, flags=re.S).strip()
    # Hero files are individual features/abilities. Keep the full authored body,
    # including costs, tiers and linked clauses, rather than the audit summary.
    if not source.startswith('monster/'):
        return body
    wanted = normalized(section.split(' / ')[-1])
    lines = body.splitlines(keepends=True)
    headings = []
    for index, line in enumerate(lines):
        heading = re.match(r'^(#{1,6})\s+(.+?)\s*$', line)
        callout = re.match(r'^>\s*[^\w*]*\*\*([^:]+?)\*\*\s*$', line)
        if heading:
            headings.append((index, len(heading[1]), heading[2], 'heading'))
        elif callout:
            headings.append((index, 7, callout[1], 'callout'))
    exact = [h for h in headings if normalized(h[2]) == wanted]
    if not exact:
        # Audit labels occasionally omit printed cost/signature suffixes.
        exact = [h for h in headings if normalized(re.sub(r'\s*\([^)]*\)', '', h[2])) == normalized(re.sub(r'\s*\([^)]*\)', '', section.split(' / ')[-1]))]
    if len(exact) != 1:
        raise ValueError(f'Expected one source section: {source} § {section}; found {len(exact)}')
    start, level, _, kind = exact[0]
    end = len(lines)
    if kind == 'callout':
        following = [h[0] for h in headings if h[0] > start]
        if following:
            end = min(following)
        for index in range(start+1, end):
            if lines[index].strip() and not lines[index].startswith('>'):
                end = index
                break
    else:
        for index, next_level, _, next_kind in headings:
            if index > start and next_kind == 'heading' and next_level <= level:
                end = index
                break
    result = ''.join(lines[start:end]).strip()
    if not result:
        raise ValueError(f'Empty source section: {source} § {section}')
    return result
