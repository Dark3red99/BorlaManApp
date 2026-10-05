import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ICON_STROKE, type Palette } from '@borlaman/shared/constants/theme';
import { useTheme, useThemedStyles } from '@borlaman/shared/theme/ThemeContext';

export type Tone = 'neutral' | 'accent' | 'solid' | 'amber' | 'blue' | 'danger';

const tonesFor = (ui: Palette): Record<Tone, { bg: string; fg: string }> => ({
  neutral: { bg: ui.well, fg: ui.text },
  accent: { bg: ui.accentSoft, fg: ui.accent },
  solid: { bg: ui.accent, fg: ui.onAccent },
  amber: { bg: ui.amberSoft, fg: ui.amber },
  blue: { bg: ui.blueSoft, fg: ui.blue },
  danger: { bg: ui.dangerSoft, fg: ui.danger },
});

type Props = {
  icon: LucideIcon;
  tone?: Tone;
  /** Override tone colors, e.g. per-waste-type tints. */
  bg?: string;
  fg?: string;
  size?: number;
  round?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** A rounded tile holding one thin-line icon. */
export default function IconTile({ icon: Icon, tone = 'neutral', bg, fg, size = 44, round, style }: Props) {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const t = tonesFor(ui)[tone];
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: round ? size / 2 : Math.round(size * 0.32),
          backgroundColor: bg ?? t.bg,
        },
        style,
      ]}
    >
      <Icon size={Math.round(size * 0.45)} color={fg ?? t.fg} strokeWidth={ICON_STROKE} />
    </View>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
});
