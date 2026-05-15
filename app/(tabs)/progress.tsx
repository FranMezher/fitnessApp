import { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, glass } from '@/constants/colors';
import { Pill } from '@/components/ui/Pill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { api, Achievement, LeagueEntry } from '@/lib/api';
import { useState } from 'react';

const XP_PER_LEVEL = 1000;

function currentWeekMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default function ProgressScreen() {
  const { token, userId } = useAuthStore();
  const { streak, fetchStreak } = useWorkoutStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [league, setLeague] = useState<LeagueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setAchievements([]);
      setLeague([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      api.getAchievements(token).then((r) => setAchievements(r.achievements)),
      api.getLeague(token).then((r) => setLeague(r.entries)),
      fetchStreak(),
    ]).finally(() => setLoading(false));
  }, [token]);

  const { totalXp, level, xpInLevel, levelPct } = useMemo(() => {
    const xp = achievements.filter((a) => a.unlocked).reduce((s, a) => s + a.xpReward, 0);
    const lvl = Math.floor(xp / XP_PER_LEVEL) + 1;
    const inLevel = xp % XP_PER_LEVEL;
    const pct = Math.round((inLevel / XP_PER_LEVEL) * 100);
    return { totalXp: xp, level: lvl, xpInLevel: inLevel, levelPct: pct };
  }, [achievements]);

  const weekLabel = useMemo(() => {
    const d = new Date(currentWeekMonday() + 'T12:00:00');
    return `Semana ${d.getDate()}/${d.getMonth() + 1}`;
  }, []);

  const myLeagueEntry = userId ? league.find((e) => e.userId === userId) : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tu progreso</Text>
          <Pill color={colors.neon}>{weekLabel}</Pill>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.neon} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Level card */}
            <View style={styles.levelCard}>
              <Text style={styles.levelIcon}>🏆</Text>
              <Text style={styles.levelTitle}>Nivel {level} · {levelTitle(level)}</Text>
              <Text style={styles.levelSub}>{xpInLevel.toLocaleString()} / {XP_PER_LEVEL.toLocaleString()} XP para nivel {level + 1}</Text>
              <ProgressBar pct={levelPct} />
            </View>

            {/* Streak */}
            {(streak?.currentStreak ?? 0) > 0 && (
              <GlassCard style={styles.streakCard}>
                <Text style={styles.streakText}>🔥 Racha actual: <Text style={{ color: colors.neon }}>{streak!.currentStreak} días</Text></Text>
                <Text style={styles.streakSub}>Mejor racha: {streak!.longestStreak} días</Text>
              </GlassCard>
            )}

            {/* Achievements */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Logros</Text>
              <Text style={styles.seeAll}>{achievements.filter((a) => a.unlocked).length}/{achievements.length}</Text>
            </View>

            {achievements.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyText}>Completá entrenamientos para desbloquear logros</Text>
              </GlassCard>
            ) : (
              achievements.slice(0, 6).map((a) => (
                <View key={a.id} style={[glass, styles.achievement, !a.unlocked && styles.achievementDim]}>
                  <View style={[styles.achieveIcon, a.unlocked
                    ? { backgroundColor: `${colors.neon}18`, borderColor: `${colors.neon}44` }
                    : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: colors.border }]}>
                    <Text style={styles.achieveEmoji}>{a.icon}</Text>
                  </View>
                  <View style={styles.achieveText}>
                    <Text style={[styles.achieveName, !a.unlocked && styles.achieveNameDim]}>{a.name}</Text>
                    <Text style={styles.achieveDesc}>{a.description}</Text>
                  </View>
                  {a.unlocked
                    ? <Text style={styles.star}>★</Text>
                    : <Text style={styles.xpBadge}>+{a.xpReward} XP</Text>
                  }
                </View>
              ))
            )}

            {/* League */}
            <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 8 }]}>Liga semanal</Text>

            {league.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyText}>Completá un entrenamiento esta semana para entrar a la liga</Text>
              </GlassCard>
            ) : (
              league
                .filter((u) => u.rank <= 10)
                .filter((u, _, arr) => arr.findIndex((x) => x.userId === u.userId) === arr.indexOf(u))
                .map((u) => {
                  const isYou = u.userId === userId;
                  return (
                    <View key={u.userId} style={[styles.leagueRow,
                      isYou
                        ? { backgroundColor: `${colors.neon}0d`, borderColor: colors.borderAccent }
                        : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: colors.border },
                    ]}>
                      <Text style={[styles.leaguePos, { color: u.rank === 1 ? colors.gold : colors.dim }]}>
                        {u.rank}
                      </Text>
                      <View style={styles.leagueAvatar}>
                        <Text style={styles.leagueAvatarText}>{isYou ? 'Tú' : `U${u.rank}`}</Text>
                      </View>
                      <Text style={[styles.leagueName, isYou && styles.leagueNameYou]}>
                        {isYou ? 'Tú' : `Jugador ${u.rank}`}
                      </Text>
                      <Text style={styles.leagueXp}>{u.xpTotal.toLocaleString()} XP</Text>
                    </View>
                  );
                })
            )}

            {/* My position if not in top 10 */}
            {myLeagueEntry && myLeagueEntry.rank > 10 && (
              <View style={[styles.leagueRow, { backgroundColor: `${colors.neon}0d`, borderColor: colors.borderAccent }]}>
                <Text style={[styles.leaguePos, { color: colors.muted }]}>{myLeagueEntry.rank}</Text>
                <View style={styles.leagueAvatar}>
                  <Text style={styles.leagueAvatarText}>Tú</Text>
                </View>
                <Text style={[styles.leagueName, styles.leagueNameYou]}>Tú</Text>
                <Text style={styles.leagueXp}>{myLeagueEntry.xpTotal.toLocaleString()} XP</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function levelTitle(level: number): string {
  const titles = ['Novato', 'Principiante', 'Atleta Emergente', 'Atleta', 'Élite', 'Leyenda'];
  return titles[Math.min(level - 1, titles.length - 1)];
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  levelCard: {
    backgroundColor: 'rgba(204,255,0,0.06)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  levelIcon: { fontSize: 36, marginBottom: 4 },
  levelTitle: { fontSize: 17, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  levelSub: { fontSize: 13, color: colors.muted, marginBottom: 8, fontFamily: 'SpaceGrotesk_400Regular' },
  streakCard: { padding: 12, paddingHorizontal: 16, gap: 2 },
  streakText: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  streakSub: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  seeAll: { fontSize: 13, color: colors.neon, fontFamily: 'SpaceGrotesk_400Regular' },
  emptyCard: { padding: 16, alignItems: 'center' },
  emptyText: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', textAlign: 'center' },
  achievement: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 11, paddingHorizontal: 14 },
  achievementDim: { opacity: 0.6 },
  achieveIcon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  achieveEmoji: { fontSize: 18 },
  achieveText: { flex: 1 },
  achieveName: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  achieveNameDim: { fontWeight: '400', color: colors.muted },
  achieveDesc: { fontSize: 12, color: colors.dim, fontFamily: 'SpaceGrotesk_400Regular' },
  star: { color: colors.neon, fontSize: 18 },
  xpBadge: { fontSize: 11, color: colors.muted, fontFamily: 'SpaceGrotesk_600SemiBold' },
  leagueRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
  },
  leaguePos: { fontSize: 16, fontWeight: '700', width: 18, fontFamily: 'SpaceGrotesk_700Bold' },
  leagueAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  leagueAvatarText: { fontSize: 10, fontWeight: '700', color: colors.muted, fontFamily: 'SpaceGrotesk_700Bold' },
  leagueName: { flex: 1, fontSize: 15, color: colors.text, fontFamily: 'SpaceGrotesk_400Regular' },
  leagueNameYou: { color: colors.neon, fontWeight: '700', fontFamily: 'SpaceGrotesk_700Bold' },
  leagueXp: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
});
