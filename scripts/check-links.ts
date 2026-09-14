// SPDX-License-Identifier: GPL-3.0-only
/**
 * Validates every relative link and anchor in docs/**\/*.md, README.md, CLAUDE.md and agent.MD.
 * Exits non-zero listing each broken link as `file:line target — reason`.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractLinks, headingAnchors, isExternal } from './lib/markdown.ts';

const root = fileURLToPath(new URL('../', import.meta.url));

async function markdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await markdownFiles(path)));
    else if (/\.md$/i.test(entry.name)) files.push(path);
  }
  return files;
}

const anchorCache = new Map<string, Promise<Set<string>>>();
function anchorsOf(path: string): Promise<Set<string>> {
  let cached = anchorCache.get(path);
  if (!cached) {
    cached = readFile(path, 'utf8').then(headingAnchors);
    anchorCache.set(path, cached);
  }
  return cached;
}

export interface BrokenLink {
  file: string;
  line: number;
  target: string;
  reason: string;
}

export async function checkFile(path: string, repoRoot = root): Promise<BrokenLink[]> {
  const broken: BrokenLink[] = [];
  const markdown = await readFile(path, 'utf8');
  const file = relative(repoRoot, path);
  for (const { line, target } of extractLinks(markdown)) {
    if (isExternal(target)) continue;
    const hashIndex = target.indexOf('#');
    const pathPart = decodeURIComponent(hashIndex === -1 ? target : target.slice(0, hashIndex));
    const anchor = hashIndex === -1 ? undefined : decodeURIComponent(target.slice(hashIndex + 1));
    const resolved = pathPart ? resolve(dirname(path), pathPart) : path;
    if (relative(repoRoot, resolved).startsWith('..')) {
      broken.push({ file, line, target, reason: 'points outside the repository' });
      continue;
    }
    let isDirectory: boolean;
    try {
      isDirectory = (await stat(resolved)).isDirectory();
    } catch {
      broken.push({ file, line, target, reason: `missing file ${relative(repoRoot, resolved)}` });
      continue;
    }
    if (anchor === undefined || anchor === '') continue;
    if (isDirectory || !/\.md$/i.test(resolved)) {
      // Anchors into non-Markdown targets (source lines, images) cannot be checked here.
      continue;
    }
    if (!(await anchorsOf(resolved)).has(anchor)) {
      broken.push({ file, line, target, reason: `no heading #${anchor} in ${relative(repoRoot, resolved)}` });
    }
  }
  return broken;
}

export async function checkAll(repoRoot = root): Promise<{ files: number; broken: BrokenLink[] }> {
  const files = [
    ...['README.md', 'CLAUDE.md', 'agent.MD'].map(name => join(repoRoot, name)),
    ...(await markdownFiles(join(repoRoot, 'docs'))),
  ].filter(path => !path.split(sep).includes('node_modules'));
  const broken: BrokenLink[] = [];
  for (const file of files) broken.push(...(await checkFile(file, repoRoot)));
  return { files: files.length, broken };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { files, broken } = await checkAll();
  for (const entry of broken) console.error(`${entry.file}:${entry.line} ${entry.target} — ${entry.reason}`);
  if (broken.length) {
    console.error(`${broken.length} broken link(s) in ${files} Markdown files.`);
    process.exit(1);
  }
  console.log(`Checked ${files} Markdown files: no broken relative links or anchors.`);
}
