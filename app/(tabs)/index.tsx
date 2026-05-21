import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass, glassNeon, glowShadows } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { RingChart } from '@/components/ui/RingChart';
import { Btn } from '@/components/ui/Btn';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNutritionStore } from '@/stores/useNutritionStore';
import { useWorkoutStore } from '@/stores/useWorkoutStore';

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
    fetchFoodLog(today).catch(() => {});
    fetchWater(today).catch(() => {});
    fetchStreak().catch(() => {});
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
  const sessionsThisWeek = sessions.filter((s) => s.startedAt.slice(0, 10) >= weekStart).length;
  const goalDays = myPlan?.daysPerWeek ?? 3;

  const totalCal = foodLog.reduce((s, e) => s + e.calories, 0);
  const totalProt = foodLog.reduce((s, e) => s + e.proteinG, 0);
  const totalCarbs = foodLog.reduce((s, e) => s + e.carbsG, 0);
  const totalFat = foodLog.reduce((s, e) => s + e.fatG, 0);

  const goalCal = profile?.targetCalories ?? 2000;
  const calPct = Math.min(1, totalCal / goalCal);
  const exPct = Math.min(1, sessionsThisWeek / goalDays);
  const overallPct = Math.round(((calPct + exPct) / 2) * 100);

  const firstName = profile?.name?.split(' ')[0] ?? 'Colega';

  const dateLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* TopAppBar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>FITCORE</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/progress' as never)}>
          <Text style={styles.bellIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {dataError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠ {dataError}</Text>
          </View>
        )}

        {/* Greeting */}
        <View style={styles.greetSection}>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <Text style={styles.greetName}>Bienvenido, {firstName}</Text>
        </View>

        {/* Bento Grid — activity */}
        <View style={styles.bento}>
          {/* Progress card spans full width */}
          <View style={[glass, styles.bentoBig]}>
            <View style={styles.bentoBigLeft}>
              <View style={styles.dotRow}>
                <View style={styles.dot} />
                <Text style={styles.bentoSubLabel}>PROGRESO DIARIO</Text>
              </View>
              <Text style={styles.bentoPct}>{overallPct}%</Text>
              <Text style={styles.bentoDesc}>Objetivo de actividad</Text>
            </View>
            <RingChart
              size={96}
              rings={[
                { radius: 38, strokeWidth: 8, progress: calPct, color: colors.neon },
                { radius: 26, strokeWidth: 8, progress: exPct, color: colors.text },
              ]}
            />
          </View>

          <View style={styles.bentoSmallRow}>
            {/* Calories burned */}
            <View style={[glass, styles.bentoSmall]}>
              <Text style={styles.bentoIcon}>🔥</Text>
              <Text style={styles.bentoStatNum}>{totalCal.toLocaleString()}</Text>
              <Text style={styles.bentoStatUnit}>KCAL</Text>
            </View>

            {/* Hydration */}
            <View style={[glass, styles.bentoSmall]}>
              <Text style={styles.bentoIcon}>💧</Text>
              <Text style={styles.bentoStatNum}>{waterGlasses}</Text>
              <Text style={styles.bentoStatUnit}>/ {WATER_GOAL} VASOS</Text>
            </View>
          </View>
        </View>

        {/* Today's Focus */}
        <View style={styles.focusSection}>
          <Text style={styles.sectionTitle}>Entrenamiento de hoy</Text>
          <View style={[glass, styles.focusCard]}>
            <View style={styles.focusOverlay} />
            <View style={styles.focusContent}>
              <View style={[glassNeon, styles.focusBadge]}>
                <Text style={styles.focusBadgeText}>
                  {myPlan ? myPlan.difficulty?.toUpperCase() : 'TU PLAN'}
                </Text>
              </View>
              <Text style={styles.focusTitle}>{myPlan?.name ?? 'Tu entrenamiento'}</Text>
              <View style={styles.focusStats}>
                <Text style={styles.focusStat}>⏱ {myPlan?.daysPerWeek ?? '—'} días/sem</Text>
                <Text style={styles.focusStat}>💪 {myPlan?.exerciseCount ?? '—'} ejercicios</Text>
              </View>
              <Btn
                onPress={() => router.push(myPlan ? `/workout/${myPlan.id}` as never : '/workout/active')}
                style={styles.focusBtn}
              >
                INICIAR AHORA
              </Btn>
            </View>
          </View>
        </View>

        {/* Macros summary */}
        <View style={styles.vitalsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Macros de hoy</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/nutrition' as never)}>
              <Text style={styles.seeAll}>Ver detalle</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vitalsScroll}>
            {/* Calories card */}
            <View style={[glass, styles.vitalCard]}>
              <View style={styles.vitalHeader}>
                <Text style={styles.vitalLabel}>CALORÍAS</Text>
                <Text style={styles.vitalIcon}>🔥</Text>
              </View>
              <View style={styles.vitalNumRow}>
                <Text style={styles.vitalNum}>{totalCal.toLocaleString()}</Text>
                <Text style={styles.vitalUnit}>/ {goalCal.toLocaleString()}</Text>
              </View>
              <View style={styles.vitalBar}>
                <View style={[styles.vitalBarFill, { width: `${Math.round(calPct * 100)}%`, backgroundColor: colors.neon }]} />
              </View>
            </View>

            {/* Protein card */}
            <View style={[glass, styles.vitalCard, { borderLeftWidth: 2, borderLeftColor: colors.teal }]}>
              <View style={styles.vitalHeader}>
                <Text style={styles.vitalLabel}>PROTEÍNA</Text>
                <Text style={styles.vitalIcon}>💪</Text>
              </View>
              <View style={styles.vitalNumRow}>
                <Text style={[styles.vitalNum, { color: colors.teal }]}>{Math.round(totalProt)}</Text>
                <Text style={styles.vitalUnit}>g</Text>
              </View>
              <Text style={styles.vitalSub}>Meta: {profile?.targetProteinG ?? '—'}g</Text>
            </View>

            {/* Carbs card */}
            <View style={[glass, styles.vitalCard, { borderLeftWidth: 2, borderLeftColor: colors.neon }]}>
              <View style={styles.vitalHeader}>
                <Text style={styles.vitalLabel}>CARBOS</Text>
                <Text style={styles.vitalIcon}>🌾</Text>
              </View>
              <View style={styles.vitalNumRow}>
                <Text style={[styles.vitalNum, { color: colors.neon }]}>{Math.round(totalCarbs)}</Text>
                <Text style={styles.vitalUnit}>g</Text>
              </View>
              <Text style={styles.vitalSub}>Meta: {profile?.targetCarbsG ?? '—'}g</Text>
            </View>

            {/* Fat card */}
            <View style={[glass, styles.vitalCard, { borderLeftWidth: 2, borderLeftColor: colors.orange }]}>
              <View style={styles.vitalHeader}>
                <Text style={styles.vitalLabel}>GRASAS</Text>
                <Text style={styles.vitalIcon}>🥑</Text>
              </View>
              <View style={styles.vitalNumRow}>
                <Text style={[styles.vitalNum, { color: colors.orange }]}>{Math.round(totalFat)}</Text>
                <Text style={styles.vitalUnit}>g</Text>
              </View>
              <Text style={styles.vitalSub}>Meta: {profile?.targetFatG ?? '—'}g</Text>
            </View>
          </ScrollView>
        </View>

        {/* Streak row */}
        <View style={[glass, styles.streakRow]}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View style={styles.streakInfo}>
            <Text style={styles.streakNum}>{streak?.currentStreak ?? 0} días de racha</Text>
            <Text style={styles.streakSub}>Mejor racha: {streak?.longestStreak ?? 0} días</Text>
          </View>
          <View style={[glassNeon, styles.streakBadge]}>
            <Text style={styles.streakBadgeText}>ACTIVO</Text>
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
  logo: {
    ...text.heroMd,
    fontSize: 22,
    color: colors.neon,
    letterSpacing: -0.5,
  },
  bellIcon: { fontSize: 20 },

  container: {
    paddingHorizontal: spacing.marginMobile,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },

  errorBanner: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderWidth: 1,
    borderColor: `${colors.orange}44`,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  errorBannerText: { ...text.bodyMd, color: colors.orange },

  greetSection: { gap: spacing.xs },
  dateLabel: { ...text.labelSm, color: colors.muted },
  greetName: { ...text.heroMd, color: colors.text },

  // Bento
  bento: { gap: spacing.md },
  bentoBig: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  bentoBigLeft: { gap: spacing.xs, flex: 1 },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.neon },
  bentoSubLabel: { ...text.labelSm, color: colors.muted },
  bentoPct: { ...text.heroMd, color: colors.neon },
  bentoDesc: { ...text.bodyMd, color: colors.muted },
  bentoSmallRow: { flexDirection: 'row', gap: spacing.md, flex: 1 },
  bentoSmall: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  bentoIcon: { fontSize: 20 },
  bentoStatNum: { ...text.headlineLg, color: colors.text },
  bentoStatUnit: { ...text.labelSm, color: colors.muted },

  // Today's Focus
  focusSection: { gap: spacing.sm },
  sectionTitle: { ...text.headlineMd, color: colors.text },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAll: { ...text.labelSm, color: colors.neon },
  focusCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    minHeight: 180,
  },
  focusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  focusContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  focusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  focusBadgeText: { ...text.labelSm, color: colors.neon },
  focusTitle: { ...text.headlineLg, color: colors.text },
  focusStats: { flexDirection: 'row', gap: spacing.lg },
  focusStat: { ...text.bodyMd, color: colors.muted },
  focusBtn: { marginTop: spacing.xs },

  // Vitals scroll
  vitalsSection: { gap: spacing.sm },
  vitalsScroll: { gap: spacing.md, paddingRight: spacing.marginMobile },
  vitalCard: {
    width: 180,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  vitalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vitalLabel: { ...text.labelSm, color: colors.muted },
  vitalIcon: { fontSize: 16 },
  vitalNumRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  vitalNum: { ...text.heroMd, fontSize: 26, color: colors.text },
  vitalUnit: { ...text.bodyMd, color: colors.muted },
  vitalBar: {
    height: 3,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  vitalBarFill: { height: '100%', borderRadius: radius.full },
  vitalSub: { ...text.labelSm, color: colors.dim },

  // Streak row
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  streakEmoji: { fontSize: 28 },
  streakInfo: { flex: 1, gap: 2 },
  streakNum: { ...text.headlineMd, color: colors.text },
  streakSub: { ...text.bodyMd, color: colors.muted },
  streakBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  streakBadgeText: { ...text.labelSm, color: colors.neon },
});
