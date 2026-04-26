import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Pill } from '@/components/ui/Pill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Btn } from '@/components/ui/Btn';
import { GlassCard } from '@/components/ui/GlassCard';

const STRETCHES = [
  { name: 'Pecho en pared', muscle: 'Pectoral', done: true },
  { name: 'Tríceps sobre cabeza', muscle: 'Tríceps', done: true },
  { name: 'Hombro cruzado', muscle: 'Deltoides', active: true },
  { name: 'Apertura torácica', muscle: 'Espalda' },
  { name: 'Cuello lateral', muscle: 'Cuello' },
];

export default function StretchScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Elongación</Text>
            <Text style={styles.sub}>5 estiramientos · ~5 min</Text>
          </View>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
            <View style={[glass, styles.skipBtn]}>
              <Text style={styles.skipText}>Saltar</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Camera placeholder */}
        <View style={styles.camera}>
          <Text style={styles.cameraPlaceholder}>[ ilustración: hombro cruzado ]</Text>
          <View style={styles.positionBadge}>
            <Pill>3 de 5</Pill>
          </View>
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>00:18</Text>
          </View>
        </View>

        {/* Active stretch */}
        <GlassCard variant="neon" style={styles.activeCard}>
          <Pill color={colors.neon}>AHORA · DELTOIDES</Pill>
          <Text style={styles.activeName}>Hombro cruzado</Text>
          <Text style={styles.activeSub}>30 seg cada lado · Respira profundo</Text>
          <ProgressBar pct={60} />
        </GlassCard>

        {/* Stretch list */}
        {STRETCHES.map((s) => (
          <View
            key={s.name}
            style={[
              s.active ? glassNeon : glass,
              styles.stretchItem,
              s.done && styles.stretchDone,
            ]}
          >
            <View style={[styles.stretchDot, {
              backgroundColor: s.active ? `${colors.neon}22` : 'rgba(255,255,255,0.05)',
              borderColor: s.active ? colors.neon : s.done ? colors.neon : colors.dim,
            }]}>
              <Text style={[styles.stretchDotIcon, {
                color: s.done ? colors.neon : s.active ? colors.neon : colors.dim,
              }]}>
                {s.done ? '✓' : s.active ? '▶' : '○'}
              </Text>
            </View>
            <View style={styles.stretchText}>
              <Text style={[styles.stretchName, s.done && styles.stretchNameDone]}>
                {s.name}
              </Text>
              <Text style={styles.stretchMuscle}>{s.muscle}</Text>
            </View>
          </View>
        ))}

        <View style={styles.btnWrap}>
          <Btn onPress={() => router.push('/workout/recovery')}>Siguiente →</Btn>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  sub: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  camera: {
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  cameraPlaceholder: {
    color: '#333',
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  positionBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  timerBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: `${colors.neon}22`,
    borderWidth: 1,
    borderColor: `${colors.neon}66`,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  activeCard: {
    padding: 12,
    paddingHorizontal: 14,
    gap: 5,
    marginBottom: 4,
  },
  activeName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginTop: 5,
  },
  activeSub: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 3,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  stretchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    paddingHorizontal: 14,
  },
  stretchDone: {
    opacity: 0.45,
  },
  stretchDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stretchDotIcon: {
    fontSize: 14,
  },
  stretchText: {
    flex: 1,
  },
  stretchName: {
    fontSize: 14,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  stretchNameDone: {
    textDecorationLine: 'line-through',
    color: colors.muted,
  },
  stretchMuscle: {
    fontSize: 11,
    color: colors.dim,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  btnWrap: {
    marginTop: 4,
  },
});
