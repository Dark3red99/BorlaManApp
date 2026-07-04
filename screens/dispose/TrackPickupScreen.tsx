import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import * as pickupService from '../../services/pickupService';
import type { Collector, CollectionRequest } from '../../types/models';
import type { RootStackScreenProps } from '../../types/navigation';
import { formatDistance, haversineKm } from '../../utils/geo';

const PRIMARY = '#059669';
const PRIMARY_DARK = '#047857';
const WHITE   = '#FFFFFF';
const TEXT    = '#0F172A';
const MUTED   = '#64748B';
const AMBER   = '#F59E0B';

const STATUS_COPY: Record<string, { title: string; sub: string }> = {
  pending: { title: 'Finding a collector…', sub: 'Contacting Aboboyaa riders near you' },
  matched: { title: 'Collector found!', sub: 'Your collector is preparing to leave' },
  'en-route': { title: 'On the way', sub: 'Your collector is heading to you' },
  arrived: { title: 'Your collector has arrived', sub: 'Meet them at your pickup point' },
  collecting: { title: 'Collecting your waste', sub: 'Loading up — almost done' },
};

export default function TrackPickupScreen({ navigation, route }: RootStackScreenProps<'TrackPickup'>) {
  const { requestId } = route.params;
  const mapRef = useRef<MapView>(null);
  const fitted = useRef(false);
  const [request, setRequest] = useState<CollectionRequest | null>(null);
  const [collector, setCollector] = useState<Collector | null>(null);

  // Pulsing ring while searching
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    const unsubscribe = pickupService.subscribeToRequest(requestId, ({ request: req, collector: col }) => {
      setRequest(req);
      setCollector(col);
      if (req.status === 'completed') {
        navigation.replace('PickupComplete', { requestId: req.id });
      }
    });
    return unsubscribe;
  }, [requestId, navigation]);

  // Frame pickup + collector once when the collector first appears.
  useEffect(() => {
    if (!request || !collector || fitted.current) return;
    fitted.current = true;
    mapRef.current?.fitToCoordinates([request.location, collector.currentLocation], {
      edgePadding: { top: 90, right: 70, bottom: 320, left: 70 },
      animated: true,
    });
  }, [request, collector]);

  const onCancel = () => {
    Alert.alert('Cancel pickup?', 'Your collector will be released and no charge applies.', [
      { text: 'Keep pickup', style: 'cancel' },
      {
        text: 'Cancel pickup',
        style: 'destructive',
        onPress: async () => {
          await pickupService.cancelRequest(requestId);
          navigation.goBack();
        },
      },
    ]);
  };

  const status = request?.status ?? 'pending';
  const copy = STATUS_COPY[status] ?? STATUS_COPY.pending;
  const canCancel = status === 'pending' || status === 'matched' || status === 'en-route';
  const showCollector = collector && status !== 'pending';
  const distanceKm =
    showCollector && request ? haversineKm(collector.currentLocation, request.location) : null;
  const etaMin =
    showCollector && request && status === 'en-route'
      ? pickupService.collectorEtaMinutes(collector, request.location)
      : null;

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {request && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            ...request.location,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsMyLocationButton={false}
          toolbarEnabled={false}
        >
          <Marker coordinate={request.location} anchor={{ x: 0.5, y: 1 }}>
            <MaterialCommunityIcons name="map-marker" size={40} color={PRIMARY} />
          </Marker>

          {showCollector && (
            <>
              <Marker coordinate={collector.currentLocation} anchor={{ x: 0.5, y: 0.5 }} flat>
                <View style={styles.collectorMarker}>
                  <MaterialCommunityIcons name="rickshaw" size={20} color={WHITE} />
                </View>
              </Marker>
              <Polyline
                coordinates={[collector.currentLocation, request.location]}
                strokeColor={PRIMARY}
                strokeWidth={3}
                lineDashPattern={[8, 6]}
              />
            </>
          )}
        </MapView>
      )}

      {/* ── Back button ── */}
      <SafeAreaView edges={['top']} style={styles.topBar} pointerEvents="box-none">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── Bottom status card ── */}
      <SafeAreaView edges={['bottom']} style={styles.bottomWrap} pointerEvents="box-none">
        <View style={styles.card}>
          {status === 'pending' ? (
            <View style={styles.searchingRow}>
              <View style={styles.pulseBox}>
                <Animated.View
                  style={[styles.pulseRing, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}
                />
                <View style={styles.pulseCore}>
                  <MaterialCommunityIcons name="rickshaw" size={22} color={WHITE} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>{copy.title}</Text>
                <Text style={styles.statusSub}>{copy.sub}</Text>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.statusHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusTitle}>{copy.title}</Text>
                  <Text style={styles.statusSub}>{copy.sub}</Text>
                </View>
                {etaMin != null && (
                  <View style={styles.etaBox}>
                    <Text style={styles.etaValue}>{etaMin}</Text>
                    <Text style={styles.etaUnit}>min</Text>
                  </View>
                )}
              </View>

              {collector && (
                <View style={styles.collectorRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{collector.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.collectorName}>{collector.name}</Text>
                    <Text style={styles.collectorVehicle}>{collector.vehicle}</Text>
                  </View>
                  <View style={styles.ratingBox}>
                    <Ionicons name="star" size={13} color={AMBER} />
                    <Text style={styles.ratingText}>{collector.rating.toFixed(1)}</Text>
                  </View>
                </View>
              )}

              {distanceKm != null && status === 'en-route' && (
                <Text style={styles.distanceText}>
                  {formatDistance(distanceKm)} away
                </Text>
              )}
            </>
          )}

          {canCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel pickup</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EFEA',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  collectorMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: WHITE,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  bottomWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },

  // ── Searching state ──
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginBottom: 6,
  },
  pulseBox: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY,
  },
  pulseCore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Status ──
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: TEXT,
    lineHeight: 24,
  },
  statusSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12.5,
    color: MUTED,
    marginTop: 1,
  },
  etaBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  etaValue: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 18,
    color: PRIMARY,
    lineHeight: 22,
  },
  etaUnit: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: PRIMARY_DARK,
  },

  // ── Collector card ──
  collectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F6FAF8',
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: WHITE,
  },
  collectorName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: TEXT,
  },
  collectorVehicle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: MUTED,
    marginTop: 1,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: WHITE,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  ratingText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: TEXT,
  },
  distanceText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: MUTED,
    marginTop: 10,
    textAlign: 'center',
  },

  // ── Cancel ──
  cancelBtn: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#DC2626',
  },
});
