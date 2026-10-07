// Web version of '@borlaman/shared/map' (see index.tsx). Leaflet renders the
// map in the browser; this file mimics the slice of the react-native-maps API
// the apps use: MapView (initialRegion/region, onRegionChangeComplete,
// onPress, onPanDrag, showsUserLocation, userInterfaceStyle, scroll/zoom
// toggles, ref.animateToRegion / ref.fitToCoordinates), Marker (custom
// children, anchor, pinColor, onPress) and Polyline (dashes).
import 'leaflet/dist/leaflet.css';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import L from 'leaflet';
import {
  CircleMarker,
  MapContainer,
  Marker as LeafletMarker,
  Polyline as LeafletPolyline,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

export type LatLng = { latitude: number; longitude: number };
export type Region = LatLng & { latitudeDelta: number; longitudeDelta: number };
export type Details = { isGesture?: boolean };

const ACCRA: Region = { latitude: 5.6037, longitude: -0.187, latitudeDelta: 0.05, longitudeDelta: 0.05 };

// Free CARTO basemaps (OpenStreetMap data), light and dark.
const TILES = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};
const ATTRIBUTION = '&copy; OpenStreetMap contributors &copy; CARTO';

/** react-native-maps describes zoom as "degrees visible"; Leaflet uses zoom levels. */
const deltaToZoom = (delta: number) => Math.max(3, Math.min(19, Math.log2(360 / Math.max(delta, 0.0005))));

function regionOf(map: L.Map): Region {
  const c = map.getCenter();
  const b = map.getBounds();
  return {
    latitude: c.lat,
    longitude: c.lng,
    latitudeDelta: Math.abs(b.getNorth() - b.getSouth()),
    longitudeDelta: Math.abs(b.getEast() - b.getWest()),
  };
}

type MapViewProps = {
  style?: StyleProp<ViewStyle>;
  initialRegion?: Region;
  region?: Region;
  onRegionChangeComplete?: (region: Region, details?: Details) => void;
  onPress?: (e?: unknown) => void;
  onPanDrag?: () => void;
  showsUserLocation?: boolean;
  userInterfaceStyle?: 'light' | 'dark';
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  children?: React.ReactNode;
  // accepted for API parity, unused on web
  showsMyLocationButton?: boolean;
  toolbarEnabled?: boolean;
};

export type MapViewHandle = {
  animateToRegion: (region: Region, durationMs?: number) => void;
  fitToCoordinates: (
    coords: LatLng[],
    options?: { edgePadding?: { top: number; right: number; bottom: number; left: number }; animated?: boolean },
  ) => void;
};

