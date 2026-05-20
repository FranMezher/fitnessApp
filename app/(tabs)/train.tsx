import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass, glassOrange } from '@/constants/colors';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Btn } from '@/components/ui/Btn';

const PLAN_ICONS: Record<string, string> = {
  push: '💪',
  pull: '🔙',
  legs: '🦵',
  fullbody: '⚡',
};

const PLAN_ICON_COLORS: Record<string, string> = {
  push: colors.neon,
  pull: colors.teal,
  legs: colors.purple,
  fullbody: colors.orange,
};

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function TrainScreen() {
  const { plans, loading, fetchPlans, myPlan, streak, sessions, fetchMyPlan, fetchStreak, fetchSessions } = useWorkoutStore();
  const { profile } = useAuthStore();
  const [fetchError, setFetchError] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    setFetchError(null);
    fetchPlans().catch((err) => setFetchError(err?.message ?? 'No se pudieron cargar los planes'));
    fetchMyPlan().catch(() => {});
    fetchStreak().catch(() => {});
    fetchSessions().catch(() => {});
  }, []);

  const formattedDate = useMemo(() => {
    const date = new Date();
    const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    return `${dayName} - ${date.getDate()} ${monthName}`;
  }, []);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, boolean>();
    sessions?.forEach((s) => {
      const date = s.startedAt.slice(0, 10);
      map.set(date, true);
    });
    return map;
  }, [sessions]);

  const weekStart = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return d;
  }, []);

  const weekDays = useMemo(() => {
    return WEEK_DAYS.map((label, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const isToday = dateStr === today;
      const isDone = sessionsByDate.has(dateStr) && !isToday;
      return { label, dateStr, isToday, isDone };
    });
  }, [weekStart, sessionsByDate, today]);

  const todaysPlan = myPlan;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with date + XP badge */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateLabel}>{formattedDate}</Text>
          </View>
          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>🎖 {streak?.currentStreak ?? 0}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Entrena</Text>

        {/* Streak section */}
        <View style={[glass, styles.streakCard]}>
          <Text style={styles.streakLabel}>ESTA SEMANA</Text>
          <View style={styles.weekDays}>
            {weekDays.map((day) => (
              <View
                key={day.label}
                style={[
                  styles.dayCircle,
                  day.isDone
                    ? styles.dayDone
                    : day.isToday
                    ? styles.dayToday
                    : styles.dayEmpty,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    day.isDone || day.isToday ? styles.dayTextDark : styles.dayTextLight,
                  ]}
                >
                  {day.isDone ? '✓' : day.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* HOY section */}
        {todaysPlan && (
          <TouchableOpacity
            style={[glassOrange, styles.hoyCard]}
            activeOpacity={0.8}
            onPress={() => router.push(`/workout/${todaysPlan.id}` as never)}
          >
            <View style={styles.hoyContent}>
              <Text style={styles.hoyLabel}>HOY · {todaysPlan.name.toUpperCase()}</Text>
              <Text style={styles.hoyTitle}>{todaysPlan.name}</Text>
              <Text style={styles.hoySub}>{todaysPlan.exerciseCount ?? '—'} ejercicios · {todaysPlan.daysPerWeek}x semana</Text>
            </View>
            <View style={styles.playButton}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Program list */}
        {!loading && (
          <View>
            <Text style={styles.programLabel}>TU PROGRAMA</Text>
            {plans.map((plan) => {
              const icon = PLAN_ICONS[plan.name.toLowerCase()] ?? '⚡';
              const iconColor = PLAN_ICON_COLORS[plan.name.toLowerCase()] ?? colors.orange;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[glass, styles.programCard]}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/workout/${plan.id}` as never)}
                >
                  <View style={[styles.programIcon, { backgroundColor: iconColor + '20', borderColor: iconColor }]}>
                    <Text style={styles.programIconText}>{icon}</Text>
                  </View>
                  <View style={styles.programInfo}>
                    <Text style={styles.programTitle}>{plan.name}</Text>
                    <Text style={styles.programSub}>{plan.difficulty}</Text>
                  </View>
                  <Text style={styles.programExerciseCount}>{plan.exerciseCount ?? '—'} ejerc.</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {loading && <ActivityIndicator color={colors.neon} style={{ marginTop: 20 }} />}

        {fetchError && (
          <View style={[glass, { padding: 20, alignItems: 'center', gap: 12, marginTop: 12 }]}>
            <Text style={{ color: colors.orange, fontFamily: 'SpaceGrotesk_400Regular', textAlign: 'center' }}>
              {fetchError}
            </Text>
            <Btn onPress={() => fetchPlans().catch((e) => setFetchError(e?.message ?? 'Error'))}>Reintentar</Btn>
          </View>
        )}

        {!loading && !fetchError && plans.length === 0 && (
          <View style={[glass, { padding: 20, alignItems: 'center', gap: 12, marginTop: 12 }]}>
            <Text style={{ color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' }}>
              No hay planes disponibles
            </Text>
            <Btn onPress={() => fetchPlans().catch((e) => setFetchError(e?.message ?? 'Error'))}>Recargar planes</Btn>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xpBadge: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderColor: 'rgba(255,107,53,0.35)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  xpBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.orange,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginBottom: 12,
  },
  streakCard: {
    padding: 14,
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  weekDays: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dayDone: {
    backgroundColor: colors.neon,
    borderColor: colors.neon,
  },
  dayToday: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  dayEmpty: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  dayTextDark: {
    color: '#111',
  },
  dayTextLight: {
    color: colors.dim,
  },
  hoyCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  hoyContent: {
    flex: 1,
    gap: 4,
  },
  hoyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.orange,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hoyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  hoySub: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  programLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
  programCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  programIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  programIconText: {
    fontSize: 18,
  },
  programInfo: {
    flex: 1,
    gap: 2,
  },
  programTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  programSub: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    textTransform: 'capitalize',
  },
  programExerciseCount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
});
