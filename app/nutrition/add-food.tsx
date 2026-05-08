import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Label } from '@/components/ui/Label';
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
  const pctOf = (v: number, goal: number) => Math.min(100, Math.round((v / goal) * 100));

  async function handleAdd() {
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await addFood({
        userId: '',
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
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title} numberOfLines={1}>{food.name}</Text>
            {food.brand && <Text style={styles.brand}>{food.brand}</Text>}
          </View>
        </View>

        {/* Meal target badge */}
        <View style={styles.mealBadge}>
          <Text style={styles.mealBadgeText}>Añadir a: </Text>
          <Text style={styles.mealBadgeValue}>{mealLabel}</Text>
        </View>

        {/* Calorie preview — big number */}
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
          <Label>Cantidad (gramos)</Label>
          <View style={styles.gramRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setGrams(String(Math.max(10, (parseFloat(grams) || 100) - 10)))}
            >
              <Text style={styles.stepBtnText}>−</Text>
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
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Quick-select serving sizes */}
          <Label>Porciones rápidas</Label>
          <View style={styles.servingChips}>
            {SERVING_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => {
                  setSelectedServing(s);
                  const match = s.match(/(\d+)/);
                  if (match) setGrams(match[1]);
                }}
                style={[
                  styles.chip,
                  selectedServing === s && styles.chipActive,
                ]}
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
          <Label>Impacto en tus objetivos de hoy</Label>
          <ImpactRow label="Calorías" value={calories} unit="kcal" goal={dailyGoals.calories} color={colors.neon} />
          <ImpactRow label="Proteína" value={protein} unit="g" goal={dailyGoals.protein} color={colors.neon} />
          <ImpactRow label="Carbohidratos" value={carbs} unit="g" goal={dailyGoals.carbs} color={colors.teal} />
          <ImpactRow label="Grasas" value={fat} unit="g" goal={dailyGoals.fat} color={colors.orange} />
        </View>

        <Btn onPress={handleAdd}>{saving ? 'Guardando...' : `Añadir a ${mealLabel}`}</Btn>
      </ScrollView>
    </SafeAreaView>
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
  const pct = pctOf(value, goal);
  function pctOf(v: number, g: number) { return Math.min(100, Math.round((v / g) * 100)); }
  return (
    <View style={styles.impactRow}>
      <View style={styles.impactMeta}>
        <Text style={styles.impactLabel}>{label}</Text>
        <Text style={[styles.impactValue, { color }]}>+{value}{unit}</Text>
      </View>
      <ProgressBar pct={pct} color={color} h={4} />
      <Text style={styles.impactPct}>{pct}% del objetivo</Text>
    </View>
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
    alignItems: 'flex-start',
    gap: 12,
  },
  backText: {
    fontSize: 20,
    color: colors.muted,
    marginTop: 2,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  brand: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  mealBadge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  mealBadgeText: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  mealBadgeValue: {
    fontSize: 13,
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  calorieCard: {
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  kcalBig: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.neon,
    lineHeight: 60,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  kcalLabel: {
    fontSize: 14,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  macroStrip: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  macroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  macroBadgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  macroBadgeVal: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  portionCard: {
    padding: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  gramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 20,
    color: colors.text,
    lineHeight: 24,
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
    borderRadius: 12,
    paddingVertical: 8,
  },
  servingChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: 'rgba(204,255,0,0.1)',
    borderColor: colors.borderAccent,
  },
  chipText: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  chipTextActive: {
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  impactCard: {
    padding: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  impactRow: {
    gap: 4,
  },
  impactMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  impactLabel: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  impactValue: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  impactPct: {
    fontSize: 11,
    color: colors.dim,
    fontFamily: 'SpaceGrotesk_400Regular',
    textAlign: 'right',
  },
});
