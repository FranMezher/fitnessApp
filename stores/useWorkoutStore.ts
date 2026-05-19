import { create } from 'zustand';
import { api, WorkoutPlan, PlanExerciseDetail, WorkoutSession, Streak } from '@/lib/api';
import { useAuthStore } from './useAuthStore';

interface WorkoutState {
  plans: WorkoutPlan[];
  myPlan: WorkoutPlan | null;
  myPlanExercises: PlanExerciseDetail[];
  sessions: WorkoutSession[];
  streak: Streak | null;
  loading: boolean;
  fetchPlans: () => Promise<void>;
  fetchMyPlan: () => Promise<void>;
  fetchSessions: () => Promise<void>;
  fetchStreak: () => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  plans: [],
  myPlan: null,
  myPlanExercises: [],
  sessions: [],
  streak: null,
  loading: false,

  fetchPlans: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    const { plans } = await api.getWorkoutPlans(token);
    set({ plans });
  },

  fetchMyPlan: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ loading: true });
    try {
      const { plan, exercises } = await api.getMyPlan(token);
      set({ myPlan: plan, myPlanExercises: exercises });
    } finally {
      set({ loading: false });
    }
  },

  fetchSessions: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    const { sessions } = await api.getSessions(token);
    set({ sessions });
  },

  fetchStreak: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    const streak = await api.getStreak(token);
    set({ streak });
  },

}));
