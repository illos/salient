# Test info

- Name: combat.spec.ts >> Director starts combat; a player takes and ends a turn; the round advances
- Location: tests/browser/combat.spec.ts:31:1

# Error details

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('li').filter({ has: getByText('Thorn 5c993dcb', { exact: true }) }).getByRole('button', { name: 'Take turn', exact: true }).first()

```

# Test source
