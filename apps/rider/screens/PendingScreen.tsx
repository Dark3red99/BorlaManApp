import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Hourglass, ShieldAlert } from 'lucide-react-native';

import { Fonts, type Palette } from '@borlaman/shared/constants/theme';
import { useThemedStyles } from '@borlaman/shared/theme/ThemeContext';
import { Button, IconTile } from '@borlaman/shared/ui';
import { useRider } from '../context/RiderContext';

/** After submitting details: waiting for review, or suspended/rejected. */
export default function PendingScreen() {
  const styles = useThemedStyles(makeStyles);
  const { stage, rider, refresh, signOut } = useRider();
  const [checking, setChecking] = useState(false);
  const blocked = stage === 'blocked';

  const checkAgain = async () => {
    setChecking(true);
    await refresh();
    setChecking(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <IconTile icon={blocked ? ShieldAlert : Hourglass} tone={blocked ? 'danger' : 'amber'} size={68} round />
        <Text style={styles.title}>
          {blocked
            ? rider?.status === 'suspended'
              ? 'Your account is suspended'
              : 'Your application was not approved'
            : "We're checking your details"}
        </Text>
        <Text style={styles.text}>
          {blocked
            ? 'Please contact BorlaMan support to find out why and what you can do next.'
            : "Thanks for applying. We review every rider's documents, usually within a day. Come back and tap "
              + '"Check again". Once you\'re approved, you can go online and start collecting.'}
        </Text>
        {rider?.vehicle_plate ? <Text style={styles.meta}>Tricycle {rider.vehicle_plate}</Text> : null}
      </View>
      <View style={styles.actions}>
        {!blocked && <Button label={checking ? 'Checking…' : 'Check again'} onPress={checkAgain} disabled={checking} />}
        <Button label="Sign out" variant="secondary" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: ui.bg, padding: 20 },
    body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
    title: { fontFamily: Fonts.bold, fontSize: 21, color: ui.text, textAlign: 'center' },
    text: { fontFamily: Fonts.regular, fontSize: 14, color: ui.textMuted, textAlign: 'center', lineHeight: 21, maxWidth: 320 },
    meta: { fontFamily: Fonts.semiBold, fontSize: 13, color: ui.textFaint },
    actions: { gap: 10 },
  });
