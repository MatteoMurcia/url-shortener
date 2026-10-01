import { expect, test } from 'vitest';
import { readConfig } from '../src/server/config.js';

test('defaults to a local development address', () => {
  expect(readConfig({})).toEqual({ host: '127.0.0.1', port: 3000 });
});

test('accepts an explicit host and valid port', () => {
  expect(readConfig({ HOST: '0.0.0.0', PORT: '8080' })).toEqual({ host: '0.0.0.0', port: 8080 });
});

test.each(['', '0', '-1', '65536', '3.5', '3000abc', ' 3000', '1e3'])(
  'rejects invalid PORT %j before listening', (port) => {
    expect(() => readConfig({ PORT: port })).toThrow('PORT must be an integer between 1 and 65535.');
  },
);

test('rejects an empty host', () => {
  expect(() => readConfig({ HOST: ' ' })).toThrow('HOST must not be empty.');
});
