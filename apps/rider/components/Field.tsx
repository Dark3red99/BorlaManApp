import React from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Fonts, Radius, type Palette } from '@borlaman/shared/constants/theme';
import { useTheme, useThemedStyles } from '@borlaman/shared/theme/ThemeContext';

type Props = TextInputProps & { label: string; hint?: string };

/** Labelled text input in the rider app's dark style. */
export default function Field({ label, hint, style, ...input }: Props) {
  const { ui } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={ui.textFaint} style={[styles.input, style]} {...input} />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
    wrap: { gap: 6 },
    label: { fontFamily: Fonts.semiBold, fontSize: 13, color: ui.textMuted },
    input: {
      backgroundColor: ui.surface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: ui.hairline,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontFamily: Fonts.medium,
      fontSize: 15,
      color: ui.text,
    },
    hint: { fontFamily: Fonts.regular, fontSize: 12, color: ui.textFaint },
  });
