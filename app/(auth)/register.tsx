import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';
import { Label } from '@/components/ui/Label';
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
    if (password.length < 6) {
      Alert.alert('Contraseña corta', 'Mínimo 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Contraseñas distintas', 'Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    // Mark as new user BEFORE signUp so _layout.tsx doesn't redirect to tabs
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

      // If email confirmation is required, data.session will be null
      if (!data.session) {
        setIsNewUser(false);
        Alert.alert(
          'Verificá tu email',
          'Te enviamos un link de confirmación. Verificá tu casilla y luego iniciá sesión.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
        );
        return;
      }

      // Email confirmation disabled → go straight to onboarding
      router.replace('/(onboarding)/goal');
    } catch (err: any) {
      Alert.alert('Error al registrarse', err.message ?? 'Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.sub}>Es gratis. Siempre.</Text>

        <Label>Nombre</Label>
        <TextInput
          style={styles.input}
          placeholder="Tu nombre"
          placeholderTextColor={colors.dim}
          autoCapitalize="words"
          selectionColor={colors.neon}
          value={name}
          onChangeText={setName}
        />

        <Label>Email</Label>
        <TextInput
          style={styles.input}
          placeholder="carlos@email.com"
          placeholderTextColor={colors.dim}
          keyboardType="email-address"
          autoCapitalize="none"
          selectionColor={colors.neon}
          value={email}
          onChangeText={setEmail}
        />

        <Label>Contraseña</Label>
        <TextInput
          style={styles.input}
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor={colors.dim}
          secureTextEntry
          selectionColor={colors.neon}
          value={password}
          onChangeText={setPassword}
        />

        <Label>Confirmar contraseña</Label>
        <TextInput
          style={styles.input}
          placeholder="Repetí la contraseña"
          placeholderTextColor={colors.dim}
          secureTextEntry
          selectionColor={colors.neon}
          value={confirm}
          onChangeText={setConfirm}
        />

        <View style={styles.btnWrap}>
          <Btn onPress={handleRegister}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
          </Btn>
        </View>

        <Text style={styles.terms}>
          Al registrarte aceptás nuestros términos de uso y política de privacidad.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 24, paddingTop: 12 },
  back: { marginBottom: 20 },
  backText: { color: colors.muted, fontSize: 14, fontFamily: 'SpaceGrotesk_400Regular' },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginBottom: 4,
  },
  sub: {
    fontSize: 14,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginBottom: 28,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 15,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginBottom: 12,
  },
  btnWrap: { marginTop: 8, marginBottom: 16 },
  terms: {
    fontSize: 11,
    color: colors.dim,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk_400Regular',
    lineHeight: 16,
  },
});
