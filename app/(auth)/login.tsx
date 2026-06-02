import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, glass, glowShadows } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { HudBackground } from '@/components/ui/HudBackground';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
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
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No se obtuvo idToken de Google');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) throw error;

      if (data.session) {
        const token = data.session.access_token;
        setSession(token, data.session.user.id, data.session.user.email ?? '');
        const profile = await api.getProfile(token).catch(() => null);
        router.replace(profile ? '/(tabs)' : '/(onboarding)/goal');
      }
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) return;
      Alert.alert('Error con Google', err.message ?? 'Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: 'fitcore://auth/callback' },
    });
    if (error) Alert.alert('Error', error.message);
  }

  return (
    <HudBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View style={styles.heroWrap}>
            <Text style={styles.heroText}>
              FIT<Text style={styles.heroAccent}>CORE</Text>
            </Text>
            <Text style={styles.heroSub}>UNLOCK ELITE PERFORMANCE</Text>
          </View>

          {/* Form card */}
          <View style={styles.formCard}>
            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>E-MAIL</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}>✉</Text>
                <TextInput
                  style={styles.input}
                  placeholder="nombre@performance.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  selectionColor={colors.neon}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>CONTRASEÑA</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPass}
                  selectionColor={colors.neon}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Text style={styles.inputIcon}>{showPass ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.forgotWrap}>
                <Text style={styles.forgotText}>¿OLVIDASTE TU CONTRASEÑA?</Text>
              </TouchableOpacity>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.ctaBtn, loading && { opacity: 0.6 }]}
              onPress={handleEmailLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.ctaText}>{loading ? 'INICIANDO...' : 'ENTRAR'}</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>OU ACESSE COM</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin} activeOpacity={0.75}>
                <Text style={styles.socialBtnText}>G  GOOGLE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={handleAppleLogin} activeOpacity={0.75}>
                <Text style={styles.socialBtnText}>  APPLE</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ¿Sin cuenta?{' '}
              <Text style={styles.footerLink} onPress={() => router.push('/(auth)/register')}>
                Regístrate
              </Text>
            </Text>
            <View style={styles.footerLinks}>
              <Text style={styles.footerMuted}>TÉRMINOS</Text>
              <Text style={styles.footerMuted}>PRIVACIDAD</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </HudBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    padding: spacing.marginMobile,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  heroWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  heroText: {
    ...text.heroLg,
    fontSize: 36,
    color: colors.text,
    fontStyle: 'italic',
  },
  heroAccent: {
    color: colors.neon,
  },
  heroSub: {
    ...text.labelCaps,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  formCard: {
    ...glass,
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: radius.lg,
  },
  fieldWrap: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...text.labelSm,
    color: colors.muted,
  },
  inputRow: {
    ...glass,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  inputIcon: {
    fontSize: 16,
    color: colors.muted,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: spacing.base,
  },
  forgotText: {
    ...text.labelSm,
    color: colors.neon,
  },
  ctaBtn: {
    backgroundColor: colors.neon,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    ...glowShadows.neon,
  },
  ctaText: {
    ...text.headlineMd,
    color: '#111',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    ...text.labelSm,
    color: colors.muted,
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialBtn: {
    flex: 1,
    ...glass,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  socialBtnText: {
    ...text.labelCaps,
    color: colors.text,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  footerText: {
    ...text.bodyMd,
    color: colors.muted,
  },
  footerLink: {
    color: colors.neon,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  footerLinks: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  footerMuted: {
    ...text.labelSm,
    color: colors.dim,
  },
});
