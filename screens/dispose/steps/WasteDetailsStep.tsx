import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { WASTE_TYPES, SIZE_BANDS as SIZES } from '../../../constants/waste';
import type { PickupDraft } from '../RequestPickupScreen';

const PRIMARY = '#059669';
const WHITE   = '#FFFFFF';
const TEXT    = '#0F172A';
const MUTED   = '#64748B';
const BORDER  = '#DCE8E1';

const MAX_PHOTOS = 3;

type Props = {
  draft: PickupDraft;
  onChange: (patch: Partial<PickupDraft>) => void;
};

export default function WasteDetailsStep({ draft, onChange }: Props) {
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

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* ── Waste type ── */}
      <Text style={styles.sectionLabel}>What are we collecting?</Text>
      <View style={styles.typeGrid}>
        {WASTE_TYPES.map((meta) => {
          const selected = draft.wasteType === meta.type;
          return (
            <TouchableOpacity
              key={meta.type}
              style={[styles.typeCard, selected && { borderColor: meta.color, backgroundColor: meta.colorSoft }]}
              onPress={() => onChange({ wasteType: meta.type })}
              activeOpacity={0.8}
            >
              <View style={[styles.typeIconBox, { backgroundColor: selected ? meta.color : meta.colorSoft }]}>
                <MaterialCommunityIcons
                  name={meta.icon as any}
                  size={22}
                  color={selected ? WHITE : meta.color}
                />
              </View>
              <Text style={styles.typeLabel}>{meta.label}</Text>
              <Text style={styles.typeDesc} numberOfLines={2}>{meta.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Quantity ── */}
      <Text style={styles.sectionLabel}>How much is there?</Text>
      <View style={styles.sizeRow}>
        {SIZES.map((size) => {
          const selected = draft.volumeKg === size.kg;
          return (
            <TouchableOpacity
              key={size.kg}
              style={[styles.sizeCard, selected && styles.sizeCardSelected]}
              onPress={() => onChange({ volumeKg: size.kg })}
              activeOpacity={0.8}
            >
              <Text style={[styles.sizeLabel, selected && { color: PRIMARY }]}>{size.label}</Text>
              <Text style={styles.sizeKg}>~{size.kg} kg</Text>
              <Text style={styles.sizeHint}>{size.hint}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Photos ── */}
      <Text style={styles.sectionLabel}>Photos (optional)</Text>
      <Text style={styles.sectionHint}>Help the collector see what to expect — up to {MAX_PHOTOS}.</Text>
      <View style={styles.photoRow}>
        {draft.photos.map((uri) => (
          <View key={uri} style={styles.photoBox}>
            <Image source={{ uri }} style={styles.photo} />
            <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(uri)} activeOpacity={0.8}>
              <Ionicons name="close" size={14} color={WHITE} />
            </TouchableOpacity>
          </View>
        ))}
        {draft.photos.length < MAX_PHOTOS && (
          <>
            <TouchableOpacity style={styles.photoAdd} onPress={() => addPhoto('camera')} activeOpacity={0.7}>
              <Ionicons name="camera-outline" size={22} color={PRIMARY} />
              <Text style={styles.photoAddText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoAdd} onPress={() => addPhoto('library')} activeOpacity={0.7}>
              <Ionicons name="images-outline" size={22} color={PRIMARY} />
              <Text style={styles.photoAddText}>Gallery</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: TEXT,
    marginBottom: 10,
    marginTop: 8,
  },
  sectionHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: MUTED,
    marginTop: -6,
    marginBottom: 10,
  },

  // ── Waste type grid ──
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  typeCard: {
    width: '31%',
    flexGrow: 1,
    backgroundColor: WHITE,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 12,
    alignItems: 'center',
  },
  typeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: TEXT,
  },
  typeDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9.5,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 13,
    marginTop: 2,
  },

  // ── Sizes ──
  sizeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  sizeCard: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sizeCardSelected: {
    borderColor: PRIMARY,
    backgroundColor: '#ECFDF5',
  },
  sizeLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: TEXT,
  },
  sizeKg: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: TEXT,
    marginTop: 2,
  },
  sizeHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 9.5,
    color: MUTED,
    marginTop: 2,
  },

  // ── Photos ──
  photoRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  photoBox: {
    width: 84,
    height: 84,
    borderRadius: 14,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15,23,42,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAdd: {
    width: 84,
    height: 84,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderStyle: 'dashed',
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: PRIMARY,
  },
});
