// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readPinnedSource } from '../helpers/pinned-source';

test('source reads use the committed superproject pin even for an absent sparse-checkout file', () => {
  const root = mkdtempSync(join(tmpdir(), 'salient-source-'));
  const vendor = join(root, 'vendor/steel-compendium');
  const git = (cwd: string, ...args: string[]) =>
    execFileSync(
      'git',
      ['-c', 'user.name=Source test', '-c', 'user.email=source@example.test', ...args],
      {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    ).trim();
  try {
    git(root, 'init');
    mkdirSync(join(vendor, 'en/books/heroes'), { recursive: true });
    mkdirSync(join(vendor, 'en/unified/md'), { recursive: true });
    git(vendor, 'init');
    writeFileSync(join(vendor, 'en/books/heroes/source.md'), 'Pinned text.\n');
    writeFileSync(join(vendor, 'en/unified/md/source.md'), 'Selected text.\n');
    git(vendor, 'add', '.');
    git(vendor, 'commit', '-m', 'source');
    const pin = git(vendor, 'rev-parse', 'HEAD');
    git(root, 'update-index', '--add', '--cacheinfo', `160000,${pin},vendor/steel-compendium`);
    git(root, 'commit', '-m', 'pin');
    // A different checkout HEAD must not become the source of evidence for the recorded pin.
    writeFileSync(join(vendor, 'en/books/heroes/source.md'), 'Later text.\n');
    git(vendor, 'commit', '-am', 'later source');
    git(vendor, 'sparse-checkout', 'set', '--cone', 'en/unified/md');
    expect(existsSync(join(vendor, 'en/books/heroes/source.md'))).toBe(false);
    expect(readPinnedSource(root, 'vendor/steel-compendium/en/books/heroes/source.md')).toBe(
      'Pinned text.\n',
    );
    expect(() => readPinnedSource(root, 'docs/outside.md')).toThrow(
      'outside the pinned Compendium',
    );
    expect(() => readPinnedSource(root, 'vendor/steel-compendium/en/missing.md')).toThrow();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
