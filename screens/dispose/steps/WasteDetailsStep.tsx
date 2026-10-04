import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Alert } from 'react-native';
import { Camera, ImagePlus, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { WASTE_TYPES, SIZE_BANDS as SIZES } from '../../../constants/waste';
import { pickupPrice } from '../../../constants/pricing';
import { Fonts, ICON_STROKE, Radius, type Palette } from '../../../constants/theme';
import { useTheme, useThemedStyles } from '../../../context/ThemeContext';
import { Card, Segmented, WasteTypeCard } from '../../../components/ui';
import type { PickupDraft } from '../RequestPickupScreen';

const MAX_PHOTOS = 3;

type Props = {
  draft: PickupDraft;
  onChange: (patch: Partial<PickupDraft>) => void;
};

export default function WasteDetailsStep({ draft, onChange }: Props) {
  const { ui } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const addPhoto = async (source: 'camera' | 'library') => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: 'images',
      quality: 0.6,
      allowsEditing: false,
    };
    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera unavailable', 'Allow camera access to photograph your waste.');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Photos unavailable', 'Allow photo access to attach pictures.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }
    if (!result.canceled && result.assets[0]) {
      onChange({ photos: [...draft.photos, result.assets[0].uri].slice(0, MAX_PHOTOS) });
    }
  };

  const removePhoto = (uri: string) => {
    onChange({ photos: draft.photos.filter((p) => p !== uri) });
  };

  const selectedSize = SIZES.find((s) => s.kg === draft.volumeKg);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* ── Waste type ── */}
      <View>
        <Text style={styles.sectionTitle}>What are we collecting?</Text>
        <Text style={styles.sectionHint}>Pick the closest match. Sorted waste costs less.</Text>
      </View>
      <View style={styles.typeGrid}>
        {WASTE_TYPES.map((meta) => (
          <WasteTypeCard
            key={meta.type}
            meta={meta}
            selected={draft.wasteType === meta.type}
            onPress={() => onChange({ wasteType: meta.type })}
          />
        ))}
      </View>

      {/* ── Quantity ── */}
      <View>
        <Text style={styles.sectionTitle}>How much is there?</Text>
        <Text style={styles.sectionHint}>Priced per load. The collector confirms on arrival.</Text>
      </View>
      <Segmented
        options={SIZES.map((size) => ({
          key: size.kg,
          label: size.label,
          // Live price for the chosen waste type (household rate until one is picked)
          sub: `GH₵ ${pickupPrice(size.kg, draft.wasteType ?? 'household', false).sizeGhs}`,
          accessibilityLabel: `${size.label}, ${size.hint}`,
        }))}
        value={draft.volumeKg}
        onChange={(kg) => onChange({ volumeKg: kg })}
      />
      {selectedSize && <Text style={styles.sizeHint}>{selectedSize.hint}</Text>}

      {/* ── Photos ── */}
      <View>
        <Text style={styles.sectionTitle}>
          Photos <Text style={styles.optional}>optional</Text>
        </Text>
        <Text style={styles.sectionHint}>Help the collector see what to expect, up to {MAX_PHOTOS}.</Text>
      </View>
      <Card style={styles.photoCard}>
        <View style={styles.photoRow}>
          {draft.photos.map((uri) => (
            <View key={uri} style={styles.photoBox}>
              <Image source={{ uri }} style={styles.photo} />
              <Pressable
                style={styles.photoRemove}
                onPress={() => removePhoto(uri)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <X size={13} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </View>
          ))}
          {draft.photos.length < MAX_PHOTOS && (
            <>
              <Pressable
                style={({ pressed }) => [styles.photoAdd, pressed && styles.pressed]}
                onPress={() => addPhoto('camera')}
                accessibilityRole="button"
                accessibilityLabel="Take a photo"
              >
                <Camera size={22} color={ui.text} strokeWidth={ICON_STROKE} />
                <Text style={styles.photoAddText}>Camera</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.photoAdd, pressed && styles.pressed]}
                onPress={() => addPhoto('library')}
                accessibilityRole="button"
                accessibilityLabel="Choose from gallery"
              >
                <ImagePlus size={22} color={ui.text} strokeWidth={ICON_STROKE} />
                <Text style={styles.photoAddText}>Gallery</Text>
              </Pressable>
            </>
          )}
        </View>
      </Card>
    </ScrollView>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24, gap: 14 },
    pressed: { opacity: 0.85 },

    sectionTitle: { fontFamily: Fonts.semiBold, fontSize: 16, color: ui.text, letterSpacing: -0.1 },
    sectionHint: { fontFamily: Fonts.regular, fontSize: 12.5, color: ui.textMuted, marginTop: 2 },
    optional: { fontFamily: Fonts.medium, fontSize: 12.5, color: ui.textFaint },

    // Waste type grid: two columns of selectable tiles
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginBottom: 8 },
    sizeHint: {
      fontFamily: Fonts.medium,
      fontSize: 12.5,
      color: ui.accent,
      textAlign: 'center',
      marginTop: -6,
      marginBottom: 8,
    },

    // Photos
    photoCard: { padding: 14 },
    photoRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    photoBox: { width: 88, height: 88, borderRadius: Radius.md, overflow: 'hidden' },
    photo: { width: '100%', height: '100%' },
    photoRemove: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoAdd: {
      width: 88,
      height: 88,
      borderRadius: Radius.md,
      backgroundColor: ui.well,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    photoAddText: { fontFamily: Fonts.medium, fontSize: 12, color: ui.text },
  });
