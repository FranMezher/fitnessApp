import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, glowShadows } from '@/constants/colors';

interface RingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  value?: string | number;
  glow?: boolean;
}

export function Ring({
  percentage,
  size = 180,
  strokeWidth = 8,
  color = colors.neon,
  label,
  value,
  glow = true,
}: RingProps) {
  const innerSize = size - strokeWidth * 2;

  const glowStyle =
    color === colors.neon
      ? glowShadows.neon
      : color === colors.orange
      ? glowShadows.orange
      : color === colors.teal
      ? glowShadows.teal
      : {};

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.ringOuter,
          {
            width: size,
            height: size,
            borderWidth: strokeWidth,
            borderColor: colors.border,
            borderRadius: size / 2,
          },
          glow && glowStyle,
        ]}
      >
        <View
          style={[
            styles.ringInner,
            {
              width: innerSize,
              height: innerSize,
              borderWidth: strokeWidth,
              borderColor: color,
              borderRadius: innerSize / 2,
              opacity: percentage / 100,
            },
          ]}
        />
      </View>

      <View style={styles.content}>
        {value && (
          <Text
            style={[
              styles.value,
              { color },
            ]}
          >
            {value}
          </Text>
        )}
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ringInner: {
    backgroundColor: 'transparent',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  value: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  label: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
