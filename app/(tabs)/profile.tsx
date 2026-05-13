import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Pill } from '@/components/ui/Pill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Label } from '@/components/ui/Label';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuthStore } from '@/stores/useAuthStore';

const GOAL_LABELS: Record<string, string> = {
  fat_loss:  '🔥 Perder grasa',
  muscle:    '💪 Ganar músculo',
  maintain:  '⚖️ Mantener peso',
  wellness:  '🌿 Bienestar general',
};

const MENU_ITEMS = [
  { icon: '🥗', label: 'Mi plan nutricional', route: '/profile/nutrition-plan' },
  { icon: '📊', label: 'Historial de entrenamientos', route: null },
  { icon: '🏆', label: 'Logros y medallas', route: null },
  { icon: '⚙️', label: 'Ajustes de cuenta', route: '/profile/settings' },
];

export default function ProfileScreen() {
  const { profile, email, fetchProfile, clearSession } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Seguro que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: () => {
          clearSession();
          router.replace('/(auth)/login' as never);
        },
      },
    ]);
  }

  const name = profile?.name ?? email ?? 'Usuario';
  const avatarLetter = name.charAt(0).toUpperCase();
  const weightKg = profile?.weightKg;
  const heightCm = profile?.heightCm;
  const bmi = weightKg && heightCm
    ? Math.round((weightKg / ((heightCm / 100) ** 2)) * 10) / 10
    : null;

  const goalKey = profile?.goal ?? '';
  const goalLabel = GOAL_LABELS[goalKey] ?? '—';
  const targetWeight = profile?.targetWeightKg;
  const weightDiff = weightKg && targetWeight ? Math.abs(weightKg - targetWeight) : null;
  const weightProgress = weightKg && targetWeight
    ? Math.max(0, Math.min(100, Math.round(((weightKg - targetWeight) / (weightKg - targetWeight + 1)) * 100)))
    : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mi perfil</Text>
          <TouchableOpacity onPress={() => router.push('/profile/nutrition-plan' as never)}>
            <Text style={styles.editText}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email ?? ''}</Text>
          <View style={styles.pills}>
            <Pill color={colors.purple}>Nivel 1</Pill>
          </View>
        </View>

        {/* Biometrics */}
        <GlassCard style={styles.bioCard}>
          <Label>Datos biométricos</Label>
          <View style={styles.bioRow}>
            <BioItem label="Peso" value={weightKg ? `${weightKg} kg` : '—'} />
            <BioItem label="Altura" value={heightCm ? `${heightCm} cm` : '—'} />
            <BioItem label="IMC" value={bmi ? String(bmi) : '—'} />
            <BioItem label="Edad" value={profile?.age ? String(profile.age) : '—'} />
          </View>
        </GlassCard>

        {/* Goal progress */}
        {profile?.goal && (
          <GlassCard variant="neon" style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>{goalLabel}</Text>
              {weightDiff !== null && (
                <Text style={styles.goalSub}>Faltan {weightDiff} kg</Text>
              )}
            </View>
            {targetWeight !== null && targetWeight !== undefined && weightKg !== null && weightKg !== undefined && (
              <>
                <ProgressBar pct={weightProgress} />
                <Text style={styles.goalCaption}>
                  {targetWeight} kg objetivo · actualmente {weightKg} kg
                </Text>
              </>
            )}
          </GlassCard>
        )}

        {/* Calorie goals */}
        {profile?.targetCalories && (
          <GlassCard style={styles.macroCard}>
            <Label>Objetivos nutricionales</Label>
            <View style={styles.macroRow}>
              <MacroGoal label="Kcal" value={profile.targetCalories} color={colors.neon} />
              <MacroGoal label="Proteína" value={profile.targetProteinG} suffix="g" color={colors.neon} />
              <MacroGoal label="Carbos" value={profile.targetCarbsG} suffix="g" color={colors.teal} />
              <MacroGoal label="Grasas" value={profile.targetFatG} suffix="g" color={colors.orange} />
            </View>
          </GlassCard>
        )}

        {/* Menu */}
        {MENU_ITEMS.map((m) => (
          <TouchableOpacity
            key={m.label}
            style={[glass, styles.menuItem]}
            activeOpacity={0.7}
            onPress={() => m.route && router.push(m.route as never)}
          >
            <Text style={styles.menuIcon}>{m.icon}</Text>
            <Text style={styles.menuLabel}>{m.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Logout */}
        <TouchableOpacity
          style={[glass, styles.menuItem, styles.logoutItem]}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <Text style={styles.menuIcon}>🚪</Text>
          <Text style={[styles.menuLabel, styles.logoutLabel]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function BioItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.bioItem}>
      <Text style={styles.bioVal}>{value}</Text>
      <Text style={styles.bioLabel}>{label}</Text>
    </View>
  );
}

function MacroGoal({ label, value, suffix = '', color }: {
  label: string; value?: number; suffix?: string; color: string;
}) {
  return (
    <View style={styles.macroItem}>
      <Text style={[styles.macroVal, { color }]}>{value ?? '—'}{suffix}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, gap: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  editText: {
    fontSize: 14,
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  avatarSection: { alignItems: 'center', gap: 6, marginBottom: 6 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(204,255,0,0.1)',
    borderWidth: 2,
    borderColor: colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  avatarText: { fontSize: 32, color: colors.text, fontWeight: '700' },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  email: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  pills: { flexDirection: 'row', gap: 6, marginTop: 2 },
  bioCard: { padding: 12, paddingHorizontal: 16 },
  bioRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bioItem: { alignItems: 'center' },
  bioVal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  bioLabel: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  goalCard: { padding: 12, paddingHorizontal: 16, gap: 6 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  goalSub: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  goalCaption: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  macroCard: { padding: 12, paddingHorizontal: 16 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  macroItem: { alignItems: 'center' },
  macroVal: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  macroLabel: { fontSize: 11, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
  },
  menuIcon: { fontSize: 17 },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  menuArrow: { color: colors.dim, fontSize: 18 },
  logoutItem: {
    marginTop: 6,
    borderColor: 'rgba(255,107,53,0.2)',
    backgroundColor: 'rgba(255,107,53,0.05)',
  },
  logoutLabel: { color: colors.orange },
});
