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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LogIn } from 'lucide-react-native';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { AuthError } from '../services/authService';
import GoogleIcon from '../components/GoogleIcon';
import { ScreenColors as D, Fonts } from '../constants/theme';

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
    <LinearGradient colors={[D.bgTop, D.bgBottom]} style={styles.gradient}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={D.bgTop} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.center, isWide && styles.centerWide]}>
              {/* Badge + Heading */}
              <View style={styles.badge}>
                <LogIn color={D.neon} size={22} strokeWidth={2} />
              </View>
              <Text style={styles.heading}>Welcome back</Text>
              <Text style={styles.subheading}>Sign in to request your next pickup</Text>

              {/* Form */}
              <View style={styles.form}>
                {/* Email or Phone */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.inputWithLeadingIcon]}
                    placeholder="Email or phone number"
                    placeholderTextColor={D.textFaint}
                    value={identifier}
                    onChangeText={(v) => { setIdentifier(v); setError(null); }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="username"
                    autoComplete="username"
                    returnKeyType="next"
                  />
                  <View style={styles.leadingIcon} pointerEvents="none">
                    <Ionicons name="mail-outline" size={20} color={D.neon} />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.inputWithLeadingIcon, styles.inputWithIcon]}
                    placeholder="Password"
                    placeholderTextColor={D.textFaint}
                    value={password}
                    onChangeText={(v) => { setPassword(v); setError(null); }}
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    autoComplete="current-password"
                    returnKeyType="done"
                    onSubmitEditing={handleSignIn}
                  />
                  <View style={styles.leadingIcon} pointerEvents="none">
                    <Ionicons name="lock-closed-outline" size={20} color={D.neon} />
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
                      color={D.textFaint}
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
                    <ActivityIndicator color={D.ink} />
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

              {/* Sign Up */}
              <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation?.navigate('Registration')}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  center: {
    width: '100%',
  },
  centerWide: {
    maxWidth: 420,
    alignSelf: 'center',
  },

  // Badge + Heading
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: D.neonDim,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  heading: {
    fontFamily: Fonts.extraBold,
    fontSize: 26,
    color: D.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subheading: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: D.textMuted,
    textAlign: 'center',
    marginBottom: 28,
  },

  // Form
  form: {
    gap: 16,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: D.border,
    borderRadius: 28,
    paddingHorizontal: 22,
    fontSize: 15,
    color: D.text,
    backgroundColor: '#EEF5F1',
    fontFamily: Fonts.medium,
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
    height: 56,
    justifyContent: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: 18,
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  // Error
  errorText: {
    fontFamily: Fonts.regular,
    color: D.danger,
    fontSize: 13,
    textAlign: 'center',
    marginTop: -4,
  },

  // Sign In button
  signInBtn: {
    height: 56,
    backgroundColor: D.neon,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: D.neon,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  signInBtnDisabled: {
    opacity: 0.5,
  },
  signInBtnText: {
    fontFamily: Fonts.bold,
    color: D.ink,
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // Forgot Password
  forgotWrapper: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  forgotText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: D.neon,
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
    backgroundColor: D.border,
  },
  dividerText: {
    fontFamily: Fonts.medium,
    marginHorizontal: 12,
    color: D.textFaint,
    fontSize: 13,
  },

  // Google button
  googleBtn: {
    height: 56,
    backgroundColor: D.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: D.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: D.text,
    letterSpacing: 0.2,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: D.textMuted,
  },
  signUpLink: {
    fontFamily: Fonts.extraBold,
    fontSize: 14,
    color: D.neon,
  },
});
