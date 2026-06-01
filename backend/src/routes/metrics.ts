import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { bodyMetrics } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

export const metricsRouter = new Hono().use('*', authMiddleware);

// GET /metrics?limit=60 — body metric entries, newest first
metricsRouter.get('/', async (c) => {
  const user = c.get('user');
  const limit = Math.min(Number(c.req.query('limit') ?? 60) || 60, 365);

  const entries = await db
    .select()
    .from(bodyMetrics)
    .where(eq(bodyMetrics.userId, user.id))
    .orderBy(desc(bodyMetrics.date))
    .limit(limit);

  return c.json({ entries });
});

// POST /metrics — add (or replace) a body metric entry for a date
const metricSchema = z.object({
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  weightKg:   z.number().positive().max(500).optional(),
  bodyFatPct: z.number().min(0).max(100).optional(),
  chestCm:    z.number().positive().max(300).optional(),
  waistCm:    z.number().positive().max(300).optional(),
  hipCm:      z.number().positive().max(300).optional(),
  armCm:      z.number().positive().max(150).optional(),
  thighCm:    z.number().positive().max(200).optional(),
});

metricsRouter.post('/', zValidator('json', metricSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');
  const date = body.date ?? new Date().toISOString().slice(0, 10);

  // One entry per (user, date): replace if it already exists.
  await db
    .delete(bodyMetrics)
    .where(and(eq(bodyMetrics.userId, user.id), eq(bodyMetrics.date, date)));

  const id = crypto.randomUUID();
  await db.insert(bodyMetrics).values({ id, userId: user.id, ...body, date });

  return c.json({ id }, 201);
});

export default metricsRouter;
