import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight, Clock, MapPin, Repeat } from 'lucide-react-native';

import { sizeBand, wasteMeta } from '@borlaman/shared/constants/waste';
import { planPrice } from '@borlaman/shared/constants/pricing';
import type { PriceQuote } from '@borlaman/shared/types/models';
import { Fonts, ICON_STROKE, Radius, type Palette } from '@borlaman/shared/constants/theme';
import { useTheme, useThemedStyles } from '@borlaman/shared/theme/ThemeContext';
import { Card, IconTile, wasteIcon } from '@borlaman/shared/ui';
import type { PickupDraft } from '../RequestPickupScreen';

type Props = {
  draft: PickupDraft;
  quote: PriceQuote | null;
};

export default function ReviewStep({ draft, quote }: Props) {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation();
  const meta = draft.wasteType ? wasteMeta(draft.wasteType) : null;
  const band = draft.volumeKg ? sizeBand(draft.volumeKg) : null;
  const timeText = draft.asap
    ? 'As soon as possible'
    : draft.scheduledFor
      ? new Date(draft.scheduledFor).toLocaleString('en-GB', {
          weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
        })
      : '—';

  // Weekly-plan nudge: same load on a plan is ~25% cheaper per pickup.
  const plan =
    draft.wasteType && draft.volumeKg && quote
      ? planPrice(draft.volumeKg, draft.wasteType)
      : null;
  const savingPct = plan != null && quote ? Math.round((1 - plan / quote.breakdown.sizeGhs) * 100) : 0;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* ── Summary ── */}
      <Card style={styles.card}>
        {meta && band && (
          <Row
            icon={<IconTile icon={wasteIcon(meta.type)} bg={soft(meta.color, meta.colorSoft)} fg={meta.color} size={40} />}
            label="Waste"
            value={`${meta.label} · ${band.label} (${band.short})`}
          />
        )}
        <Row
          icon={<IconTile icon={MapPin} tone="accent" size={40} />}
          label="Pickup point"
          value={draft.addressText.trim() || '—'}
        />
        <Row icon={<IconTile icon={Clock} tone="blue" size={40} />} label="When" value={timeText} last />

        {draft.photos.length > 0 && (
          <View style={styles.photoRow}>
            {draft.photos.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.photo} />
            ))}
          </View>
        )}
      </Card>

      {/* ── Price ── */}
      <Card style={styles.card}>
        <Text style={styles.priceTitle}>Price</Text>
        {!quote || !band || !meta ? (
          <View style={styles.quoteLoading}>
            <ActivityIndicator color={ui.accent} />
            <Text style={styles.muted}>Calculating…</Text>
          </View>
        ) : (
          <>
            <PriceLine
              label={`${band.label} load · ${band.short}`}
              value={`GH₵ ${quote.breakdown.sizeGhs}`}
            />
            {quote.breakdown.typeMultiplier !== 1 && (
              <PriceLine
                label={`${meta.label} rate (×${quote.breakdown.typeMultiplier})`}
                value="included"
                muted
              />
            )}
            {quote.breakdown.priorityGhs > 0 && (
              <PriceLine label="Priority pickup" value={`GH₵ ${quote.breakdown.priorityGhs}`} />
            )}
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>GH₵ {quote.priceGhs}</Text>
            </View>
            <Text style={styles.priceNote}>
              Pay after collection with MoMo, card or cash. No sign-up or hidden fees.
            </Text>
          </>
        )}
      </Card>

      {/* ── Weekly plan nudge ── */}
      {plan != null && savingPct > 0 && (
        <Pressable
          onPress={() =>
            navigation.navigate('RecurringPickup', {
              wasteType: draft.wasteType!,
              volumeKg: draft.volumeKg!,
            })
          }
          accessibilityRole="button"
          style={({ pressed }) => [styles.nudge, pressed && styles.pressed]}
        >
          <IconTile icon={Repeat} tone="solid" size={40} round />
          <View style={styles.nudgeText}>
            <Text style={styles.nudgeTitle}>Need this every week?</Text>
            <Text style={styles.nudgeSub}>
              GH₵ {plan} per pickup on a weekly plan, about {savingPct}% less. Pay only for pickups done.
            </Text>
          </View>
          <ChevronRight size={18} color={ui.accentDeep} strokeWidth={ICON_STROKE} />
        </Pressable>
      )}
    </ScrollView>
  );
}

function Row({ icon, label, value, last }: { icon: React.ReactNode; label: string; value: string; last?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      {icon}
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

function PriceLine({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.priceLine}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={[styles.priceValue, muted && styles.priceValueMuted]}>{value}</Text>
    </View>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24, gap: 14 },
    pressed: { opacity: 0.85 },
    card: { padding: 16 },
    muted: { fontFamily: Fonts.regular, fontSize: 13, color: ui.textMuted },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: ui.hairline,
    },
    rowLast: { borderBottomWidth: 0, paddingBottom: 0 },
    rowText: { flex: 1 },
    rowLabel: { fontFamily: Fonts.regular, fontSize: 11.5, color: ui.textMuted },
    rowValue: { fontFamily: Fonts.semiBold, fontSize: 14, color: ui.text, lineHeight: 19 },
    photoRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    photo: { width: 64, height: 64, borderRadius: Radius.sm },

    priceTitle: { fontFamily: Fonts.semiBold, fontSize: 16, color: ui.text, marginBottom: 8 },
    quoteLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    priceLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
    priceValue: { fontFamily: Fonts.medium, fontSize: 13, color: ui.text },
    priceValueMuted: { color: ui.textFaint },
    totalLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: ui.hairline,
      marginTop: 8,
      paddingTop: 12,
    },
    totalLabel: { fontFamily: Fonts.bold, fontSize: 15, color: ui.text },
    totalValue: { fontFamily: Fonts.extraBold, fontSize: 20, color: ui.accent },
    priceNote: { fontFamily: Fonts.regular, fontSize: 11.5, color: ui.textMuted, marginTop: 10 },

    nudge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: ui.accentSoft,
      borderRadius: Radius.lg,
      padding: 14,
    },
    nudgeText: { flex: 1 },
    nudgeTitle: { fontFamily: Fonts.semiBold, fontSize: 14, color: ui.accentDeep },
    nudgeSub: { fontFamily: Fonts.regular, fontSize: 12, color: ui.accentDeep, marginTop: 2, lineHeight: 17 },
  });
