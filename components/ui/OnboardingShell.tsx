import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { text } from '@/constants/typography';
import { spacing, radius } from '@/constants/spacing';
import { ProgressBar } from './ProgressBar';
import { HudBackground } from './HudBackground';

interface OnboardingShellProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function OnboardingShell({
  step, totalSteps, title, subtitle, children, footer,
}: OnboardingShellProps) {
  const pct = (step / totalSteps) * 100;

  return (
    <HudBackground>
      <SafeAreaView style={styles.safe}>
        {/* Fixed header */}
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <Text style={styles.brandText}>FIT<Text style={styles.brandAccent}>CORE</Text></Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressMeta}>
              <Text style={styles.stepLabel}>PASO {String(step).padStart(2, '0')}</Text>
              <Text style={styles.stepPct}>{Math.round(pct)}%</Text>
            </View>
            <ProgressBar pct={pct} />
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          {children}
        </ScrollView>

        {/* Sticky footer CTA */}
        <View style={styles.footer}>
          {footer}
        </View>
      </SafeAreaView>
    </HudBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(19,19,19,0.85)',
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'italic',
    fontFamily: 'SpaceGrotesk_700Bold',
    color: colors.text,
  },
  brandAccent: {
    color: colors.neon,
  },
  closeBtn: {
    fontSize: 16,
    color: colors.muted,
  },
  container: {
    padding: spacing.marginMobile,
    paddingTop: spacing.lg,
    paddingBottom: 120,
    gap: spacing.xl,
  },
  progressSection: {
    gap: spacing.xs,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.xs,
  },
  stepLabel: {
    ...text.labelCaps,
    color: colors.neon,
    fontSize: 11,
  },
  stepPct: {
    ...text.dataMono,
    color: colors.muted,
  },
  titleSection: {
    gap: spacing.xs,
  },
  title: {
    ...text.heroMd,
    color: colors.text,
    lineHeight: 38,
  },
  subtitle: {
    ...text.bodyMd,
    color: colors.muted,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.marginMobile,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(8,8,8,0.9)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
