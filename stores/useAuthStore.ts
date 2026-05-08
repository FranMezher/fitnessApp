import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  setSession: (token: string, userId: string, email: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      email: null,
      setSession: (token, userId, email) => set({ token, userId, email }),
      clearSession: () => set({ token: null, userId: null, email: null }),
    }),
    {
      name: 'fitcore-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
