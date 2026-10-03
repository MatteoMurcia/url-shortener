# URL Shortener

A full-stack portfolio project built incrementally with TypeScript and Node.js.
The first planned delivery will create persistent short links and redirect visitors
to their destinations, with an accessible web interface and verifiable behavior.

## Current status

**T07: validated link creation and persistent redirection.** The React form submits destinations to Express,
which validates them and stores a random short code in PostgreSQL before returning
the result. Development and test databases run through Compose.

The form has been verified in a real browser, including a delayed database insert,
repeat submission attempts, error feedback, keyboard submission and mobile layout.
Saved links now open their persisted destination through an uncached 302 response. There is no public deployment. The AI feature is still
being defined; no AI capability is implemented or claimed at this stage.

## Prerequisites

- Node.js 24 LTS, with npm
- Git
- Docker with Compose for PostgreSQL integration tests (not required for `npm test`)

## Install and verify

```sh
git clone https://github.com/MatteoMurcia/url-shortener.git
cd url-shortener
npm ci
npm run typecheck
npm run lint
npm test
```

`npm run lint:fix` applies available automatic lint fixes.

Type checking covers TypeScript, React TSX, tests, and the JavaScript ESLint
configuration using `allowJs` and `checkJs`. The lint
configuration is based on the [typescript-eslint setup guide](https://typescript-eslint.io/getting-started/).
TypeScript 6 is pinned because the selected typescript-eslint release does not
support TypeScript 7. Dependencies are recorded in `package-lock.json`.

## Run locally

First copy `.env.example` to `.env` (preserving any existing settings), then:

```sh
docker compose up -d --wait db
npm run db:migrate
npm run dev
```

Open [localhost:3000](http://127.0.0.1:3000). Express mounts Vite as development
middleware, so the frontend and API share one origin. Vite handles frontend
updates; tsx restarts the backend when its imported files change.

To run the compiled application, stop the development server first, then:

```sh
npm run build
npm start
```

The build checks types, bundles React into `dist/client`, and compiles the server
into `dist/server`. Production serves only those client assets and the API;
it does not start Vite. Build dependencies must be installed to run the build.

Both modes load a root `.env` file through Node.js. `DATABASE_URL` is required
(from that file or the process environment); the other settings have defaults:

| Variable | Default | Validation |
| --- | --- | --- |
| `PORT` | `3000` | Integer from 1 to 65535 |
| `HOST` | `127.0.0.1` | Nonempty bind address; Node resolves it when listening |
| `BASE_URL` | `http://127.0.0.1:<PORT>` | HTTP(S) origin without credentials, path, query or fragment |
| `DATABASE_URL` | Required | PostgreSQL connection URL with host and database |

The default bind address exposes the app only on your machine. To choose another
port, place `PORT=3001` in a local `.env` file and update `BASE_URL` if explicitly
set; keep that file out of Git. Generated links use `BASE_URL`, never the request Host header.

## Create a link

Enter a destination in the form and select **Create short link**. The form disables
submission while saving, retains the destination on failure, and displays the
short URL only after the API confirms persistence. Copy controls are planned for T09.

`POST /api/links` accepts JSON `{"url":"https://example.com/path?q=1#part"}`.
On success it returns HTTP 201:

```json
{
  "code": "AbC123xyZ_9-",
  "shortUrl": "http://127.0.0.1:3000/r/AbC123xyZ_9-",
  "destinationUrl": "https://example.com/path?q=1#part"
}
```

Codes contain 12 URL-safe characters from nine cryptographically random bytes.
The database enforces uniqueness; insertion retries at most three times without
overwriting an existing link. Repeated destinations create separate links.
Only HTTP(S) destinations without credentials are accepted, up to 2,048 input
characters after trimming. URLs are normalized with Node's URL parser.

Errors use `{"error":{"code":"INVALID_URL","message":"..."}}`: invalid input
or malformed JSON returns 400, bodies over 8 KiB return 413, and persistence
failures return a generic 503 without database details. This local preview has
no authentication or rate limiting and is not ready for public deployment.

Validation regression tests cover incorrect types, empty values, URL length
boundaries, credentials, disallowed protocols, malformed JSON and oversized
ASCII/multibyte JSON. Browser checks confirm that errors retain the input,
remove any previous result, expose an accessible alert and clear on editing.

## Open a short link

`GET /r/:code` returns 302 with the stored destination in `Location`, including
its path, query and fragment. All handled redirect-route responses use
`Cache-Control: no-store`. Invalid codes (not 12 URL-safe characters) and missing
links return a plain-text 404; database query failures return a generic 503.
The backend looks up the destination without downloading it.

The form exposes **Open short link** after saving. HTTP checks verify redirection
and persistence across a compiled-process restart. Checkpoint C also verified
creation through the form, navigation to a controlled local HTML destination,
and opening the same saved link in the browser after restarting the backend.
The browser preserved the destination query and fragment. Automated browser
regression tests remain planned for T10.

## Health endpoint

`GET /api/health` returns HTTP 200 and `{"status":"ok"}`, with caching disabled.
This reports process liveness, not database readiness. Unknown `/api/*` routes
return a JSON 404 rather than frontend HTML.

## Local PostgreSQL

Copy `.env.example` to `.env` once (`Copy-Item .env.example .env` in PowerShell,
or `cp .env.example .env` in a POSIX shell). Preserve any existing local settings.
The checked-in passwords are local examples, not production credentials.

```sh
docker compose up -d --wait db
npm run db:migrate
docker compose --profile test up -d --wait
docker compose --profile test ps
npm run test:integration
```

| Service | Host port | Database | Storage |
| --- | --- | --- | --- |
| `db` | `127.0.0.1:15432` | `url_shortener` | Named Docker volume |
| `db-test` | `127.0.0.1:15433` | `url_shortener_test` | Temporary memory filesystem |

The test service starts only when explicitly selected or the `test` profile is
enabled. Its separate PostgreSQL instance and credentials isolate it from development.
Stopping/recreating the test container discards its data. The development volume
survives container replacement and `docker compose down` without `--volumes`.

`POSTGRES_PASSWORD` and `TEST_POSTGRES_PASSWORD` initialize each instance; the
matching passwords must also appear in `DATABASE_URL` and `TEST_DATABASE_URL`.
Changing these environment values does not change credentials in an existing
development volume. Do not use this Compose setup as a production deployment.

`createPool(DATABASE_URL)` creates connections lazily, limits the pool to 10,
times out connection acquisition after five seconds, and logs idle connection
failures without credentials. Consumers must call `pool.end()` when done. Use
parameterized queries; transactions must use one checked-out client.

`npm test` runs 54 tests that need no PostgreSQL. `npm run test:integration`
runs eleven real-database tests, including schema constraints, migration history,
concurrent runners, rollback HTTP link creation, rejected request bodies with no inserted rows, and redirection
across server instances. Both
commands load `.env` if present; existing process environment values take precedence.
Missing database configuration or an unavailable database causes integration
tests to fail, not skip.

The test helper requires an explicit `TEST_DATABASE_URL`, database name
`url_shortener_test`, no test URL query/fragment overrides, and a name different
from the development database. `withTestSchema` additionally checks the connected
database, creates a unique schema, and drops only that schema after each test.
Migration tests apply SQL inside these isolated schemas; they never reset the
shared public schema or development data.

Stop the services when finished with `docker compose --profile test stop`.
End-to-end browser tests remain planned for T10.

## Migrations

```sh
npm run db:migrate
```

The command targets `DATABASE_URL` (development by default in `.env`). It loads
versioned SQL from `db/migrations` and records filenames in `schema_migrations`.
Running it twice applies `001_links.sql` once; subsequent runs report that the
database is up to date. The `links` table contains a `varchar(12)` primary-key
code, a non-null destination URL, and a timestamp generated by PostgreSQL.

All pending files run in alphabetical order in one transaction, on the same
connection. A transaction-scoped advisory lock serializes migration runners;
lock acquisition times out after five seconds. Failed batches roll back both
schema changes and history, preserving previously committed data. The command
exits nonzero on failure and closes its database connection.

Add changes as new files such as `002_add_expiration.sql`. Do not edit or rename
already-applied files: history tracks filenames, not checksums. Migration SQL
must be transaction-compatible and must not contain its own transaction control
or use operations such as `CREATE INDEX CONCURRENTLY`. There is no automatic
down/reset command; reversing an applied change requires a reviewed new migration.
The CLI uses tsx and runs from the source checkout with development dependencies
installed; migration packaging for deployment remains a later task.

The transaction model follows the [node-postgres transaction guidance](https://node-postgres.com/features/transactions)
and [PostgreSQL advisory locking](https://www.postgresql.org/docs/17/explicit-locking.html#ADVISORY-LOCKS).

## Structure

```text
src/server/app.ts       HTTP routes, independently testable
src/server/config.ts    Environment validation
src/server/db.ts        PostgreSQL pool factory
src/server/links.ts     Destination validation and persistent link creation
src/server/migrations.ts Transactional migration runner
scripts/migrate.ts     Migration CLI
db/migrations/        Versioned SQL files
src/server/main.ts      Development/production startup
src/client/             React page and responsive CSS
tests/                  Unit tests, isolated DB helper, *.integration.test.ts
compose.yaml            Local PostgreSQL instances
vitest.config.ts        Separate unit and integration projects
```

The development integration follows [Vite's middleware API](https://vite.dev/guide/ssr.html#setting-up-the-dev-server);
the application is client-rendered and does not implement SSR.

## Project documentation

- [First-delivery specification](SPEC.md)
- [Architecture and implementation plan](tasks/plan.md)
- [Task checklist and verification steps](tasks/todo.md)

Planning documents are currently in Spanish. Public-facing project documentation
and code use English.

## Working on the project

Keep changes focused on one task, run the relevant checks, and record the result
in the task checklist. Commit each verified implementation step separately so
the PR explains the progression. Use short-lived branches and preserve the small
commits when merging if that history should remain visible on main.
Do not commit credentials, local environment files,
dependencies, or generated output.

The package is marked `private` to prevent accidental npm publication; that setting
does not control the visibility of the GitHub repository.
