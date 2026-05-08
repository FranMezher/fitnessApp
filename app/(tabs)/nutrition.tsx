import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Ring } from '@/components/ui/Ring';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Label } from '@/components/ui/Label';

interface Meal {
  id: string;
  meal: string;
  kcal: number | null;
  items: string[];
  done: boolean;
}

const INITIAL_MEALS: Meal[] = [
  { id: 'breakfast', meal: 'Desayuno',  kcal: 420,  items: ['Avena + plátano', 'Café c/ leche'], done: true  },
  { id: 'lunch',     meal: 'Almuerzo',  kcal: 580,  items: ['Arroz + pollo', 'Ensalada verde'], done: true  },
  { id: 'snack',     meal: 'Merienda',  kcal: null, items: [], done: false },
  { id: 'dinner',    meal: 'Cena',      kcal: null, items: [], done: false },
];

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch:     '☀️',
  snack:     '🍎',
  dinner:    '🌙',
};

const MACROS = [
  { name: 'Proteína', pct: 60, color: colors.neon },
  { name: 'Carbos',   pct: 67, color: colors.teal  },
  { name: 'Grasas',   pct: 58, color: colors.orange },
];

// Water: 8 glasses of 250ml = 2000ml goal
const WATER_GOAL = 8;

export default function NutritionScreen() {
  const [waterGlasses, setWaterGlasses] = useState(4);

  const waterPct = Math.round((waterGlasses / WATER_GOAL) * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nutrición</Text>
          <View style={[glass, styles.dayPicker]}>
            <Text style={styles.dayText}>Hoy ▾</Text>
          </View>
        </View>

        {/* Calorie ring + macros */}
        <GlassCard style={styles.calorieCard}>
          <Ring pct={67} size={90} color={colors.neon} label="1240" sub="kcal" />
          <View style={styles.macrosWrap}>
            <Text style={styles.remaining}>
              Restantes: <Text style={styles.remainingVal}>600 kcal</Text>
            </Text>
            {MACROS.map((m) => (
              <View key={m.name} style={styles.macroRow}>
                <View style={styles.macroMeta}>
                  <Text style={styles.macroName}>{m.name}</Text>
                  <Text style={[styles.macroPct, { color: m.color }]}>{m.pct}%</Text>
                </View>
                <ProgressBar pct={m.pct} color={m.color} h={4} />
              </View>
            ))}
          </View>
        </GlassCard>

        {/* ── Water tracker ─────────────────────────────────────────── */}
        <GlassCard style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <View>
              <Label>Hidratación</Label>
              <Text style={styles.waterAmount}>
                <Text style={styles.waterAmountVal}>{waterGlasses * 250}</Text>
                <Text style={styles.waterAmountGoal}> / 2000 ml</Text>
              </Text>
            </View>
            <Ring pct={waterPct} size={56} color={colors.teal} label={`${waterPct}%`} sub="H₂O" />
          </View>
          <ProgressBar pct={waterPct} color={colors.teal} h={6} />
          <View style={styles.waterGlasses}>
            {Array.from({ length: WATER_GOAL }, (_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setWaterGlasses(i < waterGlasses ? i : i + 1)}
                style={styles.glassBtn}
                activeOpacity={0.7}
              >
                <Text style={[styles.glassIcon, i < waterGlasses && styles.glassIconFull]}>
                  {i < waterGlasses ? '🥤' : '🫙'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.waterHint}>Toca para registrar un vaso (250ml)</Text>
        </GlassCard>

        {/* ── Meals ─────────────────────────────────────────────────── */}
        <Text style={styles.mealsTitle}>Comidas de hoy</Text>

        {INITIAL_MEALS.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[glass, styles.mealCard, !m.done && styles.mealDim]}
            activeOpacity={0.75}
            onPress={() => router.push({ pathname: '/nutrition/meal/[id]', params: { id: m.id } })}
          >
            <View style={styles.mealLeft}>
              <Text style={styles.mealIcon}>{MEAL_ICONS[m.id]}</Text>
              <View>
                <Text style={[styles.mealName, !m.done && styles.mealNameDim]}>{m.meal}</Text>
                {m.items.length > 0
                  ? m.items.map((it) => (
                      <Text key={it} style={styles.mealItem}>· {it}</Text>
                    ))
                  : <Text style={styles.mealEmpty}>Sin registrar</Text>
                }
              </View>
            </View>
            <View style={styles.mealRight}>
              {m.kcal ? (
                <Text style={styles.mealKcal}>{m.kcal} kcal</Text>
              ) : (
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/nutrition/search', params: { meal: m.id } })}
                  style={styles.addBtn}
                >
                  <Text style={styles.addBtnText}>+ Añadir</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.mealArrow}>›</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* ── Pantry CTA ────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[glassNeon, styles.pantryCta]}
          onPress={() => router.push('/nutrition/pantry')}
          activeOpacity={0.8}
        >
          <Text style={styles.pantryEmoji}>✦</Text>
          <View>
            <Text style={styles.pantryTitle}>Modo Despensa</Text>
            <Text style={styles.pantrySub}>Genera recetas con lo que tienes en casa</Text>
          </View>
          <Text style={styles.pantryArrow}>›</Text>
        </TouchableOpacity>
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
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  dayPicker: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dayText: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  calorieCard: {
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  macrosWrap: {
    flex: 1,
    gap: 7,
  },
  remaining: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  remainingVal: {
    color: colors.neon,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  macroRow: { gap: 3 },
  macroMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroName: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  macroPct: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  // Water
  waterCard: {
    padding: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterAmount: {
    marginTop: 2,
  },
  waterAmountVal: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.teal,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  waterAmountGoal: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  waterGlasses: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  glassBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  glassIcon: {
    fontSize: 22,
    opacity: 0.3,
  },
  glassIconFull: {
    opacity: 1,
  },
  waterHint: {
    fontSize: 11,
    color: colors.dim,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  // Meals
  mealsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginTop: 4,
  },
  mealCard: {
    padding: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealDim: {
    opacity: 0.65,
  },
  mealLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  mealIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginBottom: 2,
  },
  mealNameDim: {
    color: colors.muted,
    fontWeight: '400',
  },
  mealItem: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  mealEmpty: {
    fontSize: 12,
    color: colors.dim,
    fontFamily: 'SpaceGrotesk_400Regular',
    fontStyle: 'italic',
  },
  mealRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  mealKcal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  addBtn: {
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  addBtnText: {
    fontSize: 12,
    color: colors.orange,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  mealArrow: {
    color: colors.dim,
    fontSize: 18,
  },
  // Pantry CTA
  pantryCta: {
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  pantryEmoji: {
    fontSize: 22,
    color: colors.neon,
  },
  pantryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  pantrySub: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  pantryArrow: {
    marginLeft: 'auto',
    color: colors.neon,
    fontSize: 20,
  },
});
