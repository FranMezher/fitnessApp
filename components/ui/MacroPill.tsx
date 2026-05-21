import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { text } from '@/constants/typography';

interface MacroPillProps {
  label: string;
  g?: number;
  color: string;
}

export function MacroPill({ label, g, color }: MacroPillProps) {
  return (
    <View style={[styles.wrap, { borderColor: `${color}40` }]}>
      <Text style={[styles.g, { color }]}>{g ?? '—'}g</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  g: { ...text.headlineMd, fontSize: 16 },
  label: { ...text.labelSm, color: colors.muted, marginTop: 2 },
});
