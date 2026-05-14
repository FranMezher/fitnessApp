import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { colors } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

const TOTAL_STEPS = 10;
const STEP = 8;

const PAGES: { title: string; note: string; groups: { name: string; items: string[] }[] }[] = [
  {
    title: 'Lácteos y Frutas',
    note: 'Seleccioná al menos 2 frutas',
    groups: [
      {
        name: 'Bebidas y Lácteos',
        items: ['🥛 Leche', '🍶 Yogurt', '🧀 Queso blanco', '🧀 Queso amarillo', '🌰 Bebida de almendras', '🥛 Leche descremada'],
      },
      {
        name: 'Frutas',
        items: ['🍌 Banana', '🍓 Frutillas', '🍎 Manzana', '🫐 Arándanos', '🍍 Ananá', '🍈 Papaya', '🍊 Mandarina', '🍊 Naranja', '🥝 Kiwi', '🥭 Mango', '🍉 Sandía', '🍐 Pera'],
      },
    ],
  },
  {
    title: 'Grasas Saludables',
    note: 'Seleccioná al menos 2',
    groups: [
      {
        name: 'Grasas',
        items: ['🥑 Palta', '🥜 Maní', '🥜 Manteca de maní', '🌰 Almendras', '🌰 Nueces pecán', '🌰 Castañas de cajú', '🌰 Nueces', '🫒 Aceitunas', '🌱 Chía', '🍫 Chocolate negro'],
      },
    ],
  },
  {
    title: 'Proteínas y Carbohidratos',
    note: 'Seleccioná al menos 2 proteínas',
    groups: [
      {
        name: 'Proteínas',
        items: ['🍗 Pollo', '🥩 Carne', '🐟 Pescado', '🐟 Atún', '🦐 Camarones', '🥚 Huevo', '🦃 Pavo', '🥩 Cerdo', '🥩 Jamón', '🧆 Tofu', '🌱 Carne de soya', '🫘 Tempeh', '🌾 Seitán', '🥤 Proteína en polvo'],
      },
      {
        name: 'Carbohidratos',
        items: ['🍚 Arroz', '🥔 Papa', '🍠 Batata', '🌿 Mandioca', '🫘 Lentejas', '🫘 Porotos', '🫘 Garbanzos', '🟢 Arvejas', '🌾 Quinua', '🍝 Pasta', '🌽 Choclo', '🍿 Popcorn', '🥣 Avena', '🍞 Pan', '🫓 Tortilla', '🥣 Cereal'],
      },
    ],
  },
];

const MIN_PER_PAGE = 2;
const EMPTY_FOODS: string[] = [];

export default function FoodSelectionScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';

  const stored = useOnboardingStore((s) => s.data.availableFoods ?? EMPTY_FOODS);
  const setStore = useOnboardingStore((s) => s.set);
  const { token } = useAuthStore();

  const [pageIdx, setPageIdx] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set(stored));

  const page = PAGES[pageIdx];

  function toggleFood(food: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(food)) {
        next.delete(food);
      } else {
        next.add(food);
      }
      return next;
    });
  }

  function countPageSelections() {
    const allItems = page.groups.flatMap((g) => g.items);
    return allItems.filter((item) => selected.has(item)).length;
  }

  async function handleNext() {
    if (countPageSelections() < MIN_PER_PAGE) {
      Alert.alert('Selección mínima', `Seleccioná al menos ${MIN_PER_PAGE} alimentos para continuar.`);
      return;
    }

    if (pageIdx < PAGES.length - 1) {
      setPageIdx((p) => p + 1);
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

  const progress = STEP / TOTAL_STEPS + (pageIdx / PAGES.length) * (1 / TOTAL_STEPS);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.step}>Paso {STEP} de {TOTAL_STEPS} · {pageIdx + 1}/{PAGES.length}</Text>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.subtitle}>{page.note}</Text>

        {page.groups.map((group) => (
          <View key={group.name} style={styles.group}>
            <Text style={styles.groupName}>{group.name}</Text>
            <View style={styles.chipGrid}>
              {group.items.map((item) => {
                const active = selected.has(item);
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggleFood(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipText}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.btnWrap}>
          <Btn onPress={handleNext}>
            {isEdit && pageIdx === PAGES.length - 1
              ? 'Guardar'
              : pageIdx < PAGES.length - 1
              ? 'Siguiente'
              : 'Continuar'}
          </Btn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.08)' },
  progressFill: { height: 3, backgroundColor: colors.neon, borderRadius: 2 },
  container: { padding: 24, paddingTop: 16 },
  step: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 4, fontFamily: 'SpaceGrotesk_700Bold' },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 20, fontFamily: 'SpaceGrotesk_400Regular' },
  group: { marginBottom: 24 },
  groupName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  chipActive: {
    backgroundColor: 'rgba(204,255,0,0.12)',
    borderColor: 'rgba(204,255,0,0.45)',
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  btnWrap: { marginTop: 8 },
});
