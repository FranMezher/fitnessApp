import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
const STEP = 6;

const SPEEDS: {
  id: OnboardingData['weightLossSpeed'];
  label: string;
  delta: string;
  recommended?: boolean;
}[] = [
  { id: 'sostenible', label: 'Sostenible', delta: '~0.25 kg/sem' },
  { id: 'moderado',   label: 'Moderado',   delta: '~0.5 kg/sem', recommended: true },
  { id: 'agresivo',   label: 'Agresivo',   delta: '~0.75 kg/sem' },
];

export default function WeightSpeedScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';

  const stored = useOnboardingStore((s) => s.data);
  const setStore = useOnboardingStore((s) => s.set);
  const { token } = useAuthStore();

  const currentWeight = stored.weightKg ?? 75;
  const [targetWeight, setTargetWeight] = useState<number>(stored.targetWeightKg ?? currentWeight - 5);
  const [speed, setSpeed] = useState<OnboardingData['weightLossSpeed']>(stored.weightLossSpeed ?? 'moderado');

  async function handleContinue() {
    const goal = useOnboardingStore.getState().data.goal;
    if (goal === 'fat_loss' && targetWeight >= currentWeight) {
      Alert.alert('Peso objetivo inválido', 'El peso objetivo debe ser menor al actual para perder grasa.');
      return;
    }
    setStore({ targetWeightKg: targetWeight, weightLossSpeed: speed });
    if (isEdit) {
      if (token) await api.upsertProfile(token, { targetWeightKg: targetWeight, weightLossSpeed: speed }).catch(() => {});
      router.back();
      return;
    }
    router.push('/(onboarding)/food-variety' as never);
  }

  return (
    <OnboardingShell
      step={STEP}
      totalSteps={TOTAL_STEPS}
      title="Meta y velocidad"
      subtitle="Define tu peso objetivo y el ritmo al que quieres llegar."
      footer={<Btn onPress={handleContinue}>{isEdit ? 'GUARDAR' : 'CONTINUAR'}</Btn>}
    >
      {/* Peso objetivo */}
      <View style={styles.targetCard}>
        <Text style={styles.targetLabel}>PESO OBJETIVO</Text>
        <View style={styles.targetRow}>
          <TouchableOpacity
            style={styles.adjBtn}
            onPress={() => setTargetWeight((v) => Math.max(30, v - 1))}
            activeOpacity={0.7}
          >
            <Text style={styles.adjBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.targetValue}>
            <Text style={styles.targetNum}>{targetWeight}</Text>
            <Text style={styles.targetUnit}>kg</Text>
          </View>
          <TouchableOpacity
            style={styles.adjBtn}
            onPress={() => setTargetWeight((v) => Math.min(250, v + 1))}
            activeOpacity={0.7}
          >
            <Text style={styles.adjBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.targetHint}>
          Actual: {currentWeight} kg · Diferencia: {Math.abs(targetWeight - currentWeight)} kg
        </Text>
      </View>

      {/* Velocidad */}
      <View style={styles.speedSection}>
        <Text style={styles.speedLabel}>VELOCIDAD DE PROGRESO</Text>
        <View style={styles.speedRow}>
          {SPEEDS.map((s) => {
            const active = speed === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.speedChip, active ? glassNeon : glass, active && styles.speedChipActive]}
                onPress={() => setSpeed(s.id)}
                activeOpacity={0.8}
              >
                {s.recommended && <Text style={styles.recBadge}>✦</Text>}
                <Text style={[styles.speedChipLabel, active && styles.speedChipLabelActive]}>{s.label}</Text>
                <Text style={styles.speedChipDelta}>{s.delta}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  targetCard: {
    ...glass,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  targetLabel: { ...text.labelCaps, color: colors.neon },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  adjBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  adjBtnText: {
    fontSize: 24,
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  targetValue: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  targetNum: {
    ...text.heroLg,
    fontSize: 48,
    color: colors.neon,
    lineHeight: 52,
  },
  targetUnit: { ...text.headlineMd, color: colors.muted, marginBottom: 8 },
  targetHint: { ...text.bodyMd, color: colors.muted },
  speedSection: { gap: spacing.md },
  speedLabel: { ...text.labelSm, color: colors.muted },
  speedRow: { flexDirection: 'row', gap: spacing.sm },
  speedChip: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  speedChipActive: { ...glowShadows.neon, shadowOpacity: 0.15 },
  recBadge: { ...text.labelSm, color: colors.neon, fontSize: 10 },
  speedChipLabel: { ...text.headlineMd, fontSize: 13, color: colors.muted, textAlign: 'center' },
  speedChipLabelActive: { color: colors.neon },
  speedChipDelta: { ...text.dataMono, fontSize: 11, color: colors.muted },
});
