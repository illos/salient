// SPDX-License-Identifier: GPL-3.0-only
// Expected outcomes follow the rules written in docs/build/README.md#commit-format.
import { describe, expect, test } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  isCodePath,
  sliceIdsFrom,
  validateMessage,
  type CommitContext,
} from '../../scripts/check-commit';

const specs: Record<string, string> = {
  'docs/build/STATUS.md':
    '| Id | Slice |\n| --- | --- |\n| S00 | [Tooling](S00.md) |\n| A05 | [Attacks](A05.md) |\n',
  'docs/table-spec.md':
    '# Table\n\n## Confirmed initiative setup and shared presentation\n\ntext\n\n## Combat opening — confirmed for v0.01\n',
};
function context(overrides: Partial<CommitContext> = {}): CommitContext {
  return {
    sliceIds: sliceIdsFrom(specs['docs/build/STATUS.md']),
    readFile: path => specs[path],
    touched: ['web/ui.tsx'],
    merge: false,
    ...overrides,
  };
}
const good = [
  'feat(A05): resolve attack damage',
  '',
  'Body text.',
  '',
  'Slice: A05',
  'Spec: docs/table-spec.md#confirmed-initiative-setup-and-shared-presentation',
  'Spec: docs/table-spec.md#combat-opening--confirmed-for-v001',
  'Verified: pnpm check',
  'Reviewed-By: reviewer-b (pass, 2026-09-15)',
  'Rules-Review: not required',
  'Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>',
].join('\n');
const without = (prefix: string) =>
  good
    .split('\n')
    .filter(line => !line.startsWith(prefix))
    .join('\n');

