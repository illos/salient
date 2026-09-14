import { useRef, useState } from 'react';
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
    <p className="error" role="alert">
      {error}
    </p>
  ) : null;
}
export function Loading({ children = 'Loading…' }: { children?: React.ReactNode }) {
  return (
    <p className="muted" role="status">
      {children}
    </p>
  );
}
