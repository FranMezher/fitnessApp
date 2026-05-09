import { Hono } from 'hono';
import { handle } from 'hono/vercel';

export const config = { runtime: 'nodejs' };

let appHandler: ReturnType<typeof handle>;

try {
  // Try to load the full app
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { default: app } = require('../src/index');
  appHandler = handle(app);
} catch (err: unknown) {
  // If it fails, serve a diagnostic endpoint
  const fallback = new Hono().basePath('/api');
  fallback.get('/health', (c) =>
    c.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split('\n').slice(0, 5) : [],
    }),
  );
  appHandler = handle(fallback);
}

export default appHandler;
