import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';
import { GlassCard } from '@/components/ui/GlassCard';

export default function WorkoutSummaryScreen() {
  const params = useLocalSearchParams<{
    durationMin?:  string;
    exercisesDone?: string;
    xpEarned?:     string;
    planName?:     string;
  }>();

  const durationMin   = Number(params.durationMin   ?? 0);
  const exercisesDone = Number(params.exercisesDone ?? 0);
  const xpEarned      = Number(params.xpEarned      ?? 100);
  const planName      = params.planName ?? 'Entrenamiento';

  const STATS = [
    { v: String(durationMin),   l: 'min',    c: colors.neon  },
    { v: String(exercisesDone), l: 'ejerc.', c: colors.teal  },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Celebration */}
        <View style={styles.celebrate}>
          <Text style={styles.celebrateEmoji}>🎉</Text>
          <Text style={styles.celebrateTitle}>¡Entreno completado!</Text>
          <Text style={styles.celebrateSub}>{planName}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <GlassCard key={s.l} style={styles.statCard}>
              <Text style={[styles.statVal, { color: s.c }]}>{s.v}</Text>
              <Text style={styles.statLabel}>{s.l}</Text>
            </GlassCard>
          ))}
        </View>

        {/* XP earned */}
        <View style={styles.xpCard}>
          <View>
            <Text style={styles.xpTitle}>+{xpEarned} XP ganados</Text>
            <Text style={styles.xpSub}>Entreno completado</Text>
          </View>
          <Text style={styles.xpStar}>⭐</Text>
        </View>

        <View style={styles.actions}>
          <Btn onPress={() => router.push({ pathname: '/workout/stretch', params: { planName } } as never)}>
            Elongación guiada (~5 min)
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
  safe:    { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 20, gap: 14, justifyContent: 'center' },
  celebrate: { alignItems: 'center', marginBottom: 4 },
  celebrateEmoji: { fontSize: 52, marginBottom: 8 },
  celebrateTitle: { fontSize: 26, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  celebrateSub:   { fontSize: 14, color: colors.muted, marginTop: 2, fontFamily: 'SpaceGrotesk_400Regular' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, padding: 16, alignItems: 'center', gap: 2 },
  statVal:   { fontSize: 32, fontWeight: '700', fontFamily: 'SpaceGrotesk_700Bold' },
  statLabel: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  xpCard: {
    backgroundColor: 'rgba(204,255,0,0.06)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: 14,
    padding: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpTitle: { fontSize: 15, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold' },
  xpSub:   { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', marginTop: 2 },
  xpStar:  { fontSize: 30 },
  actions: { gap: 8, marginTop: 4 },
});
