import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { ChevronRight, LogOut, MapPin, Power, Zap } from 'lucide-react-native';

import { Elevation, Fonts, ICON_STROKE, Radius, type Palette } from '@borlaman/shared/constants/theme';
import { sizeBand, wasteMeta } from '@borlaman/shared/constants/waste';
import { useTheme, useThemedStyles } from '@borlaman/shared/theme/ThemeContext';
import { Button, IconButton, IconTile, wasteIcon } from '@borlaman/shared/ui';
import { useRider } from '../context/RiderContext';
import * as riderService from '../services/riderService';
import type { Job, OpenBin } from '../services/riderService';
import type { RiderScreenProps } from '../types/navigation';

// The rider's home: a map of waiting pickups ("bins") near them. Going
// online starts sharing location and loading bins; tapping a bin shows what
// it is and what it pays, and claiming it opens the job.

const ACCRA: Region = { latitude: 5.6037, longitude: -0.187, latitudeDelta: 0.06, longitudeDelta: 0.06 };
const BIN_REFRESH_MS = 15_000;

function whenText(bin: Pick<OpenBin, 'mode' | 'scheduledFor'>): string {
  if (bin.mode === 'asap') return 'Now';
  const at = new Date(bin.scheduledFor);
  const today = new Date();
  const sameDay = at.toDateString() === today.toDateString();
  const time = at.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
  return sameDay ? `Today ${time}` : `${at.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })} ${time}`;
}

