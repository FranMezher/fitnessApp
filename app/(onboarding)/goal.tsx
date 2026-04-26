import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';

const GOALS = [
  { id: 'fat_loss', icon: '🔥', title: 'Perder grasa', sub: 'Déficit calórico inteligente' },
  { id: 'muscle', icon: '💪', title: 'Ganar músculo', sub: 'Superávit + proteína alta' },
  { id: 'performance', icon: '⚡', title: 'Rendimiento', sub: 'Fuerza y resistencia' },
  { id: 'wellness', icon: '🧘', title: 'Bienestar', sub: 'Equilibrio y salud general' },
];

export default function OnboardGoalScreen() {
  const [selected, setSelected] = useState('fat_loss');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === 1 ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <Text style={styles.title}>¿Cuál es tu meta?</Text>
        <Text style={styles.subtitle}>Tu plan se adapta automáticamente</Text>

        {GOALS.map((g) => {
          const active = selected === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              style={[active ? glassNeon : glass, styles.goalCard]}
              onPress={() => setSelected(g.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.goalIcon}>{g.icon}</Text>
              <View style={styles.goalText}>
                <Text style={[styles.goalTitle, active && styles.goalTitleActive]}>{g.title}</Text>
                <Text style={styles.goalSub}>{g.sub}</Text>
              </View>
              {active && (
                <Text style={styles.check}>✓</Text>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.btnWrap}>
          <Btn onPress={() => router.replace('/(tabs)')}>Continuar</Btn>
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
    padding: 24,
    paddingTop: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.neon,
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 20,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  goalIcon: {
    fontSize: 26,
  },
  goalText: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  goalTitleActive: {
    color: colors.neon,
  },
  goalSub: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  check: {
    color: colors.neon,
    fontSize: 18,
  },
  btnWrap: {
    marginTop: 8,
  },
});
