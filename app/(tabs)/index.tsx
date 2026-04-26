import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass, glassOrange } from '@/constants/colors';
import { Ring } from '@/components/ui/Ring';
import { Pill } from '@/components/ui/Pill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Label } from '@/components/ui/Label';
import { GlassCard } from '@/components/ui/GlassCard';

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const STREAK = 5;

const RINGS = [
  { pct: 72, color: colors.neon, label: '72%', sub: 'mov', name: 'Movimiento' },
  { pct: 50, color: colors.orange, label: '50%', sub: 'eje', name: 'Ejercicio' },
  { pct: 88, color: colors.teal, label: '88%', sub: 'H₂O', name: 'Hidrat.' },
];

const MACROS = [
  { l: 'Proteína', v: '87g', c: colors.neon },
  { l: 'Carbos', v: '134g', c: colors.teal },
  { l: 'Grasas', v: '32g', c: colors.orange },
];

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Buenos días,</Text>
            <Text style={styles.headerName}>Carlos 👋</Text>
          </View>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>C</Text>
            </View>
            <View style={styles.notifBadge}>
              <Text style={styles.notifText}>3</Text>
            </View>
          </View>
        </View>

        {/* Streak */}
        <GlassCard style={styles.streakCard}>
          <Text style={styles.streakTitle}>🔥 5 días de racha</Text>
          <View style={styles.streakDays}>
            {WEEK_DAYS.map((d, i) => (
              <View
                key={d}
                style={[
                  styles.streakDay,
                  i < STREAK ? styles.streakDayDone : styles.streakDayPending,
                ]}
              >
                <Text
                  style={[
                    styles.streakDayText,
                    i < STREAK ? styles.streakDayTextDone : styles.streakDayTextPending,
                  ]}
                >
                  {i < STREAK ? '✓' : d}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Activity rings */}
        <View style={styles.rings}>
          {RINGS.map((r) => (
            <GlassCard key={r.name} style={styles.ringCard}>
              <Ring pct={r.pct} size={64} color={r.color} label={r.label} sub={r.sub} />
              <Text style={styles.ringName}>{r.name}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Macros */}
        <GlassCard style={styles.macrosCard}>
          <View style={styles.macrosHeader}>
            <Label>Calorías de hoy</Label>
            <Text style={styles.macrosKcal}>1,240 / 1,840</Text>
          </View>
          <ProgressBar pct={67} />
          <View style={styles.macroItems}>
            {MACROS.map((m) => (
              <View key={m.l} style={styles.macroItem}>
                <Text style={[styles.macroVal, { color: m.c }]}>{m.v}</Text>
                <Text style={styles.macroLabel}>{m.l}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Workout CTA */}
        <TouchableOpacity
          style={[glassOrange, styles.workoutCta]}
          activeOpacity={0.8}
          onPress={() => router.push('/workout/active')}
        >
          <View style={styles.workoutInfo}>
            <Pill color={colors.orange}>HOY · DÍA 3</Pill>
            <Text style={styles.workoutTitle}>Upper Body Power</Text>
            <Text style={styles.workoutSub}>6 ejercicios · ~38 min</Text>
          </View>
          <View style={styles.playBtn}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </TouchableOpacity>
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
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  headerName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
  },
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: colors.orange,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  streakCard: {
    padding: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  streakTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neon,
    marginBottom: 8,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  streakDays: {
    flexDirection: 'row',
    gap: 6,
  },
  streakDay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  streakDayDone: {
    backgroundColor: colors.neon,
    borderColor: colors.neon,
  },
  streakDayPending: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  streakDayText: {
    fontSize: 11,
    fontWeight: '700',
  },
  streakDayTextDone: {
    color: '#111',
  },
  streakDayTextPending: {
    color: colors.dim,
  },
  rings: {
    flexDirection: 'row',
    gap: 10,
  },
  ringCard: {
    flex: 1,
    padding: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  ringName: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  macrosCard: {
    padding: 12,
    paddingHorizontal: 16,
  },
  macrosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  macrosKcal: {
    fontSize: 13,
    color: colors.neon,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  macroItems: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  macroItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  macroVal: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  macroLabel: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  workoutCta: {
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workoutInfo: {
    flex: 1,
    gap: 5,
  },
  workoutTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginTop: 2,
  },
  workoutSub: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 18,
    color: '#fff',
  },
});
