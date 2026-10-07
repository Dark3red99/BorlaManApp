import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Check, IdCard, Bike, UserRound, type LucideIcon } from 'lucide-react-native';

import { Fonts, ICON_STROKE, type Palette } from '@borlaman/shared/constants/theme';
import { WASTE_TYPES } from '@borlaman/shared/constants/waste';
import type { WasteType } from '@borlaman/shared/types/models';
import { useTheme, useThemedStyles } from '@borlaman/shared/theme/ThemeContext';
import { Button, Card, IconTile, Pills, Segmented } from '@borlaman/shared/ui';
import Field from '../components/Field';
import { useRider } from '../context/RiderContext';
import * as riderService from '../services/riderService';
import type { DocType } from '../services/riderService';

// New riders tell us about their tricycle and upload three photos. A
// BorlaMan admin reviews them and approves the account before the rider
// can go online.

const DOCS: { type: DocType; title: string; hint: string; icon: LucideIcon; selfie?: boolean }[] = [
  { type: 'ghana_card', title: 'Ghana Card', hint: 'Front of the card, all text readable', icon: IdCard },
  { type: 'selfie', title: 'Selfie', hint: 'Your face, clear and well lit', icon: UserRound, selfie: true },
  { type: 'tricycle_photo', title: 'Your tricycle', hint: 'Whole tricycle with the plate number visible', icon: Bike },
];

// What an empty aboboyaa typically carries, in kg.
const CAPACITIES = [
  { key: 200, label: 'Small', sub: '~200 kg' },
  { key: 300, label: 'Standard', sub: '~300 kg' },
  { key: 500, label: 'Large', sub: '~500 kg' },
];

export default function OnboardingScreen() {
  const { ui } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { profile, refresh, signOut } = useRider();

  const [plate, setPlate] = useState('');
  const [capacity, setCapacity] = useState(300);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>(['household', 'recyclables', 'organic', 'mixed']);
  const [momo, setMomo] = useState(profile?.phone?.replace('+233', '0') ?? '');
  const [uploaded, setUploaded] = useState<DocType[]>([]);
  const [uploading, setUploading] = useState<DocType | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    riderService.getMyDocumentTypes().then(setUploaded).catch(() => {});
  }, []);

  const toggleType = (t: WasteType) =>
    setWasteTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const takePhoto = async (doc: (typeof DOCS)[number]) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera needed', 'Allow camera access in Settings to photograph your documents.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.6,
      cameraType: doc.selfie ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploading(doc.type);
    try {
      await riderService.uploadDocument(doc.type, result.assets[0].uri);
      setUploaded((cur) => [...new Set([...cur, doc.type])]);
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const missing = (() => {
    if (plate.trim().length < 5) return 'Enter your tricycle plate number.';
    if (wasteTypes.length === 0) return 'Choose at least one waste type you collect.';
    if (momo.replace(/\D/g, '').length < 9) return 'Enter your Mobile Money number.';
    const doc = DOCS.find((d) => !uploaded.includes(d.type));
    if (doc) return `Add your ${doc.title.toLowerCase()} photo.`;
    return null;
  })();

  const submit = async () => {
    if (missing) {
      Alert.alert('Almost there', missing);
      return;
    }
    setSaving(true);
    try {
      await riderService.saveRiderDetails({ vehiclePlate: plate, capacityKg: capacity, wasteTypes, payoutMomo: momo });
      await refresh(); // moves on to "waiting for approval"
    } catch (e) {
      setSaving(false);
      Alert.alert('Could not submit', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.title}>Set up your rider account</Text>
          <Text style={styles.subtitle}>
            Hi {profile?.full_name.split(' ')[0] || 'there'}! We check every rider before they start, so customers know
            who's coming.
          </Text>
        </View>

        {/* ── Tricycle ── */}
        <Text style={styles.section}>Your tricycle</Text>
        <Field label="Plate number" value={plate} onChangeText={setPlate} placeholder="e.g. GR 4521-23" autoCapitalize="characters" />
        <Text style={styles.label}>How much can it carry?</Text>
        <Segmented options={CAPACITIES} value={capacity} onChange={setCapacity} />

        {/* ── Waste types ── */}
        <Text style={styles.section}>Waste you collect</Text>
        <Text style={styles.hint}>You'll only see pickups of these types.</Text>
        <Pills
          multi
          options={WASTE_TYPES.map((w) => ({ key: w.type, label: w.label }))}
          isSelected={(t) => wasteTypes.includes(t)}
          onPress={toggleType}
        />

        {/* ── Payout ── */}
        <Text style={styles.section}>Getting paid</Text>
        <Field
          label="Mobile Money number"
          value={momo}
          onChangeText={setMomo}
          keyboardType="phone-pad"
          placeholder="024 123 4567"
          hint="Your earnings are sent here."
        />

        {/* ── Documents ── */}
        <Text style={styles.section}>Verification photos</Text>
        <Card style={styles.docs}>
          {DOCS.map((doc, i) => {
            const done = uploaded.includes(doc.type);
            const busy = uploading === doc.type;
            return (
              <Pressable
                key={doc.type}
                onPress={() => takePhoto(doc)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={`${doc.title}${done ? ', added' : ''}`}
                style={({ pressed }) => [styles.doc, i < DOCS.length - 1 && styles.docDivider, pressed && styles.pressed]}
              >
                <IconTile icon={doc.icon} tone={done ? 'accent' : 'neutral'} size={42} />
                <View style={styles.docText}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Text style={styles.docHint}>{done ? 'Added. Tap to retake' : doc.hint}</Text>
                </View>
                {busy ? (
                  <ActivityIndicator color={ui.accent} />
                ) : done ? (
                  <View style={styles.done}>
                    <Check size={14} color={ui.onAccent} strokeWidth={3} />
                  </View>
                ) : (
                  <Camera size={20} color={ui.textMuted} strokeWidth={ICON_STROKE} />
                )}
              </Pressable>
            );
          })}
        </Card>

        <Button label={saving ? 'Submitting…' : 'Submit for review'} onPress={submit} disabled={saving} />
        <Button label="Sign out" variant="secondary" onPress={signOut} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: ui.bg },
    scroll: { padding: 20, gap: 14, paddingBottom: 40 },
    pressed: { opacity: 0.8 },
    title: { fontFamily: Fonts.extraBold, fontSize: 24, color: ui.text },
    subtitle: { fontFamily: Fonts.regular, fontSize: 14, color: ui.textMuted, marginTop: 6, lineHeight: 20 },
    section: { fontFamily: Fonts.bold, fontSize: 16, color: ui.text, marginTop: 10 },
    label: { fontFamily: Fonts.semiBold, fontSize: 13, color: ui.textMuted },
    hint: { fontFamily: Fonts.regular, fontSize: 12.5, color: ui.textFaint, marginTop: -8 },
    docs: { padding: 0 },
    doc: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    docDivider: { borderBottomWidth: 1, borderBottomColor: ui.hairline },
    docText: { flex: 1 },
    docTitle: { fontFamily: Fonts.semiBold, fontSize: 14.5, color: ui.text },
    docHint: { fontFamily: Fonts.regular, fontSize: 12, color: ui.textMuted, marginTop: 2 },
    done: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: ui.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
