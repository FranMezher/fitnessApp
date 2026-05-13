import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

const TOTAL_STEPS = 10;
const STEP = 3;

export default function StrengthScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';

  const stored = useOnboardingStore((s) => s.data.strengthTraining);
  const setStore = useOnboardingStore((s) => s.set);
  const { token } = useAuthStore();

  const [selected, setSelected] = useState<boolean>(stored ?? true);

  async function handleContinue() {
    setStore({ strengthTraining: selected });

    if (isEdit) {
      if (token) {
        await api.upsertProfile(token, { strengthTraining: selected }).catch(() => {});
      }
      router.back();
      return;
    }

    router.push('/(onboarding)/activity' as never);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(STEP / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.step}>Paso {STEP} de {TOTAL_STEPS}</Text>
        <Text style={styles.title}>¿Realizás entrenamientos de fuerza?</Text>
        <Text style={styles.subtitle}>Esta información es clave para determinar tu ingesta de proteína</Text>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Los entrenamientos de fuerza implican desafiar tus músculos con pesas, bandas elásticas o tu propio peso corporal.
          </Text>
        </View>

        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={[selected === true ? glassNeon : glass, styles.optionBtn]}
            onPress={() => setSelected(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.optionIcon}>💪</Text>
            <Text style={[styles.optionLabel, selected === true && styles.optionLabelActive]}>Sí</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[selected === false ? styles.glassNo : glass, styles.optionBtn]}
            onPress={() => setSelected(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.optionIcon}>🧘</Text>
            <Text style={[styles.optionLabel, selected === false && styles.optionLabelNo]}>No</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            {selected
              ? '✅ Recibirás una mayor ingesta de proteína para proteger y construir músculo'
              : 'ℹ️ Tu plan priorizará carbohidratos para energía general'}
          </Text>
        </View>

        <View style={styles.btnWrap}>
          <Btn onPress={handleContinue}>{isEdit ? 'Guardar' : 'Continuar'}</Btn>
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
    marginBottom: 20,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  note: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  noteText: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    lineHeight: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  optionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
    borderRadius: 16,
  },
  glassNo: {
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
    borderRadius: 16,
  },
  optionIcon: {
    fontSize: 32,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  optionLabelActive: {
    color: colors.neon,
  },
  optionLabelNo: {
    color: colors.orange,
  },
  hint: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    lineHeight: 20,
  },
  btnWrap: {
    marginTop: 16,
  },
});
