# Test info

- Name: v21-campaign.spec.ts >> campaign home: header actions, player tiles, copy, join requests, foe chips, log filter
- Location: tests/browser/v21-campaign.spec.ts:23:1

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
  - textbox "Display name": Requester 98a398c9
  - text: Email
  - textbox "Email": v21c-requester-98a398c9@example.test
  - text: Password
  - textbox "Password": Test-only-salient-password-42
  - alert: Too many requests. Please try again later.
  - button "Create account"
  - button "Already have an account? Sign in"
```

# Test source
