import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock,
  Coins,
  GraduationCap,
  History,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Phone,
  Repeat,
  Search,
  Star,
  Truck,
  type LucideIcon,
} from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import AnimatedBin from '../../components/AnimatedBin';
import * as pickupService from '../../services/pickupService';
import type { CollectionRequest, Collector, ImpactStats } from '../../types/models';
import { wasteMeta } from '../../constants/waste';
import { REQUEST_STATUS_META } from '../../constants/requestStatus';
import { addDays, formatTime, isSameDay, timeAgo } from '../../utils/datetime';
import { Fonts, ICON_STROKE, Radius, type Palette } from '../../constants/theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import {
  Avatar,
  Button,
  Card,
  IconButton,
  IconTile,
  ListRow,
  Pill,
  ProgressRing,
  Screen,
  SectionHeader,
  type Tone,
} from '../../components/ui';

// Mock milestones the impact rings fill toward; the backend gamification
// service will own real goal tiers.
const GOALS = { totalKg: 100, co2OffsetKg: 40, points: 600 };

const TRUCK_PHOTO = require('../../assets/illustrations/pickup-truck.jpg');

// Width of the bin illustration on the request card.
const SIDE_BIN_WIDTH = 116;

const NO_STATS: ImpactStats = { totalKg: 0, co2OffsetKg: 0, points: 0, completedCount: 0 };

