import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { HudBackground } from '@/components/ui/HudBackground';
import { useNutritionStore } from '@/stores/useNutritionStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { AddFoodModal } from '@/components/nutrition/AddFoodModal';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch:     'Almuerzo',
  snack:     'Merienda',
  dinner:    'Cena',
};

const MEAL_ICONS: Record<string, string> = {
  breakfast: 'sunny-outline',
  lunch:     'sunny',
  snack:     'cafe-outline',
  dinner:    'moon-outline',
};

const MACRO_COLORS = {
  protein: colors.neon,
  carbs:   colors.orange,
  fat:     colors.teal,
};

export default function MealDetailScreen() {
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  const mealKey = (id ?? 'lunch') as 'breakfast' | 'lunch' | 'snack' | 'dinner';
  const selectedDate = date ?? new Date().toISOString().slice(0, 10);

  const { foodLog, removeFood, fetchFoodLog } = useNutritionStore();
  const { profile } = useAuthStore();
  const [addModalVisible, setAddModalVisible] = useState(false);

  const items = foodLog.filter((e) => e.mealType === mealKey && e.date === selectedDate);

  const goals = {
    calories: profile?.targetCalories ?? 2000,
    proteinG: profile?.targetProteinG ?? 150,
    carbsG:   profile?.targetCarbsG   ?? 200,
    fatG:     profile?.targetFatG     ?? 55,
  };

  const totals = items.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      proteinG: acc.proteinG + f.proteinG,
      carbsG:   acc.carbsG + f.carbsG,
      fatG:     acc.fatG + f.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  const calsRemaining = Math.max(0, goals.calories - totals.calories);
  const calsPct = Math.min(100, (totals.calories / goals.calories) * 100);

  function confirmRemove(itemId: string, name: string) {
    Alert.alert('Eliminar', `¿Quitar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => removeFood(itemId) },
    ]);
  }

  const formattedDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('es', {
    day: 'numeric',
    month: 'long',
  }).toUpperCase();

  return (
    <HudBackground style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerBrand}>FITCORE</Text>
          <Ionicons name="notifications-outline" size={22} color={colors.neon} />
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Date & header */}
          <View style={styles.dateSection}>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>{formattedDate}</Text>
              <Text style={styles.goalLabel}>OBJETIVO: {goals.calories.toLocaleString()} KCAL</Text>
            </View>
            <View style={styles.mealTitleRow}>
              <Ionicons name={MEAL_ICONS[mealKey] as any} size={22} color={colors.muted} />
              <Text style={styles.mealTitle}>{MEAL_LABELS[mealKey]}</Text>
            </View>
          </View>

          {/* Summary glass card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.kcalBig}>{Math.round(totals.calories).toLocaleString()}</Text>
                <Text style={styles.kcalSub}>kcal consumidas</Text>
              </View>
              <View style={styles.remainingBlock}>
                <Text style={[styles.remainingNum, { color: calsRemaining > 0 ? colors.orange : colors.neon }]}>
                  {calsRemaining.toLocaleString()}
                </Text>
                <Text style={styles.remainingLabel}>RESTANTES</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${calsPct}%` }]} />
            </View>

            {/* Macros strip */}
            <View style={styles.macrosRow}>
              <MacroCell label="Proteína" value={totals.proteinG} goal={goals.proteinG} color={MACRO_COLORS.protein} />
              <View style={styles.macroDivider} />
              <MacroCell label="Carbs" value={totals.carbsG} goal={goals.carbsG} color={MACRO_COLORS.carbs} />
              <View style={styles.macroDivider} />
              <MacroCell label="Grasas" value={totals.fatG} goal={goals.fatG} color={MACRO_COLORS.fat} />
            </View>
          </View>

          {/* Food items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ALIMENTOS REGISTRADOS</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(true)}>
                <Ionicons name="add-circle-outline" size={22} color={colors.neon} />
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="restaurant-outline" size={40} color={colors.dim} />
                <Text style={styles.emptyText}>No hay alimentos registrados</Text>
                <TouchableOpacity style={styles.addFirstBtn} onPress={() => setAddModalVisible(true)}>
                  <Text style={styles.addFirstBtnText}>Añadir alimento</Text>
                </TouchableOpacity>
              </View>
            ) : (
              items.map((item, idx) => (
                <View key={item.id}>
                  <View style={styles.foodRow}>
                    <View style={styles.foodIconWrap}>
                      <Ionicons name="restaurant-outline" size={18} color={colors.muted} />
                    </View>
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{item.foodName}</Text>
                      <Text style={styles.foodMacros}>
                        {Math.round(item.proteinG)}g P
                        {' '}·{' '}
                        {Math.round(item.carbsG)}g C
                        {' '}·{' '}
                        {Math.round(item.fatG)}g G
                      </Text>
                    </View>
                    <Text style={styles.foodKcal}>{Math.round(item.calories)}</Text>
                    <TouchableOpacity
                      onPress={() => confirmRemove(item.id, item.foodName)}
                      style={styles.removeBtn}
                    >
                      <Ionicons name="close" size={14} color={colors.orange} />
                    </TouchableOpacity>
                  </View>
                  {idx < items.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            )}
          </View>

          {/* Macro breakdown bars */}
          {items.length > 0 && (
            <View style={styles.breakdownCard}>
              <Text style={styles.sectionTitle}>DISTRIBUCIÓN DE MACROS</Text>
              <MacroBar label="Proteína"      value={totals.proteinG} max={goals.proteinG} color={MACRO_COLORS.protein} />
              <MacroBar label="Carbohidratos" value={totals.carbsG}   max={goals.carbsG}   color={MACRO_COLORS.carbs} />
              <MacroBar label="Grasas"        value={totals.fatG}     max={goals.fatG}     color={MACRO_COLORS.fat} />
            </View>
          )}
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color={colors.bg} />
        </TouchableOpacity>

        <AddFoodModal
          visible={addModalVisible}
          mealType={mealKey}
          date={selectedDate}
          onClose={() => setAddModalVisible(false)}
          onAdded={() => {
            setAddModalVisible(false);
            fetchFoodLog(selectedDate);
          }}
        />
      </SafeAreaView>
    </HudBackground>
  );
}

