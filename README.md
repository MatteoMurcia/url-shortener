# URL Shortener

A full-stack portfolio project built incrementally with TypeScript and Node.js.
The first planned delivery will create persistent short links and redirect visitors
to their destinations, with an accessible web interface and verifiable behavior.

## Current status

**T01: project tooling.** The repository contains the architecture proposal,
implementation tasks, strict TypeScript configuration, and ESLint configuration.
There is no running application, database, deployment, or application test suite yet.

The proposed application stack is React, Express, and PostgreSQL. These dependencies
will be introduced with their implementation tasks. The AI feature is still being
defined; no AI capability is implemented or claimed at this stage.

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
```

`npm run lint:fix` applies available automatic lint fixes.

At this stage, type checking validates the JavaScript ESLint configuration using
`allowJs` and `checkJs`; future TypeScript source files are also included. The
configuration is based on the [typescript-eslint setup guide](https://typescript-eslint.io/getting-started/).
TypeScript 6 is pinned because the selected typescript-eslint release does not
support TypeScript 7. Dependencies are recorded in `package-lock.json`.

Application start, build, and test commands will be added when their corresponding
tasks are implemented. They are currently documented as future commands in the spec.

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
