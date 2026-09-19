# First browser batch: registration refusal

Retained Playwright failure context; fixed test password redacted and repeated test source omitted.

# Test info

- Name: wizard.spec.ts >> wizard, admission review and the three sheet audiences
- Location: tests/browser/wizard.spec.ts:23:1

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
  - textbox "Display name": Observer 16d38dd2
  - text: Email
  - textbox "Email": wizard-observer-16d38dd2@example.test
  - text: Password
  - textbox "Password": [redacted test password]
  - alert: Too many requests. Please try again later.
  - button "Create account"
  - button "Already have an account? Sign in"
```
