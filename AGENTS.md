You are never to use the multiple-choice question widget, ever under any circumstances; ask questions in plain text.

Read and follow [agent.MD](agent.MD) for this project's instructions.

Every implemented trait or feature must be checked against the pinned Compendium for granted
abilities, including actions embedded in prose or dependent on choices/play state. Build those
actions in the appropriate UI list and shared CLI/API route, retain the granting trait, and prove
conditional availability and persisted changes. Trait text alone is not completion. Follow the
[trait-granted ability gate](docs/build/README.md#trait-granted-ability-completion-gate).

All test execution goes through the designated coordinator under [the testing process](testing-process.md).
Submit small reproducible jobs through Chords; do not launch independent test runs or test stacks.
The coordinator runs one job at a time, choosing a suitable local or CT114 environment after checking
capacity. Preserve existing data and record source, runner and application target. The browser
moratorium applies everywhere. Use `presidium-dev` and `presidium-ssh dev-runtime` for CT114;
see [the runbook](docs/remote-development.md#choosing-a-test-environment).
