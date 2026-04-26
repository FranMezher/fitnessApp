import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass } from '@/constants/colors';
import { Ring } from '@/components/ui/Ring';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GlassCard } from '@/components/ui/GlassCard';

const MEALS = [
  { meal: 'Desayuno', kcal: 420, items: ['Avena + plátano', 'Café c/ leche'], done: true },
  { meal: 'Almuerzo', kcal: 580, items: ['Arroz + pollo', 'Ensalada verde'], done: true },
  { meal: 'Merienda', kcal: null, items: [], done: false },
  { meal: 'Cena', kcal: null, items: [], done: false },
];

const MACROS = [
  { name: 'Proteína', pct: 60, color: colors.neon },
  { name: 'Carbos', pct: 67, color: colors.teal },
  { name: 'Grasas', pct: 58, color: colors.orange },
];

export default function NutritionScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nutrición</Text>
          <View style={styles.dayPicker}>
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
                <View style={styles.macroHeader}>
                  <Text style={styles.macroName}>{m.name}</Text>
                  <Text style={[styles.macroPct, { color: m.color }]}>{m.pct}%</Text>
                </View>
                <ProgressBar pct={m.pct} color={m.color} h={4} />
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Meals */}
        {MEALS.map((m) => (
          <View
            key={m.meal}
            style={[glass, styles.mealCard, !m.done && styles.mealDim]}
          >
            <View style={styles.mealHeader}>
              <Text style={[styles.mealTitle, !m.done && styles.mealTitleDim]}>{m.meal}</Text>
              {m.kcal ? (
                <Text style={styles.mealKcal}>{m.kcal} kcal</Text>
              ) : (
                <TouchableOpacity onPress={() => router.push('/nutrition/pantry')}>
                  <Text style={styles.addText}>+ Añadir</Text>
                </TouchableOpacity>
              )}
            </View>
            {m.items.map((it) => (
              <Text key={it} style={styles.mealItem}>· {it}</Text>
            ))}
          </View>
        ))}

        {/* Pantry CTA */}
        <TouchableOpacity
          style={styles.pantryBtn}
          onPress={() => router.push('/nutrition/pantry')}
          activeOpacity={0.8}
        >
          <Text style={styles.pantryBtnText}>✦ Modo Despensa</Text>
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
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  dayPicker: {
    ...glass,
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
  macroRow: {
    gap: 3,
  },
  macroHeader: {
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
  mealCard: {
    padding: 12,
    paddingHorizontal: 14,
  },
  mealDim: {
    opacity: 0.65,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mealTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  mealTitleDim: {
    color: colors.muted,
    fontWeight: '400',
  },
  mealKcal: {
    fontSize: 14,
    color: colors.neon,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  addText: {
    fontSize: 13,
    color: colors.orange,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  mealItem: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  pantryBtn: {
    backgroundColor: 'rgba(204,255,0,0.07)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: 50,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  pantryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
});
