import { useEffect, useRef, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { colors, glass } from '@/constants/colors';
import { useNutritionStore } from '@/stores/useNutritionStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';

type Mode = 'pick' | 'text' | 'photo' | 'audio' | 'manual';

interface DetectedFood {
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface Props {
  visible: boolean;
  mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  date: string;
  onClose: () => void;
  onAdded: () => void;
}

export function AddFoodModal({ visible, mealType, date, onClose, onAdded }: Props) {
  const [mode, setMode] = useState<Mode>('pick');
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<DetectedFood[]>([]);
  const [confirming, setConfirming] = useState(false);

  // Manual entry state
  const [manualName, setManualName]   = useState('');
  const [manualCal, setManualCal]     = useState('');
  const [manualProt, setManualProt]   = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat]     = useState('');
  const [manualSaving, setManualSaving] = useState(false);

  const { addFood } = useNutritionStore();
  const { token } = useAuthStore();

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  function resetModal() {
    setMode('pick');
    setTextInput('');
    setPreview([]);
    setLoading(false);
    setConfirming(false);
    setManualName('');
    setManualCal('');
    setManualProt('');
    setManualCarbs('');
    setManualFat('');
  }

  function handleClose() {
    resetModal();
    onClose();
  }

  async function analyzeText(text: string) {
    if (!token || !text.trim()) return;
    setLoading(true);
    try {
      const { entries } = await api.parseFoodText(token, text.trim());
      setPreview(entries as DetectedFood[]);
    } catch {
      Alert.alert('Error', 'No se pudo analizar el texto. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function pickAndAnalyzePhoto(useCamera: boolean) {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso para continuar.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6 });

    if (result.canceled || !result.assets[0]?.base64) return;

    if (!token) return;
    setLoading(true);
    try {
      const base64 = result.assets[0].base64!;
      const uri = result.assets[0].uri ?? '';
      const mediaType = uri.endsWith('.png') ? 'image/png' : uri.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      const { entries } = await api.analyzeFoodPhoto(token, base64, mediaType);
      setPreview(entries as DetectedFood[]);
    } catch {
      Alert.alert('Error', 'No se pudo analizar la foto. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmAll() {
    if (!token || preview.length === 0) return;
    setConfirming(true);

    const results = await Promise.allSettled(
      preview.map((food) =>
        addFood({
          date,
          mealType,
          foodName: food.foodName,
          calories: Math.round(food.calories),
          proteinG: food.proteinG,
          carbsG: food.carbsG,
          fatG: food.fatG,
        }),
      ),
    );

    if (!mountedRef.current) return;

    const failed = results.filter((r) => r.status === 'rejected').length;
    const saved = results.length - failed;

    setConfirming(false);

    if (failed === 0) {
      resetModal();
      onAdded();
    } else if (saved === 0) {
      Alert.alert('Error', 'No se pudieron guardar los alimentos.');
    } else {
      Alert.alert(
        'Guardado parcial',
        `Se guardaron ${saved} de ${results.length} alimentos. Revisá los que faltan.`,
      );
      // Drop the ones that already saved so a retry doesn't duplicate them.
      setPreview((prev) => prev.filter((_, i) => results[i]?.status === 'rejected'));
      onAdded();
    }
  }

  function removeFromPreview(index: number) {
    setPreview((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleManualAdd() {
    const name = manualName.trim();
    if (!name) { Alert.alert('Nombre requerido', 'Ingresá el nombre del alimento.'); return; }
    const cal  = parseFloat(manualCal)  || 0;
    const prot = parseFloat(manualProt) || 0;
    const carbs = parseFloat(manualCarbs) || 0;
    const fat  = parseFloat(manualFat)  || 0;
    setManualSaving(true);
    try {
      await addFood({ date, mealType, foodName: name, calories: Math.round(cal), proteinG: prot, carbsG: carbs, fatG: fat });
      resetModal();
      onAdded();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el alimento.');
    } finally {
      setManualSaving(false);
    }
  }

  // ── Preview screen ───────────────────────────────────────────────────────────
  if (preview.length > 0) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setPreview([])} style={styles.backBtn}>
                <Text style={styles.backBtnText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>Confirmar alimentos</Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
              {preview.map((item, i) => (
                <View key={i} style={[glass, styles.previewRow]}>
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewName}>{item.foodName}</Text>
                    <View style={styles.previewMacros}>
                      <Text style={[styles.macroChip, { color: colors.neon }]}>{Math.round(item.proteinG)}g P</Text>
                      <Text style={styles.macroDot}>·</Text>
                      <Text style={[styles.macroChip, { color: colors.teal }]}>{Math.round(item.carbsG)}g C</Text>
                      <Text style={styles.macroDot}>·</Text>
                      <Text style={[styles.macroChip, { color: colors.orange }]}>{Math.round(item.fatG)}g G</Text>
                    </View>
                  </View>
                  <View style={styles.previewRight}>
                    <Text style={styles.previewKcal}>{Math.round(item.calories)}</Text>
                    <Text style={styles.previewKcalLabel}>kcal</Text>
                    <TouchableOpacity onPress={() => removeFromPreview(i)} style={styles.removeChip}>
                      <Text style={styles.removeChipText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.confirmBtn, confirming && styles.confirmBtnDisabled]}
              onPress={confirmAll}
              disabled={confirming}
              activeOpacity={0.8}
            >
              {confirming
                ? <ActivityIndicator color={colors.bg} />
                : <Text style={styles.confirmBtnText}>Añadir {preview.length} alimento{preview.length !== 1 ? 's' : ''}</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  // ── Main modal ───────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            {mode !== 'pick' ? (
              <TouchableOpacity onPress={() => setMode('pick')} style={styles.backBtn}>
                <Text style={styles.backBtnText}>←</Text>
              </TouchableOpacity>
            ) : <View style={{ width: 32 }} />}
            <Text style={styles.sheetTitle}>
              {mode === 'pick'   ? 'Agregar alimento'      : ''}
              {mode === 'text'   ? 'Describir con texto'   : ''}
              {mode === 'photo'  ? 'Foto de la comida'     : ''}
              {mode === 'audio'  ? 'Dictar por voz'        : ''}
              {mode === 'manual' ? 'Carga manual'          : ''}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Pick mode ── */}
          {mode === 'pick' && (
            <View style={styles.pickGrid}>
              <MethodBtn icon="🔍" label="Buscar" onPress={() => {
                handleClose();
                router.push({ pathname: '/nutrition/search', params: { meal: mealType, date } });
              }} />
              <MethodBtn icon="✏️" label="Texto IA" onPress={() => setMode('text')} />
              <MethodBtn icon="📷" label="Foto IA"  onPress={() => setMode('photo')} />
              <MethodBtn icon="🎤" label="Voz IA"   onPress={() => setMode('audio')} />
              <MethodBtn icon="📱" label="Escáner"  onPress={() => {
                handleClose();
                router.push({ pathname: '/nutrition/scanner', params: { meal: mealType, date } } as never);
              }} />
              <MethodBtn icon="✍️" label="Manual"   onPress={() => setMode('manual')} />
            </View>
          )}

          {/* ── Text mode ── */}
          {mode === 'text' && (
            <View style={styles.inputSection}>
              <Text style={styles.inputHint}>
                Describí lo que comiste y estimaremos los valores nutricionales.
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Ej: 200g de pollo a la plancha con arroz y ensalada"
                placeholderTextColor={colors.dim}
                multiline
                numberOfLines={4}
                value={textInput}
                onChangeText={setTextInput}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.confirmBtn, (!textInput.trim() || loading) && styles.confirmBtnDisabled]}
                onPress={() => analyzeText(textInput)}
                disabled={!textInput.trim() || loading}
                activeOpacity={0.8}
              >
                {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.confirmBtnText}>Analizar con IA →</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ── Photo mode ── */}
          {mode === 'photo' && (
            <View style={styles.photoSection}>
              <Text style={styles.inputHint}>
                Sacá una foto o elegí una imagen de tu galería y la IA identificará los alimentos.
              </Text>
              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator color={colors.neon} size="large" />
                  <Text style={styles.loadingText}>Analizando foto…</Text>
                </View>
              ) : (
                <View style={styles.photoButtons}>
                  <TouchableOpacity style={[glass, styles.photoBtn]} onPress={() => pickAndAnalyzePhoto(true)} activeOpacity={0.8}>
                    <Text style={styles.photoBtnIcon}>📷</Text>
                    <Text style={styles.photoBtnLabel}>Tomar foto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[glass, styles.photoBtn]} onPress={() => pickAndAnalyzePhoto(false)} activeOpacity={0.8}>
                    <Text style={styles.photoBtnIcon}>🖼️</Text>
                    <Text style={styles.photoBtnLabel}>Galería</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* ── Audio mode ── */}
          {mode === 'audio' && (
            <View style={styles.inputSection}>
              <View style={styles.audioHero}>
                <Text style={styles.audioMic}>🎤</Text>
                <Text style={styles.audioTitle}>Dictá lo que comiste</Text>
                <Text style={styles.audioHint}>
                  Tocá el campo de texto y usá el micrófono del teclado para dictar.
                </Text>
              </View>
              <TextInput
                style={styles.textArea}
                placeholder="Hablá o escribí lo que comiste…"
                placeholderTextColor={colors.dim}
                multiline
                numberOfLines={4}
                value={textInput}
                onChangeText={setTextInput}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.confirmBtn, (!textInput.trim() || loading) && styles.confirmBtnDisabled]}
                onPress={() => analyzeText(textInput)}
                disabled={!textInput.trim() || loading}
                activeOpacity={0.8}
              >
                {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.confirmBtnText}>Analizar con IA →</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ── Manual mode ── */}
          {mode === 'manual' && (
            <ScrollView style={styles.manualScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputHint}>Ingresá los datos nutricionales del alimento.</Text>

              <View style={styles.manualField}>
                <Text style={styles.manualLabel}>NOMBRE DEL ALIMENTO *</Text>
                <TextInput
                  style={styles.manualInput}
                  placeholder="Ej: Arroz con pollo"
                  placeholderTextColor={colors.dim}
                  value={manualName}
                  onChangeText={setManualName}
                  autoFocus
                />
              </View>

              <View style={styles.manualRow}>
                <View style={[styles.manualField, styles.manualFieldHalf]}>
                  <Text style={styles.manualLabel}>CALORÍAS (kcal)</Text>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="0"
                    placeholderTextColor={colors.dim}
                    keyboardType="decimal-pad"
                    value={manualCal}
                    onChangeText={setManualCal}
                  />
                </View>
                <View style={[styles.manualField, styles.manualFieldHalf]}>
                  <Text style={[styles.manualLabel, { color: colors.neon }]}>PROTEÍNAS (g)</Text>
                  <TextInput
                    style={[styles.manualInput, { borderColor: 'rgba(204,255,0,0.25)' }]}
                    placeholder="0"
                    placeholderTextColor={colors.dim}
                    keyboardType="decimal-pad"
                    value={manualProt}
                    onChangeText={setManualProt}
                  />
                </View>
              </View>

              <View style={styles.manualRow}>
                <View style={[styles.manualField, styles.manualFieldHalf]}>
                  <Text style={[styles.manualLabel, { color: colors.orange }]}>CARBOHIDRATOS (g)</Text>
                  <TextInput
                    style={[styles.manualInput, { borderColor: 'rgba(255,107,53,0.25)' }]}
                    placeholder="0"
                    placeholderTextColor={colors.dim}
                    keyboardType="decimal-pad"
                    value={manualCarbs}
                    onChangeText={setManualCarbs}
                  />
                </View>
                <View style={[styles.manualField, styles.manualFieldHalf]}>
                  <Text style={[styles.manualLabel, { color: colors.teal }]}>GRASAS (g)</Text>
                  <TextInput
                    style={[styles.manualInput, { borderColor: 'rgba(61,255,160,0.25)' }]}
                    placeholder="0"
                    placeholderTextColor={colors.dim}
                    keyboardType="decimal-pad"
                    value={manualFat}
                    onChangeText={setManualFat}
                  />
                </View>
              </View>

              {/* Preview total */}
              {(manualCal || manualProt || manualCarbs || manualFat) ? (
                <View style={styles.manualPreview}>
                  <Text style={styles.manualPreviewKcal}>{Math.round(parseFloat(manualCal) || 0)} kcal</Text>
                  <View style={styles.manualPreviewMacros}>
                    <Text style={[styles.macroChip, { color: colors.neon }]}>{parseFloat(manualProt) || 0}g P</Text>
                    <Text style={styles.macroDot}>·</Text>
                    <Text style={[styles.macroChip, { color: colors.orange }]}>{parseFloat(manualCarbs) || 0}g C</Text>
                    <Text style={styles.macroDot}>·</Text>
                    <Text style={[styles.macroChip, { color: colors.teal }]}>{parseFloat(manualFat) || 0}g G</Text>
                  </View>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.confirmBtn, (!manualName.trim() || manualSaving) && styles.confirmBtnDisabled, { marginTop: 8, marginBottom: 8 }]}
                onPress={handleManualAdd}
                disabled={!manualName.trim() || manualSaving}
                activeOpacity={0.8}
              >
                {manualSaving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.confirmBtnText}>Guardar alimento</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MethodBtn({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[glass, styles.methodBtn]} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.methodIcon}>{icon}</Text>
      <Text style={styles.methodLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 20, color: colors.muted },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  closeBtnText: { fontSize: 16, color: colors.muted, padding: 4 },

  pickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  methodBtn: {
    width: '31%',
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
  },
  methodIcon: { fontSize: 28 },
  methodLabel: {
    fontSize: 12,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    textAlign: 'center',
  },

  inputSection: { paddingVertical: 8, gap: 14 },
  inputHint: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    lineHeight: 18,
    marginBottom: 4,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  photoSection: { paddingVertical: 8, gap: 20 },
  photoButtons: { flexDirection: 'row', gap: 12 },
  photoBtn: {
    flex: 1,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
  },
  photoBtnIcon: { fontSize: 36 },
  photoBtnLabel: {
    fontSize: 14,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 16 },
  loadingText: { fontSize: 14, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },

  audioHero: { alignItems: 'center', paddingVertical: 8, gap: 6 },
  audioMic: { fontSize: 48 },
  audioTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  audioHint: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Manual entry
  manualScroll: { paddingTop: 4, maxHeight: 420 },
  manualField: { gap: 6, marginBottom: 12 },
  manualFieldHalf: { flex: 1 },
  manualRow: { flexDirection: 'row', gap: 10 },
  manualLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    letterSpacing: 1.2,
  },
  manualInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 15,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  manualPreview: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 4,
    gap: 4,
  },
  manualPreviewKcal: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  manualPreviewMacros: { flexDirection: 'row', gap: 6, alignItems: 'center' },

  // Preview & confirm
  previewScroll: { maxHeight: 320, marginBottom: 16 },
  previewRow: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8, borderRadius: 12 },
  previewInfo: { flex: 1, gap: 4 },
  previewName: {
    fontSize: 15,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
    fontWeight: '500',
  },
  previewMacros: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  macroChip: { fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold' },
  macroDot: { fontSize: 11, color: colors.dim },
  previewRight: { alignItems: 'flex-end', gap: 2 },
  previewKcal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  previewKcalLabel: { fontSize: 10, color: colors.muted, fontFamily: 'SpaceGrotesk_400Regular' },
  removeChip: {
    marginTop: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,53,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeChipText: { fontSize: 10, color: colors.orange },
  confirmBtn: {
    backgroundColor: colors.neon,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.bg,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
});
