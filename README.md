# URL Shortener

A full-stack portfolio project built incrementally with TypeScript and Node.js.
The first planned delivery will create persistent short links and redirect visitors
to their destinations, with an accessible web interface and verifiable behavior.

## Current status

**T03: local PostgreSQL and isolated integration tests.** A responsive React
landing page and Express backend run together. PostgreSQL development and test
instances are available through Compose, with a reusable connection pool and
separate test commands.

Link schema, migrations, and link creation come in later tasks. The HTTP app does
not use the pool yet, and there is no public deployment. The AI feature is still
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

```sh
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

Both modes load an optional root `.env` file through Node.js. If it is absent,
the startup notice is informational and defaults apply:

| Variable | Default | Validation |
| --- | --- | --- |
| `PORT` | `3000` | Integer from 1 to 65535 |
| `HOST` | `127.0.0.1` | Nonempty bind address; Node resolves it when listening |

The default bind address exposes the app only on your machine. To choose another
port, place `PORT=3001` in a local `.env` file; keep that file out of Git.

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

`npm test` runs the 26 tests that need no PostgreSQL. `npm run test:integration`
runs two real-database tests, including parameterized queries and rollback. Both
commands load `.env` if present; existing process environment values take precedence.
Missing database configuration or an unavailable database causes integration
tests to fail, not skip.

The test helper requires an explicit `TEST_DATABASE_URL`, database name
`url_shortener_test`, no test URL query/fragment overrides, and a name different
from the development database. It does not delete data or run migrations. T04
will add the versioned schema and extend this setup.

Stop the services when finished with `docker compose --profile test stop`.
End-to-end browser tests remain planned for T10.

## Structure

```text
src/server/app.ts       HTTP routes, independently testable
src/server/config.ts    Environment validation
src/server/db.ts        PostgreSQL pool factory (not yet used by HTTP routes)
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
