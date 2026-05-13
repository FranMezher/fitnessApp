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
const STEP = 9;

const OPTIONS: { id: OnboardingData['mealPlanning']; icon: string; label: string; desc: string }[] = [
  {
    id: 'self',
    icon: '🧑‍🍳',
    label: 'Quiero elegir mis comidas',
    desc: 'Vos decidís qué comer cada día. La app te muestra opciones y vos elegís las que más te gustan.',
  },
  {
    id: 'app',
    icon: '🤖',
    label: 'Dejar que la app elija por mí',
    desc: 'La app genera tu plan de comidas automáticamente basado en tus preferencias y objetivos.',
  },
];

export default function MealPlanningScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';

  const stored = useOnboardingStore((s) => s.data.mealPlanning);
  const setStore = useOnboardingStore((s) => s.set);
  const { token } = useAuthStore();

  const [selected, setSelected] = useState<OnboardingData['mealPlanning']>(stored ?? 'self');

  async function handleContinue() {
    setStore({ mealPlanning: selected });

    if (isEdit) {
      if (token) {
        await api.upsertProfile(token, { mealPlanning: selected }).catch(() => {});
      }
      router.back();
      return;
    }

    router.push('/(onboarding)/plan' as never);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(STEP / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.step}>Paso {STEP} de {TOTAL_STEPS}</Text>
        <Text style={styles.title}>¿Cómo querés planificar tus comidas?</Text>
        <Text style={styles.subtitle}>Podés cambiar esto en cualquier momento desde tu perfil</Text>

        {OPTIONS.map((o) => {
          const active = selected === o.id;
          return (
            <TouchableOpacity
              key={o.id}
              style={[active ? glassNeon : glass, styles.card]}
              onPress={() => setSelected(o.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.icon}>{o.icon}</Text>
              <View style={styles.cardText}>
                <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>{o.label}</Text>
                <Text style={styles.cardDesc}>{o.desc}</Text>
              </View>
              {active && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          );
        })}

        <View style={styles.btnWrap}>
          <Btn onPress={handleContinue}>{isEdit ? 'Guardar' : 'Ver mi plan →'}</Btn>
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
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16, marginBottom: 10 },
  icon: { fontSize: 28, marginTop: 2 },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  cardLabelActive: { color: colors.neon },
  cardDesc: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', marginTop: 4, lineHeight: 18 },
  check: { color: colors.neon, fontSize: 16, marginTop: 4 },
  btnWrap: { marginTop: 8 },
});
