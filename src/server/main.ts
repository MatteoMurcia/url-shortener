import { access } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp } from './app.js';
import { readConfig } from './config.js';

const { host, port } = readConfig(process.env);
const app = createApp();
const server = createServer(app);
const development = process.argv.includes('--dev');
app.set('env', development ? 'development' : 'production');

if (development) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: { server } },
    appType: 'spa',
  });
  app.use(vite.middlewares);
  server.once('close', () => { void vite.close(); });
} else {
  const clientDirectory = new URL('../client/', import.meta.url);
  await access(new URL('index.html', clientDirectory));
  app.use(express.static(fileURLToPath(clientDirectory)));
}

server.on('error', (error) => {
  console.error(`Unable to start server: ${error.message}`);
  server.close();
  process.exitCode = 1;
});

server.listen(port, host, () => {
  const displayHost = host.includes(':') ? `[${host}]` : host;
  console.log(`URL Shortener running at http://${displayHost}:${port}`);
});
