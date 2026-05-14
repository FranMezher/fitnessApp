import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

const TOTAL_STEPS = 10;
const STEP = 10;

const ACTIVITY_MULT: Record<string, number> = {
  none: 1.2, '1-2': 1.375, '3-4': 1.55, '5-6': 1.725, daily: 1.9,
};
const LIFESTYLE_BONUS: Record<string, number> = {
  seated: 0, sometimes_standing: 0.05, mostly_standing: 0.1, moving: 0.15, intense: 0.2,
};
const GOAL_DELTA: Record<string, number> = {
  fat_loss: -500, muscle: 300, maintain: 0, wellness: 0,
};
const SPEED_DELTA: Record<string, number> = { slow: -100, recommended: 0, fast: 150 };

function calcMacros(data: ReturnType<typeof useOnboardingStore.getState>['data']) {
  const {
    sex = 'male', age = 25, heightCm = 170, weightKg = 70,
    strengthTraining = false, activityLevel = 'none', lifestyle = 'seated',
    goal = 'maintain', weightLossSpeed = 'recommended',
  } = data;

  const bmr = sex === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = bmr * ((ACTIVITY_MULT[activityLevel] ?? 1.2) + (LIFESTYLE_BONUS[lifestyle] ?? 0));
  const speedAdj = goal === 'fat_loss' ? (SPEED_DELTA[weightLossSpeed] ?? 0) : 0;
  const targetCalories = Math.round(tdee + (GOAL_DELTA[goal] ?? 0) + speedAdj);

  const proteinMultiplier = strengthTraining ? 2.2 : 1.6;
  const targetProteinG = Math.round(weightKg * proteinMultiplier);
  const proteinKcal = targetProteinG * 4;
  const fatKcal = targetCalories * 0.25;
  const targetFatG = Math.round(fatKcal / 9);
  const targetCarbsG = Math.round((targetCalories - proteinKcal - fatKcal) / 4);

  return { targetCalories, targetProteinG, targetFatG, targetCarbsG };
}

