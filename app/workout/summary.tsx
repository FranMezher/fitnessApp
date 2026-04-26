import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';
import { Label } from '@/components/ui/Label';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GlassCard } from '@/components/ui/GlassCard';

const STATS = [
  { v: '38', l: 'min', c: colors.neon },
  { v: '312', l: 'kcal', c: colors.orange },
  { v: '6/6', l: 'ejerc.', c: colors.teal },
];

export default function WorkoutSummaryScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Celebration */}
        <View style={styles.celebrate}>
          <Text style={styles.celebrateEmoji}>🎉</Text>
          <Text style={styles.celebrateTitle}>¡Entreno completado!</Text>
          <Text style={styles.celebrateSub}>Upper Body Power · Día 3</Text>
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

        {/* AI performance */}
        <GlassCard variant="neon" style={styles.aiCard}>
          <Label>Rendimiento IA</Label>
          <View style={styles.aiRow}>
            <Text style={styles.aiScore}>85%</Text>
            <View>
              <Text style={styles.aiTitle}>Precisión de forma</Text>
              <Text style={styles.aiSub}>+7% vs sesión anterior</Text>
            </View>
          </View>
          <ProgressBar pct={85} h={6} />
        </GlassCard>

        {/* XP earned */}
        <View style={styles.xpCard}>
          <View>
            <Text style={styles.xpTitle}>+180 XP ganados</Text>
            <Text style={styles.xpSub}>Racha +20 · Precisión +30</Text>
          </View>
          <Text style={styles.xpStar}>⭐</Text>
        </View>

        <Btn
          style={styles.primaryBtn}
          onPress={() => router.push('/workout/stretch')}
        >
          Elongación guiada (5 min)
        </Btn>
        <Btn variant="ghost" onPress={() => router.replace('/(tabs)')}>
          Saltar por ahora
        </Btn>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: 20,
    gap: 12,
  },
  celebrate: {
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 6,
  },
  celebrateEmoji: {
    fontSize: 48,
    marginBottom: 6,
  },
  celebrateTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    textAlign: 'center',
  },
  celebrateSub: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  statLabel: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  aiCard: {
    padding: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiScore: {
    fontSize: 44,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    lineHeight: 48,
  },
  aiTitle: {
    fontSize: 15,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  aiSub: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  xpCard: {
    backgroundColor: 'rgba(204,255,0,0.06)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: 14,
    padding: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  xpSub: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  xpStar: {
    fontSize: 28,
  },
  primaryBtn: {
    marginBottom: 0,
  },
});
