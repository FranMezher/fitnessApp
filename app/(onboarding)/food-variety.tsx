import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { colors, glass, glassNeon, glowShadows } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { Btn } from '@/components/ui/Btn';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

const TOTAL_STEPS = 10;
const STEP = 7;

const DIET_OPTIONS: { id: string; icon: string; label: string }[] = [
  { id: 'omnivore',     icon: '🥩', label: 'Omnívoro' },
  { id: 'vegetarian',  icon: '🥗', label: 'Vegetariano' },
  { id: 'vegan',       icon: '🌱', label: 'Vegano' },
  { id: 'keto',        icon: '🥑', label: 'Keto' },
  { id: 'paleo',       icon: '🍖', label: 'Paleo' },
  { id: 'mediterranean', icon: '🫒', label: 'Mediterráneo' },
];

export default function FoodVarietyScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';

  const stored = useOnboardingStore((s) => s.data.dietType);
  const setStore = useOnboardingStore((s) => s.set);
  const { token } = useAuthStore();

  const [selected, setSelected] = useState<string[]>(stored ?? ['omnivore']);

  function toggleDiet(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleContinue() {
    const finalSelected = selected.length > 0 ? selected : ['omnivore'];
    setStore({ dietType: finalSelected });
    if (isEdit) {
      if (token) await api.upsertProfile(token, { dietType: finalSelected }).catch(() => {});
      router.back();
      return;
    }
    router.push('/(onboarding)/food-selection' as never);
  }

  return (
    <OnboardingShell
      step={STEP}
      totalSteps={TOTAL_STEPS}
      title="Variedad y dieta"
      subtitle="Seleccioná tus preferencias dietéticas. Podés elegir más de una."
      footer={<Btn onPress={handleContinue} disabled={selected.length === 0}>{isEdit ? 'GUARDAR' : 'CONTINUAR'}</Btn>}
    >
      <View style={styles.grid}>
        {DIET_OPTIONS.map((o) => {
          const active = selected.includes(o.id);
          return (
            <TouchableOpacity
              key={o.id}
              style={[styles.chip, active ? glassNeon : glass, active && styles.chipActive]}
              onPress={() => toggleDiet(o.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.chipIcon}>{o.icon}</Text>
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    minWidth: '45%',
  },
  chipActive: {
    ...glowShadows.neon,
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  chipIcon: { fontSize: 20 },
  chipLabel: { ...text.headlineMd, fontSize: 14, color: colors.muted },
  chipLabelActive: { color: colors.neon },
});
