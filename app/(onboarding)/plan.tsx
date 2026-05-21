import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { colors, glass, glassNeon, glowShadows } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { Btn } from '@/components/ui/Btn';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { HudBackground } from '@/components/ui/HudBackground';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

const TOTAL_STEPS = 10;
const STEP = 10;

const ACTIVITY_MULT: Record<string, number> = {
  sedentary: 1.2, lightly_active: 1.375, active: 1.55, very_active: 1.725,
};
const STRENGTH_PROTEIN: Record<string, number> = {
  beginner: 1.6, intermediate: 1.8, advanced: 2.0, pro_athlete: 2.2,
};
const GOAL_DELTA: Record<string, number> = {
  fat_loss: -500, muscle: 300, maintain: 0,
};
const SPEED_DELTA: Record<string, number> = {
  sostenible: -100, moderado: 0, agresivo: 150,
};

function calcMacros(data: ReturnType<typeof useOnboardingStore.getState>['data']) {
  const {
    sex = 'male', age = 25, heightCm = 170, weightKg = 70,
    strengthLevel = 'beginner', activityLevel = 'sedentary',
    goal = 'maintain', weightLossSpeed = 'moderado',
  } = data;

  const bmr = sex === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = bmr * (ACTIVITY_MULT[activityLevel] ?? 1.2);
  const speedAdj = goal === 'fat_loss' ? (SPEED_DELTA[weightLossSpeed] ?? 0) : 0;
  const targetCalories = Math.max(1200, Math.round(tdee + (GOAL_DELTA[goal] ?? 0) + speedAdj));

  const proteinMult = STRENGTH_PROTEIN[strengthLevel] ?? 1.6;
  const targetProteinG = Math.round(weightKg * proteinMult);
  const proteinKcal = targetProteinG * 4;
  const fatKcal = targetCalories * 0.25;
  const targetFatG = Math.round(fatKcal / 9);
  const targetCarbsG = Math.max(0, Math.round((targetCalories - proteinKcal - fatKcal) / 4));

  return { targetCalories, targetProteinG, targetFatG, targetCarbsG };
}

function goalLabel(goal?: string) {
  const map: Record<string, string> = { fat_loss: 'Perder Grasa', muscle: 'Ganar Músculo', maintain: 'Mantenimiento' };
  return map[goal ?? ''] ?? '—';
}

function activityLabel(level?: string) {
  const map: Record<string, string> = {
    sedentary: 'Sedentario', lightly_active: 'Lig. activo', active: 'Activo', very_active: 'Muy activo',
  };
  return map[level ?? ''] ?? '—';
}

function strengthLabel(level?: string) {
  const map: Record<string, string> = {
    beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado', pro_athlete: 'Atleta Pro',
  };
  return map[level ?? ''] ?? '—';
}

