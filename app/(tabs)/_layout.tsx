import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
}

function TabIcon({ icon, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="⌂" label="Inicio" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="◈" label="Entrena" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="◎" label="Nutri" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="▣" label="Progreso" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="◉" label="Yo" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(8,8,8,0.95)',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 68,
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: 'center',
    gap: 3,
  },
  tabIcon: {
    fontSize: 20,
    color: colors.dim,
  },
  tabIconActive: {
    color: colors.neon,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.dim,
    fontWeight: '400',
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  tabLabelActive: {
    color: colors.neon,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
});
