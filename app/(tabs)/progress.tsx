import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { colors, glass, glassNeon } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { HudBackground } from '@/components/ui/HudBackground';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { api, BodyMetric } from '@/lib/api';

// ─── Weight sparkline ────────────────────────────────────────────────────────
function WeightChart({ points }: { points: number[] }) {
  const W = 300, H = 90, pad = 8;
  if (points.length < 2) return null;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const stepX = (W - pad * 2) / (points.length - 1);
  const coords = points.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / range) * (H - pad * 2);
    return { x, y };
  });
  const poly = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const last = coords[coords.length - 1];
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Polyline points={poly} fill="none" stroke={colors.neon} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={last.x} cy={last.y} r={4} fill={colors.neon} />
    </Svg>
  );
}

const MEASURE_FIELDS: { key: keyof BodyMetric; label: string; unit: string }[] = [
  { key: 'weightKg',   label: 'Peso',     unit: 'kg' },
  { key: 'bodyFatPct', label: '% Grasa',  unit: '%' },
  { key: 'waistCm',    label: 'Cintura',  unit: 'cm' },
  { key: 'chestCm',    label: 'Pecho',    unit: 'cm' },
  { key: 'hipCm',      label: 'Cadera',   unit: 'cm' },
  { key: 'armCm',      label: 'Brazo',    unit: 'cm' },
  { key: 'thighCm',    label: 'Muslo',    unit: 'cm' },
];

