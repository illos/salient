// SPDX-License-Identifier: GPL-3.0-only
/**
 * Profile section (V95): portrait (Convex file storage through convex/account.ts), display name
 * (the app profile other players see) and email (Better Auth change-email; unverified addresses
 * change directly, and an address another account uses is refused without saying whose).
 */
import { useRef, useState } from 'react';
import { useAction, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { authClient } from '../auth-client';
import { Disc } from '../components/disc';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../toast';
import { Field, Notice, errorMessage } from '../ui';

const MAX_PORTRAIT_BYTES = 2 * 1024 * 1024;

export function ProfilePanel({
  viewer,
  email,
  refreshSession,
}: {
  viewer: { displayName: string; portraitUrl: string | null };
  email: string;
  refreshSession: () => void;
}) {
  return (
    <>
      <PortraitRow name={viewer.displayName} src={viewer.portraitUrl} />
      <DisplayNameForm current={viewer.displayName} />
      <EmailRow email={email} refreshSession={refreshSession} />
    </>
  );
}

function PortraitRow({ name, src }: { name: string; src: string | null }) {
  const uploadUrl = useMutation(api.account.portraitUploadUrl);
  const setPortrait = useAction(api.account.setPortrait);
  const clearPortrait = useMutation(api.account.clearPortrait);
  const showError = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  async function upload(file: File) {
    if (!file.type.startsWith('image/') || file.size > MAX_PORTRAIT_BYTES) {
      showError('Choose an image under 2 MB.');
      return;
    }
    setPending(true);
    try {
      const url = await uploadUrl({});
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!response.ok) throw new Error('The upload did not finish; try again.');
      const { storageId } = (await response.json()) as { storageId: string };
      const result = await setPortrait({ storageId: storageId as Id<'_storage'> });
      if (!result.ok) throw new Error(result.error);
    } catch (e) {
      showError(errorMessage(e));
    } finally {
      setPending(false);
      if (input.current) input.current.value = '';
    }
  }
  async function remove() {
    setPending(true);
    try {
      await clearPortrait({});
    } catch (e) {
      showError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="flex items-center gap-5">
      <Disc name={name} src={src} size="md" label="" className="size-18 text-xl" />
      <div className="flex flex-col gap-2">
        <span className="text-base">Portrait</span>
        <div className="flex items-center gap-2">
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={event => {
              const file = event.currentTarget.files?.[0];
              if (file) void upload(file);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => input.current?.click()}
          >
            {pending ? 'Working…' : 'Upload'}
          </Button>
          <Button variant="ghost" size="sm" disabled={pending || !src} onClick={remove}>
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

function DisplayNameForm({ current }: { current: string }) {
  const update = useMutation(api.account.updateProfile);
  const showError = useToast();
  const [value, setValue] = useState(current);
  const [pending, setPending] = useState(false);
  const dirty = value.trim().length > 0 && value.trim() !== current;
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async event => {
        event.preventDefault();
        if (!dirty || pending) return;
        setPending(true);
        try {
          await update({ displayName: value });
        } catch (e) {
          showError(errorMessage(e));
        } finally {
          setPending(false);
        }
      }}
    >
      <Field label="Display name" hint="Shown to your Director and the other players at the table.">
        <Input
          name="displayName"
          value={value}
          maxLength={80}
          autoComplete="nickname"
          onChange={event => setValue(event.target.value)}
        />
      </Field>
      {dirty && (
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            Save
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setValue(current)}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
}

function EmailRow({ email, refreshSession }: { email: string; refreshSession: () => void }) {
  const showError = useToast();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [changed, setChanged] = useState(false);
  if (editing)
    return (
      <form
        className="flex flex-col gap-3"
        onSubmit={async event => {
          event.preventDefault();
          if (pending) return;
          const next = String(new FormData(event.currentTarget).get('email')).trim().toLowerCase();
          setPending(true);
          try {
            const result = await authClient.changeEmail({ newEmail: next });
            if (result.error)
              throw new Error(result.error.message || 'Unable to change the email.');
            // Better Auth answers success for an address another account already uses
            // without saying so; the session tells whether the change took.
            const fresh = await authClient.getSession({ query: { disableCookieCache: true } });
            refreshSession();
            if (fresh.data?.user.email !== next)
              throw new Error('That address is already in use by another account.');
            setChanged(true);
            setEditing(false);
          } catch (e) {
            showError(errorMessage(e));
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="New email" hint="You will sign in with the new address from now on.">
          <Input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={email}
            autoFocus
          />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            Save
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-muted-foreground">Email</span>
      <div className="inset-controls flex h-10 items-center justify-between gap-3 rounded-md bg-muted pr-1 pl-3.5">
        <span className="truncate text-base">{email}</span>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Change
        </Button>
      </div>
      <span className="text-sm text-muted-foreground">
        Used to sign in and to recover your password.
      </span>
      {changed && <Notice role="status">Email updated.</Notice>}
    </div>
  );
}
