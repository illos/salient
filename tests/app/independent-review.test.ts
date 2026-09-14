// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../../convex/schema';
import { api, components } from '../../convex/_generated/api';
const modules = import.meta.glob('../../convex/**/*.ts');
async function setup() {
 const t = convexTest(schema, modules); betterAuthTest.register(t);
 async function actor(name: string) {
  const now = Date.now();
  const auth = await t.mutation(components.betterAuth.adapter.create, { input: { model: 'user', data: { name, email: `${name}@example.test`, emailVerified: false, createdAt: now, updatedAt: now } } });
  const session = await t.mutation(components.betterAuth.adapter.create, { input: { model: 'session', data: { userId: auth._id, token: `${name}-token`, expiresAt: now + 3600000, createdAt: now, updatedAt: now } } });
  const client = t.withIdentity({ subject: auth._id, sessionId: session._id });
  const profile = await client.mutation(api.auth.ensureProfile, {});
  return { client, profile, session };
 }
 return { t, owner: await actor('owner'), outsider: await actor('outsider') };
}
test('independent: persisted session deletion revokes already issued identity across all private surfaces', async () => {
 const {t, owner} = await setup();
 const campaignId = await owner.client.mutation(api.campaigns.create, {name:'Campaign', commandId:'review-campaign'});
 const characterId = await owner.client.mutation(api.characters.create, {commandId:'review-character', authored:{name:'Hero',appearance:'',biography:'',notes:'secret'}});
 await t.mutation(components.betterAuth.adapter.deleteOne, { input: { model:'session', where:[{field:'_id',value:owner.session._id}] } });
 expect(await owner.client.query(api.auth.viewer, {})).toBeNull();
 await expect(owner.client.query(api.campaigns.get,{campaignId})).rejects.toThrow('Sign in');
 await expect(owner.client.query(api.characters.get,{characterId})).rejects.toThrow('Sign in');
 await expect(owner.client.query(api.events.list,{campaignId})).rejects.toThrow('Sign in');
 await expect(owner.client.mutation(api.sessions.start,{campaignId,selectedPlayerIds:[],commandId:'review-revoked-start'})).rejects.toThrow('Sign in');
});
test('independent: stolen request identity cannot withdraw or review another applicant', async () => {
 const {t, owner, outsider} = await setup();
 const campaignId = await owner.client.mutation(api.campaigns.create, {name:'Campaign', commandId:'review-campaign'});
 const {shareCode} = await owner.client.query(api.campaigns.get,{campaignId});
 await outsider.client.mutation(api.campaigns.requestJoin,{shareCode:shareCode!,commandId:'review-request'});
 const requestId = (await outsider.client.query(api.campaigns.myRequests,{}))[0].id;
 await expect(owner.client.mutation(api.campaigns.withdrawRequest,{requestId,commandId:'review-steal-withdraw'})).rejects.toThrow('unavailable');
 await expect(outsider.client.mutation(api.campaigns.declineRequest,{requestId,commandId:'review-steal-decline'})).rejects.toThrow('unavailable');
 expect((await owner.client.query(api.campaigns.get,{campaignId})).pendingRequests).toHaveLength(1);
 await expect(t.query(api.characters.get,{characterId:await owner.client.mutation(api.characters.create,{commandId:'review-char',authored:{name:'Hero',appearance:'',biography:'',notes:'secret'}})})).rejects.toThrow('Sign in');
});
test('independent: simultaneous same-command submissions persist exactly once', async () => {
 const {t, owner} = await setup();
 const args = { name:'Campaign', commandId:'review-concurrent-create' };
 const ids = await Promise.all([owner.client.mutation(api.campaigns.create,args),owner.client.mutation(api.campaigns.create,args)]);
 expect(ids[0]).toBe(ids[1]);
 expect(await owner.client.query(api.campaigns.list,{})).toHaveLength(1);
 const campaignId = ids[0];
 const starts = await Promise.allSettled([owner.client.mutation(api.sessions.start,{campaignId,selectedPlayerIds:[],commandId:'review-start-one'}), owner.client.mutation(api.sessions.start,{campaignId,selectedPlayerIds:[],commandId:'review-start-two'})]);
 expect(starts.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 expect(await owner.client.query(api.sessions.list,{campaignId})).toHaveLength(1);
});
test('independent: cyclic visibility intent after a lost reply applies the new command', async () => {
 const { CommandIdentities } = await import('../../web/command-identities');
 const {owner} = await setup();
 const campaignId = await owner.client.mutation(api.campaigns.create,{name:'Campaign',commandId:'review-toggle-campaign'});
 const catalog = await owner.client.query(api.foes.catalog,{campaignId});
 const foeId = await owner.client.mutation(api.foes.add,{campaignId,definitionId:catalog.definitionId,commandId:'review-toggle-foe'});
 let counter=0;
 const ids = new CommandIdentities(()=>`review-toggle-${++counter}`);
 async function attempt(visible:boolean, lostReply:boolean) {
  const key=JSON.stringify(['foes.setVisible',campaignId,foeId,visible]);
  await owner.client.mutation(api.foes.setVisible,{campaignId,foeId,visible,commandId:ids.forPayload(key)});
  if (lostReply) throw new Error('Lost reply');
  ids.acknowledged(key);
 }
 await expect(attempt(true,true)).rejects.toThrow('Lost reply');
 await attempt(false,false);
 await attempt(true,false);
 const row=(await owner.client.query(api.foes.list,{campaignId})).rows[0];
 expect('visible' in row && row.visible).toBe(true);
});
