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
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { UserPlus } from 'lucide-react-native';
import type { RootStackScreenProps } from '../types/navigation';
import {
  validateFullName,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
} from '@borlaman/shared/utils/validation';
import GoogleIcon from '../components/GoogleIcon';
import { ScreenColors as D, Fonts } from '@borlaman/shared/constants/theme';

const WIDE_BREAKPOINT = 768;

type Errors = Partial<Record<'fullName' | 'phone' | 'password' | 'confirmPassword', string>>;

export default function Registration({ navigation }: RootStackScreenProps<'Registration'>) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const handleContinue = () => {
    const next: Errors = {
      fullName: validateFullName(fullName) ?? undefined,
      phone: validatePhone(phone) ?? undefined,
      password: validatePassword(password) ?? undefined,
      confirmPassword: validateConfirmPassword(password, confirmPassword) ?? undefined,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    navigation.navigate('SelectCategory', {
      draft: { fullName: fullName.trim(), phone: phone.trim(), password },
    });
  };

  const clearError = (field: keyof Errors) =>
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

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
                <UserPlus color={D.neon} size={22} strokeWidth={2} />
              </View>
              <Text style={styles.heading}>Create your account</Text>
              <Text style={styles.subheading}>A collector is just a request away</Text>

              {/* Form */}
              <View style={styles.form}>
                {/* Full Name */}
                <View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, styles.inputWithLeadingIcon, errors.fullName ? styles.inputError : null]}
                      placeholder="Full name"
                      placeholderTextColor={D.textFaint}
                      value={fullName}
                      onChangeText={(v) => { setFullName(v); clearError('fullName'); }}
                      autoCapitalize="words"
                      textContentType="name"
                      autoComplete="name"
                      returnKeyType="next"
                    />
                    <View style={styles.leadingIcon} pointerEvents="none">
                      <Ionicons name="person-outline" size={20} color={D.neon} />
                    </View>
                  </View>
                  {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
                </View>

                {/* Phone Number */}
                <View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, styles.inputWithLeadingIcon, errors.phone ? styles.inputError : null]}
                      placeholder="Phone Number"
                      placeholderTextColor={D.textFaint}
                      value={phone}
                      onChangeText={(v) => { setPhone(v); clearError('phone'); }}
                      keyboardType="phone-pad"
                      textContentType="telephoneNumber"
                      autoComplete="tel"
                      returnKeyType="next"
                    />
                    <View style={styles.leadingIcon} pointerEvents="none">
                      <Ionicons name="call-outline" size={20} color={D.neon} />
                    </View>
                  </View>
                  {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                </View>

                {/* Password */}
                <View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, styles.inputWithLeadingIcon, styles.inputWithIcon, errors.password ? styles.inputError : null]}
                      placeholder="Password"
                      placeholderTextColor={D.textFaint}
                      value={password}
                      onChangeText={(v) => { setPassword(v); clearError('password'); }}
                      secureTextEntry={!showPassword}
                      textContentType="newPassword"
                      autoComplete="new-password"
                      returnKeyType="next"
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
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                {/* Confirm Password */}
                <View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, styles.inputWithLeadingIcon, styles.inputWithIcon, errors.confirmPassword ? styles.inputError : null]}
                      placeholder="Confirm Password"
                      placeholderTextColor={D.textFaint}
                      value={confirmPassword}
                      onChangeText={(v) => { setConfirmPassword(v); clearError('confirmPassword'); }}
                      secureTextEntry={!showConfirm}
                      textContentType="newPassword"
                      autoComplete="new-password"
                      returnKeyType="done"
                      onSubmitEditing={handleContinue}
                    />
                    <View style={styles.leadingIcon} pointerEvents="none">
                      <Ionicons name="lock-closed-outline" size={20} color={D.neon} />
                    </View>
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowConfirm(!showConfirm)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      <Ionicons
                        name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={D.textFaint}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                  style={styles.continueBtn}
                  onPress={handleContinue}
                  activeOpacity={0.85}
                >
                  <Text style={styles.continueBtnText}>Continue</Text>
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

              {/* Sign In */}
              <View style={[styles.signinRow, { paddingBottom: insets.bottom + 8 }]}>
                <Text style={styles.signinText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                  <Text style={styles.signinLink}>Sign In</Text>
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
    fontSize: 24,
    color: D.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subheading: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: D.textMuted,
    textAlign: 'center',
    marginBottom: 24,
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
  inputError: {
    borderColor: D.danger,
  },
  errorText: {
    fontFamily: Fonts.regular,
    color: D.danger,
    fontSize: 12,
    marginTop: 5,
    marginLeft: 14,
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

  // Continue button
  continueBtn: {
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
  continueBtnText: {
    fontFamily: Fonts.bold,
    color: D.ink,
    fontSize: 16,
    letterSpacing: 0.3,
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

  // Sign in
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signinText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: D.textMuted,
  },
  signinLink: {
    fontFamily: Fonts.extraBold,
    fontSize: 14,
    color: D.neon,
  },
});
