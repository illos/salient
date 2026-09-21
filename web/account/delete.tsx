// SPDX-License-Identifier: GPL-3.0-only
/**
 * Delete account section (V95): password-confirmed deletion through Better Auth's delete-user
 * route; the user-delete trigger (convex/auth.ts) purges the app data under the contract in
 * docs/accounts-and-access-spec.md#campaign-and-account-deletion.
 */
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { authClient } from '../auth-client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../toast';
import { Field, Notice, errorMessage } from '../ui';

export function DeletePanel() {
  const navigate = useNavigate();
  const showError = useToast();
  const [pending, setPending] = useState(false);
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async event => {
        event.preventDefault();
        if (pending) return;
        const password = String(new FormData(event.currentTarget).get('password'));
        setPending(true);
        try {
          const result = await authClient.deleteUser({ password });
          if (result.error)
            throw new Error(result.error.message || 'Unable to delete the account.');
          await navigate({ to: '/login', search: { next: '/' }, replace: true });
        } catch (e) {
          showError(errorMessage(e));
          setPending(false);
        }
      }}
    >
      <Notice>
        <p className="m-0">
          Deleting your account removes the campaigns you own, with their sessions, logs, chat and
          foes. Players in those campaigns keep their characters, detached and with campaign values
          cleared.
        </p>
        <p className="mt-2 mb-0">
          Your own characters are deleted, including any at another table. Your past actions and
          messages in other campaigns keep your name.
        </p>
      </Notice>
      <Field label="Your password" hint="Confirms it is you." className="max-w-sm">
        <Input name="password" type="password" required autoComplete="current-password" />
      </Field>
      <div>
        <Button type="submit" variant="destructive" size="sm" disabled={pending}>
          {pending ? 'Deleting…' : 'Delete my account'}
        </Button>
      </div>
    </form>
  );
}
