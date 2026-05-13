import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Pill } from '@/components/ui/Pill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Label } from '@/components/ui/Label';
import { GlassCard } from '@/components/ui/GlassCard';

const STATS = [
  { v: '312', l: 'Kcal hoy' },
  { v: '38min', l: 'Activo' },
  { v: '5', l: 'Días racha' },
];

const BIOMETRICS = [
  { l: 'Peso', v: '78 kg' },
  { l: 'Altura', v: '175 cm' },
  { l: 'IMC', v: '25.5' },
  { l: 'Grasa', v: '18%' },
];

const MENU_ITEMS = [
  { icon: '🥗', label: 'Mi plan nutricional', route: '/profile/nutrition-plan' },
  { icon: '📊', label: 'Historial de entrenamientos', route: null },
  { icon: '🏆', label: 'Logros y medallas', route: null },
  { icon: '⚙️', label: 'Ajustes de cuenta', route: '/profile/settings' },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mi perfil</Text>
          <TouchableOpacity>
            <Text style={styles.editText}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>C</Text>
          </View>
          <Text style={styles.name}>Carlos Pérez</Text>
          <Text style={styles.email}>carlos@email.com</Text>
          <View style={styles.pills}>
            <Pill color={colors.neon}>🔥 Racha 5 días</Pill>
            <Pill color={colors.purple}>Nivel 3</Pill>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <GlassCard key={s.l} style={styles.statCard}>
              <Text style={styles.statVal}>{s.v}</Text>
              <Text style={styles.statLabel}>{s.l}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Biometrics */}
        <GlassCard style={styles.bioCard}>
          <Label>Datos biométricos</Label>
          <View style={styles.bioRow}>
            {BIOMETRICS.map((b) => (
              <View key={b.l} style={styles.bioItem}>
                <Text style={styles.bioVal}>{b.v}</Text>
                <Text style={styles.bioLabel}>{b.l}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Goal progress */}
        <GlassCard variant="neon" style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>🔥 Perder grasa</Text>
            <Text style={styles.goalSub}>Faltan 6 kg</Text>
          </View>
          <ProgressBar pct={35} />
          <Text style={styles.goalCaption}>72 kg objetivo · actualmente 78 kg</Text>
        </GlassCard>

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
    gap: 10,
  },
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
  avatarSection: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
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
  avatarText: {
    fontSize: 32,
    color: colors.text,
    fontWeight: '700',
  },
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
  pills: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  statLabel: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  bioCard: {
    padding: 12,
    paddingHorizontal: 16,
  },
  bioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bioItem: {
    alignItems: 'center',
  },
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
  goalCard: {
    padding: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  goalSub: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  goalCaption: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
  },
  menuIcon: {
    fontSize: 17,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  menuArrow: {
    color: colors.dim,
    fontSize: 18,
  },
});
