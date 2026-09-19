# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: table-audit.spec.ts >> three table contexts, palette, console and live CLI share persisted operations
- Location: tests/browser/table-audit.spec.ts:40:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Campaigns', exact: true })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Campaigns', exact: true }) with timeout 15000ms
  - waiting for getByRole('heading', { name: 'Campaigns', exact: true })

```

```yaml
- main:
  - text: Salient
  - group "Appearance":
    - button "Light"
    - button "Dark"
    - button "System" [pressed]
  - heading "Every great story starts at the table." [level=1]
  - paragraph: Bring your campaign, your characters and your next session together.
  - text: Pre-alpha Desktop first
  - paragraph: A new seat at the table
  - heading "Create your account" [level=2]
  - text: Display name
  - textbox "Display name": Observer c0f140b5
  - text: Email
  - textbox "Email": audit-observer-c0f140b5@example.test
  - text: Password
  - alert: Too many requests. Please try again later.
  - button "Create account"
  - button "Already have an account? Sign in"
```
