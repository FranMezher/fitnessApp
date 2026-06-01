import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { profileRouter } from './routes/profile.js';
import { nutritionRouter } from './routes/nutrition.js';
import { workoutsRouter } from './routes/workouts.js';
import { aiRouter } from './routes/ai.js';
import { groupsRouter } from './routes/groups.js';
import { metricsRouter } from './routes/metrics.js';

const app = new Hono().basePath('/api');

app.use('*', logger());

const ALLOWED_ORIGINS = [
  'https://fitnessapp-ebon-omega.vercel.app',
];
app.use('*', cors({
  origin: (origin) => (!origin || ALLOWED_ORIGINS.includes(origin)) ? origin : null,
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('Content-Security-Policy', "default-src 'none'");
});

app.get('/health', (c) => c.json({ ok: true, version: '1.0.0' }));

app.route('/profile',       profileRouter);
app.route('/nutrition',     nutritionRouter);
app.route('/workouts',      workoutsRouter);
app.route('/ai',            aiRouter);
app.route('/groups',        groupsRouter);
app.route('/metrics',       metricsRouter);

app.onError((err, c) => {
  console.error('[ERROR]', err);
  const status = 'status' in err ? (err as { status: number }).status : 500;
  const isClientError = typeof status === 'number' && status >= 400 && status < 500;
  return c.json({ error: isClientError ? err.message : 'Internal server error' }, status as never);
});

export default app;
