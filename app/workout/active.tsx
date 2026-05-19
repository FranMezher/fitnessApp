import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';
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
  reps: number;
  setNum: number;
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
  const [phase, setPhase] = useState<'exercise' | 'rest'>('exercise');
  const [restSeconds, setRestSeconds] = useState(REST_DURATION);
  const [elapsed, setElapsed] = useState(0);
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);

  const sessionIdRef = useRef<string | null>(null);
  const finishedRef = useRef(false);
  const elapsedRef = useRef(0);

  // Total workout timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => {
      elapsedRef.current = s + 1;
      return s + 1;
    }), 1000);
    return () => clearInterval(interval);
  }, []);

  // Rest countdown
  useEffect(() => {
    if (phase !== 'rest') return;
    if (restSeconds <= 0) {
      setPhase('exercise');
      return;
    }
    const t = setTimeout(() => setRestSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, restSeconds]);

  // Start backend session on mount
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
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  async function finishWorkout(sets: LoggedSet[]) {
    finishedRef.current = true;
    const durationMin = Math.max(1, Math.round(elapsedRef.current / 60));
    const caloriesBurned = Math.round(durationMin * CALORIES_PER_MIN);
    let xpEarned = 100;

    if (sessionIdRef.current && token) {
      try {
        const result = await api.finishSession(token, sessionIdRef.current, {
          caloriesBurned,
          formAccuracyPct: 100,
          sets: sets.map((s) => ({ exerciseId: s.exerciseId, reps: s.reps, setNum: s.setNum })),
        });
        xpEarned = result.xpEarned;
      } catch (err) {
        console.warn('[active] finishSession error:', err);
      }
    }

    router.push({
      pathname: '/workout/summary',
      params: {
        durationMin:   String(durationMin),
        exercisesDone: String(exercises.length),
        xpEarned:      String(xpEarned),
        planName,
      },
    });
  }

  function completeSerie() {
    if (!currentEx) return;

    const newSet: LoggedSet = { exerciseId: currentEx.id, reps: actualReps, setNum: currentSet };
    const updatedSets = [...loggedSets, newSet];
    setLoggedSets(updatedSets);

    const isLastSetOfExercise = currentSet >= currentEx.sets;
    const isLastExercise = currentExIdx >= exercises.length - 1;

    if (!isLastSetOfExercise) {
      // More sets for this exercise → rest then next set
      setCurrentSet((s) => s + 1);
      setRestSeconds(REST_DURATION);
      setPhase('rest');
    } else if (!isLastExercise) {
      // Last set of exercise, more exercises → rest then next exercise
      const nextExercise = exercises[currentExIdx + 1];
      setCurrentExIdx((i) => i + 1);
      setCurrentSet(1);
      setActualReps(nextExercise?.reps ?? 10);
      setRestSeconds(REST_DURATION);
      setPhase('rest');
    } else {
      // All done
      finishWorkout(updatedSets);
    }
  }

  function skipRest() {
    setRestSeconds(0);
    setPhase('exercise');
  }

  if (!currentEx && phase === 'exercise') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
          <Text style={{ color: colors.muted, fontSize: 15, fontFamily: 'SpaceGrotesk_400Regular', textAlign: 'center' }}>
            No hay ejercicios en este plan.
          </Text>
          <Btn onPress={() => router.back()}>Volver</Btn>
        </View>
      </SafeAreaView>
    );
  }

  // ── REST PHASE ──────────────────────────────────────────────────────────────
  if (phase === 'rest') {
    const restMm = String(Math.floor(restSeconds / 60)).padStart(2, '0');
    const restSs = String(restSeconds % 60).padStart(2, '0');
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => finishWorkout(loggedSets)}>
              <Text style={styles.exitText}>✕ Salir</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>DESCANSO</Text>
            <Text style={styles.timerSmall}>{mm}:{ss}</Text>
          </View>

          <View style={styles.restCounterWrap}>
            <Text style={styles.restCounter}>{restMm}:{restSs}</Text>
            <Text style={styles.restLabel}>Recuperate</Text>
          </View>

          {currentSet > 1 ? (
            <View style={[glass, styles.nextExCard]}>
              <Text style={styles.nextExLabel}>PRÓXIMA SERIE</Text>
              <Text style={styles.nextExName}>{currentEx.name}</Text>
              <Text style={styles.nextExSub}>
                Serie {currentSet} de {currentEx.sets} · Objetivo: {currentEx.reps} reps
              </Text>
            </View>
          ) : currentEx ? (
            <View style={[glassNeon, styles.nextExCard]}>
              <Text style={styles.nextExLabel}>SIGUIENTE EJERCICIO</Text>
              <Text style={styles.nextExName}>{currentEx.name}</Text>
              <Text style={styles.nextExSub}>{currentEx.sets} series × {currentEx.reps} reps</Text>
            </View>
          ) : null}

          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Ejercicio {currentExIdx + 1} de {exercises.length} · Serie {currentSet - 1} completada
            </Text>
          </View>

          <Btn variant="orange" onPress={skipRest}>Saltar descanso →</Btn>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── EXERCISE PHASE ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => finishWorkout(loggedSets)}>
            <Text style={styles.exitText}>✕ Salir</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Ejercicio {currentExIdx + 1} de {exercises.length}
            </Text>
            <Text style={styles.timerSmall}>{mm}:{ss}</Text>
          </View>
          <View style={{ width: 48 }} />
        </View>

        {/* Exercise name */}
        <View style={styles.exNameWrap}>
          <Text style={styles.exName}>{currentEx.name}</Text>
          {currentEx.muscleGroup && (
            <Text style={styles.exMuscle}>{currentEx.muscleGroup}</Text>
          )}
          <Text style={styles.seriesSub}>
            Serie {currentSet} de {currentEx.sets}
          </Text>
        </View>

        {/* Target reps */}
        <View style={[glass, styles.targetCard]}>
          <Text style={styles.targetLabel}>OBJETIVO</Text>
          <Text style={styles.targetValue}>{currentEx.reps} repeticiones</Text>
        </View>

        {/* Manual rep counter */}
        <View style={[glassNeon, styles.repCounterCard]}>
          <Text style={styles.repCounterLabel}>Repeticiones realizadas</Text>
          <View style={styles.repCounterRow}>
            <TouchableOpacity
              style={styles.repBtn}
              onPress={() => setActualReps((r) => Math.max(0, r - 1))}
            >
              <Text style={styles.repBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.repCounterValue}>{actualReps}</Text>
            <TouchableOpacity
              style={styles.repBtn}
              onPress={() => setActualReps((r) => r + 1)}
            >
              <Text style={styles.repBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions (collapsible) */}
        {currentEx.instructions && (
          <TouchableOpacity
            style={[glass, styles.instructionsCard]}
            onPress={() => setShowInstructions((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={styles.instructionsHeader}>
              <Text style={styles.instructionsTitle}>Instrucciones</Text>
              <Text style={styles.instructionsArrow}>{showInstructions ? '▲' : '▼'}</Text>
            </View>
            {showInstructions && (
              <Text style={styles.instructionsText}>{currentEx.instructions}</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Series progress dots */}
        <View style={styles.seriesDotsWrap}>
          {Array.from({ length: currentEx.sets }, (_, i) => (
            <View
              key={i}
              style={[
                styles.seriesDot,
                i < currentSet - 1
                  ? styles.seriesDotDone
                  : i === currentSet - 1
                  ? styles.seriesDotActive
                  : styles.seriesDotPending,
              ]}
            />
          ))}
        </View>

        <Btn onPress={completeSerie}>COMPLETAR SERIE</Btn>

        <TouchableOpacity
          style={styles.finishBtn}
          onPress={() => finishWorkout(loggedSets)}
          activeOpacity={0.7}
        >
          <Text style={styles.finishBtnText}>Finalizar entreno</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, gap: 14 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
    textAlign: 'center',
  },
  exitText: {
    fontSize: 14,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    width: 60,
  },
  timerSmall: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    textAlign: 'center',
  },
  exNameWrap: { alignItems: 'center', gap: 4 },
  exName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    textAlign: 'center',
  },
  exMuscle: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  seriesSub: {
    fontSize: 14,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginTop: 2,
  },
  targetCard: {
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  targetLabel: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  targetValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  repCounterCard: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  repCounterLabel: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  repCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  repBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(204,255,0,0.12)',
    borderWidth: 1.5,
    borderColor: colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repBtnText: {
    fontSize: 26,
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    lineHeight: 30,
  },
  repCounterValue: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    lineHeight: 68,
    letterSpacing: -2,
    minWidth: 80,
    textAlign: 'center',
  },
  instructionsCard: {
    padding: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  instructionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instructionsTitle: {
    fontSize: 13,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  instructionsArrow: {
    fontSize: 11,
    color: colors.muted,
  },
  instructionsText: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    lineHeight: 20,
  },
  seriesDotsWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  seriesDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  seriesDotDone: { backgroundColor: colors.neon },
  seriesDotActive: { backgroundColor: colors.orange },
  seriesDotPending: { backgroundColor: colors.dim },
  finishBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  finishBtnText: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  // Rest phase styles
  restCounterWrap: {
    alignItems: 'center',
    gap: 4,
    marginVertical: 20,
  },
  restCounter: {
    fontSize: 80,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    lineHeight: 84,
    letterSpacing: -3,
  },
  restLabel: {
    fontSize: 14,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  nextExCard: {
    padding: 16,
    gap: 4,
  },
  nextExLabel: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  nextExName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  nextExSub: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  progressInfo: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: colors.dim,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
});
