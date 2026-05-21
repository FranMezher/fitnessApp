import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, glowShadows } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { HudBackground } from '@/components/ui/HudBackground';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const setIsNewUser = useAuthStore((s) => s.setIsNewUser);

  async function handleRegister() {
    if (!name.trim() || !email || !password) {
      Alert.alert('Campos requeridos', 'Completá todos los campos.');
      return;
    }
    if (name.trim().length > 100) {
      Alert.alert('Nombre muy largo', 'Máximo 100 caracteres.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Email inválido', 'Ingresá un email válido.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña corta', 'Mínimo 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Contraseñas distintas', 'Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setIsNewUser(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: name.trim() } },
      });

      if (error) {
        setIsNewUser(false);
        throw error;
      }

      if (!data.user) {
        setIsNewUser(false);
        Alert.alert('Error', 'No se pudo crear la cuenta.');
        return;
      }

      if (!data.session) {
        setIsNewUser(false);
        Alert.alert(
          'Verificá tu email',
          'Te enviamos un link de confirmación. Verificá tu casilla y luego iniciá sesión.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
        );
        return;
      }

      router.replace('/(onboarding)/goal');
    } catch (err: any) {
      Alert.alert('Error al registrarse', err.message ?? 'Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <HudBackground style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        {/* TopAppBar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.logo}>FITCORE</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.titleSection}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Es gratis. Siempre.</Text>
          </View>

          <View style={[glass, styles.formCard]}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NOMBRE</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu nombre"
                placeholderTextColor={colors.dim}
                autoCapitalize="words"
                selectionColor={colors.neon}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor={colors.dim}
                keyboardType="email-address"
                autoCapitalize="none"
                selectionColor={colors.neon}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CONTRASEÑA</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.dim}
                secureTextEntry
                selectionColor={colors.neon}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CONFIRMAR CONTRASEÑA</Text>
              <TextInput
                style={[styles.input, { marginBottom: 0 }]}
                placeholder="Repetí la contraseña"
                placeholderTextColor={colors.dim}
                secureTextEntry
                selectionColor={colors.neon}
                value={confirm}
                onChangeText={setConfirm}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.bg} size="small" />
            ) : (
              <>
                <Ionicons name="person-add-outline" size={18} color={colors.bg} />
                <Text style={styles.ctaBtnText}>CREAR CUENTA GRATIS</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.terms}>
            Al registrarte aceptás nuestros términos de uso y política de privacidad.
          </Text>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },

  titleSection: { gap: spacing.xs },
  title: { ...text.heroMd, color: colors.text },
  subtitle: { ...text.bodyMd, color: colors.muted },

  formCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  fieldGroup: { gap: spacing.xs },
  fieldLabel: { ...text.labelSm, color: colors.muted },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    ...text.bodyMd,
  },

  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neon,
    borderRadius: radius.md,
    height: 56,
    ...glowShadows.neon,
  },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: { ...text.headlineMd, color: colors.bg },

  terms: {
    ...text.labelSm,
    color: colors.dim,
    textAlign: 'center',
    lineHeight: 16,
    textTransform: 'none',
    letterSpacing: 0,
  },
});
