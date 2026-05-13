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
const STEP = 6;

const OPTIONS: {
  id: OnboardingData['weightLossSpeed'];
  label: string;
  delta: string;
  benefits: string[];
  recommended?: boolean;
}[] = [
  {
    id: 'slow',
    label: 'Lento',
    delta: '−0.25 kg/sem',
    benefits: ['Pérdida mínima de masa muscular', 'Muy sostenible a largo plazo', 'Menos restricciones dietéticas'],
  },
  {
    id: 'recommended',
    label: 'Recomendado',
    delta: '−0.5 kg/sem',
    benefits: [
      'Gran pérdida de grasa sin afectar masa muscular',
      'Resultados visibles en poco tiempo',
      'Alimentación sostenible',
    ],
    recommended: true,
  },
  {
    id: 'fast',
    label: 'Rápido',
    delta: '−0.75 kg/sem',
    benefits: ['Resultados muy rápidos', 'Requiere más disciplina', 'Mayor déficit calórico'],
  },
];

export default function WeightSpeedScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';

  const stored = useOnboardingStore((s) => s.data.weightLossSpeed);
  const setStore = useOnboardingStore((s) => s.set);
  const { token } = useAuthStore();

  const [selected, setSelected] = useState<OnboardingData['weightLossSpeed']>(stored ?? 'recommended');

  async function handleContinue() {
    setStore({ weightLossSpeed: selected });

    if (isEdit) {
      if (token) {
        await api.upsertProfile(token, { weightLossSpeed: selected }).catch(() => {});
      }
      router.back();
      return;
    }

    router.push('/(onboarding)/food-variety' as never);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(STEP / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.step}>Paso {STEP} de {TOTAL_STEPS}</Text>
        <Text style={styles.title}>Velocidad de pérdida de peso</Text>
        <Text style={styles.subtitle}>Elegí tu ritmo según tus preferencias</Text>

        {OPTIONS.map((o) => {
          const active = selected === o.id;
          return (
            <TouchableOpacity
              key={o.id}
              style={[active ? glassNeon : glass, styles.card, o.recommended && !active && styles.cardHighlight]}
              onPress={() => setSelected(o.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>
                    {o.label}
                    {o.recommended && (
                      <Text style={styles.recBadge}> · Recomendado</Text>
                    )}
                  </Text>
                  <Text style={styles.cardDelta}>{o.delta}</Text>
                </View>
                {active && <Text style={styles.check}>✓</Text>}
              </View>
              {active && (
                <View style={styles.benefits}>
                  {o.benefits.map((b, i) => (
                    <Text key={i} style={styles.benefit}>✦ {b}</Text>
                  ))}
                </View>
              )}
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
  safe: { flex: 1, backgroundColor: colors.bg },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.08)' },
  progressFill: { height: 3, backgroundColor: colors.neon, borderRadius: 2 },
  container: { padding: 24, paddingTop: 16 },
  step: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 4, fontFamily: 'SpaceGrotesk_700Bold' },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 20, fontFamily: 'SpaceGrotesk_400Regular' },
  card: { padding: 16, marginBottom: 10 },
  cardHighlight: {
    backgroundColor: 'rgba(204,255,0,0.03)',
    borderColor: 'rgba(204,255,0,0.15)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLabel: { fontSize: 16, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  cardLabelActive: { color: colors.neon },
  recBadge: { fontSize: 12, color: colors.neon, fontFamily: 'SpaceGrotesk_400Regular', fontWeight: '400' },
  cardDelta: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', marginTop: 2 },
  check: { color: colors.neon, fontSize: 16 },
  benefits: { marginTop: 12, gap: 6 },
  benefit: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  btnWrap: { marginTop: 8 },
});
