import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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

type PickupStatus = 'scheduled' | 'en-route' | 'completed';

type Pickup = {
  id: string;
  date: string; // yyyy-mm-dd (local)
  time: string;
  type: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconBg: string;
  address: string;
  status: PickupStatus;
};

const STATUS_META: Record<PickupStatus, { label: string; color: string; bg: string }> = {
  scheduled:  { label: 'Scheduled', color: '#2563EB', bg: '#EFF6FF' },
  'en-route': { label: 'En Route',  color: '#B45309', bg: '#FFFBEB' },
  completed:  { label: 'Completed', color: '#047857', bg: '#ECFDF5' },
};

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function toKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

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

/** Mock pickups pinned relative to today so the calendar always has data to show. */
function buildMockPickups(today: Date): Pickup[] {
  const key = (offset: number) => toKey(addDays(today, offset));
  return [
    { id: 'p0', date: key(-3), time: '9:30 AM',  type: 'Recyclables',     icon: 'recycle',           iconBg: '#3B82F6', address: '12 Ring Road, Accra', status: 'completed' },
    { id: 'p1', date: key(0),  time: '8:00 AM',  type: 'Household Waste', icon: 'trash-can-outline', iconBg: '#059669', address: '12 Ring Road, Accra', status: 'scheduled' },
    { id: 'p2', date: key(0),  time: '2:30 PM',  type: 'Recyclables',     icon: 'recycle',           iconBg: '#3B82F6', address: '12 Ring Road, Accra', status: 'en-route' },
    { id: 'p3', date: key(2),  time: '9:00 AM',  type: 'Organic Waste',   icon: 'leaf',              iconBg: '#F59E0B', address: '12 Ring Road, Accra', status: 'scheduled' },
    { id: 'p4', date: key(5),  time: '10:00 AM', type: 'Household Waste', icon: 'trash-can-outline', iconBg: '#059669', address: '12 Ring Road, Accra', status: 'scheduled' },
    { id: 'p5', date: key(9),  time: '11:15 AM', type: 'Recyclables',     icon: 'recycle',           iconBg: '#3B82F6', address: '12 Ring Road, Accra', status: 'scheduled' },
    { id: 'p6', date: key(14), time: '8:30 AM',  type: 'Organic Waste',   icon: 'leaf',              iconBg: '#F59E0B', address: '12 Ring Road, Accra', status: 'scheduled' },
  ];
}

function formatSelectedLabel(selected: Date, today: Date) {
  if (isSameDay(selected, today)) return 'Today';
  if (isSameDay(selected, addDays(today, 1))) return 'Tomorrow';
  if (isSameDay(selected, addDays(today, -1))) return 'Yesterday';
  return selected.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function ScheduleTab() {
  // Lazy state (not useMemo) so "today" is guaranteed stable for the mount.
  const [today] = useState(() => new Date());
  const [pickups] = useState(() => buildMockPickups(today));

  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);

  const grid = useMemo(
    () => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  const pickupsByDate = useMemo(() => {
    const map: Record<string, Pickup[]> = {};
    for (const p of pickups) (map[p.date] ??= []).push(p);
    return map;
  }, [pickups]);

  const selectedPickups = pickupsByDate[toKey(selected)] ?? [];
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

  const handleAddPickup = () => {
    Alert.alert('Schedule Pickup', 'Booking a new pickup is coming soon.');
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
          onPress={handleAddPickup}
          accessibilityRole="button"
          accessibilityLabel="Schedule a new pickup"
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
            const dayKey = toKey(day);
            const inMonth = day.getMonth() === cursor.getMonth();
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selected);
            const dayPickups = pickupsByDate[dayKey] ?? [];

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
                  {dayPickups.slice(0, 3).map((p) => (
                    <View
                      key={p.id}
                      style={[
                        styles.eventDot,
                        { backgroundColor: isSelected ? PRIMARY : p.iconBg },
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

      {/* Pickups for selected day */}
      <View style={styles.listSection}>
        <Text style={styles.sectionLabel}>
          {formatSelectedLabel(selected, today)}
          {selectedPickups.length > 0 &&
            ` · ${selectedPickups.length} pickup${selectedPickups.length > 1 ? 's' : ''}`}
        </Text>

        {selectedPickups.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="calendar-clear-outline" size={28} color={PRIMARY} />
            </View>
            <Text style={styles.emptyTitle}>No pickups this day</Text>
            <Text style={styles.emptyText}>You don't have any waste pickups scheduled.</Text>
            <TouchableOpacity style={styles.emptyBtn} activeOpacity={0.85} onPress={handleAddPickup}>
              <Text style={styles.emptyBtnText}>Schedule a Pickup</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardList}>
            {selectedPickups.map((pickup) => {
              const status = STATUS_META[pickup.status];
              return (
                <TouchableOpacity key={pickup.id} style={styles.pickupCard} activeOpacity={0.8}>
                  <View style={[styles.pickupIconBox, { backgroundColor: pickup.iconBg }]}>
                    <MaterialCommunityIcons name={pickup.icon} size={22} color={WHITE} />
                  </View>

                  <View style={styles.pickupInfo}>
                    <Text style={styles.pickupType}>{pickup.type}</Text>
                    <Text style={styles.pickupMeta}>{pickup.time} · {pickup.address}</Text>
                  </View>

                  <View style={styles.pickupRight}>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={MUTED} />
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
