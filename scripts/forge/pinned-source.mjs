// SPDX-License-Identifier: GPL-3.0-only
/**
 * esbuild plugin that loads Forge Steel sources (`@/…` and their relative imports) from the Git
 * objects of the pinned revision, never from the working files. The Presidium copy of
 * vendor/forge-steel is sparse (no src/data/sourcebooks), so the bundle reads the blobs in memory,
 * the way scripts/lib/vendor.ts `readPinnedTree` does; nothing is extracted or copied to disk.
 */
import { execFileSync } from 'node:child_process';
import { posix } from 'node:path';

export function pinnedForgeSource({ vendor, pin, resolveDir }) {
  const git = (args, input) =>
    execFileSync('git', ['-C', vendor, ...args], {
      input,
      maxBuffer: 256 * 1024 * 1024,
      encoding: input === undefined ? 'utf8' : 'buffer',
    });
  const files = new Set(
    git(['ls-tree', '-r', '--name-only', pin, '--', 'src']).trim().split('\n').filter(Boolean),
  );
  const find = base => {
    for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}.json`])
      if (files.has(candidate)) return candidate;
    return null;
  };
  return {
    name: 'pinned-forge-source',
    setup(builder) {
      builder.onResolve({ filter: /^@\// }, args => {
        const path = find(posix.join('src', args.path.slice(2)));
        if (!path) throw new Error(`Not in the pinned Forge tree: ${args.path}`);
        return { path, namespace: 'forge-pin' };
      });
      builder.onResolve({ filter: /^\.\.?\//, namespace: 'forge-pin' }, args => {
        const path = find(posix.join(posix.dirname(args.importer), args.path));
        if (!path)
          throw new Error(`Not in the pinned Forge tree: ${args.path} from ${args.importer}`);
        return { path, namespace: 'forge-pin' };
      });
      builder.onLoad({ filter: /.*/, namespace: 'forge-pin' }, args => {
        const contents = git(['cat-file', 'blob', `${pin}:${args.path}`]);
        const loader = args.path.endsWith('.json')
          ? 'json'
          : args.path.endsWith('.tsx')
            ? 'tsx'
            : 'ts';
        return { contents: contents.toString('utf8'), loader, resolveDir };
      });
    },
  };
}
