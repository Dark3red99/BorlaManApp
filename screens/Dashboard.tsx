import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CalendarDays, GraduationCap, House, Trash2, UserRound, type LucideIcon } from 'lucide-react-native';

import HomeScreen from './dashboard/HomeScreen';
import ScheduleScreen from './dashboard/ScheduleScreen';
import ProfileScreen from './dashboard/ProfileScreen';
import DisposeScreen from './dispose/DisposeScreen';
import LearnEarnScreen from './learn/LearnEarnScreen';
import { Elevation, ICON_STROKE, type Palette } from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';

type TabMeta = { label: string; icon: LucideIcon; center?: boolean };

const TAB_META: Record<string, TabMeta> = {
  Home: { label: 'Home', icon: House },
  Schedule: { label: 'Schedule', icon: CalendarDays },
  Dispose: { label: 'Dispose waste', icon: Trash2, center: true },
  LearnEarn: { label: 'Learn and earn', icon: GraduationCap },
  Profile: { label: 'Profile', icon: UserRound },
};

/** Floating dock: icon-only tabs, the active one sits in a soft emerald disc. */
function DockTabBar({ state, navigation }: BottomTabBarProps) {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.dock}>
        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name];
          const focused = state.index === index;
          const Icon = meta.icon;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.slot}
              accessibilityRole="tab"
              accessibilityLabel={meta.label}
              accessibilityState={{ selected: focused }}
              hitSlop={4}
            >
              {meta.center ? (
                <View style={styles.centerBtn}>
                  <Icon size={24} color={ui.onAccent} strokeWidth={2} />
                </View>
              ) : (
                <View style={[styles.disc, focused && styles.discActive]}>
                  <Icon
                    size={22}
                    color={focused ? ui.accent : ui.textMuted}
                    strokeWidth={focused ? ICON_STROKE + 0.35 : ICON_STROKE}
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function Dashboard() {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Tab.Navigator
      id={undefined}
      initialRouteName="Home"
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: ui.bg } }}
      tabBar={(props) => <DockTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Dispose" component={DisposeScreen} />
      <Tab.Screen name="LearnEarn" component={LearnEarnScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
  outer: {
    backgroundColor: ui.bg,
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 68,
    paddingHorizontal: 10,
    borderRadius: 34,
    backgroundColor: ui.surface,
    ...Elevation.float,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disc: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discActive: {
    backgroundColor: ui.accentSoft,
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ui.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Elevation.accent,
  },
});
