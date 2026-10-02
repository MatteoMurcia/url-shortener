export function readConfig(env: NodeJS.ProcessEnv) {
  const rawPort = env.PORT ?? '3000';
  const port = Number(rawPort);
  if (!/^\d+$/.test(rawPort) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  const host = env.HOST ?? '127.0.0.1';
  if (!host.trim()) throw new Error('HOST must not be empty.');
  let baseUrl: string;
  try {
    const url = new URL(env.BASE_URL ?? `http://127.0.0.1:${port}`);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash) throw new Error();
    baseUrl = url.origin;
  } catch {
    throw new Error('BASE_URL must be an HTTP(S) origin without credentials, path, query or fragment.');
  }
  return { host, port, baseUrl };
}
