// SPDX-License-Identifier: GPL-3.0-only
/**
 * Validates a commit message against docs/build/README.md#commit-format.
 *
 *   node scripts/check-commit.ts [--merge] [<message file>]   message from a file or stdin (commit-msg hook)
 *   node scripts/check-commit.ts [--merge] --rev <commit>     message and tree of an existing commit
 *   node scripts/check-commit.ts [--merge] --range <a>..<b>   every commit in the range, newest first
 *
 * Without --merge, `Reviewed-By:` is optional: the hook runs before an independent review can exist.
 * With --merge (the pre-merge check), `Reviewed-By:` with a pass verdict is required on the tip commit
 * of the range when any commit in the range touches code; earlier commits need none.
 * `Verified:` and `Rules-Review:` are optional; `Rules-Review: required (pending)` is rejected with --merge.
 * Range checks exclude the fixed history before the commit-format contract was adopted.
 * Explicit --rev and staged-message checks remain strict.
 * Spec anchors resolve against the staged tree for the hook, or the commit's own tree for --rev/--range.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { headingAnchors } from './lib/markdown.ts';

export const TYPES = [
  'feat',
  'fix',
  'refactor',
  'test',
  'docs',
  'chore',
  'content',
  'rules',
] as const;
const SPEC_REQUIRED = new Set(['feat', 'fix', 'rules', 'content']);
const TRAILERS = ['Slice', 'Spec', 'Verified', 'Reviewed-By', 'Rules-Review', 'Co-Authored-By'];
const VERDICT = /^\S.*\((pass|changes required|decision required), \d{4}-\d{2}-\d{2}\)$/;

const root = fileURLToPath(new URL('../', import.meta.url));
// Parent of d74ecf9, which introduced docs/build/README.md and the commit-format contract.
// Exclude only this immutable ancestor set, never commits that merely remove the contract file.
const PRE_FORMAT_HISTORY = '517ffc4555551f24dc8d4b4a8a2fbacdac0ab4ff';

/** The repository state a message is validated against. */
export interface CommitContext {
  /** Slice ids allowed in `Slice:` (from STATUS.md). */
  sliceIds: Set<string>;
  /** Returns the file's content in the tree being committed, or undefined when it does not exist. */
  readFile: (path: string) => string | undefined;
  /** Paths the commit touches, used for the code-commit and vendor rules. */
  touched: string[];
  /** Pre-merge run: `Reviewed-By:` required on the tip commit, pending rules reviews rejected. */
  merge: boolean;
  /** False for commits below the tip of a `--range` check, which need no `Reviewed-By:`. */
  tip?: boolean;
}

export function isCodePath(path: string): boolean {
  return !(path.startsWith('docs/') || /\.md$/i.test(path));
}

