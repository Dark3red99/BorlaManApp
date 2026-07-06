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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import * as pickupService from '../../services/pickupService';
import type { GeoPoint, WasteType } from '../../types/models';
import type { RootStackScreenProps } from '../../types/navigation';
import { WASTE_TYPES, SIZE_BANDS } from '../../constants/waste';
import {
  PICKUP_SLOT_HOURS,
  slotLabel,
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
  WEEKDAYS_MON_FIRST,
} from '../../constants/schedule';

const PRIMARY = '#059669';
const BG      = '#F3F8F5';
const WHITE   = '#FFFFFF';
const TEXT    = '#0F172A';
const MUTED   = '#64748B';
const BORDER  = '#DCE8E1';

// Fallback pickup point until the plan form gets its own map step; recurring
// pickups default to the resident's registered address.
const ACCRA_CENTER: GeoPoint = { latitude: 5.6037, longitude: -0.187 };

export default function RecurringPickupScreen({ navigation }: RootStackScreenProps<'RecurringPickup'>) {
  const { user } = useAuth();
  const [wasteType, setWasteType] = useState<WasteType | null>(null);
  const [volumeKg, setVolumeKg] = useState<number | null>(null);
  const [weekday, setWeekday] = useState<number | null>(null);
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
    wasteType != null && volumeKg != null && weekday != null && hour != null &&
    addressText.trim().length > 0;

  const onSave = async () => {
    if (!user || !valid) return;
    setSaving(true);
    try {
      await pickupService.createRecurringPickup({
        userId: user.id,
        wasteType: wasteType!,
        volumeKg: volumeKg!,
        weekday: weekday!,
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
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Recurring Pickup</Text>
          <Text style={styles.subtitle}>Same day, same time, every week</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Waste type ── */}
        <Text style={styles.sectionLabel}>Waste type</Text>
        <View style={styles.typeGrid}>
          {WASTE_TYPES.map((meta) => {
            const selected = wasteType === meta.type;
            return (
              <TouchableOpacity
                key={meta.type}
                style={[styles.typeChip, selected && { borderColor: meta.color, backgroundColor: meta.colorSoft }]}
                onPress={() => setWasteType(meta.type)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name={meta.icon as any} size={18} color={meta.color} />
                <Text style={styles.typeChipLabel}>{meta.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Load size ── */}
        <Text style={styles.sectionLabel}>Usual load</Text>
        <View style={styles.sizeRow}>
          {SIZE_BANDS.map((band) => {
            const selected = volumeKg === band.kg;
            return (
              <TouchableOpacity
                key={band.kg}
                style={[styles.sizeChip, selected && styles.chipSelected]}
                onPress={() => setVolumeKg(band.kg)}
                activeOpacity={0.8}
              >
                <Text style={[styles.sizeChipLabel, selected && { color: WHITE }]}>{band.label}</Text>
                <Text style={[styles.sizeChipHint, selected && { color: 'rgba(255,255,255,0.85)' }]}>
                  {band.hint}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Weekday ── */}
        <Text style={styles.sectionLabel}>Repeat every</Text>
        <View style={styles.weekRow}>
          {WEEKDAYS_MON_FIRST.map((day) => {
            const selected = weekday === day;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.weekChip, selected && styles.chipSelected]}
                onPress={() => setWeekday(day)}
                activeOpacity={0.8}
              >
                <Text style={[styles.weekChipLabel, selected && { color: WHITE }]}>
                  {WEEKDAY_SHORT[day]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Time window ── */}
        <Text style={styles.sectionLabel}>Time window</Text>
        <View style={styles.slotGrid}>
          {PICKUP_SLOT_HOURS.map((slotHour) => {
            const selected = hour === slotHour;
            return (
              <TouchableOpacity
                key={slotHour}
                style={[styles.slotChip, selected && styles.chipSelected]}
                onPress={() => setHour(slotHour)}
                activeOpacity={0.8}
              >
                <Text style={[styles.slotLabel, selected && { color: WHITE }]}>{slotLabel(slotHour)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Address ── */}
        <Text style={styles.sectionLabel}>Pickup address</Text>
        <TextInput
          style={styles.addressInput}
          placeholder="House no., street, area"
          placeholderTextColor="#94A3B8"
          value={addressText}
          onChangeText={setAddressText}
          multiline
        />

        {valid && (
          <View style={styles.summaryBox}>
            <Ionicons name="repeat" size={16} color={PRIMARY} />
            <Text style={styles.summaryText}>
              Every {WEEKDAY_LONG[weekday!]}, {slotLabel(hour!)} · ~{volumeKg} kg
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, !valid && styles.saveBtnDisabled]}
          onPress={onSave}
          disabled={!valid || saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={WHITE} />
          ) : (
            <Text style={styles.saveBtnText}>Save Recurring Pickup</Text>
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
    paddingBottom: 6,
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
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: TEXT,
    lineHeight: 24,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: MUTED,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: TEXT,
    marginTop: 14,
    marginBottom: 10,
  },

  // Waste type chips
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typeChipLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: TEXT,
  },

  // Size chips
  sizeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeChip: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sizeChipLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12.5,
    color: TEXT,
  },
  sizeChipHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: MUTED,
    marginTop: 1,
  },

  chipSelected: {
    borderColor: PRIMARY,
    backgroundColor: PRIMARY,
  },

  // Weekday chips
  weekRow: {
    flexDirection: 'row',
    gap: 6,
  },
  weekChip: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingVertical: 10,
    alignItems: 'center',
  },
  weekChipLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: TEXT,
  },

  // Slot chips
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotChip: {
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  slotLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: TEXT,
  },

  // Address
  addressInput: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: TEXT,
    minHeight: 52,
    textAlignVertical: 'top',
  },

  // Summary
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 18,
  },
  summaryText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12.5,
    color: '#047857',
    flex: 1,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: BG,
  },
  saveBtn: {
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
  saveBtnDisabled: {
    backgroundColor: '#A7CDBF',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: WHITE,
  },
});
