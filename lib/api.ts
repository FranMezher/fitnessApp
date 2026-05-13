// Typed API client for the FITCORE Hono backend
// Usage: import { api } from '@/lib/api'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

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

  // ── Nutrition ─────────────────────────────────────────────────────────────
  getFoodLog: (token: string, date: string) =>
    request<{ entries: FoodLogEntry[] }>(`/nutrition/log?date=${date}`, { token }),

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

  // ── Workouts ──────────────────────────────────────────────────────────────
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
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface Profile {
  userId:            string;
  name:              string;
  avatarUrl?:        string;
  weightKg?:         number;
  heightCm?:         number;
  age?:              number;
  sex?:              string;
  goal?:             string;
  activityLevel?:    string;
  targetWeightKg?:   number;
  strengthTraining?: boolean;
  activityLifestyle?:string;
  weightLossSpeed?:  string;
  foodVariety?:      string;
  availableFoods?:   string[];
  mealPlanning?:     string;
  targetCalories?:   number;
  targetProteinG?:   number;
  targetCarbsG?:     number;
  targetFatG?:       number;
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

export interface WorkoutSession {
  id:              string;
  planId?:         string;
  startedAt:       string;
  endedAt?:        string;
  caloriesBurned?: number;
  formAccuracyPct?:number;
}

export interface FinishSessionData {
  caloriesBurned:  number;
  formAccuracyPct: number;
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

export interface InsightRequest {
  sessionData: {
    durationMin:     number;
    caloriesBurned:  number;
    formAccuracyPct: number;
    exercisesDone:   number;
  };
  weekStats: {
    sessionsCount: number;
    avgFormPct:    number;
    totalKcal:     number;
  };
}
