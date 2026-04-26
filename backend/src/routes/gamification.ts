import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { streaks, userAchievements, achievements, leagueEntries } from '@/db/schema';
import { authMiddleware } from '@/middleware/auth';
import type { Env } from '@/env';

export const gamificationRouter = new Hono<{ Bindings: Env }>()
  .use('*', authMiddleware);

// GET /gamification/streak
gamificationRouter.get('/streak', async (c) => {
  const db = getDb(c.env);
  const user = c.get('user');
  const [row] = await db.select().from(streaks).where(eq(streaks.userId, user.id));
  return c.json(row ?? { currentStreak: 0, longestStreak: 0, lastActivityDate: null });
});

// GET /gamification/achievements
gamificationRouter.get('/achievements', async (c) => {
  const db = getDb(c.env);
  const user = c.get('user');

  const all = await db.select().from(achievements);
  const unlocked = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, user.id));

  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

  return c.json({
    achievements: all.map((a) => ({
      ...a,
      unlocked: unlockedIds.has(a.id),
      unlockedAt: unlocked.find((u) => u.achievementId === a.id)?.unlockedAt ?? null,
    })),
  });
});

// GET /gamification/league?week=YYYY-MM-DD
gamificationRouter.get('/league', async (c) => {
  const db = getDb(c.env);
  const weekStart = c.req.query('week') ?? currentWeekMonday();

  const entries = await db
    .select()
    .from(leagueEntries)
    .where(eq(leagueEntries.weekStart, weekStart));

  const ranked = entries
    .sort((a, b) => b.xpTotal - a.xpTotal)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return c.json({ weekStart, entries: ranked });
});

function currentWeekMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
