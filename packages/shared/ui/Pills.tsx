import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Elevation, Fonts, Radius, type Palette } from '@borlaman/shared/constants/theme';
import { useThemedStyles } from '@borlaman/shared/theme/ThemeContext';

export type PillOption<K extends string | number> = {
  key: K;
  label: string;
  disabled?: boolean;
  accessibilityLabel?: string;
};

type Props<K extends string | number> = {
  options: PillOption<K>[];
  isSelected: (key: K) => boolean;
  onPress: (key: K) => void;
  /** 'row' = one equal-width line (weekdays); 'grid' = three per row (time slots). */
  layout?: 'row' | 'grid';
  /** Checkbox semantics for multi-select sets. */
  multi?: boolean;
};

/** White pills that fill with the accent when chosen. Single or multi-select. */
export default function Pills<K extends string | number>({
  options,
  isSelected,
  onPress,
  layout = 'grid',
  multi,
}: Props<K>) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={layout === 'row' ? styles.row : styles.grid}>
      {options.map((opt) => {
        const selected = isSelected(opt.key);
        return (
          <Pressable
            key={opt.key}
            onPress={() => onPress(opt.key)}
            disabled={opt.disabled}
            accessibilityRole={multi ? 'checkbox' : 'radio'}
            accessibilityState={multi ? { checked: selected, disabled: opt.disabled } : { selected, disabled: opt.disabled }}
            accessibilityLabel={opt.accessibilityLabel ?? opt.label}
            style={({ pressed }) => [
              styles.pill,
              layout === 'row' ? styles.pillRow : styles.pillGrid,
              selected && styles.pillSelected,
              opt.disabled && styles.pillDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[styles.label, selected && styles.labelSelected, opt.disabled && styles.labelDisabled]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 6 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    pill: {
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: Radius.pill,
      backgroundColor: ui.surface,
      ...Elevation.card,
    },
    pillRow: { flex: 1 },
    pillGrid: { width: '30%', flexGrow: 1 },
    pillSelected: { backgroundColor: ui.accent },
    pillDisabled: { backgroundColor: ui.well, shadowOpacity: 0, elevation: 0 },
    pressed: { opacity: 0.85 },
    label: { fontFamily: Fonts.medium, fontSize: 13, color: ui.text },
    labelSelected: { fontFamily: Fonts.semiBold, color: ui.onAccent },
    labelDisabled: { color: ui.textFaint },
  });
