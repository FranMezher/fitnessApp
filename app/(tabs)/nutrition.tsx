import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Ring } from '@/components/ui/Ring';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Label } from '@/components/ui/Label';
import { useNutritionStore } from '@/stores/useNutritionStore';
import { FoodLogEntry } from '@/lib/api';

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  snack: '🍎',
  dinner: '🌙',
};

const MEAL_NAMES: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  snack: 'Merienda',
  dinner: 'Cena',
};

const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];

const DAILY_GOALS = { calories: 1840, proteinG: 145, carbsG: 200, fatG: 55 };

const WATER_GOAL = 8;

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDay(dateStr: string) {
  const today = toDateString(new Date());
  const yesterday = toDateString(new Date(Date.now() - 86400000));
  if (dateStr === today) return 'Hoy';
  if (dateStr === yesterday) return 'Ayer';
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

export default function NutritionScreen() {
  const today = toDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const { foodLog, fetchFoodLog, loading, waterGlasses, setWaterGlasses } = useNutritionStore();

  useEffect(() => {
    fetchFoodLog(selectedDate);
  }, [selectedDate]);

  function prevDay() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(toDateString(d));
  }

  function nextDay() {
    const next = toDateString(new Date(new Date(selectedDate).getTime() + 86400000));
    if (next <= today) setSelectedDate(next);
  }

  // Group entries by mealType
  const byMeal: Record<string, FoodLogEntry[]> = { breakfast: [], lunch: [], snack: [], dinner: [] };
  for (const e of foodLog) {
    if (byMeal[e.mealType]) byMeal[e.mealType].push(e);
  }

  // Totals
  const totalCal = foodLog.reduce((s, e) => s + e.calories, 0);
  const totalProt = foodLog.reduce((s, e) => s + e.proteinG, 0);
  const totalCarbs = foodLog.reduce((s, e) => s + e.carbsG, 0);
  const totalFat = foodLog.reduce((s, e) => s + e.fatG, 0);

  const pctOf = (v: number, g: number) => Math.min(100, Math.round((v / g) * 100));
  const calPct = pctOf(totalCal, DAILY_GOALS.calories);

  const waterPct = Math.round((waterGlasses / WATER_GOAL) * 100);

  const isToday = selectedDate === today;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header + day navigation */}
        <View style={styles.header}>
          <Text style={styles.title}>Nutrición</Text>
          <View style={styles.dayNav}>
            <TouchableOpacity onPress={prevDay} style={styles.navBtn}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>
            <View style={[glass, styles.dayPill]}>
              <Text style={styles.dayText}>{formatDay(selectedDate)}</Text>
            </View>
            <TouchableOpacity onPress={nextDay} style={styles.navBtn} disabled={isToday}>
              <Text style={[styles.navArrow, isToday && styles.navArrowDim]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calorie ring + macros */}
        <GlassCard style={styles.calorieCard}>
          {loading ? (
            <ActivityIndicator color={colors.neon} style={{ flex: 1, paddingVertical: 16 }} />
          ) : (
            <>
              <Ring pct={calPct} size={90} color={colors.neon} label={String(totalCal)} sub="kcal" />
              <View style={styles.macrosWrap}>
                <Text style={styles.remaining}>
                  Restantes: <Text style={styles.remainingVal}>{Math.max(0, DAILY_GOALS.calories - totalCal)} kcal</Text>
                </Text>
                {[
                  { name: 'Proteína', val: totalProt, goal: DAILY_GOALS.proteinG, color: colors.neon },
                  { name: 'Carbos',   val: totalCarbs, goal: DAILY_GOALS.carbsG,  color: colors.teal  },
                  { name: 'Grasas',   val: totalFat,   goal: DAILY_GOALS.fatG,    color: colors.orange },
                ].map((m) => (
                  <View key={m.name} style={styles.macroRow}>
                    <View style={styles.macroMeta}>
                      <Text style={styles.macroName}>{m.name}</Text>
                      <Text style={[styles.macroPct, { color: m.color }]}>
                        {Math.round(m.val)}g / {m.goal}g
                      </Text>
                    </View>
                    <ProgressBar pct={pctOf(m.val, m.goal)} color={m.color} h={4} />
                  </View>
                ))}
              </View>
            </>
          )}
        </GlassCard>

        {/* Water tracker */}
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

        {/* Meals */}
        <Text style={styles.mealsTitle}>Comidas {isToday ? 'de hoy' : `del ${formatDay(selectedDate)}`}</Text>

        {MEAL_ORDER.map((mealId) => {
          const entries = byMeal[mealId];
          const mealCal = entries.reduce((s, e) => s + e.calories, 0);
          const hasFoods = entries.length > 0;

          return (
            <TouchableOpacity
              key={mealId}
              style={[glass, styles.mealCard, !hasFoods && styles.mealDim]}
              activeOpacity={0.75}
              onPress={() => router.push({ pathname: '/nutrition/meal/[id]', params: { id: mealId, date: selectedDate } })}
            >
              <View style={styles.mealLeft}>
                <Text style={styles.mealIcon}>{MEAL_ICONS[mealId]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.mealName, !hasFoods && styles.mealNameDim]}>
                    {MEAL_NAMES[mealId]}
                  </Text>
                  {hasFoods
                    ? entries.map((e) => (
                        <Text key={e.id} style={styles.mealItem}>· {e.foodName}</Text>
                      ))
                    : <Text style={styles.mealEmpty}>Sin registrar</Text>
                  }
                </View>
              </View>
              <View style={styles.mealRight}>
                {hasFoods ? (
                  <Text style={styles.mealKcal}>{mealCal} kcal</Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/nutrition/search', params: { meal: mealId, date: selectedDate } })}
                    style={styles.addBtn}
                  >
                    <Text style={styles.addBtnText}>+ Añadir</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.mealArrow}>›</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Pantry CTA */}
        <TouchableOpacity
          style={[glassNeon, styles.pantryCta]}
          onPress={() => router.push('/nutrition/pantry')}
          activeOpacity={0.8}
        >
          <Text style={styles.pantryEmoji}>✦</Text>
          <View>
            <Text style={styles.pantryTitle}>Modo Despensa</Text>
            <Text style={styles.pantrySub}>Genera recetas con lo que tenés en casa</Text>
          </View>
          <Text style={styles.pantryArrow}>›</Text>
        </TouchableOpacity>

        {/* Social groups CTA */}
        <TouchableOpacity
          style={[glass, styles.receiptCta]}
          onPress={() => router.push('/nutrition/groups')}
          activeOpacity={0.8}
        >
          <Text style={styles.receiptEmoji}>👥</Text>
          <View>
            <Text style={styles.receiptTitle}>Grupos de nutrición</Text>
            <Text style={styles.receiptSub}>Compará lo que comés con tus amigos</Text>
          </View>
          <Text style={styles.receiptArrow}>›</Text>
        </TouchableOpacity>

        {/* Receipt scanner CTA */}
        <TouchableOpacity
          style={[glass, styles.receiptCta]}
          onPress={() => router.push({ pathname: '/nutrition/scanner', params: { mode: 'receipt' } })}
          activeOpacity={0.8}
        >
          <Text style={styles.receiptEmoji}>🧾</Text>
          <View>
            <Text style={styles.receiptTitle}>Escanear ticket</Text>
            <Text style={styles.receiptSub}>Fotografiá el ticket y la IA detecta las comidas</Text>
          </View>
          <Text style={styles.receiptArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  dayNav: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  navBtn: { padding: 6 },
  navArrow: { fontSize: 22, color: colors.text, fontWeight: '700' },
  navArrowDim: { color: colors.dim },
  dayPill: { paddingHorizontal: 12, paddingVertical: 4 },
  dayText: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  calorieCard: { padding: 16, flexDirection: 'row', gap: 16, alignItems: 'center', minHeight: 100 },
  macrosWrap: { flex: 1, gap: 7 },
  remaining: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  remainingVal: { color: colors.neon, fontWeight: '700', fontFamily: 'SpaceGrotesk_700Bold' },
  macroRow: { gap: 3 },
  macroMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  macroName: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  macroPct: { fontSize: 12, fontFamily: 'SpaceGrotesk_600SemiBold' },
  waterCard: { padding: 14, paddingHorizontal: 16, gap: 10 },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waterAmount: { marginTop: 2 },
  waterAmountVal: { fontSize: 20, fontWeight: '700', color: colors.teal, fontFamily: 'SpaceGrotesk_700Bold' },
  waterAmountGoal: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  waterGlasses: { flexDirection: 'row', gap: 6, marginTop: 2 },
  glassBtn: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  glassIcon: { fontSize: 22, opacity: 0.3 },
  glassIconFull: { opacity: 1 },
  waterHint: { fontSize: 11, color: colors.dim, textAlign: 'center', fontFamily: 'SpaceGrotesk_400Regular' },
  mealsTitle: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold', marginTop: 4 },
  mealCard: { padding: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealDim: { opacity: 0.65 },
  mealLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  mealIcon: { fontSize: 20, marginTop: 2 },
  mealName: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 2 },
  mealNameDim: { color: colors.muted, fontWeight: '400' },
  mealItem: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  mealEmpty: { fontSize: 12, color: colors.dim, fontFamily: 'SpaceGrotesk_400Regular', fontStyle: 'italic' },
  mealRight: { alignItems: 'flex-end', gap: 4 },
  mealKcal: { fontSize: 14, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold' },
  addBtn: {
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  addBtnText: { fontSize: 12, color: colors.orange, fontFamily: 'SpaceGrotesk_600SemiBold' },
  mealArrow: { color: colors.dim, fontSize: 18 },
  pantryCta: { padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  pantryEmoji: { fontSize: 22, color: colors.neon },
  pantryTitle: { fontSize: 15, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold' },
  pantrySub: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  pantryArrow: { marginLeft: 'auto', color: colors.neon, fontSize: 20 },
  receiptCta: { padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  receiptEmoji: { fontSize: 22 },
  receiptTitle: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  receiptSub: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  receiptArrow: { marginLeft: 'auto', color: colors.dim, fontSize: 20 },
});
