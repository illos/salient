// SPDX-License-Identifier: GPL-3.0-only
/**
 * Resolves the one readable copy of each external source under vendor/ (docs/steel-compendium.md).
 *
 * Presidium keeps a single checkout of every pinned source, in the main checkout; worktrees leave
 * `vendor/*` empty. A checkout whose own `vendor/<name>` is populated (main, GitHub CI, the CT114
 * runtime) reads it. An empty one reads `$SALIENT_VENDOR_ROOT/<name>` when that is set (for copies
 * without Git metadata, such as headless /tmp trees), otherwise the main working tree's copy, found
 * through the shared Git directory. Callers keep repo-relative `vendor/<name>/…` paths for citations and resolve them here
 * only to touch the file system.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export type VendorSource = 'steel-compendium' | 'forge-steel';

export const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

const populated = (path: string) => existsSync(path) && readdirSync(path).length > 0;
const resolved = new Map<string, string>();

/** Absolute directory of the readable copy of `vendor/<name>` for the checkout at `root`. */
export function vendorDir(name: VendorSource, root = repoRoot): string {
  root = resolve(root);
  const key = `${root}\0${name}`;
  const cached = resolved.get(key);
  if (cached) return cached;
  const local = join(root, 'vendor', name);
  let dir = local;
  if (!populated(local) && process.env.SALIENT_VENDOR_ROOT)
    dir = join(resolve(process.env.SALIENT_VENDOR_ROOT), name);
  else if (!populated(local)) {
    const common = execFileSync(
      'git',
      ['rev-parse', '--path-format=absolute', '--git-common-dir'],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    ).trim();
    dir = join(dirname(common), 'vendor', name);
  }
  if (!populated(dir))
    throw new Error(
      `vendor/${name} is empty at ${dir}. The main checkout holds the only copy; see docs/steel-compendium.md.`,
    );
  resolved.set(key, dir);
  return dir;
}

/** Maps a repo-relative `vendor/<name>/…` path to the absolute path of the readable copy. */
export function vendorPath(path: string, root = repoRoot): string {
  const match = /^(?:\.\/)?vendor\/(steel-compendium|forge-steel)(?:\/(.*))?$/.exec(
    relative(resolve(root), resolve(root, path)).split(sep).join('/'),
  );
  if (!match) throw new Error(`Not a vendor source path: ${path}`);
  return join(vendorDir(match[1] as VendorSource, root), match[2] ?? '');
}

/**
 * Reads every file under `prefixes` at `revision` from the source's Git objects in one batch, so
 * paths omitted from the readable copy's sparse checkout are still available. Keys are paths
 * relative to the source root.
 */
export function readPinnedTree(
  name: VendorSource,
  revision: string,
  prefixes: string[],
  include: (path: string) => boolean = () => true,
  root = repoRoot,
): Map<string, string> {
  const cwd = vendorDir(name, root);
  const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', revision, '--', ...prefixes], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  })
    .trim()
    .split('\n')
    .filter(path => path && include(path));
  const output = execFileSync('git', ['cat-file', '--batch'], {
    cwd,
    input: paths.map(path => `${revision}:${path}\n`).join(''),
    maxBuffer: 256 * 1024 * 1024,
  });
  const result = new Map<string, string>();
  let offset = 0;
  for (const path of paths) {
    const end = output.indexOf(10, offset);
    const header = output.subarray(offset, end).toString();
    const size = Number(header.split(' ')[2]);
    if (!Number.isFinite(size)) throw new Error(`Cannot read pinned source ${path}: ${header}`);
    offset = end + 1;
    result.set(path, output.subarray(offset, offset + size).toString());
    offset += size + 1;
  }
  return result;
}
