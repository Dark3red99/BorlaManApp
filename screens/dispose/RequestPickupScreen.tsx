import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import * as pickupService from '../../services/pickupService';
import type { GeoPoint, PriceQuote, WasteType } from '../../types/models';
import type { RootStackScreenProps } from '../../types/navigation';
import WasteDetailsStep from './steps/WasteDetailsStep';
import LocationStep from './steps/LocationStep';
import ScheduleStep from './steps/ScheduleStep';
import ReviewStep from './steps/ReviewStep';

const PRIMARY = '#059669';
const BG      = '#F3F8F5';
const WHITE   = '#FFFFFF';
const TEXT    = '#0F172A';
const MUTED   = '#64748B';

// Everything the wizard collects before the request is created.
export type PickupDraft = {
  wasteType: WasteType | null;
  volumeKg: number | null;
  photos: string[];
  location: GeoPoint | null;
  addressText: string;
  asap: boolean;
  scheduledFor: string | null; // ISO, set when not ASAP
};

const INITIAL_DRAFT: PickupDraft = {
  wasteType: null,
  volumeKg: null,
  photos: [],
  location: null,
  addressText: '',
  asap: true,
  scheduledFor: null,
};

const STEP_TITLES = ['Waste Details', 'Pickup Location', 'Pickup Time', 'Review & Confirm'];

export default function RequestPickupScreen({ navigation }: RootStackScreenProps<'RequestPickup'>) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<PickupDraft>(INITIAL_DRAFT);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const patchDraft = (patch: Partial<PickupDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const goBack = () => {
    if (step === 0) navigation.goBack();
    else setStep((s) => s - 1);
  };

  // Android hardware back mirrors the header back button (step back, not screen pop).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 0) return false;
      setStep((s) => s - 1);
      return true;
    });
    return () => sub.remove();
  }, [step]);

  // Fresh quote whenever the review step is reached.
  useEffect(() => {
    if (step !== 3 || !draft.location || !draft.wasteType || !draft.volumeKg) return;
    setQuote(null);
    pickupService
      .getQuote(draft.location, draft.wasteType, draft.volumeKg)
      .then(setQuote)
      .catch(() => Alert.alert('Price estimate failed', 'Please go back and try again.'));
  }, [step, draft.location, draft.wasteType, draft.volumeKg]);

  const stepValid = (() => {
    switch (step) {
      case 0: return draft.wasteType != null && draft.volumeKg != null;
      case 1: return draft.location != null && draft.addressText.trim().length > 0;
      case 2: return draft.asap || draft.scheduledFor != null;
      case 3: return quote != null && !submitting;
      default: return false;
    }
  })();

  const onNext = async () => {
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    if (!user || !draft.wasteType || !draft.volumeKg || !draft.location || !quote) return;
    setSubmitting(true);
    try {
      const request = await pickupService.createRequest({
        userId: user.id,
        wasteType: draft.wasteType,
        volumeKg: draft.volumeKg,
        photos: draft.photos,
        location: draft.location,
        addressText: draft.addressText.trim(),
        scheduledFor: draft.asap ? new Date().toISOString() : draft.scheduledFor!,
        priceGhs: quote.priceGhs,
      });
      navigation.replace('TrackPickup', { requestId: request.id });
    } catch (e) {
      setSubmitting(false);
      Alert.alert('Request failed', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── Header with progress ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepCount}>Step {step + 1} of 4</Text>
          <Text style={styles.stepTitle}>{STEP_TITLES[step]}</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressBar, { width: `${((step + 1) / 4) * 100}%` }]} />
      </View>

      {/* ── Step body ── */}
      <View style={{ flex: 1 }}>
        {step === 0 && <WasteDetailsStep draft={draft} onChange={patchDraft} />}
        {step === 1 && <LocationStep draft={draft} onChange={patchDraft} />}
        {step === 2 && <ScheduleStep draft={draft} onChange={patchDraft} />}
        {step === 3 && <ReviewStep draft={draft} quote={quote} />}
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !stepValid && styles.nextBtnDisabled]}
          onPress={onNext}
          disabled={!stepValid}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={WHITE} />
          ) : (
            <Text style={styles.nextBtnText}>
              {step < 3 ? 'Continue' : quote ? `Request Pickup • GH₵ ${quote.priceGhs.toFixed(2)}` : 'Request Pickup'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  backBtn: {
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
  stepCount: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: MUTED,
  },
  stepTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: TEXT,
    lineHeight: 24,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 20,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: PRIMARY,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: BG,
  },
  nextBtn: {
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
  nextBtnDisabled: {
    backgroundColor: '#A7CDBF',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: WHITE,
  },
});
