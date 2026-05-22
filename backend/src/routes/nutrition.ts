import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { foodLog, pantryItems, waterLog } from '../db/schema.js';
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

  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() - 30);
  const parsed = new Date(body.date);
  if (parsed > today || parsed < minDate) {
    return c.json({ error: 'Invalid date. Must be within the last 30 days.' }, 400);
  }

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

// GET /nutrition/water?date=YYYY-MM-DD
nutritionRouter.get('/water', async (c) => {
  const user = c.get('user');
  const date = c.req.query('date') ?? new Date().toISOString().slice(0, 10);
  const rows = await db
    .select()
    .from(waterLog)
    .where(and(eq(waterLog.userId, user.id), eq(waterLog.date, date)));
  return c.json({ glasses: rows[0]?.glasses ?? 0 });
});

// PUT /nutrition/water
const waterSchema = z.object({
  date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  glasses: z.number().int().min(0).max(20),
});

nutritionRouter.put('/water', zValidator('json', waterSchema), async (c) => {
  const user = c.get('user');
  const { date, glasses } = c.req.valid('json');
  await db
    .insert(waterLog)
    .values({ userId: user.id, date, glasses })
    .onConflictDoUpdate({
      target: [waterLog.userId, waterLog.date],
      set: { glasses },
    });
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

// GET /nutrition/history?days=7
nutritionRouter.get('/history', async (c) => {
  const user = c.get('user');
  const days = Math.min(30, parseInt(c.req.query('days') ?? '7'));

  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const entries = await db
    .select()
    .from(foodLog)
    .where(
      and(
        eq(foodLog.userId, user.id),
        sql`${foodLog.date} >= ${startDate} AND ${foodLog.date} <= ${endDate}`,
      ),
    );

  const byDate: Record<string, typeof entries> = {};
  for (const date of dates) byDate[date] = [];
  for (const entry of entries) {
    if (byDate[entry.date]) byDate[entry.date].push(entry);
  }

  const history = dates.map((date) => {
    const dayEntries = byDate[date];
    return {
      date,
      totalCalories: Math.round(dayEntries.reduce((s, e) => s + e.calories, 0)),
      totalProteinG: Math.round(dayEntries.reduce((s, e) => s + e.proteinG, 0) * 10) / 10,
      totalCarbsG:   Math.round(dayEntries.reduce((s, e) => s + e.carbsG, 0) * 10) / 10,
      totalFatG:     Math.round(dayEntries.reduce((s, e) => s + e.fatG, 0) * 10) / 10,
      entryCount:    dayEntries.length,
    };
  });

  return c.json({ history });
});
