import { pgTable, text, integer, doublePrecision, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Auth (managed by Supabase, mirrored here for joins) ───────────────────
export const profiles = pgTable('profiles', {
  userId:             text('user_id').primaryKey(),
  name:               text('name').notNull(),
  avatarUrl:          text('avatar_url'),
  weightKg:           doublePrecision('weight_kg'),
  heightCm:           doublePrecision('height_cm'),
  age:                integer('age'),
  sex:                text('sex'),
  goal:               text('goal'),
  activityLevel:      text('activity_level'),
  targetWeightKg:     doublePrecision('target_weight_kg'),
  strengthTraining:   integer('strength_training').default(0), // 0|1 (no boolean in pg-core lite)
  activityLifestyle:  text('activity_lifestyle'),
  weightLossSpeed:    text('weight_loss_speed'),
  targetCalories:     integer('target_calories'),
  targetProteinG:     integer('target_protein_g'),
  targetCarbsG:       integer('target_carbs_g'),
  targetFatG:         integer('target_fat_g'),
  createdAt:          text('created_at').default(sql`now()`),
});

// ─── Workouts ───────────────────────────────────────────────────────────────
export const workoutPlans = pgTable('workout_plans', {
  id:           text('id').primaryKey(),
  name:         text('name').notNull(),
  daysPerWeek:  integer('days_per_week').notNull(),
  difficulty:   text('difficulty').notNull(), // beginner | intermediate | advanced
});

export const exercises = pgTable('exercises', {
  id:           text('id').primaryKey(),
  name:         text('name').notNull(),
  muscleGroup:  text('muscle_group').notNull(),
  instructions: text('instructions'),
  videoUrl:     text('video_url'),
});

export const workoutSessions = pgTable('workout_sessions', {
  id:               text('id').primaryKey(),
  userId:           text('user_id').notNull(),
  planId:           text('plan_id'),
  startedAt:        text('started_at').notNull(),
  endedAt:          text('ended_at'),
  caloriesBurned:   integer('calories_burned'),
  formAccuracyPct:  integer('form_accuracy_pct'),
});

export const planExercises = pgTable('plan_exercises', {
  id:          text('id').primaryKey(),
  planId:      text('plan_id').notNull(),
  exerciseId:  text('exercise_id').notNull(),
  sets:        integer('sets').notNull(),
  reps:        integer('reps').notNull(),
  orderIndex:  integer('order_index').notNull(),
});

export const sessionSets = pgTable('session_sets', {
  id:            text('id').primaryKey(),
  sessionId:     text('session_id').notNull(),
  exerciseId:    text('exercise_id').notNull(),
  repsCompleted: integer('reps_completed'),
  repsTarget:    integer('reps_target'),
  seriesNum:     integer('series_num').notNull(),
});

// ─── Nutrition ──────────────────────────────────────────────────────────────
export const foodLog = pgTable('food_log', {
  id:       text('id').primaryKey(),
  userId:   text('user_id').notNull(),
  date:     text('date').notNull(),           // YYYY-MM-DD
  mealType: text('meal_type').notNull(),      // breakfast | lunch | snack | dinner
  foodName: text('food_name').notNull(),
  calories: integer('calories').notNull(),
  proteinG: doublePrecision('protein_g').notNull(),
  carbsG:   doublePrecision('carbs_g').notNull(),
  fatG:     doublePrecision('fat_g').notNull(),
});

export const waterLog = pgTable('water_log', {
  userId:  text('user_id').notNull(),
  date:    text('date').notNull(),   // YYYY-MM-DD
  glasses: integer('glasses').notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.date] }),
}));

export const pantryItems = pgTable('pantry_items', {
  id:       text('id').primaryKey(),
  userId:   text('user_id').notNull(),
  foodName: text('food_name').notNull(),
  quantity: doublePrecision('quantity').notNull(),
  unit:     text('unit').notNull(),
  proteinG: doublePrecision('protein_g'),
  carbsG:   doublePrecision('carbs_g'),
  fatG:     doublePrecision('fat_g'),
});

// ─── Gamification ───────────────────────────────────────────────────────────
export const streaks = pgTable('streaks', {
  userId:           text('user_id').primaryKey(),
  currentStreak:    integer('current_streak').notNull().default(0),
  longestStreak:    integer('longest_streak').notNull().default(0),
  lastActivityDate: text('last_activity_date'),
});

export const achievements = pgTable('achievements', {
  id:          text('id').primaryKey(),
  name:        text('name').notNull(),
  description: text('description').notNull(),
  icon:        text('icon').notNull(),
  xpReward:    integer('xp_reward').notNull(),
  threshold:   integer('threshold').notNull(),
  metric:      text('metric').notNull(), // sessions | streak | meals_logged | form_accuracy
});

export const userAchievements = pgTable('user_achievements', {
  userId:        text('user_id').notNull(),
  achievementId: text('achievement_id').notNull(),
  unlockedAt:    text('unlocked_at').default(sql`now()`),
});

export const leagueEntries = pgTable('league_entries', {
  userId:    text('user_id').notNull(),
  weekStart: text('week_start').notNull(), // YYYY-MM-DD (Monday)
  xpTotal:   integer('xp_total').notNull().default(0),
  rank:      integer('rank'),
});

// ─── Social Nutrition Groups ────────────────────────────────────────────────
export const nutritionGroups = pgTable('nutrition_groups', {
  id:        text('id').primaryKey(),
  name:      text('name').notNull(),
  code:      text('code').notNull().unique(),   // 6-char invite code
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').default(sql`now()`),
});

export const groupMembers = pgTable('group_members', {
  groupId:  text('group_id').notNull(),
  userId:   text('user_id').notNull(),
  joinedAt: text('joined_at').default(sql`now()`),
});
