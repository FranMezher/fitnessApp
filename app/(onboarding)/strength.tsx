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
const STEP = 3;

const LEVELS: {
  id: OnboardingData['strengthLevel'];
  label: string;
  sub: string;
  bars: number;
}[] = [
  { id: 'beginner',     label: 'Principiante', sub: 'Estoy comenzando, pocas sesiones de fuerza.',      bars: 1 },
  { id: 'intermediate', label: 'Intermedio',   sub: 'Entreno regularmente, buena técnica y forma.',     bars: 2 },
  { id: 'advanced',     label: 'Avanzado',     sub: 'Experiencia sólida, técnica depurada.',            bars: 3 },
  { id: 'pro_athlete',  label: 'Atleta Pro',   sub: 'Nivel competitivo o entrenamiento de alto rendimiento.', bars: 4 },
];

export default function StrengthScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';

  const stored = useOnboardingStore((s) => s.data.strengthLevel);
  const setStore = useOnboardingStore((s) => s.set);
  const { token } = useAuthStore();

  const [selected, setSelected] = useState<OnboardingData['strengthLevel']>(stored ?? 'beginner');

  async function handleContinue() {
    setStore({ strengthLevel: selected });
    if (isEdit) {
      if (token) await api.upsertProfile(token, { strengthLevel: selected }).catch(() => {});
      router.back();
      return;
    }
    router.push('/(onboarding)/activity' as never);
  }

  return (
    <OnboardingShell
      step={STEP}
      totalSteps={TOTAL_STEPS}
      title="Tu nivel de fuerza"
      subtitle="Esto define la intensidad inicial de tu programa y la distribución de proteína."
      footer={<Btn onPress={handleContinue}>{isEdit ? 'GUARDAR' : 'CONTINUAR'}</Btn>}
    >
      <View style={styles.list}>
        {LEVELS.map((l) => {
          const active = selected === l.id;
          return (
            <TouchableOpacity
              key={l.id}
              style={[styles.card, active ? glassNeon : glass, active && styles.cardActive]}
              onPress={() => setSelected(l.id)}
              activeOpacity={0.8}
            >
              {/* Density bars */}
              <View style={styles.barsWrap}>
                {Array.from({ length: 4 }, (_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.bar,
                      { height: 10 + i * 6 },
                      i < l.bars
                        ? { backgroundColor: active ? colors.neon : colors.muted }
                        : { backgroundColor: colors.surfaceContainerHigh },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, active && styles.cardTitleActive]}>{l.label}</Text>
                <Text style={styles.cardSub}>{l.sub}</Text>
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
  barsWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    width: 36,
  },
  bar: { width: 6, borderRadius: 3 },
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
