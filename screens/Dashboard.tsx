import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import HomeScreen from './dashboard/HomeScreen';
import ScheduleScreen from './dashboard/ScheduleScreen';
import ProfileScreen from './dashboard/ProfileScreen';
import DisposeScreen from './dispose/DisposeScreen';
import LearnEarnScreen from './learn/LearnEarnScreen';

const PRIMARY = '#059669';
const WHITE   = '#FFFFFF';
const MUTED   = '#64748B';

type TabMeta = {
  label: string;
  center?: boolean;
  icon: (active: boolean) => React.ReactNode;
};

const TAB_META: Record<string, TabMeta> = {
  Home: {
    label: 'Home',
    icon: (a) => <MaterialCommunityIcons name={a ? 'home-variant' : 'home-variant-outline'} size={23} color={a ? PRIMARY : MUTED} />,
  },
  Schedule: {
    label: 'Schedule',
    icon: (a) => <Ionicons name={a ? 'calendar' : 'calendar-outline'} size={22} color={a ? PRIMARY : MUTED} />,
  },
  Dispose: {
    label: 'Dispose',
    center: true,
    icon: () => <MaterialCommunityIcons name="trash-can" size={26} color={WHITE} />,
  },
  LearnEarn: {
    label: 'Learn & Earn',
    icon: (a) => <Ionicons name={a ? 'school' : 'school-outline'} size={22} color={a ? PRIMARY : MUTED} />,
  },
  Profile: {
    label: 'Profile',
    icon: (a) => <Ionicons name={a ? 'person' : 'person-outline'} size={22} color={a ? PRIMARY : MUTED} />,
  },
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const meta = TAB_META[route.name];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (meta.center) {
          return (
            <TouchableOpacity key={route.key} style={styles.centerTab} onPress={onPress} activeOpacity={0.85}>
              <View style={styles.centerTabIcon}>{meta.icon(isFocused)}</View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity key={route.key} style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
            {meta.icon(isFocused)}
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{meta.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function Dashboard() {
  return (
    <Tab.Navigator
      id={undefined}
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Dispose" component={DisposeScreen} />
      <Tab.Screen name="LearnEarn" component={LearnEarnScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
    paddingTop: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: MUTED,
  },
  tabLabelActive: {
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY,
  },
  centerTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
  },
  centerTabIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 3,
    borderColor: WHITE,
  },
});
