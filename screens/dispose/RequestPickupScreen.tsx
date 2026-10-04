import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, ChevronLeft } from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import * as pickupService from '../../services/pickupService';
import type { GeoPoint, PriceQuote, WasteType } from '../../types/models';
import type { RootStackScreenProps } from '../../types/navigation';
import { Fonts, Radius, type Palette } from '../../constants/theme';
import { Button, IconButton } from '../../components/ui';
import { pickupPrice } from '../../constants/pricing';
import WasteDetailsStep from './steps/WasteDetailsStep';
import LocationStep from './steps/LocationStep';
import ScheduleStep from './steps/ScheduleStep';
import ReviewStep from './steps/ReviewStep';

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

const STEP_TITLES = ['Waste details', 'Pickup location', 'Pickup time', 'Review & confirm'];
const STEP_COUNT = STEP_TITLES.length;

export default function RequestPickupScreen({ navigation }: RootStackScreenProps<'RequestPickup'>) {
  const { user } = useAuth();
  const { ui } = useTheme();
  const styles = useThemedStyles(makeStyles);
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
      .getQuote(draft.location, draft.wasteType, draft.volumeKg, draft.asap)
      .then(setQuote)
      .catch(() => Alert.alert('Price estimate failed', 'Please go back and try again.'));
  }, [step, draft.location, draft.wasteType, draft.volumeKg, draft.asap]);

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

  // Running price in the CTA from the moment type + size are known, so the
  // total is never a surprise at the review step.
  const livePrice =
    draft.wasteType && draft.volumeKg
      ? pickupPrice(draft.volumeKg, draft.wasteType, step >= 2 && draft.asap).totalGhs // ASAP fee only once the time step is reached
      : null;
  const ctaLabel =
    step < 3
      ? livePrice != null ? `Continue · GH₵ ${livePrice}` : 'Continue'
      : quote ? `Request pickup · GH₵ ${quote.priceGhs}` : 'Request pickup';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle={ui.dark ? 'light-content' : 'dark-content'} backgroundColor={ui.bg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={step === 0 ? 'Close' : 'Previous step'} onPress={goBack} />
        <View style={styles.headerText}>
          <Text style={styles.stepCount}>Step {step + 1} of {STEP_COUNT}</Text>
          <Text style={styles.stepTitle}>{STEP_TITLES[step]}</Text>
        </View>
        {/* spacer keeps the title centred against the back button */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Segmented progress: one bar per step */}
      <View style={styles.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: STEP_COUNT, now: step + 1 }}>
        {STEP_TITLES.map((t, i) => (
          <View key={t} style={[styles.segment, i <= step && styles.segmentDone]} />
        ))}
      </View>

      {/* ── Step body ── */}
      <View style={styles.body}>
        {step === 0 && <WasteDetailsStep draft={draft} onChange={patchDraft} />}
        {step === 1 && <LocationStep draft={draft} onChange={patchDraft} />}
        {step === 2 && <ScheduleStep draft={draft} onChange={patchDraft} />}
        {step === 3 && <ReviewStep draft={draft} quote={quote} />}
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        {submitting ? (
          <View style={styles.submitting}>
            <ActivityIndicator color={ui.onAccent} />
          </View>
        ) : (
          <Button
            label={ctaLabel}
            icon={step < 3 ? ArrowRight : undefined}
            onPress={onNext}
            disabled={!stepValid}
            style={!stepValid && styles.ctaDisabled}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: ui.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 14,
    },
    headerText: { flex: 1, alignItems: 'center' },
    headerSpacer: { width: 44 },
    stepCount: { fontFamily: Fonts.medium, fontSize: 12, color: ui.textMuted },
    stepTitle: {
      fontFamily: Fonts.bold,
      fontSize: 18,
      lineHeight: 24,
      color: ui.text,
      letterSpacing: -0.2,
    },
    progress: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: 4 },
    segment: { flex: 1, height: 4, borderRadius: Radius.pill, backgroundColor: ui.wellStrong },
    segmentDone: { backgroundColor: ui.accent },
    body: { flex: 1 },
    footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, backgroundColor: ui.bg },
    ctaDisabled: { opacity: 0.4, shadowOpacity: 0, elevation: 0 },
    submitting: {
      height: 54,
      borderRadius: Radius.pill,
      backgroundColor: ui.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
