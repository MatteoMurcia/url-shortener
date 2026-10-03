import { createServer } from 'node:http';
import { once } from 'node:events';
import type { Pool } from 'pg';
import { beforeEach, expect, test, vi } from 'vitest';
import { createApp } from '../src/server/app.js';
import { createLink } from '../src/server/links.js';
import { migrate } from '../src/server/migrations.js';
import { withTestSchema } from './database.js';

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
