import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, glass } from '@/constants/colors';

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

export default function FoodSearchScreen() {
  const params = useLocalSearchParams<{ meal: string; date?: string }>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const items = await searchOpenFoodFacts(query);
        setResults(items);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function selectFood(item: FoodItem) {
    router.push({
      pathname: '/nutrition/add-food',
      params: {
        data: JSON.stringify(item),
        meal: params.meal,
        date: params.date ?? new Date().toISOString().slice(0, 10),
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Buscar alimento</Text>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => router.push({ pathname: '/nutrition/scanner', params: { meal: params.meal, date: params.date } })}
        >
          <Text style={styles.scanIcon}>📷</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.input}
          placeholder="Avena, pollo, yogurt..."
          placeholderTextColor={colors.dim}
          autoFocus
          selectionColor={colors.neon}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {loading && <ActivityIndicator style={styles.spinner} color={colors.neon} size="small" />}
      </View>

      {!searched && (
        <View style={styles.hintWrap}>
          <Text style={styles.hintTitle}>Base de datos global</Text>
          <Text style={styles.hint}>
            Buscá cualquier alimento por nombre o marca.{'\n'}Más de 2 millones de productos — Open Food Facts.
          </Text>
        </View>
      )}

      {searched && !loading && results.length === 0 && (
        <View style={styles.hintWrap}>
          <Text style={styles.hint}>Sin resultados para "{query}".{'\n'}Probá en inglés o con otra ortografía.</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity style={[glass, styles.item]} onPress={() => selectFood(item)} activeOpacity={0.75}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              {item.brand ? <Text style={styles.itemBrand}>{item.brand}</Text> : null}
              <Text style={styles.itemMacros}>
                P {item.proteinPer100g}g · C {item.carbsPer100g}g · G {item.fatPer100g}g /100g
              </Text>
            </View>
            <View style={styles.itemKcalWrap}>
              <Text style={styles.itemKcal}>{item.kcalPer100g}</Text>
              <Text style={styles.itemKcalSub}>kcal/100g</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 22, color: colors.text },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  scanBtn: { padding: 4 },
  scanIcon: { fontSize: 22 },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 15,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  spinner: { position: 'absolute', right: 28, top: 12 },
  hintWrap: { paddingHorizontal: 20, paddingTop: 24, alignItems: 'center' },
  hintTitle: { fontSize: 15, fontWeight: '700', color: colors.muted, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 6 },
  hint: { fontSize: 13, color: colors.dim, textAlign: 'center', fontFamily: 'SpaceGrotesk_400Regular', lineHeight: 20 },
  list: { paddingHorizontal: 16, gap: 8, paddingBottom: 40 },
  item: { padding: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemName: { fontSize: 14, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 2 },
  itemBrand: { fontSize: 11, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', marginBottom: 2 },
  itemMacros: { fontSize: 11, color: colors.dim, fontFamily: 'SpaceGrotesk_400Regular' },
  itemKcalWrap: { alignItems: 'center' },
  itemKcal: { fontSize: 18, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold' },
  itemKcalSub: { fontSize: 9, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
});
