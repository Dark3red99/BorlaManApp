import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronLeft, Navigation, Phone, type LucideIcon } from 'lucide-react-native';

import { Fonts, Radius, type Palette } from '@borlaman/shared/constants/theme';
import { sizeBand, wasteMeta } from '@borlaman/shared/constants/waste';
import { useTheme, useThemedStyles } from '@borlaman/shared/theme/ThemeContext';
import { Button, Card, IconButton, IconTile, Pill, wasteIcon } from '@borlaman/shared/ui';
import { supabase } from '../services/supabase';
import * as riderService from '../services/riderService';
import type { Job, JobStatus } from '../services/riderService';
import type { RiderScreenProps } from '../types/navigation';
import { stepLabel } from './HomeScreen';

// One claimed pickup, start to finish:
// claimed → "Start trip" → on the way → "I've arrived" → "Take photo &
// collect" (proof photo) → "Complete pickup".

type Step = { next: JobStatus; label: string; icon?: LucideIcon; needsPhoto?: boolean };

const NEXT_STEP: Partial<Record<JobStatus, Step>> = {
  claimed: { next: 'en_route', label: 'Start trip', icon: Navigation },
  en_route: { next: 'arrived', label: "I've arrived" },
  arrived: { next: 'collecting', label: 'Take photo & collect', icon: Camera, needsPhoto: true },
  collecting: { next: 'completed', label: 'Complete pickup' },
};

function openDirections(lat: number, lng: number) {
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  Linking.openURL(url).catch(() => Alert.alert('Could not open maps'));
}

