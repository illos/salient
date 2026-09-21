// SPDX-License-Identifier: GPL-3.0-only
/** Better Auth's active-session API and plain-language labels for the Security panel (V95). */
import { useCallback, useEffect, useState } from 'react';
import { authClient } from '../auth-client';

export type Device = {
  id: string;
  token: string;
  current: boolean;
  userAgent: string | null;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
};

function millis(value: Date | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

/** Uses Better Auth's unbounded active-session route; its server owns expiry filtering. */
export function useDevices(currentToken: string | undefined) {
  const [devices, setDevices] = useState<Device[] | undefined>();
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (!currentToken) return;
    const result = await authClient.listSessions();
    if (result.error) {
      setError(result.error.message || 'Unable to list signed-in devices.');
      return;
    }
    setError(null);
    setDevices(
      result.data
        .map(session => ({
          id: session.id,
          token: session.token,
          current: session.token === currentToken,
          userAgent: session.userAgent ?? null,
          createdAt: millis(session.createdAt),
          updatedAt: millis(session.updatedAt),
          expiresAt: millis(session.expiresAt),
        }))
        .sort((a, b) => (a.current === b.current ? b.updatedAt - a.updatedAt : a.current ? -1 : 1)),
    );
  }, [currentToken]);
  useEffect(() => {
    const pending = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(pending);
  }, [refresh]);
  return { devices, error, refresh };
}

/** "Chrome on macOS" from a user agent string; "Unknown device" when nothing recognisable. */
export function describeDevice(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device';
  const ua = userAgent;
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : null;
  const os = /iPhone|iPad/.test(ua)
    ? 'iOS'
    : /Android/.test(ua)
      ? 'Android'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /CrOS/.test(ua)
            ? 'ChromeOS'
            : /Linux/.test(ua)
              ? 'Linux'
              : null;
  if (browser && os) return `${browser} on ${os}`;
  return browser ?? os ?? 'Unknown device';
}

/** "just now", "5 min ago", "3 h ago", "2 d ago", then the date. */
export function sinceLabel(at: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} d ago`;
  return new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
