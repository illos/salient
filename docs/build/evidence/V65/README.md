# V65 verification evidence

Actual source: `c0fe8b1054ec5d6a5db908b1b85163f5f7879889`, cloud dev `different-bat-943`.
See [the result and blockers](../../V65-character-headless.md#initial-verification--2026-09-20).

- [Combined check](check.log), [exit 2](check.exit): lint/299 engine pass; app TypeScript blocker.
- [Backend/script tests](backend-tests.log), [exit 0](backend-tests.exit): 413 pass.
- [Backend publication](deploy.log), [exit 0](deploy.exit): ordinary deployment checks enabled.
- [Live headless report](headless.json), [log](headless.log), [exit 1](headless.exit): 14 pass, one assertion failure, seven dependent skips.
- [Formatting](format.log), [exit 0](format.exit).

Logs have only ANSI color escapes/trailing whitespace normalized. Original archive retained outside
Git at `/srv/presidium/projects/salient/character-restart-evidence/v65-evidence.tar.gz`, mode 0600.
The initial pass stopped without repairs. The user later authorized both blocker fixes.
No browser runs, frontend publication, seed or data reset were needed for those fixes.

## Authorized repair evidence

Backend and final runner: `b1f50c878d5b9ba1e7936257e0563b4c07f77b45`, on `slice/V65`.
[Final live report](fixed-headless.json): exit 0, all 22 scenarios pass in 73.547 seconds.
Targeted Prettier/ESLint and app TypeScript passed; backend deployment passed ordinary type/schema
checks. Independent scoped review passed. Diagnostic passes localized the original assertion to
auth JWKS HTTP 429; the exact public key route exemption fixes it without weakening assertions.
Two full diagnostic passes (~47s each) and two lifecycle-only passes (~44s each) preceded the fix;
no timeout retries or browser work occurred. Temporary diagnostic instrumentation is absent from
the committed/final runner. Original failing evidence above is retained as history.

[Normal application build](fixed-build.log), [exit 0](fixed-build.exit): rules ingestion,
TypeScript, Vite and web budget checks all pass. The complete `pnpm check` was not repeated;
its unchanged engine/app/script test evidence is recorded above.
