import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, glass } from '@/constants/colors';
import { Pill } from '@/components/ui/Pill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GlassCard } from '@/components/ui/GlassCard';

const ACHIEVEMENTS = [
  { icon: '🔥', name: 'Primera llama', desc: '5 días de racha', done: true, pct: 100 },
  { icon: '💪', name: 'Sin excusas', desc: '3 entrenos completados', done: true, pct: 100 },
  { icon: '🥗', name: 'Nutrido', desc: '7 días de comidas registradas', done: false, pct: 71 },
];

const LEAGUE = [
  { pos: 1, name: 'MariF.', xp: '2,340 XP', you: false },
  { pos: 2, name: 'Tú', xp: '1,240 XP', you: true },
  { pos: 3, name: 'Juanp.', xp: '980 XP', you: false },
];

export default function ProgressScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tu progreso</Text>
          <Pill color={colors.neon}>Semana 1</Pill>
        </View>

        {/* Level card */}
        <View style={styles.levelCard}>
          <Text style={styles.levelIcon}>🏆</Text>
          <Text style={styles.levelTitle}>Nivel 3 · Atleta Emergente</Text>
          <Text style={styles.levelSub}>1,240 / 2,000 XP para nivel 4</Text>
          <ProgressBar pct={62} />
        </View>

        {/* Achievements header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Logros</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {ACHIEVEMENTS.map((a) => (
          <View
            key={a.name}
            style={[glass, styles.achievement, !a.done && styles.achievementDim]}
          >
            <View
              style={[
                styles.achieveIcon,
                a.done
                  ? { backgroundColor: `${colors.neon}18`, borderColor: `${colors.neon}44` }
                  : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: colors.border },
              ]}
            >
              <Text style={styles.achieveEmoji}>{a.icon}</Text>
            </View>
            <View style={styles.achieveText}>
              <Text style={[styles.achieveName, !a.done && styles.achieveNameDim]}>{a.name}</Text>
              <Text style={styles.achieveDesc}>{a.desc}</Text>
              {!a.done && (
                <View style={styles.achieveBar}>
                  <ProgressBar pct={a.pct} color={colors.dim} h={3} />
                </View>
              )}
            </View>
            {a.done && <Text style={styles.star}>★</Text>}
          </View>
        ))}

        {/* League */}
        <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 8 }]}>Liga semanal</Text>
        {LEAGUE.map((u) => (
          <View
            key={u.name}
            style={[
              styles.leagueRow,
              u.you
                ? { backgroundColor: `${colors.neon}0d`, borderColor: colors.borderAccent }
                : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: colors.border },
            ]}
          >
            <Text style={[styles.leaguePos, { color: u.pos === 1 ? '#FFD700' : colors.dim }]}>
              {u.pos}
            </Text>
            <View style={styles.leagueAvatar}>
              <Text style={styles.leagueAvatarText}>{u.name[0]}</Text>
            </View>
            <Text style={[styles.leagueName, u.you && styles.leagueNameYou]}>{u.name}</Text>
            <Text style={styles.leagueXp}>{u.xp}</Text>
          </View>
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
    gap: 8,
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
  levelCard: {
    background: 'linear-gradient(135deg, rgba(204,255,0,0.08), rgba(204,255,0,0.03))',
    backgroundColor: 'rgba(204,255,0,0.06)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  levelIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  levelTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
    textAlign: 'center',
  },
  levelSub: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 8,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  seeAll: {
    fontSize: 13,
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 11,
    paddingHorizontal: 14,
  },
  achievementDim: {
    opacity: 0.7,
  },
  achieveIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achieveEmoji: {
    fontSize: 18,
  },
  achieveText: {
    flex: 1,
  },
  achieveName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  achieveNameDim: {
    fontWeight: '400',
    color: colors.muted,
  },
  achieveDesc: {
    fontSize: 12,
    color: colors.dim,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  achieveBar: {
    marginTop: 4,
  },
  star: {
    color: colors.neon,
    fontSize: 18,
  },
  leagueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  leaguePos: {
    fontSize: 16,
    fontWeight: '700',
    width: 18,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  leagueAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  leagueName: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  leagueNameYou: {
    color: colors.neon,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  leagueXp: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
});
