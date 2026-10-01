import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Fonts, type Palette } from '../../constants/theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';

/** Big title for a tab screen, optional subtitle, optional actions on the right. */
export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.screenHeader}>
      <View style={styles.flex}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

/** Section label above a card, with an optional text action. */
export function SectionHeader({
  title,
  meta,
  action,
  onAction,
}: {
  title: string;
  /** Muted text after the title, e.g. a count. */
  meta?: string;
  action?: string;
  onAction?: () => void;
}) {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {title}
        {meta ? <Text style={styles.sectionMeta}>{`  ${meta}`}</Text> : null}
      </Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
  flex: { flex: 1 },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    color: ui.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    color: ui.textMuted,
    marginTop: 2,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: -4,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: ui.text,
    letterSpacing: -0.1,
  },
  sectionMeta: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: ui.textFaint,
  },
  sectionAction: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: ui.accent,
  },
});
