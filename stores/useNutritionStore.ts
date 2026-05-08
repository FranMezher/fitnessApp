import { create } from 'zustand';
import { api, FoodLogEntry, PantryItem } from '@/lib/api';
import { useAuthStore } from './useAuthStore';

interface NutritionState {
  foodLog: FoodLogEntry[];
  pantryItems: PantryItem[];
  waterGlasses: number;
  loading: boolean;
  fetchFoodLog: (date: string) => Promise<void>;
  addFood: (entry: Omit<FoodLogEntry, 'id'>) => Promise<void>;
  fetchPantry: () => Promise<void>;
  addPantryItem: (item: Omit<PantryItem, 'id'>) => Promise<void>;
  deletePantryItem: (id: string) => Promise<void>;
  setWaterGlasses: (n: number) => void;
}

export const useNutritionStore = create<NutritionState>((set) => ({
  foodLog: [],
  pantryItems: [],
  waterGlasses: 0,
  loading: false,

  fetchFoodLog: async (date) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ loading: true });
    try {
      const { entries } = await api.getFoodLog(token, date);
      set({ foodLog: entries });
    } finally {
      set({ loading: false });
    }
  },

  addFood: async (entry) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    await api.addFoodLog(token, entry);
    const today = new Date().toISOString().slice(0, 10);
    const { entries } = await api.getFoodLog(token, today);
    set({ foodLog: entries });
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
}));
