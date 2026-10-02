import { createServer } from 'node:http';
import { once } from 'node:events';
import { expect, test } from 'vitest';
import { createApp } from '../src/server/app.js';
import { createLink } from '../src/server/links.js';
import { migrate } from '../src/server/migrations.js';
import { withTestSchema } from './database.js';

test('redirects stored links across server restarts and distinguishes missing links from database failures', async () => {
  await withTestSchema(async (client) => {
    await migrate(client);
    const destination = 'https://example.com/path?q=hello%20world&n=1#section';
    const link = await createLink(client, destination, 'https://short.example');
    for (let boot = 0; boot < 2; boot++) {
      const server = createServer(createApp({ database: client, baseUrl: 'https://short.example' }));
      server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      try {
        const address = server.address();
        if (!address || typeof address === 'string') throw new Error('Expected TCP address');
        const origin = `http://127.0.0.1:${address.port}`;
        const response = await fetch(`${origin}/r/${link.code}`, { redirect: 'manual' });
        expect(response.status).toBe(302);
        expect(response.headers.get('location')).toBe(destination);
        expect(response.headers.get('cache-control')).toBe('no-store');
        for (const code of ['missing12345', 'short', 'invalid!code']) {
          const missing = await fetch(`${origin}/r/${code}`, { redirect: 'manual' });
          expect(missing.status).toBe(404);
          expect(missing.headers.get('cache-control')).toBe('no-store');
          expect(await missing.text()).toBe('Short link not found.');
        }
        if (boot === 1) {
          await client.query('DROP TABLE links');
          const failed = await fetch(`${origin}/r/${link.code}`, { redirect: 'manual' });
          expect(failed.status).toBe(503);
          expect(failed.headers.get('cache-control')).toBe('no-store');
          expect(await failed.text()).toBe('Could not open this link. Please try again.');
          expect((await fetch(`${origin}/r/invalid`)).status).toBe(404);
        }
      } finally {
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      }
    }
  });
});
