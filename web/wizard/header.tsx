// SPDX-License-Identifier: GPL-3.0-only
/**
 * The wizard header (character-wizard-class.png; V21 item 10): wordmark, thin rule, the caps
 * NEW HERO / EDIT HERO context, the hero name in grey, SAVE DRAFT and EXIT at the right, then the
 * user menu. It replaces the site nav on the wizard route (web/router.tsx, `isWizardRoute`).
 * The buttons call back into the wizard; nothing here saves or navigates on its own.
 */
import { Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '../components/ui/button';
import { UserMenu } from '../components/session-user';

export function WizardHeader({
  heroName,
  editing,
  saving,
  canSave,
  onSaveDraft,
  onExit,
}: {
  heroName: string;
  /** The character already has an approved build: EDIT HERO instead of NEW HERO. */
  editing: boolean;
  saving: boolean;
  canSave: boolean;
  onSaveDraft: () => void;
  onExit: () => void;
}) {
  const viewer = useQuery(api.auth.viewer);
  return (
    <header className="flex h-(--session-header-height) items-center gap-5 border-b border-rule-strong bg-background px-(--pane-padding-x)">
      <Link to="/" className="text-2xl font-bold tracking-tight hover:no-underline">
        Salient
      </Link>
      <span aria-hidden className="h-7 w-px bg-rule-strong" />
      <span className="caps text-foreground">{editing ? 'Edit hero' : 'New hero'}</span>
      <h1 className="m-0 truncate text-base font-normal text-muted-foreground">
        {heroName || 'Unnamed hero'}
      </h1>
      <div className="ml-auto flex items-center gap-3">
        <Button type="button" variant="outline" disabled={!canSave} onClick={onSaveDraft}>
          {saving ? 'Saving…' : 'Save draft'}
        </Button>
        <Button type="button" variant="ghost" disabled={saving} onClick={onExit}>
          Exit
        </Button>
        {viewer && <UserMenu displayName={viewer.displayName} />}
      </div>
    </header>
  );
}
