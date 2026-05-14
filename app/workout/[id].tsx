import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Pill } from '@/components/ui/Pill';
import { Btn } from '@/components/ui/Btn';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { api, WorkoutPlan, PlanExerciseDetail } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

const MUSCLE_COLORS: Record<string, string> = {
  Pecho:    colors.neon,
  Espalda:  colors.teal,
  Tríceps:  colors.orange,
  Hombros:  colors.purple,
  Bíceps:   '#66aaff',
  Core:     colors.teal,
  Piernas:  colors.teal,
  'Full Body': colors.orange,
};

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [exercises, setExercises] = useState<PlanExerciseDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  function loadPlan() {
    if (!token) { setError('No hay sesión activa'); setLoading(false); return; }
    if (!id) { setError('ID de plan inválido'); setLoading(false); return; }
    setLoading(true);
    setError(null);
    api.getWorkoutPlan(token, id)
      .then(({ plan: p, exercises: exs }) => {
        setPlan(p);
        setExercises(exs);
      })
      .catch((err) => setError(err?.message ?? 'No se pudieron cargar los ejercicios'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadPlan(); }, [token, id]);

  const activeIdx = exercises.findIndex((e) => !completedIds.includes(e.id));
  const completedCount = completedIds.length;
  const progressPct = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;

  function handleComplete(exId: string) {
    setCompletedIds((prev) => [...prev, exId]);
  }

  function handleContinue() {
    const activeEx = exercises[activeIdx];
    router.push({
      pathname: '/workout/active',
      params: {
        exerciseName: activeEx?.exercise?.name ?? 'Ejercicio',
        planId: id,
      },
    } as never);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.neon} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <Text style={{ color: colors.orange, fontSize: 15, textAlign: 'center', fontFamily: 'SpaceGrotesk_400Regular' }}>
            {error}
          </Text>
          <Btn onPress={loadPlan}>Reintentar</Btn>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.muted, fontSize: 14, fontFamily: 'SpaceGrotesk_400Regular' }}>← Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.workoutTitle}>{plan?.name ?? 'Entrenamiento'}</Text>
            <Text style={styles.workoutSub}>
              {exercises.length} ejercicios · {plan?.daysPerWeek}x semana
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.countText}>{completedCount}/{exercises.length}</Text>
            <Text style={styles.countLabel}>completados</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressWrap}>
          <ProgressBar pct={progressPct} h={5} />
        </View>

        {/* Exercise list */}
        <Text style={styles.sectionLabel}>Ejercicios de hoy</Text>

        {exercises.map((ex, i) => {
          const isDone = completedIds.includes(ex.id);
          const isActive = i === activeIdx;
          const mc = MUSCLE_COLORS[ex.exercise?.muscleGroup ?? ''] ?? colors.muted;

          return (
            <TouchableOpacity
              key={ex.id}
              style={[
                isActive ? glassNeon : glass,
                styles.exerciseRow,
                isDone && { opacity: 0.65 },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                if (isActive) handleContinue();
                else if (!isDone) handleComplete(ex.id);
              }}
            >
              <View style={styles.exerciseMain}>
                <View style={[
                  styles.statusIcon,
                  isDone
                    ? { backgroundColor: `${colors.neon}1a`, borderColor: `${colors.neon}55` }
                    : isActive
                    ? { backgroundColor: `${colors.orange}1a`, borderColor: `${colors.orange}55` }
                    : { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                  <Text style={[
                    styles.statusIconText,
                    { color: isDone ? colors.neon : isActive ? colors.orange : colors.dim },
                  ]}>
                    {isDone ? '✓' : isActive ? '▶' : '○'}
                  </Text>
                </View>

                <View style={styles.exerciseInfo}>
                  <View style={styles.exerciseNameRow}>
                    <Text style={[
                      styles.exerciseName,
                      { color: isActive ? colors.neon : colors.text, fontWeight: isActive ? '700' : '500' },
                    ]}>
                      {ex.exercise?.name ?? `Ejercicio ${i + 1}`}
                    </Text>
                  </View>
                  <View style={styles.exerciseMeta}>
                    <Text style={[styles.muscleName, { color: mc }]}>
                      {ex.exercise?.muscleGroup ?? ''}
                    </Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.setsText}>{ex.sets}×{ex.reps}</Text>
                    {isActive && <Pill color={colors.orange}>ACTIVO</Pill>}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {exercises.length === 0 && (
          <View style={[glass, { padding: 20, alignItems: 'center' }]}>
            <Text style={{ color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' }}>
              No hay ejercicios en este plan
            </Text>
          </View>
        )}

        <View style={styles.ctaWrap}>
          <Btn onPress={handleContinue} disabled={exercises.length === 0}>
            Continuar sesión →
          </Btn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  backText: { fontSize: 20, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  headerCenter: { flex: 1 },
  workoutTitle: { fontSize: 16, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  workoutSub: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  headerRight: { alignItems: 'flex-end' },
  countText: { fontSize: 13, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold' },
  countLabel: { fontSize: 11, color: colors.dim, fontFamily: 'SpaceGrotesk_400Regular' },
  progressWrap: { marginBottom: 6 },
  sectionLabel: { fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600', fontFamily: 'SpaceGrotesk_600SemiBold', marginTop: 8, marginBottom: 2 },
  exerciseRow: { padding: 10, paddingHorizontal: 12, borderRadius: 16 },
  exerciseMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusIcon: { width: 30, height: 30, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  statusIconText: { fontSize: 13 },
  exerciseInfo: { flex: 1, minWidth: 0 },
  exerciseNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  exerciseName: { fontSize: 14, fontFamily: 'SpaceGrotesk_400Regular' },
  exerciseMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  muscleName: { fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold' },
  metaDot: { fontSize: 11, color: colors.dim },
  setsText: { fontSize: 11, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  ctaWrap: { marginTop: 8 },
});
