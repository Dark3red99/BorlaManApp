import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Fonts, ICON_STROKE, type Palette } from '@borlaman/shared/constants/theme';
import { useTheme, useThemedStyles } from '@borlaman/shared/theme/ThemeContext';

type Props = {
  left?: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Content on the right edge. A chevron is shown instead when `chevron` is set. */
  right?: React.ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  /** Draw a hairline under the row (use for all but the last row in a card). */
  divider?: boolean;
  numberOfLines?: number;
};

/** Icon + title/subtitle + trailing content. The building block of every list card. */
export default function ListRow({
  left,
  title,
  subtitle,
  right,
  chevron,
  onPress,
  divider,
  numberOfLines = 1,
}: Props) {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const body = (
    <>
      {left}
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={numberOfLines}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
      {chevron && <ChevronRight size={18} color={ui.textFaint} strokeWidth={ICON_STROKE} />}
    </>
  );

  const style = [styles.row, divider && styles.divider];
  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [style, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: ui.hairline,
  },
  pressed: { opacity: 0.6 },
  text: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    color: ui.text,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12.5,
    color: ui.textMuted,
    marginTop: 2,
    lineHeight: 17,
  },
});

