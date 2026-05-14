import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

const TOTAL_STEPS = 10;
const STEP = 2;

function NumericPicker({
  label,
  value,
  unit,
  min,
  max,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
  accent?: string;
}) {
  const accentColor = accent ?? colors.neon;
  return (
    <View style={pickerStyles.wrap}>
      <Text style={pickerStyles.label}>{label}</Text>
      <View style={[pickerStyles.row, { borderColor: `${accentColor}22` }]}>
        <TouchableOpacity
          style={[pickerStyles.btn, { borderRightColor: `${accentColor}22` }]}
          onPress={() => onChange(Math.max(min, value - 1))}
          activeOpacity={0.7}
        >
          <Text style={[pickerStyles.btnText, { color: accentColor }]}>−</Text>
        </TouchableOpacity>
        <View style={pickerStyles.valueBox}>
          <Text style={pickerStyles.value}>{value}</Text>
          <Text style={pickerStyles.unit}>{unit}</Text>
        </View>
        <TouchableOpacity
          style={[pickerStyles.btn, { borderLeftColor: `${accentColor}22` }]}
          onPress={() => onChange(Math.min(max, value + 1))}
          activeOpacity={0.7}
        >
          <Text style={[pickerStyles.btnText, { color: accentColor }]}>+</Text>
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
  const [targetWeight, setTargetWeight] = useState(stored.targetWeightKg ?? weight - 5);

  async function handleContinue() {
    if (age < 16 || age > 90) {
      Alert.alert('Edad inválida', 'Ingresá una edad entre 16 y 90 años.');
      return;
    }
    if (height < 140 || height > 220) {
      Alert.alert('Altura inválida', 'Ingresá entre 140 y 220 cm.');
      return;
    }
    if (weight < 40 || weight > 200) {
      Alert.alert('Peso inválido', 'Ingresá entre 40 y 200 kg.');
      return;
    }
    if (stored.goal === 'fat_loss' && targetWeight >= weight) {
      Alert.alert('Peso objetivo inválido', 'El peso objetivo debe ser menor al peso actual.');
      return;
    }

    setStore({
      sex,
      age,
      heightCm: height,
      weightKg: weight,
      targetWeightKg: targetWeight,
    });

    if (isEdit) {
      if (token) {
        await api.upsertProfile(token, {
          sex,
          age,
          heightCm: height,
          weightKg: weight,
          targetWeightKg: targetWeight,
        }).catch(() => {});
      }
      router.back();
      return;
    }

    router.push('/(onboarding)/strength' as never);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(STEP / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.step}>Paso {STEP} de {TOTAL_STEPS}</Text>
        <Text style={styles.title}>Sobre ti</Text>
        <Text style={styles.subtitle}>Esto nos ayuda a calcular tus calorías objetivo</Text>

        {/* Sexo */}
        <Text style={styles.sectionLabel}>Sexo</Text>
        <View style={styles.sexRow}>
          {(['male', 'female'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[s === sex ? glassNeon : glass, styles.sexBtn]}
              onPress={() => setSex(s)}
              activeOpacity={0.8}
            >
              <Text style={[styles.sexIcon, s === sex && styles.sexIconActive]}>{s === 'male' ? '♂' : '♀'}</Text>
              <Text style={[styles.sexLabel, s === sex && styles.sexLabelActive]}>
                {s === 'male' ? 'Hombre' : 'Mujer'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <NumericPicker label="Edad" value={age} unit="años" min={16} max={90} onChange={setAge} />
        <NumericPicker label="Altura" value={height} unit="cm" min={130} max={230} onChange={setHeight} />
        <NumericPicker label="Peso actual" value={weight} unit="kg" min={30} max={250} onChange={setWeight} />
        <NumericPicker label="Peso objetivo" value={targetWeight} unit="kg" min={30} max={250} onChange={setTargetWeight} accent={colors.orange} />

        <View style={styles.btnWrap}>
          <Btn onPress={handleContinue}>{isEdit ? 'Guardar' : 'Continuar'}</Btn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const pickerStyles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
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
  btnText: {
    fontSize: 22,
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  valueBox: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  unit: {
    fontSize: 14,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.neon,
    borderRadius: 2,
  },
  container: {
    padding: 24,
    paddingTop: 16,
  },
  step: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginBottom: 8,
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
    marginBottom: 24,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  sectionLabel: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  sexRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  sexBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 22,
    gap: 8,
  },
  sexIcon: {
    fontSize: 36,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  sexIconActive: {
    color: colors.neon,
  },
  sexLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  sexLabelActive: {
    color: colors.neon,
  },
  btnWrap: {
    marginTop: 16,
  },
});
