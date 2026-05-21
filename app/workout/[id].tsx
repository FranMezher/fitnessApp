import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, glass, glassNeon, glowShadows } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { Btn } from '@/components/ui/Btn';
import { api, WorkoutPlan, PlanExerciseDetail } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

const MUSCLE_COLORS: Record<string, string> = {
  Pecho: colors.neon, Espalda: colors.teal, Tríceps: colors.orange,
  Hombros: colors.purple, Bíceps: '#66aaff', Core: colors.teal,
  Piernas: colors.teal, 'Full Body': colors.orange,
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado',
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
      .then(({ plan: p, exercises: exs }) => { setPlan(p); setExercises(exs); })
      .catch((err) => setError(err?.message ?? 'No se pudieron cargar los ejercicios'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadPlan(); }, [token, id]);

  const activeIdx = exercises.findIndex((e) => !completedIds.includes(e.id));
  const completedCount = completedIds.length;
  const progressPct = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;

  function handleToggle(exId: string) {
    setCompletedIds((prev) => prev.includes(exId) ? prev.filter((i) => i !== exId) : [...prev, exId]);
  }

  function handleStart() {
    const exForActive = exercises.map((ex) => ({
      id: ex.id,
      name: ex.exercise?.name ?? 'Ejercicio',
      sets: ex.sets,
      reps: ex.reps,
      muscleGroup: ex.exercise?.muscleGroup,
      instructions: ex.exercise?.instructions,
    }));
    router.push({
      pathname: '/workout/active',
      params: { exercisesJson: JSON.stringify(exForActive), planId: id, planName: plan?.name ?? 'Entrenamiento' },
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
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{error}</Text>
          <Btn onPress={loadPlan}>Reintentar</Btn>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* TopAppBar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>FITCORE</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero header */}
        <View style={[glass, styles.heroCard]}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadgeRow}>
              {plan?.difficulty && (
                <View style={[glassNeon, styles.diffBadge]}>
                  <Text style={styles.diffBadgeText}>
                    {DIFFICULTY_LABELS[plan.difficulty] ?? plan.difficulty.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.heroTitle}>{plan?.name ?? 'Entrenamiento'}</Text>
            <View style={styles.heroStats}>
              <Text style={styles.heroStat}>⏱ {plan?.daysPerWeek ?? '—'} días/sem</Text>
              <Text style={styles.heroStat}>💪 {exercises.length} ejercicios</Text>
            </View>
          </View>
        </View>

        {/* Progress stats */}
        <View style={styles.statsRow}>
          <View style={[glass, styles.statCard]}>
            <Text style={styles.statLabel}>COMPLETADOS</Text>
            <Text style={styles.statValue}>{completedCount}/{exercises.length}</Text>
          </View>
          <View style={[glass, styles.statCard]}>
            <Text style={styles.statLabel}>PROGRESO</Text>
            <Text style={[styles.statValue, { color: colors.neon }]}>{progressPct}%</Text>
            <View style={styles.statBar}>
              <View style={[styles.statBarFill, { width: `${progressPct}%` }]} />
            </View>
          </View>
        </View>

        {/* Exercise list */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Protocolo de ejercicios</Text>
            <Text style={styles.listCount}>{exercises.length} EJERCICIOS</Text>
          </View>

          {exercises.map((ex, i) => {
            const isDone = completedIds.includes(ex.id);
            const isActive = i === activeIdx;
            const mc = MUSCLE_COLORS[ex.exercise?.muscleGroup ?? ''] ?? colors.muted;

            return (
              <TouchableOpacity
                key={ex.id}
                style={[
                  glass,
                  styles.exCard,
                  isActive && { borderColor: colors.neon + '50', ...glowShadows.neon },
                  isDone && styles.exCardDone,
                ]}
                activeOpacity={0.8}
                onPress={() => isActive ? handleStart() : handleToggle(ex.id)}
              >
                <View style={[styles.exAccent, { backgroundColor: mc }]} />
                <View style={styles.exInfo}>
                  <Text style={[styles.exName, isActive && { color: colors.neon }]}>
                    {ex.exercise?.name ?? `Ejercicio ${i + 1}`}
                  </Text>
                  <View style={styles.exMeta}>
                    {ex.exercise?.muscleGroup && (
                      <Text style={[styles.exMuscle, { color: mc }]}>{ex.exercise.muscleGroup}</Text>
                    )}
                    <Text style={styles.exSets}>{ex.sets} series · {ex.reps} reps</Text>
                  </View>
                </View>
                <View style={styles.exRight}>
                  {isDone ? (
                    <View style={styles.doneCheck}>
                      <Text style={styles.doneCheckText}>✓</Text>
                    </View>
                  ) : isActive ? (
                    <Text style={styles.playIcon}>▶</Text>
                  ) : (
                    <Text style={styles.exArrow}>›</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {exercises.length === 0 && (
            <View style={[glass, styles.emptyCard]}>
              <Text style={styles.emptyText}>No hay ejercicios en este plan</Text>
            </View>
          )}
        </View>

        <View style={styles.ctaWrap}>
          <Btn onPress={handleStart} disabled={exercises.length === 0}>
            INICIAR SESIÓN
          </Btn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  errorState: { flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  errorText: { ...text.bodyMd, color: colors.orange, textAlign: 'center' },
  backLink: { ...text.bodyMd, color: colors.muted },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
    height: 56,
    backgroundColor: 'rgba(8,8,8,0.7)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 22, color: colors.muted },
  logo: { ...text.heroMd, fontSize: 20, color: colors.neon, letterSpacing: -0.5 },

  container: { paddingHorizontal: spacing.marginMobile, paddingBottom: 100, gap: spacing.md, paddingTop: spacing.md },

  heroCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    minHeight: 160,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroContent: { padding: spacing.lg, gap: spacing.sm },
  heroBadgeRow: { flexDirection: 'row', gap: spacing.xs },
  diffBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  diffBadgeText: { ...text.labelSm, color: colors.neon },
  heroTitle: { ...text.heroMd, color: colors.text },
  heroStats: { flexDirection: 'row', gap: spacing.lg },
  heroStat: { ...text.bodyMd, color: colors.muted },

  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, padding: spacing.md, borderRadius: radius.lg, gap: spacing.xs },
  statLabel: { ...text.labelSm, color: colors.muted },
  statValue: { ...text.headlineLg, color: colors.text },
  statBar: {
    height: 3,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  statBarFill: { height: '100%', backgroundColor: colors.neon, borderRadius: radius.full },

  listSection: { gap: spacing.sm },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { ...text.headlineMd, color: colors.text },
  listCount: { ...text.dataMono, color: colors.neon, fontSize: 11 },

  exCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    overflow: 'hidden',
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    gap: spacing.md,
  },
  exCardDone: { opacity: 0.5 },
  exAccent: { width: 3, alignSelf: 'stretch' },
  exInfo: { flex: 1, gap: 4, paddingLeft: spacing.xs },
  exName: { ...text.headlineMd, color: colors.text },
  exMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exMuscle: { ...text.labelSm },
  exSets: { ...text.dataMono, color: colors.muted, fontSize: 11 },
  exRight: { width: 32, alignItems: 'center' },
  doneCheck: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCheckText: { fontSize: 12, color: '#111', fontWeight: '700' },
  playIcon: { fontSize: 16, color: colors.neon },
  exArrow: { fontSize: 18, color: colors.dim },

  emptyCard: { padding: spacing.xl, alignItems: 'center', borderRadius: radius.lg },
  emptyText: { ...text.bodyMd, color: colors.muted },

  ctaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.marginMobile,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
