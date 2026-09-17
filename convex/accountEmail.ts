// SPDX-License-Identifier: GPL-3.0-only
import { v } from 'convex/values';
import { internalAction } from './_generated/server';
import { deliverPasswordReset } from './lib/accountEmail';

export const sendPasswordReset = internalAction({
  args: { email: v.string(), token: v.string() },
  returns: v.null(),
  handler: async (_ctx, { email, token }) => {
    await deliverPasswordReset(email, token);
    return null;
  },
});
