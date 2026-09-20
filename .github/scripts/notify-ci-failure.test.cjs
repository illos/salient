// SPDX-License-Identifier: GPL-3.0-only
const { test } = require('node:test');
const assert = require('node:assert/strict');
const notify = require('./notify-ci-failure.cjs');

function fixture(overrides = {}, existing = []) {
  const created = [];
  let reads = 0;
  const context = {
    eventName: 'workflow_run',
    repo: { owner: 'illos', repo: 'salient' },
    payload: {
      action: 'completed',
      workflow_run: {
        status: 'completed',
        conclusion: 'failure',
        path: '.github/workflows/check.yml',
        repository: { full_name: 'illos/salient' },
        id: 123,
        run_attempt: 2,
        head_sha: 'a'.repeat(40),
        ...overrides,
      },
    },
  };
  const core = {
    info() {},
    summary: {
      addLink() {
        return this;
      },
      async write() {},
    },
  };
  const github = {
    async paginate() {
      reads++;
      return existing;
    },
    rest: {
      issues: {
        listForRepo() {},
        async create(issue) {
          created.push(issue);
          return { data: { html_url: 'https://github.com/illos/salient/issues/1' } };
        },
      },
    },
  };
  return { github, context, core, created, reads: () => reads };
}

test('failure delivers assigned issue with exact run attempt and commit', async () => {
  const f = fixture();
  await notify(f);
  assert.equal(f.created.length, 1);
  assert.deepEqual(f.created[0].assignees, ['illos']);
  assert.ok(f.created[0].body.includes('/actions/runs/123/attempts/2'));
  assert.ok(f.created[0].body.includes('a'.repeat(40)));
});

test('success, cancellation, and unrelated workflows do not access issues', async () => {
  for (const overrides of [
    { conclusion: 'success' },
    { conclusion: 'cancelled' },
    { path: 'unknown.yml' },
  ]) {
    const f = fixture(overrides);
    await notify(f);
    assert.equal(f.reads(), 0);
    assert.equal(f.created.length, 0);
  }
});

test('retry does not duplicate a delivered issue, including closed issues', async () => {
  const f = fixture({}, [
    { body: '<!-- ci-failure:123:2 -->', state: 'closed', html_url: 'existing' },
  ]);
  assert.equal(await notify(f), 'existing');
  assert.equal(f.created.length, 0);
});

test('invalid identity fails before delivery', async () => {
  for (const overrides of [
    { repository: { full_name: 'other/repo' } },
    { head_sha: 'bad' },
    { id: -1 },
  ]) {
    const f = fixture(overrides);
    await assert.rejects(notify(f), /Invalid workflow identity/);
    assert.equal(f.reads(), 0);
  }
});

test('delivery error remains a failed notifier', async () => {
  const f = fixture();
  f.github.rest.issues.create = async () => {
    throw new Error('permission denied');
  };
  await assert.rejects(notify(f), /permission denied/);
});

test('probe is visibly identified as intentional', async () => {
  const f = fixture({ path: '.github/workflows/notification-probe.yml' });
  await notify(f);
  assert.match(f.created[0].title, /^\[Delivery probe\]/);
});
