import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Elevation, Radius, type Palette } from '@borlaman/shared/constants/theme';
import { useTheme, useThemedStyles } from '@borlaman/shared/theme/ThemeContext';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** 'surface' = white raised card, 'well' = recessed grey tile, 'accent' = emerald fill. */
  variant?: 'surface' | 'well' | 'accent';
  padded?: boolean;
  accessibilityLabel?: string;
};

export default function Card({
  children,
  style,
  onPress,
  variant = 'surface',
  padded = true,
  accessibilityLabel,
}: Props) {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const base = [styles.base, styles[variant], padded && styles.padded, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
  base: { borderRadius: Radius.lg },
  padded: { padding: 18 },
  surface: { backgroundColor: ui.surface, ...Elevation.card },
  well: { backgroundColor: ui.well },
  accent: { backgroundColor: ui.accent, ...Elevation.accent },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
});
