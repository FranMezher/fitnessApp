import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Auth (managed by Supabase, mirrored here for joins) ───────────────────
export const profiles = sqliteTable('profiles', {
  userId:          text('user_id').primaryKey(),
  name:            text('name').notNull(),
  avatarUrl:       text('avatar_url'),
  weightKg:        real('weight_kg'),
  heightCm:        real('height_cm'),
  age:             integer('age'),
  sex:             text('sex'),
  goal:            text('goal'),           // fat_loss | muscle | performance | wellness
  activityLevel:   text('activity_level'), // sedentary | light | moderate | active | very_active
  targetWeightKg:  real('target_weight_kg'),
  createdAt:       text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// ─── Workouts ───────────────────────────────────────────────────────────────
export const workoutPlans = sqliteTable('workout_plans', {
  id:           text('id').primaryKey(),
  name:         text('name').notNull(),
  daysPerWeek:  integer('days_per_week').notNull(),
  difficulty:   text('difficulty').notNull(), // beginner | intermediate | advanced
});

export const exercises = sqliteTable('exercises', {
  id:          text('id').primaryKey(),
  name:        text('name').notNull(),
  muscleGroup: text('muscle_group').notNull(),
  instructions:text('instructions'),
  videoUrl:    text('video_url'),
});

export const workoutSessions = sqliteTable('workout_sessions', {
  id:               text('id').primaryKey(),
  userId:           text('user_id').notNull(),
  planId:           text('plan_id'),
  startedAt:        text('started_at').notNull(),
  endedAt:          text('ended_at'),
  caloriesBurned:   integer('calories_burned'),
  formAccuracyPct:  integer('form_accuracy_pct'),
});

export const sessionSets = sqliteTable('session_sets', {
  id:           text('id').primaryKey(),
  sessionId:    text('session_id').notNull(),
  exerciseId:   text('exercise_id').notNull(),
  repsCompleted:integer('reps_completed'),
  repsTarget:   integer('reps_target'),
  seriesNum:    integer('series_num').notNull(),
});

// ─── Nutrition ──────────────────────────────────────────────────────────────
export const foodLog = sqliteTable('food_log', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull(),
  date:      text('date').notNull(),           // YYYY-MM-DD
  mealType:  text('meal_type').notNull(),      // breakfast | lunch | snack | dinner
  foodName:  text('food_name').notNull(),
  calories:  integer('calories').notNull(),
  proteinG:  real('protein_g').notNull(),
  carbsG:    real('carbs_g').notNull(),
  fatG:      real('fat_g').notNull(),
});

export const pantryItems = sqliteTable('pantry_items', {
  id:       text('id').primaryKey(),
  userId:   text('user_id').notNull(),
  foodName: text('food_name').notNull(),
  quantity: real('quantity').notNull(),
  unit:     text('unit').notNull(),
  proteinG: real('protein_g'),
  carbsG:   real('carbs_g'),
  fatG:     real('fat_g'),
});

// ─── Gamification ───────────────────────────────────────────────────────────
export const streaks = sqliteTable('streaks', {
  userId:           text('user_id').primaryKey(),
  currentStreak:    integer('current_streak').notNull().default(0),
  longestStreak:    integer('longest_streak').notNull().default(0),
  lastActivityDate: text('last_activity_date'),
});

export const achievements = sqliteTable('achievements', {
  id:          text('id').primaryKey(),
  name:        text('name').notNull(),
  description: text('description').notNull(),
  icon:        text('icon').notNull(),
  xpReward:    integer('xp_reward').notNull(),
  threshold:   integer('threshold').notNull(),
  metric:      text('metric').notNull(), // sessions | streak | meals_logged | form_accuracy
});

export const userAchievements = sqliteTable('user_achievements', {
  userId:        text('user_id').notNull(),
  achievementId: text('achievement_id').notNull(),
  unlockedAt:    text('unlocked_at').default(sql`CURRENT_TIMESTAMP`),
});

export const leagueEntries = sqliteTable('league_entries', {
  userId:     text('user_id').notNull(),
  weekStart:  text('week_start').notNull(), // YYYY-MM-DD (Monday)
  xpTotal:    integer('xp_total').notNull().default(0),
  rank:       integer('rank'),
});
