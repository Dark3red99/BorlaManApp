import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Elevation, ICON_STROKE, type Palette } from '../../constants/theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';

type Props = {
  icon: LucideIcon;
  onPress?: () => void;
  accessibilityLabel: string;
  variant?: 'surface' | 'well' | 'accent';
  size?: number;
  /** Small dot in the corner, e.g. unread notifications. */
  badge?: boolean;
};

export default function IconButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
  variant = 'surface',
  size = 44,
  badge,
}: Props) {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const fg = variant === 'accent' ? ui.onAccent : ui.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        styles.btn,
        styles[variant],
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
      ]}
    >
      <Icon size={Math.round(size * 0.43)} color={fg} strokeWidth={ICON_STROKE} />
      {badge && <View style={styles.badge} />}
    </Pressable>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
  surface: { backgroundColor: ui.surface, ...Elevation.card },
  well: { backgroundColor: ui.well },
  accent: { backgroundColor: ui.accent, ...Elevation.accent },
  pressed: { opacity: 0.8 },
  badge: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ui.accent,
    borderWidth: 1.5,
    borderColor: ui.surface,
  },
});
