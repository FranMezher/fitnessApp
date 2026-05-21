import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface ProgressBarProps {
  pct: number;
  color?: string;
  h?: number;
}

export function ProgressBar({ pct, color = colors.neon, h = 4 }: ProgressBarProps) {
  return (
    <View style={[styles.track, { height: h }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.min(100, Math.max(0, pct))}%`,
            height: h,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 99,
    shadowColor: colors.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
});
