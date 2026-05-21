import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, glassNeon, glowShadows } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { HudBackground } from '@/components/ui/HudBackground';
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
      <HudBackground style={styles.flex}>
        <SafeAreaView style={styles.flex}>
          <View style={styles.center}>
            <ActivityIndicator color={colors.neon} size="large" />
          </View>
        </SafeAreaView>
      </HudBackground>
    );
  }

  if (error) {
    return (
      <HudBackground style={styles.flex}>
        <SafeAreaView style={styles.flex}>
          <View style={styles.errorState}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.orange} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadPlan}>
              <Text style={styles.retryBtnText}>Reintentar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
              <Ionicons name="arrow-back" size={16} color={colors.muted} />
              <Text style={styles.backLinkText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </HudBackground>
    );
  }

  return (
    <HudBackground style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* TopAppBar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
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
                <View style={styles.heroStatItem}>
                  <Ionicons name="time-outline" size={14} color={colors.muted} />
                  <Text style={styles.heroStat}>{plan?.daysPerWeek ?? '—'} días/sem</Text>
                </View>
                <View style={styles.heroStatItem}>
                  <Ionicons name="barbell-outline" size={14} color={colors.muted} />
                  <Text style={styles.heroStat}>{exercises.length} ejercicios</Text>
                </View>
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
                        <Ionicons name="checkmark" size={14} color={colors.bg} />
                      </View>
                    ) : isActive ? (
                      <Ionicons name="play" size={18} color={colors.neon} />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={colors.dim} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {exercises.length === 0 && (
              <View style={[glass, styles.emptyCard]}>
                <Ionicons name="fitness-outline" size={32} color={colors.dim} />
                <Text style={styles.emptyText}>No hay ejercicios en este plan</Text>
              </View>
            )}
          </View>

          {/* Bottom spacing for FAB */}
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Sticky CTA */}
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            style={[styles.ctaBtn, exercises.length === 0 && styles.ctaBtnDisabled]}
            onPress={handleStart}
            disabled={exercises.length === 0}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={20} color={colors.bg} />
            <Text style={styles.ctaBtnText}>INICIAR SESIÓN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </HudBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorState: { flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  errorText: { ...text.bodyMd, color: colors.orange, textAlign: 'center' },
  retryBtn: {
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  retryBtnText: { ...text.labelSm, color: colors.neon },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backLinkText: { ...text.bodyMd, color: colors.muted },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 56,
    backgroundColor: 'rgba(8,8,8,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  logo: { ...text.heroMd, fontSize: 20, color: colors.neon, letterSpacing: -0.5 },

  container: { paddingHorizontal: spacing.lg, paddingBottom: 20, gap: spacing.md, paddingTop: spacing.md },

  heroCard: { borderRadius: radius.lg, overflow: 'hidden', minHeight: 160 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
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
  heroStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
  exCardDone: { opacity: 0.45 },
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

  emptyCard: { padding: spacing.xl, alignItems: 'center', borderRadius: radius.lg, gap: spacing.sm },
  emptyText: { ...text.bodyMd, color: colors.muted },

  ctaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(8,8,8,0.9)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neon,
    borderRadius: radius.md,
    height: 56,
    ...glowShadows.neon,
  },
  ctaBtnDisabled: { opacity: 0.4 },
  ctaBtnText: { ...text.headlineMd, color: colors.bg },
});
