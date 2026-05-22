import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../db/client.js';
import { nutritionGroups, groupMembers, foodLog, profiles } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

export const groupsRouter = new Hono().use('*', authMiddleware);

function randomCode() {
  return Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

// GET /groups/mine — get all groups the user belongs to
groupsRouter.get('/mine', async (c) => {
  const user = c.get('user');
  const memberships = await db.select().from(groupMembers).where(eq(groupMembers.userId, user.id));
  if (!memberships.length) return c.json({ groups: [] });

  const groupIds = memberships.map((m) => m.groupId);
  const groups = await db.select().from(nutritionGroups).where(inArray(nutritionGroups.id, groupIds));
  return c.json({ groups });
});

// POST /groups — create a new group
groupsRouter.post(
  '/',
  zValidator('json', z.object({ name: z.string().min(1).max(40) })),
  async (c) => {
    const user = c.get('user');
    const { name } = c.req.valid('json');

    const id = crypto.randomUUID();
    const code = randomCode();

    await db.insert(nutritionGroups).values({ id, name, code, createdBy: user.id });
    await db.insert(groupMembers).values({ groupId: id, userId: user.id });

    return c.json({ id, name, code }, 201);
  },
);

// POST /groups/join — join a group by invite code
groupsRouter.post(
  '/join',
  zValidator('json', z.object({ code: z.string().length(6) })),
  async (c) => {
    const user = c.get('user');
    const { code } = c.req.valid('json');

    const [group] = await db
      .select()
      .from(nutritionGroups)
      .where(eq(nutritionGroups.code, code.toUpperCase()));

    if (!group) return c.json({ error: 'Código inválido' }, 404);

    // Idempotent insert
    const existing = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, user.id)));

    if (!existing.length) {
      await db.insert(groupMembers).values({ groupId: group.id, userId: user.id });
    }

    return c.json({ ok: true, group });
  },
);

// GET /groups/:id/feed?date=YYYY-MM-DD — nutrition feed for all members of a group
groupsRouter.get('/:id/feed', async (c) => {
  const user = c.get('user');
  const groupId = c.req.param('id');
  const date = c.req.query('date') ?? new Date().toISOString().slice(0, 10);

  // Verify user is member
  const [membership] = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)));

  if (!membership) return c.json({ error: 'No pertenecés a este grupo' }, 403);

  // Get all members
  const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
  const memberIds = members.map((m) => m.userId);

  // Get food logs + profiles for all members
  const [logs, memberProfiles] = await Promise.all([
    db.select().from(foodLog).where(
      and(
        inArray(foodLog.userId, memberIds),
        eq(foodLog.date, date),
      ),
    ),
    db.select({ userId: profiles.userId, name: profiles.name }).from(profiles).where(inArray(profiles.userId, memberIds)),
  ]);

  const profileMap = Object.fromEntries(memberProfiles.map((p) => [p.userId, p.name]));

  // Build per-member summary
  const feed = memberIds.map((uid) => {
    const entries = logs.filter((l) => l.userId === uid);
    return {
      userId: uid,
      name: profileMap[uid] ?? 'Usuario',
      totalCalories: entries.reduce((s, e) => s + e.calories, 0),
      totalProteinG: +entries.reduce((s, e) => s + e.proteinG, 0).toFixed(1),
      entries: entries.map((e) => ({
        mealType: e.mealType,
        foodName: e.foodName,
        calories: e.calories,
      })),
    };
  });

  // Sort by calories desc (ranking)
  feed.sort((a, b) => b.totalCalories - a.totalCalories);

  return c.json({ date, feed });
});

// DELETE /groups/:id/leave
groupsRouter.delete('/:id/leave', async (c) => {
  const user = c.get('user');
  const groupId = c.req.param('id');

  await db
    .delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)));

  return c.json({ ok: true });
});
