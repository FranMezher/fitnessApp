import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';
import { Label } from '@/components/ui/Label';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWorkoutStore } from '@/stores/useWorkoutStore';

export default function WorkoutSummaryScreen() {
  const token = useAuthStore((s) => s.token);
  const fetchSessions = useWorkoutStore((s) => s.fetchSessions);
  const params = useLocalSearchParams<{
    durationMin?: string;
    caloriesBurned?: string;
    formAccuracyPct?: string;
    exercisesDone?: string;
    xpEarned?: string;
    planName?: string;
  }>();

  const durationMin     = Number(params.durationMin     ?? 38);
  const caloriesBurned  = Number(params.caloriesBurned  ?? 312);
  const formAccuracyPct = Number(params.formAccuracyPct ?? 85);
  const exercisesDone   = Number(params.exercisesDone   ?? 6);
  const xpEarned        = Number(params.xpEarned        ?? 130);
  const planName        = params.planName ?? 'Entrenamiento';

  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(true);

  // Fetch sessions once on mount, then fire insight when done
  useEffect(() => {
    if (!token) { setLoadingInsight(false); return; }
    let mounted = true;

    const fallback = setTimeout(() => {
      if (mounted) {
        setInsight('¡Excelente trabajo! Cada sesión te acerca más a tu meta.');
        setLoadingInsight(false);
      }
    }, 8000);

    fetchSessions().then(() => {
      try {
        // sessions are now in the store; read them directly to avoid object-dep loop
        const { sessions: latestSessions } = require('@/stores/useWorkoutStore').useWorkoutStore.getState();
        const monday = (() => {
          const d = new Date();
          const day = d.getDay();
          const diff = (day === 0 ? -6 : 1) - day;
          d.setDate(d.getDate() + diff);
          return d.toISOString().slice(0, 10);
        })();
        const weekSessions = (latestSessions ?? []).filter(
          (s: typeof latestSessions[0]) => s.endedAt && s.endedAt.slice(0, 10) >= monday,
        );
        const count = weekSessions.length;
        const avgFormPct = count > 0
          ? Math.round(weekSessions.reduce((s: number, e: typeof weekSessions[0]) => s + (e.formAccuracyPct ?? 0), 0) / count)
          : formAccuracyPct;
        const totalKcal = weekSessions.reduce((s: number, e: typeof weekSessions[0]) => s + (e.caloriesBurned ?? 0), 0) + caloriesBurned;

        if (!mounted) return;
        api.getWorkoutInsight(token, {
          sessionData: { durationMin, caloriesBurned, formAccuracyPct, exercisesDone },
          weekStats: { sessionsCount: count + 1, avgFormPct, totalKcal },
        })
          .then(({ insight }) => { if (mounted) setInsight(insight); })
          .catch(() => { if (mounted) setInsight('¡Excelente trabajo! Cada sesión te acerca más a tu meta.'); })
          .finally(() => { if (mounted) { setLoadingInsight(false); clearTimeout(fallback); } });
      } catch {
        if (mounted) {
          setInsight('¡Excelente trabajo! Cada sesión te acerca más a tu meta.');
          setLoadingInsight(false);
          clearTimeout(fallback);
        }
      }
    }).catch(() => {
      if (mounted) {
        setInsight('¡Excelente trabajo! Cada sesión te acerca más a tu meta.');
        setLoadingInsight(false);
        clearTimeout(fallback);
      }
    });

    return () => { mounted = false; clearTimeout(fallback); };
  }, [token]);

  const STATS = [
    { v: String(durationMin),     l: 'min',    c: colors.neon   },
    { v: String(caloriesBurned),  l: 'kcal',   c: colors.orange },
    { v: `${exercisesDone}`,      l: 'ejerc.', c: colors.teal   },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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

        {/* AI performance */}
        <GlassCard variant="neon" style={styles.aiCard}>
          <Label>Rendimiento IA</Label>
          <View style={styles.aiRow}>
            <Text style={styles.aiScore}>{formAccuracyPct}%</Text>
            <View>
              <Text style={styles.aiTitle}>Precisión de forma</Text>
              <Text style={styles.aiSub}>+7% vs sesión anterior</Text>
            </View>
          </View>
          <ProgressBar pct={formAccuracyPct} h={6} />
        </GlassCard>

        {/* Claude insight */}
        <GlassCard style={styles.insightCard}>
          <Label>Insight IA</Label>
          {loadingInsight ? (
            <ActivityIndicator color={colors.neon} style={{ marginTop: 8 }} />
          ) : (
            <Text style={styles.insightText}>{insight}</Text>
          )}
        </GlassCard>

        {/* XP earned */}
        <View style={styles.xpCard}>
          <View>
            <Text style={styles.xpTitle}>+{xpEarned} XP ganados</Text>
            <Text style={styles.xpSub}>{formAccuracyPct >= 80 ? 'Precisión +30 · ' : ''}Entreno completado</Text>
          </View>
          <Text style={styles.xpStar}>⭐</Text>
        </View>

        <Btn style={styles.primaryBtn} onPress={() => router.push('/workout/stretch')}>
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
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, gap: 12 },
  celebrate: { alignItems: 'center', paddingTop: 8, marginBottom: 6 },
  celebrateEmoji: { fontSize: 48, marginBottom: 6 },
  celebrateTitle: { fontSize: 26, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  celebrateSub: { fontSize: 14, color: colors.muted, marginTop: 2, fontFamily: 'SpaceGrotesk_400Regular' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, padding: 12, paddingHorizontal: 4, alignItems: 'center' },
  statVal: { fontSize: 26, fontWeight: '700', fontFamily: 'SpaceGrotesk_700Bold' },
  statLabel: { fontSize: 11, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  aiCard: { padding: 14, paddingHorizontal: 16, gap: 8 },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiScore: { fontSize: 44, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', lineHeight: 48 },
  aiTitle: { fontSize: 15, color: colors.text, fontFamily: 'SpaceGrotesk_400Regular' },
  aiSub: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  insightCard: { padding: 14, paddingHorizontal: 16, gap: 8 },
  insightText: { fontSize: 14, color: colors.text, fontFamily: 'SpaceGrotesk_400Regular', lineHeight: 22 },
  xpCard: { backgroundColor: 'rgba(204,255,0,0.06)', borderWidth: 1, borderColor: colors.borderAccent, borderRadius: 14, padding: 12, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpTitle: { fontSize: 14, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold' },
  xpSub: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  xpStar: { fontSize: 28 },
  primaryBtn: { marginBottom: 0 },
});
