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

test('rejects invalid requests with structured errors and never inserts a link', async () => {
  await withTestSchema(async (client) => {
    await migrate(client);
    const server = createServer(createApp({ database: client, baseUrl: 'https://short.example' }));
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Expected TCP address');
      const endpoint = `http://127.0.0.1:${address.port}/api/links`;
      const invalidMessage = 'Enter an HTTP or HTTPS URL without credentials (maximum 2048 characters).';
      const cases: [string, number, string, string][] = [
        ...[{}, [], { url: null }, { url: false }, { url: 42 }, { url: {} }, { url: [] },
          { url: '' }, { url: '   ' }, { url: '/relative' }, { url: 'https://' },
          { url: 'javascript:alert(1)' }, { url: 'ftp://example.com' },
          { url: 'https://user:password@example.com' },
          { url: 'https://example.com/'.padEnd(2049, 'a') },
        ].map((body): [string, number, string, string] => [JSON.stringify(body), 400, 'INVALID_URL', invalidMessage]),
        ['', 400, 'INVALID_URL', invalidMessage],
        ['{"url":', 400, 'INVALID_JSON', 'Send a valid JSON object.'],
        ['null', 400, 'INVALID_JSON', 'Send a valid JSON object.'],
        ['42', 400, 'INVALID_JSON', 'Send a valid JSON object.'],
        [JSON.stringify({ url: 'https://example.com/', extra: 'a'.repeat(8192) }), 413, 'BODY_TOO_LARGE', 'The request is too large.'],
        [JSON.stringify({ url: 'https://example.com/', extra: '🌍'.repeat(2100) }), 413, 'BODY_TOO_LARGE', 'The request is too large.'],
      ];
      for (const [body, status, code, message] of cases) {
        const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        expect(response.status).toBe(status);
        expect(response.headers.get('content-type')).toContain('application/json');
        expect(await response.json()).toEqual({ error: { code, message } });
      }
      expect((await client.query('SELECT count(*)::int AS count FROM links')).rows).toEqual([{ count: 0 }]);
    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });
});
