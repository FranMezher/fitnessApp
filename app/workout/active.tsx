import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass } from '@/constants/colors';
import { Pill } from '@/components/ui/Pill';
import { Btn } from '@/components/ui/Btn';

const TOTAL_REPS = 12;
const DONE_REPS = 6;

export default function WorkoutActiveScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.exitText}>✕ Salir</Text>
          </TouchableOpacity>
          <Text style={styles.seriesText}>Serie 2 / 3</Text>
          <Text style={styles.pauseText}>⏸</Text>
        </View>

        {/* Timer */}
        <View style={styles.timerWrap}>
          <Text style={styles.timer}>00:32</Text>
          <Text style={styles.exerciseName}>Flexiones Diamante</Text>
        </View>

        {/* Camera placeholder */}
        <View style={styles.camera}>
          <View style={styles.cameraGradient} />
          <Text style={styles.cameraPlaceholder}>[ cámara + overlay{'\n'}esqueleto IA ]</Text>

          {/* Corner markers */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* AI Badge */}
          <View style={styles.aiBadge}>
            <Pill color={colors.neon}>IA activa</Pill>
          </View>

          {/* Alert */}
          <View style={styles.alert}>
            <Text style={styles.alertText}>⚠ Codos demasiado abiertos → ciérralos</Text>
          </View>
        </View>

        {/* Rep counter */}
        <View style={[glass, styles.repCard]}>
          <Text style={styles.repTitle}>Repeticiones detectadas</Text>
          <View style={styles.repDots}>
            {Array.from({ length: TOTAL_REPS }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.repDot,
                  i < DONE_REPS ? styles.repDotDone : styles.repDotPending,
                ]}
              >
                <Text
                  style={[
                    styles.repDotText,
                    i < DONE_REPS ? styles.repDotTextDone : styles.repDotTextPending,
                  ]}
                >
                  {i + 1}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.repCount}>
            {DONE_REPS} / {TOTAL_REPS} · Precisión:{' '}
            <Text style={{ color: colors.neon }}>85%</Text>
          </Text>
        </View>

        <Btn variant="orange" onPress={() => router.push('/workout/summary')}>
          DESCANSO →
        </Btn>
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
  },
  exitText: {
    fontSize: 15,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  seriesText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  pauseText: {
    fontSize: 15,
    color: colors.neon,
  },
  timerWrap: {
    alignItems: 'center',
  },
  timer: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.neon,
    lineHeight: 68,
    letterSpacing: -2,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  exerciseName: {
    fontSize: 15,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginTop: 4,
  },
  camera: {
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  cameraGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(204,255,0,0.02)',
  },
  cameraPlaceholder: {
    color: '#333',
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: colors.neon,
    borderWidth: 2,
  },
  cornerTL: {
    top: 10,
    left: 10,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 3,
  },
  cornerTR: {
    top: 10,
    right: 10,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 3,
  },
  cornerBL: {
    bottom: 10,
    left: 10,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 3,
  },
  cornerBR: {
    bottom: 10,
    right: 10,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 3,
  },
  aiBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  alert: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderWidth: 1,
    borderColor: `${colors.orange}66`,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  alertText: {
    fontSize: 12,
    color: colors.orange,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  repCard: {
    padding: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 8,
  },
  repTitle: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  repDots: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  repDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repDotDone: {
    backgroundColor: colors.neon,
    borderColor: colors.neon,
  },
  repDotPending: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  repDotText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  repDotTextDone: {
    color: '#111',
  },
  repDotTextPending: {
    color: colors.dim,
  },
  repCount: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
});