function ProgressChart({ startKg, endKg }: { startKg: number; endKg: number }) {
  const W = 300;
  const H = 120;
  const weeks = 8;
  const pts = Array.from({ length: weeks + 1 }, (_, i) => {
    const x = (i / weeks) * W;
    const y = H - 10 - ((startKg - (startKg - endKg) * (i / weeks)) / startKg) * (H - 20);
    return { x, y };
  });

  const pathD = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${W},${H} L 0,${H} Z`;

  return (
    <View style={chartStyles.wrap}>
      <View style={chartStyles.row}>
        <Text style={chartStyles.kgLabel}>{startKg} kg</Text>
        <Text style={chartStyles.kgLabel}>{endKg} kg</Text>
      </View>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.neon} stopOpacity={0.25} />
            <Stop offset="100%" stopColor={colors.neon} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={areaD} fill="url(#grad)" />
        <Path d={pathD} stroke={colors.neon} strokeWidth={2.5} fill="none" />
        <Circle cx={pts[weeks].x} cy={pts[weeks].y} r={5} fill={colors.neon} />
      </Svg>
      <View style={chartStyles.row}>
        <Text style={chartStyles.weekLabel}>Hoy</Text>
        <Text style={chartStyles.weekLabel}>8 semanas</Text>
      </View>
    </View>
  );
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
    () => calcMacros(data),
    [data],
  );

  const weightKg = data.weightKg ?? 75;
  const targetWeightKg = data.targetWeightKg ?? weightKg - 5;
  const showChart = data.goal === 'fat_loss' || data.goal === 'muscle';

  const macroTotal = targetProteinG * 4 + targetCarbsG * 4 + targetFatG * 9;
  const proteinPct = Math.round((targetProteinG * 4 / macroTotal) * 100);
  const carbsPct = Math.round((targetCarbsG * 4 / macroTotal) * 100);
  const fatPct = 100 - proteinPct - carbsPct;

  async function handleStart() {
    setLoading(true);
    setStore({ targetCalories, targetProteinG, targetCarbsG, targetFatG });

    if (token) {
      await api.upsertProfile(token, {
        name: (email?.includes('@') ? email.split('@')[0] : null) ?? 'Usuario',
        ...data,
        targetCalories,
        targetProteinG,
        targetCarbsG,
        targetFatG,
        activityLifestyle: data.lifestyle,
      }).catch(() => {});
    }

    setIsNewUser(false);
    resetStore();
    setLoading(false);

    if (isEdit) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressTrack}>
        <View style={styles.progressFill} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.step}>Paso {STEP} de {TOTAL_STEPS} · Tu plan</Text>
        <Text style={styles.title}>¡Genial! Estas son las calorías que necesitás por día</Text>

        {/* Calorie ring */}
        <View style={[glassNeon, styles.calorieCard]}>
          <Text style={styles.calorieNum}>{targetCalories.toLocaleString()}</Text>
          <Text style={styles.calorieUnit}>kcal / día</Text>
        </View>

        {/* Macros */}
        <View style={styles.macrosRow}>
          <MacroCard label="Proteína" grams={targetProteinG} pct={proteinPct} color={colors.teal} />
          <MacroCard label="Carbos" grams={targetCarbsG} pct={carbsPct} color={colors.neon} />
          <MacroCard label="Grasas" grams={targetFatG} pct={fatPct} color={colors.orange} />
        </View>

        {/* Progress chart */}
        {showChart && (
          <View style={[glass, styles.chartCard]}>
            <Text style={styles.chartTitle}>...y así será tu progreso</Text>
            <ProgressChart startKg={weightKg} endKg={targetWeightKg} />
          </View>
        )}

        {/* Summary */}
        <View style={[glass, styles.summaryCard]}>
          <SummaryRow icon="🎯" label="Objetivo" value={goalLabel(data.goal)} />
          <SummaryRow icon="⚡" label="Actividad" value={activityLabel(data.activityLevel)} />
          <SummaryRow icon="💪" label="Fuerza" value={data.strengthTraining ? 'Sí' : 'No'} />
        </View>

        <View style={styles.btnWrap}>
          {loading
            ? <ActivityIndicator color={colors.neon} />
            : <Btn onPress={handleStart}>{isEdit ? 'Guardar plan' : '¡Empezar ahora! ⚡'}</Btn>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroCard({ label, grams, pct, color }: { label: string; grams: number; pct: number; color: string }) {
  return (
    <View style={[macroStyles.card, { borderLeftColor: color }]}>
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

function goalLabel(goal?: string) {
  const map: Record<string, string> = { fat_loss: 'Perder grasa', muscle: 'Ganar músculo', maintain: 'Mantener peso', wellness: 'Bienestar' };
  return map[goal ?? ''] ?? '—';
}

function activityLabel(level?: string) {
  const map: Record<string, string> = { none: 'Sin ejercicio', '1-2': '1–2 días/sem', '3-4': '3–4 días/sem', '5-6': '5–6 días/sem', daily: 'Diario' };
  return map[level ?? ''] ?? '—';
}

const chartStyles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', width: 300 },
  kgLabel: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_600SemiBold' },
  weekLabel: { fontSize: 11, color: colors.dim, fontFamily: 'SpaceGrotesk_400Regular' },
});

const macroStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 2,
  },
  grams: { fontSize: 20, fontWeight: '700', fontFamily: 'SpaceGrotesk_700Bold' },
  label: { fontSize: 11, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  pct: { fontSize: 11, color: colors.dim, fontFamily: 'SpaceGrotesk_400Regular' },
});

const summaryStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  icon: { fontSize: 16, width: 24 },
  label: { flex: 1, fontSize: 14, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  value: { fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: 'SpaceGrotesk_600SemiBold' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.08)' },
  progressFill: { height: 3, backgroundColor: colors.neon, borderRadius: 2, width: '100%' },
  container: { padding: 24, paddingTop: 16, paddingBottom: 40 },
  step: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 20, fontFamily: 'SpaceGrotesk_700Bold', lineHeight: 30 },
  calorieCard: { alignItems: 'center', paddingVertical: 28, marginBottom: 16 },
  calorieNum: { fontSize: 52, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', textShadowColor: `${colors.neon}66`, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  calorieUnit: { fontSize: 14, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  macrosRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  chartCard: { padding: 16, marginBottom: 16, alignItems: 'center' },
  chartTitle: { fontSize: 15, fontWeight: '600', color: colors.text, fontFamily: 'SpaceGrotesk_600SemiBold', marginBottom: 12, alignSelf: 'flex-start' },
  summaryCard: { padding: 16, marginBottom: 8 },
  btnWrap: { marginTop: 16 },
});
