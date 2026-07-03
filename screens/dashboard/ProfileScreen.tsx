import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import type { UserCategory } from '../../types/models';

const PRIMARY = '#059669';
const PRIMARY_SOFT = '#ECFDF5';
const BG    = '#F3F8F5';
const WHITE = '#FFFFFF';
const TEXT  = '#0F172A';
const MUTED = '#64748B';
const DANGER = '#DC2626';

const FONT_REGULAR   = 'Poppins_400Regular';
const FONT_MEDIUM    = 'Poppins_500Medium';
const FONT_SEMIBOLD  = 'Poppins_600SemiBold';
const FONT_EXTRABOLD = 'Poppins_800ExtraBold';

const CATEGORY_LABELS: Record<UserCategory, string> = {
  household: 'Household',
  corporate: 'Corporate Organization',
  aboboyaa: 'Aboboyaa Collector',
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
          } catch {
            Alert.alert('Sign Out Failed', 'Something went wrong. Please try again.');
          }
        },
      },
    ]);
  };

  const initials = (user?.fullName ?? '?')
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const rows = [
    { icon: 'call-outline' as const, label: 'Phone', value: user?.phone ?? '—' },
    { icon: 'mail-outline' as const, label: 'Email', value: user?.email ?? '—' },
    {
      icon: 'location-outline' as const,
      label: 'Address',
      value: user
        ? [user.address.addressLine, user.address.area, user.address.district, user.address.region]
            .filter(Boolean)
            .join(', ')
        : '—',
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        {/* Identity card */}
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.fullName ?? 'Guest'}</Text>
          {user && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{CATEGORY_LABELS[user.category]}</Text>
            </View>
          )}
        </View>

        {/* Details */}
        <View style={styles.detailCard}>
          {rows.map((row, idx) => (
            <View key={row.label} style={[styles.detailRow, idx < rows.length - 1 && styles.detailRowBorder]}>
              <View style={styles.detailIconBox}>
                <Ionicons name={row.icon} size={18} color={PRIMARY} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={styles.detailValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={DANGER} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Payment methods, saved addresses and settings are coming soon.
        </Text>
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 26,
    color: TEXT,
    marginBottom: 20,
  },

  // Identity
  identityCard: {
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 26,
    color: WHITE,
  },
  name: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 19,
    color: TEXT,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: PRIMARY_SOFT,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  categoryText: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 12,
    color: PRIMARY,
  },

  // Details
  detailCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDF4F0',
  },
  detailIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: PRIMARY_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: FONT_REGULAR,
    fontSize: 12,
    color: MUTED,
    marginBottom: 1,
  },
  detailValue: {
    fontFamily: FONT_MEDIUM,
    fontSize: 14,
    color: TEXT,
  },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: WHITE,
    borderRadius: 18,
    height: 54,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
  },
  signOutText: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 15,
    color: DANGER,
  },
  footerNote: {
    fontFamily: FONT_REGULAR,
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
  },
});
