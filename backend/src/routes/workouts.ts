import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { workoutSessions, sessionSets, streaks, workoutPlans, exercises, planExercises } from '../db/schema.js';
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

// GET /workouts/my-plan — no recommendation, returns null
workoutsRouter.get('/my-plan', async (c) => {
  return c.json({ plan: null, exercises: [] });
});

// POST /workouts/seed — wipe all plan data and re-seed from scratch (development only)
workoutsRouter.post('/seed', async (_c) => {
  if (process.env.NODE_ENV === 'production') {
    return _c.json({ error: 'Not available in production' }, 403);
  }
  // Wipe all existing plan data before re-seeding to avoid stale rows
  await db.delete(planExercises);
  await db.delete(workoutPlans);

  const PLANS = [
    { id: 'plan-push', name: 'Push Day', daysPerWeek: 3, difficulty: 'intermediate' },
    { id: 'plan-pull', name: 'Pull Day', daysPerWeek: 3, difficulty: 'intermediate' },
    { id: 'plan-legs', name: 'Legs Day', daysPerWeek: 3, difficulty: 'intermediate' },
  ];

  const EXERCISES_DATA = [
    { id: 'ex-squat',       name: 'Sentadilla',              muscleGroup: 'Cuádriceps',   instructions: 'Pies al ancho de hombros, rodillas en dirección de los pies. Bajar hasta que los muslos estén paralelos al suelo, core activo.' },
    { id: 'ex-deadlift',    name: 'Peso Muerto',             muscleGroup: 'Cadena Post.', instructions: 'Barra sobre los pies, espalda recta. Empujar el suelo con los pies mientras extendés cadera y rodillas al mismo tiempo.' },
    { id: 'ex-bench',       name: 'Press de Banca',          muscleGroup: 'Pecho',        instructions: 'Agarre a 1.5x el ancho de hombros. Bajar la barra controlado hasta el pecho, codos a ~75°. Empujar explosivo.' },
    { id: 'ex-ohpress',     name: 'Press Militar',           muscleGroup: 'Hombros',      instructions: 'De pie o sentado, barra a la altura del cuello. Empujar sobre la cabeza extendiendo completamente los codos. Core firme.' },
    { id: 'ex-barrow',      name: 'Remo con Barra',          muscleGroup: 'Espalda',      instructions: 'Torso inclinado a 45°, barra colgando. Llevar la barra hacia el abdomen apretando los omóplatos. Bajar controlado.' },
    { id: 'ex-pulldown',    name: 'Jalones al Pecho',        muscleGroup: 'Dorsal',       instructions: 'Agarre prono a 1.5x hombros. Llevar la barra hacia el pecho superior apretando los codos hacia abajo y atrás.' },
    { id: 'ex-curl',        name: 'Curl de Bíceps',          muscleGroup: 'Bíceps',       instructions: 'Codos pegados al cuerpo, sin balancear el torso. Subir hasta la contracción máxima y bajar en 3 segundos.' },
    { id: 'ex-tricepext',   name: 'Extensión de Tríceps',    muscleGroup: 'Tríceps',      instructions: 'Codos fijos apuntando al techo. Extender completamente. Mantener los codos quietos en todo el movimiento.' },
    { id: 'ex-lunge',       name: 'Zancada con Mancuernas',  muscleGroup: 'Piernas',      instructions: 'Paso largo adelante, bajar la rodilla trasera sin tocar el suelo. Torso erguido. Alternar piernas.' },
    { id: 'ex-hipthrust',   name: 'Hip Thrust',              muscleGroup: 'Glúteos',      instructions: 'Hombros apoyados en banco, barra sobre las caderas. Empujar las caderas al techo apretando el glúteo en la parte superior.' },
    { id: 'ex-facepull',    name: 'Face Pull',               muscleGroup: 'Hombros Post.',instructions: 'Polea alta con cuerda. Llevar las manos hacia la cara abriendo los codos. Excelente para salud del manguito rotador.' },
    { id: 'ex-incbench',    name: 'Press Inclinado Mancuerna', muscleGroup: 'Pecho Sup.', instructions: 'Banco a 30–45°. Mancuernas al lado del pecho, codos a 75°. Empujar hacia arriba y ligeramente adentro.' },
    { id: 'ex-hammercurl',  name: 'Curl Martillo',           muscleGroup: 'Braquial',     instructions: 'Agarre neutro (palmas enfrentadas). Subir sin girar la muñeca. Trabaja braquial y braquiorradial.' },
    { id: 'ex-dips',        name: 'Dips en Paralelas',       muscleGroup: 'Tríceps/Pecho',instructions: 'Cuerpo ligeramente inclinado para el pecho, vertical para tríceps. Bajar hasta 90° en codos. Control total.' },
    { id: 'ex-pullup',      name: 'Pull-up (Dominadas)',     muscleGroup: 'Dorsal',       instructions: 'Agarre prono a 1.5x hombros. Llevar el pecho a la barra. Sin balanceo. Bajar completamente entre reps.' },
    { id: 'ex-plank',       name: 'Plancha Isométrica',      muscleGroup: 'Core',         instructions: 'Apoyar en antebrazos y puntas de pie. Cuerpo recto de cabeza a talones. No dejar caer las caderas.' },
    { id: 'ex-mountain',    name: 'Mountain Climbers',       muscleGroup: 'Core',         instructions: 'Posición de plancha alta. Llevar rodillas al pecho alternando rápido. Mantener las caderas bajas.' },
    { id: 'ex-pushup',      name: 'Flexiones',               muscleGroup: 'Pecho',        instructions: 'Manos a 1.5x hombros, cuerpo recto. Bajar hasta rozar el suelo con el pecho. Codos a ~45° del torso.' },
  ];

  const PLAN_EXERCISES = [
    // Push Day (3x/sem) — Pecho, Hombros, Tríceps
    { planId: 'plan-push', exerciseId: 'ex-bench',      sets: 4, reps: 8,  orderIndex: 1 },
    { planId: 'plan-push', exerciseId: 'ex-incbench',   sets: 3, reps: 10, orderIndex: 2 },
    { planId: 'plan-push', exerciseId: 'ex-ohpress',    sets: 3, reps: 10, orderIndex: 3 },
    { planId: 'plan-push', exerciseId: 'ex-dips',       sets: 3, reps: 12, orderIndex: 4 },
    { planId: 'plan-push', exerciseId: 'ex-tricepext',  sets: 3, reps: 12, orderIndex: 5 },
    // Pull Day (3x/sem) — Espalda, Bíceps
    { planId: 'plan-pull', exerciseId: 'ex-pullup',     sets: 4, reps: 8,  orderIndex: 1 },
    { planId: 'plan-pull', exerciseId: 'ex-barrow',     sets: 4, reps: 8,  orderIndex: 2 },
    { planId: 'plan-pull', exerciseId: 'ex-pulldown',   sets: 3, reps: 10, orderIndex: 3 },
    { planId: 'plan-pull', exerciseId: 'ex-curl',       sets: 3, reps: 12, orderIndex: 4 },
    { planId: 'plan-pull', exerciseId: 'ex-facepull',   sets: 3, reps: 15, orderIndex: 5 },
    // Legs Day (3x/sem) — Piernas, Glúteos, Core
    { planId: 'plan-legs', exerciseId: 'ex-squat',      sets: 4, reps: 10, orderIndex: 1 },
    { planId: 'plan-legs', exerciseId: 'ex-deadlift',   sets: 3, reps: 8,  orderIndex: 2 },
    { planId: 'plan-legs', exerciseId: 'ex-lunge',      sets: 3, reps: 12, orderIndex: 3 },
    { planId: 'plan-legs', exerciseId: 'ex-hipthrust',  sets: 3, reps: 12, orderIndex: 4 },
    { planId: 'plan-legs', exerciseId: 'ex-plank',      sets: 3, reps: 45, orderIndex: 5 },
  ];

  for (const plan of PLANS) {
    await db.insert(workoutPlans).values(plan)
      .onConflictDoUpdate({ target: workoutPlans.id, set: { name: plan.name, daysPerWeek: plan.daysPerWeek, difficulty: plan.difficulty } });
  }
  for (const ex of EXERCISES_DATA) {
    await db.insert(exercises).values(ex)
      .onConflictDoUpdate({ target: exercises.id, set: { name: ex.name, muscleGroup: ex.muscleGroup, instructions: ex.instructions } });
  }

  // Delete existing plan_exercises for these plans and re-insert (cleanest upsert for junction table)
  const planIds = PLANS.map((p) => p.id);
  for (const planId of planIds) {
    await db.delete(planExercises).where(eq(planExercises.planId, planId));
  }
  await db.insert(planExercises).values(
    PLAN_EXERCISES.map((pe) => ({ id: crypto.randomUUID(), ...pe }))
  );

  return _c.json({ ok: true });
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
