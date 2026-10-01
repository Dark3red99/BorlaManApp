import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert, Switch } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LogOut, Mail, MapPin, MapPinned, Moon, Phone, Smartphone } from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import { getCollectionPoint } from '../../services/locationService';
import type { CollectionPoint, UserCategory } from '../../types/models';
import { Fonts, type Palette } from '../../constants/theme';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { Avatar, Card, IconTile, ListRow, Pill, Screen, ScreenHeader, SectionHeader } from '../../components/ui';

const CATEGORY_LABELS: Record<UserCategory, string> = {
  household: 'Household',
  corporate: 'Corporate organization',
  aboboyaa: 'Aboboyaa collector',
};

export default function ProfileScreen() {
  const { ui, isDark, mode, setMode } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const [collectionPoint, setCollectionPoint] = useState<CollectionPoint | null>(null);

  // Reload on focus so the row reflects an edit made on SetCollectionPoint.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (user) {
        getCollectionPoint(user.id).then((point) => {
          if (!cancelled) setCollectionPoint(point);
        });
      }
      return () => {
        cancelled = true;
      };
    }, [user]),
  );

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
          } catch {
            Alert.alert('Sign out failed', 'Something went wrong. Please try again.');
          }
        },
      },
    ]);
  };

  const address = user
    ? [user.address.addressLine, user.address.area, user.address.district, user.address.region]
        .filter(Boolean)
        .join(', ')
    : '—';

  const details = [
    { icon: Phone, label: 'Phone', value: user?.phone ?? '—' },
    { icon: Mail, label: 'Email', value: user?.email ?? '—' },
    { icon: MapPin, label: 'Address', value: address },
  ];

  return (
    <Screen>
      <ScreenHeader title="Profile" />

      {/* Identity */}
      <Card style={styles.identity}>
        <Avatar name={user?.fullName} size={84} />
        <Text style={styles.name}>{user?.fullName ?? 'Guest'}</Text>
        {user && (
          <Pill
            label={CATEGORY_LABELS[user.category]}
            color={ui.accentDeep}
            bg={ui.accentSoft}
            style={styles.centerSelf}
          />
        )}
      </Card>

      {/* Details */}
      <SectionHeader title="Contact details" />
      <Card style={styles.listCard}>
        {details.map((row, idx) => (
          <ListRow
            key={row.label}
            left={<IconTile icon={row.icon} tone="neutral" size={40} round />}
            title={row.value}
            subtitle={row.label}
            numberOfLines={1}
            divider={idx < details.length - 1}
          />
        ))}
      </Card>

      {/* Collection point */}
      <SectionHeader title="Pickup spot" />
      <Card style={styles.listCard}>
        <ListRow
          left={<IconTile icon={MapPinned} tone="accent" size={40} round />}
          title={
            collectionPoint
              ? [collectionPoint.gpsText, collectionPoint.label].filter(Boolean).join(' · ')
              : 'Not set yet'
          }
          subtitle={collectionPoint ? 'Collection point' : 'Tap to set where collectors should meet you'}
          chevron
          onPress={() => navigation.navigate('SetCollectionPoint')}
        />
      </Card>

      {/* Appearance */}
      <SectionHeader title="Appearance" />
      <Card style={styles.listCard}>
        <ListRow
          left={<IconTile icon={Moon} tone="neutral" size={40} round />}
          title="Dark mode"
          subtitle={mode === 'system' ? 'Following your phone' : isDark ? 'On' : 'Off'}
          divider
          right={
            <Switch
              value={isDark}
              onValueChange={(on) => setMode(on ? 'dark' : 'light')}
              trackColor={{ false: ui.wellStrong, true: ui.accent }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={ui.wellStrong}
              accessibilityLabel="Dark mode"
            />
          }
        />
        <ListRow
          left={<IconTile icon={Smartphone} tone="neutral" size={40} round />}
          title="Match phone setting"
          subtitle="Switch automatically with your phone"
          right={
            <Switch
              value={mode === 'system'}
              onValueChange={(on) => setMode(on ? 'system' : isDark ? 'dark' : 'light')}
              trackColor={{ false: ui.wellStrong, true: ui.accent }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={ui.wellStrong}
              accessibilityLabel="Match phone setting"
            />
          }
        />
      </Card>

      {/* Sign out */}
      <Card style={styles.listCard}>
        <ListRow
          left={<IconTile icon={LogOut} tone="danger" size={40} round />}
          title="Sign out"
          onPress={handleSignOut}
        />
      </Card>

      <Text style={styles.footerNote}>
        Payment methods, saved addresses and settings are coming soon.
      </Text>
    </Screen>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
  identity: { alignItems: 'center', paddingVertical: 26 },
  centerSelf: { alignSelf: 'center' },
  name: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: ui.text,
    letterSpacing: -0.3,
    marginTop: 14,
    marginBottom: 8,
  },
  listCard: { paddingVertical: 4, paddingHorizontal: 16 },
  footerNote: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: ui.textFaint,
    textAlign: 'center',
    marginTop: 4,
  },
});
