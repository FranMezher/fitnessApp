import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, glass } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';

interface LoggedSet {
  exerciseId: string;
  exerciseName: string;
  reps: number;
  setNum: number;
  weight?: number;
}

interface ExerciseGroup {
  name: string;
  sets: LoggedSet[];
}

export default function WorkoutSummaryScreen() {
  const params = useLocalSearchParams<{
    durationMin?:     string;
    caloriesBurned?:  string;
    xpEarned?:       string;
    planName?:       string;
    loggedSetsJson?: string;
  }>();

  const durationMin = Number(params.durationMin ?? 0);
  const caloriesBurned = Number(params.caloriesBurned ?? durationMin * 6);
  const xpEarned = Number(params.xpEarned ?? 100);
  const planName = params.planName ?? 'Entrenamiento';

  const loggedSets: LoggedSet[] = useMemo(() => {
    try { return JSON.parse(params.loggedSetsJson ?? '[]'); } catch { return []; }
  }, [params.loggedSetsJson]);

  const totalSets = useMemo(() => {
    const setKeys = new Set<string>();
    loggedSets.forEach((set) => setKeys.add(`${set.exerciseId}-${set.setNum}`));
    return setKeys.size;
  }, [loggedSets]);

  const totalReps = useMemo(() => {
    return loggedSets.reduce((sum, set) => sum + set.reps, 0);
  }, [loggedSets]);

  const exerciseGroups = useMemo<ExerciseGroup[]>(() => {
    const groups = new Map<string, LoggedSet[]>();
    loggedSets.forEach((set) => {
      if (!groups.has(set.exerciseName)) {
        groups.set(set.exerciseName, []);
      }
      groups.get(set.exerciseName)!.push(set);
    });
    return Array.from(groups.entries()).map(([name, sets]) => ({
      name,
      sets: sets.sort((a, b) => a.setNum - b.setNum),
    }));
  }, [loggedSets]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>04 · Resumen sesión</Text>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{durationMin} min</Text>
          </View>
        </View>

        {/* Stats row - 3 cards */}
        <View style={styles.statsRow}>
          <View style={[glass, styles.statCard]}>
            <Text style={[styles.statVal, { color: colors.neon }]}>{totalSets}</Text>
            <Text style={styles.statLabel}>Series</Text>
          </View>
          <View style={[glass, styles.statCard]}>
            <Text style={[styles.statVal, { color: colors.text }]}>{totalReps}</Text>
            <Text style={styles.statLabel}>Reps</Text>
          </View>
          <View style={[glass, styles.statCard]}>
            <Text style={[styles.statVal, { color: colors.teal }]}>{Math.round(caloriesBurned)}</Text>
            <Text style={styles.statLabel}>Calorías</Text>
          </View>
        </View>

        {/* Exercise sections */}
        {exerciseGroups.map((group) => (
          <View key={group.name} style={styles.exerciseSection}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{group.name}</Text>
              <View style={styles.pausedBadge}>
                <Text style={styles.pausedLabel}>{group.sets.length} series</Text>
              </View>
            </View>

            {group.sets.map((set) => (
              <View key={`${group.name}-${set.setNum}`} style={[glass, styles.setRow]}>
                <Text style={styles.setNum}>{set.setNum}</Text>
                {set.weight !== undefined && set.weight !== null && (
                  <Text style={styles.setWeight}>{set.weight} kg</Text>
                )}
                <Text style={styles.setReps}>{set.reps}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* XP card */}
        <View style={[styles.xpCard, { marginVertical: 12 }]}>
          <Text style={styles.xpAmount}>+{xpEarned} XP</Text>
          <Text style={styles.xpLabel}>Por completar el entreno</Text>
        </View>

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
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, gap: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLabel: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  durationBadge: {
    backgroundColor: 'rgba(204,255,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.35)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    padding: 18,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statVal: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
    lineHeight: 36,
  },
  statLabel: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseSection: {
    gap: 8,
    marginVertical: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  pausedBadge: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.35)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pausedLabel: {
    fontSize: 10,
    color: colors.orange,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  setRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  setNum: {
    width: 28,
    fontSize: 13,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    textAlign: 'center',
  },
  setWeight: {
    flex: 1,
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  setReps: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    minWidth: 40,
    textAlign: 'right',
  },
  xpCard: {
    backgroundColor: 'rgba(204,255,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.35)',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 4,
    marginVertical: 12,
    marginBottom: 16,
  },
  xpAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  xpLabel: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    textAlign: 'center',
  },
  celebrate: { alignItems: 'center', marginBottom: 8 },
  celebrateEmoji: { fontSize: 48, marginBottom: 12 },
  celebrateTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    textAlign: 'center'
  },
  celebrateSub: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
    fontFamily: 'SpaceGrotesk_400Regular',
    textAlign: 'center',
  },
  actions: { gap: 10, marginTop: 8, marginBottom: 20 },
});
