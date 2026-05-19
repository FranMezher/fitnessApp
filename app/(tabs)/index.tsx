import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glassOrange } from '@/constants/colors';
import { Ring } from '@/components/ui/Ring';
import { Pill } from '@/components/ui/Pill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Label } from '@/components/ui/Label';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNutritionStore } from '@/stores/useNutritionStore';
import { useWorkoutStore } from '@/stores/useWorkoutStore';

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WATER_GOAL = 8;

export default function DashboardScreen() {
  const { profile, fetchProfile } = useAuthStore();
  const { foodLog, waterByDate, fetchFoodLog, fetchWater } = useNutritionStore();
  const { streak, myPlan, sessions, fetchStreak, fetchMyPlan, fetchSessions } = useWorkoutStore();
  const [dataError, setDataError] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    setDataError(null);
    fetchProfile().catch((err) => setDataError(err?.message ?? 'Error al cargar el perfil'));
    fetchFoodLog(today).catch((err) => console.warn('[Dashboard] fetchFoodLog error:', err?.message));
    fetchWater(today).catch(() => {});
    fetchStreak().catch((err) => console.warn('[Dashboard] fetchStreak error:', err?.message));
    fetchSessions().catch(() => {});
    fetchMyPlan().catch(() => {});
  }, [today]);

  const weekStart = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return d.toISOString().slice(0, 10);
  }, []);

  const waterGlasses = waterByDate[today] ?? 0;
  const waterPct = Math.min(100, Math.round((waterGlasses / WATER_GOAL) * 100));
  const sessionsThisWeek = sessions.filter((s) => s.startedAt.slice(0, 10) >= weekStart).length;
  const exercisePct = Math.min(100, Math.round((sessionsThisWeek / (myPlan?.daysPerWeek ?? 3)) * 100));

  const rings = [
    { pct: 0,          color: colors.neon,   label: '—%',              sub: 'mov', name: 'Movimiento' },
    { pct: exercisePct, color: colors.orange, label: `${exercisePct}%`, sub: 'eje', name: 'Ejercicio'  },
    { pct: waterPct,   color: colors.teal,   label: `${waterPct}%`,    sub: 'H₂O', name: 'Hidrat.'   },
  ];

  const totalCal = foodLog.reduce((s, e) => s + e.calories, 0);
  const totalProt = foodLog.reduce((s, e) => s + e.proteinG, 0);
  const totalCarbs = foodLog.reduce((s, e) => s + e.carbsG, 0);
  const totalFat = foodLog.reduce((s, e) => s + e.fatG, 0);

  const goalCal = profile?.targetCalories ?? 2000;
  const calPct = Math.min(100, Math.round((totalCal / goalCal) * 100));

  const firstName = profile?.name?.split(' ')[0] ?? 'Colega';
  const avatarLetter = firstName[0]?.toUpperCase() ?? 'F';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Error banner */}
        {dataError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠ {dataError}</Text>
          </View>
        )}
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Buenos días,</Text>
            <Text style={styles.headerName}>{firstName} 👋</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
        </View>

        {/* Streak — mark last N days backwards from today within the current week */}
        <GlassCard style={styles.streakCard}>
          <Text style={styles.streakTitle}>🔥 {streak?.currentStreak ?? 0} días de racha</Text>
          <View style={styles.streakDays}>
            {WEEK_DAYS.map((d, i) => {
              const jsDay = new Date().getDay(); // 0=Sun,1=Mon...
              const todayIdx = jsDay === 0 ? 6 : jsDay - 1; // Mon=0, Sun=6
              const current = Math.min(streak?.currentStreak ?? 0, todayIdx + 1);
              const done = i <= todayIdx && i > todayIdx - current;
              return (
                <View key={d} style={[styles.streakDay, done ? styles.streakDayDone : styles.streakDayPending]}>
                  <Text style={[styles.streakDayText, done ? styles.streakDayTextDone : styles.streakDayTextPending]}>
                    {done ? '✓' : d}
                  </Text>
                </View>
              );
            })}
          </View>
        </GlassCard>

        {/* Activity rings */}
        <View style={styles.rings}>
          {rings.map((r) => (
            <GlassCard key={r.name} style={styles.ringCard}>
              <Ring pct={r.pct} size={64} color={r.color} label={r.label} sub={r.sub} />
              <Text style={styles.ringName}>{r.name}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Macros */}
        <GlassCard style={styles.macrosCard}>
          <View style={styles.macrosHeader}>
            <Label>Calorías de hoy</Label>
            <Text style={styles.macrosKcal}>{totalCal.toLocaleString()} / {goalCal.toLocaleString()}</Text>
          </View>
          <ProgressBar pct={calPct} />
          <View style={styles.macroItems}>
            {[
              { l: 'Proteína', v: `${Math.round(totalProt)}g`, c: colors.neon },
              { l: 'Carbos',   v: `${Math.round(totalCarbs)}g`, c: colors.teal },
              { l: 'Grasas',   v: `${Math.round(totalFat)}g`, c: colors.orange },
            ].map((m) => (
              <View key={m.l} style={styles.macroItem}>
                <Text style={[styles.macroVal, { color: m.c }]}>{m.v}</Text>
                <Text style={styles.macroLabel}>{m.l}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Workout CTA */}
        <TouchableOpacity
          style={[glassOrange, styles.workoutCta]}
          activeOpacity={0.8}
          onPress={() => router.push(myPlan ? `/workout/${myPlan.id}` as never : '/workout/active')}
        >
          <View style={styles.workoutInfo}>
            <Pill color={colors.orange}>HOY · ENTRENA</Pill>
            <Text style={styles.workoutTitle}>{myPlan?.name ?? 'Tu entrenamiento'}</Text>
            <Text style={styles.workoutSub}>
              {myPlan ? `${myPlan.exerciseCount ?? '—'} ejercicios · ${myPlan.daysPerWeek}x semana` : 'Cargando plan...'}
            </Text>
          </View>
          <View style={styles.playBtn}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </TouchableOpacity>
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
  errorBanner: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderWidth: 1,
    borderColor: `${colors.orange}44`,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  errorBannerText: {
    fontSize: 13,
    color: colors.orange,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  headerName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
  },
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: colors.orange,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  streakCard: {
    padding: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  streakTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neon,
    marginBottom: 8,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  streakDays: {
    flexDirection: 'row',
    gap: 6,
  },
  streakDay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  streakDayDone: {
    backgroundColor: colors.neon,
    borderColor: colors.neon,
  },
  streakDayPending: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  streakDayText: {
    fontSize: 11,
    fontWeight: '700',
  },
  streakDayTextDone: {
    color: '#111',
  },
  streakDayTextPending: {
    color: colors.dim,
  },
  rings: {
    flexDirection: 'row',
    gap: 10,
  },
  ringCard: {
    flex: 1,
    padding: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  ringName: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  macrosCard: {
    padding: 12,
    paddingHorizontal: 16,
  },
  macrosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  macrosKcal: {
    fontSize: 13,
    color: colors.neon,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  macroItems: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  macroItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  macroVal: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  macroLabel: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  workoutCta: {
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workoutInfo: {
    flex: 1,
    gap: 5,
  },
  workoutTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginTop: 2,
  },
  workoutSub: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 18,
    color: '#fff',
  },
});
