import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass, glassOrange } from '@/constants/colors';
import { Pill } from '@/components/ui/Pill';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { Btn } from '@/components/ui/Btn';

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export default function TrainScreen() {
  const { plans, myPlan, loading, fetchPlans, ensureSeeded } = useWorkoutStore();
  const [fetchError, setFetchError] = useState<string | null>(null);

  function load() {
    setFetchError(null);
    ensureSeeded()
      .then(() => fetchPlans())
      .catch((err) => setFetchError(err?.message ?? 'No se pudieron cargar los planes'));
  }

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Entrena</Text>
        <Text style={styles.sub}>Tu plan de la semana</Text>

        {loading && <ActivityIndicator color={colors.neon} style={{ marginTop: 20 }} />}

        {!loading && plans.map((plan, i) => {
          const isRecommended = myPlan?.id === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              style={isRecommended ? [glassOrange, styles.card] : [glass, styles.card]}
              activeOpacity={0.8}
              onPress={() => router.push(`/workout/${plan.id}` as never)}
            >
              <View style={styles.cardContent}>
                {isRecommended && <Pill color={colors.orange}>HOY · RECOMENDADO</Pill>}
                <Text style={styles.cardTitle}>{plan.name}</Text>
                <Text style={styles.cardSub}>
                  {plan.exerciseCount ?? '—'} ejercicios · {plan.daysPerWeek}x semana
                </Text>
                <Pill color={isRecommended ? colors.neon : colors.muted}>
                  {DIFFICULTY_LABEL[plan.difficulty] ?? plan.difficulty}
                </Pill>
              </View>
              <View style={[styles.playBtn, { backgroundColor: isRecommended ? colors.orange : 'rgba(255,255,255,0.06)' }]}>
                <Text style={[styles.playIcon, { color: isRecommended ? '#fff' : colors.muted }]}>▶</Text>
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
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  sub: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  card: {
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardContent: {
    flex: 1,
    gap: 5,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginTop: 2,
  },
  cardSub: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 18,
  },
});
