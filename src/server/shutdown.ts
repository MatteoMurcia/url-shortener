import type { Server } from 'node:http';
import type { Pool } from 'pg';

export async function closeApplication(server: Server, database: Pool, closeDevelopment?: () => Promise<void>) {
  const drained = new Promise<void>((resolve, reject) => {
    server.close(error => {
      if (error && (error as NodeJS.ErrnoException).code !== 'ERR_SERVER_NOT_RUNNING') reject(error);
      else resolve();
    });
  });
  try {
    // Vite owns upgraded HMR sockets that HTTP server.close does not close.
    await Promise.all([drained, closeDevelopment?.()]);
  } finally {
    await database.end();
  }
}
