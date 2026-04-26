import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface ProgressBarProps {
  pct: number;
  color?: string;
  h?: number;
}

export function ProgressBar({ pct, color = colors.neon, h = 6 }: ProgressBarProps) {
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 10,
  },
});
