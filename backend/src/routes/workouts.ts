import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { workoutSessions, sessionSets, streaks, workoutPlans, exercises, planExercises, profiles } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { awardXp } from '../lib/gamification.js';

export const workoutsRouter = new Hono().use('*', authMiddleware);

// GET /workouts/plans — list all plans with exercise count
workoutsRouter.get('/plans', async (c) => {
  const plans = await db.select().from(workoutPlans);
  const result = await Promise.all(plans.map(async (plan) => {
    const exs = await db.select().from(planExercises).where(eq(planExercises.planId, plan.id));
    return { ...plan, exerciseCount: exs.length };
  }));
  return c.json({ plans: result });
});

// GET /workouts/plans/:id — plan detail with exercises
workoutsRouter.get('/plans/:id', async (c) => {
  const { id } = c.req.param();
  const [plan] = await db.select().from(workoutPlans).where(eq(workoutPlans.id, id));
  if (!plan) return c.json({ error: 'Plan not found' }, 404);

  const planExs = await db.select().from(planExercises).where(eq(planExercises.planId, id));
  const exerciseDetails = await Promise.all(planExs.map(async (pe) => {
    const [ex] = await db.select().from(exercises).where(eq(exercises.id, pe.exerciseId));
    return { ...pe, exercise: ex ?? null };
  }));
  exerciseDetails.sort((a, b) => a.orderIndex - b.orderIndex);

  return c.json({ plan, exercises: exerciseDetails });
});

// GET /workouts/my-plan — recommended plan based on user goal + activity
workoutsRouter.get('/my-plan', async (c) => {
  const user = c.get('user');
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
  const plans = await db.select().from(workoutPlans);
  if (!plans.length) return c.json({ plan: null });

  const goal = profile?.goal ?? 'maintain';
  const difficulty = goal === 'muscle' ? 'advanced'
    : goal === 'fat_loss' ? 'intermediate'
    : 'beginner';

  const match = plans.find((p) => p.difficulty === difficulty)
    ?? plans.find((p) => p.difficulty === 'intermediate')
    ?? plans[0];

  const planExs = await db.select().from(planExercises).where(eq(planExercises.planId, match.id));
  const exerciseDetails = await Promise.all(planExs.map(async (pe) => {
    const [ex] = await db.select().from(exercises).where(eq(exercises.id, pe.exerciseId));
    return { ...pe, exercise: ex ?? null };
  }));
  exerciseDetails.sort((a, b) => a.orderIndex - b.orderIndex);

  return c.json({ plan: match, exercises: exerciseDetails });
});

