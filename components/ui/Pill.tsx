import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Fonts, Radius } from '../../constants/theme';

type Props = {
  label: string;
  color: string;
  bg: string;
  /** Leading dot, e.g. for live statuses. */
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Small rounded status label. */
export default function Pill({ label, color, bg, dot, style }: Props) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={[styles.label, { color }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontFamily: Fonts.semiBold, fontSize: 11.5 },
});
