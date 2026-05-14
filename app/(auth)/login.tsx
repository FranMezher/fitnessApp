import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass } from '@/constants/colors';
import { Btn } from '@/components/ui/Btn';
import { Label } from '@/components/ui/Label';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);

  async function handleEmailLogin() {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Ingresá tu email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) {
        const token = data.session.access_token;
        setSession(token, data.session.user.id, data.session.user.email ?? '');
        const profile = await api.getProfile(token).catch(() => null);
        router.replace(profile ? '/(tabs)' : '/(onboarding)/goal');
      }
    } catch (err: any) {
      Alert.alert('Error al iniciar sesión', err.message ?? 'Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'fitcore://auth/callback' },
    });
    if (error) Alert.alert('Error', error.message);
  }

  async function handleAppleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: 'fitcore://auth/callback' },
    });
    if (error) Alert.alert('Error', error.message);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>FITCORE</Text>
          <Text style={styles.logoSub}>Tu cuerpo. Tu ritmo. Tu meta.</Text>
        </View>

        {/* Social login */}
        <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7} onPress={handleGoogleLogin}>
          <View style={styles.socialIcon}>
            <Text style={styles.socialIconText}>G</Text>
          </View>
          <Text style={styles.socialLabel}>Continuar con Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7} onPress={handleAppleLogin}>
          <View style={styles.socialIcon}>
            <Text style={styles.socialIconText}>🍎</Text>
          </View>
          <Text style={styles.socialLabel}>Continuar con Apple</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o con email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email / Password */}
        <Label>Email</Label>
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

        <Label>Contraseña</Label>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.dim}
          secureTextEntry
          selectionColor={colors.neon}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.forgotWrap}>
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <Btn onPress={handleEmailLogin}>
          {loading ? 'Iniciando...' : 'Iniciar sesión'}
        </Btn>

        <View style={styles.registerWrap}>
          <Text style={styles.registerText}>¿Sin cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLink}>Regístrate gratis</Text>
          </TouchableOpacity>
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
  container: {
    padding: 24,
    paddingTop: 8,
  },
  logoWrap: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  logoText: {
    fontSize: 13,
    letterSpacing: 6,
    color: colors.neon,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  logoSub: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  socialBtn: {
    ...glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  socialIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  socialLabel: {
    fontSize: 15,
    color: colors.text,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: colors.dim,
    fontFamily: 'SpaceGrotesk_400Regular',
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
    marginBottom: 10,
  },
  forgotWrap: {
    alignItems: 'flex-end',
    marginBottom: 18,
  },
  forgotText: {
    fontSize: 13,
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  registerWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    fontSize: 14,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  registerLink: {
    fontSize: 14,
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
});
