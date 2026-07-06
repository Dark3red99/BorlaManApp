import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import * as pickupService from '../../services/pickupService';
import type { Collector, CollectionRequest, PaymentMethod } from '../../types/models';
import type { RootStackScreenProps } from '../../types/navigation';
import { wasteMeta } from '../../constants/waste';

const PRIMARY = '#059669';
const BG      = '#F3F8F5';
const WHITE   = '#FFFFFF';
const TEXT    = '#0F172A';
const MUTED   = '#64748B';
const AMBER   = '#F59E0B';

const METHODS: { method: PaymentMethod; label: string; sub: string; icon: string }[] = [
  { method: 'momo', label: 'Mobile Money', sub: 'MTN MoMo / Telecel Cash', icon: 'cellphone' },
  { method: 'card', label: 'Card', sub: 'Visa / Mastercard', icon: 'credit-card-outline' },
  { method: 'cash', label: 'Cash', sub: 'Pay the collector directly', icon: 'cash' },
];

export default function PickupCompleteScreen({ navigation, route }: RootStackScreenProps<'PickupComplete'>) {
  const { requestId } = route.params;
  const { user } = useAuth();
  const [request, setRequest] = useState<CollectionRequest | null>(null);
  const [collector, setCollector] = useState<Collector | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('momo');
  const [paid, setPaid] = useState(false);
  const [paying, setPaying] = useState(false);
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState('');

  useEffect(() => {
    pickupService.getRequest(requestId).then(async (req) => {
      setRequest(req);
      if (req?.collectorId) setCollector(await pickupService.getCollector(req.collectorId));
    });
    pickupService.getPaymentForRequest(requestId).then((p) => {
      if (p) {
        setPaid(true);
        setMethod(p.method);
      }
    });
  }, [requestId]);

  const onPay = async () => {
    if (!request) return;
    setPaying(true);
    // Mock: MoMo/card confirm instantly; the real payment API slots in here.
    await pickupService.recordPayment(request.id, request.priceGhs, method);
    setPaying(false);
    setPaid(true);
  };

  const onDone = async () => {
    if (request && user && collector && stars > 0) {
      await pickupService.submitRating(request.id, user.id, collector.id, stars, review.trim() || undefined);
    }
    navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
  };

  if (!request) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </SafeAreaView>
    );
  }

  const meta = wasteMeta(request.wasteType);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Success header ── */}
        <View style={styles.successBox}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={40} color={WHITE} />
          </View>
          <Text style={styles.successTitle}>Pickup complete!</Text>
          <Text style={styles.successSub}>
            {meta.label} • ~{request.volumeKg} kg collected
          </Text>
          <View style={styles.pointsPill}>
            <MaterialCommunityIcons name="leaf" size={14} color={PRIMARY} />
            <Text style={styles.pointsText}>+{pickupService.pointsForPickup(request.volumeKg)} impact points</Text>
          </View>
        </View>

        {/* ── Receipt ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Receipt</Text>
          <View style={styles.receiptLine}>
            <Text style={styles.receiptLabel}>Pickup point</Text>
            <Text style={styles.receiptValue} numberOfLines={1}>{request.addressText}</Text>
          </View>
          {collector && (
            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>Collector</Text>
              <Text style={styles.receiptValue}>{collector.name}</Text>
            </View>
          )}
          <View style={styles.receiptLine}>
            <Text style={styles.receiptLabel}>Completed</Text>
            <Text style={styles.receiptValue}>
              {new Date(request.completedAt ?? request.createdAt).toLocaleString('en-GB', {
                day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>GH₵ {request.priceGhs.toFixed(2)}</Text>
          </View>
        </View>

        {/* ── Payment ── */}
        <View style={styles.card}>
          <View style={styles.payHeader}>
            <Text style={styles.cardTitle}>Payment</Text>
            {paid && (
              <View style={styles.paidBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                <Text style={styles.paidText}>Paid</Text>
              </View>
            )}
          </View>
          {METHODS.map((m) => {
            const selected = method === m.method;
            return (
              <TouchableOpacity
                key={m.method}
                style={[styles.methodRow, selected && styles.methodSelected, paid && { opacity: selected ? 1 : 0.45 }]}
                onPress={() => !paid && setMethod(m.method)}
                disabled={paid}
                activeOpacity={0.8}
              >
                <View style={[styles.methodIcon, selected && { backgroundColor: PRIMARY }]}>
                  <MaterialCommunityIcons name={m.icon as any} size={20} color={selected ? WHITE : PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodLabel}>{m.label}</Text>
                  <Text style={styles.methodSub}>{m.sub}</Text>
                </View>
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selected ? PRIMARY : MUTED}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Rating ── */}
        {collector && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rate {collector.name.split(' ')[0]}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setStars(s)} activeOpacity={0.7}>
                  <Ionicons
                    name={s <= stars ? 'star' : 'star-outline'}
                    size={34}
                    color={s <= stars ? AMBER : '#CBD5E1'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Add a comment (optional)"
              placeholderTextColor="#94A3B8"
              value={review}
              onChangeText={setReview}
              multiline
            />
          </View>
        )}

        <View style={{ height: 4 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.mainBtn}
          onPress={paid ? onDone : onPay}
          disabled={paying}
          activeOpacity={0.85}
        >
          {paying ? (
            <ActivityIndicator color={WHITE} />
          ) : (
            <Text style={styles.mainBtnText}>
              {paid ? 'Done' : `Pay GH₵ ${request.priceGhs.toFixed(2)}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingTop: 20,
  },

  // ── Success header ──
  successBox: {
    alignItems: 'center',
    marginBottom: 18,
  },
  checkCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  successTitle: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 22,
    color: TEXT,
  },
  successSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
  },
  pointsText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#047857',
  },

  // ── Cards ──
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
  cardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: TEXT,
    marginBottom: 10,
  },
  receiptLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 5,
  },
  receiptLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: MUTED,
  },
  receiptValue: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: TEXT,
    flexShrink: 1,
    textAlign: 'right',
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

  // ── Payment ──
  payHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 10,
  },
  paidText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#16A34A',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#DCE8E1',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  methodSelected: {
    borderColor: PRIMARY,
    backgroundColor: '#ECFDF5',
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: TEXT,
  },
  methodSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: MUTED,
    marginTop: 1,
  },

  // ── Rating ──
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  reviewInput: {
    backgroundColor: '#F6FAF8',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DCE8E1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: BG,
  },
  mainBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#047857',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  mainBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: WHITE,
  },
});
