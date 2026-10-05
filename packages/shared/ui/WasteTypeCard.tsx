import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import type { WasteTypeMeta } from '@borlaman/shared/constants/waste';
import { Elevation, Fonts, ICON_STROKE, Radius, type Palette } from '@borlaman/shared/constants/theme';
import { useTheme, useThemedStyles } from '@borlaman/shared/theme/ThemeContext';
import { wasteIcon } from './wasteIcons';
import { WASTE_IMAGES } from './wasteImages';

type Props = {
  meta: WasteTypeMeta;
  selected: boolean;
  onPress: () => void;
};

/** Selectable waste-type tile: photo on top (or tinted icon), label + description below. Two per row: parent uses flexWrap + space-between. */
export default function WasteTypeCard({ meta, selected, onPress }: Props) {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const image = WASTE_IMAGES[meta.type];
  const Icon = wasteIcon(meta.type);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${meta.label}, ${meta.description}`}
      style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}
    >
      <View style={[styles.media, { backgroundColor: soft(meta.color, meta.colorSoft) }]}>
        {image ? (
          <Image source={image} style={styles.image} resizeMode="cover" />
        ) : (
          <Icon size={40} color={meta.color} strokeWidth={ICON_STROKE} />
        )}
        {selected && (
          <View style={styles.check}>
            <Check size={13} color={ui.onAccent} strokeWidth={3} />
          </View>
        )}
      </View>
      <View style={styles.text}>
        <Text style={styles.label}>{meta.label}</Text>
        <Text style={styles.desc} numberOfLines={2}>{meta.description}</Text>
      </View>
    </Pressable>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
    card: {
      width: '48.5%',
      backgroundColor: ui.surface,
      borderRadius: Radius.lg,
      borderWidth: 2,
      borderColor: 'transparent',
      padding: 6,
      ...Elevation.card,
    },
    cardSelected: { borderColor: ui.accent },
    pressed: { opacity: 0.85 },
    media: {
      aspectRatio: 1.25,
      borderRadius: Radius.lg - 6,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: { width: '100%', height: '100%' },
    check: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: ui.accent,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { paddingHorizontal: 8, paddingTop: 10, paddingBottom: 8, gap: 2 },
    label: { fontFamily: Fonts.semiBold, fontSize: 14.5, color: ui.text },
    desc: { fontFamily: Fonts.regular, fontSize: 12, color: ui.textMuted, lineHeight: 16 },
  });
