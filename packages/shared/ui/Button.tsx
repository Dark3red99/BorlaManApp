import React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Elevation, Fonts, ICON_STROKE, Radius, type Palette } from '@borlaman/shared/constants/theme';
import { useTheme, useThemedStyles } from '@borlaman/shared/theme/ThemeContext';

type Props = {
  label: string;
  onPress?: () => void;
  icon?: LucideIcon;
  /** Put the icon before the label instead of after it. */
  iconLeft?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export default function Button({
  label,
  onPress,
  icon: Icon,
  iconLeft,
  variant = 'primary',
  size = 'md',
  style,
  disabled,
}: Props) {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const fg = variant === 'primary' ? ui.onAccent : ui.text;
  const icon = Icon ? (
    <Icon size={size === 'md' ? 18 : 16} color={fg} strokeWidth={ICON_STROKE + 0.25} />
  ) : null;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        (pressed || disabled) && styles.dim,
        style,
      ]}
    >
      {iconLeft && icon}
      <Text style={[styles.label, size === 'sm' && styles.labelSm, { color: fg }]}>{label}</Text>
      {!iconLeft && icon}
    </Pressable>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.pill,
  },
  md: { height: 54, paddingHorizontal: 24 },
  sm: { height: 42, paddingHorizontal: 18 },
  primary: { backgroundColor: ui.accent, ...Elevation.accent },
  secondary: { backgroundColor: ui.well },
  dim: { opacity: 0.85 },
  label: { fontFamily: Fonts.semiBold, fontSize: 15, letterSpacing: 0.1 },
  labelSm: { fontSize: 13.5 },
});
