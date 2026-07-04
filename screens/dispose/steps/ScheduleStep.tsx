import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import type { PickupDraft } from '../RequestPickupScreen';

const PRIMARY = '#059669';
const WHITE   = '#FFFFFF';
const TEXT    = '#0F172A';
const MUTED   = '#64748B';
const BORDER  = '#DCE8E1';

// Fixed pickup windows — matches how collectors plan rounds; a full
// time picker isn't needed for the mock.
const SLOTS = [8, 10, 12, 14, 16];

type Props = {
  draft: PickupDraft;
  onChange: (patch: Partial<PickupDraft>) => void;
};

function dayAt(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function slotIso(day: Date, hour: number): string {
  const d = new Date(day);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function slotLabel(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
}

export default function ScheduleStep({ draft, onChange }: Props) {
  const days = [0, 1, 2].map((offset) => {
    const date = dayAt(offset);
    return {
      date,
      label:
        offset === 0
          ? 'Today'
          : offset === 1
            ? 'Tomorrow'
            : date.toLocaleDateString('en-GB', { weekday: 'long' }),
      sub: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    };
  });

  const scheduled = draft.scheduledFor ? new Date(draft.scheduledFor) : null;
  const selectedDayIdx = scheduled
    ? days.findIndex((d) => d.date.toDateString() === scheduled.toDateString())
    : -1;
  const selectedHour = scheduled ? scheduled.getHours() : null;

  const isSlotAvailable = (day: Date, hour: number) => new Date(slotIso(day, hour)) > new Date();

  const pickDay = (idx: number) => {
    // keep the chosen hour if it's still valid on the new day, else clear it
    const keepHour = selectedHour != null && isSlotAvailable(days[idx].date, selectedHour);
    onChange({
      asap: false,
      scheduledFor: keepHour ? slotIso(days[idx].date, selectedHour!) : null,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* ── ASAP ── */}
      <TouchableOpacity
        style={[styles.asapCard, draft.asap && styles.cardSelected]}
        onPress={() => onChange({ asap: true, scheduledFor: null })}
        activeOpacity={0.8}
      >
        <View style={[styles.asapIconBox, draft.asap && { backgroundColor: PRIMARY }]}>
          <MaterialCommunityIcons name="flash" size={24} color={draft.asap ? WHITE : PRIMARY} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.asapTitle}>As soon as possible</Text>
          <Text style={styles.asapSub}>A nearby collector heads to you right away</Text>
        </View>
        <Ionicons
          name={draft.asap ? 'radio-button-on' : 'radio-button-off'}
          size={22}
          color={draft.asap ? PRIMARY : MUTED}
        />
      </TouchableOpacity>

      {/* ── Scheduled ── */}
      <TouchableOpacity
        style={[styles.asapCard, !draft.asap && styles.cardSelected]}
        onPress={() => onChange({ asap: false })}
        activeOpacity={0.8}
      >
        <View style={[styles.asapIconBox, !draft.asap && { backgroundColor: PRIMARY }]}>
          <Ionicons name="calendar-outline" size={22} color={!draft.asap ? WHITE : PRIMARY} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.asapTitle}>Schedule for later</Text>
          <Text style={styles.asapSub}>Pick a day and time window</Text>
        </View>
        <Ionicons
          name={!draft.asap ? 'radio-button-on' : 'radio-button-off'}
          size={22}
          color={!draft.asap ? PRIMARY : MUTED}
        />
      </TouchableOpacity>

      {!draft.asap && (
        <>
          <Text style={styles.sectionLabel}>Day</Text>
          <View style={styles.dayRow}>
            {days.map((day, idx) => {
              const selected = selectedDayIdx === idx;
              return (
                <TouchableOpacity
                  key={day.label}
                  style={[styles.dayChip, selected && styles.chipSelected]}
                  onPress={() => pickDay(idx)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayChipLabel, selected && { color: WHITE }]}>{day.label}</Text>
                  <Text style={[styles.dayChipSub, selected && { color: 'rgba(255,255,255,0.85)' }]}>
                    {day.sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Time window</Text>
          <View style={styles.slotGrid}>
            {SLOTS.map((hour) => {
              const day = selectedDayIdx >= 0 ? days[selectedDayIdx].date : days[0].date;
              const available = isSlotAvailable(day, hour);
              const selected = selectedDayIdx >= 0 && selectedHour === hour;
              return (
                <TouchableOpacity
                  key={hour}
                  style={[
                    styles.slotChip,
                    selected && styles.chipSelected,
                    !available && styles.slotDisabled,
                  ]}
                  disabled={!available}
                  onPress={() => {
                    const dayIdx = selectedDayIdx >= 0 ? selectedDayIdx : 0;
                    onChange({ asap: false, scheduledFor: slotIso(days[dayIdx].date, hour) });
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.slotLabel,
                      selected && { color: WHITE },
                      !available && { color: '#B6C2CE' },
                    ]}
                  >
                    {slotLabel(hour)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  asapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: WHITE,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: PRIMARY,
    backgroundColor: '#ECFDF5',
  },
  asapIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  asapTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: TEXT,
  },
  asapSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: MUTED,
    marginTop: 1,
  },
  sectionLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: TEXT,
    marginTop: 10,
    marginBottom: 10,
  },
  dayRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dayChip: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingVertical: 12,
    alignItems: 'center',
  },
  chipSelected: {
    borderColor: PRIMARY,
    backgroundColor: PRIMARY,
  },
  dayChipLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: TEXT,
  },
  dayChipSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: MUTED,
    marginTop: 1,
  },
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
  slotDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  slotLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: TEXT,
  },
});
