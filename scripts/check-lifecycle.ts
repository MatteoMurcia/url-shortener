import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { request, type ClientRequest } from 'node:http';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { migrate } from '../src/server/migrations.js';
import { withTestSchema } from '../tests/database.js';

if (process.platform === 'win32') {
  throw new Error('Run process signal checks on Linux (CI or WSL); Windows kill does not deliver POSIX signals.');
}

await withTestSchema(async client => {
  await migrate(client);
  const schema = (await client.query<{ schema: string }>('SELECT current_schema() AS schema')).rows[0]!.schema;
  const databaseUrl = new URL(process.env.TEST_DATABASE_URL!);
  databaseUrl.searchParams.set('options', `-c search_path=${schema}`);

  for (const scenario of ['SIGINT', 'SIGTERM', 'timeout'] as const) {
    const reservation = createServer().listen(0, '127.0.0.1');
    await once(reservation, 'listening');
    const address = reservation.address();
    assert(address && typeof address !== 'string');
    const port = address.port;
    await new Promise<void>((resolve, reject) => reservation.close(error => error ? reject(error) : resolve()));
    const origin = `http://127.0.0.1:${port}`;
    const child = spawn(process.execPath, ['dist/server/main.js'], {
      env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), BASE_URL: origin, DATABASE_URL: databaseUrl.href },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', chunk => { output += String(chunk); });
    child.stderr.on('data', chunk => { output += String(chunk); });
    const exited = once(child, 'exit');
    const deadline = setTimeout(() => child.kill('SIGKILL'), 25000);
    let unfinished: ClientRequest | undefined;
    try {
      const readyDeadline = Date.now() + 5000;
      while (!output.includes('URL Shortener running at')) {
        assert(child.exitCode === null && child.signalCode === null, 'Server exited before listening');
        assert(Date.now() < readyDeadline, 'Server did not become ready');
        await delay(25);
      }
      const created = await fetch(`${origin}/api/links`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `${origin}/api/health` }),
      });
      assert.equal(created.status, 201);
      const link = await created.json() as { code: string };
      assert.equal((await client.query('SELECT code FROM links WHERE code = $1', [link.code])).rowCount, 1);
      if (scenario === 'timeout') {
        unfinished = request(`${origin}/api/links`, {
          method: 'POST', headers: { Expect: '100-continue', 'Content-Type': 'application/json', 'Content-Length': '1000' },
        });
        unfinished.on('error', () => {}); // Expected when the deadline terminates the server.
        const accepted = once(unfinished, 'continue');
        unfinished.flushHeaders();
        await accepted; // Server accepted headers; the missing body keeps a real request active.
        unfinished.write('{');
      }
      const started = performance.now();
      assert(child.kill(scenario === 'timeout' ? 'SIGTERM' : scenario));
      const [code, signal] = await exited;
      assert.equal(signal, null, 'Server must exit itself, not be killed by the test deadline');
      assert.equal(code, scenario === 'timeout' ? 1 : 0);
      assert.equal(output.split('"event":"shutdown_started"').length - 1, 1);
      if (scenario === 'timeout') {
        assert(performance.now() - started >= 9500, 'Shutdown deadline fired too early');
        assert(output.includes('"event":"shutdown_timeout"'));
        assert(!output.includes('"event":"shutdown_complete"'));
      } else {
        assert(output.includes('"event":"shutdown_complete"'));
        assert(!output.includes('"event":"shutdown_timeout"'));
      }
      console.log(`Lifecycle check passed: ${scenario}`);
    } finally {
      unfinished?.destroy();
      clearTimeout(deadline);
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
      await exited;
    }
  }
});
