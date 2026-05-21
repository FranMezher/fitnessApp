import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, glowShadows } from '@/constants/colors';

interface BtnProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'orange' | 'glass';
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export function Btn({ children, variant = 'primary', onPress, style, disabled }: BtnProps) {
  const variantStyle =
    variant === 'primary' ? styles.primary :
    variant === 'orange'  ? styles.orange  :
    variant === 'glass'   ? styles.glassAction :
    styles.ghost;

  const textStyle =
    variant === 'primary' ? styles.textPrimary :
    variant === 'orange'  ? styles.textOrange  :
    variant === 'glass'   ? styles.textGlass   :
    styles.textGhost;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
      style={[styles.base, variantStyle, style, disabled && { opacity: 0.4 }]}
    >
      <Text style={[styles.text, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.neon,
    ...glowShadows.neon,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  orange: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.orange,
  },
  glassAction: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  textPrimary: {
    color: '#111',
  },
  textGhost: {
    color: colors.neon,
  },
  textOrange: {
    color: colors.orange,
  },
  textGlass: {
    color: colors.text,
  },
});
