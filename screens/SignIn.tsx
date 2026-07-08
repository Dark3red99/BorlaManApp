import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { AuthError } from '../services/authService';
import AuthHero from '../components/AuthHero';
import GoogleIcon from '../components/GoogleIcon';
import WaveDivider from '../components/WaveDivider';

const PRIMARY = '#059669';
const PRIMARY_SOFT = '#ECFDF5';
const TEXT = '#0F172A';
const BORDER = '#D3E8DD';
const ERROR = '#E53935';
const INPUT_BG = '#F4FAF7';
const GOOGLE_BTN_BG = '#F1F5F3';
const GOOGLE_TEXT = '#3C4A43';
const WHITE = '#FFFFFF';
const PLACEHOLDER = '#93A8A0';
const FONT_REGULAR = 'Poppins_400Regular';
const FONT_MEDIUM = 'Poppins_500Medium';
const FONT_SEMIBOLD = 'Poppins_600SemiBold';
const FONT_BOLD = 'Poppins_700Bold';
const FONT_EXTRABOLD = 'Poppins_800ExtraBold';
const WIDE_BREAKPOINT = 768;

export default function SignIn({ navigation }: RootStackScreenProps<'SignIn'>) {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
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

  const handleGoogleSignIn = () => {
    Alert.alert('Google Sign-In', 'Google sign-in will be available once the backend is connected.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_SOFT} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.shell, isWide && styles.shellWide]}>
          {/* Illustration header — top band on phones, left panel on wide screens */}
          <AuthHero wide={isWide} />

          <ScrollView
            style={styles.formPane}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Center content */}
            <View style={[styles.center, isWide && styles.centerWide]}>
              {/* Heading */}
              <Text style={styles.heading}>Welcome back</Text>

              {/* Form */}
              <View style={styles.form}>
                {/* Email or Phone */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.inputWithLeadingIcon]}
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
                  <View style={styles.leadingIcon} pointerEvents="none">
                    <Ionicons name="mail-outline" size={20} color={PRIMARY} />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.inputWithLeadingIcon, styles.inputWithIcon]}
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
                  <View style={styles.leadingIcon} pointerEvents="none">
                    <Ionicons name="lock-closed-outline" size={20} color={PRIMARY} />
                  </View>
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
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

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Button */}
                <TouchableOpacity
                  style={styles.googleBtn}
                  onPress={handleGoogleSignIn}
                  activeOpacity={0.85}
                >
                  <GoogleIcon />
                  <Text style={styles.googleBtnText}>Continue with google</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Sign Up band */}
            <WaveDivider fill={PRIMARY_SOFT} />
            <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation?.navigate('Registration')}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  shell: {
    flex: 1,
  },
  shellWide: {
    flexDirection: 'row',
  },
  formPane: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },

  // Vertically centered block
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  centerWide: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },

  // Heading
  heading: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 30,
    color: PRIMARY,
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
  inputWithLeadingIcon: {
    paddingLeft: 52,
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  leadingIcon: {
    position: 'absolute',
    left: 20,
    height: 58,
    justifyContent: 'center',
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
    fontFamily: FONT_MEDIUM,
    fontSize: 14,
    color: PRIMARY,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E1EDE6',
  },
  dividerText: {
    fontFamily: FONT_MEDIUM,
    marginHorizontal: 12,
    color: PLACEHOLDER,
    fontSize: 13,
  },

  // Google button
  googleBtn: {
    height: 58,
    backgroundColor: GOOGLE_BTN_BG,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E2EAE6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleBtnText: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 15,
    color: GOOGLE_TEXT,
    letterSpacing: 0.2,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PRIMARY_SOFT,
    paddingTop: 10,
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
