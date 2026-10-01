# URL Shortener

A full-stack portfolio project built incrementally with TypeScript and Node.js.
The first planned delivery will create persistent short links and redirect visitors
to their destinations, with an accessible web interface and verifiable behavior.

## Current status

**T02: runnable application foundation.** A responsive React landing page and an
Express backend run together, with strict TypeScript, ESLint, and 13 tests for
the health endpoint, API 404 responses, and environment configuration.

React and Express are implemented; PostgreSQL and link creation come in later
tasks. There is no database or public deployment yet. The AI feature is still
being defined; no AI capability is implemented or claimed at this stage.

## Prerequisites

- Node.js 24 LTS, with npm
- Git

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

Database and end-to-end test commands will be introduced with their tasks.

## Structure

```text
src/server/app.ts       HTTP routes, independently testable
src/server/config.ts    Environment validation
src/server/main.ts      Development/production startup
src/client/             React page and responsive CSS
tests/                  HTTP and configuration tests
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
in the task checklist. Use short-lived branches for subsequent features and keep
commits small enough to review. Do not commit credentials, local environment files,
dependencies, or generated output.

The package is marked `private` to prevent accidental npm publication; that setting
does not control the visibility of the GitHub repository.
