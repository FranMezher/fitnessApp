import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { glass, glassNeon, glassOrange } from '@/constants/colors';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'neon' | 'orange';
  style?: ViewStyle;
}

export function GlassCard({ children, variant = 'default', style }: GlassCardProps) {
  const variantStyle =
    variant === 'neon'
      ? glassNeon
      : variant === 'orange'
      ? glassOrange
      : glass;

  return (
    <View style={[styles.card, variantStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
  },
});
