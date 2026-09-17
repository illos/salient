You are never to use the multiple-choice question widget, ever under any circumstances; ask questions in plain text.

Read and follow [agent.MD](agent.MD) for this project's instructions.

All future Salient development server activity, across all branches and worktrees, runs on the
dedicated dev LXC (CT114), accessed through the secret broker. Use `presidium-dev` for servers,
dependency installation, builds and browser tests, and `presidium-ssh dev-runtime` for guest
administration. Do not start these workloads on Presidium. Reuse the shared `main` environment;
concurrent branches need explicitly named environments. See [the runbook](docs/remote-development.md).
