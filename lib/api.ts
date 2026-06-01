// Typed API client for the FITCORE Hono backend
// Usage: import { api } from '@/lib/api'

import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

const supabaseForRefresh = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
);

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
  isRetry = false,
): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string>),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401 && !isRetry) {
    try {
      const { data, error } = await supabaseForRefresh.auth.refreshSession();
      if (error || !data.session) throw error ?? new Error('No session');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useAuthStore } = require('@/stores/useAuthStore');
      useAuthStore.getState().setSession(
        data.session.access_token,
        data.session.user.id,
        data.session.user.email ?? '',
      );
      return request<T>(path, { ...options, token: data.session.access_token }, true);
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useAuthStore } = require('@/stores/useAuthStore');
      useAuthStore.getState().clearSession();
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { router } = require('expo-router');
      router.replace('/(auth)/login');
      throw new ApiError(401, 'Session expired');
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (body as { error?: string }).error ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  // ── Profile ──────────────────────────────────────────────────────────────
  getProfile: (token: string) =>
    request<Profile>('/profile', { token }),

  upsertProfile: (token: string, data: Partial<Profile>) =>
    request<{ ok: boolean }>('/profile', { method: 'POST', body: JSON.stringify(data), token }),

  registerPushToken: (token: string, pushToken: string, platform: string) =>
    request<{ ok: boolean }>('/profile/push-token', {
      method: 'POST', body: JSON.stringify({ pushToken, platform }), token,
    }),

  // ── Nutrition ─────────────────────────────────────────────────────────────
  getFoodLog: (token: string, date: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid date format: ${date}`);
    return request<{ entries: FoodLogEntry[] }>(`/nutrition/log?date=${date}`, { token });
  },

  addFoodLog: (token: string, entry: Omit<FoodLogEntry, 'id'>) =>
    request<{ id: string }>('/nutrition/log', { method: 'POST', body: JSON.stringify(entry), token }),

  getPantry: (token: string) =>
    request<{ items: PantryItem[] }>('/nutrition/pantry', { token }),

  addPantryItem: (token: string, item: Omit<PantryItem, 'id'>) =>
    request<{ id: string }>('/nutrition/pantry', { method: 'POST', body: JSON.stringify(item), token }),

  deletePantryItem: (token: string, id: string) =>
    request<{ ok: boolean }>(`/nutrition/pantry/${id}`, { method: 'DELETE', token }),

  deleteFoodLog: (token: string, id: string) =>
    request<{ ok: boolean }>(`/nutrition/log/${id}`, { method: 'DELETE', token }),

  getNutritionHistory: (token: string, days = 7) =>
    request<{ history: NutritionHistoryDay[] }>(`/nutrition/history?days=${days}`, { token }),

  getWaterLog: (token: string, date: string) =>
    request<{ glasses: number }>(`/nutrition/water?date=${date}`, { token }),

  setWaterLog: (token: string, date: string, glasses: number) =>
    request<{ ok: boolean }>('/nutrition/water', { method: 'PUT', body: JSON.stringify({ date, glasses }), token }),

  // ── Workouts ──────────────────────────────────────────────────────────────
  getWorkoutPlans: (token: string) =>
    request<{ plans: WorkoutPlan[] }>('/workouts/plans', { token }),

  getWorkoutPlan: (token: string, id: string) =>
    request<{ plan: WorkoutPlan; exercises: PlanExerciseDetail[] }>(`/workouts/plans/${id}`, { token }),

  getMyPlan: (token: string) =>
    request<{ plan: WorkoutPlan | null; exercises: PlanExerciseDetail[] }>('/workouts/my-plan', { token }),

  seedWorkouts: (token: string) =>
    request<{ ok: boolean; skipped: boolean }>('/workouts/seed', { method: 'POST', token }),

  getSessions: (token: string) =>
    request<{ sessions: WorkoutSession[] }>('/workouts/sessions', { token }),

  startSession: (token: string, planId?: string) =>
    request<{ id: string; startedAt: string }>('/workouts/sessions', {
      method: 'POST',
      token,
      body: planId ? JSON.stringify({ planId }) : undefined,
    }),

  finishSession: (token: string, id: string, data: FinishSessionData) =>
    request<{ ok: boolean; xpEarned: number }>(
      `/workouts/sessions/${id}`,
      { method: 'PATCH', body: JSON.stringify(data), token },
    ),

  // ── Gamification ─────────────────────────────────────────────────────────
  getStreak: (token: string) =>
    request<Streak>('/gamification/streak', { token }),

  getAchievements: (token: string) =>
    request<{ achievements: Achievement[] }>('/gamification/achievements', { token }),

  getLeague: (token: string, week?: string) =>
    request<{ weekStart: string; entries: LeagueEntry[] }>(
      `/gamification/league${week ? `?week=${week}` : ''}`,
      { token },
    ),

  // ── AI ────────────────────────────────────────────────────────────────────
  generateRecipes: (token: string, data: RecipeRequest) =>
    request<{ recipes: Recipe[] }>('/ai/recipes', { method: 'POST', body: JSON.stringify(data), token }),

  getWorkoutInsight: (token: string, data: InsightRequest) =>
    request<{ insight: string }>('/ai/insight', { method: 'POST', body: JSON.stringify(data), token }),

  parseFoodText: (token: string, text: string) =>
    request<{ entries: Array<Omit<FoodLogEntry, 'id' | 'date' | 'mealType'>> }>('/ai/parse-food', {
      method: 'POST', body: JSON.stringify({ text }), token,
    }),

  analyzeFoodPhoto: (token: string, imageBase64: string, mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg') =>
    request<{ entries: Array<Omit<FoodLogEntry, 'id' | 'date' | 'mealType'>> }>('/ai/analyze-food-photo', {
      method: 'POST', body: JSON.stringify({ imageBase64, mediaType }), token,
    }),

  // ── Groups ────────────────────────────────────────────────────────────────
  getMyGroups: (token: string) =>
    request<{ groups: Group[] }>('/groups/mine', { token }),

  createGroup: (token: string, name: string) =>
    request<Group>('/groups', { method: 'POST', body: JSON.stringify({ name }), token }),

  joinGroup: (token: string, code: string) =>
    request<{ ok: boolean; group: Group }>('/groups/join', { method: 'POST', body: JSON.stringify({ code }), token }),

  getGroupFeed: (token: string, groupId: string, date: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid date format: ${date}`);
    return request<{ date: string; feed: GroupFeedMember[] }>(`/groups/${groupId}/feed?date=${date}`, { token });
  },

  leaveGroup: (token: string, groupId: string) =>
    request<{ ok: boolean }>(`/groups/${groupId}/leave`, { method: 'DELETE', token }),
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface Profile {
  userId:           string;
  name:             string;
  avatarUrl?:       string;

  // Biometrics
  weightKg?:        number;
  heightCm?:        number;
  age?:             number;
  sex?:             string;
  targetWeightKg?:  number;

  // Onboarding — goals & activity
  goal?:            string;
  activityLevel?:   string;    // sedentary | lightly_active | active | very_active
  strengthLevel?:   string;    // beginner | intermediate | advanced | pro_athlete
  weightLossSpeed?: string;    // sostenible | moderado | agresivo

  // Onboarding — lifestyle
  sleepHours?:      number;
  stressLevel?:     number;
  smokingHabit?:    boolean;
  alcoholHabit?:    boolean;

  // Onboarding — diet & planning
  dietType?:        string[];
  availableFoods?:  string[];
  mealFrequency?:   number;
  cookingTime?:     string;    // quick | home_cook | chef

  // Calculated macros
  targetCalories?:  number;
  targetProteinG?:  number;
  targetCarbsG?:    number;
  targetFatG?:      number;
}

