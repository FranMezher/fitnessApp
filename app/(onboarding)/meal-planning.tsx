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
const STEP = 9;

const MEAL_FREQUENCIES: { n: 2 | 3 | 4 | 5; label: string }[] = [
  { n: 2, label: '2 comidas' },
  { n: 3, label: '3 comidas' },
  { n: 4, label: '4 comidas' },
  { n: 5, label: '5 comidas' },
];

const COOKING_OPTIONS: {
  id: OnboardingData['cookingTime'];
  icon: string;
  label: string;
  sub: string;
}[] = [
  { id: 'quick',     icon: '⚡', label: 'Rápido',          sub: 'Recetas de 30 min o menos.' },
  { id: 'home_cook', icon: '🏠', label: 'Cocinero casero', sub: 'Hasta 1 hora, me gusta cocinar.' },
  { id: 'chef',      icon: '👨‍🍳', label: 'Chef',            sub: 'Sin límite, disfruto la cocina.' },
];

export default function MealPlanningScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';

  const stored = useOnboardingStore((s) => s.data);
  const setStore = useOnboardingStore((s) => s.set);
  const { token } = useAuthStore();

  const [frequency, setFrequency] = useState<2 | 3 | 4 | 5>(stored.mealFrequency ?? 3);
  const [cookingTime, setCookingTime] = useState<OnboardingData['cookingTime']>(stored.cookingTime ?? 'home_cook');

  async function handleContinue() {
    setStore({ mealFrequency: frequency, cookingTime });
    if (isEdit) {
      if (token) await api.upsertProfile(token, { mealFrequency: frequency, cookingTime }).catch(() => {});
      router.back();
      return;
    }
    router.push('/(onboarding)/plan' as never);
  }

  return (
    <OnboardingShell
      step={STEP}
      totalSteps={TOTAL_STEPS}
      title="Planificación diaria"
      subtitle="Adaptamos tus comidas a tu ritmo y disponibilidad."
      footer={<Btn onPress={handleContinue}>{isEdit ? 'GUARDAR' : 'VER MI PLAN →'}</Btn>}
    >
      {/* Frecuencia */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>FRECUENCIA DE COMIDAS</Text>
        <View style={styles.freqRow}>
          {MEAL_FREQUENCIES.map((f) => {
            const active = frequency === f.n;
            return (
              <TouchableOpacity
                key={f.n}
                style={[styles.freqChip, active ? glassNeon : glass, active && styles.freqChipActive]}
                onPress={() => setFrequency(f.n)}
                activeOpacity={0.8}
              >
                <Text style={[styles.freqNum, active && styles.freqNumActive]}>{f.n}</Text>
                <Text style={styles.freqLabel}>comidas</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Tiempo de cocina */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TIEMPO DE COCINA</Text>
        <View style={styles.cookList}>
          {COOKING_OPTIONS.map((o) => {
            const active = cookingTime === o.id;
            return (
              <TouchableOpacity
                key={o.id}
                style={[styles.cookCard, active ? glassNeon : glass, active && styles.cookCardActive]}
                onPress={() => setCookingTime(o.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.cookIcon}>{o.icon}</Text>
                <View style={styles.cookBody}>
                  <Text style={[styles.cookLabel, active && styles.cookLabelActive]}>{o.label}</Text>
                  <Text style={styles.cookSub}>{o.sub}</Text>
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
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  sectionLabel: { ...text.labelSm, color: colors.muted },
  freqRow: { flexDirection: 'row', gap: spacing.sm },
  freqChip: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  freqChipActive: { ...glowShadows.neon, shadowOpacity: 0.15 },
  freqNum: { ...text.heroMd, fontSize: 24, color: colors.muted },
  freqNumActive: { color: colors.neon },
  freqLabel: { ...text.labelSm, color: colors.muted },
  cookList: { gap: spacing.sm },
  cookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  cookCardActive: { ...glowShadows.neon, shadowOpacity: 0.15 },
  cookIcon: { fontSize: 24 },
  cookBody: { flex: 1 },
  cookLabel: { ...text.headlineMd, color: colors.muted, marginBottom: 2 },
  cookLabelActive: { color: colors.neon },
  cookSub: { ...text.bodyMd, color: colors.muted },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: '#111', fontSize: 12, fontWeight: '700', fontFamily: 'SpaceGrotesk_700Bold' },
});
