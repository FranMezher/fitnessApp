import { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { HudBackground } from '@/components/ui/HudBackground';
import { useAuthStore } from '@/stores/useAuthStore';
import { api, NutritionHistoryDay } from '@/lib/api';

const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function getDayLetter(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const idx = (d.getDay() + 6) % 7; // Mon=0
  return DAY_LETTERS[idx];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10);
}

export default function NutritionHistoryScreen() {
  const { token, profile } = useAuthStore();
  const [history, setHistory] = useState<NutritionHistoryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<NutritionHistoryDay | null>(null);

  const calorieGoal = profile?.targetCalories ?? 2000;

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.getNutritionHistory(token, 7)
      .then((r) => {
        setHistory(r.history);
        const todayEntry = r.history.find((d) => isToday(d.date));
        setSelectedDay(todayEntry ?? r.history[r.history.length - 1] ?? null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const maxCals = useMemo(() => {
    const max = Math.max(...history.map((d) => d.totalCalories), calorieGoal);
    return max || 1;
  }, [history, calorieGoal]);

  const avgCals = useMemo(() => {
    const withData = history.filter((d) => d.entryCount > 0);
    if (!withData.length) return 0;
    return Math.round(withData.reduce((s, d) => s + d.totalCalories, 0) / withData.length);
  }, [history]);

  const weekLabel = useMemo(() => {
    if (!history.length) return '';
    const first = new Date(history[0].date + 'T12:00:00');
    const last = new Date(history[history.length - 1].date + 'T12:00:00');
    return `${first.getDate()} ${first.toLocaleDateString('es', { month: 'short' })} – ${last.getDate()} ${last.toLocaleDateString('es', { month: 'short' })}`;
  }, [history]);

  return (
    <HudBackground style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerBrand}>FITCORE</Text>
          <Ionicons name="notifications-outline" size={22} color={colors.neon} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.neon} size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View>
              <Text style={styles.pageTitle}>Historial Nutricional</Text>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.neon} />
                <Text style={styles.dateLabel}>Últimos 7 días: {weekLabel}</Text>
              </View>
            </View>

            {/* Bar chart */}
            <View style={styles.chartCard}>
              <View style={styles.barChart}>
                {history.map((day) => {
                  const pct = day.totalCalories > 0
                    ? Math.min(100, (day.totalCalories / maxCals) * 100)
                    : 0;
                  const isSelected = selectedDay?.date === day.date;
                  const exceeded = day.totalCalories > calorieGoal;
                  const active = isToday(day.date);

                  return (
                    <TouchableOpacity
                      key={day.date}
                      style={styles.barCol}
                      onPress={() => setSelectedDay(day)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.barWrap}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: `${Math.max(pct, 2)}%`,
                              backgroundColor: exceeded ? colors.orange : isSelected ? colors.neon : 'rgba(204,255,0,0.5)',
                            },
                            active && styles.barActive,
                          ]}
                        />
                      </View>
                      <Text style={[styles.barLabel, active && styles.barLabelActive]}>
                        {getDayLetter(day.date)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Chart summary */}
              <View style={styles.chartSummary}>
                <View>
                  <Text style={styles.chartSummaryLabel}>PROMEDIO DIARIO</Text>
                  <Text style={styles.chartSummaryValue}>
                    {avgCals.toLocaleString()} <Text style={styles.chartSummaryUnit}>kcal</Text>
                  </Text>
                </View>
                <View style={styles.chartSummaryRight}>
                  <Text style={styles.chartSummaryLabel}>META</Text>
                  <Text style={styles.chartSummaryValue}>
                    {calorieGoal.toLocaleString()} <Text style={styles.chartSummaryUnit}>kcal</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* Weekly day list */}
            <View>
              <Text style={styles.sectionTitle}>RESUMEN SEMANAL</Text>
              {[...history].reverse().map((day) => {
                const isActive = isToday(day.date);
                const exceeded = day.totalCalories > calorieGoal && day.entryCount > 0;
                const isSelected = selectedDay?.date === day.date;
                const dayNum = new Date(day.date + 'T12:00:00').getDate();

                return (
                  <TouchableOpacity
                    key={day.date}
                    style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                    onPress={() => setSelectedDay(day)}
                    activeOpacity={0.75}
                  >
                    <View style={[
                      styles.dayNum,
                      isSelected ? styles.dayNumSelected : { borderWidth: 1, borderColor: exceeded ? colors.orange : colors.border },
                    ]}>
                      <Text style={[styles.dayNumText, isSelected && styles.dayNumTextSelected]}>
                        {dayNum}
                      </Text>
                    </View>
                    <View style={styles.dayInfo}>
                      <Text style={[styles.dayName, isSelected && { color: colors.neon }]}>
                        {formatDate(day.date)}
                      </Text>
                      <Text style={[styles.dayKcal, exceeded && { color: colors.orange }]}>
                        {day.entryCount > 0
                          ? exceeded
                            ? `+${day.totalCalories - calorieGoal} kcal excedido`
                            : `${day.totalCalories.toLocaleString()} / ${calorieGoal.toLocaleString()} kcal`
                          : isActive ? 'En progreso' : 'Sin registros'
                        }
                      </Text>
                    </View>
                    <View style={styles.dayRight}>
                      {isActive && day.entryCount > 0 ? (
                        <View style={styles.inProgressBadge}>
                          <Text style={styles.inProgressText}>EN PROGRESO</Text>
                        </View>
                      ) : exceeded ? (
                        <Ionicons name="alert-circle" size={20} color={colors.orange} />
                      ) : day.entryCount > 0 ? (
                        <Ionicons name="checkmark-circle" size={20} color={colors.neon} />
                      ) : null}
                      <Ionicons name="chevron-forward" size={18} color={colors.dim} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Macro breakdown for selected day */}
            {selectedDay && selectedDay.entryCount > 0 && (
              <View style={styles.breakdownCard}>
                <Text style={styles.sectionTitle}>DESGLOSE DE MACRONUTRIENTES</Text>
                <View style={styles.macroGrid}>
                  <MacroBreakdown
                    label="Proteína"
                    value={selectedDay.totalProteinG}
                    goal={profile?.targetProteinG ?? 150}
                    color={colors.neon}
                  />
                  <MacroBreakdown
                    label="Carbs"
                    value={selectedDay.totalCarbsG}
                    goal={profile?.targetCarbsG ?? 200}
                    color={colors.orange}
                  />
                  <MacroBreakdown
                    label="Grasas"
                    value={selectedDay.totalFatG}
                    goal={profile?.targetFatG ?? 55}
                    color={colors.teal}
                  />
                </View>

                {/* Link to that day's diary */}
                <TouchableOpacity
                  style={styles.viewDayBtn}
                  onPress={() => router.push({
                    pathname: '/nutrition/meal/lunch',
                    params: { date: selectedDay.date },
                  } as never)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewDayBtnText}>Ver diario de ese día</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.neon} />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </HudBackground>
  );
}

function MacroBreakdown({ label, value, goal, color }: {
  label: string; value: number; goal: number; color: string;
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <View style={styles.macroItem}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.macroValue, { color }]}>{Math.round(value)}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(8,8,8,0.85)',
  },
  headerBrand: { ...text.heroMd, color: colors.neon, fontSize: 20, letterSpacing: -0.5 },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 40 },
  pageTitle: { ...text.headlineLg, color: colors.text },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 },
  dateLabel: { ...text.bodyMd, color: colors.muted },
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: spacing.xs,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    gap: spacing.xs,
  },
  barWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 3,
    minHeight: 3,
  },
  barActive: {
    shadowColor: colors.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  barLabel: { ...text.labelSm, color: colors.muted, fontSize: 11 },
  barLabelActive: { color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold' },
  chartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chartSummaryLabel: { ...text.labelSm, color: colors.muted, marginBottom: 2 },
  chartSummaryValue: { ...text.headlineMd, color: colors.neon },
  chartSummaryUnit: { ...text.bodyMd, color: colors.muted },
  chartSummaryRight: { alignItems: 'flex-end' },
  sectionTitle: { ...text.labelCaps, color: colors.muted, marginBottom: spacing.sm },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  dayCardSelected: {
    backgroundColor: 'rgba(204,255,0,0.08)',
    borderColor: 'rgba(204,255,0,0.35)',
  },
  dayNum: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumSelected: { backgroundColor: colors.neon },
  dayNumText: { ...text.dataMono, fontSize: 16, color: colors.text },
  dayNumTextSelected: { color: colors.bg, fontFamily: 'SpaceGrotesk_700Bold' },
  dayInfo: { flex: 1, gap: 2 },
  dayName: { ...text.headlineMd, color: colors.text, textTransform: 'capitalize' },
  dayKcal: { ...text.dataMono, color: colors.muted },
  dayRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  inProgressBadge: {
    backgroundColor: 'rgba(204,255,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.35)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  inProgressText: { ...text.labelSm, color: colors.neon, fontSize: 9 },
  breakdownCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  macroGrid: { flexDirection: 'row', gap: spacing.md },
  macroItem: { flex: 1, gap: 6 },
  macroLabel: { ...text.labelSm, color: colors.muted },
  macroTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroFill: { height: '100%', borderRadius: 2 },
  macroValue: { ...text.dataMono, fontSize: 16 },
  viewDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  viewDayBtnText: { ...text.bodyMd, color: colors.neon, fontFamily: 'SpaceGrotesk_600SemiBold' },
});
