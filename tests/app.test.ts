import { createServer, type Server } from 'node:http';
import { once } from 'node:events';
import { afterEach, expect, test } from 'vitest';
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
