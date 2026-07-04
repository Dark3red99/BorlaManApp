import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import * as pickupService from '../../services/pickupService';
import type { CollectionRequest } from '../../types/models';
import { wasteMeta } from '../../constants/waste';
import { REQUEST_STATUS_META } from '../../constants/requestStatus';

const PRIMARY = '#059669';
const PRIMARY_DARK = '#047857';
const BG      = '#F3F8F5';
const WHITE   = '#FFFFFF';
const TEXT    = '#0F172A';
const MUTED   = '#64748B';

export default function DisposeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [active, setActive] = useState<CollectionRequest | null>(null);
  const [history, setHistory] = useState<CollectionRequest[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let unsubscribe: (() => void) | undefined;

      pickupService.getRequests(user.id).then((all) => {
        setHistory(all.filter((r) => r.status === 'completed' || r.status === 'cancelled').slice(0, 5));
      });
      pickupService.getActiveRequest(user.id).then((request) => {
        setActive(request);
        if (request) {
          // keep the status chip live while this tab is focused
          unsubscribe = pickupService.subscribeToRequest(request.id, ({ request: updated }) => {
            setActive(
              updated.status === 'completed' || updated.status === 'cancelled' ? null : updated,
            );
          });
        }
      });

      return () => unsubscribe?.();
    }, [user]),
  );

  const activeStatus = active ? REQUEST_STATUS_META[active.status] : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Dispose</Text>
        <Text style={styles.subtitle}>Request an Aboboyaa pickup to your door</Text>

        {active && activeStatus ? (
          <TouchableOpacity
            style={styles.activeCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('TrackPickup', { requestId: active.id })}
          >
            <View style={styles.activeTopRow}>
              <Text style={styles.activeLabel}>Pickup in progress</Text>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                <Text style={styles.statusBadgeTextLight}>{activeStatus.label}</Text>
              </View>
            </View>
            <View style={styles.activeBody}>
              <View style={styles.activeIconBox}>
                <MaterialCommunityIcons name={wasteMeta(active.wasteType).icon as any} size={26} color={WHITE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activeWaste}>{wasteMeta(active.wasteType).label} • {active.volumeKg} kg</Text>
                <Text style={styles.activeAddress} numberOfLines={1}>{active.addressText}</Text>
              </View>
              <View style={styles.trackBtn}>
                <Text style={styles.trackBtnText}>Track</Text>
                <Ionicons name="chevron-forward" size={14} color={PRIMARY_DARK} />
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.ctaCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('RequestPickup')}
          >
            <View style={styles.ctaIconBox}>
              <MaterialCommunityIcons name="truck-fast" size={30} color={WHITE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaTitle}>Request a Pickup</Text>
              <Text style={styles.ctaSub}>Photos, location & price upfront — a collector comes to you</Text>
            </View>
            <View style={styles.ctaArrow}>
              <Ionicons name="arrow-forward" size={20} color={PRIMARY_DARK} />
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Recent Pickups</Text>
          {history.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="clipboard-text-clock-outline" size={28} color={MUTED} />
              <Text style={styles.emptyText}>No pickups yet. Your completed requests will appear here.</Text>
            </View>
          ) : (
            history.map((item, idx) => {
              const meta = wasteMeta(item.wasteType);
              const status = REQUEST_STATUS_META[item.status];
              return (
                <View
                  key={item.id}
                  style={[styles.historyRow, idx < history.length - 1 && styles.historyRowBorder]}
                >
                  <View style={[styles.historyIconBox, { backgroundColor: meta.colorSoft }]}>
                    <MaterialCommunityIcons name={meta.icon as any} size={20} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyItemTitle}>
                      {meta.label} • {item.volumeKg} kg
                    </Text>
                    <Text style={styles.historyItemSub}>
                      {new Date(item.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={styles.historyPrice}>GH₵ {item.priceGhs.toFixed(2)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.colorSoft }]}>
                      <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 26,
    color: TEXT,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: MUTED,
    marginBottom: 18,
  },

  // ── Active pickup card ──
  activeCard: {
    backgroundColor: PRIMARY,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  activeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  activeLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: WHITE,
    opacity: 0.9,
  },
  activeBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: PRIMARY_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeWaste: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: WHITE,
  },
  activeAddress: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  trackBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: PRIMARY_DARK,
  },

  // ── Request CTA ──
  ctaCard: {
    backgroundColor: PRIMARY,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  ctaIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: PRIMARY_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: WHITE,
  },
  ctaSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    lineHeight: 17,
  },
  ctaArrow: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── History ──
  historyCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  historyTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: TEXT,
    marginBottom: 6,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 18,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  historyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyItemTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: TEXT,
  },
  historyItemSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: MUTED,
    marginTop: 1,
  },
  historyPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: TEXT,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
  },
  statusBadgeTextLight: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#CCFFCC',
  },
});
