// SPDX-License-Identifier: GPL-3.0-only
/** Publish a durable GitHub notification from a completed workflow event. */
module.exports = async function notifyFailure({ github, context, core }) {
  const run = context.payload.workflow_run;
  const workflows = new Map([
    ['.github/workflows/check.yml', 'check'],
    ['.github/workflows/notification-probe.yml', 'notification delivery probe'],
  ]);
  const failures = new Set(['failure', 'timed_out', 'startup_failure', 'action_required']);
  if (
    context.eventName !== 'workflow_run' ||
    context.payload.action !== 'completed' ||
    run?.status !== 'completed' ||
    !failures.has(run.conclusion) ||
    !workflows.has(run.path)
  ) {
    core.info('No failure notification required.');
    return;
  }
  const { owner, repo } = context.repo;
  if (
    run.repository?.full_name !== `${owner}/${repo}` ||
    !Number.isSafeInteger(run.id) ||
    run.id < 1 ||
    !Number.isSafeInteger(run.run_attempt) ||
    run.run_attempt < 1 ||
    !/^[a-f0-9]{40}$/.test(run.head_sha)
  )
    throw new Error('Invalid workflow identity; refusing a misleading notification.');

  const marker = `<!-- ci-failure:${run.id}:${run.run_attempt} -->`;
  // The workflow serializes notifications for each run, including notifier retries.
  const issues = await github.paginate(github.rest.issues.listForRepo, {
    owner,
    repo,
    creator: 'github-actions[bot]',
    state: 'all',
    per_page: 100,
  });
  const existing = issues.find(issue => !issue.pull_request && issue.body?.includes(marker));
  if (existing) {
    core.info(`Already delivered: ${existing.html_url}`);
    return existing.html_url;
  }
  const probe = run.path === '.github/workflows/notification-probe.yml';
  const url = `https://github.com/${owner}/${repo}/actions/runs/${run.id}/attempts/${run.run_attempt}`;
  const issue = await github.rest.issues.create({
    owner,
    repo,
    title: `${probe ? '[Delivery probe]' : 'CI failure'}: ${workflows.get(run.path)} (${run.id}/${run.run_attempt})`,
    body: [
      marker,
      `@${owner} — ${probe ? 'Intentional notification delivery test' : 'CI needs attention'}.`,
      '',
      `Result: **${run.conclusion}**`,
      `Commit: \`${run.head_sha}\``,
      `[Open workflow run](${url})`,
      '',
      'Delivered by the completed workflow event. No test rerun or agent polling was started.',
    ].join('\n'),
    assignees: [owner],
  });
  core.info(`Delivered: ${issue.data.html_url}`);
  await core.summary.addLink('Failure notification', issue.data.html_url).write();
  return issue.data.html_url;
};
