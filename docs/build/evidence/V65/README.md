# V65 verification evidence

Actual source: `c0fe8b1054ec5d6a5db908b1b85163f5f7879889`, cloud dev `different-bat-943`.
See [the result and blockers](../../V65-character-headless.md#one-pass-result--2026-09-20).

- [Combined check](check.log), [exit 2](check.exit): lint/299 engine pass; app TypeScript blocker.
- [Backend/script tests](backend-tests.log), [exit 0](backend-tests.exit): 413 pass.
- [Backend publication](deploy.log), [exit 0](deploy.exit): ordinary deployment checks enabled.
- [Live headless report](headless.json), [log](headless.log), [exit 1](headless.exit): 14 pass, one assertion failure, seven dependent skips.
- [Formatting](format.log), [exit 0](format.exit).

Logs have only ANSI color escapes/trailing whitespace normalized. Original archive retained outside
Git at `/srv/presidium/projects/salient/character-restart-evidence/v65-evidence.tar.gz`, mode 0600.
No fixes, retries, browser runs, frontend publication, seed or data reset followed verification.
