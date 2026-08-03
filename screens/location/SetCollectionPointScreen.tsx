import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  Map as MapLibreMap,
  type CameraRef,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../context/AuthContext';
import type { CollectionPoint, GeoPoint } from '../../types/models';
import { toLngLat, fromLngLat } from '../../utils/geo';
import { ACCRA_FALLBACK, MAP_STYLE_URL, isMapTilerConfigured } from '../../constants/map';
import {
  geocoder,
  digitalAddressResolver,
  isDigitalAddress,
  normalizeDigitalAddress,
  type GeocodeResult,
} from '../../services/geocodingService';
import { getCollectionPoint, saveCollectionPoint } from '../../services/locationService';

const PRIMARY = '#059669';
const PRIMARY_SOFT = '#ECFDF5';
const BG = '#F3F8F5';
const WHITE = '#FFFFFF';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const BORDER = '#DCE8E1';
const AMBER_BG = '#FEF3C7';
const AMBER_TEXT = '#92400E';

const FONT_REGULAR = 'Poppins_400Regular';
const FONT_MEDIUM = 'Poppins_500Medium';
const FONT_SEMIBOLD = 'Poppins_600SemiBold';
const FONT_EXTRABOLD = 'Poppins_800ExtraBold';

const PIN_ZOOM = 16;
const SEARCH_ZOOM = 17;

