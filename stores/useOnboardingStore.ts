import { create } from 'zustand';

export interface OnboardingData {
  // Step 01 — Misión
  goal: 'fat_loss' | 'muscle' | 'maintain';

  // Step 02 — Biometría
  sex: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;

  // Step 03 — Nivel de Fuerza
  strengthLevel: 'beginner' | 'intermediate' | 'advanced' | 'pro_athlete';

  // Step 04 — Actividad Diaria
  activityLevel: 'sedentary' | 'lightly_active' | 'active' | 'very_active';

  // Step 05 — Estilo de Vida
  sleepHours: number;        // 6–10
  stressLevel: number;       // 1–5
  smokingHabit: boolean;
  alcoholHabit: boolean;

  // Step 06 — Meta y Velocidad
  targetWeightKg: number;
  weightLossSpeed: 'sostenible' | 'moderado' | 'agresivo';

  // Step 07 — Preferencias dietéticas
  dietType: string[];        // e.g. ['omnivore'], ['vegan','keto']

  // Step 08 — Alimentos disponibles
  availableFoods: string[];

  // Step 09 — Planificación
  mealFrequency: 2 | 3 | 4 | 5;
  cookingTime: 'quick' | 'home_cook' | 'chef';

  // Calculados en Step 10
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
