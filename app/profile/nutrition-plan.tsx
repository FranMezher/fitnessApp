import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors, glass } from '@/constants/colors';
import { Label } from '@/components/ui/Label';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import type { Profile } from '@/lib/api';

const GOAL_LABELS: Record<string, string> = {
  fat_loss: '⚖ Perder grasa', muscle: '💪 Ganar músculo', maintain: '🔄 Mantenimiento',
};
const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentario', lightly_active: 'Lig. activo', active: 'Activo', very_active: 'Muy activo',
};
const STRENGTH_LABELS: Record<string, string> = {
  beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado', pro_athlete: 'Atleta Pro',
};
const SPEED_LABELS: Record<string, string> = {
  sostenible: 'Sostenible', moderado: 'Moderado', agresivo: 'Agresivo',
};
const COOKING_LABELS: Record<string, string> = {
  quick: 'Rápido', home_cook: 'Cocinero casero', chef: 'Chef',
};

export default function NutritionPlanScreen() {
  const { token } = useAuthStore();
  const setStore = useOnboardingStore((s) => s.set);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!token) return;
    api.getProfile(token).then(setProfile).catch(() => {});
  }, [token]);

  function goEdit(route: string) {
    if (profile) {
      setStore({
        goal:           profile.goal as any,
        sex:            profile.sex as any,
        age:            profile.age,
        heightCm:       profile.heightCm,
        weightKg:       profile.weightKg,
        targetWeightKg: profile.targetWeightKg,
        strengthLevel:  profile.strengthLevel as any,
        activityLevel:  profile.activityLevel as any,
        sleepHours:     profile.sleepHours,
        stressLevel:    profile.stressLevel,
        smokingHabit:   profile.smokingHabit,
        alcoholHabit:   profile.alcoholHabit,
        weightLossSpeed:profile.weightLossSpeed as any,
        dietType:       profile.dietType,
        availableFoods: profile.availableFoods,
        mealFrequency:  profile.mealFrequency as any,
        cookingTime:    profile.cookingTime as any,
        targetCalories: profile.targetCalories,
        targetProteinG: profile.targetProteinG,
        targetCarbsG:   profile.targetCarbsG,
        targetFatG:     profile.targetFatG,
      });
    }
    router.push(route as never);
  }

  const rows = [
    {
      icon: '🎯',
      label: 'Objetivo',
      value: GOAL_LABELS[profile?.goal ?? ''] ?? '—',
      route: '/(onboarding)/goal?edit=1',
    },
    {
      icon: '👤',
      label: 'Datos personales',
      value: profile?.weightKg ? `${profile.weightKg} kg · ${profile.heightCm} cm · ${profile.age} años` : '—',
      route: '/(onboarding)/biometrics?edit=1',
    },
    {
      icon: '💪',
      label: 'Nivel de fuerza',
      value: STRENGTH_LABELS[profile?.strengthLevel ?? ''] ?? '—',
      route: '/(onboarding)/strength?edit=1',
    },
    {
      icon: '⚡',
      label: 'Nivel de actividad',
      value: ACTIVITY_LABELS[profile?.activityLevel ?? ''] ?? '—',
      route: '/(onboarding)/activity?edit=1',
    },
    {
      icon: '🌙',
      label: 'Estilo de vida',
      value: profile?.sleepHours ? `${profile.sleepHours}h sueño · Estrés ${profile.stressLevel ?? '—'}/5` : '—',
      route: '/(onboarding)/lifestyle?edit=1',
    },
    {
      icon: '📉',
      label: 'Meta y velocidad',
      value: profile?.targetWeightKg
        ? `${profile.targetWeightKg} kg · ${SPEED_LABELS[profile?.weightLossSpeed ?? ''] ?? '—'}`
        : '—',
      route: '/(onboarding)/weight-speed?edit=1',
    },
    {
      icon: '🥗',
      label: 'Dieta',
      value: profile?.dietType?.length ? profile.dietType.join(', ') : '—',
      route: '/(onboarding)/food-variety?edit=1',
    },
    {
      icon: '🛒',
      label: 'Alimentos disponibles',
      value: profile?.availableFoods?.length ? `${profile.availableFoods.length} seleccionados` : '—',
      route: '/(onboarding)/food-selection?edit=1',
    },
    {
      icon: '📋',
      label: 'Planificación',
      value: profile?.mealFrequency
        ? `${profile.mealFrequency} comidas · ${COOKING_LABELS[profile?.cookingTime ?? ''] ?? '—'}`
        : '—',
      route: '/(onboarding)/meal-planning?edit=1',
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>‹ Volver</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Mi plan nutricional</Text>

        {profile?.targetCalories ? (
          <View style={styles.caloriesBanner}>
            <Text style={styles.caloriesNum}>{profile.targetCalories.toLocaleString()}</Text>
            <Text style={styles.caloriesUnit}>kcal / día</Text>
            <View style={styles.macrosRow}>
              <MacroPill label="Prot" g={profile.targetProteinG} color={colors.teal} />
              <MacroPill label="Carbs" g={profile.targetCarbsG} color={colors.neon} />
              <MacroPill label="Grasas" g={profile.targetFatG} color={colors.orange} />
            </View>
          </View>
        ) : null}

        <Label>Configuración</Label>

        {rows.map((r) => (
          <TouchableOpacity
            key={r.label}
            style={[glass, styles.row]}
            onPress={() => goEdit(r.route)}
            activeOpacity={0.7}
          >
            <Text style={styles.rowIcon}>{r.icon}</Text>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowValue}>{r.value}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Recalculate */}
        <TouchableOpacity
          style={styles.recalcBtn}
          onPress={() => goEdit('/(onboarding)/plan?edit=1')}
          activeOpacity={0.8}
        >
          <Text style={styles.recalcText}>⚡ Recalcular mis calorías</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroPill({ label, g, color }: { label: string; g?: number; color: string }) {
  return (
    <View style={[pillStyles.wrap, { borderColor: `${color}40` }]}>
      <Text style={[pillStyles.g, { color }]}>{g ?? '—'}g</Text>
      <Text style={pillStyles.label}>{label}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  g: { fontSize: 16, fontWeight: '700', fontFamily: 'SpaceGrotesk_700Bold' },
  label: { fontSize: 10, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, gap: 10 },
  header: { marginBottom: 4 },
  back: { fontSize: 15, color: colors.neon, fontFamily: 'SpaceGrotesk_400Regular' },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 4 },
  caloriesBanner: {
    backgroundColor: 'rgba(204,255,0,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  caloriesNum: { fontSize: 40, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold' },
  caloriesUnit: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  macrosRow: { flexDirection: 'row', gap: 8, marginTop: 8, width: '100%' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
  },
  rowIcon: { fontSize: 18, width: 28 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 14, color: colors.text, fontFamily: 'SpaceGrotesk_400Regular' },
  rowValue: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', marginTop: 1 },
  arrow: { color: colors.dim, fontSize: 18 },
  recalcBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(204,255,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.2)',
    alignItems: 'center',
  },
  recalcText: { fontSize: 15, fontWeight: '600', color: colors.neon, fontFamily: 'SpaceGrotesk_600SemiBold' },
});
