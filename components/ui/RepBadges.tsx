import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface RepBadgesProps {
  completed: number;
  total: number;
  size?: number;
}

export function RepBadges({ completed, total, size = 40 }: RepBadgesProps) {
  const badges = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      {badges.map((num) => {
        const isCompleted = num <= completed;
        return (
          <View
            key={num}
            style={[
              styles.badge,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
              isCompleted
                ? {
                    backgroundColor: colors.neon,
                    borderColor: colors.neon,
                  }
                : {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: isCompleted ? '#111' : colors.dim },
              ]}
            >
              {num}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  badge: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
});
