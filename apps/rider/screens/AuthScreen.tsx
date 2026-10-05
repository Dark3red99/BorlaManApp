import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bike } from 'lucide-react-native';

import { Fonts, Radius, type Palette } from '@borlaman/shared/constants/theme';
import { useThemedStyles } from '@borlaman/shared/theme/ThemeContext';
import { Button, IconTile, Segmented } from '@borlaman/shared/ui';
import { validateEmail } from '@borlaman/shared/utils/validation';
import Field from '../components/Field';
import * as riderService from '../services/riderService';

// Sign in, or create a rider account. After sign-up the app moves on to the
// details/documents step automatically (RiderContext reacts to the session).

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const styles = useThemedStyles(makeStyles);
  const [mode, setMode] = useState<Mode>('signin');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const problem = (() => {
    if (validateEmail(email)) return 'Enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (mode === 'signup') {
      if (fullName.trim().length < 3) return 'Enter your full name.';
      if (phone.replace(/\D/g, '').length < 9) return 'Enter your phone number.';
    }
    return null;
  })();

  const submit = async () => {
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signin') await riderService.signIn(email, password);
      else await riderService.signUp({ fullName, phone, email, password });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <IconTile icon={Bike} tone="solid" size={56} />
            <Text style={styles.title}>BorlaMan Rider</Text>
            <Text style={styles.subtitle}>Collect waste near you and get paid for every pickup.</Text>
          </View>

          <Segmented
            options={[
              { key: 'signin' as const, label: 'Sign in' },
              { key: 'signup' as const, label: 'Become a rider' },
            ]}
            value={mode}
            onChange={(m) => {
              setMode(m);
              setError(null);
            }}
          />

          <View style={styles.form}>
            {mode === 'signup' && (
              <>
                <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="e.g. Kwame Boateng" autoCapitalize="words" />
                <Field
                  label="Phone number"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="024 123 4567"
                  keyboardType="phone-pad"
                  hint="Customers call this number when you're on the way."
                />
              </>
            )}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              autoComplete={mode === 'signin' ? 'password' : 'new-password'}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button label={busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create rider account'} onPress={submit} disabled={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (ui: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: ui.bg },
    flex: { flex: 1 },
    scroll: { padding: 20, paddingTop: 32, gap: 20 },
    brand: { alignItems: 'center', gap: 10, marginBottom: 8 },
    title: { fontFamily: Fonts.extraBold, fontSize: 26, color: ui.text, marginTop: 6 },
    subtitle: { fontFamily: Fonts.regular, fontSize: 14, color: ui.textMuted, textAlign: 'center', maxWidth: 280 },
    form: { gap: 14 },
    error: {
      fontFamily: Fonts.medium,
      fontSize: 13,
      color: ui.danger,
      backgroundColor: ui.dangerSoft,
      padding: 12,
      borderRadius: Radius.md,
      overflow: 'hidden',
    },
  });
