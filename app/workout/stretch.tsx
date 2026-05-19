import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface StretchItem {
  name:        string;
  muscle:      string;
  seconds:     number;
  instruction: string;
}

const STRETCHES: Record<string, StretchItem[]> = {
  push: [
    { name: 'Pecho en pared',       muscle: 'Pectoral',     seconds: 30, instruction: 'Apoya el brazo en el marco de la puerta y gira suavemente el cuerpo. Mantén 30 seg por cada lado.' },
    { name: 'Tríceps sobre cabeza', muscle: 'Tríceps',      seconds: 30, instruction: 'Lleva el codo detrás de la cabeza y empuja suavemente con la otra mano. Ambos lados.' },
    { name: 'Hombro cruzado',       muscle: 'Deltoides',    seconds: 30, instruction: 'Lleva el brazo al pecho y sostén con el otro brazo. Sentís el estiramiento en el hombro. Ambos lados.' },
    { name: 'Apertura torácica',    muscle: 'Espalda alta', seconds: 30, instruction: 'Entrelaza los dedos al frente y empuja hacia adelante redondeando la espalda. Respirá profundo.' },
  ],
  pull: [
    { name: 'Estiramiento de espalda', muscle: 'Dorsal',    seconds: 30, instruction: 'Agarra un poste o marco de puerta, incliná el cuerpo hacia atrás y estirá la espalda.' },
    { name: 'Bíceps contra pared',     muscle: 'Bíceps',    seconds: 30, instruction: 'Apoya la palma en la pared con el pulgar abajo y girá el cuerpo levemente. Ambos lados.' },
    { name: 'Hombro cruzado',          muscle: 'Deltoides', seconds: 30, instruction: 'Lleva el brazo al pecho y sostén con el otro brazo. Sentís el estiramiento en el hombro. Ambos lados.' },
    { name: 'Cuello lateral',          muscle: 'Cuello',    seconds: 30, instruction: 'Inclina suavemente la cabeza hacia un hombro. No fuerces. Respirá lento. Ambos lados.' },
  ],
  legs: [
    { name: 'Cuádriceps de pie',     muscle: 'Cuádriceps',    seconds: 40, instruction: 'Parate en un pie, lleváte el talón al glúteo con la mano. Mantén el equilibrio. Ambas piernas.' },
    { name: 'Isquiosural en suelo',  muscle: 'Isquiosurales', seconds: 40, instruction: 'Sentado con piernas extendidas, inclinante hacia adelante alcanzando los pies. Respirá.' },
    { name: 'Hip Flexor en rodilla', muscle: 'Cadera',        seconds: 40, instruction: 'Ponete con una rodilla en el suelo, pierna trasera extendida. Empujá la cadera hacia adelante.' },
    { name: 'Glúteo figura 4',       muscle: 'Glúteos',       seconds: 40, instruction: 'Acostado, cruzá el tobillo sobre la rodilla contraria y acercá las piernas al pecho.' },
    { name: 'Pantorrilla en pared',  muscle: 'Pantorrilla',   seconds: 30, instruction: 'Apoyá la punta del pie en la pared y empujá el talón hacia abajo suavemente. Ambas piernas.' },
  ],
  default: [
    { name: 'Pecho en pared',          muscle: 'Pectoral',   seconds: 30, instruction: 'Apoya el brazo en el marco de la puerta y gira suavemente el cuerpo. Ambos lados.' },
    { name: 'Hombro cruzado',          muscle: 'Deltoides',  seconds: 30, instruction: 'Lleva el brazo al pecho y sostén con el otro brazo. Ambos lados.' },
    { name: 'Estiramiento de espalda', muscle: 'Dorsal',     seconds: 30, instruction: 'Agarra un poste, incliná el cuerpo hacia atrás y estirá la espalda.' },
    { name: 'Cuádriceps de pie',       muscle: 'Cuádriceps', seconds: 30, instruction: 'Parate en un pie, lleváte el talón al glúteo. Ambas piernas.' },
    { name: 'Cuello lateral',          muscle: 'Cuello',     seconds: 30, instruction: 'Inclina suavemente la cabeza hacia un hombro. Ambos lados.' },
  ],
};

function pickStretches(planName: string): StretchItem[] {
  const n = planName.toLowerCase();
  if (n.includes('push')) return STRETCHES.push;
  if (n.includes('pull')) return STRETCHES.pull;
  if (n.includes('leg'))  return STRETCHES.legs;
  return STRETCHES.default;
}

