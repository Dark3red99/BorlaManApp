import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Switch } from 'react-native';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import * as pickupService from '../services/pickupService';
import type { RecurringPickup, ScheduleItem } from '@borlaman/shared/types/models';
import { sizeBand, wasteMeta } from '@borlaman/shared/constants/waste';
import { REQUEST_STATUS_META, type StatusMeta } from '../constants/requestStatus';
import { slotLabel, WEEKDAY_LONG } from '@borlaman/shared/constants/schedule';
import { addDays, formatTime, isSameDay, toDateKey } from '@borlaman/shared/utils/datetime';
import { Fonts, ICON_STROKE, Radius, type Palette } from '@borlaman/shared/constants/theme';
import { useTheme, useThemedStyles } from '@borlaman/shared/theme/ThemeContext';
import {
  Button,
  Card,
  IconButton,
  IconTile,
  ListRow,
  Pill,
  ScreenHeader,
  SectionHeader,
  wasteIcon,
} from '@borlaman/shared/ui';

const RECURRING_META: StatusMeta = { label: 'Recurring', color: '#7C3AED', colorSoft: '#F3E8FF' };

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Full weeks (Monday-first) covering the given month, padded with adjacent-month days. */
function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const start = addDays(first, -lead);
  const last = new Date(year, month + 1, 0);
  const trail = (7 - ((last.getDay() + 6) % 7) - 1) % 7;
  const total = lead + last.getDate() + trail;
  return Array.from({ length: total }, (_, i) => addDays(start, i));
}

