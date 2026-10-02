import { Pool } from 'pg';

export function parseDatabaseUrl(value: string | undefined): URL {
  try {
    const url = new URL(value ?? '');
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || url.pathname.length < 2) {
      throw new Error('Invalid database URL');
    }
    return url;
  } catch {
    throw new Error('A valid PostgreSQL DATABASE_URL with a database name is required.');
  }
}

export function createPool(connectionString: string | undefined): Pool {
  const url = parseDatabaseUrl(connectionString);
  const pool = new Pool({
    connectionString: url.href,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
  });
  pool.on('error', () => {
    console.error('PostgreSQL pool lost an idle connection.');
  });
  return pool;
}
