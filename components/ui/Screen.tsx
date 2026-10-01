import React from 'react';
import { ScrollView, StatusBar, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Palette } from '../../constants/theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';

type Props = {
  children: React.ReactNode;
  /** Wrap content in a ScrollView (default true). */
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Neutral canvas + safe area + status bar matched to the theme shared by every tab screen. */
export default function Screen({ children, scroll = true, contentStyle }: Props) {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={ui.dark ? 'light-content' : 'dark-content'} backgroundColor={ui.bg} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
  safe: { flex: 1, backgroundColor: ui.bg },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, gap: 16 },
  fill: { flex: 1 },
});
