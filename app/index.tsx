import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';
import { registerForPush } from '@/lib/notifications';
import { colors } from '@/constants/colors';

type Route = '/(auth)/login' | '/(tabs)' | '/(onboarding)/goal';

export default function RootIndex() {
  const [route, setRoute] = useState<Route | null>(null);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (cancelled) return;

        if (!data.session) {
          setRoute('/(auth)/login');
          return;
        }

        const token = data.session.access_token;
        setSession(token, data.session.user.id, data.session.user.email ?? '');
        registerForPush(token).catch(() => {});

        const profile = await api.getProfile(token).catch(() => null);
        if (cancelled) return;
        setRoute(profile ? '/(tabs)' : '/(onboarding)/goal');
      } catch {
        if (!cancelled) setRoute('/(auth)/login');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setSession]);

  if (!route) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return <Redirect href={route} />;
}
