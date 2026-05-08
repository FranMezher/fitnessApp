import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { leagueEntries, userAchievements, achievements, streaks, foodLog, workoutSessions } from '../db/schema';

export async function awardXp(userId: string, xp: number) {
  const weekStart = currentWeekMonday();

  const [existing] = await db
    .select()
    .from(leagueEntries)
    .where(eq(leagueEntries.userId, userId));

  if (existing) {
    await db
      .update(leagueEntries)
      .set({ xpTotal: existing.xpTotal + xp })
      .where(eq(leagueEntries.userId, userId));
  } else {
    await db.insert(leagueEntries).values({ userId, weekStart, xpTotal: xp });
  }

  await checkAchievements(userId);
}

async function checkAchievements(userId: string) {
  const allAchievements = await db.select().from(achievements);
  const unlocked = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

  const [streak] = await db.select().from(streaks).where(eq(streaks.userId, userId));
  const sessions = await db.select().from(workoutSessions).where(eq(workoutSessions.userId, userId));
  const meals = await db.select().from(foodLog).where(eq(foodLog.userId, userId));

  const metrics: Record<string, number> = {
    sessions:      sessions.filter((s) => s.endedAt).length,
    streak:        streak?.currentStreak ?? 0,
    meals_logged:  meals.length,
    form_accuracy: sessions
      .filter((s) => s.formAccuracyPct !== null)
      .reduce((acc, s) => Math.max(acc, s.formAccuracyPct ?? 0), 0),
  };

  const toUnlock = allAchievements.filter(
    (a) => !unlockedIds.has(a.id) && (metrics[a.metric] ?? 0) >= a.threshold,
  );

  if (toUnlock.length > 0) {
    await db.insert(userAchievements).values(
      toUnlock.map((a) => ({ userId, achievementId: a.id })),
    );
  }
}

function currentWeekMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
