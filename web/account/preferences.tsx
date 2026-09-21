// SPDX-License-Identifier: GPL-3.0-only
/** Preferences section (V95): the appearance switch, moved here from the header. */
import { ThemeSwitch } from '../components/session-user';

export function PreferencesPanel() {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-muted-foreground">Appearance</span>
      <ThemeSwitch inset className="self-start" />
      <span className="text-sm text-muted-foreground">
        Light, dark, or follow the system. Stored in this browser.
      </span>
    </div>
  );
}
