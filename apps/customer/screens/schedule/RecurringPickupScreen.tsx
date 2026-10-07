import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Repeat } from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import { useTheme, useThemedStyles } from '@borlaman/shared/theme/ThemeContext';
import * as pickupService from '../../services/pickupService';
import type { GeoPoint, WasteType } from '@borlaman/shared/types/models';
import type { RootStackScreenProps } from '../../types/navigation';
import { WASTE_TYPES, SIZE_BANDS } from '@borlaman/shared/constants/waste';
import {
  PICKUP_SLOT_HOURS,
  slotLabel,
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
  WEEKDAYS_MON_FIRST,
} from '@borlaman/shared/constants/schedule';
import { Fonts, ICON_STROKE, Radius, type Palette } from '@borlaman/shared/constants/theme';
import { planMonthlyEstimate, planPrice, type PlanFrequency } from '@borlaman/shared/constants/pricing';
import { Button, Card, IconButton, Pills, Segmented, WasteTypeCard } from '@borlaman/shared/ui';

// Fallback pickup point until the plan form gets its own map step; recurring
// pickups default to the resident's registered address.
const ACCRA_CENTER: GeoPoint = { latitude: 5.6037, longitude: -0.187 };

export default function RecurringPickupScreen({ navigation, route }: RootStackScreenProps<'RecurringPickup'>) {
  const { user } = useAuth();
  const { ui } = useTheme();
  const styles = useThemedStyles(makeStyles);
  // Prefilled when arriving from the "Need this every week?" nudge on review.
  const [wasteType, setWasteType] = useState<WasteType | null>(route.params?.wasteType ?? null);
  const [volumeKg, setVolumeKg] = useState<number | null>(route.params?.volumeKg ?? null);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [frequency, setFrequency] = useState<PlanFrequency>('weekly');
  const [hour, setHour] = useState<number | null>(null);
  const [addressText, setAddressText] = useState('');
  const [location, setLocation] = useState<GeoPoint>(ACCRA_CENTER);
  const [saving, setSaving] = useState(false);

  // Prefill the pickup point from the registered address, falling back to the
  // last request's GPS point so collectors head somewhere sensible.
  useEffect(() => {
    if (!user) return;
    const parts = [user.address.addressLine, user.address.area].filter(Boolean);
    if (parts.length) setAddressText(parts.join(', '));
    if (user.address.gps) {
      setLocation(user.address.gps);
      return;
    }
    pickupService.getRequests(user.id).then((requests) => {
      if (requests[0]) {
        setLocation(requests[0].location);
        if (!parts.length) setAddressText(requests[0].addressText);
      }
    });
  }, [user]);

  const valid =
    wasteType != null && volumeKg != null && weekdays.length > 0 && hour != null &&
    addressText.trim().length > 0;

  const perPickup = wasteType && volumeKg ? planPrice(volumeKg, wasteType) : null;
  const monthly =
    perPickup != null && weekdays.length > 0
      ? planMonthlyEstimate(perPickup, weekdays.length, frequency)
      : null;

  const toggleDay = (day: number) =>
    setWeekdays((cur) => (cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day]));

  const daysText = WEEKDAYS_MON_FIRST.filter((d) => weekdays.includes(d))
    .map((d) => (weekdays.length > 2 ? WEEKDAY_SHORT[d] : WEEKDAY_LONG[d]))
    .join(weekdays.length > 2 ? ', ' : ' & ');

  const onSave = async () => {
    if (!user || !valid) return;
    setSaving(true);
    try {
      await pickupService.createRecurringPickup({
        userId: user.id,
        wasteType: wasteType!,
        volumeKg: volumeKg!,
        weekdays,
        frequency,
        hour: hour!,
        location,
        addressText: addressText.trim(),
      });
      navigation.goBack();
    } catch (e) {
      setSaving(false);
      Alert.alert('Could not save plan', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={ui.dark ? 'light-content' : 'dark-content'} backgroundColor={ui.bg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel="Back" onPress={() => navigation.goBack()} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Recurring pickup</Text>
          <Text style={styles.subtitle}>Set it once, we keep coming back</Text>
        </View>
        {/* spacer keeps the title centred against the back button */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Waste type ── */}
        <View>
          <Text style={styles.sectionTitle}>What gets collected?</Text>
          <Text style={styles.sectionHint}>Pick what you usually put out each week.</Text>
        </View>
        <View style={styles.typeGrid}>
          {WASTE_TYPES.map((meta) => (
            <WasteTypeCard
              key={meta.type}
              meta={meta}
              selected={wasteType === meta.type}
              onPress={() => setWasteType(meta.type)}
            />
          ))}
        </View>

        {/* ── Load size ── */}
        <View>
          <Text style={styles.sectionTitle}>Usual load</Text>
          <Text style={styles.sectionHint}>Roughly how much each pickup. Priced per load.</Text>
        </View>
        <Segmented
          options={SIZE_BANDS.map((band) => ({
            key: band.kg,
            label: band.label,
            sub: `GH₵ ${planPrice(band.kg, wasteType ?? 'household')}`,
            accessibilityLabel: `${band.label}, ${band.hint}`,
          }))}
          value={volumeKg}
          onChange={setVolumeKg}
        />
        {volumeKg != null && (
          <Text style={styles.sizeHint}>{SIZE_BANDS.find((b) => b.kg === volumeKg)?.hint}</Text>
        )}

        {/* ── Day ── */}
        <View style={styles.sectionGap}>
          <Text style={styles.sectionTitle}>Pickup days</Text>
          <Text style={styles.sectionHint}>Choose one or more. Busy homes often go twice a week.</Text>
        </View>
        <Pills
          layout="row"
          multi
          options={WEEKDAYS_MON_FIRST.map((day) => ({
            key: day,
            label: WEEKDAY_SHORT[day].slice(0, 2),
            accessibilityLabel: WEEKDAY_LONG[day],
          }))}
          isSelected={(day) => weekdays.includes(day)}
          onPress={toggleDay}
        />

        {/* ── Frequency ── */}
        <Text style={[styles.sectionTitle, styles.sectionGap]}>How often</Text>
        <Segmented
          options={[
            { key: 'weekly' as const, label: 'Every week' },
            { key: 'biweekly' as const, label: 'Every 2 weeks' },
          ]}
          value={frequency}
          onChange={setFrequency}
        />

        {/* ── Time window ── */}
        <Text style={[styles.sectionTitle, styles.sectionGap]}>Time window</Text>
        <Pills
          options={PICKUP_SLOT_HOURS.map((h) => ({ key: h, label: slotLabel(h) }))}
          isSelected={(h) => hour === h}
          onPress={setHour}
        />

        {/* ── Address ── */}
        <Text style={[styles.sectionTitle, styles.sectionGap]}>Pickup address</Text>
        <Card style={styles.addressCard}>
          <MapPin size={18} color={ui.accent} strokeWidth={ICON_STROKE} style={styles.addressIcon} />
          <TextInput
            style={styles.addressInput}
            placeholder="House no., street, area"
            placeholderTextColor={ui.textFaint}
            value={addressText}
            onChangeText={setAddressText}
            multiline
          />
        </Card>

        {perPickup != null && (
          <View style={styles.summary}>
            <View style={styles.summaryTop}>
              <View style={styles.summaryIcon}>
                <Repeat size={16} color={ui.onAccent} strokeWidth={2.25} />
              </View>
              <View style={styles.summaryBody}>
                <Text style={styles.summaryPrice}>
                  GH₵ {perPickup} <Text style={styles.summaryUnit}>per pickup</Text>
                </Text>
                {monthly != null && <Text style={styles.summaryText}>About GH₵ {monthly} a month</Text>}
              </View>
            </View>
            {weekdays.length > 0 && hour != null && (
              <Text style={styles.summaryText}>
                {frequency === 'weekly' ? 'Every' : 'Every other'} {daysText}, {slotLabel(hour)}
              </Text>
            )}
            <Text style={styles.summaryNote}>
              You only pay for pickups that happen, after each collection. Pause or cancel any time.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        {saving ? (
          <View style={styles.saving}>
            <ActivityIndicator color={ui.onAccent} />
          </View>
        ) : (
          <Button
            label={perPickup != null ? `Start plan · GH₵ ${perPickup}/pickup` : 'Start plan'}
            onPress={onSave}
            disabled={!valid}
            style={!valid && styles.ctaDisabled}
          />
        )}
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: ui.bg },
    pressed: { opacity: 0.85 },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 10,
    },
    headerText: { flex: 1, alignItems: 'center' },
    headerSpacer: { width: 44 },
    title: { fontFamily: Fonts.bold, fontSize: 18, lineHeight: 24, color: ui.text, letterSpacing: -0.2 },
    subtitle: { fontFamily: Fonts.medium, fontSize: 12, color: ui.textMuted },

    scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 14 },
    sectionTitle: { fontFamily: Fonts.semiBold, fontSize: 16, color: ui.text, letterSpacing: -0.1 },
    sectionHint: { fontFamily: Fonts.regular, fontSize: 12.5, color: ui.textMuted, marginTop: 2 },
    sectionGap: { marginTop: 8 },

    // Waste type grid: two columns, see WasteTypeCard
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 12,
      marginBottom: 8,
    },

    sizeHint: {
      fontFamily: Fonts.medium,
      fontSize: 12.5,
      color: ui.accent,
      textAlign: 'center',
      marginTop: -6,
    },

    // Address
    addressCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    addressIcon: { marginTop: 2 },
    addressInput: {
      flex: 1,
      fontFamily: Fonts.regular,
      fontSize: 14,
      color: ui.text,
      minHeight: 44,
      padding: 0,
      textAlignVertical: 'top',
    },

    // Plan price summary
    summary: {
      backgroundColor: ui.accentSoft,
      borderRadius: Radius.lg,
      padding: 14,
      marginTop: 4,
      gap: 8,
    },
    summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    summaryIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: ui.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryBody: { flex: 1 },
    summaryPrice: { fontFamily: Fonts.bold, fontSize: 17, color: ui.accentDeep },
    summaryUnit: { fontFamily: Fonts.medium, fontSize: 13 },
    summaryText: { fontFamily: Fonts.semiBold, fontSize: 13, color: ui.accentDeep },
    summaryNote: { fontFamily: Fonts.regular, fontSize: 11.5, color: ui.accentDeep, lineHeight: 16 },

    // Footer
    footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, backgroundColor: ui.bg },
    ctaDisabled: { opacity: 0.4, shadowOpacity: 0, elevation: 0 },
    saving: {
      height: 54,
      borderRadius: Radius.pill,
      backgroundColor: ui.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
