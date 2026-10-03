import { createServer } from 'node:http';
import { once } from 'node:events';
import type { Pool } from 'pg';
import { beforeEach, expect, test, vi } from 'vitest';
import { createApp } from '../src/server/app.js';
import { createLink } from '../src/server/links.js';
import { migrate } from '../src/server/migrations.js';
import { createTestPool, withTestSchema } from './database.js';

const { generate } = vi.hoisted(() => ({ generate: vi.fn<() => Buffer>() }));
vi.mock('node:crypto', async (importOriginal) => ({
  ...await importOriginal<typeof import('node:crypto')>(),
  randomBytes: () => generate(),
}));
const realCrypto = await vi.importActual<typeof import('node:crypto')>('node:crypto');
beforeEach(() => { generate.mockReset().mockImplementation(() => realCrypto.randomBytes(9)); });

async function withApi(database: Pick<Pool, 'query'>, run: (url: string) => Promise<void>) {
  const server = createServer(createApp({ database, baseUrl: 'https://short.example' }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected TCP address');
    await run(`http://127.0.0.1:${address.port}/api/links`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

test('retries two collisions, succeeds on the third attempt and preserves the original link', async () => {
  await withTestSchema(async (client) => {
    await migrate(client);
    const collision = Buffer.alloc(9, 1);
    const fresh = Buffer.alloc(9, 2);
    await client.query('INSERT INTO links (code, destination_url) VALUES ($1, $2)',
      [collision.toString('base64url'), 'https://example.com/original']);
    generate.mockReturnValueOnce(collision).mockReturnValueOnce(collision).mockReturnValueOnce(fresh);
    const link = await createLink(client, 'https://example.com/new', 'https://short.example');
    expect(generate).toHaveBeenCalledTimes(3);
    expect(link.code).toBe(fresh.toString('base64url'));
    expect((await client.query('SELECT code, destination_url FROM links ORDER BY code')).rows).toEqual([
      { code: collision.toString('base64url'), destination_url: 'https://example.com/original' },
      { code: fresh.toString('base64url'), destination_url: 'https://example.com/new' },
    ]);
  });
});

test('exhausted collisions return a generic 503 after exactly three attempts without overwriting data', async () => {
  await withTestSchema(async (client) => {
    await migrate(client);
    const collision = Buffer.alloc(9, 1);
    await client.query('INSERT INTO links (code, destination_url) VALUES ($1, $2)',
      [collision.toString('base64url'), 'https://example.com/original']);
    generate.mockReturnValue(collision);
    await withApi(client, async (url) => {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/new' }) });
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: { code: 'UNAVAILABLE', message: 'Could not save your link. Please try again.' } });
    });
    expect(generate).toHaveBeenCalledTimes(3);
    expect((await client.query('SELECT destination_url FROM links')).rows).toEqual([
      { destination_url: 'https://example.com/original' },
    ]);
  });
});

test('a closed database connection returns a generic 503 without leaking connection details', async () => {
  const pool = createTestPool(process.env);
  try {
    const client = await pool.connect();
    client.release(true);
    await withApi(client, async (url) => {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/disconnected' }) });
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: { code: 'UNAVAILABLE', message: 'Could not save your link. Please try again.' } });
    });
    expect(generate).toHaveBeenCalledTimes(1);
  } finally {
    await pool.end();
  }
});

test('concurrent connections resolve a shared collision without mixing destinations', async () => {
  await withTestSchema(async (control) => {
    await migrate(control);
    const schema = (await control.query<{ schema: string }>('SELECT current_schema() AS schema')).rows[0]!.schema;
    const pool = createTestPool(process.env);
    const clients = [];
    try {
      for (let index = 0; index < 4; index++) {
        const client = await pool.connect();
        clients.push(client);
        await client.query("SELECT set_config('search_path', $1, false)", [schema]);
      }
      const collision = Buffer.alloc(9, 1);
      let nextCode = 2;
      generate.mockImplementation(() => Buffer.alloc(9, nextCode++));
      for (let index = 0; index < clients.length; index++) generate.mockReturnValueOnce(collision);
      const outcomes = await Promise.allSettled(clients.map((client, index) =>
        createLink(client, `https://example.com/concurrent/${index}`, 'https://short.example')));
      // Wait for every query before releasing connections, including on an assertion failure.
      const links = outcomes.map(outcome => {
        if (outcome.status === 'rejected') throw outcome.reason;
        return outcome.value;
      });
      expect(new Set(links.map(link => link.code)).size).toBe(4);
      expect(links.filter(link => link.code === collision.toString('base64url'))).toHaveLength(1);
      expect(generate).toHaveBeenCalledTimes(7); // Four initial attempts and three collision retries.
      const saved = (await control.query('SELECT code, destination_url FROM links ORDER BY destination_url')).rows;
      expect(saved).toEqual(links.map(link => ({ code: link.code, destination_url: link.destinationUrl })));
      expect(links.map(link => link.destinationUrl)).toEqual(
        clients.map((_, index) => `https://example.com/concurrent/${index}`),
      );
    } finally {
      for (const client of clients) client.release(true);
      await pool.end();
    }
  });
});
