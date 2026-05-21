import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { HudBackground } from '@/components/ui/HudBackground';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { api, Achievement, LeagueEntry } from '@/lib/api';

const XP_PER_LEVEL = 1000;

const LEVEL_TITLES = ['Novato', 'Principiante', 'Atleta Emergente', 'Atleta', 'Élite', 'Leyenda'];

function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

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
    if (!token) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      api.getAchievements(token).then((r) => setAchievements(r.achievements)),
      api.getLeague(token).then((r) => setLeague(r.entries)),
      fetchStreak(),
    ]).finally(() => setLoading(false));
  }, [token]);

  const { level, xpInLevel, levelPct, totalXp } = useMemo(() => {
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
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <HudBackground style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.headerBrand}>FITCORE</Text>
          <View style={styles.topBarRight}>
            <Text style={styles.weekLabel}>{weekLabel}</Text>
            <Ionicons name="notifications-outline" size={22} color={colors.neon} />
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.neon} size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            {/* Page title */}
            <Text style={styles.pageTitle}>Tu Progreso</Text>

            {/* Level hero card */}
            <View style={styles.levelCard}>
              <View style={styles.levelTop}>
                <View>
                  <Text style={styles.levelNum}>NVL {level}</Text>
                  <Text style={styles.levelTitle}>{levelTitle(level).toUpperCase()}</Text>
                </View>
                <View style={styles.xpBadge}>
                  <Text style={styles.xpBadgeText}>{totalXp.toLocaleString()} XP</Text>
                </View>
              </View>

              <View style={styles.levelProgressWrap}>
                <View style={styles.levelProgressTrack}>
                  <View style={[styles.levelProgressFill, { width: `${levelPct}%` }]} />
                </View>
                <View style={styles.levelProgressLabels}>
                  <Text style={styles.levelProgressSub}>{xpInLevel.toLocaleString()} / {XP_PER_LEVEL.toLocaleString()} XP</Text>
                  <Text style={styles.levelProgressSub}>Nivel {level + 1}</Text>
                </View>
              </View>
            </View>

            {/* Streak card */}
            {(streak?.currentStreak ?? 0) > 0 && (
              <View style={styles.streakCard}>
                <View style={styles.streakLeft}>
                  <Ionicons name="flame" size={32} color={colors.orange} />
                  <View>
                    <Text style={styles.streakNum}>{streak!.currentStreak}</Text>
                    <Text style={styles.streakLabel}>días de racha</Text>
                  </View>
                </View>
                <View style={styles.streakRight}>
                  <Text style={styles.streakBestLabel}>MEJOR RACHA</Text>
                  <Text style={styles.streakBestNum}>{streak!.longestStreak} días</Text>
                </View>
              </View>
            )}

            {/* Achievements */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>LOGROS</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{unlockedCount}/{achievements.length}</Text>
              </View>
            </View>

            {achievements.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="trophy-outline" size={36} color={colors.dim} />
                <Text style={styles.emptyText}>Completá entrenamientos para desbloquear logros</Text>
              </View>
            ) : (
              achievements.slice(0, 6).map((a) => (
                <View
                  key={a.id}
                  style={[
                    styles.achievementRow,
                    a.unlocked ? styles.achievementUnlocked : styles.achievementLocked,
                  ]}
                >
                  <View style={[styles.achieveIconWrap, a.unlocked && styles.achieveIconWrapActive]}>
                    <Text style={styles.achieveEmoji}>{a.icon}</Text>
                  </View>
                  <View style={styles.achieveInfo}>
                    <Text style={[styles.achieveName, !a.unlocked && styles.achieveNameDim]}>
                      {a.name}
                    </Text>
                    <Text style={styles.achieveDesc}>{a.description}</Text>
                  </View>
                  {a.unlocked ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.neon} />
                  ) : (
                    <View style={styles.xpPill}>
                      <Text style={styles.xpPillText}>+{a.xpReward}</Text>
                    </View>
                  )}
                </View>
              ))
            )}

            {/* League */}
            <View style={[styles.sectionHeader, { marginTop: spacing.sm }]}>
              <Text style={styles.sectionTitle}>LIGA SEMANAL</Text>
              <Ionicons name="people-outline" size={16} color={colors.muted} />
            </View>

            {league.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="podium-outline" size={36} color={colors.dim} />
                <Text style={styles.emptyText}>
                  Completá un entrenamiento esta semana para entrar a la liga
                </Text>
              </View>
            ) : (
              league
                .filter((u) => u.rank <= 10)
                .filter((u, _, arr) => arr.findIndex((x) => x.userId === u.userId) === arr.indexOf(u))
                .map((u) => {
                  const isYou = u.userId === userId;
                  return (
                    <View
                      key={u.userId}
                      style={[styles.leagueRow, isYou && styles.leagueRowYou]}
                    >
                      <Text style={[
                        styles.leaguePos,
                        u.rank === 1 && { color: colors.gold },
                        u.rank === 2 && { color: '#C0C0C0' },
                        u.rank === 3 && { color: '#CD7F32' },
                      ]}>
                        {u.rank}
                      </Text>
                      <View style={[styles.leagueAvatar, isYou && styles.leagueAvatarYou]}>
                        <Text style={[styles.leagueAvatarText, isYou && { color: colors.bg }]}>
                          {isYou ? 'TÚ' : `J${u.rank}`}
                        </Text>
                      </View>
                      <Text style={[styles.leagueName, isYou && { color: colors.neon }]}>
                        {isYou ? 'Tú' : `Jugador ${u.rank}`}
                      </Text>
                      <View style={styles.leagueXpWrap}>
                        <Text style={[styles.leagueXp, isYou && { color: colors.neon }]}>
                          {u.xpTotal.toLocaleString()}
                        </Text>
                        <Text style={styles.leagueXpLabel}>XP</Text>
                      </View>
                    </View>
                  );
                })
            )}

            {/* My position if outside top 10 */}
            {myLeagueEntry && myLeagueEntry.rank > 10 && (
              <View style={[styles.leagueRow, styles.leagueRowYou]}>
                <Text style={styles.leaguePos}>{myLeagueEntry.rank}</Text>
                <View style={[styles.leagueAvatar, styles.leagueAvatarYou]}>
                  <Text style={[styles.leagueAvatarText, { color: colors.bg }]}>TÚ</Text>
                </View>
                <Text style={[styles.leagueName, { color: colors.neon }]}>Tú</Text>
                <View style={styles.leagueXpWrap}>
                  <Text style={[styles.leagueXp, { color: colors.neon }]}>
                    {myLeagueEntry.xpTotal.toLocaleString()}
                  </Text>
                  <Text style={styles.leagueXpLabel}>XP</Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </HudBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(8,8,8,0.85)',
  },
  headerBrand: { ...text.heroMd, color: colors.neon, fontSize: 20, letterSpacing: -0.5 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  weekLabel: { ...text.labelSm, color: colors.muted },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  pageTitle: { ...text.headlineLg, color: colors.text, marginBottom: spacing.xs },

  // Level card
  levelCard: {
    backgroundColor: 'rgba(204,255,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.3)',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  levelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  levelNum: { ...text.heroMd, color: colors.neon, fontSize: 40, lineHeight: 44 },
  levelTitle: { ...text.labelCaps, color: colors.muted },
  xpBadge: {
    backgroundColor: 'rgba(204,255,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.3)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  xpBadgeText: { ...text.dataMono, color: colors.neon, fontSize: 12 },
  levelProgressWrap: { gap: 6 },
  levelProgressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: colors.neon,
    borderRadius: 2,
    shadowColor: colors.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  levelProgressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  levelProgressSub: { ...text.labelSm, color: colors.muted },

  // Streak
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,107,53,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.25)',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  streakNum: { ...text.heroMd, color: colors.orange, fontSize: 36, lineHeight: 40 },
  streakLabel: { ...text.bodyMd, color: colors.muted },
  streakRight: { alignItems: 'flex-end' },
  streakBestLabel: { ...text.labelSm, color: colors.muted },
  streakBestNum: { ...text.headlineMd, color: colors.text },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionTitle: { ...text.labelCaps, color: colors.muted },
  sectionBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  sectionBadgeText: { ...text.labelSm, color: colors.text },

  // Empty
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: { ...text.bodyMd, color: colors.muted, textAlign: 'center' },

  // Achievement rows
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  achievementUnlocked: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: colors.border,
  },
  achievementLocked: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.05)',
    opacity: 0.6,
  },
  achieveIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achieveIconWrapActive: {
    backgroundColor: 'rgba(204,255,0,0.1)',
    borderColor: 'rgba(204,255,0,0.3)',
  },
  achieveEmoji: { fontSize: 18 },
  achieveInfo: { flex: 1, gap: 2 },
  achieveName: { ...text.headlineMd, color: colors.text, fontSize: 15 },
  achieveNameDim: { color: colors.muted },
  achieveDesc: { ...text.bodyMd, color: colors.dim },
  xpPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  xpPillText: { ...text.labelSm, color: colors.muted },

  // League rows
  leagueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.xs,
  },
  leagueRowYou: {
    backgroundColor: 'rgba(204,255,0,0.06)',
    borderColor: 'rgba(204,255,0,0.3)',
  },
  leaguePos: { ...text.dataMono, color: colors.dim, width: 22, fontSize: 16 },
  leagueAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueAvatarYou: { backgroundColor: colors.neon },
  leagueAvatarText: { ...text.labelSm, color: colors.muted, fontSize: 9 },
  leagueName: { flex: 1, ...text.bodyLg, color: colors.text },
  leagueXpWrap: { alignItems: 'flex-end' },
  leagueXp: { ...text.dataMono, color: colors.muted, fontSize: 15 },
  leagueXpLabel: { ...text.labelSm, color: colors.dim, fontSize: 9 },
});
