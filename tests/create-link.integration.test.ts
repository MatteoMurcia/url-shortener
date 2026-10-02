import { expect, test } from 'vitest';
import { createLink } from '../src/server/links.js';
import { migrate } from '../src/server/migrations.js';
import { withTestSchema } from './database.js';

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
