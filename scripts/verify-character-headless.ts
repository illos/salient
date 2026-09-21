import { runSummoner } from './headless/summoner.ts';
import { runBeastheart } from './headless/beastheart.ts';
import { runElementalist } from './headless/elementalist.ts';
import { runTalent } from './headless/talent.ts';
import { runNull } from './headless/null.ts';
import { runTroubadour } from './headless/troubadour.ts';
// SPDX-License-Identifier: GPL-3.0-only
/** Live character acceptance against an explicitly selected development target and cohort. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  bounded,
  createActor,
  failureDetails,
  type ActorSession,
  type ScenarioContext,
} from './headless/character-client.ts';
import { runFury } from './headless/fury.ts';
import { runConduit } from './headless/conduit.ts';
import { runCensor } from './headless/censor.ts';
import { runShadowLevelThree } from './headless/shadow-level-three.ts';
import { runShadowLevelTwo } from './headless/shadow-level-two.ts';
import { runTactician } from './headless/tactician.ts';
import { runScenarios } from './headless/character-scenarios.ts';
import { runCulturePresets } from './headless/culture-presets.ts';
import { runComplicationChoices, runComplicationTable } from './headless/complication-actions.ts';
import { runStartingRewards } from './headless/starting-rewards.ts';
import { runStartingItems } from './headless/starting-items.ts';
import { runWizardDraft } from './headless/wizard-draft.ts';

// Each selected cohort invokes the original scenario, including all assertions and setup.
const cohorts = {
  fury: runFury,
  troubadour: runTroubadour,
  null: runNull,
  elementalist: runElementalist,
  talent: runTalent,
  beastheart: runBeastheart,
  summoner: runSummoner,
  censor: runCensor,
  conduit: runConduit,
  all: runScenarios,
  tactician: runTactician,
  'shadow-level-two': runShadowLevelTwo,
  'shadow-level-three': runShadowLevelThree,
  culture: runCulturePresets,
  'complication-choices': runComplicationChoices,
  'complication-table': runComplicationTable,
  'starting-rewards': runStartingRewards,
  'starting-items': runStartingItems,
  'wizard-draft': runWizardDraft,
};
const cohort = process.env.SALIENT_HEADLESS_COHORT ?? 'all';

const started = Date.now();
const runId = crypto.randomUUID();
const sessions: ActorSession[] = [];
const results: {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  elapsedMs: number;
  reason?: string;
}[] = [];
let active = true;
let finished = false;
let target = 'unvalidated';
const source = process.env.SALIENT_HEADLESS_SOURCE;
const runnerSource = process.env.SALIENT_HEADLESS_RUNNER_SOURCE ?? source;
const reportPath = process.env.SALIENT_HEADLESS_REPORT;
function report() {
  if (finished) return;
  finished = true;
  const output =
    JSON.stringify(
      {
        runId,
        target,
        cohort,
        coverage: cohort === 'all' ? 'full-suite' : 'selected-cohort',
        runnerSource:
          runnerSource && /^[a-f0-9]{40}$/.test(runnerSource) ? runnerSource : 'unvalidated',
        source: source && /^[a-f0-9]{40}$/.test(source) ? source : 'unvalidated',
        elapsedMs: Date.now() - started,
        results,
      },
      null,
      2,
    ) + '\n';
  if (reportPath) {
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, output);
  }
  writeFileSync(1, output);
}
// A stuck HTTP operation cannot leave an unattended verifier running indefinitely.
const hardStop = setTimeout(() => {
  active = false;
  results.push({
    name: 'overall deadline',
    status: 'fail',
    elapsedMs: Date.now() - started,
    reason: 'run-deadline',
  });
  report();
  process.exit(1);
}, 295_000);
try {
  if (!Object.hasOwn(cohorts, cohort)) throw new Error('headless-cohort-validation-failed');
  const runSelected = cohorts[cohort as keyof typeof cohorts];
  const url = process.env.VITE_CONVEX_URL;
  const siteUrl = process.env.VITE_CONVEX_SITE_URL;
  const origin = process.env.VITE_SITE_URL;
  if (
    !url ||
    process.env.SALIENT_HEADLESS_TARGET !== url ||
    !siteUrl ||
    !origin ||
    !source ||
    !/^[a-f0-9]{40}$/.test(source) ||
    !runnerSource ||
    !/^[a-f0-9]{40}$/.test(runnerSource)
  )
    throw new Error('headless-target-validation-failed');
  const endpoint = new URL(url);
  const site = new URL(siteUrl);
  const environment = process.env.SALIENT_HEADLESS_ENVIRONMENT;
  const hosted =
    environment === 'hosted' &&
    url === 'https://different-bat-943.convex.cloud' &&
    siteUrl === 'https://different-bat-943.convex.site' &&
    origin === 'https://salient-dev.rdxx.workers.dev';
  const privateTarget =
    environment === 'character-headless' &&
    !endpoint.username &&
    !endpoint.password &&
    !endpoint.search &&
    !endpoint.hash &&
    ['backend', '127.0.0.1', 'localhost'].includes(endpoint.hostname) &&
    endpoint.protocol === 'http:' &&
    endpoint.port === '3210' &&
    endpoint.pathname === '/' &&
    site.origin === `${endpoint.protocol}//${endpoint.hostname}:3211` &&
    site.pathname === '/' &&
    !site.username &&
    !site.password &&
    !site.search &&
    !site.hash;
  if (!hosted && !privateTarget) throw new Error('headless-target-validation-failed');
  target = endpoint.origin;
  const deadline = started + 240_000;
  const config = { url, siteUrl, origin, active: () => active && Date.now() < deadline };
  const run = async (name: string, fn: () => Promise<void>) => {
    const before = Date.now();
    try {
      if (!config.active()) throw new Error('headless-deadline');
      await bounded(fn(), Math.max(1, deadline - Date.now()), 'headless-deadline');
      results.push({ name, status: 'pass', elapsedMs: Date.now() - before });
      return true;
    } catch (error) {
      results.push({
        name,
        status: 'fail',
        elapsedMs: Date.now() - before,
        ...failureDetails(error),
      });
      return false;
    }
  };
  await bounded(
    (async () => {
      const director = await createActor('director', runId, config, session =>
        sessions.push(session),
      );
      const player = await createActor('player', runId, config, session => sessions.push(session));
      const peer = await createActor('peer', runId, config, session => sessions.push(session));
      const context: ScenarioContext = {
        actors: { director, player, peer },
        run,
        runId,
        skip(name, reason) {
          results.push({ name, status: 'skip', elapsedMs: 0, reason });
        },
      };
      await runSelected(context);
    })(),
    Math.max(1, deadline - Date.now()),
    'headless-deadline',
  );
} catch (error) {
  results.push({
    name: 'runner setup or execution',
    status: 'fail',
    elapsedMs: Date.now() - started,
    ...failureDetails(error),
  });
} finally {
  active = false;
  await Promise.all(
    sessions.map(async (session, index) => {
      try {
        await session.close();
      } catch (error) {
        results.push({
          name: `session cleanup ${index + 1}`,
          status: 'fail',
          elapsedMs: 0,
          ...failureDetails(error),
        });
      }
    }),
  );
  clearTimeout(hardStop);
  process.exitCode =
    results.some(result => result.status !== 'pass') || results.length === 0 ? 1 : 0;
  report();
  // Timed-out requests may still own sockets; do not leave a background verifier alive.
  process.exit(process.exitCode);
}
