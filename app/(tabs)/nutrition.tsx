import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, Dimensions, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Ring } from '@/components/ui/Ring';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Label } from '@/components/ui/Label';
import { useNutritionStore } from '@/stores/useNutritionStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { FoodLogEntry } from '@/lib/api';

// ─── Constants ───────────────────────────────────────────────────────────────

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅', lunch: '☀️', snack: '🍎', dinner: '🌙',
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
// Number of past days to show in the strip (60 days back)
const STRIP_DAYS = 60;

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayStr(): string {
  return toDateStr(new Date());
}

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

// Build list of dates for the strip (from STRIP_DAYS ago to today)
function buildStripDates(): string[] {
  const today = todayStr();
  return Array.from({ length: STRIP_DAYS + 1 }, (_, i) => addDays(today, i - STRIP_DAYS));
}

// Build a 6×7 grid for the calendar month view
function buildCalendarGrid(year: number, month: number): (string | null)[][] {
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun
  // Shift to Mon-first: 0=Mon … 6=Sun
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

// ─── Dot color helper ─────────────────────────────────────────────────────────

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
  selectedDate,
  onSelect,
  logCache,
  calGoal,
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
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 2,
    flexDirection: 'row',
  },
  cell: {
    width: DAY_CELL_W,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 2,
  },
  cellSelected: {
    backgroundColor: 'rgba(204,255,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.4)',
  },
  cellToday: {
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.2)',
    borderRadius: 12,
  },
  dayLetter: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
  },
  dayNum: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  textSelected: {
    color: colors.neon,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
});

// ─── CalendarModal ────────────────────────────────────────────────────────────