function formatSelectedLabel(selected: Date, today: Date) {
  if (isSameDay(selected, today)) return 'Today';
  if (isSameDay(selected, addDays(today, 1))) return 'Tomorrow';
  if (isSameDay(selected, addDays(today, -1))) return 'Yesterday';
  return selected.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "Every Monday" / "Every other Monday". */
function planCadence(plan: RecurringPickup) {
  return `${plan.frequency === 'biweekly' ? 'Every other' : 'Every'} ${WEEKDAY_LONG[plan.weekday]}`;
}

export default function ScheduleTab() {
  const { ui, soft } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { user } = useAuth();
  const navigation = useNavigation();

  // Lazy state (not useMemo) so "today" is guaranteed stable for the mount.
  const [today] = useState(() => new Date());
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [plans, setPlans] = useState<RecurringPickup[]>([]);

  const grid = useMemo(
    () => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  const load = useCallback(() => {
    if (!user) return;
    const from = grid[0];
    const to = new Date(grid[grid.length - 1]);
    to.setHours(23, 59, 59, 999);
    pickupService.getSchedule(user.id, from.toISOString(), to.toISOString()).then(setItems);
    pickupService.getRecurringPickups(user.id).then(setPlans);
  }, [user, grid]);

  // Reload whenever the tab regains focus (e.g. returning from the plan form)
  // or the visible month changes.
  useFocusEffect(load);

  const itemsByDate = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    for (const item of items) (map[toDateKey(new Date(item.at))] ??= []).push(item);
    return map;
  }, [items]);

  const selectedItems = itemsByDate[toDateKey(selected)] ?? [];
  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const viewingCurrentMonth =
    cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();

  const changeMonth = (delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };

  const jumpToToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelected(today);
  };

  const selectDay = (day: Date) => {
    setSelected(day);
    if (day.getMonth() !== cursor.getMonth() || day.getFullYear() !== cursor.getFullYear()) {
      setCursor(new Date(day.getFullYear(), day.getMonth(), 1));
    }
  };

  const openItem = (item: ScheduleItem) => {
    // Only in-flight requests have a screen to open; recurring occurrences
    // and finished pickups are informational.
    if (item.kind === 'request' && item.requestId && item.status !== 'completed') {
      navigation.navigate('TrackPickup', { requestId: item.requestId });
    }
  };

  const togglePlan = (plan: RecurringPickup, active: boolean) => {
    pickupService.setRecurringActive(plan.id, active).then(load);
  };

  const removePlan = (plan: RecurringPickup) => {
    Alert.alert(
      'Delete recurring pickup?',
      `${planCadence(plan)}, ${slotLabel(plan.hour)} — this can't be undone.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => pickupService.deleteRecurringPickup(plan.id).then(load),
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Schedule"
        subtitle="Track and manage your pickups"
        right={
          <IconButton
            icon={Plus}
            variant="accent"
            accessibilityLabel="Set up a weekly pickup"
            onPress={() => navigation.navigate('RecurringPickup')}
          />
        }
      />

      {/* Calendar */}
      <Card style={styles.calendarCard}>
        <View style={styles.monthRow}>
          <IconButton
            icon={ChevronLeft}
            variant="well"
            size={38}
            accessibilityLabel="Previous month"
            onPress={() => changeMonth(-1)}
          />
          <View style={styles.monthLabelWrap}>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            {!viewingCurrentMonth && (
              <Pressable onPress={jumpToToday} hitSlop={8} accessibilityRole="button">
                <Text style={styles.todayLink}>Today</Text>
              </Pressable>
            )}
          </View>
          <IconButton
            icon={ChevronRight}
            variant="well"
            size={38}
            accessibilityLabel="Next month"
            onPress={() => changeMonth(1)}
          />
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((label, i) => (
            <Text key={`${label}-${i}`} style={styles.weekdayLabel}>{label}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {grid.map((day) => {
            const dayKey = toDateKey(day);
            const inMonth = day.getMonth() === cursor.getMonth();
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selected);
            const dayItems = itemsByDate[dayKey] ?? [];

            return (
              <Pressable
                key={dayKey}
                style={styles.dayCell}
                onPress={() => selectDay(day)}
                accessibilityRole="button"
                accessibilityLabel={day.toDateString()}
                accessibilityState={{ selected: isSelected }}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isToday && !isSelected && styles.dayCircleToday,
                    isSelected && styles.dayCircleSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      !inMonth && styles.dayNumOutside,
                      isToday && !isSelected && styles.dayNumToday,
                      isSelected && styles.dayNumSelected,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </View>
                <View style={styles.dotRow}>
                  {dayItems.slice(0, 3).map((item) => (
                    <View
                      key={item.id}
                      style={[
                        styles.eventDot,
                        { backgroundColor: wasteMeta(item.wasteType).color },
                        !inMonth && styles.eventDotOutside,
                      ]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Weekly plans */}
      {plans.length > 0 && (
        <>
          <SectionHeader title="Pickup plans" meta={`${plans.length}`} />
          <Card style={styles.listCard}>
            {plans.map((plan, idx) => {
              const meta = wasteMeta(plan.wasteType);
              return (
                <ListRow
                  key={plan.id}
                  left={
                    <IconTile icon={wasteIcon(plan.wasteType)} bg={soft(meta.color, meta.colorSoft)} fg={meta.color} size={42} />
                  }
                  title={`${meta.label} · ${sizeBand(plan.volumeKg).short}`}
                  subtitle={`${planCadence(plan)}, ${slotLabel(plan.hour)}${plan.priceGhs ? ` · GH₵ ${plan.priceGhs}` : ''}`}
                  divider={idx < plans.length - 1}
                  right={
                    <View style={styles.planActions}>
                      <Switch
                        value={plan.active}
                        onValueChange={(v) => togglePlan(plan, v)}
                        trackColor={{ false: ui.wellStrong, true: ui.accent }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor={ui.wellStrong}
                      />
                      <Pressable
                        onPress={() => removePlan(plan)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Delete weekly pickup"
                      >
                        <Trash2 size={18} color={ui.textFaint} strokeWidth={ICON_STROKE} />
                      </Pressable>
                    </View>
                  }
                />
              );
            })}
          </Card>
        </>
      )}

      {/* Pickups for the selected day */}
      <SectionHeader
        title={formatSelectedLabel(selected, today)}
        meta={
          selectedItems.length > 0
            ? `${selectedItems.length} pickup${selectedItems.length > 1 ? 's' : ''}`
            : undefined
        }
      />

      {selectedItems.length === 0 ? (
        <Card style={styles.emptyState}>
          <IconTile icon={CalendarDays} tone="neutral" size={56} round />
          <Text style={styles.emptyTitle}>Nothing scheduled</Text>
          <Text style={styles.emptyText}>
            Request a one-off pickup, or tap + to set up a weekly plan.
          </Text>
          <Button label="Request a pickup" size="sm" onPress={() => navigation.navigate('RequestPickup')} />
        </Card>
      ) : (
        <Card style={styles.listCard}>
          {selectedItems.map((item, idx) => {
            const meta = wasteMeta(item.wasteType);
            const status =
              item.kind === 'request' && item.status ? REQUEST_STATUS_META[item.status] : RECURRING_META;
            const tappable = item.kind === 'request' && item.status !== 'completed';
            return (
              <ListRow
                key={item.id}
                left={
                  <IconTile icon={wasteIcon(item.wasteType)} bg={soft(meta.color, meta.colorSoft)} fg={meta.color} size={42} />
                }
                title={`${meta.label} · ${item.volumeKg} kg`}
                subtitle={`${formatTime(new Date(item.at))} · ${item.addressText}`}
                right={<Pill label={status.label} color={status.color} bg={soft(status.color, status.colorSoft)} />}
                chevron={tappable}
                onPress={tappable ? () => openItem(item) : undefined}
                divider={idx < selectedItems.length - 1}
              />
            );
          })}
        </Card>
      )}
    </View>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
  root: { flex: 1, gap: 16 },

  // Calendar
  calendarCard: { paddingHorizontal: 12, paddingVertical: 14 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  monthLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  monthLabel: { fontFamily: Fonts.semiBold, fontSize: 16, color: ui.text },
  todayLink: { fontFamily: Fonts.semiBold, fontSize: 12.5, color: ui.accent },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekdayLabel: {
    flexBasis: '14.28%',
    textAlign: 'center',
    fontFamily: Fonts.medium,
    fontSize: 11.5,
    color: ui.textFaint,
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { flexBasis: '14.28%', alignItems: 'center', paddingVertical: 3 },
  dayCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dayCircleToday: { backgroundColor: ui.accentSoft },
  dayCircleSelected: { backgroundColor: ui.text },
  dayNum: { fontFamily: Fonts.medium, fontSize: 14, color: ui.text },
  dayNumOutside: { color: ui.textFaint },
  dayNumToday: { fontFamily: Fonts.bold, color: ui.accent },
  dayNumSelected: { fontFamily: Fonts.bold, color: ui.surface },
  dotRow: { flexDirection: 'row', gap: 3, height: 5, marginTop: 3, alignItems: 'center' },
  eventDot: { width: 5, height: 5, borderRadius: 2.5 },
  eventDotOutside: { opacity: 0.35 },

  // Lists
  listCard: { paddingVertical: 4, paddingHorizontal: 16 },
  planActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24, borderRadius: Radius.lg },
  emptyTitle: { fontFamily: Fonts.semiBold, fontSize: 16, color: ui.text, marginTop: 14, marginBottom: 4 },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: ui.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
});
