import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { wasteMeta } from '../../../constants/waste';
import type { PriceQuote } from '../../../types/models';
import { formatDistance } from '../../../utils/geo';
import type { PickupDraft } from '../RequestPickupScreen';

const PRIMARY = '#059669';
const WHITE   = '#FFFFFF';
const TEXT    = '#0F172A';
const MUTED   = '#64748B';

type Props = {
  draft: PickupDraft;
  quote: PriceQuote | null;
};

export default function ReviewStep({ draft, quote }: Props) {
  const meta = draft.wasteType ? wasteMeta(draft.wasteType) : null;
  const timeText = draft.asap
    ? 'As soon as possible'
    : draft.scheduledFor
      ? new Date(draft.scheduledFor).toLocaleString('en-GB', {
          weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
        })
      : '—';

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* ── Summary ── */}
      <View style={styles.card}>
        {meta && (
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: meta.colorSoft }]}>
              <MaterialCommunityIcons name={meta.icon as any} size={20} color={meta.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Waste</Text>
              <Text style={styles.rowValue}>{meta.label} • ~{draft.volumeKg} kg</Text>
            </View>
          </View>
        )}

        <View style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="location-outline" size={20} color={PRIMARY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Pickup point</Text>
            <Text style={styles.rowValue}>{draft.addressText.trim() || '—'}</Text>
          </View>
        </View>

        <View style={[styles.row, { borderBottomWidth: 0, paddingBottom: 0 }]}>
          <View style={[styles.rowIcon, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="time-outline" size={20} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>When</Text>
            <Text style={styles.rowValue}>{timeText}</Text>
          </View>
        </View>

        {draft.photos.length > 0 && (
          <View style={styles.photoRow}>
            {draft.photos.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.photo} />
            ))}
          </View>
        )}
      </View>

      {/* ── Price estimate ── */}
      <View style={styles.card}>
        <Text style={styles.priceTitle}>Price estimate</Text>
        {!quote ? (
          <View style={styles.quoteLoading}>
            <ActivityIndicator color={PRIMARY} />
            <Text style={styles.quoteLoadingText}>Calculating…</Text>
          </View>
        ) : (
          <>
            <View style={styles.priceLine}>
              <Text style={styles.priceLineLabel}>Base fee</Text>
              <Text style={styles.priceLineValue}>GH₵ {quote.breakdown.baseGhs.toFixed(2)}</Text>
            </View>
            <View style={styles.priceLine}>
              <Text style={styles.priceLineLabel}>Distance ({formatDistance(quote.distanceKm)})</Text>
              <Text style={styles.priceLineValue}>GH₵ {quote.breakdown.distanceGhs.toFixed(2)}</Text>
            </View>
            <View style={styles.priceLine}>
              <Text style={styles.priceLineLabel}>Weight (~{draft.volumeKg} kg)</Text>
              <Text style={styles.priceLineValue}>GH₵ {quote.breakdown.weightGhs.toFixed(2)}</Text>
            </View>
            <View style={styles.priceLine}>
              <Text style={styles.priceLineLabel}>{meta?.label} rate</Text>
              <Text style={styles.priceLineValue}>× {quote.breakdown.typeMultiplier.toFixed(1)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>GH₵ {quote.priceGhs.toFixed(2)}</Text>
            </View>
            <Text style={styles.priceNote}>
              Pay after collection — MoMo, card or cash.
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: MUTED,
  },
  rowValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: TEXT,
    lineHeight: 19,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },

  // ── Price ──
  priceTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: TEXT,
    marginBottom: 10,
  },
  quoteLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  quoteLoadingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: MUTED,
  },
  priceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  priceLineLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: MUTED,
  },
  priceLineValue: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: TEXT,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 8,
    paddingTop: 10,
  },
  totalLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: TEXT,
  },
  totalValue: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 17,
    color: PRIMARY,
  },
  priceNote: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: MUTED,
    marginTop: 8,
  },
});
