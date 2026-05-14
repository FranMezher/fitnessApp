import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, glass } from '@/constants/colors';
import { Pill } from '@/components/ui/Pill';
import { Btn } from '@/components/ui/Btn';

const TOTAL_REPS = 12;
const DONE_REPS = 6;
const CAMERA_HEIGHT = Math.round(Dimensions.get('window').height * 0.35);

export default function WorkoutActiveScreen() {
  const params = useLocalSearchParams<{
    loadedHistory?: string;
    loadedAgo?: string;
    exerciseName?: string;
  }>();

  const exerciseName = params.exerciseName ?? 'Flexiones Diamante';
  const hasHistory = !!params.loadedHistory;

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.exitText}>✕ Salir</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.seriesText}>{exerciseName}</Text>
            <Text style={styles.seriesSub}>Serie 2 / 3 · Ejercicio 3 de 6</Text>
          </View>
          <Text style={styles.pauseText}>⏸</Text>
        </View>

        {/* Loaded history banner */}
        {hasHistory && (
          <View style={styles.historyBanner}>
            <Text style={styles.historyBannerArrow}>↑</Text>
            <Text style={styles.historyBannerText}>
              Cargado de última sesión:{' '}
              <Text style={{ color: colors.neon, fontWeight: '700' }}>{params.loadedHistory}</Text>
            </Text>
            <Pill color={colors.neon}>{params.loadedAgo}</Pill>
          </View>
        )}

        {/* Timer */}
        <View style={styles.timerWrap}>
          <Text style={styles.timer}>{mm}:{ss}</Text>
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

        {/* Series comparison */}
        <View style={[glass, styles.seriesCompare]}>
          {[
            { label: 'Serie 1 hoy',    value: '12 reps', color: colors.teal,   sub: '✓' },
            { label: 'Última sesión',  value: '10 reps', color: colors.muted,  sub: 'ref.' },
            { label: 'Ahora',          value: '6 / 12',  color: colors.orange, sub: '▶' },
          ].map((col, i) => (
            <View key={i} style={[styles.seriesCol, i > 0 && styles.seriesColBorder]}>
              <Text style={styles.seriesColLabel}>{col.label}</Text>
              <Text style={[styles.seriesColValue, { color: col.color }]}>{col.value}</Text>
              <Text style={[styles.seriesColSub, { color: col.color }]}>{col.sub}</Text>
            </View>
          ))}
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  seriesText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  seriesSub: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginTop: 1,
  },
  pauseText: {
    fontSize: 15,
    color: colors.neon,
  },
  historyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(204,255,0,0.06)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  historyBannerArrow: {
    color: colors.neon,
    fontSize: 14,
  },
  historyBannerText: {
    flex: 1,
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  seriesCompare: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  seriesCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  seriesColBorder: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  seriesColLabel: {
    fontSize: 10,
    color: colors.dim,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginBottom: 2,
  },
  seriesColValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  seriesColSub: {
    fontSize: 10,
    opacity: 0.7,
    fontFamily: 'SpaceGrotesk_400Regular',
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
  camera: {
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    height: CAMERA_HEIGHT,
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
