import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { foodLog, pantryItems } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

export const nutritionRouter = new Hono().use('*', authMiddleware);

// GET /nutrition/log?date=YYYY-MM-DD
nutritionRouter.get('/log', async (c) => {
  const user = c.get('user');
  const date = c.req.query('date') ?? new Date().toISOString().slice(0, 10);
  const entries = await db
    .select()
    .from(foodLog)
    .where(and(eq(foodLog.userId, user.id), eq(foodLog.date, date)));
  return c.json({ entries });
});

// POST /nutrition/log
const logSchema = z.object({
  date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(['breakfast', 'lunch', 'snack', 'dinner']),
  foodName: z.string().min(1),
  calories: z.number().int().positive(),
  proteinG: z.number().nonnegative(),
  carbsG:   z.number().nonnegative(),
  fatG:     z.number().nonnegative(),
});

nutritionRouter.post('/log', zValidator('json', logSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');
  const id = crypto.randomUUID();
  await db.insert(foodLog).values({ id, userId: user.id, ...body });
  return c.json({ id }, 201);
});

// GET /nutrition/pantry
nutritionRouter.get('/pantry', async (c) => {
  const user = c.get('user');
  const items = await db
    .select()
    .from(pantryItems)
    .where(eq(pantryItems.userId, user.id));
  return c.json({ items });
});

// POST /nutrition/pantry
const pantrySchema = z.object({
  foodName: z.string().min(1),
  quantity: z.number().positive(),
  unit:     z.string().min(1),
  proteinG: z.number().optional(),
  carbsG:   z.number().optional(),
  fatG:     z.number().optional(),
});

nutritionRouter.post('/pantry', zValidator('json', pantrySchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');
  const id = crypto.randomUUID();
  await db.insert(pantryItems).values({ id, userId: user.id, ...body });
  return c.json({ id }, 201);
});

// DELETE /nutrition/log/:id
nutritionRouter.delete('/log/:id', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  await db
    .delete(foodLog)
    .where(and(eq(foodLog.id, id), eq(foodLog.userId, user.id)));
  return c.json({ ok: true });
});

// DELETE /nutrition/pantry/:id
nutritionRouter.delete('/pantry/:id', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  await db
    .delete(pantryItems)
    .where(and(eq(pantryItems.id, id), eq(pantryItems.userId, user.id)));
  return c.json({ ok: true });
});
