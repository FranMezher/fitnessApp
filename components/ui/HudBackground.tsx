import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface HudBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function HudBackground({ children, style }: HudBackgroundProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Grid lines overlay */}
      <View style={styles.gridH} pointerEvents="none" />
      <View style={styles.gridV} pointerEvents="none" />
      {/* Neon radial at top-left */}
      <View style={styles.radialNeon} pointerEvents="none" />
      {/* Orange radial at bottom-right */}
      <View style={styles.radialOrange} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  gridH: {
    ...StyleSheet.absoluteFillObject,
    // Simulated grid via opacity layer — actual grid lines use SVG in production
    backgroundImage: undefined,
    opacity: 0.03,
  },
  gridV: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
  },
  radialNeon: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(204,255,0,0.06)',
  },
  radialOrange: {
    position: 'absolute',
    bottom: -120,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255,107,53,0.05)',
  },
});
