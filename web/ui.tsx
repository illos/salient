// SPDX-License-Identifier: GPL-3.0-only
import { useRef, useState } from 'react';
import { ConvexError } from 'convex/values';
import { cn } from 'cn';
import { CommandIdentities } from './command-identities';
import { useToast } from './toast';

/** Shown when an operation failed but left nothing readable behind. */
const UNREADABLE_FAILURE = 'The operation failed without a message. Check the log and retry.';

/**
 * The message a person should read. Convex wraps an operation's own `ConvexError` in a transport
 * envelope — the `[CONVEX M(...)]` and `[Request ID: ...]` tags, a `Server Error` line, an
 * `Uncaught ConvexError:` prefix and the server stack. The table needs the operation's message,
 * so the envelope is stripped; the structured `data` is preferred when the client kept it. The
 * envelope strips run only on a message that actually carried the Convex tags, so an operation
 * whose own wording begins with those words keeps it, and a message that is nothing but envelope
 * falls back rather than raising a blank notice.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof ConvexError) {
    const data: unknown = error.data;
    if (typeof data === 'string' && data.trim()) return data.trim();
  }
  const message = error instanceof Error ? error.message : String(error);
  const wrapped = /\[CONVEX[^\]]*\]/.test(message);
  let text = message
    .replace(/\[CONVEX[^\]]*\]\s*/g, '')
    .replace(/\[Request ID:[^\]]*\]\s*/g, '')
    .split('\n    at ')[0];
  if (wrapped)
    text = text
      .replace(/^\s*Server Error\s*/i, '')
      .replace(/^\s*Uncaught (?:Convex)?Error:\s*/i, '');
  return text.trim() || UNREADABLE_FAILURE;
}

/**
 * Retain a command identity after an ambiguous failure; a retry cannot duplicate a write. A
 * failure raises a toast (docs/build/V29-desktop-feedback.md item 2) rather than an error block
 * beside the control, so a failed operation never moves the layout it failed in.
 */
export function useCommand() {
  const showError = useToast();
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const commands = useRef(new CommandIdentities());
  async function run(
    fn: (commandId: string) => Promise<unknown>,
    payloadKey: string,
  ): Promise<boolean> {
    if (inFlight.current) return false;
    inFlight.current = true;
    setPending(true);
    const commandId = commands.current.forPayload(payloadKey);
    try {
      await fn(commandId);
      commands.current.acknowledged(payloadKey);
      return true;
    } catch (e) {
      showError(errorMessage(e));
      return false;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }
  return { run, pending };
}

export function ErrorNotice({ error }: { error: string | null }) {
  return error ? (
    <p
      className="rounded-md bg-destructive/10 px-3.5 py-2.5 text-base whitespace-pre-wrap text-destructive [overflow-wrap:anywhere]"
      role="alert"
    >
      {error}
    </p>
  ) : null;
}
export function Loading({ children = 'Loading…' }: { children?: React.ReactNode }) {
  return (
    <p className="text-base text-muted-foreground" role="status">
      {children}
    </p>
  );
}

/** An informational notice: a `sub` inset block, no border (Quiet). */
export function Notice({
  children,
  role,
  className,
}: {
  children: React.ReactNode;
  role?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-md bg-muted px-3.5 py-2.5 text-base', className)} role={role}>
      {children}
    </div>
  );
}

/** A 13px muted sentence-case metadata line above a heading. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn('eyebrow mb-1', className)}>{children}</p>;
}

/** A section heading (20px/500) with an optional trailing metadata slot; no rule beneath (Quiet). */
export function SectionHeading({
  children,
  aside,
  className,
  as: Heading = 'h2',
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3';
}) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1', className)}>
      <Heading>{children}</Heading>
      {aside !== undefined && <span className="eyebrow mb-0">{aside}</span>}
    </div>
  );
}

/** A vertical form field: 13px muted label above a control, hint below. */
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
    </label>
  );
}