export default function PlanScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';

  const data = useOnboardingStore((s) => s.data);
  const resetStore = useOnboardingStore((s) => s.reset);
  const setStore = useOnboardingStore((s) => s.set);
  const { token, email, setIsNewUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { targetCalories, targetProteinG, targetFatG, targetCarbsG } = useMemo(
    () => calcMacros(data), [data],
  );

  const macroTotal = targetProteinG * 4 + targetCarbsG * 4 + targetFatG * 9;
  const proteinPct = Math.round((targetProteinG * 4 / macroTotal) * 100);
  const carbsPct = Math.round((targetCarbsG * 4 / macroTotal) * 100);
  const fatPct = 100 - proteinPct - carbsPct;

  async function handleStart() {
    setLoading(true);
    setStore({ targetCalories, targetProteinG, targetCarbsG, targetFatG });

    if (token) {
      await api.upsertProfile(token, {
        name: email?.includes('@') ? email.split('@')[0] : 'Usuario',
        ...data,
        targetCalories,
        targetProteinG,
        targetCarbsG,
        targetFatG,
      }).catch(() => {});
    }

    setIsNewUser(false);
    resetStore();
    setLoading(false);

    router.replace(isEdit ? '../' : '/(tabs)');
  }

  return (
    <HudBackground>
      <SafeAreaView style={styles.safe}>
        {/* Progress header */}
        <View style={styles.header}>
          <View style={styles.progressMeta}>
            <Text style={styles.stepLabel}>PASO 10</Text>
            <Text style={styles.stepPct}>100%</Text>
          </View>
          <ProgressBar pct={100} />
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Hero celebratory */}
          <View style={styles.heroSection}>
            <View style={styles.trophyBadge}>
              <Text style={styles.trophyIcon}>🏆</Text>
            </View>
            <Text style={styles.heroTitle}>¡Plan Listo!</Text>
            <Text style={styles.heroSub}>Tu programa personalizado está listo. Basado en tu biometría y objetivos.</Text>
          </View>

          {/* Calorie card */}
          <View style={[glassNeon, styles.calorieCard]}>
            <Text style={styles.calorieLabelTop}>OBJETIVO DIARIO</Text>
            <Text style={styles.calorieNum}>{targetCalories.toLocaleString()}</Text>
            <Text style={styles.calorieUnit}>kcal / día</Text>
          </View>

          {/* Macros */}
          <View style={styles.macrosRow}>
            <MacroCard label="Proteína" grams={targetProteinG} pct={proteinPct} color={colors.teal} />
            <MacroCard label="Carbos" grams={targetCarbsG} pct={carbsPct} color={colors.neon} />
            <MacroCard label="Grasas" grams={targetFatG} pct={fatPct} color={colors.orange} />
          </View>

          {/* Macro visual bar */}
          <View style={styles.macroBar}>
            <View style={[styles.macroBarSegment, { flex: proteinPct, backgroundColor: colors.teal }]} />
            <View style={[styles.macroBarSegment, { flex: carbsPct, backgroundColor: colors.neon }]} />
            <View style={[styles.macroBarSegment, { flex: fatPct, backgroundColor: colors.orange }]} />
          </View>

          {/* Summary */}
          <View style={[glass, styles.summaryCard]}>
            <Text style={styles.summaryTitle}>RESUMEN DE TU PLAN</Text>
            <SummaryRow icon="🎯" label="Objetivo" value={goalLabel(data.goal)} />
            <View style={styles.divider} />
            <SummaryRow icon="⚡" label="Actividad" value={activityLabel(data.activityLevel)} />
            <View style={styles.divider} />
            <SummaryRow icon="💪" label="Nivel de fuerza" value={strengthLabel(data.strengthLevel)} />
            <View style={styles.divider} />
            <SummaryRow icon="😴" label="Sueño" value={data.sleepHours ? `${data.sleepHours}h` : '—'} />
          </View>

          <View style={styles.btnWrap}>
            {loading
              ? <ActivityIndicator color={colors.neon} size="large" />
              : <Btn onPress={handleStart}>{isEdit ? 'GUARDAR PLAN' : 'COMENZAR MI TRANSFORMACIÓN'}</Btn>
            }
          </View>
        </ScrollView>
      </SafeAreaView>
    </HudBackground>
  );
}

function MacroCard({ label, grams, pct, color }: { label: string; grams: number; pct: number; color: string }) {
  return (
    <View style={[macroStyles.card, { borderTopColor: color }]}>
      <Text style={[macroStyles.grams, { color }]}>{grams}g</Text>
      <Text style={macroStyles.label}>{label}</Text>
      <Text style={macroStyles.pct}>{pct}%</Text>
    </View>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={summaryStyles.row}>
      <Text style={summaryStyles.icon}>{icon}</Text>
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={summaryStyles.value}>{value}</Text>
    </View>
  );
}

const macroStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.base,
  },
  grams: { ...text.headlineLg, fontSize: 20 },
  label: { ...text.labelSm, color: colors.muted },
  pct: { ...text.dataMono, fontSize: 11, color: colors.dim },
});

const summaryStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  icon: { fontSize: 16, width: 24 },
  label: { flex: 1, ...text.bodyMd, color: colors.muted },
  value: { ...text.headlineMd, fontSize: 14, color: colors.text },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepLabel: { ...text.labelCaps, color: colors.neon, fontSize: 11 },
  stepPct: { ...text.dataMono, color: colors.muted },
  container: {
    padding: spacing.marginMobile,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  trophyBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: 'rgba(204,255,0,0.08)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
    ...glowShadows.neon,
  },
  trophyIcon: { fontSize: 36 },
  heroTitle: { ...text.heroMd, color: colors.text, textAlign: 'center' },
  heroSub: { ...text.bodyMd, color: colors.muted, textAlign: 'center', maxWidth: 280 },
  calorieCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
    borderRadius: radius.lg,
  },
  calorieLabelTop: { ...text.labelCaps, color: colors.neon, fontSize: 11 },
  calorieNum: {
    ...text.heroLg,
    fontSize: 56,
    color: colors.neon,
    lineHeight: 60,
    shadowColor: colors.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 0,
  },
  calorieUnit: { ...text.bodyMd, color: colors.muted },
  macrosRow: { flexDirection: 'row', gap: spacing.sm },
  macroBar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: radius.full,
    overflow: 'hidden',
    gap: 2,
  },
  macroBarSegment: { borderRadius: radius.full },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  summaryTitle: { ...text.labelCaps, color: colors.neon, fontSize: 11, marginBottom: spacing.xs },
  divider: { height: 1, backgroundColor: colors.border },
  btnWrap: { marginTop: spacing.xs },
});
