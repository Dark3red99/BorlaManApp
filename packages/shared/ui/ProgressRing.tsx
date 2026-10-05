import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Fonts, type Palette } from '@borlaman/shared/constants/theme';
import { useTheme, useThemedStyles } from '@borlaman/shared/theme/ThemeContext';

type Props = {
  /** 0..1 */
  progress: number;
  value: string;
  unit?: string;
  color?: string;
  size?: number;
  stroke?: number;
};

/** Thin circular progress gauge with the value in the middle. */
export default function ProgressRing({
  progress,
  value,
  unit,
  color,
  size = 76,
  stroke = 6,
}: Props) {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(progress, 1));
  // Always show a sliver so an empty ring still reads as a gauge.
  const shown = clamped === 0 ? 0.02 : clamped;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={ui.wellStrong} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? ui.accent}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - shown)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  value: { fontFamily: Fonts.bold, fontSize: 16, color: ui.text, letterSpacing: -0.3 },
  unit: { fontFamily: Fonts.medium, fontSize: 10.5, color: ui.textFaint, marginTop: -2 },
});
