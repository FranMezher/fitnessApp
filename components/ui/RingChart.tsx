import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/constants/colors';

export interface RingDef {
  radius: number;
  strokeWidth: number;
  progress: number; // 0–1
  color: string;
  trackColor?: string;
}

interface RingChartProps {
  size: number;
  rings: RingDef[];
  children?: React.ReactNode;
}

export function RingChart({ size, rings, children }: RingChartProps) {
  const center = size / 2;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((ring, i) => {
          const circumference = 2 * Math.PI * ring.radius;
          const offset = circumference * (1 - Math.min(1, Math.max(0, ring.progress)));
          return (
            <React.Fragment key={i}>
              <Circle
                cx={center}
                cy={center}
                r={ring.radius}
                fill="transparent"
                stroke={ring.trackColor ?? colors.surfaceContainerHigh}
                strokeWidth={ring.strokeWidth}
              />
              <Circle
                cx={center}
                cy={center}
                r={ring.radius}
                fill="transparent"
                stroke={ring.color}
                strokeWidth={ring.strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${center}, ${center}`}
              />
            </React.Fragment>
          );
        })}
      </Svg>
      {children && (
        <View style={StyleSheet.absoluteFillObject}>
          <View style={styles.center}>{children}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
