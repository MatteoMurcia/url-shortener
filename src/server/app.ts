import express, { type ErrorRequestHandler } from 'express';
import type { Pool } from 'pg';
import { createLink, InvalidDestinationError } from './links.js';

export function createApp({ database, baseUrl }: { database: Pick<Pool, 'query'>; baseUrl: string }) {
  const app = express();
  app.disable('x-powered-by');

  app.get('/api/health', (_request, response) => {
    response.set('Cache-Control', 'no-store').json({ status: 'ok' });
  });

  app.get('/r/:code', async (request, response) => {
    response.set('Cache-Control', 'no-store');
    const { code } = request.params;
    if (!/^[A-Za-z0-9_-]{12}$/.test(code)) {
      response.status(404).type('text').send('Short link not found.');
      return;
    }
    try {
      const result = await database.query<{ destination_url: string }>(
        'SELECT destination_url FROM links WHERE code = $1', [code],
      );
      const link = result.rows[0];
      if (!link) {
        response.status(404).type('text').send('Short link not found.');
        return;
      }
      response.redirect(302, link.destination_url);
    } catch {
      response.status(503).type('text').send('Could not open this link. Please try again.');
    }
  });

  app.post('/api/links', express.json({ limit: '8kb' }), async (request, response) => {
    try {
      const body = request.body as { url?: unknown } | undefined;
      const link = await createLink(database, body?.url, baseUrl);
      response.status(201).json(link);
    } catch (error) {
      if (error instanceof InvalidDestinationError) {
        response.status(400).json({ error: { code: 'INVALID_URL', message: error.message } });
      } else {
        response.status(503).json({ error: { code: 'UNAVAILABLE', message: 'Could not save your link. Please try again.' } });
      }
    }
  });

  const handleBodyError: ErrorRequestHandler = (error, _request, response, next) => {
    if (response.headersSent) return next(error);
    const status = (error as { status?: number }).status;
    if (status === 413) {
      response.status(413).json({ error: { code: 'BODY_TOO_LARGE', message: 'The request is too large.' } });
    } else if (status === 400) {
      response.status(400).json({ error: { code: 'INVALID_JSON', message: 'Send a valid JSON object.' } });
    } else {
      response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'The request could not be processed.' } });
    }
  };
  app.use('/api', handleBodyError);

  app.use('/api', (_request, response) => {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'API route not found.' },
    });
  });

  return app;
}
