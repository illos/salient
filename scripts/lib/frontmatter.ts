// SPDX-License-Identifier: GPL-3.0-only
/**
 * Strict parser for the YAML subset the pinned Compendium uses in Markdown frontmatter: block maps,
 * block sequences (scalars or maps), plain / single-quoted / double-quoted scalars and the empty flow
 * list `[]`. Anything else throws, so an unfamiliar construct can never be read as the wrong value.
 * scripts/build-content.ts additionally cross-checks every parsed key against the entry's JSON twin.
 */

export type FrontmatterValue =
  string | number | boolean | null | FrontmatterValue[] | { [key: string]: FrontmatterValue };

export interface SplitDocument {
  /** The frontmatter lines between the `---` markers, without the markers. */
  frontmatter: string;
  /** Everything after the closing `---` line, byte-exact. */
  body: string;
}

/** Splits `---\n...\n---\n` frontmatter from the body. Throws when the file has no frontmatter. */
export function splitFrontmatter(raw: string): SplitDocument {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!match) throw new Error('File has no YAML frontmatter.');
  return { frontmatter: match[1], body: match[2] };
}

const KEY = /^([A-Za-z_][A-Za-z0-9_-]*):(?: (.*)|)$/;

const SIMPLE_ESCAPES: Record<string, string> = {
  '"': '"',
  '\\': '\\',
  '/': '/',
  n: '\n',
  t: '\t',
  r: '\r',
  b: '\b',
  f: '\f',
  '0': '\0',
  ' ': ' ',
};

/** YAML double-quoted escapes: the JSON set plus `\x..`, `\u....` and `\U........` code points. */
function unescapeDoubleQuoted(inner: string, line: number): string {
  return inner.replace(
    /\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8}|.)/gs,
    (whole, sequence: string) => {
      if (/^[xuU]/.test(sequence) && sequence.length > 1)
        return String.fromCodePoint(parseInt(sequence.slice(1), 16));
      const simple = SIMPLE_ESCAPES[sequence];
      if (simple === undefined) throw new Error(`Line ${line}: unsupported escape ${whole}.`);
      return simple;
    },
  );
}

function scalar(text: string, line: number): FrontmatterValue {
  const value = text.trim();
  if (value === '') return null;
  if (value === '[]') return [];
  if (value.startsWith("'")) {
    if (!value.endsWith("'") || value.length < 2)
      throw new Error(`Line ${line}: unterminated single-quoted scalar.`);
    const inner = value.slice(1, -1);
    if (/'(?!')/.test(inner.replace(/''/g, '')))
      throw new Error(`Line ${line}: stray quote inside single-quoted scalar.`);
    return inner.replace(/''/g, "'");
  }
  if (value.startsWith('"')) {
    if (!/^"(?:[^"\\]|\\.)*"$/s.test(value))
      throw new Error(`Line ${line}: unterminated double-quoted scalar.`);
    return unescapeDoubleQuoted(value.slice(1, -1), line);
  }
  if (/^[[{&*!|>%@`]/.test(value))
    throw new Error(`Line ${line}: unsupported YAML indicator in "${value.slice(0, 20)}".`);
  if (value.includes(': ') || value.endsWith(':'))
    throw new Error(`Line ${line}: plain scalar contains a mapping indicator.`);
  if (/ #/.test(value)) throw new Error(`Line ${line}: comments are not supported.`);
  if (/^-?\d+$/.test(value)) return Number(value);
  if (/^-?\d+\.\d+$/.test(value)) return Number(value);
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return null;
  return value;
}

interface Line {
  number: number;
  indent: number;
  text: string;
}

/** Parses frontmatter text into a plain object. Keys keep their source order. */
export function parseFrontmatter(source: string): Record<string, FrontmatterValue> {
  const lines: Line[] = source.split('\n').map((raw, index) => {
    if (raw.trim() === '') throw new Error(`Line ${index + 1}: blank lines are not supported.`);
    if (/\t/.test(raw)) throw new Error(`Line ${index + 1}: tabs are not supported.`);
    const indent = raw.length - raw.trimStart().length;
    return { number: index + 1, indent, text: raw.slice(indent) };
  });
  let position = 0;

  function parseMap(indent: number): Record<string, FrontmatterValue> {
    const result: Record<string, FrontmatterValue> = {};
    while (position < lines.length && lines[position].indent === indent) {
      const line = lines[position];
      if (line.text.startsWith('- ') || line.text === '-')
        throw new Error(`Line ${line.number}: sequence item where a mapping key was expected.`);
      const match = KEY.exec(line.text);
      if (!match) throw new Error(`Line ${line.number}: cannot parse "${line.text}".`);
      const [, key, rest] = match;
      if (key in result) throw new Error(`Line ${line.number}: duplicate key "${key}".`);
      position += 1;
      if (rest === undefined || rest === '') {
        const next = lines[position];
        if (!next || next.indent <= indent) {
          result[key] = null;
          continue;
        }
        result[key] = next.text.startsWith('- ')
          ? parseSequence(next.indent)
          : parseMap(next.indent);
      } else result[key] = scalar(rest, line.number);
    }
    if (position < lines.length && lines[position].indent > indent)
      throw new Error(`Line ${lines[position].number}: unexpected indentation.`);
    return result;
  }

  function parseSequence(indent: number): FrontmatterValue[] {
    const result: FrontmatterValue[] = [];
    while (position < lines.length && lines[position].indent === indent) {
      const line = lines[position];
      if (!line.text.startsWith('- '))
        throw new Error(`Line ${line.number}: expected a sequence item.`);
      const item = line.text.slice(2);
      const itemIndent = indent + 2;
      if (KEY.test(item)) {
        // A mapping whose first key shares the dash line; the rest are indented by two.
        position += 1;
        const [, key, rest] = KEY.exec(item)!;
        const first: Record<string, FrontmatterValue> = {};
        if (rest === undefined || rest === '') {
          const next = lines[position];
          if (next && next.indent > itemIndent)
            first[key] = next.text.startsWith('- ')
              ? parseSequence(next.indent)
              : parseMap(next.indent);
          else first[key] = null;
        } else first[key] = scalar(rest, line.number);
        const more =
          position < lines.length && lines[position].indent === itemIndent
            ? parseMap(itemIndent)
            : {};
        for (const key of Object.keys(more))
          if (key in first) throw new Error(`Line ${line.number}: duplicate key "${key}".`);
        result.push({ ...first, ...more });
      } else {
        position += 1;
        result.push(scalar(item, line.number));
        if (position < lines.length && lines[position].indent > indent)
          throw new Error(`Line ${lines[position].number}: unexpected indentation.`);
      }
    }
    return result;
  }

  if (!lines.length) return {};
  if (lines[0].indent !== 0) throw new Error('Line 1: frontmatter must start at column 0.');
  const result = parseMap(0);
  if (position < lines.length)
    throw new Error(`Line ${lines[position].number}: unexpected content.`);
  return result;
}
