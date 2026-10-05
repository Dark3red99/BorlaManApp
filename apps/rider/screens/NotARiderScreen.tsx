import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserX } from 'lucide-react-native';

import { Fonts, type Palette } from '@borlaman/shared/constants/theme';
import { useThemedStyles } from '@borlaman/shared/theme/ThemeContext';
import { Button, IconTile } from '@borlaman/shared/ui';
import { useRider } from '../context/RiderContext';

/** Shown when someone signs in here with a customer account. */
export default function NotARiderScreen() {
  const styles = useThemedStyles(makeStyles);
  const { signOut } = useRider();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <IconTile icon={UserX} tone="amber" size={64} round />
        <Text style={styles.title}>This is a customer account</Text>
        <Text style={styles.text}>
          You signed in with an account made in the BorlaMan app. To collect waste, sign out and create a separate
          rider account with a different email.
        </Text>
      </View>
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </SafeAreaView>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: ui.bg, padding: 20 },
    body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
    title: { fontFamily: Fonts.bold, fontSize: 20, color: ui.text, textAlign: 'center' },
    text: { fontFamily: Fonts.regular, fontSize: 14, color: ui.textMuted, textAlign: 'center', lineHeight: 21 },
  });
