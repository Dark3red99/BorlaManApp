import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import * as pickupService from '../services/pickupService';
import type { RecurringPickup, ScheduleItem } from '../types/models';
import { wasteMeta } from '../constants/waste';
import { REQUEST_STATUS_META, type StatusMeta } from '../constants/requestStatus';
import { slotLabel, WEEKDAY_LONG } from '../constants/schedule';
import { addDays, formatTime, isSameDay, toDateKey } from '../utils/datetime';

const PRIMARY      = '#059669';
const PRIMARY_SOFT = '#ECFDF5';
const TEXT         = '#0F172A';
const MUTED        = '#64748B';
const BORDER       = '#E7EFEA';
const WHITE        = '#FFFFFF';

const FONT_REGULAR   = 'Poppins_400Regular';
const FONT_MEDIUM    = 'Poppins_500Medium';
const FONT_SEMIBOLD  = 'Poppins_600SemiBold';
const FONT_BOLD      = 'Poppins_700Bold';
const FONT_EXTRABOLD = 'Poppins_800ExtraBold';

const RECURRING_META: StatusMeta = { label: 'Recurring', color: '#7C3AED', colorSoft: '#F3E8FF' };

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

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

export default function ScheduleTab() {
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
      `Every ${WEEKDAY_LONG[plan.weekday]}, ${slotLabel(plan.hour)} — this can't be undone.`,
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Schedule</Text>
          <Text style={styles.subtitle}>Track and manage your pickups</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('RecurringPickup')}
          accessibilityRole="button"
          accessibilityLabel="Set up a recurring pickup"
        >
          <Ionicons name="add" size={24} color={WHITE} />
        </TouchableOpacity>
      </View>

      {/* Calendar card */}
      <View style={styles.calendarCard}>
        <View style={styles.monthRow}>
          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={() => changeMonth(-1)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <Ionicons name="chevron-back" size={18} color={TEXT} />
          </TouchableOpacity>

          <View style={styles.monthLabelWrap}>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            {!viewingCurrentMonth && (
              <TouchableOpacity onPress={jumpToToday} activeOpacity={0.7} accessibilityRole="button">
                <Text style={styles.todayLink}>Today</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={() => changeMonth(1)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <Ionicons name="chevron-forward" size={18} color={TEXT} />
          </TouchableOpacity>
        </View>

        {/* Weekday labels */}
        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((label) => (
            <Text key={label} style={styles.weekdayLabel}>{label}</Text>
          ))}
        </View>

        {/* Day grid */}
        <View style={styles.daysGrid}>
          {grid.map((day) => {
            const dayKey = toDateKey(day);
            const inMonth = day.getMonth() === cursor.getMonth();
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selected);
            const dayItems = itemsByDate[dayKey] ?? [];

            return (
              <TouchableOpacity
                key={dayKey}
                style={styles.dayCell}
                onPress={() => selectDay(day)}
                activeOpacity={0.7}
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
                        { backgroundColor: isSelected ? PRIMARY : wasteMeta(item.wasteType).color },
                        !inMonth && styles.eventDotOutside,
                      ]}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Recurring plans */}
      {plans.length > 0 && (
        <View style={styles.plansCard}>
          <Text style={styles.plansTitle}>Recurring plans</Text>
          {plans.map((plan, idx) => {
            const meta = wasteMeta(plan.wasteType);
            return (
              <View
                key={plan.id}
                style={[styles.planRow, idx < plans.length - 1 && styles.planRowBorder]}
              >
                <View style={[styles.planIconBox, { backgroundColor: meta.colorSoft }]}>
                  <MaterialCommunityIcons name={meta.icon as any} size={20} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planType}>{meta.label} · ~{plan.volumeKg} kg</Text>
                  <Text style={styles.planMeta}>
                    Every {WEEKDAY_LONG[plan.weekday]}, {slotLabel(plan.hour)}
                  </Text>
                </View>
                <Switch
                  value={plan.active}
                  onValueChange={(v) => togglePlan(plan, v)}
                  trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
                  thumbColor={plan.active ? PRIMARY : '#F1F5F9'}
                />
                <TouchableOpacity
                  onPress={() => removePlan(plan)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Delete recurring pickup"
                  style={styles.planDeleteBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={MUTED} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Pickups for selected day */}
      <View style={styles.listSection}>
        <Text style={styles.sectionLabel}>
          {formatSelectedLabel(selected, today)}
          {selectedItems.length > 0 &&
            ` · ${selectedItems.length} pickup${selectedItems.length > 1 ? 's' : ''}`}
        </Text>

        {selectedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="calendar-clear-outline" size={28} color={PRIMARY} />
            </View>
            <Text style={styles.emptyTitle}>No pickups this day</Text>
            <Text style={styles.emptyText}>
              Request a one-off pickup, or use + above to set up a weekly plan.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('RequestPickup')}
            >
              <Text style={styles.emptyBtnText}>Request a Pickup</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardList}>
            {selectedItems.map((item) => {
              const meta = wasteMeta(item.wasteType);
              const status =
                item.kind === 'request' && item.status
                  ? REQUEST_STATUS_META[item.status]
                  : RECURRING_META;
              const tappable = item.kind === 'request' && item.status !== 'completed';
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.pickupCard}
                  activeOpacity={tappable ? 0.8 : 1}
                  onPress={() => openItem(item)}
                  disabled={!tappable}
                >
                  <View style={[styles.pickupIconBox, { backgroundColor: meta.color }]}>
                    <MaterialCommunityIcons name={meta.icon as any} size={22} color={WHITE} />
                  </View>

                  <View style={styles.pickupInfo}>
                    <Text style={styles.pickupType}>{meta.label} · {item.volumeKg} kg</Text>
                    <Text style={styles.pickupMeta} numberOfLines={1}>
                      {formatTime(new Date(item.at))} · {item.addressText}
                    </Text>
                  </View>

                  <View style={styles.pickupRight}>
                    <View style={[styles.statusBadge, { backgroundColor: status.colorSoft }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                    {tappable && <Ionicons name="chevron-forward" size={18} color={MUTED} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 26,
    color: TEXT,
  },
  subtitle: {
    fontFamily: FONT_REGULAR,
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  // Calendar card
  calendarCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PRIMARY_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthLabel: {
    fontFamily: FONT_BOLD,
    fontSize: 16,
    color: TEXT,
  },
  todayLink: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 12,
    color: PRIMARY,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayLabel: {
    flexBasis: '14.28%',
    textAlign: 'center',
    fontFamily: FONT_MEDIUM,
    fontSize: 11,
    color: MUTED,
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    flexBasis: '14.28%',
    alignItems: 'center',
    paddingVertical: 3,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: PRIMARY_SOFT,
  },
  dayCircleSelected: {
    backgroundColor: PRIMARY,
  },
  dayNum: {
    fontFamily: FONT_MEDIUM,
    fontSize: 14,
    color: TEXT,
  },
  dayNumOutside: {
    color: '#C3CDD6',
  },
  dayNumToday: {
    fontFamily: FONT_BOLD,
    color: PRIMARY,
  },
  dayNumSelected: {
    fontFamily: FONT_BOLD,
    color: WHITE,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
    height: 5,
    marginTop: 2,
    alignItems: 'center',
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  eventDotOutside: {
    opacity: 0.35,
  },

  // Recurring plans
  plansCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  plansTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 15,
    color: TEXT,
    marginBottom: 4,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  planRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  planIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planType: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 13,
    color: TEXT,
  },
  planMeta: {
    fontFamily: FONT_REGULAR,
    fontSize: 11.5,
    color: MUTED,
    marginTop: 1,
  },
  planDeleteBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List section
  listSection: {
    flex: 1,
  },
  sectionLabel: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 13,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  cardList: {
    gap: 12,
  },

  // Pickup card
  pickupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pickupIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupInfo: {
    flex: 1,
  },
  pickupType: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 15,
    color: TEXT,
    marginBottom: 3,
  },
  pickupMeta: {
    fontFamily: FONT_REGULAR,
    fontSize: 12,
    color: MUTED,
  },
  pickupRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 11,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PRIMARY_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 16,
    color: TEXT,
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: FONT_REGULAR,
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyBtn: {
    height: 46,
    paddingHorizontal: 24,
    borderRadius: 23,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 14,
    color: WHITE,
  },
});
