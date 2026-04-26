import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { workoutSessions, sessionSets, streaks } from '@/db/schema';
import { authMiddleware } from '@/middleware/auth';
import { awardXp } from '@/lib/gamification';
import type { Env } from '@/env';

export const workoutsRouter = new Hono<{ Bindings: Env }>()
  .use('*', authMiddleware);

// GET /workouts/sessions
workoutsRouter.get('/sessions', async (c) => {
  const db = getDb(c.env);
  const user = c.get('user');
  const sessions = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.userId, user.id));

  return c.json({ sessions });
});

// POST /workouts/sessions — start a new session
workoutsRouter.post('/sessions', async (c) => {
  const db = getDb(c.env);
  const user = c.get('user');

  const id = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  await db.insert(workoutSessions).values({ id, userId: user.id, startedAt });

  return c.json({ id, startedAt }, 201);
});

// PATCH /workouts/sessions/:id — finish session
const finishSchema = z.object({
  caloriesBurned:  z.number().int().nonnegative(),
  formAccuracyPct: z.number().int().min(0).max(100),
  sets:            z.array(z.object({
    exerciseId:    z.string(),
    repsCompleted: z.number().int().nonnegative(),
    repsTarget:    z.number().int().positive(),
    seriesNum:     z.number().int().positive(),
  })),
});

workoutsRouter.patch('/sessions/:id', zValidator('json', finishSchema), async (c) => {
  const db = getDb(c.env);
  const user = c.get('user');
  const { id } = c.req.param();
  const { caloriesBurned, formAccuracyPct, sets } = c.req.valid('json');
  const endedAt = new Date().toISOString();

  await db
    .update(workoutSessions)
    .set({ endedAt, caloriesBurned, formAccuracyPct })
    .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, user.id)));

  // Insert session sets
  if (sets.length > 0) {
    await db.insert(sessionSets).values(
      sets.map((s) => ({ id: crypto.randomUUID(), sessionId: id, ...s })),
    );
  }

  // Update streak + award XP
  const today = endedAt.slice(0, 10);
  await updateStreak(db, user.id, today);

  const xp = 100 + (formAccuracyPct >= 80 ? 30 : 0);
  await awardXp(db, user.id, xp);

  return c.json({ ok: true, xpEarned: xp });
});

async function updateStreak(db: ReturnType<typeof getDb>, userId: string, today: string) {
  const [row] = await db.select().from(streaks).where(eq(streaks.userId, userId));
  if (!row) {
    await db.insert(streaks).values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: today,
    });
    return;
  }

  const last = row.lastActivityDate;
  const isConsecutive = last && diffDays(last, today) === 1;
  const alreadyToday = last === today;

  if (alreadyToday) return;

  const next = isConsecutive ? row.currentStreak + 1 : 1;
  await db
    .update(streaks)
    .set({
      currentStreak: next,
      longestStreak: Math.max(next, row.longestStreak),
      lastActivityDate: today,
    })
    .where(eq(streaks.userId, userId));
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}
