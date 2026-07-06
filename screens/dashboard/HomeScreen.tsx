import React, { useCallback, useMemo, useState } from 'react';
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
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import * as pickupService from '../../services/pickupService';
import type { CollectionRequest, ImpactStats } from '../../types/models';
import { wasteMeta } from '../../constants/waste';
import { REQUEST_STATUS_META } from '../../constants/requestStatus';
import { addDays, formatTime, isSameDay, timeAgo } from '../../utils/datetime';

const PRIMARY     = '#059669';
const PICKUP_BG   = '#10B981';
const IMPACT_BG   = '#047857';
const CARD_SHADOW = '#059669';
const BG          = '#F3F8F5';
const WHITE       = '#FFFFFF';
const TEXT        = '#0F172A';
const MUTED       = '#64748B';

// Mock milestones the Impact Tracker progress bars fill toward; the backend
// gamification service will own real goal tiers.
const GOALS = { totalKg: 100, co2OffsetKg: 40, points: 600 };

const NO_STATS: ImpactStats = { totalKg: 0, co2OffsetKg: 0, points: 0, completedCount: 0 };

type ActivityEvent = {
  id: string;
  at: string;
  title: string;
  sub: string;
  iconBg: string;
  icon: React.ReactNode;
};

function dayLabel(d: Date): string {
  const today = new Date();
  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, addDays(today, 1))) return 'Tomorrow';
  if (d.getTime() - today.getTime() < 7 * 24 * 3600 * 1000) {
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [next, setNext] = useState<pickupService.NextPickup | null>(null);
  const [stats, setStats] = useState<ImpactStats>(NO_STATS);
  const [requests, setRequests] = useState<CollectionRequest[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let unsubscribe: (() => void) | undefined;

      const load = () => {
        pickupService.getImpactStats(user.id).then(setStats);
        pickupService.getRequests(user.id).then(setRequests);
        pickupService.getNextPickup(user.id).then((np) => {
          setNext(np);
          if (np?.kind === 'active') {
            // keep the card's status live while this tab is focused
            unsubscribe?.();
            unsubscribe = pickupService.subscribeToRequest(np.request.id, ({ request }) => {
              if (request.status === 'completed' || request.status === 'cancelled') {
                load(); // pickup just finished — refresh stats, activity & next pickup
              } else {
                setNext({ kind: 'active', request });
              }
            });
          }
        });
      };

      load();
      return () => unsubscribe?.();
    }, [user]),
  );

  const impactItems = useMemo(
    () => [
      {
        id: 'waste',
        label: 'Total Waste Collected',
        value: `${stats.totalKg} kg`,
        progress: Math.min(stats.totalKg / GOALS.totalKg, 1),
        iconBg: PRIMARY,
        icon: <MaterialCommunityIcons name="trash-can-outline" size={18} color={WHITE} />,
      },
      {
        id: 'co2',
        label: 'CO₂ Offset',
        value: `${stats.co2OffsetKg} kg`,
        progress: Math.min(stats.co2OffsetKg / GOALS.co2OffsetKg, 1),
        iconBg: '#3B82F6',
        icon: <MaterialCommunityIcons name="leaf" size={18} color={WHITE} />,
      },
      {
        id: 'pts',
        label: 'Impact Points',
        value: stats.points.toLocaleString('en-US'),
        progress: Math.min(stats.points / GOALS.points, 1),
        iconBg: '#F59E0B',
        icon: <FontAwesome5 name="trophy" size={16} color={WHITE} />,
      },
    ],
    [stats],
  );

  const activity = useMemo<ActivityEvent[]>(() => {
    const events: ActivityEvent[] = [];
    for (const r of requests) {
      const meta = wasteMeta(r.wasteType);
      if (r.status === 'completed') {
        const at = r.completedAt ?? r.createdAt;
        events.push({
          id: `${r.id}-done`,
          at,
          title: 'Pickup Completed',
          sub: `${r.volumeKg} kg ${meta.label.toLowerCase()} • ${timeAgo(at)}`,
          iconBg: '#DCFCE7',
          icon: <Ionicons name="checkmark" size={20} color="#16A34A" />,
        });
        events.push({
          id: `${r.id}-pts`,
          at,
          title: 'Points Earned',
          sub: `+${pickupService.pointsForPickup(r.volumeKg)} impact points • ${timeAgo(at)}`,
          iconBg: '#DBEAFE',
          icon: <FontAwesome5 name="coins" size={16} color="#3B82F6" />,
        });
      } else if (r.status === 'cancelled') {
        events.push({
          id: `${r.id}-cxl`,
          at: r.createdAt,
          title: 'Pickup Cancelled',
          sub: `${r.volumeKg} kg ${meta.label.toLowerCase()} • ${timeAgo(r.createdAt)}`,
          iconBg: '#FEE2E2',
          icon: <Ionicons name="close" size={20} color="#DC2626" />,
        });
      }
    }
    return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);
  }, [requests]);

  // ── Next Pickup card content per state ──
  const card = (() => {
    if (next?.kind === 'active') {
      const status = REQUEST_STATUS_META[next.request.status];
      return {
        badge: 'In Progress',
        big: status.label,
        sub: `${wasteMeta(next.request.wasteType).label} • ${next.request.addressText}`,
        onPress: () => navigation.navigate('TrackPickup', { requestId: next.request.id }),
      };
    }
    if (next?.kind === 'upcoming') {
      const at = new Date(next.item.at);
      const dateStr = at.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      return {
        badge: next.item.kind === 'recurring' ? 'Recurring' : 'Scheduled',
        big: dayLabel(at),
        sub: `${dateStr} • ${formatTime(at)} • ${wasteMeta(next.item.wasteType).label}`,
        onPress: () => navigation.navigate('Schedule'),
      };
    }
    return {
      badge: null,
      big: 'No pickup yet',
      sub: 'Request one and a collector comes to you',
      onPress: () => navigation.navigate('RequestPickup'),
    };
  })();

  const openLiveMap = () => {
    if (next?.kind === 'active') {
      navigation.navigate('TrackPickup', { requestId: next.request.id });
    } else {
      navigation.navigate('Dispose');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome 👋</Text>
            <Text style={styles.userName}>{user?.fullName ?? 'there'}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={22} color={TEXT} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-circle-outline" size={26} color={PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Next Pickup Card ── */}
        <TouchableOpacity style={styles.pickupCard} activeOpacity={0.85} onPress={card.onPress}>
          <View style={styles.pickupTopRow}>
            <Text style={styles.pickupLabel}>Next Pickup</Text>
            {card.badge && (
              <View style={styles.scheduledBadge}>
                <Text style={styles.scheduledText}>{card.badge}</Text>
              </View>
            )}
          </View>

          <View style={styles.pickupBody}>
            <View style={styles.truckIconBox}>
              <MaterialCommunityIcons name="truck-delivery" size={28} color={WHITE} />
            </View>

            <View style={styles.pickupInfo}>
              <Text style={styles.pickupDay}>{card.big}</Text>
              <Text style={styles.pickupDate} numberOfLines={1}>{card.sub}</Text>
            </View>

            <View style={styles.arrowBtn}>
              <Ionicons name="chevron-forward" size={20} color={TEXT} />
            </View>
          </View>
        </TouchableOpacity>

        {/* ── Quick Actions ── */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard} activeOpacity={0.8} onPress={() => navigation.navigate('Schedule')}>
            <View style={styles.quickIconBox}>
              <Ionicons name="calendar" size={26} color={WHITE} />
            </View>
            <Text style={styles.quickLabel}>Schedule{'\n'}Pickup</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard} activeOpacity={0.8} onPress={openLiveMap}>
            <View style={styles.quickIconBox}>
              <Ionicons name="map" size={26} color={WHITE} />
            </View>
            <Text style={styles.quickLabel}>Live{'\n'}Map</Text>
          </TouchableOpacity>
        </View>

        {/* ── Impact Tracker ── */}
        <View style={styles.impactCard}>
          <View style={styles.impactHeader}>
            <Text style={styles.impactTitle}>Impact Tracker</Text>
            <Text style={styles.viewAll}>
              {stats.completedCount} pickup{stats.completedCount === 1 ? '' : 's'}
            </Text>
          </View>

          {impactItems.map((item, idx) => (
            <View key={item.id} style={[styles.impactRow, idx < impactItems.length - 1 && styles.impactRowBorder]}>
              <View style={[styles.impactIconBox, { backgroundColor: item.iconBg }]}>
                {item.icon}
              </View>
              <View style={styles.impactInfo}>
                <View style={styles.impactTopLine}>
                  <Text style={styles.impactLabel}>{item.label}</Text>
                  <Text style={styles.impactValue}>{item.value}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[
                    styles.progressBar,
                    { width: `${item.progress * 100}%`, backgroundColor: item.iconBg === '#F59E0B' ? '#F59E0B' : WHITE }
                  ]} />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── Recent Activity ── */}
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>Recent Activity</Text>

          {activity.length === 0 ? (
            <View style={styles.emptyActivity}>
              <MaterialCommunityIcons name="history" size={26} color={MUTED} />
              <Text style={styles.emptyActivityText}>
                No activity yet — request your first pickup from the Dispose tab.
              </Text>
            </View>
          ) : (
            activity.map((item, idx) => (
              <View key={item.id} style={[styles.activityRow, idx < activity.length - 1 && styles.activityRowBorder]}>
                <View style={[styles.activityIconBox, { backgroundColor: item.iconBg }]}>
                  {item.icon}
                </View>
                <View style={styles.activityText}>
                  <Text style={styles.activityItemTitle}>{item.title}</Text>
                  <Text style={styles.activityItemSub}>{item.sub}</Text>
                </View>
              </View>
            ))
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

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 26,
    color: TEXT,
    lineHeight: 34,
  },
  userName: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: MUTED,
    marginTop: -2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  // ── Next Pickup Card ──
  pickupCard: {
    backgroundColor: PICKUP_BG,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: CARD_SHADOW,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  pickupTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pickupLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: WHITE,
    opacity: 0.9,
  },
  scheduledBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  scheduledText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#CCFFCC',
  },
  pickupBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  truckIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupInfo: {
    flex: 1,
  },
  pickupDay: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: WHITE,
    lineHeight: 28,
  },
  pickupDate: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  arrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Quick Actions ──
  quickRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  quickCard: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  quickIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: TEXT,
    textAlign: 'center',
    lineHeight: 19,
  },

  // ── Impact Tracker ──
  impactCard: {
    backgroundColor: IMPACT_BG,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: CARD_SHADOW,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  impactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  impactTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: WHITE,
  },
  viewAll: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#CCFFCC',
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  impactRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  impactIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactInfo: {
    flex: 1,
  },
  impactTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  impactLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  impactValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: WHITE,
  },
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: 5,
    borderRadius: 10,
    opacity: 0.9,
  },

  // ── Recent Activity ──
  activityCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  activityTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: TEXT,
    marginBottom: 14,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: {
    flex: 1,
  },
  activityItemTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: TEXT,
    marginBottom: 2,
  },
  activityItemSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: MUTED,
    lineHeight: 17,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  emptyActivityText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 18,
  },
});
