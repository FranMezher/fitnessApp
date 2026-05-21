import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { useNutritionStore } from '@/stores/useNutritionStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';

interface FoodItem {
  id: string;
  name: string;
  brand: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

const OFF_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

async function searchOpenFoodFacts(query: string): Promise<FoodItem[]> {
  const params = new URLSearchParams({
    search_terms: query,
    json: '1',
    page_size: '20',
    fields: 'code,product_name,brands,nutriments',
    lc: 'es',
  });
  const res = await fetch(`${OFF_URL}?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.products ?? [])
    .filter((p: any) => p.product_name && p.nutriments?.['energy-kcal_100g'] != null)
    .map((p: any) => ({
      id: p.code ?? Math.random().toString(),
      name: p.product_name,
      brand: p.brands ?? '',
      kcalPer100g:    Math.round(p.nutriments['energy-kcal_100g'] ?? 0),
      proteinPer100g: +(p.nutriments['proteins_100g'] ?? 0).toFixed(1),
      carbsPer100g:   +(p.nutriments['carbohydrates_100g'] ?? 0).toFixed(1),
      fatPer100g:     +(p.nutriments['fat_100g'] ?? 0).toFixed(1),
    }));
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch:     'Almuerzo',
  snack:     'Merienda',
  dinner:    'Cena',
};

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export default function FoodSearchScreen() {
  const params = useLocalSearchParams<{ meal: string; date?: string }>();
  const [activeMeal, setActiveMeal] = useState(params.meal ?? 'lunch');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { token } = useAuthStore();
  const { foodLog, addFood } = useNutritionStore();

  const today = params.date ?? new Date().toISOString().slice(0, 10);

  // Recent foods from today's log (unique by name)
  const recentFoods = foodLog
    .filter((e) => e.date === today)
    .filter((e, i, arr) => arr.findIndex((x) => x.foodName === e.foodName) === i)
    .slice(0, 4);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setSearched(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true); setSearched(true);
      try { setResults(await searchOpenFoodFacts(query)); } finally { setLoading(false); }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function selectFood(item: FoodItem) {
    router.push({
      pathname: '/nutrition/add-food',
      params: {
        data: JSON.stringify(item),
        meal: activeMeal,
        date: today,
      },
    });
  }

  async function handleAiSend() {
    if (!aiText.trim() || !token) return;
    setAiLoading(true);
    try {
      const { entries } = await api.parseFoodText(token, aiText);
      for (const e of entries) {
        await addFood({
          date: today,
          mealType: activeMeal as 'breakfast' | 'lunch' | 'snack' | 'dinner',
          foodName: e.foodName,
          calories: Math.round(e.calories),
          proteinG: e.proteinG,
          carbsG:   e.carbsG,
          fatG:     e.fatG,
        });
      }
      router.back();
    } catch {
      // fallback — still allow manual search
    } finally {
      setAiLoading(false);
    }
  }

  async function quickAddRecent(food: typeof recentFoods[0]) {
    await addFood({
      date: today,
      mealType: activeMeal as 'breakfast' | 'lunch' | 'snack' | 'dinner',
      foodName: food.foodName,
      calories: food.calories,
      proteinG: food.proteinG,
      carbsG:   food.carbsG,
      fatG:     food.fatG,
    });
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.neon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FITCORE</Text>
        <Ionicons name="help-circle-outline" size={22} color={colors.muted} />
      </View>

      <FlatList
        data={results}
        keyExtractor={(it) => it.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.content}>
            {/* Meal type selector */}
            <View style={styles.mealSection}>
              <View style={styles.mealRow}>
                <Text style={styles.mealSectionLabel}>Categoría de comida</Text>
                <Text style={styles.mealTime}>
                  {new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.mealPills}>
                {MEAL_TYPES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.mealPill, activeMeal === m && styles.mealPillActive]}
                    onPress={() => setActiveMeal(m)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.mealPillText, activeMeal === m && styles.mealPillTextActive]}>
                      {MEAL_LABELS[m]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* AI Input */}
            <View style={styles.aiCard}>
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={18} color={colors.neon} />
                <Text style={styles.aiTitle}>AI INSIGHT LOG</Text>
              </View>
              <View style={styles.aiInputWrap}>
                <TextInput
                  style={styles.aiInput}
                  placeholder="Comí 2 huevos, tostadas con aguacate y un café..."
                  placeholderTextColor={colors.dim}
                  multiline
                  numberOfLines={3}
                  value={aiText}
                  onChangeText={setAiText}
                  selectionColor={colors.neon}
                />
                <View style={styles.aiActions}>
                  <TouchableOpacity style={styles.aiBtn} activeOpacity={0.7}>
                    <Ionicons name="mic-outline" size={20} color={colors.neon} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.aiSendBtn, (!aiText.trim() || aiLoading) && styles.aiBtnDisabled]}
                    onPress={handleAiSend}
                    activeOpacity={0.7}
                    disabled={!aiText.trim() || aiLoading}
                  >
                    {aiLoading
                      ? <ActivityIndicator size="small" color={colors.bg} />
                      : <Ionicons name="send" size={18} color={colors.bg} />
                    }
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.aiPhotoRow}>
                <TouchableOpacity
                  style={styles.aiPhotoBtn}
                  onPress={() => router.push({ pathname: '/nutrition/scanner', params: { meal: activeMeal, date: today } })}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={18} color={colors.neon} />
                  <Text style={styles.aiPhotoBtnText}>FOTO</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.aiPhotoBtn} activeOpacity={0.7}>
                  <Ionicons name="images-outline" size={18} color={colors.neon} />
                  <Text style={styles.aiPhotoBtnText}>GALERÍA</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Manual search */}
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={18} color={colors.muted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar base de datos manual..."
                placeholderTextColor={colors.dim}
                value={query}
                onChangeText={setQuery}
                selectionColor={colors.neon}
                returnKeyType="search"
              />
              {loading
                ? <ActivityIndicator size="small" color={colors.neon} style={styles.searchRight} />
                : (
                  <TouchableOpacity
                    style={styles.searchRight}
                    onPress={() => router.push({ pathname: '/nutrition/scanner', params: { meal: activeMeal, date: today } })}
                  >
                    <Ionicons name="barcode-outline" size={20} color={colors.muted} />
                  </TouchableOpacity>
                )
              }
            </View>

            {/* Recent foods */}
            {!searched && recentFoods.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                  <Text style={styles.recentTitle}>Recientes de hoy</Text>
                  <Text style={styles.recentSub}>Tap para añadir de nuevo</Text>
                </View>
                {recentFoods.map((food) => (
                  <TouchableOpacity
                    key={food.id}
                    style={styles.recentItem}
                    onPress={() => quickAddRecent(food)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.recentIconWrap}>
                      <Ionicons name="restaurant-outline" size={20} color={colors.muted} />
                    </View>
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentName} numberOfLines={1}>{food.foodName}</Text>
                      <Text style={styles.recentMacros}>
                        {Math.round(food.proteinG)}g P · {Math.round(food.fatG)}g G
                      </Text>
                    </View>
                    <View style={styles.recentRight}>
                      <Text style={styles.recentKcal}>{Math.round(food.calories)}</Text>
                      <Text style={styles.recentKcalLabel}>kcal</Text>
                    </View>
                    <TouchableOpacity style={styles.addDot} onPress={() => quickAddRecent(food)}>
                      <Ionicons name="add" size={16} color={colors.neon} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* No results */}
            {searched && !loading && results.length === 0 && (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>
                  Sin resultados para "{query}".{'\n'}Probá en inglés o con otra ortografía.
                </Text>
              </View>
            )}

            {searched && results.length > 0 && (
              <Text style={styles.resultsLabel}>RESULTADOS</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.resultItem} onPress={() => selectFood(item)} activeOpacity={0.75}>
            <View style={styles.resultIconWrap}>
              <Ionicons name="restaurant-outline" size={20} color={colors.muted} />
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.resultMacros}>
                {item.kcalPer100g} kcal · P {item.proteinPer100g}g
                {item.brand ? ` · ${item.brand}` : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.addDot} onPress={() => selectFood(item)}>
              <Ionicons name="add" size={16} color={colors.neon} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(8,8,8,0.9)',
  },
  closeBtn: { padding: 4 },
  headerTitle: { ...text.heroMd, color: colors.neon, fontSize: 22, letterSpacing: -0.5 },
  content: { padding: spacing.lg, gap: spacing.lg },
  mealSection: { gap: spacing.sm },
  mealRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealSectionLabel: { ...text.headlineMd, color: colors.text },
  mealTime: { ...text.dataMono, color: colors.neon },
  mealPills: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  mealPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs - 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  mealPillActive: { backgroundColor: colors.neon, borderColor: colors.neon },
  mealPillText: { ...text.labelSm, color: colors.muted },
  mealPillTextActive: { color: colors.bg, fontFamily: 'SpaceGrotesk_700Bold' },
  aiCard: {
    backgroundColor: 'rgba(204,255,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.35)',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  aiTitle: { ...text.labelCaps, color: colors.neon, letterSpacing: 3 },
  aiInputWrap: { position: 'relative' },
  aiInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    paddingBottom: spacing.xl + 8,
    color: colors.text,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_400Regular',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  aiActions: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  aiBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBtnDisabled: { opacity: 0.4 },
  aiPhotoRow: { flexDirection: 'row', gap: spacing.sm },
  aiPhotoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  aiPhotoBtnText: { ...text.labelSm, color: colors.text, letterSpacing: 1 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  searchRight: { padding: 4 },
  recentSection: { gap: spacing.sm },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentTitle: { ...text.headlineMd, color: colors.text },
  recentSub: { ...text.labelSm, color: colors.neon },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  recentIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInfo: { flex: 1, gap: 2 },
  recentName: { ...text.bodyLg, color: colors.text },
  recentMacros: { ...text.bodyMd, color: colors.muted },
  recentRight: { alignItems: 'flex-end' },
  recentKcal: { ...text.dataMono, color: colors.neon, fontSize: 16 },
  recentKcalLabel: { ...text.labelSm, color: colors.muted, fontSize: 9 },
  addDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { ...text.bodyMd, color: colors.dim, textAlign: 'center', lineHeight: 22 },
  resultsLabel: { ...text.labelCaps, color: colors.muted },
  list: { paddingBottom: 40 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: { flex: 1, gap: 2 },
  resultName: { ...text.headlineMd, color: colors.text, fontSize: 15 },
  resultMacros: { ...text.bodyMd, color: colors.muted },
});
