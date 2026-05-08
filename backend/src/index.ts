import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { profileRouter } from './routes/profile';
import { nutritionRouter } from './routes/nutrition';
import { workoutsRouter } from './routes/workouts';
import { gamificationRouter } from './routes/gamification';
import { aiRouter } from './routes/ai';

const app = new Hono().basePath('/api');

app.use('*', logger());
app.use('*', cors({ origin: '*', allowHeaders: ['Authorization', 'Content-Type'] }));

app.get('/health', (c) => c.json({ ok: true, version: '1.0.0' }));

app.route('/profile',       profileRouter);
app.route('/nutrition',     nutritionRouter);
app.route('/workouts',      workoutsRouter);
app.route('/gamification',  gamificationRouter);
app.route('/ai',            aiRouter);

app.onError((err, c) => {
  console.error(err);
  const status = 'status' in err ? (err as { status: number }).status : 500;
  return c.json({ error: err.message }, status as never);
});

export default app;
