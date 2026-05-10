import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { profileRouter } from './routes/profile.js';
import { nutritionRouter } from './routes/nutrition.js';
import { workoutsRouter } from './routes/workouts.js';
import { gamificationRouter } from './routes/gamification.js';
import { aiRouter } from './routes/ai.js';
import { groupsRouter } from './routes/groups.js';

const app = new Hono().basePath('/api');

app.use('*', logger());
app.use('*', cors({ origin: '*', allowHeaders: ['Authorization', 'Content-Type'] }));

app.get('/health', (c) => c.json({ ok: true, version: '1.0.0' }));

app.route('/profile',       profileRouter);
app.route('/nutrition',     nutritionRouter);
app.route('/workouts',      workoutsRouter);
app.route('/gamification',  gamificationRouter);
app.route('/ai',            aiRouter);
app.route('/groups',        groupsRouter);

app.onError((err, c) => {
  console.error(err);
  const status = 'status' in err ? (err as { status: number }).status : 500;
  return c.json({ error: err.message }, status as never);
});

export default app;
