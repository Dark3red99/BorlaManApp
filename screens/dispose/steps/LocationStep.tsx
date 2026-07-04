import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import type { GeoPoint } from '../../../types/models';
import type { PickupDraft } from '../RequestPickupScreen';

const PRIMARY = '#059669';
const WHITE   = '#FFFFFF';
const TEXT    = '#0F172A';
const MUTED   = '#64748B';
const BORDER  = '#DCE8E1';

// Kwame Nkrumah Circle, Accra — the fallback when GPS is unavailable/denied.
const DEFAULT_CENTER: GeoPoint = { latitude: 5.5717, longitude: -0.2107 };
const DEFAULT_DELTA = { latitudeDelta: 0.012, longitudeDelta: 0.012 };

type Props = {
  draft: PickupDraft;
  onChange: (patch: Partial<PickupDraft>) => void;
};

export default function LocationStep({ draft, onChange }: Props) {
  const mapRef = useRef<MapView>(null);
  const addressEdited = useRef(draft.addressText.trim().length > 0);
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);

  const center = draft.location ?? DEFAULT_CENTER;

  // The map's center IS the pickup point, so a fresh visit already has one.
  useEffect(() => {
    if (!draft.location) onChange({ location: DEFAULT_CENTER });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fillAddressFrom = async (point: GeoPoint) => {
    if (addressEdited.current) return;
    try {
      const [place] = await Location.reverseGeocodeAsync(point);
      if (place && !addressEdited.current) {
        const line = [place.name ?? place.street, place.district ?? place.subregion ?? place.city]
          .filter(Boolean)
          .join(', ');
        if (line) onChange({ addressText: line });
      }
    } catch {
      // geocoder unavailable — the user types the address instead
    }
  };

  const onRegionChangeComplete = (region: Region) => {
    const point = { latitude: region.latitude, longitude: region.longitude };
    onChange({ location: point });
    fillAddressFrom(point);
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
      onChange({ location: point });
      fillAddressFrom(point);
      mapRef.current?.animateToRegion({ ...point, ...DEFAULT_DELTA }, 600);
    } catch {
      setDenied(true);
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{ ...center, ...DEFAULT_DELTA }}
          onRegionChangeComplete={onRegionChangeComplete}
          onPanDrag={() => Keyboard.dismiss()}
          showsUserLocation
          showsMyLocationButton={false}
          toolbarEnabled={false}
        >
        </MapView>

        {/* Fixed center pin — drag the map underneath it */}
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
          <Text style={styles.hintText}>Move the map to set your pickup point</Text>
        </View>
      </View>

      {denied && (
        <Text style={styles.deniedText}>
          Location permission denied — drag the map to your spot instead.
        </Text>
      )}

      <Text style={styles.inputLabel}>Address / landmark details</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. House 12, Nii Boi Street — blue gate"
        placeholderTextColor="#94A3B8"
        value={draft.addressText}
        onChangeText={(text) => {
          addressEdited.current = text.trim().length > 0;
          onChange({ addressText: text });
        }}
        multiline
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  mapWrap: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 220,
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
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: WHITE,
  },
  deniedText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#DC2626',
    marginTop: 8,
  },
  inputLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: TEXT,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT,
    minHeight: 52,
    maxHeight: 84,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
});