function CalendarModal({
  visible,
  selectedDate,
  logCache,
  calGoal,
  onSelect,
  onClose,
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
          {/* Month nav */}
          <View style={calStyles.monthHeader}>
            <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
              <Text style={calStyles.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={calStyles.monthLabel}>
              {MONTH_SHORT[month]} {year}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn} disabled={isLastMonth}>
              <Text style={[calStyles.navArrow, isLastMonth && calStyles.navDim]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={calStyles.dayHeaders}>
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map((d) => (
              <Text key={d} style={calStyles.dayHeader}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
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
                    style={[
                      calStyles.dayCell,
                      isSelected && calStyles.dayCellSelected,
                      isToday && !isSelected && calStyles.dayCellToday,
                    ]}
                    onPress={() => { if (!isFuture) { onSelect(dateStr); onClose(); } }}
                    activeOpacity={isFuture ? 1 : 0.7}
                    disabled={isFuture}
                  >
                    <Text style={[
                      calStyles.dayNum,
                      isFuture && calStyles.dayFuture,
                      isSelected && calStyles.dayNumSelected,
                      isToday && !isSelected && calStyles.dayNumToday,
                    ]}>
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

          {/* Legend */}
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    gap: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 22, color: colors.text, fontWeight: '700' },
  navDim: { color: colors.dim },
  monthLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: colors.dim,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
  },
  row: { flexDirection: 'row' },
  emptyCell: { flex: 1, height: 44 },
  dayCell: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 2,
  },
  dayCellSelected: {
    backgroundColor: colors.neon,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: colors.neon,
  },
  dayNum: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  dayNumSelected: { color: colors.bg },
  dayNumToday: { color: colors.neon },
  dayFuture: { color: colors.dim, opacity: 0.4 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    marginTop: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  closeBtnText: { fontSize: 14, color: colors.muted, fontFamily: 'SpaceGrotesk_600SemiBold' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NutritionScreen() {
  const today = useMemo(() => todayStr(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { foodLog, fetchFoodLog, loading, waterGlasses, setWaterGlasses, logCache } = useNutritionStore();
  const { profile } = useAuthStore();

  const goals = {
    calories: profile?.targetCalories ?? DAILY_GOALS.calories,
    proteinG: profile?.targetProteinG ?? DAILY_GOALS.proteinG,
    carbsG:   profile?.targetCarbsG   ?? DAILY_GOALS.carbsG,
    fatG:     profile?.targetFatG     ?? DAILY_GOALS.fatG,
  };

  useEffect(() => {
    fetchFoodLog(selectedDate);
  }, [selectedDate]);

  const handleSelectDate = useCallback((d: string) => {
    if (d <= today) setSelectedDate(d);
  }, [today]);

  // Group entries by mealType
  const byMeal = useMemo(() => {
    const m: Record<string, FoodLogEntry[]> = { breakfast: [], lunch: [], snack: [], dinner: [] };
    for (const e of foodLog) {
      if (m[e.mealType]) m[e.mealType].push(e);
    }
    return m;
  }, [foodLog]);

  // Totals
  const totalCal = foodLog.reduce((s, e) => s + e.calories, 0);
  const totalProt = foodLog.reduce((s, e) => s + e.proteinG, 0);
  const totalCarbs = foodLog.reduce((s, e) => s + e.carbsG, 0);
  const totalFat = foodLog.reduce((s, e) => s + e.fatG, 0);

  const pctOf = (v: number, g: number) => Math.min(100, Math.round((v / g) * 100));
  const calPct = pctOf(totalCal, goals.calories);
  const waterPct = Math.round((waterGlasses / WATER_GOAL) * 100);

  const isToday = selectedDate === today;
  const cachedDay = logCache[selectedDate];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nutrición</Text>
        <TouchableOpacity onPress={() => setCalendarOpen(true)} style={styles.calBtn} activeOpacity={0.7}>
          <Text style={styles.calBtnText}>📅</Text>
          <Text style={styles.calBtnLabel}>{formatShort(selectedDate)}</Text>
        </TouchableOpacity>
      </View>

      {/* Week strip (timeline) */}
      <WeekStrip
        selectedDate={selectedDate}
        onSelect={handleSelectDate}
        logCache={logCache}
        calGoal={goals.calories}
      />

      {/* Past-day banner */}
      {!isToday && (
        <View style={styles.pastBanner}>
          <Text style={styles.pastDate}>{formatLong(selectedDate)}</Text>
          {cachedDay ? (
            <Text style={styles.pastStats}>
              {cachedDay.calories} / {goals.calories} kcal
              {' · '}{cachedDay.mealsCount} {cachedDay.mealsCount === 1 ? 'comida' : 'comidas'}
            </Text>
          ) : null}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Calorie ring + macros */}
        <GlassCard style={styles.calorieCard}>
          {loading ? (
            <ActivityIndicator color={colors.neon} style={{ flex: 1, paddingVertical: 16 }} />
          ) : (
            <>
              <Ring pct={calPct} size={90} color={colors.neon} label={String(Math.max(0, goals.calories - totalCal))} sub="restantes" />
              <View style={styles.macrosWrap}>
                {[
                  { name: 'Proteína', val: totalProt,  goal: goals.proteinG, color: colors.neon   },
                  { name: 'Carbos',   val: totalCarbs, goal: goals.carbsG,   color: colors.teal  },
                  { name: 'Grasas',   val: totalFat,   goal: goals.fatG,     color: colors.orange },
                ].map((m) => (
                  <View key={m.name} style={styles.macroRow}>
                    <View style={styles.macroMeta}>
                      <Text style={styles.macroName}>{m.name}</Text>
                      <Text style={[styles.macroPct, { color: m.color }]}>
                        {Math.round(m.val)}g / {m.goal}g
                      </Text>
                    </View>
                    <ProgressBar pct={pctOf(m.val, m.goal)} color={m.color} h={4} />
                  </View>
                ))}
              </View>
            </>
          )}
        </GlassCard>

        {/* Water tracker */}
        <GlassCard style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <View>
              <Label>Hidratación</Label>
              <Text style={styles.waterAmount}>
                <Text style={styles.waterAmountVal}>{waterGlasses * 250}</Text>
                <Text style={styles.waterAmountGoal}> / 2000 ml</Text>
              </Text>
            </View>
            <Ring pct={waterPct} size={56} color={colors.teal} label={`${waterPct}%`} sub="H₂O" />
          </View>
          <ProgressBar pct={waterPct} color={colors.teal} h={6} />
          <View style={styles.waterGlasses}>
            {Array.from({ length: WATER_GOAL }, (_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setWaterGlasses(i < waterGlasses ? i : i + 1)}
                style={styles.glassBtn}
                activeOpacity={0.7}
              >
                <Text style={[styles.glassIcon, i < waterGlasses && styles.glassIconFull]}>
                  {i < waterGlasses ? '🥤' : '🫙'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.waterHint}>Toca para registrar un vaso (250ml)</Text>
        </GlassCard>

        {/* Meals */}
        <Text style={styles.mealsTitle}>
          Comidas {isToday ? 'de hoy' : `del ${formatShort(selectedDate)}`}
        </Text>

        {MEAL_ORDER.map((mealId) => {
          const entries = byMeal[mealId];
          const mealCal = entries.reduce((s, e) => s + e.calories, 0);
          const hasFoods = entries.length > 0;

          return (
            <TouchableOpacity
              key={mealId}
              style={[glass, styles.mealCard, !hasFoods && styles.mealDim]}
              activeOpacity={0.75}
              onPress={() => router.push({ pathname: '/nutrition/meal/[id]', params: { id: mealId, date: selectedDate } })}
            >
              <View style={styles.mealLeft}>
                <Text style={styles.mealIcon}>{MEAL_ICONS[mealId]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.mealName, !hasFoods && styles.mealNameDim]}>
                    {MEAL_NAMES[mealId]}
                  </Text>
                  {hasFoods
                    ? entries.map((e) => (
                        <Text key={e.id} style={styles.mealItem}>· {e.foodName}</Text>
                      ))
                    : <Text style={styles.mealEmpty}>Sin registrar</Text>
                  }
                </View>
              </View>
              <View style={styles.mealRight}>
                {hasFoods ? (
                  <Text style={styles.mealKcal}>{mealCal} kcal</Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/nutrition/search', params: { meal: mealId, date: selectedDate } })}
                    style={styles.addBtn}
                  >
                    <Text style={styles.addBtnText}>+ Añadir</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.mealArrow}>›</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Pantry CTA */}
        <TouchableOpacity
          style={[glassNeon, styles.pantryCta]}
          onPress={() => router.push('/nutrition/pantry')}
          activeOpacity={0.8}
        >
          <Text style={styles.pantryEmoji}>✦</Text>
          <View>
            <Text style={styles.pantryTitle}>Modo Despensa</Text>
            <Text style={styles.pantrySub}>Genera recetas con lo que tenés en casa</Text>
          </View>
          <Text style={styles.pantryArrow}>›</Text>
        </TouchableOpacity>

        {/* Social groups CTA */}
        <TouchableOpacity
          style={[glass, styles.receiptCta]}
          onPress={() => router.push('/nutrition/groups')}
          activeOpacity={0.8}
        >
          <Text style={styles.receiptEmoji}>👥</Text>
          <View>
            <Text style={styles.receiptTitle}>Grupos de nutrición</Text>
            <Text style={styles.receiptSub}>Compará lo que comés con tus amigos</Text>
          </View>
          <Text style={styles.receiptArrow}>›</Text>
        </TouchableOpacity>

        {/* Receipt scanner CTA */}
        <TouchableOpacity
          style={[glass, styles.receiptCta]}
          onPress={() => router.push({ pathname: '/nutrition/scanner', params: { mode: 'receipt' } })}
          activeOpacity={0.8}
        >
          <Text style={styles.receiptEmoji}>🧾</Text>
          <View>
            <Text style={styles.receiptTitle}>Escanear ticket</Text>
            <Text style={styles.receiptSub}>Fotografiá el ticket y la IA detecta las comidas</Text>
          </View>
          <Text style={styles.receiptArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Calendar modal */}
      <CalendarModal
        visible={calendarOpen}
        selectedDate={selectedDate}
        logCache={logCache}
        calGoal={goals.calories}
        onSelect={handleSelectDate}
        onClose={() => setCalendarOpen(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  calBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  calBtnText: { fontSize: 14 },
  calBtnLabel: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_600SemiBold' },
  pastBanner: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pastDate: { fontSize: 13, color: colors.text, fontFamily: 'SpaceGrotesk_600SemiBold' },
  pastStats: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  container: { padding: 20, paddingTop: 8, gap: 12 },
  calorieCard: { padding: 16, flexDirection: 'row', gap: 16, alignItems: 'center', minHeight: 100 },
  macrosWrap: { flex: 1, gap: 7 },
  remaining: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  remainingVal: { color: colors.neon, fontWeight: '700', fontFamily: 'SpaceGrotesk_700Bold' },
  macroRow: { gap: 3 },
  macroMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  macroName: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  macroPct: { fontSize: 12, fontFamily: 'SpaceGrotesk_600SemiBold' },
  waterCard: { padding: 14, paddingHorizontal: 16, gap: 10 },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waterAmount: { marginTop: 2 },
  waterAmountVal: { fontSize: 20, fontWeight: '700', color: colors.teal, fontFamily: 'SpaceGrotesk_700Bold' },
  waterAmountGoal: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  waterGlasses: { flexDirection: 'row', gap: 6, marginTop: 2 },
  glassBtn: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  glassIcon: { fontSize: 22, opacity: 0.3 },
  glassIconFull: { opacity: 1 },
  waterHint: { fontSize: 11, color: colors.dim, textAlign: 'center', fontFamily: 'SpaceGrotesk_400Regular' },
  mealsTitle: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold', marginTop: 4 },
  mealCard: { padding: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealDim: { opacity: 0.65 },
  mealLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  mealIcon: { fontSize: 28, marginTop: 0 },
  mealName: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 2 },
  mealNameDim: { color: colors.muted, fontWeight: '400' },
  mealItem: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  mealEmpty: { fontSize: 12, color: colors.dim, fontFamily: 'SpaceGrotesk_400Regular', fontStyle: 'italic' },
  mealRight: { alignItems: 'flex-end', gap: 4 },
  mealKcal: { fontSize: 14, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold' },
  addBtn: {
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  addBtnText: { fontSize: 12, color: colors.orange, fontFamily: 'SpaceGrotesk_600SemiBold' },
  mealArrow: { color: colors.dim, fontSize: 18 },
  pantryCta: { padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, borderStyle: 'dashed', borderColor: colors.neon, borderWidth: 1.5, backgroundColor: 'rgba(204,255,0,0.05)' },
  pantryEmoji: { fontSize: 22, color: colors.neon },
  pantryTitle: { fontSize: 15, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold' },
  pantrySub: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  pantryArrow: { marginLeft: 'auto', color: colors.neon, fontSize: 20 },
  receiptCta: { padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  receiptEmoji: { fontSize: 22 },
  receiptTitle: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  receiptSub: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  receiptArrow: { marginLeft: 'auto', color: colors.dim, fontSize: 20 },
});
