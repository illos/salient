// SPDX-License-Identifier: GPL-3.0-only
import { useRef, useState } from 'react';
import { cn } from 'cn';
import { CommandIdentities } from './command-identities';

export function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/\[CONVEX[^\]]*\]\s*/g, '')
    .replace(/\[Request ID:[^\]]*\]\s*/g, '')
    .split('\n    at ')[0];
}

/** Retain a command identity after an ambiguous failure; a retry cannot duplicate a write. */
export function useCommand() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const commands = useRef(new CommandIdentities());
  async function run(
    fn: (commandId: string) => Promise<unknown>,
    payloadKey: string,
  ): Promise<boolean> {
    if (inFlight.current) return false;
    inFlight.current = true;
    setPending(true);
    setError(null);
    const commandId = commands.current.forPayload(payloadKey);
    try {
      await fn(commandId);
      commands.current.acknowledged(payloadKey);
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }
  return { run, pending, error };
}

export function ErrorNotice({ error }: { error: string | null }) {
  return error ? (
    <p
      className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm whitespace-pre-wrap text-destructive [overflow-wrap:anywhere]"
      role="alert"
    >
      {error}
    </p>
  ) : null;
}
export function Loading({ children = 'Loading…' }: { children?: React.ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground" role="status">
      {children}
    </p>
  );
}

/** A quiet informational notice on the surface tone. */
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
    <div
      className={cn('border-l-2 border-rule-strong bg-muted px-3 py-2 text-sm', className)}
      role={role}
    >
      {children}
    </div>
  );
}

/** Compact uppercase metadata line above a heading. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn('eyebrow mb-1', className)}>{children}</p>;
}

/** A section heading with the mockups' hard rule beneath it and an optional trailing slot. */
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
    <div
      className={cn(
        'rule-strong mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 pb-2',
        className,
      )}
    >
      <Heading>{children}</Heading>
      {aside !== undefined && <span className="eyebrow mb-0">{aside}</span>}
    </div>
  );
}

/** A vertical form field: uppercase label above a control, hint below. */
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
      <span className="caps text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
    </label>
  );
}
