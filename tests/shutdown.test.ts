import type { Server } from 'node:http';
import type { Pool } from 'pg';
import { expect, test, vi } from 'vitest';
import { closeApplication } from '../src/server/shutdown.js';

test.each(['throw', 'reject'])('waits for HTTP drain when development cleanup fails with %s', async mode => {
  let finish!: () => void;
  const server = { close: (callback: () => void) => { finish = callback; } } as Server;
  const end = vi.fn(async () => {});
  const database = { end } as unknown as Pool;
  const failure = new Error('Development cleanup failed');
  const closing = closeApplication(server, database, () => {
    if (mode === 'throw') throw failure;
    return Promise.reject(failure);
  });
  const outcome = closing.catch(error => error);
  await new Promise<void>(resolve => setImmediate(resolve));
  expect(end).not.toHaveBeenCalled();
  finish();
  expect(await outcome).toBe(failure);
  expect(end).toHaveBeenCalledOnce();
});
