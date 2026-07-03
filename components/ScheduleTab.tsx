import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
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

type PickupStatus = 'scheduled' | 'en-route';

type Pickup = {
  id: string;
  dayOffset: number; // 0 = today, within the visible 7-day window
  time: string;
  type: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconBg: string;
  address: string;
  status: PickupStatus;
};

const PICKUPS: Pickup[] = [
  { id: 'p1', dayOffset: 0, time: '8:00 AM',  type: 'Household Waste', icon: 'trash-can-outline', iconBg: '#059669', address: '12 Ring Road, Accra', status: 'scheduled' },
  { id: 'p2', dayOffset: 0, time: '2:30 PM',  type: 'Recyclables',     icon: 'recycle',            iconBg: '#3B82F6', address: '12 Ring Road, Accra', status: 'en-route' },
  { id: 'p3', dayOffset: 2, time: '9:00 AM',  type: 'Organic Waste',   icon: 'leaf',                iconBg: '#F59E0B', address: '12 Ring Road, Accra', status: 'scheduled' },
  { id: 'p4', dayOffset: 5, time: '10:00 AM', type: 'Household Waste', icon: 'trash-can-outline',  iconBg: '#059669', address: '12 Ring Road, Accra', status: 'scheduled' },
];

const STATUS_META: Record<PickupStatus, { label: string; color: string; bg: string }> = {
  scheduled: { label: 'Scheduled', color: '#2563EB', bg: '#EFF6FF' },
  'en-route': { label: 'En Route', color: '#B45309', bg: '#FFFBEB' },
};

function buildWeek() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return {
      offset,
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate(),
      isToday: offset === 0,
    };
  });
}

export default function ScheduleTab() {
  const week = useMemo(buildWeek, []);
  const [selectedDay, setSelectedDay] = useState(0);

  const pickupsForDay = PICKUPS.filter((p) => p.dayOffset === selectedDay);

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
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.85} onPress={handleAddPickup}>
          <Ionicons name="add" size={24} color={WHITE} />
        </TouchableOpacity>
      </View>

      {/* Week strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weekStrip}
      >
        {week.map((day) => {
          const isSelected = selectedDay === day.offset;
          return (
            <TouchableOpacity
              key={day.offset}
              style={[styles.dayPill, isSelected && styles.dayPillSelected]}
              onPress={() => setSelectedDay(day.offset)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dayWeekday, isSelected && styles.dayTextSelected]}>{day.weekday}</Text>
              <Text style={[styles.dayNum, isSelected && styles.dayTextSelected]}>{day.dateNum}</Text>
              {day.isToday && !isSelected && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Pickups for selected day */}
      <View style={styles.listSection}>
        <Text style={styles.sectionLabel}>
          {selectedDay === 0 ? 'Today' : week[selectedDay].weekday + ' ' + week[selectedDay].dateNum}
        </Text>

        {pickupsForDay.length === 0 ? (
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
            {pickupsForDay.map((pickup) => {
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

  // Week strip
  weekStrip: {
    gap: 10,
    paddingBottom: 4,
    marginBottom: 20,
  },
  dayPill: {
    width: 52,
    height: 72,
    borderRadius: 16,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dayPillSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  dayWeekday: {
    fontFamily: FONT_MEDIUM,
    fontSize: 11,
    color: MUTED,
    textTransform: 'uppercase',
  },
  dayNum: {
    fontFamily: FONT_BOLD,
    fontSize: 17,
    color: TEXT,
  },
  dayTextSelected: {
    color: WHITE,
  },
  todayDot: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: PRIMARY,
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
