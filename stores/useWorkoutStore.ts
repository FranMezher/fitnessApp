import { create } from 'zustand';
import { api, WorkoutSession, FinishSessionData } from '@/lib/api';
import { useAuthStore } from './useAuthStore';

interface WorkoutState {
  activeSession: WorkoutSession | null;
  sessions: WorkoutSession[];
  loading: boolean;
  fetchSessions: () => Promise<void>;
  startSession: (planId?: string) => Promise<string | null>;
  finishSession: (id: string, data: FinishSessionData) => Promise<{ xpEarned: number } | null>;
  clearActiveSession: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  activeSession: null,
  sessions: [],
  loading: false,

  fetchSessions: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ loading: true });
    try {
      const { sessions } = await api.getSessions(token);
      set({ sessions });
    } finally {
      set({ loading: false });
    }
  },

  startSession: async (planId) => {
    const token = useAuthStore.getState().token;
    if (!token) return null;
    const session = await api.startSession(token, planId);
    set({ activeSession: session as unknown as WorkoutSession });
    return (session as { id: string }).id;
  },

  finishSession: async (id, data) => {
    const token = useAuthStore.getState().token;
    if (!token) return null;
    const result = await api.finishSession(token, id, data);
    set({ activeSession: null });
    return result as { xpEarned: number };
  },

  clearActiveSession: () => set({ activeSession: null }),
}));
