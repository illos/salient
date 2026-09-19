# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: closeout.spec.ts >> closeout awards once, is shared with observers, and paused session closure offers Void
- Location: tests/browser/closeout.spec.ts:21:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Combat closeout', exact: true })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Combat closeout', exact: true }) with timeout 15000ms
  - waiting for getByRole('heading', { name: 'Combat closeout', exact: true })

```

```yaml
- heading "This page is unavailable" [level=1]
- alert: "Function execution timed out (maximum duration: 1s) Called by client"
- button "Retry"
- link "Back to campaigns":
  - /url: /
```
