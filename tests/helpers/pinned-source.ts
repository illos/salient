// SPDX-License-Identifier: GPL-3.0-only
import { execFileSync } from 'node:child_process';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { vendorDir } from '../../scripts/lib/vendor.ts';

const revisions = new Map<string, string>();
const sources = new Map<string, string>();

/** Read source evidence from the superproject's exact Git pin, including files omitted by sparse checkout. */
export function readPinnedSource(root: string, sourcePath: string): string {
  root = resolve(root);
  const submodulePath = 'vendor/steel-compendium';
  const vendor = join(root, submodulePath);
  const copy = vendorDir('steel-compendium', root);
  // Accept a path under the repo's vendor/ entry or under the readable copy it resolves to.
  const within = (base: string) => relative(base, resolve(root, sourcePath)).split('\\').join('/');
  const outside = (path: string) => isAbsolute(path) || path === '..' || path.startsWith('../');
  let path = within(vendor);
  if (outside(path)) path = within(copy);
  if (outside(path)) throw new Error(`Source path is outside the pinned Compendium: ${sourcePath}`);
  let revision = revisions.get(root);
  if (!revision) {
    const tree = execFileSync('git', ['ls-tree', 'HEAD', submodulePath], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    revision = /^160000 commit ([0-9a-f]{40})\t/m.exec(tree)?.[1];
    if (!revision) throw new Error(`${submodulePath} has no committed superproject pin.`);
    revisions.set(root, revision);
  }
  const key = `${vendor}:${revision}:${path}`;
  let text = sources.get(key);
  if (text === undefined) {
    text = execFileSync('git', ['show', `${revision}:${path}`], {
      cwd: copy,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 16 * 1024 * 1024,
    });
    sources.set(key, text);
  }
  return text;
}