export default function StretchScreen() {
  const { planName } = useLocalSearchParams<{ planName?: string }>();
  const stretches = pickStretches(planName ?? '');

  const [currentIdx, setCurrentIdx]     = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(stretches[0].seconds);
  const [done, setDone]                 = useState(false);

  const current   = stretches[currentIdx];
  const timerDone = timerSeconds === 0;

  useEffect(() => {
    if (done || timerDone) return;
    const t = setTimeout(() => setTimerSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timerSeconds, done, timerDone]);

  function handleNext() {
    if (currentIdx < stretches.length - 1) {
      const next = stretches[currentIdx + 1];
      setCurrentIdx((i) => i + 1);
      setTimerSeconds(next.seconds);
    } else {
      setDone(true);
    }
  }

  // ── DONE ────────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.doneContainer}>
          <Text style={styles.doneEmoji}>🧘</Text>
          <Text style={styles.doneTitle}>¡Elongación completa!</Text>
          <Text style={styles.doneSub}>{stretches.length} estiramientos realizados</Text>
          <Btn onPress={() => router.replace('/(tabs)')}>Volver al inicio</Btn>
        </View>
      </SafeAreaView>
    );
  }

  // ── STRETCH ──────────────────────────────────────────────────────────────────
  const progressPct = Math.round(((current.seconds - timerSeconds) / current.seconds) * 100);
  const mm = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const ss = String(timerSeconds % 60).padStart(2, '0');
  const isLast = currentIdx === stretches.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.skipText}>Saltar todo</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Elongación</Text>
          <Text style={styles.progressBadge}>{currentIdx + 1} / {stretches.length}</Text>
        </View>

        {/* Stretch card */}
        <View style={[glassNeon, styles.stretchCard]}>
          <View style={styles.musclePill}>
            <Text style={styles.musclePillText}>{current.muscle.toUpperCase()}</Text>
          </View>
          <Text style={styles.stretchName}>{current.name}</Text>
          <Text style={styles.stretchInstruction}>{current.instruction}</Text>
        </View>

        {/* Timer */}
        <View style={[glass, styles.timerCard]}>
          <Text style={[styles.timerValue, timerDone && styles.timerValueDone]}>
            {timerDone ? '¡Listo!' : `${mm}:${ss}`}
          </Text>
          <ProgressBar pct={progressPct} h={6} />
        </View>

        {/* Stretch list */}
        <View style={styles.listWrap}>
          {stretches.map((s, i) => {
            const isDone   = i < currentIdx;
            const isActive = i === currentIdx;
            return (
              <View key={i} style={styles.listItem}>
                <Text style={[styles.listStatus, {
                  color: isDone ? colors.neon : isActive ? colors.orange : colors.dim,
                }]}>
                  {isDone ? '✓' : isActive ? '▶' : '○'}
                </Text>
                <Text style={[styles.listName, {
                  color: isDone ? colors.dim : isActive ? colors.text : colors.muted,
                }]}>
                  {s.name}
                </Text>
                <Text style={styles.listMuscle}>{s.muscle}</Text>
              </View>
            );
          })}
        </View>

        {/* CTA */}
        <Btn onPress={handleNext} variant={timerDone ? undefined : 'ghost'}>
          {isLast ? 'Finalizar' : 'Siguiente →'}
        </Btn>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 20, gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipText: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    width: 72,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  progressBadge: {
    fontSize: 13,
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    textAlign: 'right',
    width: 72,
  },
  stretchCard: { padding: 18, gap: 8 },
  musclePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(204,255,0,0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  musclePillText: {
    fontSize: 10,
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    letterSpacing: 1.2,
  },
  stretchName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  stretchInstruction: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    lineHeight: 20,
  },
  timerCard: {
    padding: 14,
    alignItems: 'center',
    gap: 10,
  },
  timerValue: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    lineHeight: 46,
    letterSpacing: -1,
  },
  timerValueDone: { color: colors.teal },
  listWrap: { gap: 4, flex: 1 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 3,
  },
  listStatus: { fontSize: 12, width: 16 },
  listName: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  listMuscle: {
    fontSize: 11,
    color: colors.dim,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  // Done screen
  doneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  doneEmoji:  { fontSize: 56 },
  doneTitle:  { fontSize: 24, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  doneSub:    { fontSize: 14, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', textAlign: 'center', marginBottom: 8 },
});