/** Forwards Leaflet map events to the react-native-maps style callbacks. */
function Events({
  onRegionChangeComplete,
  onPress,
  onPanDrag,
}: Pick<MapViewProps, 'onRegionChangeComplete' | 'onPress' | 'onPanDrag'>) {
  const gesture = useRef(false);
  const map = useMapEvents({
    dragstart: () => {
      gesture.current = true;
      onPanDrag?.();
    },
    zoomstart: (e) => {
      // wheel/pinch zoom counts as a gesture; flyTo() sets no originalEvent
      if ((e as unknown as { originalEvent?: unknown }).originalEvent) gesture.current = true;
    },
    moveend: () => {
      onRegionChangeComplete?.(regionOf(map), { isGesture: gesture.current });
      gesture.current = false;
    },
    click: () => onPress?.(),
  });
  // react-native-maps reports the starting region once the map is ready.
  useEffect(() => {
    map.whenReady(() => onRegionChangeComplete?.(regionOf(map), { isGesture: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

/** Follows a controlled `region` prop. */
function SyncRegion({ region }: { region: Region }) {
  const map = useMap();
  useEffect(() => {
    map.setView([region.latitude, region.longitude], deltaToZoom(region.latitudeDelta), { animate: false });
  }, [map, region.latitude, region.longitude, region.latitudeDelta]);
  return null;
}

/** Leaflet sizes itself on mount; re-measure when the container changes size. */
function KeepSized() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

/** Blue "you are here" dot from the browser's geolocation. */
function UserDot() {
  const [pos, setPos] = useState<[number, number] | null>(null);
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);
  if (!pos) return null;
  return (
    <CircleMarker
      center={pos}
      radius={8}
      pathOptions={{ color: '#FFFFFF', weight: 3, fillColor: '#3B82F6', fillOpacity: 1 }}
    />
  );
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(props, ref) {
  const {
    style,
    initialRegion,
    region,
    onRegionChangeComplete,
    onPress,
    onPanDrag,
    showsUserLocation,
    userInterfaceStyle,
    scrollEnabled = true,
    zoomEnabled = true,
    children,
  } = props;
  const mapRef = useRef<L.Map | null>(null);
  const start = region ?? initialRegion ?? ACCRA;

  useImperativeHandle(ref, () => ({
    animateToRegion: (r, durationMs = 500) => {
      mapRef.current?.flyTo([r.latitude, r.longitude], deltaToZoom(r.latitudeDelta), {
        duration: durationMs / 1000,
      });
    },
    fitToCoordinates: (coords, options) => {
      if (!mapRef.current || coords.length === 0) return;
      const pad = options?.edgePadding ?? { top: 40, right: 40, bottom: 40, left: 40 };
      mapRef.current.fitBounds(L.latLngBounds(coords.map((c) => [c.latitude, c.longitude] as [number, number])), {
        paddingTopLeft: [pad.left, pad.top],
        paddingBottomRight: [pad.right, pad.bottom],
        animate: options?.animated ?? true,
        maxZoom: 17,
      });
    },
  }));

  return (
    <View style={style}>
      <MapContainer
        ref={mapRef}
        center={[start.latitude, start.longitude]}
        zoom={deltaToZoom(start.latitudeDelta)}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        dragging={scrollEnabled}
        scrollWheelZoom={zoomEnabled}
        doubleClickZoom={zoomEnabled}
        touchZoom={zoomEnabled}
        boxZoom={false}
        keyboard={false}
      >
        <TileLayer
          key={userInterfaceStyle === 'dark' ? 'dark' : 'light'}
          url={userInterfaceStyle === 'dark' ? TILES.dark : TILES.light}
          attribution={ATTRIBUTION}
          subdomains="abcd"
          maxZoom={20}
        />
        <KeepSized />
        <Events onRegionChangeComplete={onRegionChangeComplete} onPress={onPress} onPanDrag={onPanDrag} />
        {region && <SyncRegion region={region} />}
        {showsUserLocation && <UserDot />}
        {children}
      </MapContainer>
    </View>
  );
});

export default MapView;

// ── Marker ───────────────────────────────────────────────────────

type MarkerProps = {
  coordinate: LatLng;
  /** Which point of the marker sits on the coordinate: (0.5, 1) = bottom middle. */
  anchor?: { x: number; y: number };
  pinColor?: string;
  onPress?: (e: { stopPropagation: () => void; nativeEvent: { coordinate: LatLng } }) => void;
  children?: React.ReactNode;
  tracksViewChanges?: boolean; // native-only, ignored
};

function pinHtml(color: string) {
  return `<svg width="30" height="40" viewBox="0 0 30 40" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">
    <path d="M15 0C6.7 0 0 6.6 0 14.8 0 25.9 15 40 15 40s15-14.1 15-25.2C30 6.6 23.3 0 15 0z" fill="${color}"/>
    <circle cx="15" cy="14.5" r="5.5" fill="#fff"/></svg>`;
}

export function Marker({ coordinate, anchor, pinColor = '#E5484D', onPress, children }: MarkerProps) {
  // Custom children (React Native views) are rendered into the marker's DOM
  // node with a portal, so the same JSX works on phones and web.
  const host = useMemo(() => document.createElement('div'), []);
  const a = anchor ?? { x: 0.5, y: 1 };

  const icon = useMemo(() => {
    if (children) {
      host.style.position = 'absolute';
      host.style.transform = `translate(${-a.x * 100}%, ${-a.y * 100}%)`;
      return L.divIcon({ html: host, className: '', iconSize: [0, 0], iconAnchor: [0, 0] });
    }
    return L.divIcon({ html: pinHtml(pinColor), className: '', iconSize: [30, 40], iconAnchor: [15, 40] });
  }, [children ? 'custom' : pinColor, a.x, a.y, host]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <LeafletMarker
        position={[coordinate.latitude, coordinate.longitude]}
        icon={icon}
        eventHandlers={{
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            onPress?.({ stopPropagation: () => {}, nativeEvent: { coordinate } });
          },
        }}
      />
      {children ? createPortal(children, host) : null}
    </>
  );
}

// ── Polyline ─────────────────────────────────────────────────────

type PolylineProps = {
  coordinates: LatLng[];
  strokeColor?: string;
  strokeWidth?: number;
  lineDashPattern?: number[];
};

export function Polyline({ coordinates, strokeColor = '#059669', strokeWidth = 3, lineDashPattern }: PolylineProps) {
  return (
    <LeafletPolyline
      positions={coordinates.map((c) => [c.latitude, c.longitude] as [number, number])}
      pathOptions={{ color: strokeColor, weight: strokeWidth, dashArray: lineDashPattern?.join(' ') }}
    />
  );
}
