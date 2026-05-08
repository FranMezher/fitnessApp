import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { profiles } from '../db/schema';
import { authMiddleware } from '../middleware/auth';

export const profileRouter = new Hono().use('*', authMiddleware);

profileRouter.get('/', async (c) => {
  const user = c.get('user');
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
  if (!profile) return c.json({ error: 'Profile not found' }, 404);
  return c.json(profile);
});

const profileSchema = z.object({
  name:           z.string().min(1),
  weightKg:       z.number().positive().optional(),
  heightCm:       z.number().positive().optional(),
  age:            z.number().int().positive().optional(),
  sex:            z.enum(['male', 'female', 'other']).optional(),
  goal:           z.enum(['fat_loss', 'muscle', 'performance', 'wellness']).optional(),
  activityLevel:  z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  targetWeightKg: z.number().positive().optional(),
});

profileRouter.post('/', zValidator('json', profileSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');

  await db
    .insert(profiles)
    .values({ userId: user.id, ...body })
    .onConflictDoUpdate({ target: profiles.userId, set: body });

  return c.json({ ok: true });
});
