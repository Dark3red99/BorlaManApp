import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { AuthError } from '../services/authService';

const PRIMARY = '#059669';
const TEXT = '#0F172A';
const BORDER = '#D3E8DD';
const ERROR = '#E53935';
const INPUT_BG = '#F4FAF7';
const WHITE = '#FFFFFF';
const PLACEHOLDER = '#93A8A0';
const FONT_REGULAR = 'Poppins_400Regular';
const FONT_MEDIUM = 'Poppins_500Medium';
const FONT_BOLD = 'Poppins_700Bold';
const FONT_EXTRABOLD = 'Poppins_800ExtraBold';

export default function SignIn({ navigation }: RootStackScreenProps<'SignIn'>) {
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = identifier.trim().length > 0 && password.length > 0 && !submitting;

  const handleSignIn = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await signIn(identifier, password);
      // Reset (not replace) so signup/onboarding screens can't be reached via back.
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    } catch (e) {
      setError(
        e instanceof AuthError
          ? e.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Center content */}
        <View style={styles.center}>
          {/* Heading */}
          <Text style={styles.heading}>Welcome back</Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Email or Phone */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Email or phone number"
                placeholderTextColor={PLACEHOLDER}
                value={identifier}
                onChangeText={(v) => { setIdentifier(v); setError(null); }}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                autoComplete="username"
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="Password"
                placeholderTextColor={PLACEHOLDER}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(null); }}
                secureTextEntry={!showPassword}
                textContentType="password"
                autoComplete="current-password"
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={PLACEHOLDER}
                />
              </TouchableOpacity>
            </View>

            {/* Error */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInBtn, !canSubmit && styles.signInBtnDisabled]}
              onPress={handleSignIn}
              activeOpacity={0.85}
              disabled={!canSubmit}
            >
              {submitting ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <Text style={styles.signInBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              activeOpacity={0.7}
              style={styles.forgotWrapper}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Sign Up link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation?.navigate('Registration')}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: WHITE,
  },

  // Vertically centered block
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  // Heading
  heading: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 30,
    color: TEXT,
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 24,
  },

  // Form
  form: {
    gap: 14,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    height: 58,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 30,
    paddingHorizontal: 22,
    fontSize: 15,
    color: TEXT,
    backgroundColor: INPUT_BG,
    fontFamily: FONT_MEDIUM,
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 18,
    height: 58,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  // Error
  errorText: {
    fontFamily: FONT_REGULAR,
    color: ERROR,
    fontSize: 13,
    textAlign: 'center',
    marginTop: -4,
  },

  // Sign In button
  signInBtn: {
    height: 58,
    backgroundColor: PRIMARY,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  signInBtnDisabled: {
    opacity: 0.6,
  },
  signInBtnText: {
    fontFamily: FONT_BOLD,
    color: WHITE,
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // Forgot Password
  forgotWrapper: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  forgotText: {
    fontFamily: FONT_REGULAR,
    fontSize: 14,
    color: PLACEHOLDER,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 36,
  },
  footerText: {
    fontFamily: FONT_REGULAR,
    fontSize: 14,
    color: '#5B6B63',
  },
  signUpLink: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 14,
    color: PRIMARY,
  },
});