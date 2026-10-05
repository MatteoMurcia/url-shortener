# Implementation plan

Status: T01–T12 and checkpoint F merged; source repository public. The rate-limiting
follow-up is also merged. Evidence is recorded in [Delivery checklist](todo.md).
Requirements: [Product specification](../SPEC.md). Design: [Architecture decisions](../docs/architecture.md).

## Approach

Build one complete flow in small, independently verifiable increments. Begin with
runtime and data foundations, connect the form to persistent creation and redirects,
then verify failure paths, accessibility and operation. Avoid speculative services
or generic layers for a single-table application.

## Architecture

A single Node process serves the React assets and Express routes. PostgreSQL is
the source of truth. Vite runs as development middleware; the compiled application
serves static assets. The browser follows redirects; the backend does not fetch destinations.

| Module | Responsibility |
| --- | --- |
| src/client | Form, submission states, result and clipboard fallback |
| src/server/app.ts | HTTP contract, request limits, request logging and error responses |
| src/server/links.ts | Destination validation, random codes and insertion retries |
| src/server/db.ts | Validated PostgreSQL connection pool |
| src/server/migrations.ts | Versioned SQL in a locked transaction |
| src/server/main.ts | Configuration, assets, listening and process signals |
| src/server/shutdown.ts | HTTP draining and resource cleanup |

## Delivery sequence

| Task | Increment | Depends on | Verification |
| --- | --- | --- | --- |
| T01 | Strict TypeScript, package scripts and lint | — | Install, typecheck, lint |
| T02 | Shared-origin React/Express runtime | T01 | Development and compiled startup |
| T03 | Compose databases and isolated test configuration | T02 | Health checks and database identity |
| T04 | Links schema and migration history | T03 | Repeatability, constraints and rollback |
| T05 | Create and persist links from the form | T04 | HTTP creation and pending UI state |
| T06 | Resolve saved codes | T05 | Redirects, 404/503 and restart persistence |
| T07 | Input validation and useful feedback | T06 | Boundary cases and request size |
| T08 | Collisions and concurrency | T07 | Forced collisions and independent connections |
| T09 | Copying and accessible presentation | T08 | Clipboard success/fallback, keyboard and viewport review |
| T10 | Automated browser flow | T09 | Chromium with local destinations |
| T11 | Request logs and graceful shutdown | T10 | Privacy, active requests and startup errors |
| T12 | Reproducible delivery and CI | T11 | Fresh checkout and clean CI runner |

Checkpoints A–F review runtime, data, end-to-end behavior, resilience, user experience
and final delivery respectively. The checklist records outcomes, not estimated effort.

## Definition of done

- Acceptance criteria have executable checks or explicitly scoped manual evidence.
- Relevant tests, types, lint and build pass; CI verifies the submitted revision.
- Errors are controlled, secrets excluded and test data isolated.
- Changes remain focused and independently reviewable in version control.
- Documentation describes actual behavior, tradeoffs and verification limits.

## Risk management

| Risk | Mitigation |
| --- | --- |
| Concurrent inserts overwrite links | Primary key and atomic INSERT ON CONFLICT |
| Tests damage development data | Separate database, guarded schema creation and cleanup |
| Shutdown interrupts work prematurely | HTTP drain before pool closure, regression and process tests |
| Sensitive data enters logs | Allowlisted fields and privacy assertions |
| Scope grows beyond a useful demonstration | Complete one flow; defer unrelated features |
| Public shortener is abused | Keep hosting outside this release; define controls before exposure |

## Deferred work

Accounts, analytics, expiry, caching and AI require separate requirements. Add them
only for an identified use case. Any AI feature must define useful behavior,
evaluation examples, access restrictions and a cost budget before choosing a provider.
Public hosting additionally requires operational ownership and recovery procedures.
