import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: IoniconName;
  nameActive: IoniconName;
  focused: boolean;
}

function TabIcon({ name, nameActive, focused }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      {focused && <View style={styles.activeBar} />}
      <Ionicons
        name={focused ? nameActive : name}
        size={22}
        color={focused ? colors.neon : colors.dim}
      />
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
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home-outline" nameActive="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="barbell-outline" nameActive="barbell" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="restaurant-outline" nameActive="restaurant" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="podium-outline" nameActive="podium" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person-outline" nameActive="person" focused={focused} />
          ),
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
    height: 52,
    paddingBottom: 4,
  },
  tabItem: {
    alignItems: 'center',
    gap: 4,
  },
  activeBar: {
    height: 3,
    width: 20,
    backgroundColor: colors.neon,
    borderRadius: 2,
  },
});
