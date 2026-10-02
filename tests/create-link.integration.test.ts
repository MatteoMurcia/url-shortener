import { expect, test } from 'vitest';
import { createLink } from '../src/server/links.js';
import { migrate } from '../src/server/migrations.js';
import { withTestSchema } from './database.js';
import { createApp } from '../src/server/app.js';
import { createServer } from 'node:http';
import { once } from 'node:events';

test('HTTP creation persists before returning 201 and does not trust the Host header', async () => {
  await withTestSchema(async (client) => {
    await migrate(client);
    const server = createServer(createApp({ database: client, baseUrl: 'https://short.example' }));
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Expected TCP address');
      const url = `http://127.0.0.1:${address.port}/api/links`;
      const response = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Host: 'untrusted.example' },
        body: JSON.stringify({ url: 'https://example.com/hello?q=1#part' }),
      });
      expect(response.status).toBe(201);
      const link = await response.json();
      expect(link.shortUrl).toBe(`https://short.example/r/${link.code}`);
      expect((await client.query('SELECT destination_url FROM links WHERE code = $1', [link.code])).rows)
        .toEqual([{ destination_url: 'https://example.com/hello?q=1#part' }]);
      const invalid = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'javascript:alert(1)' }),
      });
      expect(invalid.status).toBe(400);
      await client.query('DROP TABLE links');
      const failed = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'https://example.com' }),
      });
      expect(failed.status).toBe(503);
      expect(await failed.json()).toEqual({ error: { code: 'UNAVAILABLE', message: 'Could not save your link. Please try again.' } });
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });
});

test('creates a persisted cryptographically generated link with its configured origin', async () => {
  await withTestSchema(async (client) => {
    await migrate(client);
    const result = await createLink(client, 'https://example.com/path?q=1#section', 'https://short.example');
    expect(result.code).toMatch(/^[A-Za-z0-9_-]{12}$/);
    expect(result.shortUrl).toBe(`https://short.example/r/${result.code}`);
    expect((await client.query('SELECT code, destination_url FROM links')).rows).toEqual([
      { code: result.code, destination_url: result.destinationUrl },
    ]);
    const second = await createLink(client, result.destinationUrl, 'https://short.example');
    expect(second.code).not.toBe(result.code);
  });
});
