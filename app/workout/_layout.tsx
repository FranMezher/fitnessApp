import { Stack } from 'expo-router';
import { colors } from '@/constants/colors';

export default function WorkoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_bottom',
      }}
    />
  );
}