export default function SetCollectionPointScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const cameraRef = useRef<CameraRef>(null);

  // The map centers once, on load: on the saved point, else on a fresh GPS
  // fix, else on the Accra fallback. Null until that decision is made.
  const [initialCenter, setInitialCenter] = useState<GeoPoint | null>(null);
  const [existing, setExisting] = useState<CollectionPoint | null>(null);

  // Confirmed point candidate = wherever the centered pin settled last.
  const [pin, setPin] = useState<GeoPoint | null>(null);
  const [source, setSource] = useState<CollectionPoint['source']>('pin');
  const [gpsText, setGpsText] = useState<string | undefined>(undefined);

  const [label, setLabel] = useState('');
  const labelEdited = useRef(false);
  const [resolvingLabel, setResolvingLabel] = useState(false);
  const reverseSeq = useRef(0);
  const reverseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchSeq = useRef(0);

  const [denied, setDenied] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Saved point wins — no GPS re-detect on later opens.
      const saved = user ? await getCollectionPoint(user.id) : null;
      if (cancelled) return;
      if (saved) {
        setExisting(saved);
        setPin(saved.point);
        setLabel(saved.label);
        setGpsText(saved.gpsText);
        setSource(saved.source);
        setInitialCenter(saved.point);
        return;
      }
      // First setup: permission first, then auto-detect.
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (!perm.granted) {
          setDenied(true);
          setInitialCenter(ACCRA_FALLBACK);
          setPin(ACCRA_FALLBACK);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        const point = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setPin(point);
        setSource('gps');
        setInitialCenter(point);
        fillLabelFrom(point);
      } catch {
        if (cancelled) return;
        setDenied(true);
        setInitialCenter(ACCRA_FALLBACK);
        setPin(ACCRA_FALLBACK);
      }
    })();
    return () => {
      cancelled = true;
      if (reverseTimer.current) clearTimeout(reverseTimer.current);
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fillLabelFrom = (point: GeoPoint) => {
    if (labelEdited.current) return;
    const seq = ++reverseSeq.current;
    setResolvingLabel(true);
    geocoder
      .reverse(point)
      .then((name) => {
        if (seq !== reverseSeq.current || labelEdited.current) return;
        if (name) setLabel(name);
      })
      .finally(() => {
        if (seq === reverseSeq.current) setResolvingLabel(false);
      });
  };

  const onRegionDidChange = (e: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    const { center, userInteraction } = e.nativeEvent;
    const point = fromLngLat(center as [number, number]);
    setPin(point);
    // Only a hand-panned settle re-labels the point; programmatic moves
    // (search / GPS fly-in) already set their own label.
    if (!userInteraction) return;
    setSource('pin'); // fine-tuning keeps gpsText — the code still names this spot
    if (reverseTimer.current) clearTimeout(reverseTimer.current);
    reverseTimer.current = setTimeout(() => fillLabelFrom(point), 300);
  };

  const flyTo = (point: GeoPoint, zoom: number) => {
    cameraRef.current?.flyTo({ center: toLngLat(point), zoom, duration: 800 });
  };

  const onQueryChange = (text: string) => {
    setQuery(text);
    setNotice(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (isDigitalAddress(text)) {
      // GhanaPostGPS code — offer it as the single result, no geocoder call.
      setResults([
        {
          point: pin ?? ACCRA_FALLBACK,
          label: normalizeDigitalAddress(text),
          detail: `Use digital address ${normalizeDigitalAddress(text)}`,
          kind: 'digital-address',
        },
      ]);
      return;
    }
    if (text.trim().length < 3) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      const seq = ++searchSeq.current;
      setSearching(true);
      const found = await geocoder.search(text, pin ?? ACCRA_FALLBACK);
      if (seq !== searchSeq.current) return;
      setSearching(false);
      setResults(found);
    }, 400);
  };

  const onPickResult = async (result: GeocodeResult) => {
    Keyboard.dismiss();
    setResults([]);
    if (result.kind === 'digital-address') {
      const code = result.label;
      setGpsText(code);
      setSource('digital-address');
      const resolved = await digitalAddressResolver.resolve(code);
      if (resolved) {
        setQuery(code);
        labelEdited.current = false;
        setLabel(resolved.label || code);
        flyTo(resolved.point, SEARCH_ZOOM);
      } else {
        setQuery(code);
        if (!labelEdited.current && !label) setLabel(code);
        setNotice(
          `${code} saved with your point. Address lookup isn't live yet — pan the map so the pin sits on your gate.`,
        );
      }
      return;
    }
    setQuery(result.detail);
    setGpsText(undefined);
    setSource('search');
    labelEdited.current = false;
    setLabel(result.label || result.detail);
    flyTo(result.point, SEARCH_ZOOM);
  };

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setDenied(true);
        return;
      }
      setDenied(false);
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const point = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setPin(point);
      setSource('gps');
      setGpsText(undefined);
      labelEdited.current = false;
      fillLabelFrom(point);
      flyTo(point, PIN_ZOOM);
    } catch {
      setDenied(true);
    } finally {
      setLocating(false);
    }
  };

  const onConfirm = async () => {
    if (!user || !pin) return;
    setSaving(true);
    try {
      await saveCollectionPoint(user.id, {
        point: pin,
        label: label.trim() || `${pin.latitude.toFixed(5)}, ${pin.longitude.toFixed(5)}`,
        gpsText,
        source,
      });
      Alert.alert(
        'Collection point saved',
        'Pickups will now come to this exact spot. You can change it any time from your profile.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch {
      Alert.alert('Save failed', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.title}>{existing ? 'Edit collection point' : 'Set collection point'}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={MUTED} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search address or GhanaPostGPS (GA-183-8164)"
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={onQueryChange}
            autoCorrect={false}
            returnKeyType="search"
          />
          {searching && <ActivityIndicator size="small" color={PRIMARY} />}
        </View>
        {results.length > 0 && (
          <View style={styles.resultsCard}>
            {results.map((r, idx) => (
              <TouchableOpacity
                key={`${r.detail}-${idx}`}
                style={[styles.resultRow, idx < results.length - 1 && styles.resultRowBorder]}
                onPress={() => onPickResult(r)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={r.kind === 'digital-address' ? 'keypad-outline' : 'location-outline'}
                  size={16}
                  color={PRIMARY}
                />
                <Text style={styles.resultText} numberOfLines={2}>
                  {r.detail}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {!isMapTilerConfigured() && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Map tiles and search need a MapTiler key — set EXPO_PUBLIC_MAPTILER_KEY in .env.local.
          </Text>
        </View>
      )}
      {denied && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Location unavailable — search or drag the map to your spot instead.
          </Text>
        </View>
      )}
      {notice && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{notice}</Text>
        </View>
      )}

      {/* Map with fixed center pin */}
      <View style={styles.mapWrap}>
        {initialCenter ? (
          <MapLibreMap
            style={StyleSheet.absoluteFill}
            mapStyle={MAP_STYLE_URL}
            onRegionDidChange={onRegionDidChange}
            onPress={() => Keyboard.dismiss()}
          >
            <Camera
              ref={cameraRef}
              initialViewState={{ center: toLngLat(initialCenter), zoom: PIN_ZOOM }}
            />
          </MapLibreMap>
        ) : (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.mapLoadingText}>Finding your location…</Text>
          </View>
        )}

        {initialCenter && (
          <>
            <View pointerEvents="none" style={styles.pinWrap}>
              <MaterialCommunityIcons name="map-marker" size={44} color={PRIMARY} style={styles.pin} />
            </View>

            <TouchableOpacity style={styles.locateBtn} onPress={useMyLocation} activeOpacity={0.8}>
              {locating ? (
                <ActivityIndicator size="small" color={PRIMARY} />
              ) : (
                <Ionicons name="locate" size={20} color={PRIMARY} />
              )}
            </TouchableOpacity>

            <View style={styles.hintPill}>
              <Text style={styles.hintText}>Move the map until the pin sits on your gate</Text>
            </View>
          </>
        )}
      </View>

      {/* Confirm card */}
      <View style={styles.footer}>
        <View style={styles.labelRow}>
          <Text style={styles.inputLabel}>Pickup spot label</Text>
          {resolvingLabel && <ActivityIndicator size="small" color={PRIMARY} />}
        </View>
        <TextInput
          style={styles.labelInput}
          placeholder="e.g. House 12, Nii Boi Street — blue gate"
          placeholderTextColor="#94A3B8"
          value={label}
          onChangeText={(text) => {
            labelEdited.current = text.trim().length > 0;
            setLabel(text);
          }}
        />
        {gpsText && (
          <View style={styles.gpsBadge}>
            <Ionicons name="keypad-outline" size={13} color={PRIMARY} />
            <Text style={styles.gpsBadgeText}>{gpsText}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.confirmBtn, (!pin || saving) && styles.confirmBtnDisabled]}
          onPress={onConfirm}
          disabled={!pin || saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color={WHITE} />
          ) : (
            <Text style={styles.confirmText}>
              {existing ? 'Update collection point' : 'Confirm collection point'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 20,
    color: TEXT,
  },

  // Search
  searchWrap: {
    paddingHorizontal: 20,
    zIndex: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT_REGULAR,
    fontSize: 13,
    color: TEXT,
  },
  resultsCard: {
    position: 'absolute',
    top: 52,
    left: 20,
    right: 20,
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  resultRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDF4F0',
  },
  resultText: {
    flex: 1,
    fontFamily: FONT_MEDIUM,
    fontSize: 13,
    color: TEXT,
  },

  banner: {
    backgroundColor: AMBER_BG,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bannerText: {
    fontFamily: FONT_MEDIUM,
    fontSize: 12,
    color: AMBER_TEXT,
  },

  // Map
  mapWrap: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    margin: 20,
    marginBottom: 12,
    backgroundColor: '#E2E8F0',
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  mapLoadingText: {
    fontFamily: FONT_MEDIUM,
    fontSize: 13,
    color: MUTED,
  },
  pinWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    marginBottom: 38, // tip of the marker sits on the true center
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 3 },
  },
  locateBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  hintPill: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(15,23,42,0.72)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  hintText: {
    fontFamily: FONT_MEDIUM,
    fontSize: 11,
    color: WHITE,
  },

  // Footer
  footer: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 13,
    color: TEXT,
  },
  labelInput: {
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: FONT_REGULAR,
    fontSize: 13,
    color: TEXT,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: PRIMARY_SOFT,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  gpsBadgeText: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 12,
    color: PRIMARY,
  },
  confirmBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 18,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 15,
    color: WHITE,
  },
});
