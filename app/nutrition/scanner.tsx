import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ScrollView, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors, glass, glassNeon } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNutritionStore } from '@/stores/useNutritionStore';

interface DetectedItem {
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  grams: number;
  selected: boolean;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export default function ScannerScreen() {
  const params = useLocalSearchParams<{ meal?: string; date?: string; mode?: string }>();
  const [step, setStep] = useState<'idle' | 'loading' | 'review'>('idle');
  const [items, setItems] = useState<DetectedItem[]>([]);
  const { token } = useAuthStore();
  const { addFood } = useNutritionStore();

  async function pickAndScan() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      if (cam.status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara o galería.');
        return;
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets[0].base64) return;

    setStep('loading');
    try {
      const res = await fetch(`${API_URL}/ai/receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageBase64: result.assets[0].base64,
          mediaType: 'image/jpeg',
        }),
      });

      if (!res.ok) throw new Error('Error al analizar el ticket');
      const data = await res.json();

      if (!data.items?.length) {
        Alert.alert('Sin resultados', 'No se detectaron alimentos en la imagen. Intentá con mejor iluminación.');
        setStep('idle');
        return;
      }

      setItems(data.items.map((i: any) => ({ ...i, grams: 100, selected: true })));
      setStep('review');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'No se pudo analizar el ticket.');
      setStep('idle');
    }
  }

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets[0].base64) return;

    setStep('loading');
    try {
      const res = await fetch(`${API_URL}/ai/receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageBase64: result.assets[0].base64,
          mediaType: 'image/jpeg',
        }),
      });

      if (!res.ok) throw new Error('Error al analizar el ticket');
      const data = await res.json();

      if (!data.items?.length) {
        Alert.alert('Sin resultados', 'No se detectaron alimentos en la imagen.');
        setStep('idle');
        return;
      }

      setItems(data.items.map((i: any) => ({ ...i, grams: 100, selected: true })));
      setStep('review');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'No se pudo analizar el ticket.');
      setStep('idle');
    }
  }

  function toggleItem(idx: number) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));
  }

  function updateGrams(idx: number, val: string) {
    const g = parseFloat(val) || 100;
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, grams: g } : it));
  }

  async function addSelected() {
    const today = params.date ?? new Date().toISOString().slice(0, 10);
    const mealType = (params.meal ?? 'lunch') as 'breakfast' | 'lunch' | 'snack' | 'dinner';
    const selected = items.filter((i) => i.selected);

    for (const item of selected) {
      const ratio = item.grams / 100;
      await addFood({
        date: today,
        mealType,
        foodName: item.name,
        calories: Math.round(item.kcalPer100g * ratio),
        proteinG: +(item.proteinPer100g * ratio).toFixed(1),
        carbsG:   +(item.carbsPer100g * ratio).toFixed(1),
        fatG:     +(item.fatPer100g * ratio).toFixed(1),
      });
    }

    Alert.alert('Listo', `${selected.length} alimento${selected.length !== 1 ? 's' : ''} agregado${selected.length !== 1 ? 's' : ''} al log.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  if (step === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.neon} size="large" />
          <Text style={styles.loadingText}>Analizando ticket con IA...</Text>
          <Text style={styles.loadingSub}>Esto puede tomar unos segundos</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'review') {
    const selectedCount = items.filter((i) => i.selected).length;
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('idle')}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Alimentos detectados</Text>
          <Text style={styles.countBadge}>{selectedCount} sel.</Text>
        </View>

        <ScrollView contentContainerStyle={styles.reviewList}>
          <Text style={styles.reviewHint}>Seleccioná los alimentos y ajustá las cantidades.</Text>

          {items.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[glass, styles.reviewItem, !item.selected && styles.reviewItemDim]}
              onPress={() => toggleItem(idx)}
              activeOpacity={0.8}
            >
              <View style={styles.reviewCheck}>
                <Text style={[styles.checkBox, item.selected && styles.checkBoxActive]}>
                  {item.selected ? '✓' : '○'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewName}>{item.name}</Text>
                <Text style={styles.reviewMacros}>
                  {item.kcalPer100g} kcal · P{item.proteinPer100g}g · C{item.carbsPer100g}g · G{item.fatPer100g}g /100g
                </Text>
              </View>
              <View style={styles.gramsWrap}>
                <TextInput
                  style={styles.gramsInput}
                  value={String(item.grams)}
                  onChangeText={(v) => updateGrams(idx, v)}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
                <Text style={styles.gramsLabel}>g</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.addBtnWrap}>
          <Btn onPress={addSelected} disabled={selectedCount === 0}>
            Agregar {selectedCount > 0 ? `${selectedCount} alimento${selectedCount !== 1 ? 's' : ''}` : 'seleccionados'}
          </Btn>
        </View>
      </SafeAreaView>
    );
  }

  // idle
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Escanear</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.idleContent}>
        <View style={styles.heroIcon}>
          <Text style={styles.heroEmoji}>🧾</Text>
        </View>
        <Text style={styles.heroTitle}>Escanear ticket de supermercado</Text>
        <Text style={styles.heroSub}>
          La IA detecta los alimentos del ticket y estima sus macros automáticamente.
        </Text>

        <TouchableOpacity style={[glassNeon, styles.primaryBtn]} onPress={pickAndScan} activeOpacity={0.8}>
          <Text style={styles.primaryBtnIcon}>📷</Text>
          <Text style={styles.primaryBtnText}>Fotografiar ticket</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[glass, styles.secondaryBtn]} onPress={pickFromGallery} activeOpacity={0.8}>
          <Text style={styles.secondaryBtnText}>Elegir de galería</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchLink}
          onPress={() => router.push({ pathname: '/nutrition/search', params: { meal: params.meal, date: params.date } })}
        >
          <Text style={styles.searchLinkText}>Buscar alimento manualmente →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  backText: { fontSize: 22, color: colors.text, width: 40 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  countBadge: { fontSize: 13, color: colors.neon, fontFamily: 'SpaceGrotesk_600SemiBold', width: 40, textAlign: 'right' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 16, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold' },
  loadingSub: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  idleContent: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 16 },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: 'rgba(204,255,0,0.07)',
    borderWidth: 1,
    borderColor: colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  heroSub: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', textAlign: 'center', lineHeight: 20 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: 8,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  primaryBtnIcon: { fontSize: 20 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: colors.neon, fontFamily: 'SpaceGrotesk_700Bold' },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 15, color: colors.text, fontFamily: 'SpaceGrotesk_600SemiBold' },
  searchLink: { marginTop: 8 },
  searchLinkText: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  reviewList: { padding: 16, gap: 8, paddingBottom: 120 },
  reviewHint: { fontSize: 13, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular', marginBottom: 4 },
  reviewItem: { padding: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewItemDim: { opacity: 0.45 },
  reviewCheck: { width: 24 },
  checkBox: { fontSize: 18, color: colors.dim },
  checkBoxActive: { color: colors.neon },
  reviewName: { fontSize: 14, fontWeight: '700', color: colors.text, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 2 },
  reviewMacros: { fontSize: 11, color: colors.dim, fontFamily: 'SpaceGrotesk_400Regular' },
  gramsWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gramsInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: colors.text,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    width: 52,
    textAlign: 'center',
  },
  gramsLabel: { fontSize: 12, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  addBtnWrap: { padding: 16, paddingBottom: 24 },
});
