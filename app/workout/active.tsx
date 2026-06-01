import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, glassNeon, glowShadows } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { HudBackground } from '@/components/ui/HudBackground';
import { RepBadges } from '@/components/ui/RepBadges';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

const CALORIES_PER_MIN = 8;
const REST_DURATION = 60;

interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: number;
  muscleGroup?: string;
  instructions?: string;
}

interface LoggedSet {
  exerciseId: string;
  exerciseName: string;
  reps: number;
  setNum: number;
  weight?: number;
  muscleGroup?: string;
}

export default function WorkoutActiveScreen() {
  const token = useAuthStore((s) => s.token);
  const params = useLocalSearchParams<{
    exercisesJson?: string;
    planId?: string;
    planName?: string;
  }>();

  const planId = params.planId;
  const planName = params.planName ?? 'Entrenamiento';
  const exercises: ExerciseItem[] = (() => {
    try { return JSON.parse(params.exercisesJson ?? '[]'); } catch { return []; }
  })();

  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [actualReps, setActualReps] = useState(exercises[0]?.reps ?? 10);
  const [weight, setWeight] = useState<number | null>(null);
  const [phase, setPhase] = useState<'exercise' | 'rest'>('exercise');
  const [restSeconds, setRestSeconds] = useState(REST_DURATION);
  const [elapsed, setElapsed] = useState(0);
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);

  const sessionIdRef = useRef<string | null>(null);
  const finishedRef = useRef(false);
  const elapsedRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => {
      elapsedRef.current = s + 1;
      return s + 1;
    }), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (phase !== 'rest') return;
    if (restSeconds <= 0) { setPhase('exercise'); return; }
    const t = setTimeout(() => setRestSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, restSeconds]);

  useEffect(() => {
    if (!token) return;
    api.startSession(token, planId).then(({ id }) => {
      sessionIdRef.current = id;
    }).catch((err) => console.warn('[active] startSession error:', err?.message));

    return () => {
      if (sessionIdRef.current && !finishedRef.current && token) {
        finishedRef.current = true;
        api.finishSession(token, sessionIdRef.current, {
          caloriesBurned: Math.round((elapsedRef.current / 60) * CALORIES_PER_MIN),
          sets: [],
        }).catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const currentEx = exercises[currentExIdx];
  const nextEx = exercises[currentExIdx + 1];
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const progressPct = exercises.length > 0
    ? Math.round(((currentExIdx + (currentSet - 1) / (currentEx?.sets ?? 1)) / exercises.length) * 100)
    : 0;
  const caloriesBurned = Math.round((elapsed / 60) * CALORIES_PER_MIN);

  async function finishWorkout(sets: LoggedSet[]) {
    finishedRef.current = true;
    const durationMin = Math.max(1, Math.round(elapsedRef.current / 60));
    const cal = Math.round(durationMin * CALORIES_PER_MIN);
    let xpEarned = 100;

    if (sessionIdRef.current && token) {
      try {
        const result = await api.finishSession(token, sessionIdRef.current, {
          caloriesBurned: cal,
          sets: sets.map((s) => {
            const ex = exercises.find((e) => e.id === s.exerciseId);
            return { exerciseId: s.exerciseId, repsCompleted: s.reps, repsTarget: ex?.reps ?? 10, seriesNum: s.setNum };
          }),
        });
        xpEarned = result.xpEarned;
      } catch (err) {
        console.warn('[active] finishSession error:', err);
      }
    }

    router.push({
      pathname: '/workout/summary',
      params: {
        durationMin: String(durationMin),
        exercisesDone: String(exercises.length),
        xpEarned: String(xpEarned),
        planName,
        planDetailsJson: JSON.stringify(exercises.map((ex) => ({ name: ex.name, sets: ex.sets, reps: ex.reps }))),
        loggedSetsJson: JSON.stringify(sets),
      },
    });
  }

  function completeSerie() {
    if (!currentEx) return;
    const newSet: LoggedSet = {
      exerciseId: currentEx.id,
      exerciseName: currentEx.name,
      reps: actualReps,
      setNum: currentSet,
      weight: weight ?? undefined,
      muscleGroup: currentEx.muscleGroup,
    };
    const updatedSets = [...loggedSets, newSet];
    setLoggedSets(updatedSets);

    const isLastSet = currentSet >= currentEx.sets;
    const isLastEx = currentExIdx >= exercises.length - 1;

    if (!isLastSet) {
      setCurrentSet((s) => s + 1);
      setRestSeconds(REST_DURATION);
      setPhase('rest');
    } else if (!isLastEx) {
      const nextExercise = exercises[currentExIdx + 1];
      setCurrentExIdx((i) => i + 1);
      setCurrentSet(1);
      setActualReps(nextExercise?.reps ?? 10);
      setWeight(null);
      setRestSeconds(REST_DURATION);
      setPhase('rest');
    } else {
      finishWorkout(updatedSets);
    }
  }

  if (!currentEx && phase === 'exercise') {
    return (
      <HudBackground style={styles.flex}>
        <SafeAreaView style={styles.flex}>
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={48} color={colors.dim} />
            <Text style={styles.emptyText}>No hay ejercicios en este plan.</Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </HudBackground>
    );
  }

  // ── REST PHASE ──
  if (phase === 'rest') {
    const restMm = String(Math.floor(restSeconds / 60)).padStart(2, '0');
    const restSs = String(restSeconds % 60).padStart(2, '0');
    return (
      <HudBackground style={styles.flex}>
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => finishWorkout(loggedSets)} style={styles.exitBtn}>
              <Ionicons name="close" size={20} color={colors.muted} />
            </TouchableOpacity>
            <View style={styles.topBarCenter}>
              <Text style={styles.topBarSub}>Workout</Text>
              <Text style={styles.topBarTitle}>DESCANSO</Text>
            </View>
            <View style={styles.topBarTimer}>
              <Text style={styles.topBarTimerText}>{mm}:{ss}</Text>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Ejercicio {currentExIdx + 1} de {exercises.length}</Text>
              <Text style={styles.progressPct}>{progressPct}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
          </View>

          {/* Rest counter */}
          <View style={styles.restCenter}>
            <Text style={styles.restCounterLabel}>DESCANSO</Text>
            <Text style={styles.restTimer}>{restMm}:{restSs}</Text>
            <Text style={styles.restSubLabel}>Recuperate para la siguiente serie</Text>
          </View>

          {/* Next card */}
          {currentEx && (
            <View style={[glass, styles.nextCard]}>
              <Text style={styles.nextCardLabel}>
                {currentSet > 1 ? 'PRÓXIMA SERIE' : 'SIGUIENTE EJERCICIO'}
              </Text>
              <Text style={styles.nextCardName}>{currentEx.name}</Text>
              <Text style={styles.nextCardSub}>
                {currentSet > 1
                  ? `Serie ${currentSet} de ${currentEx.sets} · Objetivo: ${currentEx.reps} reps`
                  : `${currentEx.sets} series × ${currentEx.reps} reps`}
              </Text>
            </View>
          )}

          {/* Bottom controls */}
          <View style={styles.bottomPanel}>
            <View style={[glass, styles.statsRow]}>
              <View style={styles.statMini}>
                <Text style={styles.statMiniLabel}>CALORÍAS</Text>
                <Text style={styles.statMiniValue}>{caloriesBurned}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statMini}>
                <Text style={styles.statMiniLabel}>SERIES</Text>
                <Text style={styles.statMiniValue}>{loggedSets.length}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.completeCta}
              onPress={() => { setRestSeconds(0); setPhase('exercise'); }}
              activeOpacity={0.85}
            >
              <Text style={styles.completeCtaText}>SALTEAR DESCANSO →</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </HudBackground>
    );
  }

  // ── EXERCISE PHASE ──
  return (
    <HudBackground style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => finishWorkout(loggedSets)} style={styles.exitBtn}>
            <Ionicons name="close" size={20} color={colors.muted} />
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Text style={styles.topBarSub}>Workout</Text>
            <Text style={styles.topBarTitle} numberOfLines={1}>{planName}</Text>
          </View>
          <View style={styles.topBarTimer}>
            <Text style={styles.topBarTimerText}>{mm}:{ss}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Ejercicio {currentExIdx + 1} de {exercises.length}</Text>
            <Text style={styles.progressPct}>{progressPct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        </View>

        {/* Exercise name */}
        <View style={styles.timerSection}>
          <Text style={styles.exerciseName}>{currentEx.name}</Text>
          <View style={styles.exerciseMeta}>
            {currentEx.muscleGroup && (
              <Text style={styles.muscleLabel}>{currentEx.muscleGroup}</Text>
            )}
            {nextEx && (
              <Text style={styles.nextChipText} numberOfLines={1}>· Sig: {nextEx.name}</Text>
            )}
          </View>
        </View>

        {/* Form area */}
        <View style={[glass, styles.formArea]}>
          {/* Series row — horizontal */}
          <View style={styles.seriesRow}>
            <Text style={styles.seriesLabel}>SERIE <Text style={styles.seriesValue}>{currentSet}/{currentEx.sets}</Text></Text>
            <View style={styles.seriesDots}>
              {Array.from({ length: currentEx.sets }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i < currentSet - 1 ? styles.dotDone
                    : i === currentSet - 1 ? styles.dotActive
                    : styles.dotPending,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Rep counter hero */}
          <View style={styles.repCenter}>
            <View style={styles.repRow}>
              <TouchableOpacity
                style={styles.repMinus}
                onPress={() => setActualReps((r) => Math.max(0, r - 1))}
              >
                <Text style={styles.repMinusText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.repValue}>{actualReps}</Text>
              <TouchableOpacity
                style={styles.repPlus}
                onPress={() => setActualReps((r) => r + 1)}
              >
                <Text style={styles.repPlusText}>+</Text>
              </TouchableOpacity>
            </View>
            <RepBadges completed={Math.min(actualReps, currentEx.reps)} total={currentEx.reps} size={30} />
            <Text style={styles.repTargetLabel}>Objetivo: {currentEx.reps} reps</Text>
          </View>

          {/* Weight + instructions row */}
          <View style={styles.bottomInfoRow}>
            <View style={styles.weightBlock}>
              <Text style={styles.weightLabel}>PESO (KG)</Text>
              <TextInput
                style={styles.weightInput}
                placeholder="—"
                placeholderTextColor={colors.dim}
                keyboardType="decimal-pad"
                value={weight !== null ? String(weight) : ''}
                onChangeText={(val) => setWeight(val === '' ? null : parseFloat(val) || null)}
              />
            </View>
            {currentEx.instructions && (
              <TouchableOpacity
                style={styles.instructionsBtn}
                onPress={() => setShowInstructions((v) => !v)}
                activeOpacity={0.8}
              >
                <Ionicons name={showInstructions ? 'chevron-up' : 'chevron-down'} size={14} color={colors.muted} />
                <Text style={styles.instructionsToggleText}>Instrucciones</Text>
              </TouchableOpacity>
            )}
          </View>
          {showInstructions && currentEx.instructions && (
            <Text style={styles.instructionsText}>{currentEx.instructions}</Text>
          )}
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomPanel}>
          <View style={[glass, styles.statsRow]}>
            <View style={styles.statMini}>
              <Text style={styles.statMiniLabel}>CALORÍAS</Text>
              <Text style={styles.statMiniValue}>{caloriesBurned}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statMini}>
              <Text style={styles.statMiniLabel}>SERIES</Text>
              <Text style={styles.statMiniValue}>{loggedSets.length}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.completeCta}
            onPress={completeSerie}
            activeOpacity={0.85}
          >
            <Text style={styles.completeCtaText}>COMPLETAR SERIE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => finishWorkout(loggedSets)} style={styles.finishLink}>
            <Text style={styles.finishLinkText}>Finalizar entrenamiento</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </HudBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
  emptyText: { ...text.bodyMd, color: colors.muted, textAlign: 'center' },
  backBtn: {
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  backBtnText: { ...text.labelSm, color: colors.neon },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 56,
    backgroundColor: 'rgba(8,8,8,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  exitBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: { flex: 1, alignItems: 'center' },
  topBarSub: { ...text.labelSm, color: colors.muted },
  topBarTitle: { ...text.bodyMd, color: colors.text, fontWeight: '600' },
  topBarTimer: { width: 56, alignItems: 'flex-end' },
  topBarTimerText: { ...text.dataMono, color: colors.muted },

  progressSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.xs },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { ...text.labelSm, color: colors.neon },
  progressPct: { ...text.dataMono, color: colors.muted },
  progressTrack: {
    height: 4,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.neon, borderRadius: radius.full },

  timerSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: 2,
  },
  exerciseName: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center', fontFamily: 'SpaceGrotesk_700Bold' },
  exerciseMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  muscleLabel: { ...text.labelSm, color: colors.muted },
  nextChipText: { ...text.labelSm, color: colors.dim },

  formArea: {
    flex: 1,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    justifyContent: 'center',
  },

  seriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  seriesLabel: { ...text.labelSm, color: colors.muted },
  seriesValue: { color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  seriesDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotDone: { backgroundColor: colors.neon },
  dotActive: { backgroundColor: colors.orange },
  dotPending: { backgroundColor: colors.dim },

  repCenter: { alignItems: 'center', gap: spacing.sm },
  repRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  repMinus: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repMinusText: { fontSize: 26, color: colors.text, fontWeight: '700' },
  repPlus: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
    ...glowShadows.neon,
  },
  repPlusText: { fontSize: 26, color: colors.bg, fontWeight: '700' },
  repValue: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: -2,
    minWidth: 80,
    textAlign: 'center',
    lineHeight: 68,
    ...glowShadows.neon,
  },
  repTargetLabel: { ...text.labelSm, color: colors.muted },

  bottomInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  weightBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  weightLabel: { ...text.labelSm, color: colors.muted },
  weightInput: {
    ...text.headlineMd,
    color: colors.text,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    minWidth: 64,
    textAlign: 'center',
  },
  instructionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  instructionsToggleText: { ...text.labelSm, color: colors.muted },
  instructionsText: { ...text.bodyMd, color: colors.muted, lineHeight: 20 },

  bottomPanel: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  statMini: { alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: colors.border },
  statMiniLabel: { ...text.labelSm, color: colors.muted },
  statMiniValue: { ...text.headlineMd, color: colors.text },

  playBtnOrange: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    ...glowShadows.orange,
  },
  completeCta: {
    backgroundColor: colors.neon,
    borderRadius: radius.md,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...glowShadows.neon,
  },
  completeCtaText: { ...text.headlineMd, color: colors.bg },
  finishLink: { alignItems: 'center', paddingVertical: spacing.xs },
  finishLinkText: { ...text.labelSm, color: colors.dim },

  // Rest phase
  restCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  restCounterLabel: { ...text.labelCaps, color: colors.neon },
  restTimer: {
    fontSize: 80,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: -3,
    lineHeight: 84,
    ...glowShadows.neon,
  },
  restSubLabel: { ...text.bodyMd, color: colors.muted },
  nextCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  nextCardLabel: { ...text.labelSm, color: colors.muted },
  nextCardName: { ...text.headlineLg, color: colors.text },
  nextCardSub: { ...text.bodyMd, color: colors.muted },
});
