import { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polygon, Line, Text as SvgText } from 'react-native-svg';
import { router } from 'expo-router';
import { colors, glass, glassNeon } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWorkoutStore } from '@/stores/useWorkoutStore';

// ─── Radar chart (4-axis diamond) ────────────────────────────────────────────

interface RadarChartProps {
  values: number[]; // 0–100 for [top, right, bottom, left]
  size?: number;
}

function RadarChart({ values, size = 200 }: RadarChartProps) {
  const c = size / 2;
  const maxR = c - 24;
  const [vt, vr, vb, vl] = values.map((v) => Math.min(100, Math.max(0, v)) / 100);

  // 4 axes: top, right, bottom, left
  const gridPts = (r: number) =>
    `${c},${c - r} ${c + r},${c} ${c},${c + r} ${c - r},${c}`;

  const dataPts = [
    `${c},${c - vt * maxR}`,
    `${c + vr * maxR},${c}`,
    `${c},${c + vb * maxR}`,
    `${c - vl * maxR},${c}`,
  ].join(' ');

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {[1, 0.67, 0.33].map((scale) => (
          <Polygon
            key={scale}
            points={gridPts(maxR * scale)}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        ))}
        {/* Axis lines */}
        <Line x1={c} y1={c - maxR} x2={c} y2={c + maxR} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        <Line x1={c - maxR} y1={c} x2={c + maxR} y2={c} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        {/* Data polygon */}
        <Polygon
          points={dataPts}
          fill="rgba(204,255,0,0.15)"
          stroke={colors.neon}
          strokeWidth={2}
        />
        {/* Axis labels */}
        <SvgText x={c} y={c - maxR - 8} textAnchor="middle" fontSize={8} fill={colors.neon} fontFamily="SpaceGrotesk_600SemiBold">
          FUERZA
        </SvgText>
        <SvgText x={c + maxR + 6} y={c + 3} textAnchor="start" fontSize={8} fill={colors.muted} fontFamily="SpaceGrotesk_600SemiBold">
          RESIST
        </SvgText>
        <SvgText x={c} y={c + maxR + 14} textAnchor="middle" fontSize={8} fill={colors.muted} fontFamily="SpaceGrotesk_600SemiBold">
          RECUP
        </SvgText>
        <SvgText x={c - maxR - 6} y={c + 3} textAnchor="end" fontSize={8} fill={colors.muted} fontFamily="SpaceGrotesk_600SemiBold">
          POTENCIA
        </SvgText>
      </Svg>
    </View>
  );
}

// ─── Static PRs (placeholder since no PR endpoint exists yet) ────────────────

