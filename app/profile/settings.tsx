import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, glowShadows } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { HudBackground } from '@/components/ui/HudBackground';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

export default function SettingsScreen() {
  const { token, profile, email, fetchProfile } = useAuthStore();

  const defaultName = profile?.name ?? (email ? email.split('@')[0] : '');
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Nombre requerido', 'El nombre no puede estar vacío.');
      return;
    }
    if (!token) return;
    setSaving(true);
    try {
      await api.upsertProfile(token, { name: trimmed });
      await fetchProfile();
      router.back();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <HudBackground style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* TopAppBar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.logo}>FITCORE</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Ajustes de cuenta</Text>

          {/* Name field */}
          <View style={[glass, styles.fieldCard]}>
            <View style={styles.fieldHeader}>
              <Ionicons name="person-outline" size={16} color={colors.muted} />
              <Text style={styles.fieldLabel}>NOMBRE DE USUARIO</Text>
            </View>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              placeholderTextColor={colors.dim}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={40}
              selectionColor={colors.neon}
            />
          </View>

          {/* Email (read-only) */}
          <View style={[glass, styles.fieldCard]}>
            <View style={styles.fieldHeader}>
              <Ionicons name="mail-outline" size={16} color={colors.muted} />
              <Text style={styles.fieldLabel}>EMAIL</Text>
            </View>
            <Text style={styles.readOnlyText}>{email ?? '—'}</Text>
          </View>

          {saving ? (
            <ActivityIndicator color={colors.neon} style={{ marginTop: spacing.sm }} />
          ) : (
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark" size={18} color={colors.bg} />
              <Text style={styles.saveBtnText}>GUARDAR CAMBIOS</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </HudBackground>
  );
}

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
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  logo: { ...text.heroMd, fontSize: 20, color: colors.neon, letterSpacing: -0.5 },

  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  sectionTitle: { ...text.headlineLg, color: colors.text, marginBottom: spacing.xs },

  fieldCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  fieldLabel: { ...text.labelSm, color: colors.muted },
  input: {
    ...text.bodyMd,
    color: colors.text,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  readOnlyText: { ...text.bodyMd, color: colors.muted },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neon,
    borderRadius: radius.md,
    height: 56,
    marginTop: spacing.sm,
    ...glowShadows.neon,
  },
  saveBtnText: { ...text.headlineMd, color: colors.bg },
});
