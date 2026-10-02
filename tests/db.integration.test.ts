import { expect, test } from 'vitest';
import { createPool } from '../src/server/db.js';
import { createTestPool } from './database.js';

test('test and development pools connect to distinct databases', async () => {
  const testPool = createTestPool(process.env);
  const developmentPool = createPool(process.env.DATABASE_URL);
  try {
    const development = await developmentPool.query<{ name: string }>('SELECT current_database() AS name');
    const isolated = await testPool.query<{ name: string }>('SELECT current_database() AS name');
    expect(isolated.rows[0]?.name).toBe('url_shortener_test');
    expect(development.rows[0]?.name).not.toBe(isolated.rows[0]?.name);
    const result = await testPool.query<{ value: string }>('SELECT $1::text AS value', ["a value with ' quotes"]);
    expect(result.rows[0]?.value).toBe("a value with ' quotes");
  } finally {
    await Promise.all([testPool.end(), developmentPool.end()]);
  }
});

test('test writes can be rolled back without leaving a table', async () => {
  const pool = createTestPool(process.env);
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('CREATE TEMP TABLE t03_probe (value text NOT NULL)');
      await client.query('INSERT INTO t03_probe (value) VALUES ($1)', ['isolated']);
      const result = await client.query<{ value: string }>('SELECT value FROM t03_probe');
      expect(result.rows).toEqual([{ value: 'isolated' }]);
      await client.query('ROLLBACK');
      const after = await client.query<{ table: string | null }>("SELECT to_regclass('pg_temp.t03_probe') AS table");
      expect(after.rows[0]?.table).toBeNull();
    } finally {
      client.release(true);
    }
  } finally {
    await pool.end();
  }
});
