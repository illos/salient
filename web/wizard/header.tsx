// SPDX-License-Identifier: GPL-3.0-only
/**
 * The wizard header (V21 item 10; Quiet, docs/design-mockups/quiet/README.md): the 64px session
 * header without a rule or divider — wordmark, the sentence-case New hero / Edit hero context in
 * ink, the hero name in muted, the working draft's save state, Save (tonal) and Exit (bare) at
 * the right, then the user menu. It replaces the site nav on the wizard route (web/router.tsx, `isWizardRoute`).
 * The buttons call back into the wizard; nothing here saves or navigates on its own.
 */
import { Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '../components/ui/button';
import { AccountLink } from '../components/session-user';

export function WizardHeader({
  heroName,
  editing,
  saving,
  canSave,
  draft,
  savingDraft,
  onSaveDraft,
  onExit,
}: {
  heroName: string;
  /** The character already has an approved build: EDIT HERO instead of NEW HERO. */
  editing: boolean;
  saving: boolean;
  canSave: boolean;
  /** The wizard's working draft: kept as you go and not yet in the owner's characters (V96). */
  draft: boolean;
  /** A change is still on its way to the server. */
  savingDraft: boolean;
  onSaveDraft: () => void;
  onExit: () => void;
}) {
  const viewer = useQuery(api.auth.viewer);
  return (
    <header className="flex h-(--session-header-height) items-center gap-5 bg-background px-(--pane-padding-x)">
      <Link to="/" className="text-lg font-wordmark hover:no-underline">
        Salient
      </Link>
      <span className="text-base text-foreground">{editing ? 'Edit hero' : 'New hero'}</span>
      <h1 className="m-0 truncate text-base font-normal text-muted-foreground">
        {heroName || 'Unnamed hero'}
      </h1>
      <div className="ml-auto flex items-center gap-3">
        {draft && (
          <span className="text-sm text-muted-foreground" role="status">
            {savingDraft ? 'Saving…' : 'Draft saved'}
          </span>
        )}
        <Button type="button" variant="outline" disabled={!canSave} onClick={onSaveDraft}>
          {saving ? 'Saving…' : draft ? 'Save hero' : 'Save draft'}
        </Button>
        <Button type="button" variant="ghost" disabled={saving} onClick={onExit}>
          Exit
        </Button>
        {viewer && <AccountLink />}
      </div>
    </header>
  );
}
