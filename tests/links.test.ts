import { expect, test } from 'vitest';
import { validateDestination } from '../src/server/links.js';

test('normalizes a valid destination and preserves query and fragment', () => {
  expect(validateDestination(' https://example.com/path?q=1#section ')).toBe('https://example.com/path?q=1#section');
});

test.each([undefined, 123, {}, '', '/relative', 'javascript:alert(1)', 'ftp://example.com',
  'https://user:password@example.com', 'https://example.com/' + 'a'.repeat(2048)])(
  'rejects invalid destination %j', (input) => {
    expect(() => validateDestination(input)).toThrow('Enter an HTTP or HTTPS URL without credentials (maximum 2048 characters).');
  },
);
