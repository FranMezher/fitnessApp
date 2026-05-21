import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, Dimensions, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { HudBackground } from '@/components/ui/HudBackground';
import { RingChart } from '@/components/ui/RingChart';
import { useNutritionStore } from '@/stores/useNutritionStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { FoodLogEntry } from '@/lib/api';

// ─── Constants ───────────────────────────────────────────────────────────────

const MEAL_ICONS: Record<string, string> = {
  breakfast: 'sunny-outline',
  lunch:     'sunny',
  snack:     'cafe-outline',
  dinner:    'moon-outline',
};
const MEAL_NAMES: Record<string, string> = {
  breakfast: 'Desayuno', lunch: 'Almuerzo', snack: 'Merienda', dinner: 'Cena',
};
const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];
const DAILY_GOALS = { calories: 1840, proteinG: 145, carbsG: 200, fatG: 55 };
const WATER_GOAL = 8;

const DAY_SHORT = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const MONTH_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const DAY_CELL_W = 52;
const SCREEN_W = Dimensions.get('window').width;
const STRIP_DAYS = 60;

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toDateStr(d: Date): string { return d.toISOString().slice(0, 10); }
function todayStr(): string { return toDateStr(new Date()); }

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

function formatLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function formatShort(dateStr: string): string {
  const today = todayStr();
  const yesterday = addDays(today, -1);
  if (dateStr === today) return 'Hoy';
  if (dateStr === yesterday) return 'Ayer';
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

function buildStripDates(): string[] {
  const today = todayStr();
  return Array.from({ length: STRIP_DAYS + 1 }, (_, i) => addDays(today, i - STRIP_DAYS));
}

function buildCalendarGrid(year: number, month: number): (string | null)[][] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const startOffset = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function dotColor(dateStr: string, logCache: Record<string, { calories: number }>, calGoal = 2000): string {
  const entry = logCache[dateStr];
  if (!entry || entry.calories === 0) return 'transparent';
  const pct = entry.calories / calGoal;
  if (pct >= 1.0) return colors.neon;
  if (pct >= 0.5) return colors.orange;
  return colors.muted;
}

// ─── WeekStrip ────────────────────────────────────────────────────────────────

function WeekStrip({
  selectedDate, onSelect, logCache, calGoal,
}: {
  selectedDate: string;
  onSelect: (d: string) => void;
  logCache: Record<string, { calories: number; mealsCount: number }>;
  calGoal: number;
}) {
  const stripRef = useRef<ScrollView>(null);
  const stripDates = useMemo(() => buildStripDates(), []);

  useEffect(() => {
    const idx = stripDates.indexOf(selectedDate);
    if (idx < 0) return;
    const offset = idx * DAY_CELL_W - SCREEN_W / 2 + DAY_CELL_W / 2;
    stripRef.current?.scrollTo({ x: Math.max(0, offset), animated: true });
  }, [selectedDate]);

  return (
    <ScrollView
      ref={stripRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={stripStyles.container}
    >
      {stripDates.map((dateStr) => {
        const d = new Date(dateStr + 'T12:00:00');
        const isSelected = dateStr === selectedDate;
        const dot = dotColor(dateStr, logCache, calGoal);
        const isToday = dateStr === todayStr();
        return (
          <TouchableOpacity
            key={dateStr}
            style={[stripStyles.cell, isSelected && stripStyles.cellSelected, isToday && !isSelected && stripStyles.cellToday]}
            onPress={() => onSelect(dateStr)}
            activeOpacity={0.7}
          >
            <Text style={[stripStyles.dayLetter, isSelected && stripStyles.textSelected]}>
              {DAY_SHORT[d.getDay()]}
            </Text>
            <Text style={[stripStyles.dayNum, isSelected && stripStyles.textSelected]}>
              {d.getDate()}
            </Text>
            <View style={[stripStyles.dot, { backgroundColor: dot }]} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const stripStyles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, paddingVertical: 6, gap: 2, flexDirection: 'row' },
  cell: { width: DAY_CELL_W, alignItems: 'center', paddingVertical: 8, borderRadius: radius.md, gap: 2 },
  cellSelected: { backgroundColor: 'rgba(204,255,0,0.12)', borderWidth: 1, borderColor: 'rgba(204,255,0,0.4)' },
  cellToday: { borderWidth: 1, borderColor: 'rgba(204,255,0,0.2)', borderRadius: radius.md },
  dayLetter: { ...text.labelSm, color: colors.muted },
  dayNum: { fontSize: 15, fontWeight: '700', color: colors.muted, fontFamily: 'SpaceGrotesk_700Bold' },
  textSelected: { color: colors.neon },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
});

// ─── CalendarModal ────────────────────────────────────────────────────────────

function CalendarModal({
  visible, selectedDate, logCache, calGoal, onSelect, onClose,
}: {
  visible: boolean;
  selectedDate: string;
  logCache: Record<string, { calories: number; mealsCount: number }>;
  calGoal: number;
  onSelect: (d: string) => void;
  onClose: () => void;
}) {
  const today = todayStr();
  const initD = new Date(selectedDate + 'T12:00:00');
  const [month, setMonth] = useState(initD.getMonth());
  const [year, setYear] = useState(initD.getFullYear());
  const rows = useMemo(() => buildCalendarGrid(year, month), [year, month]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    const nowD = new Date();
    if (year > nowD.getFullYear() || (year === nowD.getFullYear() && month >= nowD.getMonth())) return;
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const nowD = new Date();
  const isLastMonth = year === nowD.getFullYear() && month >= nowD.getMonth();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={calStyles.overlay} onPress={onClose}>
        <Pressable style={calStyles.card} onPress={() => {}}>
          <View style={calStyles.monthHeader}>
            <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={calStyles.monthLabel}>{MONTH_SHORT[month]} {year}</Text>
            <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn} disabled={isLastMonth}>
              <Ionicons name="chevron-forward" size={22} color={isLastMonth ? colors.dim : colors.text} />
            </TouchableOpacity>
          </View>
          <View style={calStyles.dayHeaders}>
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map((d) => (
              <Text key={d} style={calStyles.dayHeader}>{d}</Text>
            ))}
          </View>
          {rows.map((row, ri) => (
            <View key={ri} style={calStyles.row}>
              {row.map((dateStr, ci) => {
                if (!dateStr) return <View key={ci} style={calStyles.emptyCell} />;
                const isFuture = dateStr > today;
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === today;
                const dot = dotColor(dateStr, logCache, calGoal);
                return (
                  <TouchableOpacity
                    key={ci}
                    style={[calStyles.dayCell, isSelected && calStyles.dayCellSelected, isToday && !isSelected && calStyles.dayCellToday]}
                    onPress={() => { if (!isFuture) { onSelect(dateStr); onClose(); } }}
                    activeOpacity={isFuture ? 1 : 0.7}
                    disabled={isFuture}
                  >
                    <Text style={[calStyles.dayNum, isFuture && calStyles.dayFuture, isSelected && calStyles.dayNumSelected, isToday && !isSelected && calStyles.dayNumToday]}>
                      {parseInt(dateStr.split('-')[2], 10)}
                    </Text>
                    {dot !== 'transparent' && !isFuture && (
                      <View style={[calStyles.dot, { backgroundColor: dot }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          <View style={calStyles.legend}>
            <View style={calStyles.legendItem}>
              <View style={[calStyles.legendDot, { backgroundColor: colors.neon }]} />
              <Text style={calStyles.legendText}>Meta cumplida</Text>
            </View>
            <View style={calStyles.legendItem}>
              <View style={[calStyles.legendDot, { backgroundColor: colors.orange }]} />
              <Text style={calStyles.legendText}>Parcial</Text>
            </View>
          </View>
          <TouchableOpacity style={calStyles.closeBtn} onPress={onClose}>
            <Text style={calStyles.closeBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const calStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  card: { width: '100%', backgroundColor: '#111', borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: spacing.md, gap: spacing.sm },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 4 },
  navBtn: { padding: spacing.sm },
  monthLabel: { ...text.headlineMd, color: colors.text },
  dayHeaders: { flexDirection: 'row', marginBottom: 2 },
  dayHeader: { flex: 1, textAlign: 'center', ...text.labelSm, color: colors.dim, fontSize: 10 },
  row: { flexDirection: 'row' },
  emptyCell: { flex: 1, height: 44 },
  dayCell: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, gap: 2 },
  dayCellSelected: { backgroundColor: colors.neon },
  dayCellToday: { borderWidth: 1, borderColor: colors.neon },
  dayNum: { fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: 'SpaceGrotesk_600SemiBold' },
  dayNumSelected: { color: colors.bg },
  dayNumToday: { color: colors.neon },
  dayFuture: { color: colors.dim, opacity: 0.4 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  legend: { flexDirection: 'row', gap: spacing.lg, justifyContent: 'center', paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...text.labelSm, color: colors.muted },
  closeBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center', marginTop: 4 },
  closeBtnText: { ...text.bodyMd, color: colors.muted, fontFamily: 'SpaceGrotesk_600SemiBold' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NutritionScreen() {
  const today = useMemo(() => todayStr(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { foodLog, fetchFoodLog, loading, waterByDate, fetchWater, setWaterGlasses, logCache } = useNutritionStore();
  const waterGlasses = waterByDate[selectedDate] ?? 0;
  const { profile, fetchProfile } = useAuthStore();

  const goals = {
    calories: profile?.targetCalories ?? DAILY_GOALS.calories,
    proteinG: profile?.targetProteinG ?? DAILY_GOALS.proteinG,
    carbsG:   profile?.targetCarbsG   ?? DAILY_GOALS.carbsG,
    fatG:     profile?.targetFatG     ?? DAILY_GOALS.fatG,
  };

  useEffect(() => { if (!profile) fetchProfile(); }, []);
  useEffect(() => { fetchFoodLog(selectedDate); fetchWater(selectedDate); }, [selectedDate]);

  const handleSelectDate = useCallback((d: string) => {
    if (d <= today) setSelectedDate(d);
  }, [today]);

  const byMeal = useMemo(() => {
    const m: Record<string, FoodLogEntry[]> = { breakfast: [], lunch: [], snack: [], dinner: [] };
    for (const e of foodLog) { if (m[e.mealType]) m[e.mealType].push(e); }
    return m;
  }, [foodLog]);

  const totalCal   = foodLog.reduce((s, e) => s + e.calories, 0);
  const totalProt  = foodLog.reduce((s, e) => s + e.proteinG, 0);
  const totalCarbs = foodLog.reduce((s, e) => s + e.carbsG, 0);
  const totalFat   = foodLog.reduce((s, e) => s + e.fatG, 0);

  const calPct   = Math.min(1, totalCal / goals.calories);
  const protPct  = Math.min(1, totalProt / goals.proteinG);
  const carbsPct = Math.min(1, totalCarbs / goals.carbsG);
  const fatPct   = Math.min(1, totalFat / goals.fatG);
  const waterMl  = waterGlasses * 250;
  const waterGoalMl = WATER_GOAL * 250;

  const isToday = selectedDate === today;
  const cachedDay = logCache[selectedDate];

  return (
    <HudBackground style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* TopAppBar */}
        <View style={styles.topBar}>
          <Text style={styles.logo}>FITCORE</Text>
          <View style={styles.topActions}>
            <TouchableOpacity
              onPress={() => router.push('/nutrition/history' as never)}
              style={styles.topBtn}
            >
              <Ionicons name="bar-chart-outline" size={22} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCalendarOpen(true)}
              style={styles.topBtn}
            >
              <Ionicons name="calendar-outline" size={22} color={colors.neon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Week strip */}
        <WeekStrip
          selectedDate={selectedDate}
          onSelect={handleSelectDate}
          logCache={logCache}
          calGoal={goals.calories}
        />

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Date header */}
          <View style={styles.dateHeader}>
            <View>
              <Text style={styles.todayLabel}>{isToday ? 'HOY' : formatShort(selectedDate).toUpperCase()}</Text>
              <Text style={styles.pageTitle}>Resumen Nutricional</Text>
            </View>
            <Text style={styles.goalLabel}>Meta: {goals.calories.toLocaleString()} kcal</Text>
          </View>

          {/* Past-day banner */}
          {!isToday && cachedDay && (
            <View style={styles.pastBanner}>
              <Text style={styles.pastDate}>{formatLong(selectedDate)}</Text>
              <Text style={styles.pastStats}>
                {cachedDay.calories} / {goals.calories} kcal · {cachedDay.mealsCount} {cachedDay.mealsCount === 1 ? 'comida' : 'comidas'}
              </Text>
            </View>
          )}

          {/* Calorie ring card */}
          <View style={[glass, styles.calCard]}>
            <View style={styles.calAccent} />
            {loading ? (
              <ActivityIndicator color={colors.neon} style={{ paddingVertical: 40, flex: 1 }} />
            ) : (
              <View style={styles.calContent}>
                <RingChart
                  size={140}
                  rings={[{ radius: 62, strokeWidth: 12, progress: calPct, color: colors.neon, trackColor: 'rgba(255,255,255,0.05)' }]}
                >
                  <View style={styles.calCenter}>
                    <Text style={styles.calRemaining}>{Math.max(0, goals.calories - totalCal).toLocaleString()}</Text>
                    <Text style={styles.calRemainingLabel}>KCAL RESTANTES</Text>
                  </View>
                </RingChart>
                <View style={styles.calStatsRow}>
                  <View style={styles.calStat}>
                    <Text style={styles.calStatVal}>{totalCal.toLocaleString()}</Text>
                    <Text style={styles.calStatLabel}>CONSUMIDAS</Text>
                  </View>
                  <View style={styles.calStatDivider} />
                  <View style={styles.calStat}>
                    <Text style={styles.calStatVal}>{goals.calories.toLocaleString()}</Text>
                    <Text style={styles.calStatLabel}>META</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Macros 3-col */}
          <View style={styles.macrosRow}>
            {[
              { label: 'PROTEÍNAS', val: totalProt,  goal: goals.proteinG, pct: protPct,  color: colors.neon },
              { label: 'CARBOS',    val: totalCarbs,  goal: goals.carbsG,   pct: carbsPct, color: colors.orange },
              { label: 'GRASAS',    val: totalFat,    goal: goals.fatG,     pct: fatPct,   color: colors.teal },
            ].map((m) => (
              <View key={m.label} style={[glass, styles.macroCard, { borderLeftColor: m.color }]}>
                <Text style={styles.macroLabel}>{m.label}</Text>
                <Text style={styles.macroVal}>{Math.round(m.val)}/{m.goal}g</Text>
                <View style={styles.macroBarTrack}>
                  <View style={[styles.macroBarFill, { width: `${Math.round(m.pct * 100)}%`, backgroundColor: m.color }]} />
                </View>
              </View>
            ))}
          </View>

          {/* Modo Despensa CTA */}
          <TouchableOpacity
            style={styles.pantryBtn}
            onPress={() => router.push('/nutrition/pantry')}
            activeOpacity={0.85}
          >
            <View style={styles.pantryBtnLeft}>
              <View style={styles.pantryBtnIcon}>
                <Ionicons name="sparkles" size={18} color={colors.bg} />
              </View>
              <View style={styles.pantryBtnInfo}>
                <Text style={styles.pantryBtnTitle}>Modo Despensa</Text>
                <Text style={styles.pantryBtnSub}>Genera recetas con lo que tenés en casa</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.bg} />
          </TouchableOpacity>

          {/* Diario header */}
          <View style={styles.diaryHeader}>
            <Text style={styles.diaryTitle}>Diario de {isToday ? 'Hoy' : formatShort(selectedDate)}</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/nutrition/add-food', params: { date: selectedDate } } as never)}>
              <Ionicons name="add-circle-outline" size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Meal cards */}
          {MEAL_ORDER.map((mealId) => {
            const entries = byMeal[mealId];
            const mealCal = entries.reduce((s, e) => s + e.calories, 0);
            const hasFoods = entries.length > 0;
            return (
              <TouchableOpacity
                key={mealId}
                style={[glass, styles.mealCard, !hasFoods && styles.mealCardEmpty]}
                activeOpacity={0.75}
                onPress={() => hasFoods
                  ? router.push({ pathname: '/nutrition/meal/[id]', params: { id: mealId, date: selectedDate } })
                  : router.push({ pathname: '/nutrition/add-food', params: { meal: mealId, date: selectedDate } } as never)
                }
              >
                <View style={[styles.mealIconWrap, !hasFoods && styles.mealIconWrapEmpty]}>
                  <Ionicons name={MEAL_ICONS[mealId] as any} size={24} color={hasFoods ? colors.neon : colors.dim} />
                </View>
                <View style={styles.mealInfo}>
                  <View style={styles.mealTopRow}>
                    <Text style={[styles.mealName, !hasFoods && styles.mealNameMuted]}>
                      {MEAL_NAMES[mealId]}
                    </Text>
                    {hasFoods ? (
                      <Text style={styles.mealKcal}>{mealCal} kcal</Text>
                    ) : (
                      <Text style={styles.mealPending}>Pendiente</Text>
                    )}
                  </View>
                  {hasFoods ? (
                    <Text style={styles.mealDesc} numberOfLines={1}>
                      {entries.map((e) => e.foodName).join(', ')}
                    </Text>
                  ) : (
                    <Text style={styles.mealDescEmpty}>Registra tu {MEAL_NAMES[mealId].toLowerCase()}</Text>
                  )}
                </View>
                <Ionicons name={hasFoods ? 'chevron-forward' : 'add'} size={20} color={colors.dim} />
              </TouchableOpacity>
            );
          })}

          {/* Hydration */}
          <View style={[glass, styles.waterCard]}>
            <View style={styles.waterHeader}>
              <View style={styles.waterHeaderLeft}>
                <Ionicons name="water-outline" size={20} color={colors.teal} />
                <Text style={styles.waterTitle}>Hidratación</Text>
              </View>
              <Text style={styles.waterAmount}>{waterMl} / {waterGoalMl} ml</Text>
            </View>
            <View style={styles.waterCups}>
              {Array.from({ length: WATER_GOAL }, (_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.waterCup, i < waterGlasses ? styles.waterCupFilled : styles.waterCupEmpty]}
                  onPress={() => setWaterGlasses(selectedDate, i < waterGlasses ? i : i + 1)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={i < waterGlasses ? 'water' : 'water-outline'}
                    size={18}
                    color={i < waterGlasses ? colors.teal : colors.dim}
                  />
                  {i < waterGlasses && <Text style={styles.waterCupMl}>250ml</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <CalendarModal
          visible={calendarOpen}
          selectedDate={selectedDate}
          logCache={logCache}
          calGoal={goals.calories}
          onSelect={handleSelectDate}
          onClose={() => setCalendarOpen(false)}
        />
      </SafeAreaView>
    </HudBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 56,
    backgroundColor: 'rgba(8,8,8,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { ...text.heroMd, fontSize: 20, color: colors.neon, letterSpacing: -0.5 },
  topActions: { flexDirection: 'row', gap: spacing.sm },
  topBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  container: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md, paddingTop: spacing.md },

  dateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  todayLabel: { ...text.labelSm, color: colors.neon },
  pageTitle: { ...text.headlineLg, color: colors.text },
  goalLabel: { ...text.dataMono, color: colors.muted },

  pastBanner: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pastDate: { ...text.headlineMd, fontSize: 13, color: colors.text },
  pastStats: { ...text.bodyMd, color: colors.muted },

  calCard: { borderRadius: radius.lg, overflow: 'hidden', flexDirection: 'row' },
  calAccent: { width: 3, backgroundColor: colors.neon },
  calContent: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.md },
  calCenter: { alignItems: 'center' },
  calRemaining: { ...text.heroMd, color: colors.text, fontSize: 30 },
  calRemainingLabel: { ...text.labelSm, color: colors.muted },
  calStatsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  calStat: { alignItems: 'center', gap: 2 },
  calStatVal: { ...text.dataMono, color: colors.neon, fontSize: 15 },
  calStatLabel: { ...text.labelSm, color: colors.muted },
  calStatDivider: { width: 1, height: 24, backgroundColor: colors.border },

  macrosRow: { flexDirection: 'row', gap: spacing.xs },
  macroCard: { flex: 1, padding: spacing.sm, borderRadius: radius.lg, borderLeftWidth: 2, gap: 4 },
  macroLabel: { ...text.labelSm, color: colors.muted },
  macroVal: { ...text.dataMono, color: colors.text, fontSize: 12 },
  macroBarTrack: { height: 3, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden', marginTop: 2 },
  macroBarFill: { height: '100%', borderRadius: radius.full },

  pantryBtn: {
    backgroundColor: colors.neon,
    borderRadius: radius.lg,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  pantryBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pantryBtnIcon: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: radius.sm,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pantryBtnInfo: { gap: 2 },
  pantryBtnTitle: { ...text.headlineMd, color: colors.bg },
  pantryBtnSub: { ...text.labelSm, color: 'rgba(0,0,0,0.6)', letterSpacing: 1 },

  diaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  diaryTitle: { ...text.headlineMd, color: colors.text },

  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  mealCardEmpty: { borderStyle: 'dashed' },
  mealIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealIconWrapEmpty: { opacity: 0.5 },
  mealInfo: { flex: 1, gap: 4 },
  mealTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  mealName: { ...text.headlineMd, color: colors.text },
  mealNameMuted: { color: colors.muted },
  mealKcal: { ...text.dataMono, color: colors.neon, fontSize: 13 },
  mealPending: { ...text.dataMono, color: colors.muted, fontSize: 13 },
  mealDesc: { ...text.bodyMd, color: colors.muted },
  mealDescEmpty: { ...text.bodyMd, color: colors.dim, fontStyle: 'italic' },

  waterCard: { padding: spacing.md, borderRadius: radius.lg, gap: spacing.md },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waterHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  waterTitle: { ...text.headlineMd, color: colors.text },
  waterAmount: { ...text.dataMono, color: colors.teal, fontSize: 13 },
  waterCups: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  waterCup: {
    width: 44,
    height: 56,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  waterCupFilled: {
    backgroundColor: 'rgba(61,255,160,0.08)',
    borderColor: 'rgba(61,255,160,0.35)',
  },
  waterCupEmpty: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: colors.border,
  },
  waterCupMl: { fontSize: 8, color: colors.teal, fontFamily: 'SpaceGrotesk_600SemiBold' },
});