const PLACEHOLDER_PRS = [
  { name: 'Sentadilla', value: '—', pct: 0.78 },
  { name: 'Press Banca', value: '—', pct: 0.72 },
  { name: 'Peso Muerto', value: '—', pct: 0.85 },
  { name: 'Press Militar', value: '—', pct: 0.60 },
];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileStatsScreen() {
  const { profile, fetchProfile } = useAuthStore();
  const { sessions, streak, fetchSessions, fetchStreak } = useWorkoutStore();

  useEffect(() => {
    if (!profile) fetchProfile();
    fetchSessions();
    fetchStreak();
  }, []);

  const totalSessions = sessions.length;
  const totalCalories = useMemo(() =>
    sessions.reduce((s, sess) => s + (sess.caloriesBurned ?? 0), 0),
    [sessions]
  );
  const consistencyDays = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? 0;

  // Sessions this year
  const thisYear = new Date().getFullYear().toString();
  const sessionsThisYear = sessions.filter((s) => s.startedAt.startsWith(thisYear)).length;

  const firstName = profile?.name?.split(' ')[0] ?? 'Atleta';
  const fullName = profile?.name ?? 'Atleta FITCORE';

  // Radar values (derived from streak + sessions as rough fitness metrics)
  const radarValues = useMemo(() => [
    Math.min(100, consistencyDays * 4),           // Fuerza (proxy: streak)
    Math.min(100, totalSessions * 2),             // Resistencia (sessions)
    Math.min(100, longestStreak * 3),             // Recuperación (best streak)
    Math.min(100, (totalCalories / 1000) * 1.5),  // Potencia (total cals)
  ], [consistencyDays, totalSessions, longestStreak, totalCalories]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* TopAppBar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>FITCORE</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.heroName}>{fullName}</Text>
          <Text style={styles.heroSub}>
            Racha {consistencyDays} días · {profile?.weightKg ? `${profile.weightKg} kg` : 'FitCore Atleta'}
          </Text>
        </View>

        {/* Core stats 2×2 */}
        <View style={styles.statsGrid}>
          <View style={[glass, styles.statCard]}>
            <Text style={styles.statLabel}>SESIONES</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{sessionsThisYear}</Text>
              <Text style={styles.statUnit}>ESTE AÑO</Text>
            </View>
          </View>
          <View style={[glass, styles.statCard]}>
            <Text style={styles.statLabel}>CALORÍAS</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>
                {totalCalories >= 1000 ? `${(totalCalories / 1000).toFixed(1)}` : totalCalories}
              </Text>
              <Text style={styles.statUnit}>{totalCalories >= 1000 ? 'K' : 'KCAL'}</Text>
            </View>
          </View>
          <View style={[glass, styles.statCard]}>
            <Text style={styles.statLabel}>TOTAL SESIONES</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{totalSessions}</Text>
              <Text style={styles.statUnit}>TOTAL</Text>
            </View>
          </View>
          <View style={[glassNeon, styles.statCard]}>
            <Text style={[styles.statLabel, { color: colors.neon }]}>CONSISTENCIA</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{consistencyDays}</Text>
              <Text style={styles.statUnit}>DÍAS</Text>
            </View>
          </View>
        </View>

        {/* Personal Records */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🏅</Text>
            <Text style={styles.sectionTitle}>Récords Personales</Text>
          </View>
          <View style={styles.prList}>
            {PLACEHOLDER_PRS.map((pr) => (
              <View key={pr.name} style={[glass, styles.prCard]}>
                <View style={styles.prTopRow}>
                  <Text style={styles.prName}>{pr.name}</Text>
                  <Text style={styles.prValue}>{pr.value}</Text>
                </View>
                <View style={styles.prBarTrack}>
                  <View style={[styles.prBarFill, { width: `${Math.round(pr.pct * 100)}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Advanced Metrics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📊</Text>
            <Text style={styles.sectionTitle}>Métricas Avanzadas</Text>
          </View>
          <View style={[glass, styles.radarCard]}>
            <View style={styles.radarGlow} />
            <RadarChart values={radarValues} size={220} />
            <View style={styles.radarStats}>
              <View style={styles.radarStat}>
                <Text style={styles.radarStatVal}>{Math.min(100, totalSessions * 2)}/100</Text>
                <Text style={styles.radarStatLabel}>EFICIENCIA</Text>
              </View>
              <View style={styles.radarStat}>
                <Text style={styles.radarStatVal}>{consistencyDays} días</Text>
                <Text style={styles.radarStatLabel}>RACHA ACTIVA</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
    height: 56,
    backgroundColor: 'rgba(8,8,8,0.7)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 22, color: colors.muted },
  logo: { ...text.heroMd, fontSize: 20, color: colors.neon, letterSpacing: -0.5 },

  container: { paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.xxl, gap: spacing.xl, paddingTop: spacing.lg },

  // Hero
  heroSection: { alignItems: 'center', gap: spacing.sm },
  avatarWrap: { position: 'relative', marginBottom: spacing.xs },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(204,255,0,0.12)',
    borderWidth: 2,
    borderColor: colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { ...text.heroMd, color: colors.neon, fontSize: 36 },
  eliteBadge: {
    position: 'absolute',
    top: -4,
    right: -16,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  eliteBadgeText: { ...text.labelSm, color: colors.neon },
  heroName: { ...text.heroMd, color: colors.text, textAlign: 'center' },
  heroSub: { ...text.bodyMd, color: colors.muted, textAlign: 'center' },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: {
    width: '47%',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  statLabel: { ...text.labelSm, color: colors.muted },
  statValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  statValue: { ...text.heroMd, color: colors.text, lineHeight: 38 },
  statUnit: { ...text.dataMono, color: colors.neon, fontSize: 12, paddingBottom: 4 },

  // Sections
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { ...text.headlineMd, color: colors.text },

  // PRs
  prList: { gap: spacing.sm },
  prCard: { padding: spacing.md, borderRadius: radius.lg, gap: spacing.sm },
  prTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prName: { ...text.bodyMd, color: colors.text, fontSize: 15 },
  prValue: { ...text.dataMono, color: colors.neon },
  prBarTrack: { height: 3, backgroundColor: colors.surfaceContainerHigh, borderRadius: radius.full, overflow: 'hidden' },
  prBarFill: { height: '100%', backgroundColor: colors.neon, borderRadius: radius.full },

  // Radar
  radarCard: { padding: spacing.lg, borderRadius: radius.lg, alignItems: 'center', gap: spacing.lg, overflow: 'hidden' },
  radarGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(204,255,0,0.02)',
  },
  radarStats: { flexDirection: 'row', gap: spacing.xl, justifyContent: 'center' },
  radarStat: { alignItems: 'center', gap: 4 },
  radarStatVal: { ...text.dataMono, color: colors.text },
  radarStatLabel: { ...text.labelSm, color: colors.muted },

  // Badges
  badgesRow: { gap: spacing.md, paddingRight: spacing.marginMobile },
  badge: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badgeUnlocked: { backgroundColor: 'rgba(204,255,0,0.08)', borderColor: 'rgba(204,255,0,0.35)' },
  badgeLocked: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: colors.border },
  badgeIcon: { fontSize: 26 },
  badgeIconLocked: { opacity: 0.3 },
});
