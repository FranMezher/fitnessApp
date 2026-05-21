import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, glassNeon, glowShadows } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { HudBackground } from '@/components/ui/HudBackground';
import { useNutritionStore } from '@/stores/useNutritionStore';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch:     'Almuerzo',
  snack:     'Merienda',
  dinner:    'Cena',
};

const SERVING_OPTIONS = ['100g', '150g', '200g', '250g', '1 unidad', '½ unidad'];

export default function AddFoodScreen() {
  const params = useLocalSearchParams<{ data: string; meal: string }>();
  const food = JSON.parse(params.data ?? '{}');
  const mealLabel = MEAL_LABELS[params.meal] ?? 'Almuerzo';

  const [grams, setGrams] = useState('100');
  const [selectedServing, setSelectedServing] = useState('100g');
  const [saving, setSaving] = useState(false);
  const addFood = useNutritionStore((s) => s.addFood);

  const multiplier = parseFloat(grams || '0') / 100;
  const calc = (v: number) => Math.round(v * multiplier * 10) / 10;

  const calories = calc(food.calories ?? 0);
  const protein  = calc(food.proteinG ?? 0);
  const carbs    = calc(food.carbsG ?? 0);
  const fat      = calc(food.fatG ?? 0);

  const dailyGoals = { calories: 1840, protein: 145, carbs: 200, fat: 55 };

  async function handleAdd() {
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await addFood({
        date: today,
        mealType: params.meal as 'breakfast' | 'lunch' | 'snack' | 'dinner',
        foodName: food.name,
        calories: Math.round(calories),
        proteinG: protein,
        carbsG: carbs,
        fatG: fat,
      });
    } catch {
      Alert.alert('Error', 'No se pudo guardar. Verificá tu conexión.');
    } finally {
      setSaving(false);
    }
    router.back();
    router.back();
  }

  return (
    <HudBackground style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* TopAppBar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.logo}>FITCORE</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Food name + meal badge */}
          <View style={styles.titleSection}>
            <Text style={styles.foodName} numberOfLines={2}>{food.name}</Text>
            {food.brand && <Text style={styles.foodBrand}>{food.brand}</Text>}
            <View style={styles.mealBadge}>
              <Ionicons name="restaurant-outline" size={12} color={colors.neon} />
              <Text style={styles.mealBadgeText}>Añadir a: </Text>
              <Text style={styles.mealBadgeValue}>{mealLabel}</Text>
            </View>
          </View>

          {/* Calorie preview */}
          <View style={[glassNeon, styles.calorieCard]}>
            <Text style={styles.kcalBig}>{calories}</Text>
            <Text style={styles.kcalLabel}>kcal</Text>
            <View style={styles.macroStrip}>
              <MacroBadge label="P" value={`${protein}g`} color={colors.neon} />
              <MacroBadge label="C" value={`${carbs}g`} color={colors.teal} />
              <MacroBadge label="G" value={`${fat}g`} color={colors.orange} />
            </View>
          </View>

          {/* Portion picker */}
          <View style={[glass, styles.portionCard]}>
            <Text style={styles.sectionLabel}>CANTIDAD (GRAMOS)</Text>
            <View style={styles.gramRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setGrams(String(Math.max(10, (parseFloat(grams) || 100) - 10)))}
              >
                <Ionicons name="remove" size={20} color={colors.text} />
              </TouchableOpacity>
              <TextInput
                style={styles.gramInput}
                value={grams}
                onChangeText={(v) => setGrams(v.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                selectionColor={colors.neon}
              />
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setGrams(String((parseFloat(grams) || 100) + 10))}
              >
                <Ionicons name="add" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>PORCIONES RÁPIDAS</Text>
            <View style={styles.servingChips}>
              {SERVING_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => {
                    setSelectedServing(s);
                    const match = s.match(/(\d+)/);
                    if (match) setGrams(match[1]);
                  }}
                  style={[styles.chip, selectedServing === s && styles.chipActive]}
                >
                  <Text style={[styles.chipText, selectedServing === s && styles.chipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Impact on daily goals */}
          <View style={[glass, styles.impactCard]}>
            <Text style={styles.sectionLabel}>IMPACTO EN TUS OBJETIVOS</Text>
            <ImpactRow label="Calorías" value={calories} unit="kcal" goal={dailyGoals.calories} color={colors.neon} />
            <ImpactRow label="Proteína" value={protein} unit="g" goal={dailyGoals.protein} color={colors.neon} />
            <ImpactRow label="Carbohidratos" value={carbs} unit="g" goal={dailyGoals.carbs} color={colors.teal} />
            <ImpactRow label="Grasas" value={fat} unit="g" goal={dailyGoals.fat} color={colors.orange} />
          </View>

          <TouchableOpacity
            style={[styles.addBtn, saving && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.bg} />
            <Text style={styles.addBtnText}>{saving ? 'GUARDANDO...' : `AÑADIR A ${mealLabel.toUpperCase()}`}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </HudBackground>
  );
}

function MacroBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.macroBadge, { backgroundColor: `${color}18`, borderColor: `${color}44` }]}>
      <Text style={[styles.macroBadgeLabel, { color }]}>{label}</Text>
      <Text style={[styles.macroBadgeVal, { color }]}>{value}</Text>
    </View>
  );
}

function ImpactRow({
  label, value, unit, goal, color,
}: { label: string; value: number; unit: string; goal: number; color: string }) {
  const pct = Math.min(100, Math.round((value / goal) * 100));
  return (
    <View style={styles.impactRow}>
      <View style={styles.impactMeta}>
        <Text style={styles.impactLabel}>{label}</Text>
        <Text style={[styles.impactValue, { color }]}>+{value}{unit}</Text>
      </View>
      <View style={styles.impactBar}>
        <View style={[styles.impactBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.impactPct}>{pct}% del objetivo</Text>
    </View>
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
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  logo: { ...text.heroMd, fontSize: 20, color: colors.neon, letterSpacing: -0.5 },

  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  titleSection: { gap: spacing.xs },
  foodName: { ...text.headlineLg, color: colors.text },
  foodBrand: { ...text.bodyMd, color: colors.muted },
  mealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  mealBadgeText: { ...text.labelSm, color: colors.muted },
  mealBadgeValue: { ...text.labelSm, color: colors.neon },

  calorieCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.lg,
  },
  kcalBig: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.neon,
    lineHeight: 60,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  kcalLabel: { ...text.bodyMd, color: colors.muted },
  macroStrip: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  macroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  macroBadgeLabel: { ...text.labelSm },
  macroBadgeVal: { ...text.labelSm },

  portionCard: { padding: spacing.md, borderRadius: radius.lg, gap: spacing.sm },
  sectionLabel: { ...text.labelSm, color: colors.muted },
  gramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gramInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  servingChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: 'rgba(204,255,0,0.1)', borderColor: colors.borderAccent },
  chipText: { ...text.labelSm, color: colors.muted },
  chipTextActive: { color: colors.neon },

  impactCard: { padding: spacing.md, borderRadius: radius.lg, gap: spacing.md },
  impactRow: { gap: 4 },
  impactMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  impactLabel: { ...text.bodyMd, color: colors.muted },
  impactValue: { ...text.labelSm },
  impactBar: {
    height: 4,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  impactBarFill: { height: '100%', borderRadius: radius.full },
  impactPct: { ...text.labelSm, color: colors.dim, textAlign: 'right', fontSize: 10 },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neon,
    borderRadius: radius.md,
    height: 56,
    ...glowShadows.neon,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { ...text.headlineMd, color: colors.bg },
});
