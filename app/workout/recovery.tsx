import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass } from '@/constants/colors';
import { Ring } from '@/components/ui/Ring';
import { Pill } from '@/components/ui/Pill';
import { Btn } from '@/components/ui/Btn';
import { GlassCard } from '@/components/ui/GlassCard';

const RECOVERY_ITEMS = [
  {
    icon: '💧',
    color: colors.teal,
    title: 'Hidratación',
    body: '500ml de agua en los próximos 30 min',
    tag: 'Ahora',
  },
  {
    icon: '🥩',
    color: colors.neon,
    title: 'Ventana anabólica',
    body: '30-40g proteína en los próximos 45 min',
    tag: '45 min',
  },
  {
    icon: '🧊',
    color: '#66aaff',
    title: 'Crioterapia opcional',
    body: 'Ducha fría 2 min si hay fatiga alta',
    tag: 'Opcional',
  },
  {
    icon: '😴',
    color: colors.purple,
    title: 'Sueño reparador',
    body: '7-8h esta noche · muscle repair peak',
    tag: 'Esta noche',
  },
];

export default function RecoveryScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Recuperación</Text>
        <Text style={styles.sub}>Basado en tu sesión de hoy</Text>

        {/* Recovery score */}
        <GlassCard style={styles.scoreCard}>
          <Ring percentage={74} size={120} color={colors.teal} value={74} label="Score" />
          <View style={styles.scoreText}>
            <Text style={styles.scoreTitle}>Recuperación buena</Text>
            <Text style={styles.scoreSub}>Listo para entrenar en ~20h</Text>
            <Text style={styles.scoreNext}>Próximo: mañana 7am</Text>
          </View>
        </GlassCard>

        {/* Recovery protocol */}
        {RECOVERY_ITEMS.map((r) => (
          <View key={r.title} style={[glass, styles.item]}>
            <View
              style={[
                styles.itemIcon,
                {
                  backgroundColor: `${r.color}18`,
                  borderColor: `${r.color}44`,
                },
              ]}
            >
              <Text style={styles.itemEmoji}>{r.icon}</Text>
            </View>
            <View style={styles.itemContent}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{r.title}</Text>
                <Pill color={r.color}>{r.tag}</Pill>
              </View>
              <Text style={styles.itemBody}>{r.body}</Text>
            </View>
          </View>
        ))}

        <Btn onPress={() => router.replace('/(tabs)')}>Volver al inicio</Btn>
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginBottom: 0,
  },
  sub: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginBottom: 4,
  },
  scoreCard: {
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scoreText: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  scoreSub: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  scoreNext: {
    fontSize: 12,
    color: colors.teal,
    marginTop: 3,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  item: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
  },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemEmoji: {
    fontSize: 17,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  itemBody: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
});
