import { expect, test } from 'vitest';
import { createPool } from '../src/server/db.js';
import { createTestPool } from './database.js';

test.each([undefined, '', 'not-a-url', 'https://localhost/db', 'postgresql://localhost/'])(
  'rejects an invalid database URL without leaking it', (url) => {
    expect(() => createPool(url)).toThrow('A valid PostgreSQL DATABASE_URL with a database name is required.');
  },
);

const development = 'postgresql://dev:password@localhost:15432/url_shortener';

test.each([
  undefined,
  development,
  'postgresql://test:password@localhost:15433/url_shortener',
  'postgresql://test:password@localhost:15433/postgres',
  'postgresql://test:password@localhost:15433/url_shortener_test?dbname=url_shortener',
])('refuses unsafe test destinations before connecting', (testUrl) => {
  expect(() => createTestPool({ DATABASE_URL: development, ...(testUrl ? { TEST_DATABASE_URL: testUrl } : {}) }))
    .toThrow();
});

test('requires the development URL to check separation', () => {
  expect(() => createTestPool({ TEST_DATABASE_URL: 'postgresql://localhost/url_shortener_test' })).toThrow();
});

test('rejects the same database name even through a different host alias', () => {
  expect(() => createTestPool({
    DATABASE_URL: 'postgresql://localhost/url_shortener_test',
    TEST_DATABASE_URL: 'postgresql://127.0.0.1/url_shortener_test',
  })).toThrow();
});

test('creates a lazy test pool for the explicitly isolated destination', async () => {
  const pool = createTestPool({
    DATABASE_URL: development,
    TEST_DATABASE_URL: 'postgresql://test:password@localhost:15433/url_shortener_test',
  });
  expect(pool.totalCount).toBe(0);
  await pool.end();
});
