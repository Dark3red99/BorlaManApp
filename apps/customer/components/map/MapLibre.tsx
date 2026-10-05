/**
 * MapLibre, loaded only where its native code exists.
 *
 * Expo Go ships a fixed set of native modules and MapLibre is not one of them,
 * so importing it there crashes at startup. In Expo Go we export look-alike
 * stand-ins: `Map` renders a placeholder card and the child components render
 * nothing. Screens keep working (GPS, search, saving a point), just without
 * map tiles. A development build (`npx expo run:ios` / EAS) gets the real map.
 */
import React, { type ComponentType, type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type * as MapLibreTypes from '@maplibre/maplibre-react-native';

export type { CameraRef, LngLatBounds, ViewStateChangeEvent } from '@maplibre/maplibre-react-native';

/** False inside Expo Go, where the MapLibre native module is missing. */
export const isMapAvailable = Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

type MapLibreModule = typeof MapLibreTypes;

function MapPlaceholder({ style }: { style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return (
    <View style={[style, styles.placeholder]}>
      <MaterialCommunityIcons name="map-outline" size={40} color="#059669" />
      <Text style={styles.title}>Map preview unavailable in Expo Go</Text>
      <Text style={styles.body}>Everything else on this screen still works.</Text>
    </View>
  );
}

// Children of the placeholder never mount; ref-taking ones (Camera) just leave the ref null.
const Nothing = React.forwardRef<unknown, any>(() => null);

const lib: MapLibreModule | null = isMapAvailable
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('@maplibre/maplibre-react-native') as MapLibreModule)
  : null;

export const Map = (lib?.Map ?? MapPlaceholder) as MapLibreModule['Map'];
export const Camera = (lib?.Camera ?? Nothing) as MapLibreModule['Camera'];
export const Marker = (lib?.Marker ?? Nothing) as MapLibreModule['Marker'];
export const GeoJSONSource = (lib?.GeoJSONSource ?? Nothing) as MapLibreModule['GeoJSONSource'];
export const Layer = (lib?.Layer ?? Nothing) as MapLibreModule['Layer'];
export const UserLocation = (lib?.UserLocation ?? (Nothing as ComponentType<any>)) as MapLibreModule['UserLocation'];

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 24,
    gap: 6,
  },
  title: { fontSize: 15, fontWeight: '600', color: '#065F46', textAlign: 'center' },
  body: { fontSize: 13, color: '#047857', textAlign: 'center' },
});
