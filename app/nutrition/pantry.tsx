import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Pill } from '@/components/ui/Pill';
import { Btn } from '@/components/ui/Btn';
import { GlassCard } from '@/components/ui/GlassCard';
import { api, Recipe } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNutritionStore } from '@/stores/useNutritionStore';

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
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addQty, setAddQty] = useState('');
  const [addUnit, setAddUnit] = useState('g');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetchPantry();
  }, []);

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
    proteinG: Math.max(0, (profile?.targetProteinG ?? 150)  - consumed.proteinG),
    carbsG:   Math.max(0, (profile?.targetCarbsG  ?? 200)   - consumed.carbsG),
    fatG:     Math.max(0, (profile?.targetFatG    ?? 65)    - consumed.fatG),
  };

  async function handleAddItem() {
    if (!addName.trim() || !addQty.trim()) return;
    setAddLoading(true);
    try {
      await addPantryItem({
        foodName: addName.trim(),
        quantity: parseFloat(addQty) || 1,
        unit: addUnit.trim() || 'g',
      });
      setAddName('');
      setAddQty('');
      setAddUnit('g');
      setShowAdd(false);
    } catch {
      Alert.alert('Error', 'No se pudo agregar el ingrediente');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleGenerate() {
    if (!token) {
      Alert.alert('Sesión expirada', 'Iniciá sesión nuevamente');
      router.replace('/(auth)/login');
      return;
    }
    if (pantryItems.length === 0) {
      Alert.alert('Despensa vacía', 'Añadí ingredientes primero');
      return;
    }
    setLoading(true);
    setRecipes([]);
    try {
      const { recipes: generated } = await api.generateRecipes(token, {
        ingredients: pantryItems.map((i) => ({
          name: i.foodName,
          quantity: `${i.quantity} ${i.unit}`,
          proteinG: i.proteinG,
          carbsG: i.carbsG,
          fatG: i.fatG,
        })),
        remainingMacros,
      });
      setRecipes(generated);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudieron generar recetas');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(recipe: Recipe) {
    if (!token) {
      Alert.alert('Sesión expirada', 'Iniciá sesión nuevamente');
      router.replace('/(auth)/login');
      return;
    }
    try {
      await addFood({
        foodName: recipe.name,
        calories: recipe.calories,
        proteinG: recipe.proteinG,
        carbsG:   recipe.carbsG,
        fatG:     recipe.fatG,
        mealType: 'snack',
        date:     today,
      });
      Alert.alert('Registrado', `${recipe.name} añadido al log de hoy`);
    } catch {
      Alert.alert('Error', 'No se pudo registrar la receta');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Modo Despensa</Text>
            <Text style={styles.sub}>¿Qué tienes en casa?</Text>
          </View>
        </View>

        {/* Remaining macros */}
        <View style={[glass, styles.macroSummary]}>
          <Text style={styles.macroSummaryTitle}>Macros restantes hoy</Text>
          <View style={styles.macroRow}>
            <Text style={[styles.macroChip, { color: colors.orange }]}>{remainingMacros.calories} kcal</Text>
            <Text style={[styles.macroChip, { color: colors.neon }]}>{remainingMacros.proteinG}g P</Text>
            <Text style={[styles.macroChip, { color: colors.teal }]}>{remainingMacros.carbsG}g C</Text>
            <Text style={[styles.macroChip, { color: colors.muted }]}>{remainingMacros.fatG}g G</Text>
          </View>
        </View>

        {/* Ingredient list */}
        {pantryItems.length === 0 && !showAdd && (
          <View style={[glass, styles.emptyPantry]}>
            <Text style={styles.emptyText}>Tu despensa está vacía. Añadí ingredientes para generar recetas.</Text>
          </View>
        )}
        {pantryItems.map((item) => (
          <View key={item.id} style={[glass, styles.ingredientRow]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ingredientName}>{item.foodName}</Text>
              <Text style={styles.ingredientQty}>{item.quantity} {item.unit}</Text>
            </View>
            <View style={styles.macros}>
              {item.proteinG != null && <Text style={[styles.macroText, { color: colors.neon }]}>{item.proteinG}g P </Text>}
              {item.carbsG != null && <Text style={[styles.macroText, { color: colors.teal }]}>{item.carbsG}g C </Text>}
              {item.fatG != null && <Text style={[styles.macroText, { color: colors.orange }]}>{item.fatG}g G </Text>}
              <TouchableOpacity onPress={() => deletePantryItem(item.id)} hitSlop={8}>
                <Text style={styles.deleteBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {showAdd && (
          <View style={[glass, styles.addForm]}>
            <TextInput
              style={styles.addInput}
              placeholder="Nombre (ej: Pollo)"
              placeholderTextColor={colors.dim}
              value={addName}
              onChangeText={setAddName}
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
                style={[styles.addInput, { width: 60 }]}
                placeholder="Und"
                placeholderTextColor={colors.dim}
                value={addUnit}
                onChangeText={setAddUnit}
              />
            </View>
            <View style={styles.addFormBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAdd(false); setAddName(''); setAddQty(''); setAddUnit('g'); }}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, (!addName.trim() || !addQty.trim()) && { opacity: 0.5 }]}
                onPress={handleAddItem}
                disabled={addLoading || !addName.trim() || !addQty.trim()}
              >
                <Text style={styles.confirmText}>{addLoading ? '...' : 'Añadir'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.addRow} onPress={() => setShowAdd(true)}>
          <Text style={styles.addText}>+ Añadir ingrediente</Text>
        </TouchableOpacity>

        <Btn onPress={handleGenerate} disabled={loading}>
          {loading ? '⏳ Generando...' : '✦ Generar recetas con IA'}
        </Btn>

        {loading && <ActivityIndicator color={colors.neon} style={{ marginTop: 8 }} />}

        {/* Recipe cards */}
        {recipes.map((recipe, idx) => (
          <GlassCard key={idx} variant="neon" style={styles.recipeCard}>
            <Pill color={colors.neon}>RECETA · {recipe.calories} KCAL</Pill>
            <Text style={styles.recipeTitle}>{recipe.name}</Text>
            <Text style={styles.recipeMacros}>
              {recipe.proteinG}g P · {recipe.carbsG}g C · {recipe.fatG}g G · ~{recipe.prepMinutes} min
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
              <TouchableOpacity
                style={styles.recipePrimaryBtn}
                onPress={() => handleRegister(recipe)}
              >
                <Text style={styles.recipePrimaryText}>Registrar</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  backText: { fontSize: 20, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  title: { fontSize: 18, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold' },
  sub: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  macroSummary: { padding: 12, paddingHorizontal: 14, gap: 6 },
  macroSummaryTitle: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_600SemiBold', letterSpacing: 1, textTransform: 'uppercase' },
  macroRow: { flexDirection: 'row', gap: 12 },
  macroChip: { fontSize: 13, fontFamily: 'SpaceGrotesk_600SemiBold' },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, paddingHorizontal: 14 },
  ingredientName: { fontSize: 15, color: colors.text, fontFamily: 'SpaceGrotesk_400Regular' },
  ingredientQty: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  macros: { flexDirection: 'row', alignItems: 'center' },
  macroText: { fontSize: 12, fontFamily: 'SpaceGrotesk_600SemiBold', lineHeight: 18 },
  emptyPantry: { padding: 16, alignItems: 'center' },
  emptyText: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', textAlign: 'center' },
  deleteBtn: { fontSize: 12, color: colors.dim, paddingHorizontal: 4 },
  addForm: { padding: 12, gap: 8 },
  addInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  addRow2: { flexDirection: 'row', gap: 8 },
  addFormBtns: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cancelBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 8, alignItems: 'center' },
  cancelText: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  confirmBtn: { flex: 1, backgroundColor: colors.neon, borderRadius: 10, padding: 8, alignItems: 'center' },
  confirmText: { fontSize: 13, fontWeight: '700', color: '#111', fontFamily: 'SpaceGrotesk_700Bold' },
  addRow: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.dim, borderRadius: 16, padding: 10, alignItems: 'center', marginVertical: 4 },
  addText: { fontSize: 13, color: colors.dim, fontFamily: 'SpaceGrotesk_400Regular' },
  recipeCard: { padding: 14, gap: 4, marginTop: 2 },
  recipeTitle: { fontSize: 17, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold', marginTop: 5 },
  recipeMacros: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', marginBottom: 6 },
  recipeInstructions: { fontSize: 13, color: colors.text, fontFamily: 'SpaceGrotesk_400Regular', lineHeight: 20, marginBottom: 6 },
  recipeActions: { flexDirection: 'row', gap: 8 },
  recipeSecondaryBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 8, alignItems: 'center' },
  recipeSecondaryText: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  recipePrimaryBtn: { flex: 1, backgroundColor: colors.neon, borderRadius: 10, padding: 8, alignItems: 'center' },
  recipePrimaryText: { fontSize: 13, fontWeight: '700', color: '#111', fontFamily: 'SpaceGrotesk_700Bold' },
});
