# V18: Hosting: Cloudflare, Convex Cloud, LAN portability

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App lead |
| Rules review | not required |
| Depends on | A09 |
| Unblocks | None |
| Status | see `STATUS.md` |

## Goal

Prepare the hosted deployment (Cloudflare static delivery and R2-style object storage, Convex Cloud
backend, Better Auth, an email adapter for password reset) and prove LAN portability through a
self-hosted Convex container behind a local reverse proxy with local assets, using one storage
interface and configuration-driven endpoints. The slice produces deployable configuration and a
verified local run; it performs no external deployment or publication without an explicit user
instruction in the thread that executes it.

## Spec references

- `docs/v1-tech-stack-spec.md#8-hosted-and-lan-deployment-boundaries` — responsibility table, storage boundary, LAN requirements.
- `docs/v1-tech-stack-spec.md#7-authentication-and-email` — Better Auth and email.
- `docs/v1-tech-stack-spec.md#9-verification-and-acceptance` — acceptance criteria.
- `docs/v1-tech-stack-spec.md#10-remaining-implementation-choices` — storage adapter and LAN packaging.
- `docs/v1-spec-checkpoint.md#technology-and-delivery` — hosted plan and LAN preservation.
- `docs/engine-architecture.md#standalone-engine-and-portability` — engine runs the same release locally.
- `docs/development-process.md#confirmed-pre-alpha-development-policy` — no automatic deployment.

## In scope

- Storage interface (upload/read/delete, stable keys, signed URL resolution) with R2 and local-file adapters.
- Hosted configuration: Cloudflare SPA routing, Convex Cloud environment, auth origins; Cloudflare bindings isolated from reusable code.
- LAN configuration: pinned self-hosted Convex container with persistent volumes, Caddy or equivalent for HTTPS and WebSocket, hostname-based endpoint configuration, local copies of permitted assets.
- Backup and recovery procedure for the local instance.

## Out of scope

- Actually deploying to Convex Cloud or Cloudflare (`CLAUDE.md`: explicit user instruction required).
- Cloud-to-LAN migration, identity mapping or synchronization (`docs/v1-tech-stack-spec.md#8-hosted-and-lan-deployment-boundaries`).
- Email provider selection beyond the adapter (deferred).
- Offline clients.

## Inputs and dependencies

- Hard: A09; V10 for the reset email adapter (soft: use `fixtures/dev-mailbox` if V10 is not committed).

## Deliverables

- `deploy/hosted/` and `deploy/lan/` configuration with README run steps; `docker-compose` pinned by digest.
- Storage adapter package with both implementations and tests.
- Verification transcript of a full v0.01 journey against the LAN stack from a second device on the same network.
- Implementation notes in `docs/v1-tech-stack-spec.md#8-hosted-and-lan-deployment-boundaries`.

## Acceptance checks

1. The production build runs against the self-hosted container with WAN disabled after setup; the v0.01 journey completes from a phone on the LAN using the configured hostname.
2. Both storage adapters pass the same test suite; asset records contain keys, never provider URLs.
3. No reusable module imports a Cloudflare-only binding (lint rule or grep in CI).
4. Stopping and restarting the container preserves accounts, campaigns and history.
5. The hosted configuration validates (dry run) without any resource being created externally, and the work log states no deployment was performed.
6. Secrets and admin keys are absent from the client bundle (build output scan).

## Rules research

None.

## Open questions

Candidate `Q-V-n` entries:

- Concrete Cloudflare storage/upload arrangement and local recovery arrangements (`docs/v1-tech-stack-spec.md#10-remaining-implementation-choices`).
- Email delivery provider (`docs/accounts-and-access-spec.md#11-remaining-decisions`).

## Work log

_Empty._
