import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Ajustes de cuenta</Text>
          <View style={{ width: 72 }} />
        </View>

        {/* Name field */}
        <View style={[glass, styles.fieldCard]}>
          <Text style={styles.fieldLabel}>NOMBRE DE USUARIO</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor={colors.dim}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={40}
          />
        </View>

        {/* Email (read-only) */}
        <View style={[glass, styles.fieldCard]}>
          <Text style={styles.fieldLabel}>EMAIL</Text>
          <Text style={styles.readOnlyText}>{email ?? '—'}</Text>
        </View>

        {saving ? (
          <ActivityIndicator color={colors.neon} style={{ marginTop: 8 }} />
        ) : (
          <Btn onPress={handleSave}>Guardar cambios</Btn>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 20, gap: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backText: {
    fontSize: 14,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    width: 72,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
    textAlign: 'center',
  },
  fieldCard: {
    padding: 14,
    paddingHorizontal: 16,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  input: {
    fontSize: 16,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  readOnlyText: {
    fontSize: 15,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
});
