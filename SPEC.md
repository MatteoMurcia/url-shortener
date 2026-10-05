# Product specification

Status: public source repository; local portfolio release complete. Acceptance evidence is recorded in [Delivery checklist](tasks/todo.md).

## Purpose

Demonstrate a complete, maintainable full-stack feature: create a persistent short
link and resolve it to its destination. Keep the implementation small enough to
review, run locally and explain, with explicit tradeoffs and repeatable tests.

## Scope

- Responsive React form with validation, saving state, accessible feedback and copying.
- Express API for link creation and redirection.
- PostgreSQL persistence with versioned, transactional SQL migrations.
- Unit, real-database integration, browser and process lifecycle checks.
- Reproducible setup and GitHub CI.

Accounts, analytics, custom aliases, expiry, caching and AI are outside this release.
There is no public link listing or hosted service. Publishing source code is separate
from operating an internet-facing shortener.

## Technology

Node.js 24, TypeScript, Express, React, Vite, PostgreSQL 17 and node-postgres.
Vitest covers unit/integration behavior; Playwright covers Chromium. Docker Compose
provides local databases. Exact package versions are recorded in package-lock.json.

## Acceptance criteria

| ID | Requirement |
| --- | --- |
| AC1 | POST /api/links accepts a JSON url and returns 201 with code, shortUrl and destinationUrl only after persistence. BASE_URL determines the short origin, independent of the request Host. |
| AC2 | Accept absolute HTTP(S) destinations without credentials, up to 2,048 input characters after trimming. Reject invalid input with 400 and useful feedback. Never download the destination in the backend. |
| AC3 | GET /r/:code returns an uncached 302 to the stored destination, preserving path, query and fragment through URL serialization. Invalid or missing codes return a readable 404. |
| AC4 | Cryptographic codes have database-enforced uniqueness. Retry collisions at most three times without overwriting existing data. Exhaustion produces a controlled error. |
| AC5 | Stored links remain valid across backend restarts. |
| AC6 | Support keyboard operation, visible focus and accessible state/error announcements. Confirm copying only after success and offer manual copying on failure. |
| AC7 | Database failures return generic errors without secrets or SQL details. Limit JSON request bodies to 8 KiB. |
| AC8 | Verify creation, copying and browser redirection using an isolated local destination. |

## Operational requirements

- Validate configuration before listening; exit unsuccessfully on invalid startup.
- Log a generated request ID, route template, status, duration and aborted state.
  Never log destinations, request bodies, authorization headers or raw query strings.
- Stop accepting requests on SIGINT/SIGTERM, drain HTTP, close development resources
  and end the pool. Bound shutdown to ten seconds; forced termination exits with code 1.
- Keep development and test data separate; tests may delete only their own schemas.
- Unknown API routes return JSON 404, never the frontend as a successful response.
- Limit each client IP to 30 creation and 120 redirect attempts per 60 seconds,
  independently. Reject excess requests with 429 and Retry-After before parsing
  bodies or accessing PostgreSQL. Keep health checks available and do not trust
  client-supplied proxy headers. Counters are local to one application process.

## Delivery criteria

The README must explain configuration, local startup, API behavior, verification
and limitations. CI must run static checks, migrations, unit/integration tests,
browser checks and compiled-process lifecycle checks. Architecture decisions must
record the chosen approach and its costs. Each acceptance criterion must have
traceable evidence in the delivery checklist.

## Constraints and limitations

This is a local portfolio application, not a production service. Validation does
not certify destinations as safe. Public hosting requires separate abuse controls,
TLS, backup/recovery, readiness and capacity decisions. No throughput, screen-reader
conformance or AI capability is claimed without corresponding verification.

See [Architecture decisions](docs/architecture.md), [Implementation plan](tasks/plan.md)
and [README](README.md) for implementation details and commands.