type ActivityEvent = {
  id: string;
  at: string;
  title: string;
  sub: string;
  icon: LucideIcon;
  tone: Tone;
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

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
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { user } = useAuth();
  const [next, setNext] = useState<pickupService.NextPickup | null>(null);
  const [collector, setCollector] = useState<Collector | null>(null);
  const [stats, setStats] = useState<ImpactStats>(NO_STATS);
  const [requests, setRequests] = useState<CollectionRequest[]>([]);
  // Bumped on every focus so the bin's lid animation replays each visit.
  const [binPlay, setBinPlay] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setBinPlay((n) => n + 1);
    }, []),
  );

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
            if (np.request.collectorId) {
              pickupService.getCollector(np.request.collectorId).then(setCollector);
            } else {
              setCollector(null);
            }
            // keep the card's status + collector position live while this tab is focused
            unsubscribe?.();
            unsubscribe = pickupService.subscribeToRequest(np.request.id, ({ request, collector: c }) => {
              if (request.status === 'completed' || request.status === 'cancelled') {
                load(); // pickup just finished — refresh stats, activity & next pickup
              } else {
                setNext({ kind: 'active', request });
                setCollector(c);
              }
            });
          } else {
            setCollector(null);
          }
        });
      };

      load();
      return () => unsubscribe?.();
    }, [user]),
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
          title: 'Pickup completed',
          sub: `${r.volumeKg} kg ${meta.label.toLowerCase()}`,
          icon: CircleCheck,
          tone: 'accent',
        });
        events.push({
          id: `${r.id}-pts`,
          at,
          title: 'Points earned',
          sub: `+${pickupService.pointsForPickup(r.volumeKg)} impact points`,
          icon: Coins,
          tone: 'amber',
        });
      } else if (r.status === 'cancelled') {
        events.push({
          id: `${r.id}-cxl`,
          at: r.createdAt,
          title: 'Pickup cancelled',
          sub: `${r.volumeKg} kg ${meta.label.toLowerCase()}`,
          icon: CircleX,
          tone: 'danger',
        });
      }
    }
    return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);
  }, [requests]);

  const upcoming = next?.kind === 'upcoming' ? next.item : null;

  // Status line for an active pickup
  const etaLabel = (() => {
    if (next?.kind !== 'active') return null;
    const status = next.request.status;
    if (status === 'pending') return 'Finding a collector near you…';
    if (status === 'matched') return 'Heading your way shortly';
    if (status === 'en-route' && collector) {
      const mins = pickupService.collectorEtaMinutes(collector, next.request.location);
      return `Arriving in ${mins} min`;
    }
    if (status === 'arrived') return 'Your collector has arrived';
    if (status === 'collecting') return 'Collecting your waste';
    return null;
  })();

  const openTracking = () => {
    if (next?.kind === 'active') navigation.navigate('TrackPickup', { requestId: next.request.id });
  };

  const openLiveMap = () => {
    if (next?.kind === 'active') openTracking();
    else navigation.navigate('Dispose');
  };

  const notReady = (feature: string) =>
    Alert.alert(feature, `${feature} will be available once the backend is connected.`);

  const firstName = user?.fullName?.split(/\s+/)[0] ?? 'there';
  const addressText = user?.address
    ? [user.address.addressLine, user.address.area].filter(Boolean).join(', ')
    : 'Set your pickup location';

  const quickActions: { label: string; icon: LucideIcon; onPress: () => void }[] = [
    { label: 'Schedule', icon: CalendarPlus, onPress: () => navigation.navigate('Schedule') },
    { label: 'Live map', icon: MapIcon, onPress: openLiveMap },
    { label: 'Weekly', icon: Repeat, onPress: () => navigation.navigate('RecurringPickup') },
    { label: 'Learn', icon: GraduationCap, onPress: () => navigation.navigate('LearnEarn') },
  ];

  return (
    <Screen>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.name} numberOfLines={1}>{firstName}</Text>
        </View>
        <IconButton icon={Bell} accessibilityLabel="Notifications" onPress={() => notReady('Notifications')} />
        <Avatar name={user?.fullName} onPress={() => navigation.navigate('Profile')} />
      </View>

      {next?.kind === 'active' ? (
        /* ── Active pickup: the collector card ── */
        <Card onPress={openTracking} accessibilityLabel="Track your pickup">
          <View style={styles.rowBetween}>
            <Pill
              label={REQUEST_STATUS_META[next.request.status].label}
              color={ui.accent}
              bg={ui.accentSoft}
              dot
            />
            <ArrowUpRight size={20} color={ui.textFaint} strokeWidth={ICON_STROKE} />
          </View>

          {collector ? (
            <>
              <View style={styles.collectorRow}>
                <Avatar name={collector.name} size={52} />
                <View style={styles.flex}>
                  <Text style={styles.collectorName} numberOfLines={1}>{collector.name}</Text>
                  <View style={styles.inline}>
                    <Truck size={14} color={ui.textMuted} strokeWidth={ICON_STROKE} />
                    <Text style={styles.muted} numberOfLines={1}>{collector.vehicle}</Text>
                  </View>
                </View>
                <View style={styles.rating}>
                  <Star size={13} color={ui.amber} fill={ui.amber} strokeWidth={ICON_STROKE} />
                  <Text style={styles.ratingText}>{collector.rating.toFixed(1)}</Text>
                </View>
              </View>

              {etaLabel && (
                <View style={styles.etaWell}>
                  <Clock size={16} color={ui.accent} strokeWidth={ICON_STROKE} />
                  <Text style={styles.etaText}>{etaLabel}</Text>
                </View>
              )}

              <View style={styles.actions}>
                <Button
                  label="Call"
                  icon={Phone}
                  iconLeft
                  variant="secondary"
                  size="sm"
                  style={styles.flex}
                  onPress={() => notReady('Calling your collector')}
                />
                <Button
                  label="Chat"
                  icon={MessageCircle}
                  iconLeft
                  variant="secondary"
                  size="sm"
                  style={styles.flex}
                  onPress={() => notReady('Chat')}
                />
              </View>
            </>
          ) : (
            <View style={styles.collectorRow}>
              <IconTile icon={Search} tone="accent" round />
              <Text style={[styles.body, styles.flex]}>{etaLabel ?? 'Finding a collector near you…'}</Text>
            </View>
          )}
        </Card>
      ) : (
        /* ── No active pickup: request prompt ── */
        /* The bin fills the right side; text and actions stack on the left. */
        <Card style={styles.sideCard}>
          <View style={styles.sideText}>
            <Text style={styles.eyebrow}>Ready when you are</Text>
            <Text style={styles.heroTitle}>Got waste to{'\n'}dispose?</Text>

            <Pressable
              style={({ pressed }) => [styles.sideLocation, pressed && styles.pressed]}
              onPress={() => navigation.navigate('SetCollectionPoint')}
              accessibilityRole="button"
              accessibilityLabel="Change pickup location"
            >
              <MapPin size={15} color={ui.accent} strokeWidth={ICON_STROKE} />
              <Text style={[styles.sideLocationText, styles.flex]} numberOfLines={1}>{addressText}</Text>
              <ChevronRight size={14} color={ui.textFaint} strokeWidth={ICON_STROKE} />
            </Pressable>

            <Button
              label="Request pickup"
              icon={ArrowUpRight}
              size="sm"
              style={styles.sideButton}
              onPress={() => navigation.navigate('RequestPickup')}
            />
          </View>
          <View style={styles.sideBin} pointerEvents="none">
            <AnimatedBin width={SIDE_BIN_WIDTH} playKey={binPlay} />
          </View>
        </Card>
      )}

      {/* ── Upcoming scheduled pickup ── */}
      {upcoming && (() => {
        const at = new Date(upcoming.at);
        const dateStr = at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return (
          <Pressable
            onPress={() => navigation.navigate('Schedule')}
            accessibilityRole="button"
            accessibilityLabel={`${upcoming.kind === 'recurring' ? 'Weekly pickup' : 'Scheduled pickup'}, ${dayLabel(at)}, open schedule`}
            style={({ pressed }) => [styles.photoCard, pressed && styles.photoPressed]}
          >
            <ImageBackground source={TRUCK_PHOTO} style={styles.photoBg} resizeMode="cover">
              <LinearGradient
                colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.78)']}
                locations={[0, 0.4, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.photoChip}>
                <CalendarDays size={13} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.photoChipText}>
                  {upcoming.kind === 'recurring' ? 'Weekly pickup' : 'Scheduled pickup'}
                </Text>
              </View>
              <View style={styles.photoBottom}>
                <View style={styles.flex}>
                  <Text style={styles.photoTitle}>{dayLabel(at)}</Text>
                  <Text style={styles.photoSub} numberOfLines={1}>
                    {dateStr} · {formatTime(at)} · {wasteMeta(upcoming.wasteType).label}
                  </Text>
                </View>
                <View style={styles.photoArrow}>
                  <ArrowUpRight size={18} color="#FFFFFF" strokeWidth={2} />
                </View>
              </View>
            </ImageBackground>
          </Pressable>
        );
      })()}

      {/* ── Quick actions ── */}
      <View style={styles.quickRow}>
        {quickActions.map((a) => (
          <Pressable
            key={a.label}
            onPress={a.onPress}
            style={({ pressed }) => [styles.quick, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={a.label}
          >
            <IconTile icon={a.icon} tone="neutral" size={46} round />
            <Text style={styles.quickLabel}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* ── Impact ── */}
      <SectionHeader
        title="Your impact"
        meta={`${stats.completedCount} pickup${stats.completedCount === 1 ? '' : 's'}`}
      />
      <Card style={styles.impactCard}>
        <View style={styles.ringCol}>
          <ProgressRing
            progress={stats.totalKg / GOALS.totalKg}
            value={`${stats.totalKg}`}
            unit="kg"
          />
          <Text style={styles.ringLabel}>Collected</Text>
        </View>
        <View style={styles.ringCol}>
          <ProgressRing
            progress={stats.co2OffsetKg / GOALS.co2OffsetKg}
            value={`${stats.co2OffsetKg}`}
            unit="kg"
            color={ui.blue}
          />
          <Text style={styles.ringLabel}>CO₂ saved</Text>
        </View>
        <View style={styles.ringCol}>
          <ProgressRing
            progress={stats.points / GOALS.points}
            value={stats.points.toLocaleString('en-US')}
            unit="pts"
            color={ui.amber}
          />
          <Text style={styles.ringLabel}>Points</Text>
        </View>
      </Card>

      {/* ── Recent activity ── */}
      <SectionHeader title="Recent activity" />
      <Card style={styles.listCard}>
        {activity.length === 0 ? (
          <View style={styles.empty}>
            <IconTile icon={History} tone="neutral" round />
            <Text style={styles.emptyText}>
              No activity yet. Your first pickup will show up here.
            </Text>
          </View>
        ) : (
          activity.map((item, idx) => (
            <ListRow
              key={item.id}
              left={<IconTile icon={item.icon} tone={item.tone} size={42} />}
              title={item.title}
              subtitle={item.sub}
              right={<Text style={styles.time}>{timeAgo(item.at)}</Text>}
              divider={idx < activity.length - 1}
            />
          ))
        )}
      </Card>
    </Screen>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  muted: { fontFamily: Fonts.regular, fontSize: 12.5, color: ui.textMuted, flexShrink: 1 },
  body: { fontFamily: Fonts.medium, fontSize: 14, color: ui.text },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4 },
  greeting: { fontFamily: Fonts.regular, fontSize: 14, color: ui.textMuted },
  name: { fontFamily: Fonts.bold, fontSize: 24, color: ui.text, letterSpacing: -0.4, marginTop: 1 },

  // Request card
  sideCard: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingRight: 12 },
  sideText: { flex: 1, minWidth: 0 },
  sideLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'stretch',
    backgroundColor: ui.well,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    height: 36,
    marginTop: 14,
  },
  sideLocationText: { fontFamily: Fonts.medium, fontSize: 12.5, color: ui.text },
  sideButton: { marginTop: 12, alignSelf: 'stretch', paddingHorizontal: 12 },
  sideBin: { marginBottom: -4 },

  eyebrow: { fontFamily: Fonts.medium, fontSize: 12.5, color: ui.textMuted, marginBottom: 6 },
  heroTitle: {
    fontFamily: Fonts.bold,
    fontSize: 25,
    lineHeight: 31,
    color: ui.text,
    letterSpacing: -0.5,
  },

  // Collector
  collectorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  collectorName: { fontFamily: Fonts.semiBold, fontSize: 16.5, color: ui.text },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ui.amberSoft,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  ratingText: { fontFamily: Fonts.bold, fontSize: 12, color: ui.text },
  etaWell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ui.accentSoft,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 16,
  },
  etaText: { fontFamily: Fonts.semiBold, fontSize: 13.5, color: ui.accentDeep },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },

  // Upcoming pickup: photo card (always dark overlay, so text stays white in both themes)
  photoCard: { borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: '#1B2420' },
  photoPressed: { opacity: 0.92 },
  photoBg: { height: 164, justifyContent: 'space-between', padding: 14 },
  photoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  photoChipText: { fontFamily: Fonts.semiBold, fontSize: 11.5, color: '#FFFFFF' },
  photoBottom: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  photoTitle: { fontFamily: Fonts.bold, fontSize: 21, color: '#FFFFFF', letterSpacing: -0.3 },
  photoSub: { fontFamily: Fonts.medium, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  photoArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quick actions
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  quick: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    backgroundColor: ui.surface,
  },
  quickLabel: { fontFamily: Fonts.medium, fontSize: 12, color: ui.text },

  // Impact
  impactCard: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20 },
  ringCol: { flex: 1, alignItems: 'center', gap: 10 },
  ringLabel: { fontFamily: Fonts.medium, fontSize: 12, color: ui.textMuted },

  // Activity
  listCard: { paddingVertical: 6 },
  time: { fontFamily: Fonts.medium, fontSize: 11.5, color: ui.textFaint },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 20 },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: ui.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 240,
  },
});
