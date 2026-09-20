You are never to use the multiple-choice question widget, ever under any circumstances; ask questions in plain text.

Read and follow [agent.MD](agent.MD) for this project's instructions.

Every implemented trait or feature must be checked against the pinned Compendium for granted
abilities, including actions embedded in prose or dependent on choices/play state. Build those
actions in the appropriate UI list and shared CLI/API route, retain the granting trait, and prove
conditional availability and persisted changes. Trait text alone is not completion. Follow the
[trait-granted ability gate](docs/build/README.md#trait-granted-ability-completion-gate).

Local and remote (CT114) are both valid test environments. Use whichever is free and suitable
for the required test; do not wait for a remote slot when the same proof can run locally.
Coordinate workloads per host/environment, preserve existing data, and record the actual source,
runner location and application target with results. The browser moratorium applies everywhere.
Use `presidium-dev` and `presidium-ssh dev-runtime` for CT114. See
[the runbook](docs/remote-development.md#choosing-a-test-environment).
