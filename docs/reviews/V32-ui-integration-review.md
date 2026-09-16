# V32 wizard and character-page integration review

Reviewer: the Forge-reference/progression-UI agent, independently reviewing the parent agent's
changes to `web/wizard/index.tsx` and `web/characters.tsx`. The reviewer authored the separate
progression page/router changes, so this report does **not** claim independent review of those files.

## Result

**PASS — the finding below was fixed and rechecked.** This is a static integration review;
browser acceptance and backend rules verification remain separate evidence.

## Resolved finding

1. **An acknowledged save can make an unattached character's own editor stale.** The wizard
   captures `expectedEffectiveRevisionId` once and never updates it. `characters.save` activates
   a complete unattached revision when the character already has an effective revision (for
   example a restored or detached hero). That legitimate save changes the effective ID, so the
   wizard's reactive stale check rejects its own result and prevents subsequent saves until
   reload. Refresh the effective identity after acknowledging this exact save, without silently
   rebasing onto another tab's intervening write. Reported to the parent before handoff.

   **Resolution verified:** after the acknowledged standalone save, the wizard reads the owned
   character and updates its expected effective ID only when the returned revision equals the
   acknowledged revision, the character is still unattached and that draft is effective. A newer
   write or campaign attachment therefore remains a stale conflict. The saved revision guard
   continues to protect the local selections from unrelated reactive updates.

## Reviewed behavior

- The full editor derives definitions and evaluator target level from the saved draft's level,
  preserving level-two decisions when editing an advanced Fury.
- `DecisionEditor` receives explicit definitions, including characteristic-assignment and
  parent-branch resolution; its level-one default preserves existing callers.
- Local selections and authored text are initialized once per character. Revision and effective
  identity conflicts disable saving without discarding those local edits.
- A stale full-edit draft requires an explicit reconciliation acknowledgment before saving;
  submission stays disabled while the backend reports it stale.
- Detached/unattached effective builds can be submitted for admission. Campaign-attached
  effective builds remain ineligible for redundant edit submission.
- The character header shows Progression only for owner/Director audiences; owner-only draft
  controls remain gated by the owner audience.

## Validation

- `pnpm exec tsc -p tsconfig.web.json --pretty false`: passed after integration of the new route
  and progression page.
- Scoped ESLint for reviewer-owned progression/router files: passed; this is a local integration
  check, not independent review of those files.
- No browser, deployment, or complete-slice audit claim is made in this report.
