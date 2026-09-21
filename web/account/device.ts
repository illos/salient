// SPDX-License-Identifier: GPL-3.0-only
/** Better Auth's active-session API and plain-language labels for the Security panel (V95). */
import { useCallback, useEffect, useState } from 'react';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';

export type Device = {
  id: string;
  token: string;
  current: boolean;
  userAgent: string | null;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
};

/** Follows every explicit Convex cursor, then filters expiry against the browser clock. */
export function useDevices() {
  const convex = useConvex();
  const [devices, setDevices] = useState<Device[] | undefined>();
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      const all: Device[] = [];
      let cursor: string | null = null;
      let done = false;
      while (!done) {
        const result: { page: Device[]; continueCursor: string; isDone: boolean } =
          await convex.query(api.account.devicesPage, { cursor });
        all.push(...result.page);
        cursor = result.continueCursor;
        done = result.isDone;
      }
      const now = Date.now();
      setError(null);
      setDevices(
        all
          .filter(session => session.expiresAt > now)
          .sort((a, b) =>
            a.current === b.current ? b.updatedAt - a.updatedAt : a.current ? -1 : 1,
          ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to list signed-in devices.');
    }
  }, [convex]);
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
