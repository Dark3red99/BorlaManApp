import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { CalendarDays, Zap, type LucideIcon } from 'lucide-react-native';

import type { PickupDraft } from '../RequestPickupScreen';
import { PICKUP_SLOT_HOURS as SLOTS, slotLabel } from '@borlaman/shared/constants/schedule';
import { PRIORITY_FEE_GHS } from '@borlaman/shared/constants/pricing';
import { Elevation, Fonts, Radius, type Palette } from '@borlaman/shared/constants/theme';
import { useTheme, useThemedStyles } from '@borlaman/shared/theme/ThemeContext';
import { IconTile, Pills, Segmented } from '@borlaman/shared/ui';

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

export default function ScheduleStep({ draft, onChange }: Props) {
  const styles = useThemedStyles(makeStyles);

  const days = [0, 1, 2].map((offset) => {
    const date = dayAt(offset);
    return {
      date,
      label:
        offset === 0
          ? 'Today'
          : offset === 1
            ? 'Tomorrow'
            : date.toLocaleDateString('en-GB', { weekday: 'short' }),
      sub: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    };
  });

  const scheduled = draft.scheduledFor ? new Date(draft.scheduledFor) : null;
  const selectedHour = scheduled ? scheduled.getHours() : null;
  // The day is held locally so it stays highlighted before a time is chosen.
  const [dayIdx, setDayIdx] = useState(() => {
    const idx = scheduled ? days.findIndex((d) => d.date.toDateString() === scheduled.toDateString()) : -1;
    return idx >= 0 ? idx : 0;
  });

  const isSlotAvailable = (day: Date, hour: number) => new Date(slotIso(day, hour)) > new Date();

  const pickDay = (idx: number) => {
    setDayIdx(idx);
    // keep the chosen hour if it's still valid on the new day, else clear it
    const keepHour = selectedHour != null && isSlotAvailable(days[idx].date, selectedHour);
    onChange({ asap: false, scheduledFor: keepHour ? slotIso(days[idx].date, selectedHour!) : null });
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View>
        <Text style={styles.sectionTitle}>When should we come?</Text>
        <Text style={styles.sectionHint}>Scheduling ahead is cheaper. Collectors plan their rounds around it.</Text>
      </View>

      <ModeCard
        icon={Zap}
        title="As soon as possible"
        sub="The nearest free collector heads to you now"
        fee={`+GH₵ ${PRIORITY_FEE_GHS}`}
        selected={draft.asap}
        onPress={() => onChange({ asap: true, scheduledFor: null })}
      />
      <ModeCard
        icon={CalendarDays}
        title="Schedule for later"
        sub="Pick a day and a time window"
        fee="No extra fee"
        selected={!draft.asap}
        onPress={() => onChange({ asap: false })}
      />

      {!draft.asap && (
        <>
          <Text style={[styles.sectionTitle, styles.sectionGap]}>Day</Text>
          <Segmented
            options={days.map((day, idx) => ({ key: idx, label: day.label, sub: day.sub }))}
            value={dayIdx}
            onChange={pickDay}
          />

          <Text style={[styles.sectionTitle, styles.sectionGap]}>Time window</Text>
          <Pills
            options={SLOTS.map((hour) => ({
              key: hour,
              label: slotLabel(hour),
              disabled: !isSlotAvailable(days[dayIdx].date, hour),
            }))}
            isSelected={(hour) => selectedHour === hour}
            onPress={(hour) => onChange({ asap: false, scheduledFor: slotIso(days[dayIdx].date, hour) })}
          />
        </>
      )}
    </ScrollView>
  );
}

function ModeCard({
  icon,
  title,
  sub,
  fee,
  selected,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  sub: string;
  fee: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { ui } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}, ${fee}`}
      style={({ pressed }) => [styles.mode, selected && styles.modeSelected, pressed && styles.pressed]}
    >
      <IconTile icon={icon} tone={selected ? 'solid' : 'accent'} size={44} />
      <View style={styles.modeText}>
        <Text style={styles.modeTitle}>{title}</Text>
        <Text style={styles.modeSub}>{sub}</Text>
      </View>
      <View style={styles.modeRight}>
        <Text style={[styles.fee, selected && { color: ui.accent }]}>{fee}</Text>
        <View style={[styles.radio, selected && styles.radioOn]}>
          {selected && <View style={styles.radioDot} />}
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24, gap: 14 },
    pressed: { opacity: 0.85 },
    sectionTitle: { fontFamily: Fonts.semiBold, fontSize: 16, color: ui.text, letterSpacing: -0.1 },
    sectionHint: { fontFamily: Fonts.regular, fontSize: 12.5, color: ui.textMuted, marginTop: 2 },
    sectionGap: { marginTop: 8 },

    mode: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: ui.surface,
      borderRadius: Radius.lg,
      borderWidth: 2,
      borderColor: 'transparent',
      padding: 14,
      ...Elevation.card,
    },
    modeSelected: { borderColor: ui.accent },
    modeText: { flex: 1 },
    modeTitle: { fontFamily: Fonts.semiBold, fontSize: 14.5, color: ui.text },
    modeSub: { fontFamily: Fonts.regular, fontSize: 12, color: ui.textMuted, marginTop: 2 },
    modeRight: { alignItems: 'flex-end', gap: 8 },
    fee: { fontFamily: Fonts.semiBold, fontSize: 12, color: ui.textMuted },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: ui.wellStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOn: { borderColor: ui.accent },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: ui.accent },
  });