function distanceText(m: number): string {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

export default function HomeScreen({ navigation }: RiderScreenProps<'Home'>) {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { rider, profile, setRider, signOut } = useRider();

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [bins, setBins] = useState<OpenBin[]>([]);
  const [selected, setSelected] = useState<OpenBin | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [earnings, setEarnings] = useState({ jobs: 0, ghs: 0 });
  const [switching, setSwitching] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const mapRef = useRef<MapView>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const coordsRef = useRef(coords);
  coordsRef.current = coords;

  const online = !!rider?.is_online;

  // ── Location permission + first fix ────────────────────────────
  useEffect(() => {
    (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        Alert.alert('Location needed', 'Allow location in Settings so you can see pickups near you and go online.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoords(c);
      mapRef.current?.animateToRegion({ ...c, latitudeDelta: 0.04, longitudeDelta: 0.04 }, 600);
    })().catch(() => {});
  }, []);

  // ── While online: share location, refresh bins ─────────────────
  const loadBins = useCallback(async () => {
    const c = coordsRef.current;
    if (!c) return;
    try {
      setBins(await riderService.getOpenBins(c.latitude, c.longitude));
    } catch {
      // keep the last list; the next tick retries
    }
  }, []);

  useEffect(() => {
    if (!online) {
      setBins([]);
      setSelected(null);
      return;
    }
    let cancelled = false;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 30, timeInterval: 10_000 },
      (pos) => {
        const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setCoords(c);
        riderService.sendLocation(c.latitude, c.longitude).catch(() => {});
      },
    ).then((sub) => {
      if (cancelled) sub.remove();
      else watchRef.current = sub;
    });
    loadBins();
    const timer = setInterval(loadBins, BIN_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, [online, loadBins]);

  // ── Jobs + earnings whenever the screen is shown ───────────────
  useFocusEffect(
    useCallback(() => {
      riderService.getActiveJobs().then(setJobs).catch(() => {});
      riderService.getTodayEarnings().then(setEarnings).catch(() => {});
      riderService.loadMe().then((me) => me?.rider && setRider(me.rider)).catch(() => {});
      if (online) loadBins();
    }, [online, loadBins, setRider]),
  );

  const toggleOnline = async () => {
    if (!online && !coords) {
      Alert.alert('Finding your location', 'Wait a moment for GPS, or allow location in Settings.');
      return;
    }
    setSwitching(true);
    try {
      setRider(await riderService.setOnline(!online, coords ?? undefined));
    } catch (e) {
      Alert.alert('Could not change status', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSwitching(false);
    }
  };

  const claim = async (bin: OpenBin) => {
    setClaiming(true);
    try {
      await riderService.claim(bin.id);
      setSelected(null);
      setBins((cur) => cur.filter((b) => b.id !== bin.id));
      navigation.navigate('Job', { jobId: bin.id });
    } catch (e) {
      Alert.alert('Not available', e instanceof Error ? e.message : 'Please try another pickup.');
      loadBins();
    } finally {
      setClaiming(false);
    }
  };

  const emptied = async () => {
    try {
      setRider(await riderService.markEmptied());
    } catch (e) {
      Alert.alert('Could not update', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const confirmSignOut = () =>
    Alert.alert('Sign out?', online ? "You'll go offline and stop getting pickups." : undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);

  const load = rider?.load_kg ?? 0;
  const capacity = rider?.capacity_kg ?? 300;
  const loadPct = Math.min(1, load / Math.max(capacity, 1));

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={ACCRA}
        showsUserLocation
        showsMyLocationButton={false}
        userInterfaceStyle="dark"
        onPress={() => setSelected(null)}
      >
        {bins.map((bin) => {
          const meta = wasteMeta(bin.wasteType);
          const Icon = wasteIcon(bin.wasteType);
          const active = selected?.id === bin.id;
          return (
            <Marker
              key={bin.id}
              coordinate={{ latitude: bin.latitude, longitude: bin.longitude }}
              onPress={(e) => {
                e.stopPropagation();
                setSelected(bin);
              }}
              tracksViewChanges={false}
            >
              <View style={[styles.bin, { backgroundColor: meta.color }, active && styles.binActive]}>
                <Icon size={16} color="#FFFFFF" strokeWidth={2.25} />
                {bin.mode === 'asap' && <View style={styles.binNow} />}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* ── Top bar ── */}
      <SafeAreaView edges={['top']} style={styles.top} pointerEvents="box-none">
        <View style={styles.topRow}>
          <View style={styles.earnCard}>
            <Text style={styles.earnLabel}>Today</Text>
            <Text style={styles.earnValue}>GH₵ {earnings.ghs.toFixed(2)}</Text>
            <Text style={styles.earnSub}>{earnings.jobs} {earnings.jobs === 1 ? 'pickup' : 'pickups'}</Text>
          </View>
          <View style={styles.topActions}>
            {coords && (
              <IconButton
                icon={MapPin}
                accessibilityLabel="Center on me"
                onPress={() => mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.03, longitudeDelta: 0.03 }, 500)}
              />
            )}
            <IconButton icon={LogOut} accessibilityLabel="Sign out" onPress={confirmSignOut} />
          </View>
        </View>
        {online && (
          <View style={styles.binCount}>
            <Text style={styles.binCountText}>
              {bins.length === 0 ? 'No pickups near you right now' : `${bins.length} ${bins.length === 1 ? 'pickup' : 'pickups'} near you`}
            </Text>
          </View>
        )}
      </SafeAreaView>

      {/* ── Bottom panel ── */}
      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        {selected ? (
          <BinSheet bin={selected} claiming={claiming} onClaim={() => claim(selected)} onClose={() => setSelected(null)} />
        ) : (
          <View style={styles.panel}>
            {/* Active jobs */}
            {jobs.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jobsRow}>
                {jobs.map((job) => {
                  const meta = wasteMeta(job.waste_type);
                  return (
                    <Pressable
                      key={job.id}
                      onPress={() => navigation.navigate('Job', { jobId: job.id })}
                      style={({ pressed }) => [styles.jobCard, pressed && styles.pressed]}
                    >
                      <IconTile icon={wasteIcon(job.waste_type)} bg={soft(meta.color, meta.colorSoft)} fg={meta.color} size={36} />
                      <View style={styles.flex}>
                        <Text style={styles.jobTitle} numberOfLines={1}>{job.customerName}</Text>
                        <Text style={styles.jobSub} numberOfLines={1}>{stepLabel(job.status)}</Text>
                      </View>
                      <ChevronRight size={18} color={ui.textMuted} strokeWidth={ICON_STROKE} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {/* Tricycle load */}
            <View style={styles.loadRow}>
              <View style={styles.flex}>
                <Text style={styles.loadLabel}>Tricycle load · {load} / {capacity} kg</Text>
                <View style={styles.loadTrack}>
                  <View style={[styles.loadFill, { width: `${loadPct * 100}%` }, loadPct > 0.85 && { backgroundColor: ui.amber }]} />
                </View>
              </View>
              {load > 0 && (
                <Pressable onPress={emptied} hitSlop={8} accessibilityRole="button">
                  <Text style={styles.emptied}>Emptied</Text>
                </Pressable>
              )}
            </View>

            {/* Online switch */}
            <Pressable
              onPress={toggleOnline}
              disabled={switching}
              accessibilityRole="switch"
              accessibilityState={{ checked: online }}
              style={({ pressed }) => [styles.power, online ? styles.powerOn : styles.powerOff, pressed && styles.pressed]}
            >
              {switching ? (
                <ActivityIndicator color={online ? ui.text : ui.onAccent} />
              ) : (
                <>
                  <Power size={20} color={online ? ui.text : ui.onAccent} strokeWidth={2.25} />
                  <Text style={[styles.powerText, online && { color: ui.text }]}>
                    {online ? 'Go offline' : `Go online${profile ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
                  </Text>
                </>
              )}
            </Pressable>
            {!online && <Text style={styles.offlineHint}>You're offline. Go online to see pickups near you.</Text>}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

export function stepLabel(status: riderService.JobStatus): string {
  switch (status) {
    case 'claimed': return 'Claimed · start when ready';
    case 'en_route': return 'On the way';
    case 'arrived': return 'At the pickup';
    case 'collecting': return 'Collecting';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled by customer';
    default: return 'Waiting';
  }
}

function BinSheet({
  bin,
  claiming,
  onClaim,
  onClose,
}: {
  bin: OpenBin;
  claiming: boolean;
  onClaim: () => void;
  onClose: () => void;
}) {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const meta = wasteMeta(bin.wasteType);
  const band = sizeBand(bin.volumeKg);
  return (
    <View style={styles.panel}>
      <View style={styles.sheetHead}>
        <IconTile icon={wasteIcon(bin.wasteType)} bg={soft(meta.color, meta.colorSoft)} fg={meta.color} size={48} />
        <View style={styles.flex}>
          <Text style={styles.sheetTitle}>{meta.label} · {band.label}</Text>
          <Text style={styles.sheetSub}>{band.hint}</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>
      <View style={styles.facts}>
        <Fact label="You earn" value={`GH₵ ${bin.earningsGhs.toFixed(2)}`} strong />
        <Fact label="Distance" value={`~${distanceText(bin.distanceM)}`} />
        <Fact label="When" value={whenText(bin)} highlight={bin.mode === 'asap'} />
      </View>
      <Text style={styles.privacy}>
        The exact address and customer details appear after you claim.
      </Text>
      <Button label={claiming ? 'Claiming…' : 'Claim pickup'} icon={bin.mode === 'asap' ? Zap : undefined} iconLeft onPress={onClaim} disabled={claiming} />
    </View>
  );
}

function Fact({ label, value, strong, highlight }: { label: string; value: string; strong?: boolean; highlight?: boolean }) {
  const { ui } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={[styles.factValue, strong && { color: ui.accent }, highlight && { color: ui.amber }]}>{value}</Text>
    </View>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: ui.bg },
    flex: { flex: 1 },
    pressed: { opacity: 0.85 },

    bin: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    binActive: { transform: [{ scale: 1.25 }] },
    binNow: {
      position: 'absolute',
      top: -3,
      right: -3,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#F59E0B',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },

    top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, gap: 10 },
    topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 8 },
    topActions: { flexDirection: 'row', gap: 10 },
    earnCard: {
      backgroundColor: ui.surface,
      borderRadius: Radius.lg,
      paddingHorizontal: 16,
      paddingVertical: 10,
      ...Elevation.float,
    },
    earnLabel: { fontFamily: Fonts.medium, fontSize: 11.5, color: ui.textMuted },
    earnValue: { fontFamily: Fonts.extraBold, fontSize: 20, color: ui.text },
    earnSub: { fontFamily: Fonts.regular, fontSize: 11.5, color: ui.textFaint },
    binCount: {
      alignSelf: 'center',
      backgroundColor: ui.surface,
      borderRadius: Radius.pill,
      paddingHorizontal: 14,
      paddingVertical: 8,
      ...Elevation.card,
    },
    binCountText: { fontFamily: Fonts.semiBold, fontSize: 12.5, color: ui.text },

    bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    panel: {
      backgroundColor: ui.surface,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: 16,
      paddingBottom: 12,
      gap: 14,
      ...Elevation.float,
    },
    jobsRow: { gap: 10 },
    jobCard: {
      width: 240,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: ui.well,
      borderRadius: Radius.md,
      padding: 10,
    },
    jobTitle: { fontFamily: Fonts.semiBold, fontSize: 13.5, color: ui.text },
    jobSub: { fontFamily: Fonts.regular, fontSize: 12, color: ui.accent },

    loadRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    loadLabel: { fontFamily: Fonts.medium, fontSize: 12.5, color: ui.textMuted, marginBottom: 6 },
    loadTrack: { height: 8, borderRadius: 4, backgroundColor: ui.wellStrong, overflow: 'hidden' },
    loadFill: { height: 8, borderRadius: 4, backgroundColor: ui.accent },
    emptied: { fontFamily: Fonts.semiBold, fontSize: 13, color: ui.accent },

    power: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      height: 56,
      borderRadius: Radius.pill,
    },
    powerOff: { backgroundColor: ui.accent, ...Elevation.accent },
    powerOn: { backgroundColor: ui.wellStrong },
    powerText: { fontFamily: Fonts.bold, fontSize: 16, color: ui.onAccent },
    offlineHint: { fontFamily: Fonts.regular, fontSize: 12, color: ui.textFaint, textAlign: 'center' },

    sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sheetTitle: { fontFamily: Fonts.bold, fontSize: 17, color: ui.text },
    sheetSub: { fontFamily: Fonts.regular, fontSize: 12.5, color: ui.textMuted, marginTop: 2 },
    close: { fontFamily: Fonts.semiBold, fontSize: 13, color: ui.textMuted },
    facts: { flexDirection: 'row', gap: 10 },
    fact: { flex: 1, backgroundColor: ui.well, borderRadius: Radius.md, padding: 10 },
    factLabel: { fontFamily: Fonts.regular, fontSize: 11.5, color: ui.textMuted },
    factValue: { fontFamily: Fonts.bold, fontSize: 14.5, color: ui.text, marginTop: 2 },
    privacy: { fontFamily: Fonts.regular, fontSize: 12, color: ui.textFaint },
  });
