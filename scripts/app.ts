/** Headless caller of the same authorized Convex operations used by the web app. */
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { createAuthClient } from 'better-auth/client';
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';
import {
  historySheet,
  listHistory,
  restoreRevision,
  sheetSummary,
  type HistoryCaller,
} from './lib/build-history.ts';

try {
  process.loadEnvFile('.env.local');
} catch {
  /* Explicit environment also works. */
}
const usage =
  'Usage: pnpm app <query|mutation|action> <module:function> [JSON arguments]\n' +
  '       pnpm app command "<slash text>" [--campaign <id>] [--command-id <id>]\n' +
  "       pnpm app respond <interactionId> '<JSON answer>' [--command-id <id>]\n" +
  '       pnpm app history <characterId> [--cursor <cursor>]\n' +
  '       pnpm app history-sheet <characterId> <revisionId> [--full]\n' +
  '       pnpm app restore <characterId> <revisionId> [--expected-revision <n>\n' +
  '                --expected-effective <revisionId|null>] [--command-id <id>]\n' +
  '  restore checks the character revision and effective revision you last saw; without both\n' +
  '  --expected-* options it reads them just before restoring and skips that check.\n' +
  'Authenticate with SALIENT_EMAIL and SALIENT_PASSWORD, or SALIENT_AUTH_TOKEN. The campaign comes\n' +
  'from --campaign or SALIENT_CAMPAIGN_ID. Every call uses the same commandId and authorization\n' +
  'contract as the browser; pass --command-id to retry an earlier command exactly.';
const argv = process.argv.slice(2);
function option(name: string): string | undefined {
  const index = argv.indexOf(name);
  if (index === -1) return undefined;
  const [, value] = argv.splice(index, 2);
  return value;
}
const campaignOption = option('--campaign') ?? process.env.SALIENT_CAMPAIGN_ID;
const commandIdOption = option('--command-id') ?? process.env.SALIENT_COMMAND_ID;
const cursorOption = option('--cursor') ?? null;
const expectedRevisionOption = option('--expected-revision');
const expectedEffectiveOption = option('--expected-effective');
const fullIndex = argv.indexOf('--full');
const full = fullIndex !== -1;
if (full) argv.splice(fullIndex, 1);
let kind: 'query' | 'mutation' | 'action' = 'query';
let functionName = '';
let args: unknown;
/** V185 build-history verbs: several calls through the same authenticated client. */
let historyVerb: ((caller: HistoryCaller) => Promise<unknown>) | undefined;
const [verb, first, second] = argv;
if (verb === 'history' && first) {
  historyVerb = caller => listHistory(caller, first, cursorOption);
} else if (verb === 'history-sheet' && first && second) {
  historyVerb = async caller => {
    const history = await historySheet(caller, first, second);
    return full ? history : sheetSummary(history);
  };
} else if (verb === 'restore' && first && second) {
  if ((expectedRevisionOption === undefined) !== (expectedEffectiveOption === undefined)) {
    console.error(usage);
    process.exit(1);
  }
  const expected =
    expectedRevisionOption !== undefined && expectedEffectiveOption !== undefined
      ? {
          revision: Number(expectedRevisionOption),
          effectiveRevisionId: expectedEffectiveOption === 'null' ? null : expectedEffectiveOption,
        }
      : undefined;
  historyVerb = caller => restoreRevision(caller, first, second, commandIdOption, expected);
} else if (verb === 'command') {
  // The slash text is one shell argument; the host shell's quoting is independent of the grammar.
  if (!first || !campaignOption) {
    console.error(usage);
    process.exit(1);
  }
  kind = 'mutation';
  functionName = 'commands:submit';
  args = {
    campaignId: campaignOption,
    text: first,
    commandId: commandIdOption ?? crypto.randomUUID(),
  };
} else if (verb === 'respond') {
  if (!first || !second) {
    console.error(usage);
    process.exit(1);
  }
  kind = 'mutation';
  functionName = 'interactions:respond';
  args = {
    interactionId: first,
    answer: JSON.parse(second),
    commandId: commandIdOption ?? crypto.randomUUID(),
  };
} else if ((verb === 'query' || verb === 'mutation' || verb === 'action') && first) {
  kind = verb;
  functionName = first;
  args = JSON.parse(second ?? '{}');
} else {
  console.error(usage);
  process.exit(1);
}
let auth: ReturnType<typeof createAuthClient> | undefined;
try {
  const url = process.env.VITE_CONVEX_URL;
  const siteUrl = process.env.VITE_CONVEX_SITE_URL;
  if (!url || !siteUrl) throw new Error('Configure the Convex client and HTTP URLs in .env.local.');
  // Keep stdout machine-readable even when Convex returns server diagnostics with a result.
  const client = new ConvexHttpClient(url, {
    logger: {
      logVerbose: console.error,
      log: console.error,
      warn: console.error,
      error: console.error,
    },
  });
  let token = process.env.SALIENT_AUTH_TOKEN;
  if (!token) {
    const email = process.env.SALIENT_EMAIL;
    const password = process.env.SALIENT_PASSWORD;
    if (!email || !password)
      throw new Error('Set SALIENT_EMAIL and SALIENT_PASSWORD, or SALIENT_AUTH_TOKEN.');
    const storage = new Map<string, string>();
    const origin =
      process.env.VITE_SITE_URL ??
      (['127.0.0.1', 'localhost'].includes(new URL(url).hostname)
        ? 'http://127.0.0.1:5180'
        : undefined);
    if (!origin)
      throw new Error(
        'Set VITE_SITE_URL to the configured trusted frontend origin for password sign-in.',
      );
    const login = createAuthClient({
      baseURL: siteUrl,
      fetchOptions: { headers: { Origin: origin } },
      plugins: [
        convexClient(),
        crossDomainClient({
          storage: {
            getItem: key => storage.get(key) ?? null,
            setItem: (key, value) => {
              storage.set(key, value);
            },
          },
        }),
      ],
    });
    const result = await login.signIn.email({ email, password });
    if (result.error) throw new Error(result.error.message || 'Sign-in failed.');
    auth = login;
    const jwt = await login.convex.token();
    if (jwt.error || !jwt.data?.token)
      throw new Error('Could not obtain an authenticated application token.');
    token = jwt.data.token;
  }
  client.setAuth(token);
  const call = (callKind: typeof kind, name: string, callArgs: unknown) => {
    const ref = makeFunctionReference<typeof callKind>(name);
    return callKind === 'query'
      ? client.query(ref as ReturnType<typeof makeFunctionReference<'query'>>, callArgs)
      : callKind === 'mutation'
        ? client.mutation(ref as ReturnType<typeof makeFunctionReference<'mutation'>>, callArgs)
        : client.action(ref as ReturnType<typeof makeFunctionReference<'action'>>, callArgs);
  };
  const result = historyVerb
    ? await historyVerb({
        query: (name, callArgs) => call('query', name, callArgs),
        mutation: (name, callArgs) => call('mutation', name, callArgs),
      } as HistoryCaller)
    : await call(kind, functionName, args);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Application command failed.');
  process.exitCode = 1;
} finally {
  if (auth) {
    try {
      const result = await auth.signOut();
      // The throw is caught by the catch below; it never escapes the finally block.
      // eslint-disable-next-line no-unsafe-finally
      if (result.error) throw new Error('Temporary CLI session could not be revoked.');
    } catch {
      console.error(
        'Temporary CLI session cleanup failed; sign out that session before reusing this environment.',
      );
      process.exitCode = 1;
    }
  }
}
