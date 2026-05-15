import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { profiles } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

export const profileRouter = new Hono().use('*', authMiddleware);

profileRouter.get('/', async (c) => {
  const user = c.get('user');
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
  if (!profile) return c.json({ error: 'Profile not found' }, 404);
  return c.json({ ...profile, strengthTraining: profile.strengthTraining === 1 });
});

const profileSchema = z.object({
  name:               z.string().min(1),
  weightKg:           z.number().positive().optional(),
  heightCm:           z.number().positive().optional(),
  age:                z.number().int().positive().optional(),
  sex:                z.string().optional(),
  goal:               z.string().optional(),
  activityLevel:      z.string().optional(),
  targetWeightKg:     z.number().positive().optional(),
  strengthTraining:   z.union([z.boolean(), z.number()]).optional(),
  activityLifestyle:  z.string().optional(),
  weightLossSpeed:    z.string().optional(),
  targetCalories:     z.number().int().positive().optional(),
  targetProteinG:     z.number().int().nonnegative().optional(),
  targetCarbsG:       z.number().int().nonnegative().optional(),
  targetFatG:         z.number().int().nonnegative().optional(),
  availableFoods:     z.array(z.string()).optional(),
  mealPlanning:       z.string().optional(),
  foodVariety:        z.string().optional(),
}).passthrough();

profileRouter.post('/', zValidator('json', profileSchema), async (c) => {
  const user = c.get('user');
  const { strengthTraining, ...rest } = c.req.valid('json');

  const dbBody = {
    ...rest,
    strengthTraining: strengthTraining != null ? (strengthTraining ? 1 : 0) : undefined,
  };

  await db
    .insert(profiles)
    .values({ userId: user.id, ...dbBody })
    .onConflictDoUpdate({ target: profiles.userId, set: dbBody });

  return c.json({ ok: true });
});
