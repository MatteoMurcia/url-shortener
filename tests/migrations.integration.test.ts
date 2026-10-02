import { expect, test } from 'vitest';
import { migrate } from '../src/server/migrations.js';
import { createTestPool, withTestSchema } from './database.js';

test.each([false, true])('a failed batch rolls back DDL and history (existing schema: %s)', async (existing) => {
  await withTestSchema(async (client) => {
    if (existing) {
      await migrate(client);
      await client.query('INSERT INTO links (code, destination_url) VALUES ($1, $2)', ['keep', 'https://example.com']);
    }
    await expect(migrate(client, new URL('./fixtures/migrations-failure/', import.meta.url)))
      .rejects.toMatchObject({ code: '42P01' });
    expect((await client.query("SELECT to_regclass('rollback_probe') AS name")).rows).toEqual([{ name: null }]);
    if (existing) {
      expect((await client.query('SELECT name FROM schema_migrations')).rows).toEqual([{ name: '001_links.sql' }]);
      expect((await client.query('SELECT code FROM links')).rows).toEqual([{ code: 'keep' }]);
    } else {
      expect((await client.query("SELECT to_regclass('schema_migrations') AS name")).rows).toEqual([{ name: null }]);
      expect(await migrate(client)).toEqual(['001_links.sql']);
    }
  });
});

test('applies the initial migration once and preserves existing links on rerun', async () => {
  await withTestSchema(async (client) => {
    expect(await migrate(client)).toEqual(['001_links.sql']);
    await client.query('INSERT INTO links (code, destination_url) VALUES ($1, $2)', ['keep', 'https://example.com']);
    expect(await migrate(client)).toEqual([]);
    expect((await client.query('SELECT code FROM links')).rows).toEqual([{ code: 'keep' }]);
    expect((await client.query('SELECT name FROM schema_migrations')).rows).toEqual([{ name: '001_links.sql' }]);
  });
});

test('simultaneous runners apply the schema only once', async () => {
  await withTestSchema(async (first) => {
    const pool = createTestPool(process.env);
    try {
      const second = await pool.connect();
      try {
        const result = await first.query<{ schema: string }>('SELECT current_schema() AS schema');
        await second.query("SELECT set_config('search_path', $1, false)", [result.rows[0]?.schema]);
        const applied = await Promise.all([migrate(first), migrate(second)]);
        expect(applied.flat()).toEqual(['001_links.sql']);
      } finally {
        second.release(true);
      }
    } finally {
      await pool.end();
    }
  });
});
