// SPDX-License-Identifier: GPL-3.0-only
// Bundle the unmodified pinned Forge rules, never its browser UI. Forge sources are read from the
// pin's Git objects (pinned-source.mjs), so the sparse Presidium copy works as well as CT114's.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { vendorDir } from '../lib/vendor.ts';
import { pinnedForgeSource } from './pinned-source.mjs';

const pin = '5a846aadb623a9855a023e9403bb887a956c341f';
const vendor = vendorDir('forge-steel', resolve('.'));
const git = (...args) => execFileSync('git', ['-C', vendor, ...args], { encoding: 'utf8' }).trim();
if (git('rev-parse', 'HEAD') !== pin || git('status', '--porcelain'))
  throw new Error('Forge vendor must be clean at the approved pin');
const require = createRequire(import.meta.url);
const convexRequire = createRequire(require.resolve('convex/server'));
const { build } = convexRequire('esbuild');
const output = process.env.SALIENT_FORGE_OUTPUT;
if (!output) throw new Error('Set SALIENT_FORGE_OUTPUT to a retained artifact directory');
const family = process.env.SALIENT_FORGE_FAMILY ?? 'ancestry';
if (!['ancestry', 'shadow', 'tactician', 'import'].includes(family))
  throw new Error('Unknown Forge witness family');
mkdirSync(output, { recursive: true });
const blocked = new Set(['dompurify', 'modern-screenshot', 'html2canvas', 'jspdf', 'marked']);
const result = await build({
  entryPoints: [family === 'ancestry' ? 'scripts/forge/run.ts' : `scripts/forge/run-${family}.ts`],
  outfile: resolve(output, 'forge-run.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  metafile: true,
  plugins: [
    pinnedForgeSource({ vendor, pin, resolveDir: resolve('.') }),
    {
      name: 'presentation-boundary',
      setup(builder) {
        builder.onResolve(
          { filter: /^(dompurify|modern-screenshot|html2canvas|jspdf|marked|uuid)$/ },
          args => ({ path: args.path, namespace: 'boundary' }),
        );
        builder.onLoad({ filter: /.*/, namespace: 'boundary' }, args => {
          if (args.path === 'uuid')
            return { contents: "export { randomUUID as v4 } from 'node:crypto';", loader: 'js' };
          if (!blocked.has(args.path)) throw new Error('Unexpected boundary import');
          return {
            contents: `const fail = () => { throw new Error('Forbidden Forge presentation dependency: ${args.path}'); }; export default new Proxy(fail, { get: fail, apply: fail, construct: fail }); export const domToImage = fail; export const marked = new Proxy(fail, { get: fail, apply: fail });`,
            loader: 'js',
          };
        });
      },
    },
  ],
});
writeFileSync(
  resolve(output, 'bundle-inputs.json'),
  JSON.stringify(
    {
      pin,
      inputs: Object.keys(result.metafile.inputs),
      presentationOnly: [...blocked],
      uuid: 'node:crypto.randomUUID',
    },
    null,
    2,
  ) + '\n',
);
