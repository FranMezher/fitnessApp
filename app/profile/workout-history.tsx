import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass } from '@/constants/colors';
import { api, WorkoutSession } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDuration(startedAt: string, endedAt?: string): string {
  if (!endedAt) return 'En progreso';
  const mins = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}min`;
}

export default function WorkoutHistoryScreen() {
  const token = useAuthStore((s) => s.token);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.getSessions(token)
      .then(({ sessions: data }) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
        );
        setSessions(sorted);
      })
      .catch((err) => setError(err?.message ?? 'No se pudo cargar el historial'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Historial</Text>
          <View style={{ width: 72 }} />
        </View>

        {loading && <ActivityIndicator color={colors.neon} style={{ marginTop: 20 }} />}

        {error && (
          <View style={[glass, styles.emptyCard]}>
            <Text style={{ color: colors.orange, fontFamily: 'SpaceGrotesk_400Regular', textAlign: 'center' }}>
              {error}
            </Text>
          </View>
        )}

        {!loading && !error && sessions.length === 0 && (
          <View style={[glass, styles.emptyCard]}>
            <Text style={styles.emptyText}>
              Sin entrenamientos todavía.{'\n'}¡Completá tu primera sesión!
            </Text>
          </View>
        )}

        {sessions.map((session) => (
          <View key={session.id} style={[glass, styles.sessionCard]}>
            <View style={styles.sessionMain}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionDate}>{formatDate(session.startedAt)}</Text>
                <Text style={styles.sessionDuration}>
                  {formatDuration(session.startedAt, session.endedAt)}
                </Text>
              </View>
              <View style={styles.sessionStats}>
                {session.caloriesBurned != null && (
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.orange }]}>
                      {session.caloriesBurned}
                    </Text>
                    <Text style={styles.statLabel}>kcal</Text>
                  </View>
                )}
                {!session.endedAt && (
                  <View style={[styles.badge]}>
                    <Text style={styles.badgeText}>En progreso</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, gap: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backText: {
    fontSize: 14,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    width: 72,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
    textAlign: 'center',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  sessionCard: {
    padding: 14,
    paddingHorizontal: 16,
  },
  sessionMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionInfo: { gap: 3 },
  sessionDate: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  sessionDuration: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  sessionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: { alignItems: 'center' },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  statLabel: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  badge: {
    backgroundColor: 'rgba(204,255,0,0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  badgeText: {
    fontSize: 11,
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
});
