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
const STEP = 4;

const OPTIONS: { id: OnboardingData['activityLevel']; fires: string; label: string; sub: string }[] = [
  { id: 'none',  fires: '⬜',  label: 'No hago ejercicio',    sub: 'Estilo de vida completamente sedentario' },
  { id: '1-2',   fires: '🔥',  label: '1–2 días por semana',  sub: 'Actividad física leve' },
  { id: '3-4',   fires: '🔥🔥', label: '3–4 días por semana',  sub: 'Actividad moderada' },
  { id: '5-6',   fires: '🔥🔥🔥', label: '5–6 días por semana', sub: 'Actividad intensa' },
  { id: 'daily', fires: '🔥🔥🔥🔥', label: 'Todos los días',    sub: 'Atleta o entrenamiento diario' },
];

export default function ActivityScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';

  const stored = useOnboardingStore((s) => s.data.activityLevel);
  const setStore = useOnboardingStore((s) => s.set);
  const { token } = useAuthStore();

  const [selected, setSelected] = useState<OnboardingData['activityLevel']>(stored ?? '3-4');

  async function handleContinue() {
    setStore({ activityLevel: selected });

    if (isEdit) {
      if (token) {
        await api.upsertProfile(token, { activityLevel: selected }).catch(() => {});
      }
      router.back();
      return;
    }

    router.push('/(onboarding)/lifestyle' as never);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(STEP / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.step}>Paso {STEP} de {TOTAL_STEPS}</Text>
        <Text style={styles.title}>¿Cuál es tu nivel de actividad?</Text>
        <Text style={styles.subtitle}>No te preocupes, lo podés cambiar después</Text>

        {OPTIONS.map((o) => {
          const active = selected === o.id;
          return (
            <TouchableOpacity
              key={o.id}
              style={[active ? glassNeon : glass, styles.card]}
              onPress={() => setSelected(o.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.fires}>{o.fires}</Text>
              <View style={styles.cardText}>
                <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>{o.label}</Text>
                <Text style={styles.cardSub}>{o.sub}</Text>
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
  safe: { flex: 1, backgroundColor: colors.bg },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.08)' },
  progressFill: { height: 3, backgroundColor: colors.neon, borderRadius: 2 },
  container: { padding: 24, paddingTop: 16 },
  step: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 4, fontFamily: 'SpaceGrotesk_700Bold' },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 20, fontFamily: 'SpaceGrotesk_400Regular' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, paddingHorizontal: 16, marginBottom: 10 },
  fires: { fontSize: 20, width: 52 },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  cardLabelActive: { color: colors.neon },
  cardSub: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', marginTop: 2 },
  check: { color: colors.neon, fontSize: 16 },
  btnWrap: { marginTop: 8 },
});
