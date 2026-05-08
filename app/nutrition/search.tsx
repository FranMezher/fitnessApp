import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, glass } from '@/constants/colors';
import { Pill } from '@/components/ui/Pill';

interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  serving: string;
}

const RECENT: FoodItem[] = [
  { id: 'r1', name: 'Avena integral', brand: 'Quaker', calories: 379, proteinG: 14, carbsG: 67, fatG: 6, serving: '100g' },
  { id: 'r2', name: 'Pechuga de pollo', calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6, serving: '100g' },
  { id: 'r3', name: 'Plátano', calories: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3, serving: '1 unidad (120g)' },
  { id: 'r4', name: 'Arroz blanco cocido', calories: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, serving: '100g' },
  { id: 'r5', name: 'Huevo entero', calories: 155, proteinG: 13, carbsG: 1.1, fatG: 11, serving: '1 unidad (50g)' },
];

const SEARCH_DB: FoodItem[] = [
  ...RECENT,
  { id: 's1', name: 'Leche desnatada', brand: 'Central Lechera', calories: 35, proteinG: 3.4, carbsG: 5, fatG: 0.1, serving: '100ml' },
  { id: 's2', name: 'Yogur griego natural', brand: 'Danone', calories: 97, proteinG: 10, carbsG: 3.8, fatG: 5, serving: '100g' },
  { id: 's3', name: 'Salmón al horno', calories: 208, proteinG: 20, carbsG: 0, fatG: 13, serving: '100g' },
  { id: 's4', name: 'Brócoli cocido', calories: 35, proteinG: 2.4, carbsG: 7, fatG: 0.4, serving: '100g' },
  { id: 's5', name: 'Almendras crudas', calories: 576, proteinG: 21, carbsG: 22, fatG: 49, serving: '100g' },
  { id: 's6', name: 'Proteína Whey Chocolate', brand: 'Myprotein', calories: 390, proteinG: 80, carbsG: 7, fatG: 5, serving: '100g (1 scoop≈30g)' },
  { id: 's7', name: 'Pan integral', calories: 247, proteinG: 9, carbsG: 48, fatG: 2, serving: '100g' },
  { id: 's8', name: 'Aceite de oliva', calories: 884, proteinG: 0, carbsG: 0, fatG: 100, serving: '100ml' },
];

export default function FoodSearchScreen() {
  const { meal } = useLocalSearchParams<{ meal: string }>();
  const [query, setQuery] = useState('');

  const results = query.length >= 2
    ? SEARCH_DB.filter((f) =>
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.brand?.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  const showRecent = query.length < 2;

  function onSelect(food: FoodItem) {
    router.push({
      pathname: '/nutrition/add-food',
      params: { foodId: food.id, meal: meal ?? 'lunch', data: JSON.stringify(food) },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar alimento..."
            placeholderTextColor={colors.dim}
            value={query}
            onChangeText={setQuery}
            autoFocus
            selectionColor={colors.neon}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Scanner shortcut */}
      <TouchableOpacity
        style={styles.scannerRow}
        onPress={() => router.push({ pathname: '/nutrition/scanner', params: { meal } })}
        activeOpacity={0.7}
      >
        <Text style={styles.scannerIcon}>▣</Text>
        <Text style={styles.scannerText}>Escanear código de barras</Text>
        <Text style={styles.scannerArrow}>›</Text>
      </TouchableOpacity>

      {/* Section label */}
      <Text style={styles.sectionLabel}>
        {showRecent ? 'Recientes' : `${results.length} resultados`}
      </Text>

      <FlatList
        data={showRecent ? RECENT : results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => <FoodRow item={item} onPress={() => onSelect(item)} />}
        ListEmptyComponent={
          query.length >= 2
            ? <Text style={styles.emptyText}>Sin resultados para "{query}"</Text>
            : null
        }
      />
    </SafeAreaView>
  );
}

function FoodRow({ item, onPress }: { item: FoodItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={[glass, styles.foodRow]} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        {item.brand && <Text style={styles.foodBrand}>{item.brand}</Text>}
        <Text style={styles.foodServing}>{item.serving}</Text>
      </View>
      <View style={styles.foodRight}>
        <Text style={styles.foodKcal}>{item.calories}</Text>
        <Text style={styles.foodKcalLabel}>kcal</Text>
        <View style={styles.macroRow}>
          <Text style={[styles.macro, { color: colors.neon }]}>{item.proteinG}g</Text>
          <Text style={[styles.macro, { color: colors.teal }]}>{item.carbsG}g</Text>
          <Text style={[styles.macro, { color: colors.orange }]}>{item.fatG}g</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    paddingBottom: 8,
  },
  backBtn: {
    padding: 4,
  },
  backText: {
    fontSize: 20,
    color: colors.muted,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIcon: {
    fontSize: 15,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 10,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  clearText: {
    color: colors.muted,
    fontSize: 14,
    padding: 4,
  },
  scannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: 'rgba(204,255,0,0.05)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
  },
  scannerIcon: {
    fontSize: 18,
    color: colors.neon,
  },
  scannerText: {
    flex: 1,
    fontSize: 14,
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  scannerArrow: {
    color: colors.neon,
    fontSize: 18,
  },
  sectionLabel: {
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 6,
  },
  separator: {
    height: 0,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  foodInfo: {
    flex: 1,
    gap: 2,
  },
  foodName: {
    fontSize: 15,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
    fontWeight: '500',
  },
  foodBrand: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  foodServing: {
    fontSize: 11,
    color: colors.dim,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  foodRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  foodKcal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    lineHeight: 20,
  },
  foodKcalLabel: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  macro: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 14,
    marginTop: 40,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
});
