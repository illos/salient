// SPDX-License-Identifier: GPL-3.0-only
/**
 * Toasts: the app's one place for a transient failure notice. Before V29 every failed operation
 * rendered an error block beside the control that submitted it, which overlapped its neighbours,
 * moved the layout and could not be dismissed (docs/build/V29-desktop-feedback.md item 2). A
 * failure now raises a toast in a fixed region above every other layer, announced through
 * `role="alert"`, dismissible by its own button and expiring on its own.
 *
 * The region is mounted for the life of the app, empty, and carries `aria-live`. Both are load
 * bearing: Base UI hides everything outside an open modal dialog with `aria-hidden`, and its
 * `markOthers` exempts only elements that already carry `[aria-live]` when the dialog opens
 * (@base-ui/react floating-ui-react/utils/markOthers). Without a pre-mounted live region a
 * failure raised from inside the table settings pop-up — where V29 item 1 put Rewind and Redo —
 * would be silent for a screen reader.
 *
 * Only failures pop up. The game log is the record of what happened, so there are no success or
 * informational toasts; nothing here reports or interprets a rule.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { XIcon } from 'lucide-react';

/** How long a toast stays before it expires on its own. Dismissing it is always available. */
const LIFETIME_MS = 10_000;
/** The oldest toasts drop once the stack is this deep, so a failing loop cannot fill the screen. */
const MAX_TOASTS = 4;

type Toast = { id: number; message: string };

/** Raise a failure notice. Repeating the same message refreshes the existing toast. */
export type ShowError = (message: string) => void;

const ToastContext = createContext<ShowError | null>(null);

/**
 * The publisher. Outside a `ToastProvider` — the rules-only build, a test that mounts one
 * component — this falls back to the console rather than throwing, so a missing provider never
 * turns a handled failure into a crash.
 */
export function useToast(): ShowError {
  const show = useContext(ToastContext);
  return useCallback(
    (message: string) => {
      if (show) show(message);
      else console.error(message);
    },
    [show],
  );
}

/**
 * One toast. The lifetime holds while the pointer is over it or the keyboard is inside it, so a
 * toast cannot be taken away from under someone reading it or tabbing to its Dismiss button.
 */
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (held) return undefined;
    const timer = window.setTimeout(() => onDismiss(toast.id), LIFETIME_MS);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss, held]);
  return (
    <li
      className="toast"
      role="alert"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
    >
      <span className="toast-message">{toast.message}</span>
      <button
        type="button"
        className="toast-dismiss"
        aria-label="Dismiss"
        onClick={() => onDismiss(toast.id)}
      >
        <XIcon size={16} aria-hidden />
      </button>
    </li>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const dismiss = useCallback((id: number) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);
  const show = useCallback((message: string) => {
    nextId.current += 1;
    const toast = { id: nextId.current, message };
    setToasts(current => [...current.filter(t => t.message !== message), toast].slice(-MAX_TOASTS));
  }, []);
  return (
    <ToastContext value={show}>
      {children}
      <ol className="toast-viewport" data-toast-viewport aria-live="assertive" aria-label="Errors">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </ol>
    </ToastContext>
  );
}