function MacroCell({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  return (
    <View style={styles.macroCell}>
      <Text style={styles.macroCellLabel}>{label}</Text>
      <Text style={[styles.macroCellValue, { color }]}>
        {Math.round(value * 10) / 10}g / {goal}g
      </Text>
    </View>
  );
}

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0);
  return (
    <View style={styles.macroBarRow}>
      <View style={styles.macroBarMeta}>
        <Text style={styles.macroBarLabel}>{label}</Text>
        <Text style={[styles.macroBarValue, { color }]}>
          {Math.round(value * 10) / 10}g / {max}g
        </Text>
      </View>
      <View style={styles.macroBarTrack}>
        <View style={[styles.macroBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  backBtn: { padding: 4 },
  headerBrand: { ...text.heroMd, color: colors.neon, fontSize: 20, letterSpacing: -0.5 },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 80 },
  dateSection: { gap: spacing.xs },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateLabel: { ...text.labelSm, color: colors.neon },
  goalLabel: { ...text.dataMono, color: colors.muted, fontSize: 11 },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mealTitle: { ...text.headlineLg, color: colors.text },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  kcalBig: { ...text.heroMd, color: colors.neon },
  kcalSub: { ...text.bodyMd, color: colors.muted },
  remainingBlock: { alignItems: 'flex-end' },
  remainingNum: { ...text.headlineLg, fontSize: 22 },
  remainingLabel: { ...text.labelSm, color: colors.muted },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.neon,
    shadowColor: colors.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  macrosRow: { flexDirection: 'row', alignItems: 'center' },
  macroCell: { flex: 1, gap: 2 },
  macroCellLabel: { ...text.labelSm, color: colors.muted },
  macroCellValue: { ...text.dataMono, fontSize: 12 },
  macroDivider: { width: 1, height: 30, backgroundColor: colors.border, marginHorizontal: spacing.sm },
  section: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...text.labelCaps, color: colors.muted },
  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { ...text.bodyMd, color: colors.dim },
  addFirstBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addFirstBtnText: { ...text.bodyMd, color: colors.neon, fontFamily: 'SpaceGrotesk_600SemiBold' },
  foodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 4 },
  foodIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodInfo: { flex: 1, gap: 2 },
  foodName: { ...text.bodyLg, color: colors.text, fontFamily: 'SpaceGrotesk_500Medium' },
  foodMacros: { ...text.bodyMd, color: colors.muted },
  foodKcal: { ...text.dataMono, color: colors.neon, fontSize: 16 },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 56 },
  breakdownCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  macroBarRow: { gap: spacing.xs },
  macroBarMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  macroBarLabel: { ...text.bodyMd, color: colors.muted },
  macroBarValue: { ...text.dataMono, fontSize: 12 },
  macroBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroBarFill: { height: '100%', borderRadius: 2 },
  fab: {
    position: 'absolute',
    bottom: 88,
    right: spacing.lg,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
