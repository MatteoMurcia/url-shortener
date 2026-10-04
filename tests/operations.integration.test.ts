import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawnSync } from 'node:child_process';
import { expect, test, vi } from 'vitest';
import { createApp } from '../src/server/app.js';
import { closeApplication } from '../src/server/shutdown.js';
import { migrate } from '../src/server/migrations.js';
import { createTestPool, withTestSchema } from './database.js';

test('logs correlated requests without bodies, headers, codes, paths or query secrets', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {});
  try {
    await withTestSchema(async client => {
      await migrate(client);
      const app = createApp({ database: client, baseUrl: 'http://127.0.0.1' });
      app.use((_request, response) => response.type('html').send('<h1>Frontend</h1>'));
      const server = createServer(app).listen(0, '127.0.0.1');
      await once(server, 'listening');
      try {
        const address = server.address();
        if (!address || typeof address === 'string') throw new Error('Expected TCP address');
        const origin = `http://127.0.0.1:${address.port}`;
        const created = await fetch(`${origin}/api/links?secret=sensitive`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'sensitive', 'X-Request-ID': 'sensitive' },
          body: JSON.stringify({ url: 'https://example.com/sensitive' }),
        });
        const link = await created.json();
        const redirect = await fetch(`${origin}/r/${link.code}`, { redirect: 'manual' });
        await redirect.text();
        const missing = await fetch(`${origin}/api/sensitive?token=sensitive`);
        expect(missing.status).toBe(404);
        expect(await missing.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'API route not found.' } });
        const entries = log.mock.calls.map(([line]) => JSON.parse(line as string));
        expect(entries).toHaveLength(3);
        expect(entries.map(entry => [entry.route, entry.status])).toEqual([
          ['/api/links', 201], ['/r/:code', 302], ['unmatched', 404],
        ]);
        expect(new Set(entries.map(entry => entry.requestId)).size).toBe(3);
        for (const [index, response] of [created, redirect, missing].entries()) {
          expect(entries[index].requestId).toBe(response.headers.get('x-request-id'));
          expect(entries[index].requestId).toMatch(/^[a-f0-9-]{36}$/);
          expect(entries[index].durationMs).toBeGreaterThanOrEqual(0);
          expect(entries[index].aborted).toBe(false);
        }
        expect(JSON.stringify(entries)).not.toContain('sensitive');
        expect(JSON.stringify(entries)).not.toContain(link.code);
      } finally {
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      }
    });
  } finally {
    log.mockRestore();
  }
});

test('shutdown drains an active request before ending its real PostgreSQL pool', async () => {
  const database = createTestPool(process.env);
  let received!: () => void;
  const started = new Promise<void>(resolve => { received = resolve; });
  const server = createServer((_request, response) => {
    received();
    void database.query('SELECT pg_sleep(0.2)').then(() => response.end('Completed'), () => {
      response.statusCode = 503;
      response.end('Failed');
    });
  }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected TCP address');
    const pending = fetch(`http://127.0.0.1:${address.port}`).then(async response => [response.status, await response.text()]);
    await started;
    const closeDevelopment = vi.fn(async () => {});
    await closeApplication(server, database, closeDevelopment);
    expect(await pending).toEqual([200, 'Completed']);
    expect(server.listening).toBe(false);
    expect(database.totalCount).toBe(0);
    expect(closeDevelopment).toHaveBeenCalledOnce();
    await expect(database.query('SELECT 1')).rejects.toThrow('Cannot use a pool after calling end');
  } finally {
    if (server.listening) await closeApplication(server, database);
  }
});

test.each([
  { PORT: 'invalid', DATABASE_URL: 'sensitive', expected: 'PORT must be an integer' },
  { PORT: '3000', DATABASE_URL: 'sensitive', expected: 'A valid PostgreSQL DATABASE_URL' },
])('invalid startup configuration exits clearly without leaking input: $expected', ({ expected, ...invalid }) => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/server/main.ts'], {
    env: { ...process.env, ...invalid, BASE_URL: 'http://127.0.0.1' }, encoding: 'utf8', timeout: 10000,
  });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain(`Invalid configuration: ${expected}`);
  expect(result.stderr).not.toContain('sensitive');
  expect(result.stdout).not.toContain('running');
});
