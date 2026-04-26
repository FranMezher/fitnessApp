import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Pill } from '@/components/ui/Pill';
import { Btn } from '@/components/ui/Btn';
import { GlassCard } from '@/components/ui/GlassCard';

const PANTRY_ITEMS = [
  { name: 'Huevos', qty: '6 uds', p: '36g', c: '2g', g: '30g' },
  { name: 'Pechuga de pollo', qty: '300g', p: '63g', c: '0g', g: '6g' },
  { name: 'Arroz integral', qty: '200g', p: '7g', c: '76g', g: '2g' },
  { name: 'Espinacas', qty: '100g', p: '2g', c: '1g', g: '0g' },
];

export default function PantryScreen() {
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

        {/* Ingredient list */}
        {PANTRY_ITEMS.map((item) => (
          <View key={item.name} style={[glass, styles.ingredientRow]}>
            <View>
              <Text style={styles.ingredientName}>{item.name}</Text>
              <Text style={styles.ingredientQty}>{item.qty}</Text>
            </View>
            <View style={styles.macros}>
              <Text style={[styles.macroText, { color: colors.neon }]}>{item.p}P </Text>
              <Text style={[styles.macroText, { color: colors.teal }]}>{item.c}C </Text>
              <Text style={[styles.macroText, { color: colors.orange }]}>{item.g}G</Text>
            </View>
          </View>
        ))}

        {/* Add ingredient */}
        <TouchableOpacity style={styles.addRow}>
          <Text style={styles.addText}>+ Escanear o añadir ingrediente</Text>
        </TouchableOpacity>

        <Btn>✦ Generar recetas con IA</Btn>

        {/* Recipe card */}
        <GlassCard variant="neon" style={styles.recipeCard}>
          <Pill color={colors.neon}>RECETA · 520 KCAL</Pill>
          <Text style={styles.recipeTitle}>Bowl Proteico Pollo + Arroz</Text>
          <Text style={styles.recipeMacros}>35g P · 60g C · 8g G · ~20 min</Text>
          <View style={styles.recipeActions}>
            <TouchableOpacity style={styles.recipeSecondaryBtn}>
              <Text style={styles.recipeSecondaryText}>Ver receta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.recipePrimaryBtn}>
              <Text style={styles.recipePrimaryText}>Registrar</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
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
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  backText: {
    fontSize: 20,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  sub: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 14,
  },
  ingredientName: {
    fontSize: 15,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  ingredientQty: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  macros: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    lineHeight: 18,
  },
  addRow: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.dim,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    marginVertical: 4,
  },
  addText: {
    fontSize: 13,
    color: colors.dim,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  recipeCard: {
    padding: 14,
    gap: 4,
    marginTop: 2,
  },
  recipeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginTop: 5,
  },
  recipeMacros: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginBottom: 6,
  },
  recipeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  recipeSecondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  recipeSecondaryText: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  recipePrimaryBtn: {
    flex: 1,
    backgroundColor: colors.neon,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  recipePrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
});