// POST /workouts/seed — insert default plans + exercises (idempotent)
workoutsRouter.post('/seed', async (_c) => {
  const existingPlans = await db.select().from(workoutPlans);
  if (existingPlans.length > 0) return _c.json({ ok: true, skipped: true });

  const PLANS = [
    { id: 'plan-beginner',     name: 'Cuerpo Completo',    daysPerWeek: 3, difficulty: 'beginner' },
    { id: 'plan-intermediate', name: 'Upper Body Power',   daysPerWeek: 4, difficulty: 'intermediate' },
    { id: 'plan-advanced',     name: 'Hipertrofia Total',  daysPerWeek: 5, difficulty: 'advanced' },
  ];

  const EXERCISES_DATA = [
    { id: 'ex-pushup',     name: 'Flexiones',            muscleGroup: 'Pecho',    instructions: 'Manos a la altura de los hombros, cuerpo recto.' },
    { id: 'ex-squat',      name: 'Sentadilla',           muscleGroup: 'Piernas',  instructions: 'Pies al ancho de hombros, bajar hasta 90°.' },
    { id: 'ex-plank',      name: 'Plancha',              muscleGroup: 'Core',     instructions: 'Cuerpo recto apoyado en antebrazos y puntas de pie.' },
    { id: 'ex-lunge',      name: 'Zancada',              muscleGroup: 'Piernas',  instructions: 'Un pie adelante, bajar la rodilla trasera al suelo.' },
    { id: 'ex-row',        name: 'Remo con Mancuerna',   muscleGroup: 'Espalda',  instructions: 'Apoyar rodilla en banco, tirar el codo hacia atrás.' },
    { id: 'ex-press',      name: 'Press de Banca',       muscleGroup: 'Pecho',    instructions: 'Barra a la altura del pecho, bajar controlado.' },
    { id: 'ex-deadlift',   name: 'Peso Muerto',          muscleGroup: 'Espalda',  instructions: 'Espalda recta, empujar el suelo con los pies.' },
    { id: 'ex-overhead',   name: 'Press Militar',        muscleGroup: 'Hombros',  instructions: 'Empujar la barra sobre la cabeza, core activo.' },
    { id: 'ex-curl',       name: 'Curl de Bíceps',       muscleGroup: 'Bíceps',   instructions: 'Codos pegados al cuerpo, subir con control.' },
    { id: 'ex-tricep',     name: 'Extensión de Tríceps', muscleGroup: 'Tríceps',  instructions: 'Codos fijos, extender completamente.' },
    { id: 'ex-hiit-jump',  name: 'Saltos en Estrella',   muscleGroup: 'Full Body',instructions: 'Saltar abriendo piernas y brazos simultáneamente.' },
    { id: 'ex-mountain',   name: 'Mountain Climbers',    muscleGroup: 'Core',     instructions: 'En posición de plancha, llevar rodillas al pecho alternadas.' },
  ];

  const PLAN_EXERCISES = [
    // beginner
    { planId: 'plan-beginner', exerciseId: 'ex-pushup',    sets: 3, reps: 10, orderIndex: 1 },
    { planId: 'plan-beginner', exerciseId: 'ex-squat',     sets: 3, reps: 12, orderIndex: 2 },
    { planId: 'plan-beginner', exerciseId: 'ex-lunge',     sets: 2, reps: 10, orderIndex: 3 },
    { planId: 'plan-beginner', exerciseId: 'ex-plank',     sets: 3, reps: 30, orderIndex: 4 },
    { planId: 'plan-beginner', exerciseId: 'ex-mountain',  sets: 2, reps: 20, orderIndex: 5 },
    // intermediate
    { planId: 'plan-intermediate', exerciseId: 'ex-press',    sets: 4, reps: 10, orderIndex: 1 },
    { planId: 'plan-intermediate', exerciseId: 'ex-row',      sets: 4, reps: 12, orderIndex: 2 },
    { planId: 'plan-intermediate', exerciseId: 'ex-overhead', sets: 3, reps: 10, orderIndex: 3 },
    { planId: 'plan-intermediate', exerciseId: 'ex-curl',     sets: 3, reps: 12, orderIndex: 4 },
    { planId: 'plan-intermediate', exerciseId: 'ex-tricep',   sets: 3, reps: 12, orderIndex: 5 },
    { planId: 'plan-intermediate', exerciseId: 'ex-plank',    sets: 3, reps: 45, orderIndex: 6 },
    // advanced
    { planId: 'plan-advanced', exerciseId: 'ex-deadlift',  sets: 5, reps: 5,  orderIndex: 1 },
    { planId: 'plan-advanced', exerciseId: 'ex-press',     sets: 5, reps: 8,  orderIndex: 2 },
    { planId: 'plan-advanced', exerciseId: 'ex-squat',     sets: 5, reps: 8,  orderIndex: 3 },
    { planId: 'plan-advanced', exerciseId: 'ex-row',       sets: 4, reps: 10, orderIndex: 4 },
    { planId: 'plan-advanced', exerciseId: 'ex-overhead',  sets: 4, reps: 10, orderIndex: 5 },
    { planId: 'plan-advanced', exerciseId: 'ex-hiit-jump', sets: 3, reps: 20, orderIndex: 6 },
    { planId: 'plan-advanced', exerciseId: 'ex-mountain',  sets: 3, reps: 30, orderIndex: 7 },
  ];

  await db.insert(workoutPlans).values(PLANS);
  await db.insert(exercises).values(EXERCISES_DATA);
  await db.insert(planExercises).values(
    PLAN_EXERCISES.map((pe) => ({ id: crypto.randomUUID(), ...pe }))
  );

  return _c.json({ ok: true, skipped: false });
});

// GET /workouts/sessions
workoutsRouter.get('/sessions', async (c) => {
  const user = c.get('user');
  const sessions = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.userId, user.id));
  return c.json({ sessions });
});

// POST /workouts/sessions — start a new session
workoutsRouter.post('/sessions', async (c) => {
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
  const user = c.get('user');
  const { id } = c.req.param();
  const { caloriesBurned, formAccuracyPct, sets } = c.req.valid('json');
  const endedAt = new Date().toISOString();

  await db
    .update(workoutSessions)
    .set({ endedAt, caloriesBurned, formAccuracyPct })
    .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, user.id)));

  if (sets.length > 0) {
    await db.insert(sessionSets).values(
      sets.map((s) => ({ id: crypto.randomUUID(), sessionId: id, ...s })),
    );
  }

  const today = endedAt.slice(0, 10);
  await updateStreak(user.id, today);

  const xp = 100 + (formAccuracyPct >= 80 ? 30 : 0);
  await awardXp(user.id, xp);

  return c.json({ ok: true, xpEarned: xp });
});

async function updateStreak(userId: string, today: string) {
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
