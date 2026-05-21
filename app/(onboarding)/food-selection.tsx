import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { HudBackground } from '@/components/ui/HudBackground';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Btn } from '@/components/ui/Btn';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

const TOTAL_STEPS = 10;
const STEP = 8;

type FoodCategory = {
  name: string;
  color: string;
  items: { label: string; icon: string }[];
};

const CATEGORIES: FoodCategory[] = [
  {
    name: 'PROTEÍNAS',
    color: colors.neon,
    items: [
      { label: 'Huevos',    icon: 'egg-outline' },
      { label: 'Pechuga',   icon: 'restaurant-outline' },
      { label: 'Salmón',    icon: 'fish-outline' },
      { label: 'Tofu',      icon: 'leaf-outline' },
      { label: 'Atún',      icon: 'fish-outline' },
      { label: 'Pavo',      icon: 'restaurant-outline' },
    ],
  },
  {
    name: 'CARBOHIDRATOS',
    color: colors.orange,
    items: [
      { label: 'Avena',     icon: 'cafe-outline' },
      { label: 'Arroz',     icon: 'restaurant-outline' },
      { label: 'Batata',    icon: 'leaf-outline' },
      { label: 'Quinua',    icon: 'nutrition-outline' },
      { label: 'Pan',       icon: 'pizza-outline' },
      { label: 'Pasta',     icon: 'restaurant-outline' },
    ],
  },
  {
    name: 'GRASAS',
    color: colors.teal,
    items: [
      { label: 'Aguacate',  icon: 'leaf-outline' },
      { label: 'Aceite Oliva', icon: 'water-outline' },
      { label: 'Almendras', icon: 'ellipse-outline' },
      { label: 'Nueces',    icon: 'ellipse-outline' },
    ],
  },
  {
    name: 'LÁCTEOS',
    color: colors.purple,
    items: [
      { label: 'Leche',     icon: 'water-outline' },
      { label: 'Yogurt',    icon: 'cafe-outline' },
      { label: 'Queso',     icon: 'restaurant-outline' },
    ],
  },
  {
    name: 'FRUTAS',
    color: colors.orange,
    items: [
      { label: 'Banana',    icon: 'ellipse-outline' },
      { label: 'Manzana',   icon: 'ellipse-outline' },
      { label: 'Arándanos', icon: 'ellipse-outline' },
      { label: 'Naranja',   icon: 'ellipse-outline' },
    ],
  },
];

const MIN_SELECTIONS = 4;
const EMPTY_FOODS: string[] = [];

export default function FoodSelectionScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';

  const stored = useOnboardingStore((s) => s.data.availableFoods ?? EMPTY_FOODS);
  const setStore = useOnboardingStore((s) => s.set);
  const { token } = useAuthStore();

  const [selected, setSelected] = useState<Set<string>>(new Set(stored));
  const [query, setQuery] = useState('');

  const progress = STEP / TOTAL_STEPS;

  const filteredCategories = useMemo(() => {
    if (!query.trim()) return CATEGORIES;
    const q = query.toLowerCase();
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => item.label.toLowerCase().includes(q)),
    })).filter((cat) => cat.items.length > 0);
  }, [query]);

  function toggleFood(label: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  async function handleContinue() {
    if (selected.size < MIN_SELECTIONS) {
      Alert.alert('Selección mínima', `Seleccioná al menos ${MIN_SELECTIONS} alimentos para continuar.`);
      return;
    }

    const foods = Array.from(selected);
    setStore({ availableFoods: foods });

    if (isEdit) {
      if (token) {
        await api.upsertProfile(token, { availableFoods: foods }).catch(() => {});
      }
      router.back();
      return;
    }

    router.push('/(onboarding)/meal-planning' as never);
  }

  const canContinue = selected.size >= MIN_SELECTIONS;

  return (
    <HudBackground style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <OnboardingShell
          step={STEP}
          totalSteps={TOTAL_STEPS}
          progress={progress}
          onClose={() => router.back()}
        >
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Tu despensa</Text>
            <Text style={styles.subtitle}>
              Seleccioná los ingredientes que solés tener disponibles para personalizar tus planes.
            </Text>

            {/* Search */}
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={18} color={colors.muted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar ingredientes..."
                placeholderTextColor={colors.dim}
                value={query}
                onChangeText={setQuery}
                selectionColor={colors.neon}
              />
            </View>

            {/* Counter */}
            <View style={styles.counterRow}>
              <Text style={styles.counterLabel}>SELECCIONADOS</Text>
              <Text style={[styles.counterValue, { color: canContinue ? colors.neon : colors.muted }]}>
                {selected.size}
              </Text>
            </View>

            {filteredCategories.map((cat) => (
              <View key={cat.name} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.muted }]}>{cat.name}</Text>
                  <View style={[styles.sectionLine, { backgroundColor: cat.color + '33' }]} />
                </View>
                <View style={styles.grid}>
                  {cat.items.map((item) => {
                    const active = selected.has(item.label);
                    return (
                      <TouchableOpacity
                        key={item.label}
                        style={[styles.cell, active && styles.cellActive]}
                        onPress={() => toggleFood(item.label)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={28}
                          color={active ? colors.neon : cat.color}
                        />
                        <Text style={[styles.cellLabel, active && styles.cellLabelActive]}>
                          {item.label}
                        </Text>
                        {active && (
                          <View style={styles.checkDot}>
                            <Ionicons name="checkmark" size={10} color={colors.bg} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            <View style={styles.btnWrap}>
              <Btn onPress={handleContinue} disabled={!canContinue}>
                {isEdit ? 'Guardar' : 'Continuar'}
              </Btn>
            </View>
          </ScrollView>
        </OnboardingShell>
      </SafeAreaView>
    </HudBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, paddingTop: 8, paddingBottom: 40, gap: spacing.lg },
  title: { ...text.heroMd, color: colors.text },
  subtitle: { ...text.bodyMd, color: colors.muted, marginTop: -8 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchIcon: { marginRight: -4 },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  counterLabel: { ...text.labelCaps, color: colors.muted },
  counterValue: { ...text.dataMono, fontSize: 16 },
  section: { gap: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: { ...text.labelCaps },
  sectionLine: { flex: 1, height: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    position: 'relative',
  },
  cellActive: {
    backgroundColor: 'rgba(204,255,0,0.08)',
    borderColor: 'rgba(204,255,0,0.35)',
  },
  cellLabel: {
    ...text.bodyMd,
    color: colors.text,
    textAlign: 'center',
  },
  cellLabelActive: {
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  checkDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnWrap: { marginTop: 8 },
});
