import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/constants/colors';

interface RingProps {
  pct?: number;
  size?: number;
  color?: string;
  label?: string;
  sub?: string;
}

export function Ring({ pct = 72, size = 80, color = colors.neon, label = '', sub = '' }: RingProps) {
  const r = size / 2 - 7;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        style={StyleSheet.absoluteFillObject}
        // rotate -90deg so arc starts at top
        viewBox={`0 0 ${size} ${size}`}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={6}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={`${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.inner}>
        <Text style={[styles.label, { fontSize: size * 0.21, color }]}>{label}</Text>
        <Text style={[styles.sub, { fontSize: size * 0.14 }]}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    alignItems: 'center',
  },
  label: {
    fontWeight: '700',
    lineHeight: 20,
  },
  sub: {
    color: colors.muted,
  },
});
