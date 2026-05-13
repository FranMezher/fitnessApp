import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import type { OnboardingData } from '@/stores/useOnboardingStore';

const TOTAL_STEPS = 10;
const STEP = 1;

const GOALS: { id: OnboardingData['goal']; icon: string; title: string; sub: string }[] = [
  { id: 'fat_loss',  icon: '🔥', title: 'Perder grasa',   sub: 'Déficit calórico inteligente' },
  { id: 'muscle',    icon: '💪', title: 'Ganar músculo',  sub: 'Superávit + proteína alta' },
  { id: 'maintain',  icon: '❤️', title: 'Mantener peso',  sub: 'Equilibrio calórico' },
  { id: 'wellness',  icon: '🧘', title: 'Bienestar',      sub: 'Salud y equilibrio general' },
];

export default function OnboardGoalScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';

  const stored = useOnboardingStore((s) => s.data.goal);
  const setStore = useOnboardingStore((s) => s.set);
  const [selected, setSelected] = useState<OnboardingData['goal']>(stored ?? 'fat_loss');

  const { token, email, setIsNewUser } = useAuthStore();

  async function handleContinue() {
    setStore({ goal: selected });

    if (isEdit) {
      if (token) {
        await api.upsertProfile(token, { goal: selected }).catch(() => {});
      }
      router.back();
      return;
    }

    router.push('/(onboarding)/biometrics' as never);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(STEP / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.step}>Paso {STEP} de {TOTAL_STEPS}</Text>
        <Text style={styles.title}>¿Cuál es tu objetivo?</Text>
        <Text style={styles.subtitle}>Tu plan se adapta automáticamente</Text>

        {GOALS.map((g) => {
          const active = selected === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              style={[active ? glassNeon : glass, styles.goalCard]}
              onPress={() => setSelected(g.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.goalIcon}>{g.icon}</Text>
              <View style={styles.goalText}>
                <Text style={[styles.goalTitle, active && styles.goalTitleActive]}>{g.title}</Text>
                <Text style={styles.goalSub}>{g.sub}</Text>
              </View>
              {active && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          );
        })}

        <View style={styles.btnWrap}>
          <Btn onPress={handleContinue}>{isEdit ? 'Guardar' : 'Continuar'}</Btn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.neon,
    borderRadius: 2,
  },
  container: {
    padding: 24,
    paddingTop: 16,
  },
  step: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 20,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  goalIcon: {
    fontSize: 26,
  },
  goalText: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  goalTitleActive: {
    color: colors.neon,
  },
  goalSub: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  check: {
    color: colors.neon,
    fontSize: 18,
  },
  btnWrap: {
    marginTop: 8,
  },
});
