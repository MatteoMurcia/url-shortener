import { access } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp } from './app.js';
import { readConfig } from './config.js';
import { createPool } from './db.js';
import { closeApplication } from './shutdown.js';

let config: ReturnType<typeof readConfig>;
let database: ReturnType<typeof createPool>;
try {
  config = readConfig(process.env);
  database = createPool(process.env.DATABASE_URL);
} catch (error) {
  console.error(`Invalid configuration: ${(error as Error).message}`);
  process.exit(1);
}
const { host, port, baseUrl } = config;
const app = createApp({ database, baseUrl });
const server = createServer(app);
let closeDevelopment: (() => Promise<void>) | undefined;
let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(JSON.stringify({ event: 'shutdown_started' }));
  const deadline = setTimeout(() => {
    console.error(JSON.stringify({ event: 'shutdown_timeout' }));
    process.exit(1);
  }, 10_000);
  try {
    await closeApplication(server, database, closeDevelopment);
    console.info(JSON.stringify({ event: 'shutdown_complete' }));
  } catch {
    console.error(JSON.stringify({ event: 'shutdown_failed' }));
    process.exitCode = 1;
  } finally {
    clearTimeout(deadline);
  }
}
const development = process.argv.includes('--dev');
app.set('env', development ? 'development' : 'production');

try {
  if (development) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    closeDevelopment = () => vite.close();
  } else {
    const clientDirectory = new URL('../client/', import.meta.url);
    await access(new URL('index.html', clientDirectory));
    app.use(express.static(fileURLToPath(clientDirectory)));
  }
} catch {
  console.error('Unable to prepare server assets. Run npm run build before npm start.');
  process.exitCode = 1;
  await shutdown();
}

server.on('error', () => {
  console.error('Unable to start HTTP server. Check HOST and PORT availability.');
  process.exitCode = 1;
  void shutdown();
});

if (!shuttingDown) {
  process.on('SIGINT', () => { void shutdown(); });
  process.on('SIGTERM', () => { void shutdown(); });
  server.listen(port, host, () => {
    const displayHost = host.includes(':') ? `[${host}]` : host;
    console.log(`URL Shortener running at http://${displayHost}:${port}`);
  });
}
