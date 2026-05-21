import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, glass, glassNeon, glowShadows } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { Btn } from '@/components/ui/Btn';
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
          formAccuracyPct: 100,
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
          formAccuracyPct: 100,
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay ejercicios en este plan.</Text>
          <Btn onPress={() => router.back()}>Volver</Btn>
        </View>
      </SafeAreaView>
    );
  }

  // ── REST PHASE ──
  if (phase === 'rest') {
    const restMm = String(Math.floor(restSeconds / 60)).padStart(2, '0');
    const restSs = String(restSeconds % 60).padStart(2, '0');
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => finishWorkout(loggedSets)} style={styles.exitBtn}>
            <Text style={styles.exitBtnText}>✕</Text>
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
          <View style={[glassNeon, styles.nextCard]}>
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
          <View style={[glass, styles.controlsRow]}>
            <View style={styles.statMini}>
              <Text style={styles.statMiniLabel}>CALORÍAS</Text>
              <Text style={styles.statMiniValue}>{caloriesBurned}</Text>
            </View>
            <TouchableOpacity
              style={[styles.playBtnOrange]}
              onPress={() => { setRestSeconds(0); setPhase('exercise'); }}
              activeOpacity={0.85}
            >
              <Text style={styles.skipText}>SALTAR ▶</Text>
            </TouchableOpacity>
            <View style={styles.statMini}>
              <Text style={styles.statMiniLabel}>SERIES</Text>
              <Text style={styles.statMiniValue}>{loggedSets.length}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── EXERCISE PHASE ──
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => finishWorkout(loggedSets)} style={styles.exitBtn}>
          <Text style={styles.exitBtnText}>✕</Text>
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

      {/* Timer + exercise name */}
      <View style={styles.timerSection}>
        <Text style={styles.mainTimer}>{mm}:{ss}</Text>
        <Text style={styles.exerciseName}>{currentEx.name}</Text>
        {currentEx.muscleGroup && (
          <Text style={styles.muscleLabel}>{currentEx.muscleGroup}</Text>
        )}
        {nextEx && (
          <View style={[glass, styles.nextChip]}>
            <Text style={styles.nextChipText}>Siguiente: {nextEx.name}</Text>
          </View>
        )}
      </View>

      {/* Visual form area — exercise info + rep counter */}
      <View style={[glass, styles.formArea]}>
        {/* Top-left: series dots */}
        <View style={styles.seriesDotsOverlay}>
          <Text style={styles.seriesOverlayLabel}>SERIE</Text>
          <Text style={styles.seriesOverlayValue}>{currentSet}/{currentEx.sets}</Text>
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

        {/* Center: rep counter */}
        <View style={styles.repCenter}>
          <RepBadges completed={Math.min(actualReps, currentEx.reps)} total={currentEx.reps} />
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
          <Text style={styles.repTargetLabel}>Objetivo: {currentEx.reps} reps</Text>
        </View>

        {/* Weight input */}
        <View style={styles.weightRow}>
          <Text style={styles.weightLabel}>Peso (kg)</Text>
          <TextInput
            style={styles.weightInput}
            placeholder="0"
            placeholderTextColor={colors.dim}
            keyboardType="decimal-pad"
            value={weight !== null ? String(weight) : ''}
            onChangeText={(val) => setWeight(val === '' ? null : parseFloat(val) || null)}
          />
        </View>

        {/* Instructions */}
        {currentEx.instructions && (
          <TouchableOpacity onPress={() => setShowInstructions((v) => !v)} activeOpacity={0.8}>
            <Text style={styles.instructionsToggle}>
              {showInstructions ? '▲' : '▼'} Instrucciones
            </Text>
            {showInstructions && (
              <Text style={styles.instructionsText}>{currentEx.instructions}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomPanel}>
        <View style={[glass, styles.controlsRow]}>
          <View style={styles.statMini}>
            <Text style={styles.statMiniLabel}>CALORÍAS</Text>
            <Text style={styles.statMiniValue}>{caloriesBurned}</Text>
          </View>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={completeSerie}
            activeOpacity={0.85}
          >
            <Text style={styles.playBtnText}>✓</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statMiniBtn}
            onPress={() => finishWorkout(loggedSets)}
          >
            <Text style={styles.statMiniLabel}>FINALIZAR</Text>
            <Text style={styles.finishSmall}>Terminar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.completeCta}>
          <Btn onPress={completeSerie}>COMPLETAR SERIE</Btn>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
  emptyText: { ...text.bodyMd, color: colors.muted, textAlign: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
    height: 56,
    backgroundColor: 'rgba(8,8,8,0.7)',
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
  exitBtnText: { ...text.headlineMd, color: colors.muted },
  topBarCenter: { flex: 1, alignItems: 'center' },
  topBarSub: { ...text.labelSm, color: colors.muted },
  topBarTitle: { ...text.bodyMd, color: colors.text, fontWeight: '600' },
  topBarTimer: { width: 56, alignItems: 'flex-end' },
  topBarTimerText: { ...text.dataMono, color: colors.muted },

  progressSection: { paddingHorizontal: spacing.marginMobile, paddingTop: spacing.md, gap: spacing.xs },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { ...text.labelSm, color: colors.neon },
  progressPct: { ...text.dataMono, color: colors.muted },
  progressTrack: {
    height: 4,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.neon,
    borderRadius: radius.full,
  },

  timerSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  mainTimer: {
    fontSize: 72,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: -2,
    lineHeight: 76,
    ...glowShadows.neon,
  },
  exerciseName: { ...text.headlineLg, color: colors.text, textAlign: 'center' },
  muscleLabel: { ...text.labelSm, color: colors.muted },
  nextChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  nextChipText: { ...text.labelSm, color: colors.muted },

  formArea: {
    flex: 1,
    marginHorizontal: spacing.marginMobile,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    justifyContent: 'center',
  },
  seriesDotsOverlay: { alignItems: 'center', gap: spacing.xs },
  seriesOverlayLabel: { ...text.labelSm, color: colors.muted },
  seriesOverlayValue: { ...text.headlineLg, color: colors.text },
  seriesDots: { flexDirection: 'row', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotDone: { backgroundColor: colors.neon },
  dotActive: { backgroundColor: colors.orange },
  dotPending: { backgroundColor: colors.dim },

  repCenter: { alignItems: 'center', gap: spacing.md },
  repRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  repMinus: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repMinusText: { fontSize: 28, color: colors.text, fontWeight: '700' },
  repPlus: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
    ...glowShadows.neon,
  },
  repPlusText: { fontSize: 28, color: '#111', fontWeight: '700' },
  repValue: {
    fontSize: 72,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: -2,
    minWidth: 96,
    textAlign: 'center',
    lineHeight: 76,
  },
  repTargetLabel: { ...text.bodyMd, color: colors.muted },

  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  weightLabel: { ...text.labelSm, color: colors.muted },
  weightInput: {
    ...text.headlineMd,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    minWidth: 80,
    textAlign: 'center',
  },
  instructionsToggle: { ...text.labelSm, color: colors.muted, textAlign: 'center', paddingVertical: spacing.xs },
  instructionsText: { ...text.bodyMd, color: colors.muted, lineHeight: 20 },

  bottomPanel: {
    paddingHorizontal: spacing.marginMobile,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  statMini: { alignItems: 'center', gap: 2, flex: 1 },
  statMiniBtn: { alignItems: 'center', gap: 2, flex: 1 },
  statMiniLabel: { ...text.labelSm, color: colors.muted },
  statMiniValue: { ...text.headlineMd, color: colors.text },
  finishSmall: { ...text.bodyMd, color: colors.orange },

  playBtn: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
    ...glowShadows.neon,
  },
  playBtnText: { fontSize: 28, color: '#111', fontWeight: '700' },
  playBtnOrange: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    ...glowShadows.orange,
  },
  skipText: { ...text.labelSm, color: '#fff' },
  completeCta: { marginTop: spacing.xs },

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
    marginHorizontal: spacing.marginMobile,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  nextCardLabel: { ...text.labelSm, color: colors.muted },
  nextCardName: { ...text.headlineLg, color: colors.text },
  nextCardSub: { ...text.bodyMd, color: colors.muted },
});
