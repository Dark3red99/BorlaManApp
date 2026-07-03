import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const PRIMARY     = '#059669';
const PICKUP_BG   = '#10B981';
const IMPACT_BG   = '#047857';
const CARD_SHADOW = '#059669';
const BG          = '#F3F8F5';
const WHITE       = '#FFFFFF';
const TEXT        = '#0F172A';
const MUTED       = '#64748B';

// ─── Impact data ────────────────────────────────────────────────
const IMPACT_ITEMS = [
  { id: 'waste', label: 'Total Waste Collected', value: '247 kg', progress: 0.72, iconBg: PRIMARY,   icon: <MaterialCommunityIcons name="trash-can-outline" size={18} color={WHITE} /> },
  { id: 'co2',   label: 'CO₂ Offset',            value: '156 kg', progress: 0.58, iconBg: '#3B82F6', icon: <MaterialCommunityIcons name="leaf"              size={18} color={WHITE} /> },
  { id: 'pts',   label: 'Impact Points',         value: '3,420',  progress: 0.84, iconBg: '#F59E0B', icon: <FontAwesome5           name="trophy"            size={16} color={WHITE} /> },
];

// ─── Recent activity data ────────────────────────────────────────
const ACTIVITY = [
  { id: 'a1', title: 'Pickup Completed', sub: '12.5 kg mixed recyclables • 2 hours ago', iconBg: '#DCFCE7', icon: <Ionicons name="checkmark" size={20} color="#16A34A" /> },
  { id: 'a2', title: 'Points Earned',    sub: '+150 impact points • Yesterday',           iconBg: '#DBEAFE', icon: <FontAwesome5 name="coins" size={16} color="#3B82F6" /> },
  { id: 'a3', title: 'Challenge Joined', sub: 'Community cleanup drive • 2 days ago',     iconBg: '#F3E8FF', icon: <Ionicons name="people" size={20} color="#9333EA" /> },
];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome 👋</Text>
            <Text style={styles.userName}>{user?.fullName ?? 'there'}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={22} color={TEXT} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name="person-circle-outline" size={26} color={PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Next Pickup Card ── */}
        <View style={styles.pickupCard}>
          <View style={styles.pickupTopRow}>
            <Text style={styles.pickupLabel}>Next Pickup</Text>
            <View style={styles.scheduledBadge}>
              <Text style={styles.scheduledText}>Scheduled</Text>
            </View>
          </View>

          <View style={styles.pickupBody}>
            <View style={styles.truckIconBox}>
              <MaterialCommunityIcons name="truck-delivery" size={28} color={WHITE} />
            </View>

            <View style={styles.pickupInfo}>
              <Text style={styles.pickupDay}>Tomorrow</Text>
              <Text style={styles.pickupDate}>March 10, 2026 • 8:00 AM</Text>
            </View>

            <TouchableOpacity style={styles.arrowBtn} activeOpacity={0.8} onPress={() => navigation.navigate('Schedule')}>
              <Ionicons name="chevron-forward" size={20} color={TEXT} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard} activeOpacity={0.8} onPress={() => navigation.navigate('Schedule')}>
            <View style={styles.quickIconBox}>
              <Ionicons name="calendar" size={26} color={WHITE} />
            </View>
            <Text style={styles.quickLabel}>Schedule{'\n'}Pickup</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard} activeOpacity={0.8}>
            <View style={styles.quickIconBox}>
              <Ionicons name="map" size={26} color={WHITE} />
            </View>
            <Text style={styles.quickLabel}>Live{'\n'}Map</Text>
          </TouchableOpacity>
        </View>

        {/* ── Impact Tracker ── */}
        <View style={styles.impactCard}>
          <View style={styles.impactHeader}>
            <Text style={styles.impactTitle}>Impact Tracker</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {IMPACT_ITEMS.map((item, idx) => (
            <View key={item.id} style={[styles.impactRow, idx < IMPACT_ITEMS.length - 1 && styles.impactRowBorder]}>
              <View style={[styles.impactIconBox, { backgroundColor: item.iconBg }]}>
                {item.icon}
              </View>
              <View style={styles.impactInfo}>
                <View style={styles.impactTopLine}>
                  <Text style={styles.impactLabel}>{item.label}</Text>
                  <Text style={styles.impactValue}>{item.value}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[
                    styles.progressBar,
                    { width: `${item.progress * 100}%`, backgroundColor: item.iconBg === '#F59E0B' ? '#F59E0B' : WHITE }
                  ]} />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── Recent Activity ── */}
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>Recent Activity</Text>

          {ACTIVITY.map((item, idx) => (
            <View key={item.id} style={[styles.activityRow, idx < ACTIVITY.length - 1 && styles.activityRowBorder]}>
              <View style={[styles.activityIconBox, { backgroundColor: item.iconBg }]}>
                {item.icon}
              </View>
              <View style={styles.activityText}>
                <Text style={styles.activityItemTitle}>{item.title}</Text>
                <Text style={styles.activityItemSub}>{item.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 26,
    color: TEXT,
    lineHeight: 34,
  },
  userName: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: MUTED,
    marginTop: -2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
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

  // ── Next Pickup Card ──
  pickupCard: {
    backgroundColor: PICKUP_BG,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: CARD_SHADOW,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  pickupTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pickupLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: WHITE,
    opacity: 0.9,
  },
  scheduledBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  scheduledText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#CCFFCC',
  },
  pickupBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  truckIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupInfo: {
    flex: 1,
  },
  pickupDay: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: WHITE,
    lineHeight: 28,
  },
  pickupDate: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  arrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Quick Actions ──
  quickRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  quickCard: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  quickIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: TEXT,
    textAlign: 'center',
    lineHeight: 19,
  },

  // ── Impact Tracker ──
  impactCard: {
    backgroundColor: IMPACT_BG,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: CARD_SHADOW,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  impactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  impactTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: WHITE,
  },
  viewAll: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#CCFFCC',
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  impactRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  impactIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactInfo: {
    flex: 1,
  },
  impactTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  impactLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  impactValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: WHITE,
  },
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: 5,
    borderRadius: 10,
    opacity: 0.9,
  },

  // ── Recent Activity ──
  activityCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  activityTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: TEXT,
    marginBottom: 14,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: {
    flex: 1,
  },
  activityItemTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: TEXT,
    marginBottom: 2,
  },
  activityItemSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: MUTED,
    lineHeight: 17,
  },
});
