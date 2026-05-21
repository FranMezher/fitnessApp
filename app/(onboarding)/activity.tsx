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
const STEP = 4;

const OPTIONS: {
  id: OnboardingData['activityLevel'];
  icon: string;
  label: string;
  sub: string;
}[] = [
  { id: 'sedentary',      icon: '🪑', label: 'Sedentario',          sub: 'Trabajo de escritorio, poco movimiento.' },
  { id: 'lightly_active', icon: '🚶', label: 'Ligeramente activo',  sub: 'Caminatas cortas, trabajo de pie.' },
  { id: 'active',         icon: '🏃', label: 'Activo',              sub: 'Ejercicio regular 3–4× por semana.' },
  { id: 'very_active',    icon: '⚡', label: 'Muy activo',          sub: 'Actividad intensa diaria o trabajo físico.' },
];

export default function ActivityScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';

  const stored = useOnboardingStore((s) => s.data.activityLevel);
  const setStore = useOnboardingStore((s) => s.set);
  const { token } = useAuthStore();

  const [selected, setSelected] = useState<OnboardingData['activityLevel']>(stored ?? 'lightly_active');

  async function handleContinue() {
    setStore({ activityLevel: selected });
    if (isEdit) {
      if (token) await api.upsertProfile(token, { activityLevel: selected }).catch(() => {});
      router.back();
      return;
    }
    router.push('/(onboarding)/lifestyle' as never);
  }

  return (
    <OnboardingShell
      step={STEP}
      totalSteps={TOTAL_STEPS}
      title="Nivel de actividad diaria"
      subtitle="Considerá solo tu movimiento cotidiano fuera del gimnasio."
      footer={<Btn onPress={handleContinue}>{isEdit ? 'GUARDAR' : 'CONTINUAR'}</Btn>}
    >
      <View style={styles.list}>
        {OPTIONS.map((o) => {
          const active = selected === o.id;
          return (
            <TouchableOpacity
              key={o.id}
              style={[styles.card, active ? glassNeon : glass, active && styles.cardActive]}
              onPress={() => setSelected(o.id)}
              activeOpacity={0.8}
            >
              <View style={styles.iconBox}>
                <Text style={styles.icon}>{o.icon}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, active && styles.cardTitleActive]}>{o.label}</Text>
                <Text style={styles.cardSub}>{o.sub}</Text>
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
  list: { gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  cardActive: { ...glowShadows.neon, shadowOpacity: 0.18 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: { fontSize: 20 },
  cardBody: { flex: 1 },
  cardTitle: { ...text.headlineMd, color: colors.text, marginBottom: 2 },
  cardTitleActive: { color: colors.neon },
  cardSub: { ...text.bodyMd, color: colors.muted },
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
