import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Fonts, type Palette } from '@borlaman/shared/constants/theme';
import { useTheme, useThemedStyles } from '@borlaman/shared/theme/ThemeContext';

export function initialsOf(name: string | undefined | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

type Props = {
  name?: string | null;
  size?: number;
  onPress?: () => void;
};

/** Initials in a soft emerald circle. */
export default function Avatar({ name, size = 44, onPress }: Props) {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const inner = (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: Math.round(size * 0.36) }]}>{initialsOf(name)}</Text>
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Open profile" hitSlop={6}>
      {inner}
    </Pressable>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
  circle: {
    backgroundColor: ui.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: ui.surface,
  },
  text: { fontFamily: Fonts.bold, color: ui.accentDeep, letterSpacing: 0.3 },
});
