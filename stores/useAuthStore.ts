import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  isNewUser: boolean;
  setSession: (token: string, userId: string, email: string) => void;
  clearSession: () => void;
  setIsNewUser: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      email: null,
      isNewUser: false,
      setSession: (token, userId, email) => set({ token, userId, email }),
      clearSession: () => set({ token: null, userId: null, email: null, isNewUser: false }),
      setIsNewUser: (v) => set({ isNewUser: v }),
    }),
    {
      name: 'fitcore-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
