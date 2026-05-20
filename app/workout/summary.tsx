import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';
import { GlassCard } from '@/components/ui/GlassCard';

interface PlanDetail {
  name: string;
  sets: number;
  reps: number;
}

interface LoggedSet {
  exerciseId: string;
  reps: number;
  setNum: number;
  weight?: number;
}

export default function WorkoutSummaryScreen() {
  const params = useLocalSearchParams<{
    durationMin?:      string;
    exercisesDone?:    string;
    xpEarned?:        string;
    planName?:        string;
    planDetailsJson?: string;
    loggedSetsJson?:  string;
  }>();

  const durationMin   = Number(params.durationMin   ?? 0);
  const exercisesDone = Number(params.exercisesDone ?? 0);
  const xpEarned      = Number(params.xpEarned      ?? 100);
  const planName      = params.planName ?? 'Entrenamiento';

  const planDetails: PlanDetail[] = (() => {
    try { return JSON.parse(params.planDetailsJson ?? '[]'); } catch { return []; }
  })();

  const loggedSets: LoggedSet[] = (() => {
    try { return JSON.parse(params.loggedSetsJson ?? '[]'); } catch { return []; }
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Celebration */}
        <View style={styles.celebrate}>
          <Text style={styles.celebrateEmoji}>🎉</Text>
          <Text style={styles.celebrateTitle}>¡Entreno completado!</Text>
          <Text style={styles.celebrateSub}>{planName}</Text>
        </View>

        {/* Stats row - Two cards: Time (neon) and Exercises (teal) */}
        <View style={styles.statsRow}>
          <GlassCard variant="neon" style={styles.statCard}>
            <Text style={[styles.statVal, { color: colors.neon }]}>{durationMin}</Text>
            <Text style={styles.statLabel}>Minutos</Text>
          </GlassCard>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: 'rgba(61,255,160,0.08)',
                borderWidth: 1,
                borderColor: 'rgba(61,255,160,0.3)',
                borderRadius: 16,
              },
            ]}
          >
            <Text style={[styles.statVal, { color: colors.teal }]}>{exercisesDone}</Text>
            <Text style={styles.statLabel}>Ejercicios</Text>
          </View>
        </View>

        {/* Plan vs Realizado Comparison */}
        {planDetails.length > 0 && (
          <View style={styles.comparisonSection}>
            <Text style={styles.comparisonTitle}>Plan vs Realizado</Text>
            <View style={styles.comparisonList}>
              {planDetails.map((plan, idx) => {
                const exerciseLogs = loggedSets.filter((log) => log.exerciseId === plan.name);
                const totalRepsLogged = exerciseLogs.reduce((sum, log) => sum + log.reps, 0);
                const totalRepsPlan = plan.sets * plan.reps;

                return (
                  <View key={idx} style={styles.comparisonItem}>
                    <View style={styles.comparisonExerciseName}>
                      <Text style={styles.comparisonName}>{plan.name}</Text>
                    </View>
                    <View style={styles.comparisonValues}>
                      <Text style={styles.comparisonLabel}>Propuesto</Text>
                      <Text style={styles.comparisonValue}>{totalRepsPlan}</Text>
                    </View>
                    <View style={styles.comparisonValues}>
                      <Text style={styles.comparisonLabel}>Realizado</Text>
                      <Text style={[styles.comparisonValue, { color: totalRepsLogged >= totalRepsPlan ? colors.neon : colors.orange }]}>
                        {totalRepsLogged}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* XP earned - Prominent card with neon border */}
        <View style={styles.xpCard}>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 20, gap: 16, justifyContent: 'center' },
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
  xpCard: {
    backgroundColor: 'rgba(204,255,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.35)',
    borderRadius: 16,
    padding: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
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
  comparisonSection: {
    marginVertical: 12,
    gap: 10,
  },
  comparisonTitle: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  comparisonList: {
    gap: 8,
  },
  comparisonItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 10,
  },
  comparisonExerciseName: {
    flex: 1,
  },
  comparisonName: {
    fontSize: 13,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  comparisonValues: {
    alignItems: 'center',
    minWidth: 60,
  },
  comparisonLabel: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginTop: 2,
  },
  actions: { gap: 10, marginTop: 8 },
});
