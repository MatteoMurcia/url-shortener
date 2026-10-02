import { createPool, parseDatabaseUrl } from '../src/server/db.js';

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
