// SPDX-License-Identifier: GPL-3.0-only
import { execFileSync } from 'node:child_process';
import { isAbsolute, join, relative, resolve } from 'node:path';

const revisions = new Map<string, string>();
const sources = new Map<string, string>();

/** Read source evidence from the superproject's exact Git pin, including files omitted by sparse checkout. */
export function readPinnedSource(root: string, sourcePath: string): string {
  root = resolve(root);
  const submodulePath = 'vendor/steel-compendium';
  const vendor = join(root, submodulePath);
  const path = relative(vendor, resolve(root, sourcePath)).split('\\').join('/');
  if (isAbsolute(path) || path === '..' || path.startsWith('../'))
    throw new Error(`Source path is outside the pinned Compendium: ${sourcePath}`);
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
      cwd: vendor,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 16 * 1024 * 1024,
    });
    sources.set(key, text);
  }
  return text;
}
