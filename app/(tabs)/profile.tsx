import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { HudBackground } from '@/components/ui/HudBackground';
import { useAuthStore } from '@/stores/useAuthStore';

const GOAL_LABELS: Record<string, string> = {
  fat_loss: 'Perder grasa',
  muscle:   'Ganar músculo',
  maintain: 'Mantener peso',
  wellness: 'Bienestar general',
};

const GOAL_ICONS: Record<string, string> = {
  fat_loss: 'flame-outline',
  muscle:   'barbell-outline',
  maintain: 'scale-outline',
  wellness: 'leaf-outline',
};

const MENU_ITEMS = [
  { icon: 'nutrition-outline',    label: 'Mi plan nutricional',        route: '/profile/nutrition-plan' },
  { icon: 'fitness-outline',      label: 'Historial de entrenamientos', route: '/profile/workout-history' },
  { icon: 'settings-outline',     label: 'Ajustes de cuenta',           route: '/profile/settings' },
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
  const goalLabel = GOAL_LABELS[goalKey] ?? null;
  const goalIcon = (GOAL_ICONS[goalKey] ?? 'trophy-outline') as any;
  const targetWeight = profile?.targetWeightKg;
  const weightDiff = weightKg && targetWeight ? Math.abs(weightKg - targetWeight) : null;
  const weightProgress = weightKg && targetWeight
    ? weightKg === targetWeight
      ? 100
      : Math.max(0, Math.min(100, Math.round((1 - Math.abs(weightKg - targetWeight) / targetWeight) * 100)))
    : 0;

  return (
    <HudBackground style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.headerBrand}>FITCORE</Text>
          <View style={styles.topBarActions}>
            <TouchableOpacity onPress={() => router.push('/profile/settings' as never)}>
              <Ionicons name="settings-outline" size={22} color={colors.muted} />
            </TouchableOpacity>
            <Ionicons name="notifications-outline" size={22} color={colors.neon} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Avatar section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              </View>
            </View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email}>{email ?? ''}</Text>
            <View style={styles.levelPill}>
              <Ionicons name="star" size={12} color={colors.bg} />
              <Text style={styles.levelPillText}>Nivel 1 · Novato</Text>
            </View>
          </View>

          {/* Biometrics */}
          <View style={styles.bioCard}>
            <Text style={styles.sectionTitle}>DATOS BIOMÉTRICOS</Text>
            <View style={styles.bioGrid}>
              <BioTile label="Peso" value={weightKg ? `${weightKg}` : '—'} unit="kg" />
              <BioTile label="Altura" value={heightCm ? `${heightCm}` : '—'} unit="cm" />
              <BioTile label="IMC" value={bmi ? String(bmi) : '—'} unit="" />
              <BioTile label="Edad" value={profile?.age ? String(profile.age) : '—'} unit="años" />
            </View>
          </View>

          {/* Goal */}
          {goalLabel && (
            <View style={styles.goalCard}>
              <View style={styles.goalTop}>
                <View style={styles.goalIconWrap}>
                  <Ionicons name={goalIcon} size={20} color={colors.neon} />
                </View>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>{goalLabel}</Text>
                  {weightDiff !== null && (
                    <Text style={styles.goalSub}>Faltan {weightDiff} kg para la meta</Text>
                  )}
                </View>
              </View>
              {targetWeight && weightKg && (
                <>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${weightProgress}%` }]} />
                  </View>
                  <View style={styles.goalLabels}>
                    <Text style={styles.goalCaption}>{weightKg} kg actual</Text>
                    <Text style={styles.goalCaption}>{targetWeight} kg meta</Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Macro targets */}
          {profile?.targetCalories && (
            <View style={styles.macroCard}>
              <Text style={styles.sectionTitle}>OBJETIVOS NUTRICIONALES</Text>
              <View style={styles.macroGrid}>
                <MacroTile label="Kcal" value={profile.targetCalories} color={colors.neon} />
                <MacroTile label="Proteína" value={profile.targetProteinG} unit="g" color={colors.neon} />
                <MacroTile label="Carbos" value={profile.targetCarbsG} unit="g" color={colors.orange} />
                <MacroTile label="Grasas" value={profile.targetFatG} unit="g" color={colors.teal} />
              </View>
            </View>
          )}

          {/* Menu */}
          <View style={styles.menuSection}>
            {MENU_ITEMS.map((m) => (
              <TouchableOpacity
                key={m.label}
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => m.route && router.push(m.route as never)}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name={m.icon as any} size={18} color={colors.muted} />
                </View>
                <Text style={styles.menuLabel}>{m.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.dim} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={colors.orange} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </HudBackground>
  );
}

function BioTile({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.bioTile}>
      <Text style={styles.bioValue}>{value}<Text style={styles.bioUnit}>{unit ? ` ${unit}` : ''}</Text></Text>
      <Text style={styles.bioLabel}>{label}</Text>
    </View>
  );
}

function MacroTile({ label, value, unit = '', color }: {
  label: string; value?: number; unit?: string; color: string;
}) {
  return (
    <View style={styles.macroTile}>
      <Text style={[styles.macroValue, { color }]}>
        {value ?? '—'}<Text style={styles.macroUnit}>{unit}</Text>
      </Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(8,8,8,0.85)',
  },
  headerBrand: { ...text.heroMd, color: colors.neon, fontSize: 20, letterSpacing: -0.5 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },

  // Avatar
  avatarSection: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(204,255,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(204,255,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...text.heroMd, color: colors.neon, fontSize: 32 },
  name: { ...text.headlineLg, color: colors.text },
  email: { ...text.bodyMd, color: colors.muted },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.neon,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginTop: 4,
  },
  levelPillText: { ...text.labelSm, color: colors.bg },

  // Biometrics
  bioCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: { ...text.labelCaps, color: colors.muted },
  bioGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  bioTile: { alignItems: 'center', flex: 1 },
  bioValue: { ...text.headlineMd, color: colors.text },
  bioUnit: { ...text.bodyMd, color: colors.muted },
  bioLabel: { ...text.labelSm, color: colors.muted, marginTop: 2 },

  // Goal
  goalCard: {
    backgroundColor: 'rgba(204,255,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.25)',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  goalTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  goalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(204,255,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalInfo: { flex: 1 },
  goalTitle: { ...text.headlineMd, color: colors.neon },
  goalSub: { ...text.bodyMd, color: colors.muted },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.neon,
    borderRadius: 2,
    shadowColor: colors.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  goalLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  goalCaption: { ...text.labelSm, color: colors.muted },

  // Macros
  macroCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  macroGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  macroTile: { alignItems: 'center', flex: 1 },
  macroValue: { ...text.headlineMd, fontSize: 18 },
  macroUnit: { ...text.bodyMd, color: colors.muted },
  macroLabel: { ...text.labelSm, color: colors.muted, marginTop: 2 },

  // Menu
  menuSection: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, ...text.bodyLg, color: colors.text },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,107,53,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
    borderRadius: radius.lg,
    paddingVertical: 14,
  },
  logoutText: { ...text.bodyLg, color: colors.orange, fontFamily: 'SpaceGrotesk_600SemiBold' },
});
