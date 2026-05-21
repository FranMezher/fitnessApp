import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, glassNeon, glowShadows } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { HudBackground } from '@/components/ui/HudBackground';
import { api, Recipe } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNutritionStore } from '@/stores/useNutritionStore';

const CATEGORIES = ['Todos', 'Proteínas', 'Verduras', 'Carbos', 'Lácteos'];

export default function PantryScreen() {
  const token = useAuthStore((s) => s.token);
  const profile = useAuthStore((s) => s.profile);
  const foodLog = useNutritionStore((s) => s.foodLog);
  const addFood = useNutritionStore((s) => s.addFood);
  const pantryItems = useNutritionStore((s) => s.pantryItems);
  const fetchPantry = useNutritionStore((s) => s.fetchPantry);
  const addPantryItem = useNutritionStore((s) => s.addPantryItem);
  const deletePantryItem = useNutritionStore((s) => s.deletePantryItem);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addQty, setAddQty] = useState('');
  const [addUnit, setAddUnit] = useState('g');
  const [addLoading, setAddLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');

  useEffect(() => { fetchPantry(); }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayLog = foodLog.filter((e) => e.date === today);
  const consumed = {
    calories: todayLog.reduce((s, e) => s + e.calories, 0),
    proteinG: todayLog.reduce((s, e) => s + e.proteinG, 0),
    carbsG:   todayLog.reduce((s, e) => s + e.carbsG, 0),
    fatG:     todayLog.reduce((s, e) => s + e.fatG, 0),
  };
  const remainingMacros = {
    calories: Math.max(0, (profile?.targetCalories ?? 2000) - consumed.calories),
    proteinG: Math.max(0, (profile?.targetProteinG ?? 150) - consumed.proteinG),
    carbsG:   Math.max(0, (profile?.targetCarbsG  ?? 200) - consumed.carbsG),
    fatG:     Math.max(0, (profile?.targetFatG    ?? 65)  - consumed.fatG),
  };

  const filteredItems = useMemo(() => {
    let items = pantryItems;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((i) => i.foodName.toLowerCase().includes(q));
    }
    return items;
  }, [pantryItems, search]);

  const activeItems = selectedIds.length > 0
    ? pantryItems.filter((i) => selectedIds.includes(i.id))
    : pantryItems;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleAddItem() {
    if (!addName.trim() || !addQty.trim()) return;
    setAddLoading(true);
    try {
      await addPantryItem({ foodName: addName.trim(), quantity: parseFloat(addQty) || 1, unit: addUnit.trim() || 'g' });
      setAddName(''); setAddQty(''); setAddUnit('g'); setShowAdd(false);
    } catch {
      Alert.alert('Error', 'No se pudo agregar el ingrediente');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleGenerate() {
    if (!token) { Alert.alert('Sesión expirada', 'Iniciá sesión nuevamente'); router.replace('/(auth)/login'); return; }
    if (activeItems.length === 0) { Alert.alert('Despensa vacía', 'Añadí ingredientes primero'); return; }
    setLoading(true); setRecipes([]); setGenerateError(null);
    try {
      const { recipes: generated } = await api.generateRecipes(token, {
        ingredients: activeItems.map((i) => ({ name: i.foodName, quantity: `${i.quantity} ${i.unit}`, proteinG: i.proteinG, carbsG: i.carbsG, fatG: i.fatG })),
        remainingMacros,
      });
      setRecipes(generated);
    } catch (err: any) {
      setGenerateError(err?.message ?? 'No se pudieron generar recetas. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(recipe: Recipe) {
    if (!token) { Alert.alert('Sesión expirada', 'Iniciá sesión nuevamente'); router.replace('/(auth)/login'); return; }
    try {
      await addFood({ foodName: recipe.name, calories: recipe.calories, proteinG: recipe.proteinG, carbsG: recipe.carbsG, fatG: recipe.fatG, mealType: 'snack', date: today });
      Alert.alert('Registrado', `${recipe.name} añadido al log de hoy`);
    } catch {
      Alert.alert('Error', 'No se pudo registrar la receta');
    }
  }

  const canGenerate = pantryItems.length > 0 && !loading;

  return (
    <HudBackground style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* TopAppBar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.logo}>MODO DESPENSA</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Search */}
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={18} color={colors.dim} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar ingredientes..."
                placeholderTextColor={colors.dim}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Category chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, activeFilter === cat && styles.chipActive]}
                  onPress={() => setActiveFilter(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, activeFilter === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Macros restantes */}
            <View style={[glass, styles.macroCard]}>
              <Text style={styles.macroCardTitle}>MACROS RESTANTES HOY</Text>
              <View style={styles.macroCardRow}>
                <View style={styles.macroStat}>
                  <Text style={[styles.macroStatVal, { color: colors.orange }]}>{remainingMacros.calories}</Text>
                  <Text style={styles.macroStatLabel}>KCAL</Text>
                </View>
                <View style={styles.macroStatDivider} />
                <View style={styles.macroStat}>
                  <Text style={[styles.macroStatVal, { color: colors.neon }]}>{remainingMacros.proteinG}g</Text>
                  <Text style={styles.macroStatLabel}>PROT</Text>
                </View>
                <View style={styles.macroStatDivider} />
                <View style={styles.macroStat}>
                  <Text style={[styles.macroStatVal, { color: colors.teal }]}>{remainingMacros.carbsG}g</Text>
                  <Text style={styles.macroStatLabel}>CARB</Text>
                </View>
                <View style={styles.macroStatDivider} />
                <View style={styles.macroStat}>
                  <Text style={[styles.macroStatVal, { color: colors.muted }]}>{remainingMacros.fatG}g</Text>
                  <Text style={styles.macroStatLabel}>GRAS</Text>
                </View>
              </View>
            </View>

            {/* Grid header */}
            <View style={styles.gridHeader}>
              <Text style={styles.gridTitle}>Tu Despensa</Text>
              <Text style={styles.selectedCount}>
                {selectedIds.length > 0 ? `${selectedIds.length} seleccionados` : `${pantryItems.length} ingredientes`}
              </Text>
            </View>

            {/* Ingredient grid */}
            <View style={styles.grid}>
              {filteredItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.gridCell, isSelected ? styles.gridCellSelected : glass]}
                    onPress={() => toggleSelect(item.id)}
                    onLongPress={() => Alert.alert('Eliminar', `¿Eliminar ${item.foodName}?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Eliminar', style: 'destructive', onPress: () => deletePantryItem(item.id) },
                    ])}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.gridIconWrap, isSelected && styles.gridIconWrapSelected]}>
                      <Ionicons name="nutrition-outline" size={22} color={isSelected ? colors.neon : colors.muted} />
                    </View>
                    <Text style={[styles.gridName, isSelected && styles.gridNameSelected]} numberOfLines={1}>
                      {item.foodName.toUpperCase()}
                    </Text>
                    <Text style={styles.gridQty}>{item.quantity}{item.unit}</Text>
                  </TouchableOpacity>
                );
              })}

              {/* Add card */}
              <TouchableOpacity
                style={[styles.gridCell, styles.gridCellAdd]}
                onPress={() => setShowAdd(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={28} color={colors.dim} />
                <Text style={styles.addPlusLabel}>AÑADIR</Text>
              </TouchableOpacity>
            </View>

            {/* Add form */}
            {showAdd && (
              <View style={[glass, styles.addForm]}>
                <Text style={styles.addFormTitle}>Nuevo ingrediente</Text>
                <TextInput
                  style={styles.addInput}
                  placeholder="Nombre (ej: Pollo)"
                  placeholderTextColor={colors.dim}
                  value={addName}
                  onChangeText={setAddName}
                  autoFocus
                />
                <View style={styles.addRow2}>
                  <TextInput
                    style={[styles.addInput, { flex: 1 }]}
                    placeholder="Cantidad"
                    placeholderTextColor={colors.dim}
                    value={addQty}
                    onChangeText={setAddQty}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.addInput, { width: 64 }]}
                    placeholder="Und"
                    placeholderTextColor={colors.dim}
                    value={addUnit}
                    onChangeText={setAddUnit}
                  />
                </View>
                <View style={styles.addFormBtns}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => { setShowAdd(false); setAddName(''); setAddQty(''); setAddUnit('g'); }}
                  >
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, (!addName.trim() || !addQty.trim()) && { opacity: 0.4 }]}
                    onPress={handleAddItem}
                    disabled={addLoading || !addName.trim() || !addQty.trim()}
                  >
                    <Text style={styles.confirmText}>{addLoading ? '...' : 'Añadir'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* AI banner */}
            <View style={[glass, styles.aiBanner]}>
              <View style={styles.aiBannerOverlay} />
              <View style={styles.aiBannerContent}>
                <Text style={styles.aiBannerTag}>POTENCIADO POR FITCORE AI</Text>
                <Text style={styles.aiBannerTitle}>¿Sin ideas para hoy?</Text>
              </View>
            </View>

            {loading && <ActivityIndicator color={colors.neon} style={{ marginTop: spacing.sm }} />}

            {generateError && (
              <View style={styles.errorBanner}>
                <Ionicons name="warning-outline" size={16} color={colors.orange} />
                <Text style={styles.errorText}>{generateError}</Text>
              </View>
            )}

            {/* Recipe cards */}
            {recipes.map((recipe, idx) => (
              <View key={idx} style={[glassNeon, styles.recipeCard]}>
                <View style={styles.recipeHeader}>
                  <Text style={styles.recipeKcalBadge}>{recipe.calories} KCAL</Text>
                  <Text style={styles.recipePrepTime}>~{recipe.prepMinutes} min</Text>
                </View>
                <Text style={styles.recipeTitle}>{recipe.name}</Text>
                <Text style={styles.recipeMacros}>
                  {recipe.proteinG}g P · {recipe.carbsG}g C · {recipe.fatG}g G
                </Text>
                {expandedIdx === idx && (
                  <Text style={styles.recipeInstructions}>{recipe.instructions}</Text>
                )}
                <View style={styles.recipeActions}>
                  <TouchableOpacity
                    style={styles.recipeSecondaryBtn}
                    onPress={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  >
                    <Text style={styles.recipeSecondaryText}>
                      {expandedIdx === idx ? 'Ocultar' : 'Ver receta'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.recipePrimaryBtn} onPress={() => handleRegister(recipe)}>
                    <Text style={styles.recipePrimaryText}>Registrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={{ height: 80 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Fixed generate button */}
        <View style={styles.fixedBottom}>
          <TouchableOpacity
            style={[styles.generateBtn, !canGenerate && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={!canGenerate}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.bg} size="small" />
            ) : (
              <>
                <Ionicons name="flash" size={18} color={colors.bg} />
                <Text style={styles.generateBtnText}>Generar Sugerencias con IA</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </HudBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 56,
    backgroundColor: 'rgba(8,8,8,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  logo: { ...text.headlineMd, color: colors.neon, fontSize: 14, letterSpacing: 2 },

  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, ...text.bodyMd, color: colors.text },

  chipsRow: { gap: spacing.xs, paddingBottom: 2 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: 'rgba(204,255,0,0.08)', borderColor: 'rgba(204,255,0,0.35)' },
  chipText: { ...text.labelSm, color: colors.muted },
  chipTextActive: { color: colors.neon },

  macroCard: { padding: spacing.md, borderRadius: radius.lg },
  macroCardTitle: { ...text.labelSm, color: colors.muted, marginBottom: spacing.sm },
  macroCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  macroStat: { flex: 1, alignItems: 'center', gap: 2 },
  macroStatVal: { ...text.headlineMd, fontSize: 17 },
  macroStatLabel: { ...text.labelSm, color: colors.dim },
  macroStatDivider: { width: 1, height: 28, backgroundColor: colors.border },

  gridHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gridTitle: { ...text.headlineMd, color: colors.text },
  selectedCount: { ...text.dataMono, color: colors.neon, fontSize: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridCell: {
    width: '47%',
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 96,
  },
  gridCellSelected: {
    backgroundColor: 'rgba(204,255,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.35)',
    borderRadius: radius.lg,
  },
  gridCellAdd: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  gridIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIconWrapSelected: { backgroundColor: 'rgba(204,255,0,0.12)' },
  gridName: { ...text.labelSm, color: colors.muted, textAlign: 'center' },
  gridNameSelected: { color: colors.neon },
  gridQty: { ...text.labelSm, color: colors.dim, fontSize: 9 },
  addPlusLabel: { ...text.labelSm, color: colors.dim },

  addForm: { padding: spacing.md, borderRadius: radius.lg, gap: spacing.sm },
  addFormTitle: { ...text.headlineMd, color: colors.text },
  addInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...text.bodyMd,
    color: colors.text,
  },
  addRow2: { flexDirection: 'row', gap: spacing.sm },
  addFormBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  cancelBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.md, padding: 10, alignItems: 'center' },
  cancelText: { ...text.bodyMd, color: colors.muted },
  confirmBtn: { flex: 1, backgroundColor: colors.neon, borderRadius: radius.md, padding: 10, alignItems: 'center' },
  confirmText: { ...text.headlineMd, color: '#111', fontSize: 14 },

  aiBanner: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    height: 100,
    justifyContent: 'flex-end',
  },
  aiBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(204,255,0,0.05)',
  },
  aiBannerContent: { padding: spacing.md, gap: 2 },
  aiBannerTag: { ...text.labelSm, color: colors.neon },
  aiBannerTitle: { ...text.headlineMd, color: colors.text },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { ...text.bodyMd, color: colors.orange, flex: 1 },

  recipeCard: { padding: spacing.md, borderRadius: radius.lg, gap: spacing.xs },
  recipeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recipeKcalBadge: { ...text.labelSm, color: colors.neon },
  recipePrepTime: { ...text.dataMono, color: colors.muted, fontSize: 12 },
  recipeTitle: { ...text.headlineMd, color: colors.text },
  recipeMacros: { ...text.bodyMd, color: colors.muted },
  recipeInstructions: { ...text.bodyMd, color: colors.text, lineHeight: 22, marginTop: spacing.xs },
  recipeActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  recipeSecondaryBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 10, alignItems: 'center' },
  recipeSecondaryText: { ...text.bodyMd, color: colors.muted },
  recipePrimaryBtn: { flex: 1, backgroundColor: colors.neon, borderRadius: radius.md, padding: 10, alignItems: 'center' },
  recipePrimaryText: { ...text.headlineMd, color: '#111', fontSize: 14 },

  fixedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(8,8,8,0.9)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  generateBtn: {
    backgroundColor: colors.neon,
    borderRadius: radius.lg,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...glowShadows.neon,
  },
  generateBtnDisabled: { opacity: 0.4 },
  generateBtnText: { ...text.headlineMd, color: colors.bg },
});
