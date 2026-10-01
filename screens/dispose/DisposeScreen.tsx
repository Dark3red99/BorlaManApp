import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowUpRight,
  Banknote,
  Camera,
  ClipboardList,
  Navigation,
  Truck,
  type LucideIcon,
} from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import * as pickupService from '../../services/pickupService';
import type { CollectionRequest } from '../../types/models';
import { wasteMeta } from '../../constants/waste';
import { REQUEST_STATUS_META } from '../../constants/requestStatus';
import { Fonts, ICON_STROKE, Radius, type Palette } from '../../constants/theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import {
  Button,
  Card,
  IconTile,
  ListRow,
  Pill,
  Screen,
  ScreenHeader,
  SectionHeader,
  wasteIcon,
} from '../../components/ui';

const PERKS: { icon: LucideIcon; label: string }[] = [
  { icon: Camera, label: 'Snap a photo' },
  { icon: Banknote, label: 'Price upfront' },
  { icon: Navigation, label: 'Live tracking' },
];

export default function DisposeScreen({ navigation }: any) {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
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
    <Screen>
      <ScreenHeader title="Dispose" subtitle="An aboboyaa pickup, right to your door" />

      {active && activeStatus ? (
        <Card onPress={() => navigation.navigate('TrackPickup', { requestId: active.id })} accessibilityLabel="Track your pickup">
          <View style={styles.rowBetween}>
            <Text style={styles.eyebrow}>Pickup in progress</Text>
            <Pill label={activeStatus.label} color={activeStatus.color} bg={soft(activeStatus.color, activeStatus.colorSoft)} dot />
          </View>
          <View style={styles.activeBody}>
            <IconTile
              icon={wasteIcon(active.wasteType)}
              bg={soft(wasteMeta(active.wasteType).color, wasteMeta(active.wasteType).colorSoft)}
              fg={wasteMeta(active.wasteType).color}
              size={52}
            />
            <View style={styles.flex}>
              <Text style={styles.activeTitle}>
                {wasteMeta(active.wasteType).label} · {active.volumeKg} kg
              </Text>
              <Text style={styles.muted} numberOfLines={1}>{active.addressText}</Text>
            </View>
          </View>
          <Button
            label="Track pickup"
            icon={ArrowUpRight}
            size="sm"
            style={styles.topGap}
            onPress={() => navigation.navigate('TrackPickup', { requestId: active.id })}
          />
        </Card>
      ) : (
        <Card>
          <View style={styles.ctaTop}>
            <IconTile icon={Truck} tone="solid" size={56} round />
            <View style={styles.flex}>
              <Text style={styles.ctaTitle}>Request a pickup</Text>
              <Text style={styles.muted}>A nearby collector comes to you.</Text>
            </View>
          </View>

          <View style={styles.perks}>
            {PERKS.map(({ icon: Icon, label }) => (
              <View key={label} style={styles.perk}>
                <Icon size={18} color={ui.text} strokeWidth={ICON_STROKE} />
                <Text style={styles.perkText}>{label}</Text>
              </View>
            ))}
          </View>

          <Button label="Start request" icon={ArrowUpRight} onPress={() => navigation.navigate('RequestPickup')} />
        </Card>
      )}

      <SectionHeader title="Recent pickups" />
      <Card style={styles.listCard}>
        {history.length === 0 ? (
          <View style={styles.empty}>
            <IconTile icon={ClipboardList} tone="neutral" round />
            <Text style={styles.emptyText}>No pickups yet. Completed requests will appear here.</Text>
          </View>
        ) : (
          history.map((item, idx) => {
            const meta = wasteMeta(item.wasteType);
            const status = REQUEST_STATUS_META[item.status];
            return (
              <ListRow
                key={item.id}
                left={<IconTile icon={wasteIcon(item.wasteType)} bg={soft(meta.color, meta.colorSoft)} fg={meta.color} size={42} />}
                title={`${meta.label} · ${item.volumeKg} kg`}
                subtitle={new Date(item.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                right={
                  <View style={styles.historyRight}>
                    <Text style={styles.price}>GH₵ {item.priceGhs.toFixed(2)}</Text>
                    <Pill label={status.label} color={status.color} bg={soft(status.color, status.colorSoft)} />
                  </View>
                }
                divider={idx < history.length - 1}
              />
            );
          })
        )}
      </Card>
    </Screen>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
  flex: { flex: 1 },
  topGap: { marginTop: 16 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontFamily: Fonts.medium, fontSize: 12.5, color: ui.textMuted },
  muted: { fontFamily: Fonts.regular, fontSize: 13, color: ui.textMuted, marginTop: 2 },

  // Active pickup
  activeBody: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 },
  activeTitle: { fontFamily: Fonts.semiBold, fontSize: 16, color: ui.text },

  // Request CTA
  ctaTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ctaTitle: { fontFamily: Fonts.bold, fontSize: 19, color: ui.text, letterSpacing: -0.3 },
  perks: { flexDirection: 'row', gap: 8, marginTop: 18, marginBottom: 16 },
  perk: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    backgroundColor: ui.well,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  perkText: { fontFamily: Fonts.medium, fontSize: 11.5, color: ui.text, textAlign: 'center' },

  // History
  listCard: { paddingVertical: 4, paddingHorizontal: 16 },
  historyRight: { alignItems: 'flex-end', gap: 6 },
  price: { fontFamily: Fonts.semiBold, fontSize: 13.5, color: ui.text },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 22 },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: ui.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 240,
  },
});
