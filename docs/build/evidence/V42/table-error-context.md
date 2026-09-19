# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wizard.spec.ts >> wizard, admission review and the three sheet audiences
- Location: tests/browser/wizard.spec.ts:23:1

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

# Test source

```ts
  95  |   const answerId = crypto.randomUUID();
  96  |   const answerArgs = ['respond', opened.interactionId, '{"dice":"d6"}', '--command-id', answerId];
  97  |   const answered = await cli('player', ...answerArgs);
  98  |   expect(await cli('player', ...answerArgs)).toEqual(answered);
  99  |   expect((await readPending()).resolvedEventId).toBe(answered.eventId);
  100 |   expect(
  101 |     (await query('events:list')).events.filter(
  102 |       (event: { commandId: string }) => event.commandId === answerId,
  103 |     ),
  104 |   ).toHaveLength(1);
  105 |   // Select the real common attack in the shared ability panel, then fire via the foe reticle.
  106 |   await player
  107 |     .getByTitle(
  108 |       `@{character:${heroId}} /ability select ability="mcdm.heroes.v1/feature.ability.common/melee-weapon-free-strike"`,
  109 |       { exact: true },
  110 |     )
  111 |     .click();
  112 |   await player
  113 |     .locator(
  114 |       'button[title="Target Goblin Warrior (selecting a target for a pending ability fires it)"]',
  115 |     )
  116 |     .click();
  117 |   await expect(player.getByRole('button', { name: 'Add edge', exact: true })).toBeVisible();
  118 |   expect((await query('abilities:results')).length).toBe(1);
  119 |   const result = (await query('abilities:results'))[0];
  120 |   const beforeCorrection = await query('table:roster');
  121 |   await player.getByRole('button', { name: 'Add edge', exact: true }).click();
  122 |   await expect(player.getByText(/: 1 edge, 0 bane → total/).first()).toBeVisible();
  123 |   expect((await query('abilities:results'))[0].targets[0].edges).toBe(1);
  124 |   // V31 put a header icon pair on the same operations; keep this on the inline per-entry button.
  125 |   await player
  126 |     .locator('[data-log-feed]')
  127 |     .getByRole('button', { name: 'Undo', exact: true })
  128 |     .first()
  129 |     .click();
  130 |   await expect(player.getByText(/: 0 edge, 0 bane → total/).first()).toBeVisible();
  131 |   expect((await query('abilities:results'))[0].targets[0].edges).toBe(0);
  132 |   expect((await query('table:roster')).foes).toEqual(beforeCorrection.foes);
  133 |   await player
  134 |     .locator('[data-log-feed]')
  135 |     .getByRole('button', { name: 'Redo', exact: true })
  136 |     .first()
  137 |     .click();
  138 |   await expect(player.getByText(/: 1 edge, 0 bane → total/).first()).toBeVisible();
  139 |   expect((await query('abilities:results'))[0].targets[0].edges).toBe(1);
  140 |   expect((await query('abilities:results'))[0].dice).toEqual(result.dice);
  141 |   await command(`@{character:${heroId}} /condition on name=prone`, 'player');
  142 |   await command(`@{foe:${foeId}} /adjust temporary-stamina value=7`);
  143 | 
  144 |   // Reading action, condition and monster references preserves the live table route.
  145 |   const tableUrl = player.url();
  146 |   await player
  147 |     .getByRole('button', { name: 'Read Melee Weapon Free Strike in the rules', exact: true })
  148 |     .last()
  149 |     .click();
  150 |   await expect(player.getByRole('dialog')).toContainText('Melee Weapon Free Strike');
  151 |   await player.getByRole('button', { name: 'Close rule', exact: true }).click();
  152 |   await player
  153 |     .getByRole('button', { name: 'Read Prone in the rules', exact: true })
  154 |     .first()
  155 |     .click();
  156 |   await expect(player.getByRole('dialog')).toContainText('Prone');
  157 |   await player.keyboard.press('Escape');
  158 |   await expect(player).toHaveURL(tableUrl);
  159 |   // V21: a foe's abilities and their references live in the roster drill-in, not on the card.
  160 |   await director.getByRole('button', { name: 'Open Goblin Warrior', exact: true }).first().click();
  161 |   await director
  162 |     .getByRole('button', { name: 'Read Spear Charge in the rules', exact: true })
  163 |     .first()
  164 |     .click();
  165 |   await expect(director.getByRole('dialog').locator('[id="spear-charge"]')).toBeInViewport();
  166 |   await director.getByRole('button', { name: 'Close rule', exact: true }).click();
  167 |   await director.getByRole('button', { name: 'Foes', exact: true }).click();
  168 | 
  169 |   // Repeated real actions keep the three reactive views active; collect post-GC heap/DOM samples.
  170 |   const sessions = await Promise.all(pages.map(page => page.context().newCDPSession(page)));
  171 |   await Promise.all(sessions.map(cdp => cdp.send('Performance.enable')));
  172 |   const samples: unknown[] = [];
  173 |   const started = Date.now();
  174 |   for (let cycle = 0; cycle <= 60; cycle++) {
  175 |     if (cycle)
  176 |       await command(
  177 |         `@{character:${heroId}} /condition ${cycle % 2 ? 'off' : 'on'} name=prone`,
  178 |         'player',
  179 |       );
  180 |     if (cycle % 10 === 0) {
  181 |       const roles = [];
  182 |       for (const [index, cdp] of sessions.entries()) {
  183 |         await cdp.send('HeapProfiler.collectGarbage');
  184 |         const metrics = Object.fromEntries(
  185 |           (await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]),
  186 |         );
  187 |         // Mutations and GC do not guarantee that each client's reactive DOM has settled.
  188 |         // Sample the same bounded window once visible, retaining the original count invariants.
  189 |         let logRows = 0;
  190 |         await expect(async () => {
  191 |           logRows = await pages[index]!.locator('li[data-disposition]').count();
  192 |           expect(logRows).toBeGreaterThan(0);
  193 |           expect(logRows).toBeLessThanOrEqual(50);
  194 |           if (cycle >= 40) expect(logRows).toBe(50);
> 195 |         }).toPass({ timeout: 15_000 });
      |            ^ Error: expect(received).toBeGreaterThan(expected)
  196 |         roles.push({
  197 |           role: ['director', 'player', 'observer'][index],
  198 |           heapBytes: metrics.JSHeapUsedSize,
  199 |           nodes: metrics.Nodes,
  200 |           logRows,
  201 |         });
  202 |       }
  203 |       for (const role of roles) {
  204 |         expect(role.logRows).toBeGreaterThan(0);
  205 |         expect(role.logRows).toBeLessThanOrEqual(50);
  206 |         if (cycle >= 40) expect(role.logRows).toBe(50);
  207 |       }
  208 |       samples.push({ cycle, elapsedMs: Date.now() - started, roles });
  209 |     }
  210 |   }
  211 |   await writeFile(
  212 |     '.playtest/audit-2026-09-15/performance.json',
  213 |     JSON.stringify(
  214 |       {
  215 |         browser: await director.context().browser()!.version(),
  216 |         workload:
  217 |           '60 real condition toggles during one active turn, three reactive Chromium contexts, post-GC samples every 10',
  218 |         durationMs: Date.now() - started,
  219 |         samples,
  220 |         limitation:
  221 |           'Representative local sample, not a one-hour or six-hour certification; no numeric product threshold has been selected.',
  222 |       },
  223 |       null,
  224 |       2,
  225 |     ),
  226 |   );
  227 |   for (const [index, page] of pages.entries())
  228 |     await page.screenshot({
  229 |       path: `.playtest/audit-2026-09-15/combat-${index}.png`,
  230 |       fullPage: true,
  231 |     });
  232 |   await director.getByRole('button', { name: 'End combat', exact: true }).click();
  233 |   for (const page of pages)
  234 |     await expect(page.getByRole('heading', { name: 'Combat closeout', exact: true })).toBeVisible();
  235 |   await director.getByLabel(`Award to Grug ${stamp}`, { exact: false }).check();
  236 |   await director.getByRole('button', { name: 'Confirm Victory award', exact: true }).click();
  237 |   await expect(
  238 |     observer.getByRole('status').filter({ hasText: 'Victory award confirmed: 1' }),
  239 |   ).toBeVisible();
  240 |   await director.getByRole('button', { name: 'Finish cleanup', exact: true }).click();
  241 |   await expect(
  242 |     player.getByRole('status').filter({ hasText: /Running · Free play$/ }),
  243 |   ).toBeVisible();
  244 |   expect((await query('table:roster')).heroes[0].live.victories).toBe(1);
  245 |   await director.goto(campaignUrl);
  246 |   await director.getByRole('button', { name: 'End session', exact: true }).click();
  247 |   await director.getByRole('button', { name: 'Start session', exact: true }).click();
  248 |   await expect(director.getByRole('button', { name: 'Pause session', exact: true })).toBeVisible();
  249 |   expect((await query('table:roster')).heroes[0].live.victories).toBe(1);
  250 | }
  251 | 
```