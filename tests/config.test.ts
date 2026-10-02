import { expect, test } from 'vitest';
import { readConfig } from '../src/server/config.js';

test('defaults to a local development address', () => {
  expect(readConfig({})).toEqual({ host: '127.0.0.1', port: 3000, baseUrl: 'http://127.0.0.1:3000' });
});

test('accepts an explicit host and valid port', () => {
  expect(readConfig({ HOST: '0.0.0.0', PORT: '8080' })).toEqual({ host: '0.0.0.0', port: 8080, baseUrl: 'http://127.0.0.1:8080' });
});

test('uses the explicit public origin for generated links', () => {
  expect(readConfig({ BASE_URL: 'https://short.example/' }).baseUrl).toBe('https://short.example');
});

test.each(['', 'invalid', 'ftp://example.com', 'https://example.com/path', 'https://u:p@example.com', 'https://example.com/?q=1'])(
  'rejects invalid BASE_URL %j', (baseUrl) => {
    expect(() => readConfig({ BASE_URL: baseUrl })).toThrow('BASE_URL must be an HTTP(S) origin without credentials, path, query or fragment.');
  },
);

test.each(['', '0', '-1', '65536', '3.5', '3000abc', ' 3000', '1e3'])(
  'rejects invalid PORT %j before listening', (port) => {
    expect(() => readConfig({ PORT: port })).toThrow('PORT must be an integer between 1 and 65535.');
  },
);

test('rejects an empty host', () => {
  expect(() => readConfig({ HOST: ' ' })).toThrow('HOST must not be empty.');
});
