import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { colors, glass, glassNeon, glowShadows } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { Btn } from '@/components/ui/Btn';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import type { OnboardingData } from '@/stores/useOnboardingStore';

const TOTAL_STEPS = 10;
const STEP = 1;

const GOALS: { id: OnboardingData['goal']; icon: string; title: string; sub: string }[] = [
  { id: 'fat_loss', icon: '⚖', title: 'Perder Grasa',    sub: 'Déficit calórico enfocado en definición.' },
  { id: 'muscle',   icon: '💪', title: 'Ganar Músculo',   sub: 'Hipertrofia y superávit controlado.' },
  { id: 'maintain', icon: '🔄', title: 'Mantenimiento',   sub: 'Equilibrio calórico y salud sostenida.' },
];

export default function OnboardGoalScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';

  const stored = useOnboardingStore((s) => s.data.goal);
  const setStore = useOnboardingStore((s) => s.set);
  const [selected, setSelected] = useState<OnboardingData['goal']>(stored ?? 'fat_loss');
  const { token } = useAuthStore();

  async function handleContinue() {
    setStore({ goal: selected });
    if (isEdit) {
      if (token) await api.upsertProfile(token, { goal: selected }).catch(() => {});
      router.back();
      return;
    }
    router.push('/(onboarding)/biometrics' as never);
  }

  return (
    <OnboardingShell
      step={STEP}
      totalSteps={TOTAL_STEPS}
      title="¿Cuál es tu misión?"
      subtitle="Personalizaremos tu plan de entrenamiento y nutrición basado en tu objetivo principal."
      footer={<Btn onPress={handleContinue}>{isEdit ? 'GUARDAR' : 'CONTINUAR'}</Btn>}
    >
      <View style={styles.list}>
        {GOALS.map((g) => {
          const active = selected === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              style={[styles.card, active ? glassNeon : glass, active && styles.cardActive]}
              onPress={() => setSelected(g.id)}
              activeOpacity={0.8}
            >
              <View style={styles.iconBox}>
                <Text style={styles.iconText}>{g.icon}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, active && styles.cardTitleActive]}>{g.title}</Text>
                <Text style={styles.cardSub}>{g.sub}</Text>
              </View>
              {active && (
                <View style={styles.checkCircle}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  cardActive: {
    ...glowShadows.neon,
    shadowOpacity: 0.2,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconText: {
    fontSize: 24,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    ...text.headlineMd,
    color: colors.text,
    marginBottom: 2,
  },
  cardTitleActive: {
    color: colors.neon,
  },
  cardSub: {
    ...text.bodyMd,
    color: colors.muted,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
});
