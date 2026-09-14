// SPDX-License-Identifier: GPL-3.0-only
// Development fixture for the app suites: a campaign with a Director (owner), a selected player and
// an observing member, a running session, and a hero the player owns admitted to the campaign
// through the real A02 path (hero-fixture selections saved, submitted, approved by the Director), so
// its effective baseline and first-admission live values are the R02/R03 fixture numbers.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { convexTest, type TestConvex } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../../../convex/schema';
import { api, components } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import type { EvaluationInput } from '../../../shared/contracts/characterEvaluation';
import type { DecisionDefinitions } from '../../../shared/evaluate/definitions';
import { draftSelectionsFrom } from '../../../shared/evaluate/draft';

const examples = JSON.parse(
  readFileSync(join(process.cwd(), 'shared/content/character-evaluation-examples.json'), 'utf8'),
) as { examples: Record<string, { input: EvaluationInput }> };
export const definitions = JSON.parse(
  readFileSync(join(process.cwd(), 'shared/content/fury-level-one-decisions.json'), 'utf8'),
) as DecisionDefinitions;
/** The R01 Set A selections (docs/hero-fixture.md, Grug) as persisted draft selections. */
export function heroFixtureSelections(overrides: Record<string, unknown> = {}) {
  const selections = { ...examples.examples.complete!.input.selections, ...overrides };
  for (const [key, value] of Object.entries(overrides))
    if (value === undefined) delete selections[key];
  return draftSelectionsFrom(selections as EvaluationInput['selections'], definitions);
}

const modules = import.meta.glob('../../../convex/**/*.ts');
export type Backend = TestConvex<typeof schema>;
export function backend(): Backend {
  const t = convexTest(schema, modules);
  betterAuthTest.register(t);
  return t;
}
export async function account(t: Backend, name: string) {
  const now = Date.now();
  const auth = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'user',
      data: {
        name,
        email: `${name.toLowerCase()}@private.example`,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  const session = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'session',
      data: {
        userId: auth._id,
        token: `${name}-token`,
        expiresAt: now + 3600000,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  const client = t.withIdentity({ subject: auth._id, sessionId: session._id });
  const profile = await client.mutation(api.auth.ensureProfile, {});
  return { client, profile, name };
}
export async function admit(
  t: Backend,
  owner: Awaited<ReturnType<typeof account>>,
  member: Awaited<ReturnType<typeof account>>,
  campaignId: Id<'campaigns'>,
) {
  const details = await owner.client.query(api.campaigns.get, { campaignId });
  await member.client.mutation(api.campaigns.requestJoin, {
    shareCode: details.shareCode!,
    commandId: `join-${member.name}`,
  });
  const request = (
    await owner.client.query(api.campaigns.get, { campaignId })
  ).pendingRequests.find(r => r.userId === member.profile.userId)!;
  await owner.client.mutation(api.campaigns.approveRequest, {
    requestId: request.id,
    commandId: `approve-${member.name}`,
  });
}
/**
 * Creates a hero with the fixture selections for `owner`, submits it to the campaign and, unless
 * the owner is the Director (logged without approval), approves it as the Director.
 */
export async function admitHero(
  t: Backend,
  owner: Awaited<ReturnType<typeof account>>,
  director: Awaited<ReturnType<typeof account>>,
  campaignId: Id<'campaigns'>,
  name: string,
  selections = heroFixtureSelections({ 'details.name': name }),
) {
  const authored = { name, appearance: '', biography: '', notes: `${name}'s private note` };
  const characterId = await owner.client.mutation(api.characters.create, {
    commandId: `create-${name}-${owner.name}`,
    authored,
  });
  await owner.client.mutation(api.characters.save, {
    commandId: `save-${name}-${owner.name}`,
    characterId,
    expectedRevision: 1,
    authored,
    selections,
  });
  await owner.client.mutation(api.characters.submit, {
    commandId: `submit-${name}-${owner.name}`,
    characterId,
    campaignId,
  });
  if (owner.profile.userId !== director.profile.userId)
    await director.client.mutation(api.characters.approve, {
      commandId: `approve-${name}-${owner.name}`,
      characterId,
    });
  return characterId;
}
/** Director, player (selected) and observer (member, not selected) at a running session. */
export async function table(t: Backend, options: { session?: boolean } = {}) {
  const director = await account(t, 'Director');
  const player = await account(t, 'Player');
  const observer = await account(t, 'Observer');
  const campaignId = await director.client.mutation(api.campaigns.create, {
    name: 'The Salient',
    commandId: 'create-campaign',
  });
  await admit(t, director, player, campaignId);
  await admit(t, director, observer, campaignId);
  const sessionId =
    options.session === false
      ? null
      : await director.client.mutation(api.sessions.start, {
          campaignId,
          selectedPlayerIds: [player.profile.userId],
          commandId: 'start-session',
        });
  const thornId = await admitHero(t, player, director, campaignId, 'Thorn');
  return { director, player, observer, campaignId, sessionId, thornId };
}
export async function storedEvents(t: Backend, campaignId: Id<'campaigns'>) {
  return t.run(ctx =>
    ctx.db
      .query('events')
      .withIndex('by_campaign_sequence', q => q.eq('campaignId', campaignId))
      .take(1000),
  );
}
