import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface PillProps {
  children: React.ReactNode;
  color?: string;
}

export function Pill({ children, color = colors.neon }: PillProps) {
  return (
    <Text
      style={[
        styles.pill,
        {
          color,
          backgroundColor: `${color}18`,
          borderColor: `${color}44`,
        },
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  pill: {
    overflow: 'hidden',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});
