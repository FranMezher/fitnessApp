import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface LabelProps {
  children: React.ReactNode;
}

export function Label({ children }: LabelProps) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
});
