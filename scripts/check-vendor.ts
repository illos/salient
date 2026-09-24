// SPDX-License-Identifier: GPL-3.0-only
/**
 * Fails when the readable copy of any submodule under vendor/ (this checkout's, or the main
 * checkout's for a worktree; see scripts/lib/vendor.ts) is not at the commit pinned by this
 * repository, or has local modifications or untracked files. Builds must never depend on an edited or
 * advanced pin.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { vendorPath } from './lib/vendor.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = (args: string[], cwd = root) =>
  execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

const failures: string[] = [];
const pinned = git(['ls-tree', 'HEAD', 'vendor/']).split('\n').filter(Boolean);
if (!pinned.length) failures.push('No submodules are pinned under vendor/.');
for (const entry of pinned) {
  // ls-tree columns: mode, type, object, path.
  const [, , kind, commit, path] = /^(\d+) (\w+) ([0-9a-f]+)\t(.+)$/.exec(entry) ?? [];
  if (kind !== 'commit') continue;
  let copy: string;
  let head: string;
  try {
    copy = vendorPath(path, root);
    head = git(['rev-parse', 'HEAD'], copy);
  } catch {
    failures.push(
      `${path}: no readable copy. Never initialize it in a worktree; the only copy is the main checkout's (docs/steel-compendium.md).`,
    );
    continue;
  }
  if (head !== commit)
    failures.push(
      `${path}: ${copy} is at ${head.slice(0, 12)} but pinned at ${commit.slice(0, 12)}.`,
    );
  const status = git(['status', '--porcelain', '--untracked-files=all'], copy);
  if (status) failures.push(`${path}: working tree differs from the pin:\n${status}`);
}
// The superproject also records a changed pin as a modified path.
const superStatus = git(['status', '--porcelain', '--', 'vendor/']);
if (superStatus) failures.push(`vendor/ pin changed in this checkout:\n${superStatus}`);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`vendor/ matches the pinned submodule commits (${pinned.length} submodules).`);
