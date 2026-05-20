import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass } from '@/constants/colors';
import { Pill } from '@/components/ui/Pill';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { Btn } from '@/components/ui/Btn';

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

const PLAN_EMOJI: Record<string, string> = {
  push: '💪',
  pull: '🔙',
  legs: '🦵',
  fullbody: '⚡',
  chest: '💪',
  back: '🔙',
  shoulders: '🏋️',
  arms: '💪',
  cardio: '🏃',
};

export default function TrainScreen() {
  const { plans, loading, fetchPlans } = useWorkoutStore();
  const [fetchError, setFetchError] = useState<string | null>(null);

  function load() {
    setFetchError(null);
    fetchPlans()
      .catch((err) => setFetchError(err?.message ?? 'No se pudieron cargar los planes'));
  }

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Entrena</Text>
        <Text style={styles.sub}>Tu plan de la semana</Text>

        {loading && <ActivityIndicator color={colors.neon} style={{ marginTop: 20 }} />}

        {!loading && plans.map((plan) => {
          const emoji = PLAN_EMOJI[plan.name.toLowerCase()] ?? '⚡';
          return (
            <TouchableOpacity
              key={plan.id}
              style={[glass, styles.card]}
              activeOpacity={0.8}
              onPress={() => router.push(`/workout/${plan.id}` as never)}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>
                  <Text style={styles.emoji}>{emoji} </Text>
                  {plan.name}
                </Text>
                <Text style={styles.cardSub}>
                  {plan.exerciseCount ?? '—'} ejercicios · {plan.daysPerWeek}x semana
                </Text>
                <Text style={styles.difficultyBadge}>
                  {DIFFICULTY_LABEL[plan.difficulty] ?? plan.difficulty}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {fetchError && (
          <View style={[glass, { padding: 20, alignItems: 'center', gap: 12 }]}>
            <Text style={{ color: colors.orange, fontFamily: 'SpaceGrotesk_400Regular', textAlign: 'center' }}>
              {fetchError}
            </Text>
            <Btn onPress={load}>Reintentar</Btn>
          </View>
        )}

        {!loading && !fetchError && plans.length === 0 && (
          <View style={[glass, { padding: 20, alignItems: 'center', gap: 12 }]}>
            <Text style={{ color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' }}>
              No hay planes disponibles
            </Text>
            <Btn onPress={load}>Recargar planes</Btn>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 20,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  card: {
    padding: 20,
    marginBottom: 8,
  },
  cardContent: {
    gap: 10,
  },
  emoji: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  cardSub: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  difficultyBadge: {
    fontSize: 10,
    fontWeight: '600',
    padding: 4,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(204,255,0,0.15)',
    color: colors.neon,
    borderRadius: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
});
