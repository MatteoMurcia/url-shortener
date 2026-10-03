import { expect, test } from 'vitest';
import { validateDestination } from '../src/server/links.js';

test('normalizes a valid destination and preserves query and fragment', () => {
  expect(validateDestination(' https://example.com/path?q=1#section ')).toBe('https://example.com/path?q=1#section');
});

test.each([undefined, null, true, 123, {}, [], '', '   ', '/relative', 'https://',
  'javascript:alert(1)', 'data:text/html,hello', 'file:///tmp/link', 'ftp://example.com',
  'https://user:password@example.com', 'https://user@example.com', 'https://:password@example.com',
  'https://example.com/' + 'a'.repeat(2048)])(
  'rejects invalid destination %j', (input) => {
    expect(() => validateDestination(input)).toThrow('Enter an HTTP or HTTPS URL without credentials (maximum 2048 characters).');
  },
);

test('accepts the exact trimmed length limit and rejects one character more', () => {
  const destination = 'https://example.com/'.padEnd(2048, 'a');
  expect(validateDestination(`  ${destination}  `)).toBe(destination);
  expect(() => validateDestination(destination + 'a')).toThrow();
  expect(validateDestination('http://example.com')).toBe('http://example.com/');
});