export default function ProgressScreen() {
  const { token, profile, fetchProfile } = useAuthStore();
  const { streak, sessions, fetchStreak, fetchSessions } = useWorkoutStore();
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function loadMetrics() {
    if (!token) return;
    const { entries } = await api.getBodyMetrics(token).catch(() => ({ entries: [] as BodyMetric[] }));
    setMetrics(entries);
  }

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    if (!profile) fetchProfile();
    setLoading(true);
    // Wrap each promise so a single failure (e.g. /streak 500) doesn't reject
    // the whole Promise.all and leave the screen empty with no signal in logs.
    Promise.all([
      fetchStreak().catch((err) => console.warn('[progress] fetchStreak failed:', err)),
      fetchSessions().catch((err) => console.warn('[progress] fetchSessions failed:', err)),
      loadMetrics().catch((err) => console.warn('[progress] loadMetrics failed:', err)),
    ]).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // newest first → latest is metrics[0]
  const latest = metrics[0];
  const startWeight = metrics.length ? metrics[metrics.length - 1].weightKg : profile?.weightKg;
  const currentWeight = latest?.weightKg ?? profile?.weightKg;
  const targetWeight = profile?.targetWeightKg;

  const weightPct = useMemo(() => {
    if (currentWeight == null || targetWeight == null || startWeight == null) return null;
    const totalDelta = startWeight - targetWeight;
    if (totalDelta === 0) return 1;
    const doneDelta = startWeight - currentWeight;
    return Math.max(0, Math.min(1, doneDelta / totalDelta));
  }, [startWeight, currentWeight, targetWeight]);

  const weightSeries = useMemo(
    () => metrics.filter((m) => m.weightKg != null).map((m) => m.weightKg!).reverse(),
    [metrics],
  );

  const sessionsThisWeek = useMemo(() => {
    const monday = new Date();
    const day = monday.getDay();
    monday.setDate(monday.getDate() + ((day === 0 ? -6 : 1) - day));
    monday.setHours(0, 0, 0, 0);
    return sessions.filter((s) => s.endedAt && new Date(s.startedAt) >= monday).length;
  }, [sessions]);

  const completedSessions = sessions.filter((s) => s.endedAt);

  async function handleSave() {
    if (!token) return;
    const payload: Record<string, number> = {};
    for (const f of MEASURE_FIELDS) {
      const raw = form[f.key];
      if (raw != null && raw.trim() !== '') {
        const n = parseFloat(raw.replace(',', '.'));
        if (!Number.isNaN(n) && n > 0) payload[f.key] = n;
      }
    }
    if (Object.keys(payload).length === 0) {
      Alert.alert('Nada para guardar', 'Ingresá al menos un valor.');
      return;
    }
    setSaving(true);
    try {
      await api.addBodyMetric(token, payload as any);
      setForm({});
      setModalOpen(false);
      await loadMetrics();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <HudBackground style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.topBar}>
          <Text style={styles.headerBrand}>FITCORE</Text>
          <TouchableOpacity style={styles.logBtn} onPress={() => setModalOpen(true)} activeOpacity={0.85}>
            <Ionicons name="add" size={16} color={colors.bg} />
            <Text style={styles.logBtnText}>Registrar</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.neon} size="large" /></View>
        ) : (
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.pageTitle}>Tu Progreso</Text>

            {/* Weight hero */}
            <View style={[glassNeon, styles.weightCard]}>
              <Text style={styles.cardLabel}>PESO ACTUAL</Text>
              <View style={styles.weightRow}>
                <Text style={styles.weightNum}>{currentWeight != null ? currentWeight.toFixed(1) : '—'}</Text>
                <Text style={styles.weightUnit}>kg</Text>
                {targetWeight != null && (
                  <Text style={styles.weightTarget}>Meta {targetWeight.toFixed(1)} kg</Text>
                )}
              </View>
              {weightPct != null && (
                <>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.round(weightPct * 100)}%` }]} />
                  </View>
                  <Text style={styles.progressSub}>{Math.round(weightPct * 100)}% hacia tu objetivo</Text>
                </>
              )}
              {weightSeries.length >= 2 && (
                <View style={styles.chartWrap}><WeightChart points={weightSeries} /></View>
              )}
            </View>

            {/* Streak (consistency) */}
            {(streak?.currentStreak ?? 0) > 0 && (
              <View style={styles.streakCard}>
                <View style={styles.streakLeft}>
                  <Ionicons name="flame" size={32} color={colors.orange} />
                  <View>
                    <Text style={styles.streakNum}>{streak!.currentStreak}</Text>
                    <Text style={styles.streakLabel}>días de constancia</Text>
                  </View>
                </View>
                <View style={styles.streakRight}>
                  <Text style={styles.streakBestLabel}>MEJOR</Text>
                  <Text style={styles.streakBestNum}>{streak!.longestStreak} días</Text>
                </View>
              </View>
            )}

            {/* Workout history summary */}
            <View style={styles.statsGrid}>
              <View style={[glass, styles.statCard]}>
                <Text style={styles.statLabel}>ENTRENOS</Text>
                <Text style={styles.statValue}>{completedSessions.length}</Text>
                <Text style={styles.statUnit}>totales</Text>
              </View>
              <View style={[glass, styles.statCard]}>
                <Text style={styles.statLabel}>ESTA SEMANA</Text>
                <Text style={styles.statValue}>{sessionsThisWeek}</Text>
                <Text style={styles.statUnit}>sesiones</Text>
              </View>
            </View>

            {/* Latest measurements */}
            {latest && (
              <>
                <Text style={styles.sectionTitle}>ÚLTIMAS MEDIDAS</Text>
                <View style={styles.measuresGrid}>
                  {MEASURE_FIELDS.filter((f) => latest[f.key] != null).map((f) => (
                    <View key={f.key} style={[glass, styles.measureCard]}>
                      <Text style={styles.measureLabel}>{f.label}</Text>
                      <Text style={styles.measureValue}>
                        {(latest[f.key] as number).toFixed(1)}<Text style={styles.measureUnit}> {f.unit}</Text>
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Recent workouts */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>ENTRENOS RECIENTES</Text>
              <TouchableOpacity onPress={() => router.push('/profile/workout-history')}>
                <Text style={styles.linkText}>Ver todo</Text>
              </TouchableOpacity>
            </View>
            {completedSessions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="barbell-outline" size={32} color={colors.dim} />
                <Text style={styles.emptyText}>Todavía no completaste entrenos.</Text>
              </View>
            ) : (
              completedSessions.slice(0, 4).map((s) => (
                <View key={s.id} style={[glass, styles.sessionRow]}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.neon} />
                  <Text style={styles.sessionDate}>
                    {new Date(s.startedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </Text>
                  <Text style={styles.sessionKcal}>{s.caloriesBurned ?? 0} kcal</Text>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* Log modal */}
        {modalOpen && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackdrop} onPress={() => setModalOpen(false)} />
            <View style={styles.modal}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Registrar medidas</Text>
              <Text style={styles.modalSub}>Completá lo que quieras medir hoy.</Text>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {MEASURE_FIELDS.map((f) => (
                  <View key={f.key} style={styles.modalField}>
                    <Text style={styles.modalFieldLabel}>{f.label} ({f.unit})</Text>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="decimal-pad"
                      placeholder="—"
                      placeholderTextColor={colors.dim}
                      value={form[f.key] ?? ''}
                      onChangeText={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
                      selectionColor={colors.neon}
                    />
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, saving && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving
                  ? <ActivityIndicator color={colors.bg} />
                  : <Text style={styles.modalPrimaryBtnText}>Guardar</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </HudBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, height: 56,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: 'rgba(8,8,8,0.85)',
  },
  headerBrand: { ...text.heroMd, color: colors.neon, fontSize: 20, letterSpacing: -0.5 },
  logBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.neon, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  logBtnText: { ...text.labelSm, color: colors.bg },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  pageTitle: { ...text.headlineLg, color: colors.text, marginBottom: spacing.xs },

  // Weight card
  weightCard: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  cardLabel: { ...text.labelCaps, color: colors.neon },
  weightRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  weightNum: { ...text.heroMd, color: colors.text, fontSize: 44, lineHeight: 46 },
  weightUnit: { ...text.bodyLg, color: colors.muted, paddingBottom: 6 },
  weightTarget: { ...text.labelSm, color: colors.muted, marginLeft: 'auto', paddingBottom: 8 },
  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginTop: spacing.xs },
  progressFill: { height: '100%', backgroundColor: colors.neon, borderRadius: 3 },
  progressSub: { ...text.labelSm, color: colors.muted },
  chartWrap: { marginTop: spacing.sm },

  // Streak
  streakCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,107,53,0.06)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.25)',
    borderRadius: radius.lg, padding: spacing.md,
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  streakNum: { ...text.heroMd, color: colors.orange, fontSize: 32, lineHeight: 36 },
  streakLabel: { ...text.bodyMd, color: colors.muted },
  streakRight: { alignItems: 'flex-end' },
  streakBestLabel: { ...text.labelSm, color: colors.muted },
  streakBestNum: { ...text.headlineMd, color: colors.text },

  // Stats grid
  statsGrid: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, padding: spacing.md, borderRadius: radius.lg, gap: 2 },
  statLabel: { ...text.labelSm, color: colors.muted },
  statValue: { ...text.heroMd, color: colors.text, fontSize: 28, lineHeight: 32 },
  statUnit: { ...text.labelSm, color: colors.dim },

  // Sections
  sectionTitle: { ...text.labelCaps, color: colors.muted, marginTop: spacing.xs },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  linkText: { ...text.labelSm, color: colors.neon },

  // Measures
  measuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  measureCard: { width: '47%', padding: spacing.md, borderRadius: radius.lg, gap: 2 },
  measureLabel: { ...text.labelSm, color: colors.muted },
  measureValue: { ...text.headlineLg, color: colors.text, fontSize: 22 },
  measureUnit: { ...text.bodyMd, color: colors.muted, fontSize: 13 },

  // Sessions
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg },
  sessionDate: { ...text.bodyMd, color: colors.text, flex: 1 },
  sessionKcal: { ...text.dataMono, color: colors.orange },

  // Empty
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', gap: spacing.sm,
  },
  emptyText: { ...text.bodyMd, color: colors.muted, textAlign: 'center' },

  // Modal
  modalOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: {
    backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: colors.border,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, gap: spacing.sm,
    maxHeight: '85%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.dim, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.xs },
  modalTitle: { ...text.headlineLg, color: colors.text },
  modalSub: { ...text.bodyMd, color: colors.muted },
  modalScroll: { maxHeight: 320 },
  modalField: { gap: 4, marginBottom: spacing.sm },
  modalFieldLabel: { ...text.labelSm, color: colors.muted },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    color: colors.text, fontSize: 16, fontFamily: 'SpaceGrotesk_400Regular',
  },
  modalPrimaryBtn: { backgroundColor: colors.neon, borderRadius: radius.full, paddingVertical: 14, alignItems: 'center', marginTop: spacing.xs },
  modalPrimaryBtnText: { ...text.bodyLg, color: colors.bg, fontFamily: 'SpaceGrotesk_700Bold' },
  modalCancelBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  modalCancelText: { ...text.bodyMd, color: colors.muted },
});
