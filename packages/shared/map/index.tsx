// One map import for both apps: `import MapView, { Marker, Polyline } from '@borlaman/shared/map'`.
//
// Phones (this file): react-native-maps — Apple Maps on iPhone, Google Maps
// on Android, works in Expo Go.
// Web (index.web.tsx, picked automatically by Expo for the browser): Leaflet
// with OpenStreetMap/CARTO tiles, because react-native-maps has no web
// support. Both expose the same props and ref methods the apps use.

export { default, Marker, Polyline } from 'react-native-maps';
export type { Details, MapMarkerProps, MapPolylineProps, MapViewProps, Region } from 'react-native-maps';
