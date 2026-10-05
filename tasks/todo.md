# Delivery checklist

Status: T01–T12, checkpoint F and the rate-limiting follow-up are merged into main.
Scope: a locally runnable full-stack portfolio application; no public service deployment.
Requirements: [SPEC.md](../SPEC.md). Sequence: [Implementation plan](plan.md).

## Implementation tasks

- [x] T01 — Strict TypeScript, lint, pinned dependencies and verification scripts.
- [x] T02 — React and Express on one origin; development and compiled asset serving.
- [x] T03 — PostgreSQL Compose services with separate development/test storage.
- [x] T04 — Versioned migrations, unique link codes, rollback and schema isolation.
- [x] T05 — Form submission persists before success and prevents duplicate pending submissions.
- [x] T06 — Uncached 302 redirects, readable 404 and controlled database failures.
- [x] T07 — URL/body validation and accessible error feedback.
- [x] T08 — Forced collisions, bounded retries and concurrent connection checks.
- [x] T09 — Clipboard success/manual fallback, keyboard and responsive presentation.
- [x] T10 — Isolated browser creation, copying and local destination navigation.
- [x] T11 — Private request logs, startup validation and bounded resource cleanup.
- [x] T12 — Setup documentation, architecture decisions and GitHub CI.

## Checkpoints

- [x] A — Runtime: development/compiled serving, API health and frontend rendering verified.
- [x] B — Data: empty-schema setup, repeatable migrations and guarded test cleanup verified.
- [x] C — Flow: browser creation and destination navigation verified, including backend restart.
- [x] D — Resilience: collision/concurrency behavior reviewed; changing the retry limit makes the expected tests fail.
- [x] E — Experience: browser suite passes; mobile, keyboard and copy fallback reviewed.
- [x] F — Final delivery: acceptance traceability, lifecycle verification and portfolio documentation completed.

## Checkpoint F acceptance

- [x] Every product acceptance criterion is linked to evidence in the table below.
- [x] Cleanup waits for HTTP even if development shutdown throws or rejects.
- [x] The compiled process handles real SIGINT/SIGTERM and its forced shutdown deadline in Linux CI.
- [x] Setup instructions, architecture rationale and a product screenshot support review and demonstration.
- [x] Documentation is consistent, in English, and distinguishes source publication from public hosting.

## Acceptance traceability

| Criterion | Evidence |
| --- | --- |
| AC1: persistent creation and configured origin | tests/create-link.integration.test.ts; e2e/links.spec.ts |
| AC2: destination validation | tests/validation.test.ts; tests/create-link.integration.test.ts; browser validation scenario |
| AC3: redirects and missing codes | tests/redirect.integration.test.ts; browser local-destination and 404 scenarios |
| AC4: randomness, uniqueness and collisions | tests/schema.integration.test.ts; tests/link-resilience.integration.test.ts |
| AC5: persistence across restart | Redirect integration across server instances; compiled-process/browser restart check recorded at checkpoint C |
| AC6: keyboard, announcements and copying | tests/clipboard.test.ts; browser copy scenarios; manual viewport/keyboard review |
| AC7: controlled failures and body limits | Creation/resilience integration tests; request-log privacy assertions |
| AC8: controlled end-to-end flow | e2e/links.spec.ts and guarded local-server fixtures |

## Verification record

- 2026-10-03: the browser created a link to a controlled local HTML server and
  reopened it after restarting the backend. Query and fragment were preserved.
- 2026-10-04: manual keyboard review covered Tab/Enter, visible focus and copying.
  A 1,919-character destination was checked at 360 and 1,280 pixels without horizontal
  overflow. Clipboard denial selected the full result for manual copying. This was
  not a screen-reader audit.
- 2026-10-04: a fresh checkout passed installation, static checks, 56 unit tests,
  19 integration tests and four Chromium scenarios. Local verification reused
  Compose databases/browser cache; GitHub CI used fresh databases and installed Chromium.
- Main CI after T12: [successful run](https://github.com/MatteoMurcia/url-shortener/actions/runs/37220906573).
- 2026-10-05: cleanup regression tests failed before the fix for synchronous and
  asynchronous development-cleanup failures, then passed after the fix.
- 2026-10-05: [final lifecycle verification](https://github.com/MatteoMurcia/url-shortener/actions/runs/37281808045)
  passed on Linux: 58 unit tests, 19 integration tests, four browser scenarios,
  typecheck, lint, build, and three compiled-process checks (SIGINT, SIGTERM,
  unfinished-request timeout). Both normal signals exited with code 0; the real
  ten-second deadline exited with code 1. A new desktop screenshot was captured
  from the verified browser flow and inspected.

## Post-release security follow-up

- [x] Add independent per-client creation and redirect quotas for CodeQL alert #1.
- [x] Verify rejection before database access, retry headers, quota expiry,
  independent routes, health availability and resistance to spoofed proxy headers.
- [x] Document process-local counters and proxy/scaling requirements.
- 2026-10-05: Both new HTTP regression cases failed before the fix and passed
  afterward. Local validation passed: 60 unit tests, 19 integration tests, four
  Chromium scenarios, typecheck, lint, build and zero known npm audit findings.
  The first integration run found stopped PostgreSQL containers; starting the
  Compose services restored the required environment.
- 2026-10-05: [PR #17](https://github.com/MatteoMurcia/url-shortener/pull/17)
  merged. [Main CI](https://github.com/MatteoMurcia/url-shortener/actions/runs/37326997136)
  and [CodeQL](https://github.com/MatteoMurcia/url-shortener/actions/runs/37326996302)
  passed. CodeQL marked alert #1 as fixed on main.
- 2026-10-05: Repository visibility was verified as public. Main requires PRs
  and a passing, up-to-date quality check; force pushes and deletion are blocked.
  Current security settings are recorded in [README](../README.md#repository-security-and-publication).

## Verification boundaries

Chromium is the only automated browser. Process signal/deadline checks target Linux;
Windows process-kill semantics differ. No load-test or screen-reader conformance claim
is made. A prior local shutdown test timed out once; isolated and subsequent complete
runs passed without increasing timeouts. The cause was not established.
One local unit run also failed to start several workers; the unchanged full rerun
and clean Linux CI passed. These observations are not hidden by retries or skipped tests.

The source repository is public. No public service is deployed and no LICENSE
file is included. The interface does not claim open-source licensing. No AI capability
is implemented.
