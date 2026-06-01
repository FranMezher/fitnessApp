import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, glass, glassNeon, glowShadows } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { Btn } from '@/components/ui/Btn';
import { RingChart } from '@/components/ui/RingChart';
import { HudBackground } from '@/components/ui/HudBackground';

interface LoggedSet {
  exerciseId: string;
  exerciseName: string;
  reps: number;
  setNum: number;
  weight?: number;
  muscleGroup?: string;
}

interface ExerciseGroup {
  name: string;
  muscleGroup?: string;
  sets: LoggedSet[];
}

export default function WorkoutSummaryScreen() {
  const params = useLocalSearchParams<{
    durationMin?:    string;
    caloriesBurned?: string;
    planName?:      string;
    loggedSetsJson?: string;
  }>();

  const durationMin = Number(params.durationMin ?? 0);
  const caloriesBurned = Number(params.caloriesBurned ?? durationMin * 6);
  const planName = params.planName ?? 'Entrenamiento';

  const loggedSets: LoggedSet[] = useMemo(() => {
    try { return JSON.parse(params.loggedSetsJson ?? '[]'); } catch { return []; }
  }, [params.loggedSetsJson]);

  const totalReps = useMemo(() => loggedSets.reduce((s, l) => s + l.reps, 0), [loggedSets]);
  const totalSeries = useMemo(() => {
    const keys = new Set<string>();
    loggedSets.forEach((s) => keys.add(`${s.exerciseId}-${s.setNum}`));
    return keys.size;
  }, [loggedSets]);

  const exerciseGroups = useMemo<ExerciseGroup[]>(() => {
    const groups = new Map<string, LoggedSet[]>();
    loggedSets.forEach((s) => {
      if (!groups.has(s.exerciseName)) groups.set(s.exerciseName, []);
      groups.get(s.exerciseName)!.push(s);
    });
    return Array.from(groups.entries()).map(([name, sets]) => ({
      name,
      muscleGroup: sets[0]?.muscleGroup,
      sets: sets.sort((a, b) => a.setNum - b.setNum),
    }));
  }, [loggedSets]);

  const completionPct = Math.min(1, exerciseGroups.length > 0 ? 0.85 : 1);

  return (
    <HudBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Hero header */}
          <View style={styles.heroSection}>
            <Text style={styles.heroSub}>ENTRENAMIENTO COMPLETADO</Text>
            <Text style={styles.heroTitle}>¡SESIÓN{'\n'}COMPLETA!</Text>
          </View>

          {/* Completion ring */}
          <View style={styles.ringSection}>
            <RingChart
              size={200}
              rings={[
                { radius: 88, strokeWidth: 8, progress: completionPct, color: colors.neon, trackColor: 'rgba(255,255,255,0.05)' },
              ]}
            >
              <View style={styles.ringCenter}>
                <Text style={styles.ringPct}>{Math.round(completionPct * 100)}<Text style={styles.ringPctSign}>%</Text></Text>
                <Text style={styles.ringLabel}>COMPLETADO</Text>
              </View>
            </RingChart>
          </View>

          {/* Metrics 2×2 grid */}
          <View style={styles.metricsGrid}>
            <View style={[glass, styles.metricCard]}>
              <View style={styles.metricTop}>
                <Text style={styles.metricIcon}>⏱</Text>
                <Text style={styles.metricTag}>TIEMPO</Text>
              </View>
              <Text style={styles.metricValue}>{durationMin}</Text>
              <Text style={styles.metricUnit}>min</Text>
            </View>
            <View style={[glass, styles.metricCard, { borderLeftWidth: 2, borderLeftColor: colors.orange }]}>
              <View style={styles.metricTop}>
                <Text style={styles.metricIcon}>🔥</Text>
                <Text style={[styles.metricTag, { color: colors.orange }]}>KCAL</Text>
              </View>
              <Text style={[styles.metricValue, { color: colors.orange }]}>{Math.round(caloriesBurned)}</Text>
              <Text style={styles.metricUnit}>calorías</Text>
            </View>
            <View style={[glass, styles.metricCard]}>
              <View style={styles.metricTop}>
                <Text style={styles.metricIcon}>💪</Text>
                <Text style={styles.metricTag}>SERIES</Text>
              </View>
              <Text style={styles.metricValue}>{totalSeries}</Text>
              <Text style={styles.metricUnit}>completadas</Text>
            </View>
            <View style={[glass, styles.metricCard, { borderLeftWidth: 2, borderLeftColor: colors.teal }]}>
              <View style={styles.metricTop}>
                <Text style={styles.metricIcon}>🔄</Text>
                <Text style={[styles.metricTag, { color: colors.teal }]}>REPS</Text>
              </View>
              <Text style={[styles.metricValue, { color: colors.teal }]}>{totalReps}</Text>
              <Text style={styles.metricUnit}>repeticiones</Text>
            </View>
          </View>

          {/* Completed banner */}
          <View style={[glassNeon, styles.xpCard]}>
            <Text style={styles.xpIcon}>✅</Text>
            <View style={styles.xpInfo}>
              <Text style={styles.xpAmount}>ENTRENAMIENTO COMPLETADO</Text>
              <Text style={styles.xpSub}>{planName}</Text>
            </View>
          </View>

          {/* Exercise breakdown */}
          {exerciseGroups.length > 0 && (
            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownTitle}>Desglose de ejercicios</Text>
              {exerciseGroups.map((group) => (
                <View key={group.name} style={[glass, styles.exCard]}>
                  <View style={styles.exHeader}>
                    <View style={styles.exTitleWrap}>
                      <Text style={styles.exName}>{group.name}</Text>
                      {group.muscleGroup && (
                        <Text style={styles.exMuscle}>{group.muscleGroup} · {group.sets.length} series</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableLabel}>SERIE</Text>
                    <Text style={styles.tableLabel}>REPS</Text>
                    <Text style={[styles.tableLabel, { textAlign: 'right' }]}>PESO</Text>
                  </View>
                  {group.sets.map((s) => (
                    <View key={`${group.name}-${s.setNum}`} style={styles.tableRow}>
                      <Text style={styles.setLabel}>S{s.setNum}</Text>
                      <Text style={styles.setReps}>{s.reps}</Text>
                      <Text style={styles.setWeight}>{s.weight != null ? `${s.weight} kg` : '—'}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Btn onPress={() => router.push({ pathname: '/workout/stretch', params: { planName } } as never)}>
              Elongación guiada →
            </Btn>
            <Btn variant="ghost" onPress={() => router.replace('/(tabs)')}>
              Saltar por ahora
            </Btn>
          </View>
        </ScrollView>
      </SafeAreaView>
    </HudBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.xxl, gap: spacing.lg, paddingTop: spacing.lg },

  heroSection: { alignItems: 'center', gap: spacing.xs },
  heroSub: { ...text.labelCaps, color: colors.neon },
  heroTitle: { ...text.heroLg, color: colors.text, textAlign: 'center', lineHeight: 52, ...glowShadows.neon },

  ringSection: { alignItems: 'center' },
  ringCenter: { alignItems: 'center' },
  ringPct: { fontSize: 48, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: -1 },
  ringPctSign: { fontSize: 28, color: colors.neon },
  ringLabel: { ...text.labelSm, color: colors.muted },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metricCard: {
    width: '47%',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricIcon: { fontSize: 18 },
  metricTag: { ...text.labelSm, color: colors.muted },
  metricValue: { ...text.headlineLg, color: colors.text, fontSize: 28 },
  metricUnit: { ...text.labelSm, color: colors.muted },

  xpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  xpIcon: { fontSize: 28 },
  xpInfo: { gap: 2 },
  xpAmount: { ...text.headlineLg, color: colors.neon, fontSize: 20 },
  xpSub: { ...text.bodyMd, color: colors.muted },

  breakdownSection: { gap: spacing.sm },
  breakdownTitle: { ...text.headlineMd, color: colors.text },
  exCard: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  exTitleWrap: { flex: 1, gap: 2 },
  exName: { ...text.headlineMd, color: colors.text },
  exMuscle: { ...text.labelSm, color: colors.neon },
  tableHeader: { flexDirection: 'row', paddingBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableLabel: { flex: 1, ...text.labelSm, color: colors.dim },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  setLabel: { width: 32, ...text.labelSm, color: colors.dim },
  setReps: { flex: 1, ...text.headlineMd, color: colors.neon, fontSize: 15 },
  setWeight: { ...text.bodyMd, color: colors.muted, textAlign: 'right', minWidth: 60 },

  actions: { gap: spacing.sm },
});
