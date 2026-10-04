import { once } from 'node:events';
import { createServer, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { test as base } from '@playwright/test';
import { createApp } from '../src/server/app.js';
import { migrate } from '../src/server/migrations.js';
import { withTestSchema } from '../tests/database.js';

async function listen(server: Server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected TCP address');
  return `http://127.0.0.1:${address.port}`;
}

export const test = base.extend<{ app: { origin: string; destination: string } }>({
  app: async ({ browserName }, use) => {
    if (browserName !== 'chromium') throw new Error('Clipboard tests require Chromium');
    await withTestSchema(async (client) => {
      await migrate(client);
      const server = createServer();
      const destinationServer = createServer((_request, response) => {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end('<!doctype html><title>Local destination</title><h1>Destination reached</h1>');
      });
      try {
        const origin = await listen(server);
        const destination = `${await listen(destinationServer)}/target?q=hello%20world#verified`;
        const app = createApp({ database: client, baseUrl: origin });
        app.use(express.static(fileURLToPath(new URL('../dist/client', import.meta.url))));
        server.on('request', app);
        await use({ origin, destination });
      } finally {
        await Promise.all([server, destinationServer].map(async (active) => {
          if (!active.listening) return;
          await new Promise<void>((resolve, reject) => {
            active.close(error => error ? reject(error) : resolve());
            active.closeAllConnections();
          });
        }));
      }
    });
  },
});

export { expect } from '@playwright/test';
