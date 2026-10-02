import { createPool, parseDatabaseUrl } from '../src/server/db.js';
import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';

export function createTestPool(env: NodeJS.ProcessEnv) {
  const development = parseDatabaseUrl(env.DATABASE_URL);
  const test = parseDatabaseUrl(env.TEST_DATABASE_URL);
  const database = decodeURIComponent(test.pathname.slice(1));

  // Restrict test connections before any migration or cleanup can run.
  if (database !== 'url_shortener_test' || test.search || test.hash ||
      database === decodeURIComponent(development.pathname.slice(1))) {
    throw new Error('Tests require a separate url_shortener_test database with no URL parameters.');
  }

  return createPool(test.href);
}

export async function withTestSchema<T>(
  run: (client: PoolClient) => Promise<T>,
  env: NodeJS.ProcessEnv = process.env,
): Promise<T> {
  const pool = createTestPool(env);
  try {
    const client = await pool.connect();
    const schema = `test_${randomUUID().replaceAll('-', '')}`;
    let created = false;
    try {
      const result = await client.query<{ name: string }>('SELECT current_database() AS name');
      if (result.rows[0]?.name !== 'url_shortener_test') throw new Error('Refusing test setup outside the test database.');
      // The identifier is generated here, never supplied by an environment variable.
      await client.query(`CREATE SCHEMA "${schema}"`);
      created = true;
      await client.query("SELECT set_config('search_path', $1, false)", [schema]);
      return await run(client);
    } finally {
      try {
        if (created) await client.query(`DROP SCHEMA "${schema}" CASCADE`);
      } finally {
        client.release(true);
      }
    }
  } finally {
    await pool.end();
  }
}
