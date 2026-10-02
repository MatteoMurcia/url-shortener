import { readdir, readFile } from 'node:fs/promises';
import type { PoolClient } from 'pg';

export async function migrate(
  client: PoolClient,
  directory = new URL('../../db/migrations/', import.meta.url),
): Promise<string[]> {
  const files = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL lock_timeout = '5s'");
    // Stable application lock, automatically released on commit or rollback.
    await client.query('SELECT pg_advisory_xact_lock(20261002)');
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const history = await client.query<{ name: string }>('SELECT name FROM schema_migrations');
    const applied = new Set(history.rows.map((row) => row.name));
    const pending = files.filter((name) => !applied.has(name));
    for (const name of pending) {
      await client.query(await readFile(new URL(name, directory), 'utf8'));
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
    }
    await client.query('COMMIT');
    return pending;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
