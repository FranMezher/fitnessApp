import { create } from 'zustand';

export interface OnboardingData {
  goal: 'fat_loss' | 'muscle' | 'maintain' | 'wellness';
  sex: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  strengthTraining: boolean;
  activityLevel: 'none' | '1-2' | '3-4' | '5-6' | 'daily';
  lifestyle: 'seated' | 'sometimes_standing' | 'mostly_standing' | 'moving' | 'intense';
  weightLossSpeed: 'slow' | 'recommended' | 'fast';
  foodVariety: 'high' | 'moderate' | 'low';
  availableFoods: string[];
  mealPlanning: 'self' | 'app';
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
}

interface OnboardingStore {
  data: Partial<OnboardingData>;
  set: (patch: Partial<OnboardingData>) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  data: {},
  set: (patch) => set((s) => ({ data: { ...s.data, ...patch } })),
  reset: () => set({ data: {} }),
}));