export function sliceIdsFrom(statusMarkdown: string): Set<string> {
  return new Set([...statusMarkdown.matchAll(/^\| ([A-Z]\d{2,}) \| \[/gm)].map(match => match[1]));
}

/** Strips git comment lines and everything after a scissors line, as git does before committing. */
function cleanMessage(raw: string): string {
  const lines: string[] = [];
  for (const line of raw.replace(/\r\n/g, '\n').split('\n')) {
    if (/^# -{8,} >8 -{8,}$/.test(line)) break;
    if (line.startsWith('#')) continue;
    lines.push(line);
  }
  return lines.join('\n').trim();
}

export function validateMessage(raw: string, context: CommitContext): string[] {
  const failures: string[] = [];
  const message = cleanMessage(raw);
  if (!message) return ['Empty commit message.'];
  const [subject, ...rest] = message.split('\n');
  if (/^(Merge|Revert) /.test(subject)) return [];

  const header = /^([a-z]+)\(([^)]*)\): (.*)$/.exec(subject);
  let type: string | undefined;
  let headerSlice: string | undefined;
  if (!header) {
    failures.push(`Subject must be "<type>(<slice>): <summary>", got "${subject}".`);
  } else {
    [, type, headerSlice] = header;
    const summary = header[3];
    if (!(TYPES as readonly string[]).includes(type))
      failures.push(`Unknown type "${type}"; use one of ${TYPES.join(', ')}.`);
    if (!summary.trim()) failures.push('Summary after the type is empty.');
    if (summary.length >= 72)
      failures.push(`Summary is ${summary.length} characters; keep it under 72.`);
    if (/[.]$/.test(summary)) failures.push('Summary must not end with a period.');
    if (summary && summary[0] !== summary[0].toLowerCase())
      failures.push(
        'Summary starts with a capital letter; write it in lower case, imperative mood.',
      );
  }
  if (rest.length && rest[0] !== '')
    failures.push('Leave a blank line between the subject and the body.');

  const trailers = new Map<string, string[]>();
  for (const line of rest) {
    const match = /^([A-Za-z-]+): ?(.*)$/.exec(line);
    if (match && TRAILERS.includes(match[1])) {
      trailers.set(match[1], [...(trailers.get(match[1]) ?? []), match[2].trim()]);
    }
  }
  const one = (key: string): string | undefined => {
    const values = trailers.get(key);
    if (values && values.length > 1 && key !== 'Spec' && key !== 'Co-Authored-By')
      failures.push(`${key}: appears ${values.length} times; use one line.`);
    return values?.[0];
  };

  const slice = one('Slice');
  if (slice === undefined)
    failures.push('Missing "Slice:" trailer (a slice id from docs/build/STATUS.md, or "none").');
  else if (slice !== 'none' && !context.sliceIds.has(slice))
    failures.push(`Slice: "${slice}" is not an id in docs/build/STATUS.md (or "none").`);
  if (headerSlice !== undefined && slice !== undefined && headerSlice !== slice)
    failures.push(`Subject scope "(${headerSlice})" does not match "Slice: ${slice}".`);

  const specs = trailers.get('Spec') ?? [];
  if (type && SPEC_REQUIRED.has(type) && !specs.length)
    failures.push(
      `"${type}" commits need at least one "Spec: <path>#<anchor>" trailer naming the owning spec section.`,
    );
  for (const spec of specs) {
    const parts = /^([^#\s]+)#(\S+)$/.exec(spec);
    if (!parts) {
      failures.push(
        `Spec: "${spec}" must be a repo-relative path plus a heading anchor, like docs/table-spec.md#heading.`,
      );
      continue;
    }
    const [, path, anchor] = parts;
    const content = context.readFile(path);
    if (content === undefined)
      failures.push(`Spec: file "${path}" does not exist in the tree being committed.`);
    else if (!headingAnchors(content).has(anchor))
      failures.push(`Spec: no heading resolves to #${anchor} in ${path}.`);
  }

  const codeCommit =
    context.touched.some(isCodePath) || (type !== undefined && type !== 'docs' && type !== 'chore');
  const verified = one('Verified');
  if (verified !== undefined && !verified) failures.push('"Verified:" is empty.');

  const reviewed = one('Reviewed-By');
  if (reviewed !== undefined && !VERDICT.test(reviewed))
    failures.push('"Reviewed-By:" must read "<reviewer label> (<verdict>, YYYY-MM-DD)".');
  if (context.merge && context.tip !== false && codeCommit) {
    if (reviewed === undefined)
      failures.push(
        'Missing "Reviewed-By:" trailer; the tip commit of a merged range needs an independent review.',
      );
    else if (!/\(pass, /.test(reviewed))
      failures.push('"Reviewed-By:" verdict must be "pass" before merging to main.');
  }

  const rules = one('Rules-Review');
  if (rules === 'required (pending)') {
    if (context.merge)
      failures.push(
        '"Rules-Review: required (pending)" must be replaced by the rules reviewer\'s verdict before merging to main.',
      );
  } else if (rules !== undefined && rules !== 'not required' && !VERDICT.test(rules))
    failures.push(
      '"Rules-Review:" must be "not required", "required (pending)" or "<reviewer label> (<verdict>, YYYY-MM-DD)".',
    );

  const vendor = context.touched.filter(path => path.startsWith('vendor/'));
  if (vendor.length)
    failures.push(
      `Commit modifies vendor/ (${vendor.join(', ')}); pinned submodules are never changed in slice commits.`,
    );
  return failures;
}

const git = (args: string[]) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
function treeReader(prefix: string): (path: string) => string | undefined {
  return path => {
    try {
      return git(['show', `${prefix}${path}`]);
    } catch {
      return undefined;
    }
  };
}
function stagedContext(merge: boolean): CommitContext {
  const readFile = treeReader(':');
  const status =
    readFile('docs/build/STATUS.md') ?? readFileSync(resolve(root, 'docs/build/STATUS.md'), 'utf8');
  const sliceIds = sliceIdsFrom(status);
  const touched = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
  return { sliceIds, readFile, touched, merge };
}
function touchedBy(rev: string): string[] {
  return git(['diff-tree', '--no-commit-id', '--name-only', '-r', '--root', rev])
    .split('\n')
    .filter(Boolean);
}
function revisionContext(rev: string, merge: boolean, tip = true): CommitContext {
  const readFile = treeReader(`${rev}:`);
  const status = readFile('docs/build/STATUS.md') ?? '';
  return { sliceIds: sliceIdsFrom(status), readFile, touched: touchedBy(rev), merge, tip };
}

function report(label: string, failures: string[]): boolean {
  if (!failures.length) {
    console.log(`${label}: commit message ok.`);
    return true;
  }
  console.error(`${label}: commit message rejected (see docs/build/README.md#commit-format):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  return false;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const merge = args.includes('--merge');
  const positional = args.filter(arg => !arg.startsWith('--'));
  const revIndex = args.indexOf('--rev');
  const rangeIndex = args.indexOf('--range');
  let ok = true;
  if (rangeIndex !== -1) {
    const range = args[rangeIndex + 1];
    if (!range) throw new Error('--range needs <a>..<b>.');
    const commits = git(['rev-list', range, `^${PRE_FORMAT_HISTORY}`])
      .split('\n')
      .filter(Boolean);
    console.log(`Checking ${range}; excluding history through pre-format ${PRE_FORMAT_HISTORY}.`);
    if (!commits.length) console.log(`No post-adoption commits in ${range}.`);
    // The tip commit answers for the whole range: a trailing docs commit cannot hide code commits
    // below it from the pre-merge review requirement.
    const rangeTouched = new Set<string>();
    commits.forEach((commit, index) => {
      const message = git(['log', '-1', '--format=%B', commit]);
      const context = revisionContext(commit, merge, index === 0);
      if (index === 0) {
        for (const other of commits.slice(1)) {
          for (const path of touchedBy(other)) rangeTouched.add(path);
        }
        context.touched = [...new Set([...context.touched, ...rangeTouched])];
      }
      ok = report(commit.slice(0, 12), validateMessage(message, context)) && ok;
    });
  } else if (revIndex !== -1) {
    const rev = args[revIndex + 1];
    if (!rev) throw new Error('--rev needs a commit.');
    const commit = git(['rev-parse', rev]).trim();
    ok = report(
      commit.slice(0, 12),
      validateMessage(git(['log', '-1', '--format=%B', commit]), revisionContext(commit, merge)),
    );
  } else {
    const file = positional.find(arg => arg !== '-');
    const message = file ? readFileSync(file, 'utf8') : readFileSync(0, 'utf8');
    ok = report(file ?? 'stdin', validateMessage(message, stagedContext(merge)));
  }
  process.exit(ok ? 0 : 1);
}
