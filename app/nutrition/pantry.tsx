import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Pill } from '@/components/ui/Pill';
import { Btn } from '@/components/ui/Btn';
import { GlassCard } from '@/components/ui/GlassCard';
import { api, Recipe } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNutritionStore } from '@/stores/useNutritionStore';

const PANTRY_ITEMS = [
  { name: 'Huevos',            quantity: '6 uds',  proteinG: 36, carbsG: 2,  fatG: 30 },
  { name: 'Pechuga de pollo',  quantity: '300g',   proteinG: 63, carbsG: 0,  fatG: 6  },
  { name: 'Arroz integral',    quantity: '200g',   proteinG: 7,  carbsG: 76, fatG: 2  },
  { name: 'Espinacas',         quantity: '100g',   proteinG: 2,  carbsG: 1,  fatG: 0  },
];

export default function PantryScreen() {
  const token = useAuthStore((s) => s.token);
  const profile = useAuthStore((s) => s.profile);
  const foodLog = useNutritionStore((s) => s.foodLog);
  const addFood = useNutritionStore((s) => s.addFood);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

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

  async function handleGenerate() {
    if (!token) return;
    setLoading(true);
    setRecipes([]);
    try {
      const { recipes: generated } = await api.generateRecipes(token, {
        ingredients: PANTRY_ITEMS,
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
    if (!token) return;
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
        {PANTRY_ITEMS.map((item) => (
          <View key={item.name} style={[glass, styles.ingredientRow]}>
            <View>
              <Text style={styles.ingredientName}>{item.name}</Text>
              <Text style={styles.ingredientQty}>{item.quantity}</Text>
            </View>
            <View style={styles.macros}>
              <Text style={[styles.macroText, { color: colors.neon }]}>{item.proteinG}g P </Text>
              <Text style={[styles.macroText, { color: colors.teal }]}>{item.carbsG}g C </Text>
              <Text style={[styles.macroText, { color: colors.orange }]}>{item.fatG}g G</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addRow}>
          <Text style={styles.addText}>+ Escanear o añadir ingrediente</Text>
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
