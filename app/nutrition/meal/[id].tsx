import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Pill } from '@/components/ui/Pill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Label } from '@/components/ui/Label';
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
  breakfast: '🌅',
  lunch:     '☀️',
  snack:     '🍎',
  dinner:    '🌙',
};

export default function MealDetailScreen() {
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  const mealKey = (id ?? 'lunch') as 'breakfast' | 'lunch' | 'snack' | 'dinner';
  const selectedDate = date ?? new Date().toISOString().slice(0, 10);

  const { foodLog, removeFood, fetchFoodLog } = useNutritionStore();
  const { profile } = useAuthStore();
  const [addModalVisible, setAddModalVisible] = useState(false);

  const items = foodLog.filter((e) => e.mealType === mealKey);

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

  function confirmRemove(itemId: string, name: string) {
    Alert.alert('Eliminar', `¿Quitar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => removeFood(itemId),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.mealIcon}>{MEAL_ICONS[mealKey]}</Text>
          <Text style={styles.title}>{MEAL_LABELS[mealKey]}</Text>
        </View>

        {/* Totals summary card */}
        <View style={[glassNeon, styles.summaryCard]}>
          <View style={styles.summaryKcal}>
            <Text style={styles.kcalNum}>{Math.round(totals.calories)}</Text>
            <Text style={styles.kcalUnit}>kcal</Text>
          </View>
          <View style={styles.summaryMacros}>
            <MacroStat label="Proteína" value={totals.proteinG} color={colors.neon} />
            <MacroStat label="Carbos"   value={totals.carbsG}   color={colors.teal} />
            <MacroStat label="Grasas"   value={totals.fatG}     color={colors.orange} />
          </View>
        </View>

        {/* Food items */}
        <Label>Alimentos registrados</Label>

        {items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>No hay nada registrado en esta comida</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={[glass, styles.foodRow]}>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{item.foodName}</Text>
                <View style={styles.inlineMacros}>
                  <Text style={[styles.inlineMacro, { color: colors.neon }]}>{Math.round(item.proteinG)}g P</Text>
                  <Text style={styles.macroDot}>·</Text>
                  <Text style={[styles.inlineMacro, { color: colors.teal }]}>{Math.round(item.carbsG)}g C</Text>
                  <Text style={styles.macroDot}>·</Text>
                  <Text style={[styles.inlineMacro, { color: colors.orange }]}>{Math.round(item.fatG)}g G</Text>
                </View>
              </View>
              <View style={styles.foodRight}>
                <Text style={styles.foodKcal}>{Math.round(item.calories)}</Text>
                <Text style={styles.foodKcalLabel}>kcal</Text>
                <TouchableOpacity onPress={() => confirmRemove(item.id, item.foodName)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Add food button */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Añadir alimento</Text>
        </TouchableOpacity>

        {/* Nutrition breakdown bar chart */}
        {items.length > 0 && (
          <View style={[glass, styles.breakdownCard]}>
            <Label>Distribución de macros</Label>
            <MacroBar label="Proteína"      value={totals.proteinG} max={goals.proteinG} color={colors.neon} />
            <MacroBar label="Carbohidratos" value={totals.carbsG}   max={goals.carbsG}   color={colors.teal} />
            <MacroBar label="Grasas"        value={totals.fatG}     max={goals.fatG}     color={colors.orange} />
          </View>
        )}
      </ScrollView>

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
  );
}

function MacroStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.macroStat}>
      <Text style={[styles.macroStatVal, { color }]}>{Math.round(value * 10) / 10}g</Text>
      <Text style={styles.macroStatLabel}>{label}</Text>
    </View>
  );
}

function MacroBar({ label, value, max, color }: {
  label: string; value: number; max: number; color: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <View style={styles.macroBarRow}>
      <View style={styles.macroBarMeta}>
        <Text style={styles.macroBarLabel}>{label}</Text>
        <Text style={[styles.macroBarValue, { color }]}>
          {Math.round(value * 10) / 10}g / {max}g
        </Text>
      </View>
      <ProgressBar pct={pct} color={color} h={6} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  backText: { fontSize: 20, color: colors.muted },
  mealIcon: { fontSize: 22 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  summaryCard: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  summaryKcal: { alignItems: 'center', minWidth: 70 },
  kcalNum: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    lineHeight: 44,
  },
  kcalUnit: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  summaryMacros: { flex: 1, gap: 4 },
  macroStat: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macroStatVal: { fontSize: 14, fontFamily: 'SpaceGrotesk_600SemiBold' },
  macroStatLabel: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  foodRow: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 14, gap: 12 },
  foodInfo: { flex: 1, gap: 2 },
  foodName: {
    fontSize: 15,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
    fontWeight: '500',
  },
  inlineMacros: { flexDirection: 'row', gap: 4, alignItems: 'center', marginTop: 2 },
  inlineMacro: { fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold' },
  macroDot: { fontSize: 11, color: colors.dim },
  foodRight: { alignItems: 'flex-end', gap: 2 },
  foodKcal: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  foodKcalLabel: { fontSize: 10, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  removeBtn: {
    marginTop: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { fontSize: 11, color: colors.orange },
  addBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderAccent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 15,
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  emptyWrap: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontSize: 14, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  breakdownCard: { padding: 14, paddingHorizontal: 16, gap: 10 },
  macroBarRow: { gap: 5 },
  macroBarMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  macroBarLabel: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  macroBarValue: { fontSize: 13, fontFamily: 'SpaceGrotesk_600SemiBold' },
});
