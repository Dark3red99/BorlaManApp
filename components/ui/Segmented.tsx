import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Elevation, Fonts, Radius, type Palette } from '../../constants/theme';
import { useThemedStyles } from '../../context/ThemeContext';

export type SegmentOption<K extends string | number> = {
  key: K;
  label: string;
  /** Small line under the label, e.g. "~10 kg". */
  sub?: string;
  accessibilityLabel?: string;
};

type Props<K extends string | number> = {
  options: SegmentOption<K>[];
  value: K | null;
  onChange: (key: K) => void;
};

/** Equal-width options in a recessed well; the selected one lifts onto a white pill. */
export default function Segmented<K extends string | number>({ options, value, onChange }: Props<K>) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.well} accessibilityRole="radiogroup">
      {options.map((opt) => {
        const selected = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.accessibilityLabel ?? opt.label}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{opt.label}</Text>
            {opt.sub ? <Text style={styles.sub}>{opt.sub}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
    well: {
      flexDirection: 'row',
      backgroundColor: ui.wellStrong,
      borderRadius: Radius.lg,
      padding: 4,
      gap: 4,
    },
    segment: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: Radius.lg - 4 },
    segmentSelected: { backgroundColor: ui.surface, ...Elevation.card },
    label: { fontFamily: Fonts.medium, fontSize: 13, color: ui.textMuted },
    labelSelected: { fontFamily: Fonts.semiBold, color: ui.text },
    sub: { fontFamily: Fonts.regular, fontSize: 11.5, color: ui.textFaint, marginTop: 1 },
  });
