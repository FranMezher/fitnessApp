import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { colors, glass, glassNeon } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { Btn } from '@/components/ui/Btn';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

const TOTAL_STEPS = 10;
const STEP = 2;

function NumericPicker({
  label, value, unit, min, max, onChange, accent,
}: {
  label: string; value: number; unit: string;
  min: number; max: number; onChange: (v: number) => void; accent?: string;
}) {
  const color = accent ?? colors.neon;
  return (
    <View style={pickerStyles.wrap}>
      <Text style={pickerStyles.label}>{label}</Text>
      <View style={[pickerStyles.row, { borderColor: `${color}22` }]}>
        <TouchableOpacity
          style={[pickerStyles.btn, { borderRightColor: `${color}22` }]}
          onPress={() => onChange(Math.max(min, value - 1))}
          activeOpacity={0.7}
        >
          <Text style={[pickerStyles.btnText, { color }]}>−</Text>
        </TouchableOpacity>
        <View style={pickerStyles.valueBox}>
          <Text style={pickerStyles.value}>{value}</Text>
          <Text style={pickerStyles.unit}>{unit}</Text>
        </View>
        <TouchableOpacity
          style={[pickerStyles.btn, { borderLeftColor: `${color}22` }]}
          onPress={() => onChange(Math.min(max, value + 1))}
          activeOpacity={0.7}
        >
          <Text style={[pickerStyles.btnText, { color }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function BiometricsScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';

  const stored = useOnboardingStore((s) => s.data);
  const setStore = useOnboardingStore((s) => s.set);
  const { token } = useAuthStore();

  const [sex, setSex] = useState<'male' | 'female'>(stored.sex ?? 'male');
  const [age, setAge] = useState(stored.age ?? 26);
  const [height, setHeight] = useState(stored.heightCm ?? 175);
  const [weight, setWeight] = useState(stored.weightKg ?? 75);

  async function handleContinue() {
    if (age < 16 || age > 90) { Alert.alert('Edad inválida', 'Ingresá entre 16 y 90 años.'); return; }
    if (height < 140 || height > 220) { Alert.alert('Altura inválida', 'Ingresá entre 140 y 220 cm.'); return; }
    if (weight < 40 || weight > 200) { Alert.alert('Peso inválido', 'Ingresá entre 40 y 200 kg.'); return; }

    setStore({ sex, age, heightCm: height, weightKg: weight });

    if (isEdit) {
      if (token) await api.upsertProfile(token, { sex, age, heightCm: height, weightKg: weight }).catch(() => {});
      router.back();
      return;
    }
    router.push('/(onboarding)/strength' as never);
  }

  return (
    <OnboardingShell
      step={STEP}
      totalSteps={TOTAL_STEPS}
      title="Háblanos de ti"
      subtitle="Esto nos ayuda a calcular con precisión tus calorías y macros objetivo."
      footer={<Btn onPress={handleContinue}>{isEdit ? 'GUARDAR' : 'CONTINUAR'}</Btn>}
    >
      {/* Sexo */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SEXO BIOLÓGICO</Text>
        <View style={styles.sexRow}>
          {(['male', 'female'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sexBtn, s === sex ? glassNeon : glass]}
              onPress={() => setSex(s)}
              activeOpacity={0.8}
            >
              <Text style={[styles.sexIcon, s === sex && { color: colors.neon }]}>
                {s === 'male' ? '♂' : '♀'}
              </Text>
              <Text style={[styles.sexLabel, s === sex && { color: colors.neon }]}>
                {s === 'male' ? 'Hombre' : 'Mujer'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Pickers */}
      <View style={styles.section}>
        <NumericPicker label="EDAD" value={age} unit="años" min={16} max={90} onChange={setAge} />
        <NumericPicker label="ALTURA" value={height} unit="cm" min={130} max={230} onChange={setHeight} />
        <NumericPicker label="PESO ACTUAL" value={weight} unit="kg" min={30} max={250} onChange={setWeight} />
      </View>
    </OnboardingShell>
  );
}

const pickerStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...text.labelSm, color: colors.muted, marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  btn: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderRightColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  btnText: { fontSize: 22, fontFamily: 'SpaceGrotesk_700Bold' },
  valueBox: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  value: { ...text.heroMd, fontSize: 22, color: colors.text },
  unit: { ...text.dataMono, color: colors.muted },
});

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionLabel: { ...text.labelSm, color: colors.muted },
  sexRow: { flexDirection: 'row', gap: spacing.md },
  sexBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    borderRadius: radius.lg,
  },
  sexIcon: { fontSize: 32, color: colors.muted, fontFamily: 'SpaceGrotesk_700Bold' },
  sexLabel: { ...text.headlineMd, color: colors.muted },
});
