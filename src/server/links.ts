import { randomBytes } from 'node:crypto';
import type { Pool } from 'pg';

export class InvalidDestinationError extends Error {}

export function validateDestination(input: unknown): string {
  try {
    if (typeof input !== 'string' || input.trim().length > 2048) throw new Error();
    const url = new URL(input.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
    return url.href;
  } catch {
    throw new InvalidDestinationError('Enter an HTTP or HTTPS URL without credentials (maximum 2048 characters).');
  }
}

export async function createLink(database: Pick<Pool, 'query'>, input: unknown, baseUrl: string) {
  const destinationUrl = validateDestination(input);
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = randomBytes(9).toString('base64url');
    const result = await database.query(
      'INSERT INTO links (code, destination_url) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING',
      [code, destinationUrl],
    );
    if (result.rowCount === 1) {
      return { code, shortUrl: new URL(`/r/${code}`, baseUrl).href, destinationUrl };
    }
  }
  throw new Error('Unable to allocate a unique short code.');
}
