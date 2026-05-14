import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, SpaceGrotesk_400Regular, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import * as SplashScreen from 'expo-splash-screen';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const { setSession, clearSession } = useAuthStore();

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  useEffect(() => {
    // Restore existing session on app start
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const token = data.session.access_token;
        setSession(token, data.session.user.id, data.session.user.email ?? '');
        const profile = await api.getProfile(token).catch(() => null);
        router.replace(profile ? '/(tabs)' : '/(onboarding)/goal');
      }
    });

    // Listen for auth state changes — only update store and handle logout here.
    // Login/register routing is handled by those screens to avoid double-navigation.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setSession(session.access_token, session.user.id, session.user.email ?? '');
      } else {
        clearSession();
        router.replace('/(auth)/login');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!loaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout" />
        <Stack.Screen name="nutrition" />
      </Stack>
    </>
  );
}
