import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { colors, glass } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { Btn } from '@/components/ui/Btn';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

const TOTAL_STEPS = 10;
const STEP = 5;

const SLEEP_OPTIONS = [6, 7, 8, 9, 10];
const STRESS_LABELS = ['', 'Bajo', 'Leve', 'Moderado', 'Alto', 'Extremo'];

export default function LifestyleScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';

  const stored = useOnboardingStore((s) => s.data);
  const setStore = useOnboardingStore((s) => s.set);
  const { token } = useAuthStore();

  const [sleepHours, setSleepHours] = useState<number>(stored.sleepHours ?? 8);
  const [stressLevel, setStressLevel] = useState<number>(stored.stressLevel ?? 2);
  const [smoking, setSmoking] = useState<boolean>(stored.smokingHabit ?? false);
  const [alcohol, setAlcohol] = useState<boolean>(stored.alcoholHabit ?? false);

  async function handleContinue() {
    setStore({ sleepHours, stressLevel, smokingHabit: smoking, alcoholHabit: alcohol });
    if (isEdit) {
      if (token) {
        await api.upsertProfile(token, {
          sleepHours, stressLevel, smokingHabit: smoking, alcoholHabit: alcohol,
        }).catch(() => {});
      }
      router.back();
      return;
    }
    router.push('/(onboarding)/weight-speed' as never);
  }

  return (
    <OnboardingShell
      step={STEP}
      totalSteps={TOTAL_STEPS}
      title="Tu estilo de vida"
      subtitle="Estos factores afectan tu metabolismo y recuperación muscular."
      footer={<Btn onPress={handleContinue}>{isEdit ? 'GUARDAR' : 'CONTINUAR'}</Btn>}
    >
      {/* Sueño */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>HORAS DE SUEÑO</Text>
        <Text style={styles.cardSub}>Promedio por noche</Text>
        <View style={styles.sleepRow}>
          {SLEEP_OPTIONS.map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.sleepChip, h === sleepHours && styles.sleepChipActive]}
              onPress={() => setSleepHours(h)}
              activeOpacity={0.8}
            >
              <Text style={[styles.sleepChipText, h === sleepHours && styles.sleepChipTextActive]}>
                {h}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Estrés */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>NIVEL DE ESTRÉS</Text>
          <Text style={styles.stressValue}>{STRESS_LABELS[stressLevel]}</Text>
        </View>
        <Text style={styles.cardSub}>Nivel general en tu vida cotidiana</Text>
        <View style={styles.stressRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.stressDot, n <= stressLevel && styles.stressDotActive]}
              onPress={() => setStressLevel(n)}
              activeOpacity={0.8}
            />
          ))}
        </View>
        <View style={styles.stressLabels}>
          <Text style={styles.stressLabelText}>Bajo</Text>
          <Text style={styles.stressLabelText}>Extremo</Text>
        </View>
      </View>

      {/* Hábitos */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>HÁBITOS</Text>
        <Text style={styles.cardSub}>Ayuda a ajustar mejor tu plan de recuperación</Text>
        <View style={styles.toggleRow}>
          <View style={styles.toggleItem}>
            <View style={styles.toggleLabel}>
              <Text style={styles.toggleIcon}>🚬</Text>
              <Text style={styles.toggleText}>Fumar</Text>
            </View>
            <Switch
              value={smoking}
              onValueChange={setSmoking}
              trackColor={{ false: colors.surfaceContainerHigh, true: `${colors.neon}55` }}
              thumbColor={smoking ? colors.neon : colors.muted}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleItem}>
            <View style={styles.toggleLabel}>
              <Text style={styles.toggleIcon}>🍺</Text>
              <Text style={styles.toggleText}>Alcohol frecuente</Text>
            </View>
            <Switch
              value={alcohol}
              onValueChange={setAlcohol}
              trackColor={{ false: colors.surfaceContainerHigh, true: `${colors.neon}55` }}
              thumbColor={alcohol ? colors.neon : colors.muted}
            />
          </View>
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  card: {
    ...glass,
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: radius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { ...text.labelCaps, color: colors.neon },
  cardSub: { ...text.bodyMd, color: colors.muted, marginTop: -spacing.sm },
  sleepRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  sleepChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  sleepChipActive: {
    backgroundColor: 'rgba(204,255,0,0.08)',
    borderColor: colors.borderAccent,
  },
  sleepChipText: { ...text.headlineMd, color: colors.muted },
  sleepChipTextActive: { color: colors.neon },
  stressValue: { ...text.headlineMd, color: colors.neon },
  stressRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  stressDot: {
    flex: 1,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  stressDotActive: {
    backgroundColor: colors.neon,
    shadowColor: colors.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  stressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing.xs,
  },
  stressLabelText: { ...text.labelSm, color: colors.muted },
  toggleRow: { gap: spacing.sm },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleIcon: { fontSize: 18 },
  toggleText: { ...text.bodyLg, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border },
});