describe('check-commit', () => {
  test('range checks exempt only fixed pre-contract history; explicit and future checks remain strict', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'salient-commit-history-'));
    const git = (...args: string[]) =>
      execFileSync('git', args, { cwd: scratch, encoding: 'utf8' }).trim();
    try {
      // Build independent fixture history. Remote source snapshots intentionally carry no
      // original branch history; borrowing the caller's immutable Git objects was unnecessary.
      git('init', '--quiet');
      git('config', 'user.name', 'Test');
      git('config', 'user.email', 'test@example.invalid');
      git('config', 'core.hooksPath', '/dev/null');
      for (let index = 0; index < 3; index++)
        git('commit', '--quiet', '--allow-empty', '-m', `Legacy message ${index}`);
      const legacy = git('rev-parse', 'HEAD');
      mkdirSync(join(scratch, 'docs/build'), { recursive: true });
      for (const [path, content] of Object.entries(specs))
        writeFileSync(join(scratch, path), content);
      writeFileSync(join(scratch, 'docs/build/README.md'), '# Adopted build contract\n');
      git('add', 'docs');
      git(
        'commit',
        '--quiet',
        '-m',
        'docs(none): adopt commit format\n\nSlice: none\nRules-Review: not required',
      );
      const adoption = git('rev-parse', 'HEAD');
      mkdirSync(join(scratch, 'scripts/lib'), { recursive: true });
      for (const file of ['check-commit.ts', 'lib/markdown.ts'])
        copyFileSync(
          new URL(`../../scripts/${file}`, import.meta.url),
          join(scratch, 'scripts', file),
        );
      // Substitute only the disposable checker's history boundary. The real checker keeps its
      // historical constant; this fixture tests exemption behavior with a known local graph.
      const checker = join(scratch, 'scripts/check-commit.ts');
      const checkerSource = readFileSync(checker, 'utf8');
      const boundary = "const PRE_FORMAT_HISTORY = '517ffc4555551f24dc8d4b4a8a2fbacdac0ab4ff';";
      expect(checkerSource).toContain(boundary);
      writeFileSync(
        checker,
        checkerSource.replace(boundary, `const PRE_FORMAT_HISTORY = '${legacy}';`),
      );
      const check = (...args: string[]) =>
        spawnSync(process.execPath, ['scripts/check-commit.ts', ...args], {
          cwd: scratch,
          encoding: 'utf8',
        });
      const historic = check('--range', `${legacy}~2..${adoption}`);
      expect(historic.status, historic.stderr).toBe(0);
      expect(historic.stdout).toContain(`${adoption.slice(0, 12)}: commit message ok.`);
      expect(historic.stdout).not.toContain(`${legacy.slice(0, 12)}: commit message ok.`);
      expect(check('--rev', legacy).status).toBe(1);

      git('read-tree', adoption);
      git('update-index', '--force-remove', 'docs/build/README.md');
      const tree = git('write-tree');
      const malformed = git(
        '-c',
        'user.name=Test',
        '-c',
        'user.email=test@example.invalid',
        'commit-tree',
        tree,
        '-p',
        adoption,
        '-m',
        'Future malformed message',
      );
      const future = check('--range', `${adoption}..${malformed}`);
      expect(future.status).toBe(1);
      expect(future.stderr).toContain(`${malformed.slice(0, 12)}: commit message rejected`);
      expect(future.stderr).toContain('Missing "Slice:"');
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  });

  test('accepts the README example shape, including an em-dash anchor', () => {
    expect(validateMessage(good, context())).toEqual([]);
  });
  test('reads slice ids from STATUS.md rows only', () => {
    expect([
      ...sliceIdsFrom(
        specs['docs/build/STATUS.md'] + '| V100 | [Conduit](V100.md) |\nNot a row: V101',
      ),
    ]).toEqual(['S00', 'A05', 'V100']);
  });
  test('rejects a feat commit without Spec and names the reason', () => {
    const failures = validateMessage(without('Spec:'), context());
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/"feat" commits need at least one "Spec:/);
  });
  test('rejects an anchor that does not resolve, naming file and anchor', () => {
    const message = good.replace('#combat-opening--confirmed-for-v001', '#combat-opening');
    expect(validateMessage(message, context())).toEqual([
      'Spec: no heading resolves to #combat-opening in docs/table-spec.md.',
    ]);
  });
  test('rejects a Spec path missing from the tree', () => {
    const message = good.replace(
      'docs/table-spec.md#combat-opening--confirmed-for-v001',
      'docs/missing.md#x',
    );
    expect(validateMessage(message, context())).toEqual([
      'Spec: file "docs/missing.md" does not exist in the tree being committed.',
    ]);
  });
  test('validates type, slice id, scope match and Rules-Review format', () => {
    expect(validateMessage(good.replace('feat(A05)', 'wip(A05)'), context())[0]).toMatch(
      /Unknown type "wip"/,
    );
    expect(validateMessage(good.replace('Slice: A05', 'Slice: A99'), context())).toEqual([
      'Slice: "A99" is not an id in docs/build/STATUS.md (or "none").',
      'Subject scope "(A05)" does not match "Slice: A99".',
    ]);
    expect(validateMessage(without('Rules-Review:'), context())).toEqual([]);
    expect(
      validateMessage(
        good.replace('Rules-Review: not required', 'Rules-Review: skipped'),
        context(),
      )[0],
    ).toMatch(/Rules-Review/);
  });
  test('Rules-Review: required (pending) is accepted only outside merge mode', () => {
    const pending = good.replace('Rules-Review: not required', 'Rules-Review: required (pending)');
    expect(validateMessage(pending, context())).toEqual([]);
    expect(validateMessage(pending, context({ merge: true }))).toEqual([
      '"Rules-Review: required (pending)" must be replaced by the rules reviewer\'s verdict before merging to main.',
    ]);
  });
  test('Slice: none is accepted with a matching scope', () => {
    const message = good.replace('feat(A05)', 'docs(none)').replace('Slice: A05', 'Slice: none');
    expect(validateMessage(message, context({ touched: ['docs/x.md'] }))).toEqual([]);
  });
  test('Verified is optional but must not be empty', () => {
    expect(validateMessage(without('Verified:'), context())).toEqual([]);
    expect(validateMessage(good.replace('Verified: pnpm check', 'Verified:'), context())).toEqual([
      '"Verified:" is empty.',
    ]);
  });
  test('Reviewed-By is optional in the hook and required with --merge on the tip code commit', () => {
    expect(validateMessage(without('Reviewed-By:'), context())).toEqual([]);
    expect(validateMessage(without('Reviewed-By:'), context({ merge: true }))[0]).toMatch(
      /Missing "Reviewed-By:"/,
    );
    expect(validateMessage(without('Reviewed-By:'), context({ merge: true, tip: false }))).toEqual(
      [],
    );
    const chore = without('Reviewed-By:').replace('feat(A05)', 'chore(A05)');
    expect(validateMessage(chore, context({ merge: true, touched: ['docs/a.md'] }))).toEqual([]);
    const changes = good.replace('(pass, 2026-09-15)', '(changes required, 2026-09-15)');
    expect(validateMessage(changes, context({ merge: true }))[0]).toMatch(/verdict must be "pass"/);
    expect(validateMessage(good.replace('(pass, 2026-09-15)', 'pass'), context())[0]).toMatch(
      /Reviewed-By:" must read/,
    );
  });
  test('rejects commits that touch vendor/ and skips merge commits', () => {
    expect(validateMessage(good, context({ touched: ['vendor/steel-compendium'] }))[0]).toMatch(
      /modifies vendor\//,
    );
    expect(validateMessage("Merge branch 'x'", context())).toEqual([]);
  });
  test('ignores git comment lines and scissors content', () => {
    const raw = `${good}\n# Please enter the commit message\n# ------------------------ >8 ------------------------\ndiff --git a b\n`;
    expect(validateMessage(raw, context())).toEqual([]);
  });
  test('classifies code paths', () => {
    expect(isCodePath('web/ui.tsx')).toBe(true);
    expect(isCodePath('docs/build/STATUS.md')).toBe(false);
    expect(isCodePath('README.md')).toBe(false);
    expect(isCodePath('package.json')).toBe(true);
  });
});
