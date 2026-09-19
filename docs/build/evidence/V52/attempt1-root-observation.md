# V52 runtime observation by the integration lead

At approximately 22:01:50 UTC on 2026-09-19, the lead read:

```
presidium-ssh dev-runtime 'docker logs --tail 35 salient-characters-dev-2389e144b9dd-job-e0e24b7f'
```

The returned output was from Playwright, not `pnpm check`. It included this failure excerpt:

```
      116 |     ).toHaveCount(0);
      117 |     await director.getByRole('button', { name: 'Add foe', exact: true }).click();
    > 118 |     await expect(player.getByRole('progressbar', { name: 'Goblin Warrior health' })).toBeVisible();
          |                                                                                      ^
      119 |     await expect(
      120 |       observer.getByRole('progressbar', { name: 'Goblin Warrior health' }),
      121 |     ).toBeVisible();
        at /app/tests/browser/table-audit.spec.ts:118:86
```

The same output referenced three screenshots, `error-context.md`, and `trace.zip` under
`/artifacts/v52-focused/table-audit-three-table-co-9d727--share-persisted-operations/`, then showed:

```
[3/4] tests/browser/v21-campaign.spec.ts:23:1 › campaign home: header actions, player tiles, copy, join requests, foe chips, log filter
```

A follow-up `docker logs --tail 180` at approximately 22:02:06 UTC reported that the container no
longer existed. This excerpt establishes that the focused browser run had started and one test
had failed; it does not establish the full run's exit code, totals, the cause of failure, or the
preceding check-suite result. Those require the owner's retained output and artifacts.

Chords handoffs 481 and 482 requested correction of the inaccurate stage report and preservation
of the existing run, without starting a duplicate. This note is a partial observation, not a
verification pass.
