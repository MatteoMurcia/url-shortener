import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';
import { withTestSchema } from './database.js';

test('links store a unique code, destination and generated timestamp', async () => {
  await withTestSchema(async (client) => {
    await client.query(await readFile(new URL('../db/migrations/001_links.sql', import.meta.url), 'utf8'));
    const result = await client.query<{ code: string; destination_url: string; created_at: Date }>(
      'INSERT INTO links (code, destination_url) VALUES ($1, $2) RETURNING *',
      ['abc123', 'https://example.com/path?q=1#section'],
    );
    expect(result.rows[0]).toEqual({
      code: 'abc123', destination_url: 'https://example.com/path?q=1#section', created_at: expect.any(Date),
    });
    await expect(client.query('INSERT INTO links (code, destination_url) VALUES ($1, $2)', ['abc123', 'https://example.org']))
      .rejects.toMatchObject({ code: '23505' });
    await expect(client.query('INSERT INTO links (code) VALUES ($1)', ['missing']))
      .rejects.toMatchObject({ code: '23502' });
    await expect(client.query('INSERT INTO links (code, destination_url) VALUES ($1, $2)', ['x'.repeat(13), 'https://example.org']))
      .rejects.toMatchObject({ code: '22001' });
  });
});
