import { create } from 'zustand';
import { api, FoodLogEntry, PantryItem } from '@/lib/api';
import { useAuthStore } from './useAuthStore';

interface DaySummary {
  calories: number;
  mealsCount: number;
}

interface NutritionState {
  foodLog: FoodLogEntry[];
  pantryItems: PantryItem[];
  waterGlasses: number;
  loading: boolean;
  logCache: Record<string, DaySummary>;
  fetchFoodLog: (date: string) => Promise<void>;
  addFood: (entry: Omit<FoodLogEntry, 'id'>) => Promise<void>;
  fetchPantry: () => Promise<void>;
  addPantryItem: (item: Omit<PantryItem, 'id'>) => Promise<void>;
  deletePantryItem: (id: string) => Promise<void>;
  setWaterGlasses: (n: number) => void;
  removeFood: (id: string) => Promise<void>;
}

let _latestFetchDate: string | null = null;

export const useNutritionStore = create<NutritionState>((set) => ({
  foodLog: [],
  pantryItems: [],
  waterGlasses: 0,
  loading: false,
  logCache: {},

  fetchFoodLog: async (date) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    _latestFetchDate = date;
    set({ loading: true });
    try {
      const { entries } = await api.getFoodLog(token, date);
      if (_latestFetchDate !== date) return; // discard stale response
      const calories = entries.reduce((s, e) => s + e.calories, 0);
      const mealTypes = new Set(entries.map((e) => e.mealType));
      set((s) => ({
        foodLog: entries,
        logCache: {
          ...s.logCache,
          [date]: { calories, mealsCount: mealTypes.size },
        },
      }));
    } finally {
      if (_latestFetchDate === date) set({ loading: false });
    }
  },

  addFood: async (entry) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('Sesión expirada');
    const { id } = await api.addFoodLog(token, entry);
    // Optimistic update — avoids race condition when adding multiple items
    set((s) => {
      const newEntry: FoodLogEntry = { ...entry, id };
      const updated = [...s.foodLog, newEntry];
      const calories = updated.reduce((sum, e) => sum + e.calories, 0);
      const mealTypes = new Set(updated.map((e) => e.mealType));
      const date = entry.date;
      return {
        foodLog: updated,
        logCache: { ...s.logCache, [date]: { calories, mealsCount: mealTypes.size } },
      };
    });
  },

  fetchPantry: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    const { items } = await api.getPantry(token);
    set({ pantryItems: items });
  },

  addPantryItem: async (item) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    await api.addPantryItem(token, item);
    const { items } = await api.getPantry(token);
    set({ pantryItems: items });
  },

  deletePantryItem: async (id) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    await api.deletePantryItem(token, id);
    set((s) => ({ pantryItems: s.pantryItems.filter((i) => i.id !== id) }));
  },

  setWaterGlasses: (n) => set({ waterGlasses: n }),

  removeFood: async (id) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    await api.deleteFoodLog(token, id);
    set((s) => ({ foodLog: s.foodLog.filter((e) => e.id !== id) }));
  },
}));
