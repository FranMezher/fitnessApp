import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, Profile } from '@/lib/api';

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  isNewUser: boolean;
  profile: Profile | null;
  setSession: (token: string, userId: string, email: string) => void;
  clearSession: () => void;
  setIsNewUser: (v: boolean) => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      userId: null,
      email: null,
      isNewUser: false,
      profile: null,
      setSession: (token, userId, email) => set({ token, userId, email }),
      clearSession: () => set({ token: null, userId: null, email: null, isNewUser: false, profile: null }),
      setIsNewUser: (v) => set({ isNewUser: v }),
      fetchProfile: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const profile = await api.getProfile(token);
          set({ profile });
        } catch {
          // silently fail — stale profile is better than crash
        }
      },
    }),
    {
      name: 'fitcore-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