export default function JobScreen({ navigation, route }: RiderScreenProps<'Job'>) {
  const { jobId } = route.params;
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [job, setJob] = useState<Job | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const j = await riderService.getJob(jobId);
      setJob(j);
      if (j) setPhotos(await riderService.getPhotoUrls(j.photos));
    } catch (e) {
      Alert.alert('Could not load the job', e instanceof Error ? e.message : 'Please try again.');
    }
  }, [jobId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Live: the customer may cancel while the rider is on the way.
  useEffect(() => {
    const channel = supabase
      .channel(`job:${jobId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pickup_requests', filter: `id=eq.${jobId}` },
        (payload) => {
          const status = (payload.new as { status: JobStatus }).status;
          if (status === 'cancelled') {
            Alert.alert('Pickup cancelled', 'The customer cancelled this pickup.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          }
          setJob((cur) => (cur ? { ...cur, status } : cur));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, navigation]);

  const doStep = async (step: Step) => {
    if (!job) return;
    let proofUri: string | undefined;
    if (step.needsPhoto) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera needed', 'Allow camera access in Settings to photograph the waste.');
        return;
      }
      const shot = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.5 });
      if (shot.canceled || !shot.assets[0]) return;
      proofUri = shot.assets[0].uri;
    }
    setBusy(true);
    try {
      const updated = await riderService.advance(job.id, step.next, proofUri);
      if (updated.status === 'completed') {
        Alert.alert('Pickup complete 🎉', `You earned GH₵ ${job.earningsGhs.toFixed(2)}. Collect payment from the customer if they're paying cash.`, [
          { text: 'Back to map', onPress: () => navigation.goBack() },
        ]);
      }
      setJob({ ...job, ...updated });
      if (step.next === 'en_route') openDirections(updated.lat ?? 0, updated.lng ?? 0);
    } catch (e) {
      Alert.alert('Could not update', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const releaseJob = () =>
    Alert.alert('Give this pickup back?', 'It goes back on the map for other riders.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Give back',
        style: 'destructive',
        onPress: async () => {
          try {
            await riderService.release(jobId);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Could not release', e instanceof Error ? e.message : 'Please try again.');
          }
        },
      },
    ]);

  if (!job) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={ui.accent} />
      </View>
    );
  }

  const meta = wasteMeta(job.waste_type);
  const band = sizeBand(job.volume_kg);
  const step = NEXT_STEP[job.status];
  const lat = job.lat ?? 0;
  const lng = job.lng ?? 0;
  const when =
    job.mode === 'asap'
      ? 'As soon as possible'
      : new Date(job.scheduled_for).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel="Back to map" onPress={() => navigation.goBack()} />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Pickup</Text>
          <Text style={styles.headerSub}>{stepLabel(job.status)}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Exact location */}
        <View style={styles.mapWrap}>
          <MapView
            style={StyleSheet.absoluteFill}
            region={{ latitude: lat, longitude: lng, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
            scrollEnabled={false}
            zoomEnabled={false}
            userInterfaceStyle="dark"
            showsUserLocation
          >
            <Marker coordinate={{ latitude: lat, longitude: lng }} pinColor={meta.color} />
          </MapView>
        </View>

        {/* Customer */}
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.label}>Customer</Text>
              <Text style={styles.value}>{job.customerName}</Text>
            </View>
            {job.customerPhone && (
              <IconButton icon={Phone} variant="accent" accessibilityLabel="Call customer" onPress={() => Linking.openURL(`tel:${job.customerPhone}`)} />
            )}
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{job.address_text}</Text>
            </View>
            <IconButton icon={Navigation} accessibilityLabel="Directions" onPress={() => openDirections(lat, lng)} />
          </View>
        </Card>

        {/* Waste */}
        <Card style={styles.card}>
          <View style={styles.row}>
            <IconTile icon={wasteIcon(job.waste_type)} bg={soft(meta.color, meta.colorSoft)} fg={meta.color} size={44} />
            <View style={styles.flex}>
              <Text style={styles.value}>{meta.label} · {band.label}</Text>
              <Text style={styles.label}>{band.hint}</Text>
            </View>
            <Pill label={`GH₵ ${job.earningsGhs.toFixed(2)}`} color={ui.accent} bg={ui.accentSoft} />
          </View>
          <View style={styles.divider} />
          <Text style={styles.label}>When</Text>
          <Text style={styles.value}>{when}</Text>
          {photos.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.label}>Customer's photos</Text>
              <ScrollView horizontal contentContainerStyle={styles.photos} showsHorizontalScrollIndicator={false}>
                {photos.map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.photo} />
                ))}
              </ScrollView>
            </>
          )}
        </Card>

        <Text style={styles.payNote}>
          The customer pays GH₵ {Number(job.price_ghs).toFixed(2)}. You keep GH₵ {job.earningsGhs.toFixed(2)} after the BorlaMan fee.
        </Text>
      </ScrollView>

      {/* Next step */}
      <View style={styles.footer}>
        {step ? (
          <Button label={busy ? 'Updating…' : step.label} icon={step.icon} iconLeft onPress={() => doStep(step)} disabled={busy} />
        ) : (
          <Button label="Back to map" variant="secondary" onPress={() => navigation.goBack()} />
        )}
        {job.status === 'claimed' && (
          <Button label="Give pickup back" variant="secondary" size="sm" onPress={releaseJob} />
        )}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: ui.bg },
    center: { alignItems: 'center', justifyContent: 'center' },
    flex: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 8 },
    headerText: { flex: 1, alignItems: 'center' },
    headerSpacer: { width: 44 },
    headerTitle: { fontFamily: Fonts.bold, fontSize: 18, color: ui.text },
    headerSub: { fontFamily: Fonts.medium, fontSize: 12.5, color: ui.accent },
    scroll: { padding: 20, gap: 14, paddingBottom: 24 },
    mapWrap: { height: 170, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: ui.surface },
    card: { padding: 16, gap: 4 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    divider: { height: 1, backgroundColor: ui.hairline, marginVertical: 10 },
    label: { fontFamily: Fonts.regular, fontSize: 12, color: ui.textMuted },
    value: { fontFamily: Fonts.semiBold, fontSize: 15, color: ui.text, marginTop: 1 },
    photos: { gap: 8, marginTop: 8 },
    photo: { width: 84, height: 84, borderRadius: Radius.sm },
    payNote: { fontFamily: Fonts.regular, fontSize: 12.5, color: ui.textFaint, textAlign: 'center' },
    footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, gap: 10 },
  });
