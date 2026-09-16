// Reconstruct remote-only Git metadata, never copy an agent's original .git directory.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, cpSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';

const allowed = new Map([
  ['vendor/steel-compendium', 'https://github.com/SteelCompendium/data-unified.git'],
  ['vendor/forge-steel', 'https://github.com/andyaiken/forgesteel.git'],
]);
const metadata = JSON.parse(readFileSync('/runtime-source.json', 'utf8'));
const submodules = metadata.submodules ?? metadata.source?.submodules;
if (!Array.isArray(submodules) || submodules.length !== allowed.size) {
  throw new Error('Source metadata must record both pinned public vendor submodules');
}
function git(cwd, args, input) {
  const result = spawnSync('git', args, {
    cwd,
    input,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0)
    throw new Error(`Git reconstruction failed: ${args[0]}: ${result.stderr}`);
  return result.stdout;
}
for (const item of submodules) {
  if (
    allowed.get(item.path) !== item.url ||
    !/^[a-f0-9]{40}$/.test(item.commit) ||
    item.dirty !== false ||
    item.gitlink !== item.commit
  ) {
    throw new Error('Unexpected vendor source identity');
  }
  allowed.delete(item.path);
  const target = resolve('/app', item.path);
  if (existsSync(join(target, '.git')))
    throw new Error('Source must not contain transferred vendor Git metadata');
  const cache = `/tools/vendor-cache/${item.commit}.git`;
  if (!existsSync(cache)) {
    mkdirSync(cache, { recursive: true });
    git(cache, ['init', '--bare']);
  }
  // Always resolve exactly the recorded public commit; never advance a branch pin.
  const present = spawnSync('git', [
    '--git-dir',
    cache,
    'cat-file',
    '-e',
    `${item.commit}^{commit}`,
  ]);
  if (present.status !== 0) git(cache, ['fetch', '--depth=1', item.url, item.commit]);
  git(cache, ['update-ref', 'refs/heads/pinned', item.commit]);
  git(cache, ['symbolic-ref', 'HEAD', 'refs/heads/pinned']);
  // Content provenance includes this exact public tag. Fetch and verify its object;
  // do not invent a local tag, which would hide a stale or moved upstream reference.
  if (item.path === 'vendor/steel-compendium') {
    const provenance = JSON.parse(
      readFileSync('/app/shared/content/compendium/manifest.json', 'utf8'),
    ).compendium;
    if (provenance.revision !== item.commit)
      throw new Error('Content manifest and Compendium pin differ');
    if (provenance.tag !== null) {
      const ref = `refs/tags/${provenance.tag}`;
      git(cache, ['check-ref-format', ref]);
      const known = spawnSync(
        'git',
        ['--git-dir', cache, 'rev-parse', '--verify', `${ref}^{commit}`],
        { encoding: 'utf8' },
      );
      if (known.status !== 0) git(cache, ['fetch', '--depth=1', item.url, `${ref}:${ref}`]);
      if (git(cache, ['rev-parse', `${ref}^{commit}`]).trim() !== item.commit) {
        throw new Error('Recorded public Compendium tag does not resolve to the pinned commit');
      }
    }
  }

  const scratch = `/tools/vendor-cache/checkout-${process.pid}`;
  try {
    git('/app', ['clone', '--shared', '--no-checkout', cache, scratch]);
    git(scratch, ['reset', '--mixed', item.commit]);
    mkdirSync(target, { recursive: true });
    cpSync(join(scratch, '.git'), join(target, '.git'), { recursive: true });
    // Fill sparse-omitted pinned files only; never overwrite an archived working-tree edit.
    const absent = git(target, ['ls-files', '--deleted', '-z']);
    if (absent) git(target, ['checkout-index', '-z', '--stdin'], absent);
    if (git(target, ['status', '--porcelain', '--untracked-files=all']).trim()) {
      throw new Error(
        `Archived vendor differs from recorded pin: ${item.path}; preserve it and fix the source checkout`,
      );
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}
if (existsSync('/app/.git'))
  throw new Error('Source must not contain transferred superproject Git metadata');
git('/app', ['init', '-b', 'runtime-snapshot']);
git('/app', ['config', 'user.name', 'Salient remote source snapshot']);
git('/app', ['config', 'user.email', 'runtime-snapshot@invalid']);
git('/app', ['config', 'core.hooksPath', '/dev/null']);
git('/app', ['add', '--all']);
git('/app', [
  'commit',
  '--quiet',
  '-m',
  'chore(none): record synthetic remote source snapshot\n\nThis is not the original source commit. Consult state/source.json for source identity.\n\nSlice: none\nRules-Review: not required',
]);
console.log(
  'Remote synthetic Git snapshot created; original source identity remains in runtime state.',
);
