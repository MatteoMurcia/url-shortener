import { createServer, type Server } from 'node:http';
import { once } from 'node:events';
import { afterEach, expect, test, vi } from 'vitest';
import { createApp } from '../src/server/app.js';
import { createPool } from '../src/server/db.js';
import type { Pool } from 'pg';

let server: Server | undefined;
let database: Pool | undefined;

afterEach(async () => {
  if (server) await new Promise<void>((resolve, reject) => {
    server!.close((error) => error ? reject(error) : resolve());
  });
  await database?.end();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function startApp() {
  database = createPool('postgresql://localhost/unused_unit_database');
  server = createServer(createApp({ database, baseUrl: 'https://short.example' }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected TCP address');
  return `http://127.0.0.1:${address.port}`;
}

test('health reports process liveness as uncached JSON', async () => {
  const baseUrl = await startApp();
  const response = await fetch(`${baseUrl}/api/health`);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok' });
  expect(response.headers.get('cache-control')).toBe('no-store');
});

test('unknown API routes return a JSON 404, not the frontend', async () => {
  const baseUrl = await startApp();
  const response = await fetch(`${baseUrl}/api/missing`);
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({
    error: { code: 'NOT_FOUND', message: 'API route not found.' },
  });
});

test.each([
  { method: 'GET', path: '/r/AbC123xyZ_9-', limit: 120, status: 404 },
  { method: 'POST', path: '/api/links', limit: 30, status: 201 },
])('$method $path blocks excess requests before database access and recovers after one minute', async ({ method, path, limit, status }) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.spyOn(console, 'info').mockImplementation(() => {});
  const baseUrl = await startApp();
  const query = vi.spyOn(database!, 'query').mockImplementation(async () => ({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] }));
  const options = { method, headers: { 'Content-Type': 'application/json' },
    ...(method === 'POST' ? { body: JSON.stringify({ url: 'https://example.com' }) } : {}) };
  for (let count = 0; count < limit; count++) {
    const response = await fetch(`${baseUrl}${path}`, options);
    expect(response.status).toBe(status);
    await response.text();
  }
  const blocked = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...options.headers, 'X-Forwarded-For': '203.0.113.12', Forwarded: 'for=203.0.113.13' },
  });
  expect(blocked.status).toBe(429);
  expect(blocked.headers.get('cache-control')).toBe('no-store');
  expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
  expect(blocked.headers.get('ratelimit')).toBeTruthy();
  if (method === 'POST') {
    expect(await blocked.json()).toEqual({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again shortly.' } });
  } else {
    expect(await blocked.text()).toBe('Too many requests. Please try again shortly.');
  }
  expect(query).toHaveBeenCalledTimes(limit);
  const stillBlocked = await fetch(`${baseUrl}${method === 'GET' ? '/r/AnotherCode1' : path}`, {
    ...options, ...(method === 'POST' ? { body: '{' } : {}),
  });
  expect(stillBlocked.status).toBe(429);
  await stillBlocked.text();
  expect(query).toHaveBeenCalledTimes(limit);
  expect((await fetch(`${baseUrl}/api/health`)).status).toBe(200);
  const independent = await fetch(`${baseUrl}${method === 'POST' ? '/r/AbC123xyZ_9-' : '/api/links'}`, {
    method: method === 'POST' ? 'GET' : 'POST',
  });
  expect(independent.status).toBe(method === 'POST' ? 404 : 400);
  await independent.text();
  vi.setSystemTime(Date.now() + 60_001);
  const recovered = await fetch(`${baseUrl}${path}`, options);
  expect(recovered.status).toBe(status);
  await recovered.text();
});
