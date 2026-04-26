import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass, glassOrange } from '@/constants/colors';
import { Pill } from '@/components/ui/Pill';
import { GlassCard } from '@/components/ui/GlassCard';

const WORKOUTS = [
  { id: '1', title: 'Upper Body Power', sub: '6 ejercicios · ~38 min', day: 'DÍA 3 · HOY', difficulty: 'Intermedio' },
  { id: '2', title: 'Lower Body Burn', sub: '7 ejercicios · ~45 min', day: 'DÍA 4 · MAÑ', difficulty: 'Intermedio' },
  { id: '3', title: 'Core & Abs', sub: '5 ejercicios · ~25 min', day: 'DÍA 5', difficulty: 'Principiante' },
  { id: '4', title: 'Full Body HIIT', sub: '8 ejercicios · ~50 min', day: 'DÍA 6', difficulty: 'Avanzado' },
];

export default function TrainScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Entrena</Text>
        <Text style={styles.sub}>Tu plan de la semana</Text>

        {WORKOUTS.map((w, i) => (
          <TouchableOpacity
            key={w.id}
            style={i === 0 ? [glassOrange, styles.card] : [glass, styles.card]}
            activeOpacity={0.8}
            onPress={() => router.push('/workout/active')}
          >
            <View style={styles.cardContent}>
              <Pill color={i === 0 ? colors.orange : colors.dim}>{w.day}</Pill>
              <Text style={styles.cardTitle}>{w.title}</Text>
              <Text style={styles.cardSub}>{w.sub}</Text>
              <Pill color={i === 0 ? colors.neon : colors.muted}>{w.difficulty}</Pill>
            </View>
            <View style={[styles.playBtn, { backgroundColor: i === 0 ? colors.orange : 'rgba(255,255,255,0.06)' }]}>
              <Text style={[styles.playIcon, { color: i === 0 ? '#fff' : colors.muted }]}>▶</Text>
            </View>
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
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  sub: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  card: {
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardContent: {
    flex: 1,
    gap: 5,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginTop: 2,
  },
  cardSub: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 18,
  },
});
