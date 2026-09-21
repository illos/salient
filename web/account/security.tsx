// SPDX-License-Identifier: GPL-3.0-only
/**
 * Security section (V95): explicitly paginated Better Auth session storage, with the current
 * device first and sign-out per device or for every other device, plus password change with
 * current-password confirmation and other-session revocation.
 */
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { authClient } from '../auth-client';
import { SignOut } from '../components/session-user';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../toast';
import { Field, Loading, Notice, errorMessage } from '../ui';
import { describeDevice, sinceLabel, type Device } from './device';

export function SecurityPanel({
  devices,
  error,
  refresh,
}: {
  devices: Device[] | undefined;
  error: string | null;
  refresh: () => Promise<void>;
}) {
  return (
    <>
      <DevicesList devices={devices} error={error} refresh={refresh} />
      <PasswordForm />
    </>
  );
}

function DevicesList({
  devices,
  error,
  refresh,
}: {
  devices: Device[] | undefined;
  error: string | null;
  refresh: () => Promise<void>;
}) {
  const revokeOthers = useMutation(api.account.revokeOtherDevices);
  const showError = useToast();
  const [pending, setPending] = useState(false);
  async function run(action: () => Promise<unknown>) {
    setPending(true);
    try {
      await action();
      await refresh();
    } catch (e) {
      showError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="m-0 text-lg">Devices</h2>
        {devices && devices.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              run(async () => {
                let done = false;
                while (!done) ({ done } = await revokeOthers({}));
              })
            }
          >
            Sign out of other devices
          </Button>
        )}
      </div>
      {error ? (
        <Notice role="alert">{error}</Notice>
      ) : devices === undefined ? (
        <Loading>Finding your devices…</Loading>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {devices.map(d => (
            <li
              key={d.id}
              className="inset-controls flex min-h-12 items-center gap-4 rounded-md bg-muted px-3.5 py-2"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-base">{describeDevice(d.userAgent)}</span>
                <span className="text-sm text-muted-foreground">
                  {d.current ? 'This device' : `Last active ${sinceLabel(d.updatedAt)}`} · Signed in{' '}
                  {sinceLabel(d.createdAt)}
                </span>
              </span>
              {d.current ? (
                <SignOut />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      const result = await authClient.revokeSession({ token: d.token });
                      if (result.error)
                        throw new Error(result.error.message || 'Unable to sign out that device.');
                    })
                  }
                >
                  Sign out
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PasswordForm() {
  const showError = useToast();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async event => {
        event.preventDefault();
        if (pending) return;
        const form = event.currentTarget;
        const data = new FormData(form);
        const next = String(data.get('next'));
        if (next !== String(data.get('confirm'))) {
          showError('The new passwords do not match.');
          return;
        }
        setPending(true);
        setDone(false);
        try {
          const result = await authClient.changePassword({
            currentPassword: String(data.get('current')),
            newPassword: next,
            revokeOtherSessions: true,
          });
          if (result.error)
            throw new Error(result.error.message || 'Unable to change the password.');
          form.reset();
          setDone(true);
        } catch (e) {
          showError(errorMessage(e));
        } finally {
          setPending(false);
        }
      }}
    >
      <h2 className="m-0 text-lg">Password</h2>
      <Field label="Current password" className="max-w-sm">
        <Input name="current" type="password" required autoComplete="current-password" />
      </Field>
      <div className="grid max-w-2xl grid-cols-2 gap-3">
        <Field label="New password" hint="At least 8 characters.">
          <Input name="next" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password">
          <Input
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
      </div>
      {done && <Notice role="status">Password changed. Other devices were signed out.</Notice>}
      <div>
        <Button type="submit" size="sm" disabled={pending}>
          Change password
        </Button>
      </div>
    </form>
  );
}
