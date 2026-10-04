import { expect, test, vi } from 'vitest';
import { copyToClipboard } from '../src/client/CopyLink.js';

test('waits for the clipboard write to finish before confirming success', async () => {
  let finishWrite!: () => void;
  const pendingWrite = new Promise<void>(resolve => { finishWrite = resolve; });
  const clipboard = { writeText: vi.fn(() => pendingWrite) };
  const completed = vi.fn();
  const result = copyToClipboard('https://short.example/r/example12345', clipboard).then(completed);
  await Promise.resolve();
  expect(completed).not.toHaveBeenCalled();
  expect(clipboard.writeText).toHaveBeenCalledWith('https://short.example/r/example12345');
  finishWrite();
  await result;
  expect(completed).toHaveBeenCalledWith(true);
});

test('reports failure when clipboard access is denied or unavailable', async () => {
  expect(await copyToClipboard('link', undefined)).toBe(false);
  expect(await copyToClipboard('link', { writeText: async () => { throw new Error('Permission denied'); } })).toBe(false);
});
