import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, glassNeon, glowShadows } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { HudBackground } from '@/components/ui/HudBackground';
import { useWorkoutStore } from '@/stores/useWorkoutStore';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner:     colors.teal,
  intermediate: colors.neon,
  advanced:     colors.orange,
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner:     'Principiante',
  intermediate: 'Intermedio',
  advanced:     'Avanzado',
};

export default function TrainScreen() {
  const { plans, loading, fetchPlans, myPlan, streak, fetchMyPlan, fetchStreak, fetchSessions } = useWorkoutStore();
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setFetchError(null);
    fetchPlans().catch((err) => setFetchError(err?.message ?? 'No se pudieron cargar los planes'));
    fetchMyPlan().catch(() => {});
    fetchStreak().catch(() => {});
    fetchSessions().catch(() => {});
  }, []);

  return (
    <HudBackground style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* TopAppBar */}
        <View style={styles.topBar}>
          <Text style={styles.logo}>FITCORE</Text>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={14} color={colors.neon} />
            <Text style={styles.streakBadgeText}>{streak?.currentStreak ?? 0}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Hero — Next Session */}
          <View style={styles.heroSection}>
            <View style={styles.heroHeader}>
              <Text style={styles.sectionTitle}>Próxima sesión</Text>
              <Text style={styles.todayLabel}>HOY</Text>
            </View>

            <TouchableOpacity
              style={[glass, styles.heroCard]}
              activeOpacity={0.85}
              onPress={() => router.push(myPlan ? `/workout/${myPlan.id}` as never : '/workout/active')}
            >
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <View style={[glassNeon, styles.heroBadge]}>
                  <Ionicons name="flash" size={12} color={colors.neon} />
                  <Text style={styles.heroBadgeText}>
                    {myPlan?.difficulty ? DIFFICULTY_LABELS[myPlan.difficulty] ?? myPlan.difficulty.toUpperCase() : 'TU PLAN'}
                  </Text>
                </View>
                <Text style={styles.heroTitle}>{myPlan?.name ?? 'Tu entrenamiento'}</Text>
                <View style={styles.heroStats}>
                  <View style={styles.heroStatItem}>
                    <Ionicons name="time-outline" size={14} color={colors.muted} />
                    <Text style={styles.heroStat}>{myPlan?.daysPerWeek ?? '—'} días/sem</Text>
                  </View>
                  <View style={styles.heroStatItem}>
                    <Ionicons name="barbell-outline" size={14} color={colors.muted} />
                    <Text style={styles.heroStat}>{myPlan?.exerciseCount ?? '—'} ejercicios</Text>
                  </View>
                </View>
                <View style={styles.heroBtn}>
                  <Text style={styles.heroBtnText}>INICIAR SESIÓN</Text>
                  <Ionicons name="play" size={16} color={colors.bg} />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Programs list */}
          <View style={styles.programsSection}>
            <View style={styles.programsHeader}>
              <Text style={styles.sectionTitle}>Programas</Text>
            </View>

            {loading && <ActivityIndicator color={colors.neon} style={{ marginTop: 20 }} />}

            {fetchError && (
              <View style={[glass, styles.errorCard]}>
                <Ionicons name="alert-circle-outline" size={32} color={colors.orange} />
                <Text style={styles.errorText}>{fetchError}</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => fetchPlans().catch((e) => setFetchError(e?.message ?? 'Error'))}
                >
                  <Text style={styles.retryBtnText}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && !fetchError && plans.length === 0 && (
              <View style={[glass, styles.errorCard]}>
                <Ionicons name="fitness-outline" size={32} color={colors.dim} />
                <Text style={styles.errorText}>No hay planes disponibles</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => fetchPlans().catch((e) => setFetchError(e?.message ?? 'Error'))}
                >
                  <Text style={styles.retryBtnText}>Recargar planes</Text>
                </TouchableOpacity>
              </View>
            )}

            {plans.map((plan) => {
              const diffColor = DIFFICULTY_COLORS[plan.difficulty] ?? colors.neon;
              const isMyPlan = plan.id === myPlan?.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[glass, styles.planCard, isMyPlan && styles.planCardActive]}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/workout/${plan.id}` as never)}
                >
                  <View style={[styles.planAccent, { backgroundColor: diffColor }]} />
                  <View style={styles.planInfo}>
                    {isMyPlan && (
                      <Text style={styles.myPlanTag}>MI PLAN</Text>
                    )}
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={styles.planChips}>
                      <View style={styles.planChip}>
                        <Text style={styles.planChipText}>{plan.daysPerWeek}x SEMANA</Text>
                      </View>
                      <View style={[styles.planChip, { borderColor: diffColor + '50' }]}>
                        <Text style={[styles.planChipText, { color: diffColor }]}>
                          {DIFFICULTY_LABELS[plan.difficulty] ?? plan.difficulty.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.dim} />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </HudBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 56,
    backgroundColor: 'rgba(8,8,8,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { ...text.heroMd, fontSize: 20, color: colors.neon, letterSpacing: -0.5 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(204,255,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.3)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  streakBadgeText: { ...text.labelSm, color: colors.neon },

  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },

  heroSection: { gap: spacing.md },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...text.headlineLg, color: colors.text },
  todayLabel: { ...text.labelSm, color: colors.neon },

  heroCard: { borderRadius: radius.lg, overflow: 'hidden', minHeight: 220 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  heroContent: { padding: spacing.lg, gap: spacing.md },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  heroBadgeText: { ...text.labelSm, color: colors.neon },
  heroTitle: { ...text.heroMd, color: colors.text },
  heroStats: { flexDirection: 'row', gap: spacing.lg },
  heroStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroStat: { ...text.bodyMd, color: colors.muted },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neon,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...glowShadows.neon,
  },
  heroBtnText: { ...text.headlineMd, color: colors.bg },

  programsSection: { gap: spacing.md },
  programsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  errorCard: { padding: spacing.lg, alignItems: 'center', gap: spacing.md, borderRadius: radius.lg },
  errorText: { ...text.bodyMd, color: colors.muted, textAlign: 'center' },
  retryBtn: {
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryBtnText: { ...text.labelSm, color: colors.neon },

  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    overflow: 'hidden',
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    gap: spacing.md,
  },
  planCardActive: { borderColor: colors.neon + '50' },
  planAccent: { width: 3, alignSelf: 'stretch' },
  planInfo: { flex: 1, gap: spacing.xs, paddingLeft: spacing.sm },
  myPlanTag: { ...text.labelSm, color: colors.neon },
  planName: { ...text.headlineMd, color: colors.text },
  planChips: { flexDirection: 'row', gap: spacing.xs },
  planChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planChipText: { ...text.labelSm, color: colors.muted },
});
