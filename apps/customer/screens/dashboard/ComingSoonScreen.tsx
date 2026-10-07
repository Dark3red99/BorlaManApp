import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@borlaman/shared/theme/ThemeContext';
import type { Palette } from '@borlaman/shared/constants/theme';


const LABELS: Record<string, string> = {
  Dispose: 'Dispose',
  LearnEarn: 'Learn & Earn',
  Profile: 'Profile',
};

export default function ComingSoonScreen({ route }: any) {
  const { ui, isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const label = LABELS[route?.name] ?? route?.name ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={ui.bg} />
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Ionicons name="construct-outline" size={26} color={ui.accent} />
        </View>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.text}>This section is coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ui.bg,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ui.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: ui.text,
    marginBottom: 6,
  },
  text: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: ui.textMuted,
    textAlign: 'center',
  },
});