export interface FoodLogEntry {
  id:       string;
  date:     string;
  mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG:   number;
  fatG:     number;
}

export interface PantryItem {
  id:       string;
  foodName: string;
  quantity: number;
  unit:     string;
  proteinG?: number;
  carbsG?:  number;
  fatG?:    number;
}

export interface WorkoutPlan {
  id:           string;
  name:         string;
  daysPerWeek:  number;
  difficulty:   'beginner' | 'intermediate' | 'advanced';
  exerciseCount?: number;
}

export interface PlanExerciseDetail {
  id:          string;
  planId:      string;
  exerciseId:  string;
  sets:        number;
  reps:        number;
  orderIndex:  number;
  exercise: {
    id:          string;
    name:        string;
    muscleGroup: string;
    instructions?: string;
    videoUrl?:   string;
  } | null;
}

export interface WorkoutSession {
  id:              string;
  planId?:         string;
  startedAt:       string;
  endedAt?:        string;
  caloriesBurned?: number;
}

export interface FinishSessionData {
  caloriesBurned:  number;
  sets: Array<{
    exerciseId:    string;
    repsCompleted: number;
    repsTarget:    number;
    seriesNum:     number;
  }>;
}

export interface Streak {
  currentStreak:    number;
  longestStreak:    number;
  lastActivityDate: string | null;
}

export interface Achievement {
  id:          string;
  name:        string;
  description: string;
  icon:        string;
  xpReward:    number;
  unlocked:    boolean;
  unlockedAt:  string | null;
}

export interface LeagueEntry {
  userId:    string;
  weekStart: string;
  xpTotal:   number;
  rank:      number;
}

export interface RecipeRequest {
  ingredients: Array<{
    name:     string;
    quantity: string;
    proteinG?: number;
    carbsG?:  number;
    fatG?:    number;
  }>;
  remainingMacros: {
    calories: number;
    proteinG: number;
    carbsG:   number;
    fatG:     number;
  };
}

export interface Recipe {
  name:         string;
  instructions: string;
  prepMinutes:  number;
  calories:     number;
  proteinG:     number;
  carbsG:       number;
  fatG:         number;
}

export interface NutritionHistoryDay {
  date:           string;
  totalCalories:  number;
  totalProteinG:  number;
  totalCarbsG:    number;
  totalFatG:      number;
  entryCount:     number;
}

export interface Group {
  id:         string;
  name:       string;
  code:       string;
  createdBy?: string;
}

export interface GroupFeedMember {
  userId:        string;
  name:          string;
  totalCalories: number;
  totalProteinG: number;
  entries: Array<{
    mealType: string;
    foodName: string;
    calories: number;
  }>;
}

export interface InsightRequest {
  sessionData: {
    durationMin:     number;
    caloriesBurned:  number;
    exercisesDone:   number;
  };
  weekStats: {
    sessionsCount: number;
    totalKcal:     number;
  };
}
