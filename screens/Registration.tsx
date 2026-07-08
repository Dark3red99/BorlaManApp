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
import { Ionicons } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import {
  validateFullName,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
} from '../utils/validation';
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
            <View style={[styles.formColumn, isWide && styles.formColumnWide]}>
              {/* Heading */}
              <Text style={styles.heading}>Create your account</Text>

              {/* Form */}
              <View style={styles.form}>
                {/* Full Name */}
                <View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, styles.inputWithLeadingIcon, errors.fullName ? styles.inputError : null]}
                      placeholder="Full name"
                      placeholderTextColor={PLACEHOLDER}
                      value={fullName}
                      onChangeText={(v) => { setFullName(v); clearError('fullName'); }}
                      autoCapitalize="words"
                      textContentType="name"
                      autoComplete="name"
                      returnKeyType="next"
                    />
                    <View style={styles.leadingIcon} pointerEvents="none">
                      <Ionicons name="person-outline" size={20} color={PRIMARY} />
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
                      placeholderTextColor={PLACEHOLDER}
                      value={phone}
                      onChangeText={(v) => { setPhone(v); clearError('phone'); }}
                      keyboardType="phone-pad"
                      textContentType="telephoneNumber"
                      autoComplete="tel"
                      returnKeyType="next"
                    />
                    <View style={styles.leadingIcon} pointerEvents="none">
                      <Ionicons name="call-outline" size={20} color={PRIMARY} />
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
                      placeholderTextColor={PLACEHOLDER}
                      value={password}
                      onChangeText={(v) => { setPassword(v); clearError('password'); }}
                      secureTextEntry={!showPassword}
                      textContentType="newPassword"
                      autoComplete="new-password"
                      returnKeyType="next"
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
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                {/* Confirm Password */}
                <View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, styles.inputWithLeadingIcon, styles.inputWithIcon, errors.confirmPassword ? styles.inputError : null]}
                      placeholder="Confirm Password"
                      placeholderTextColor={PLACEHOLDER}
                      value={confirmPassword}
                      onChangeText={(v) => { setConfirmPassword(v); clearError('confirmPassword'); }}
                      secureTextEntry={!showConfirm}
                      textContentType="newPassword"
                      autoComplete="new-password"
                      returnKeyType="done"
                      onSubmitEditing={handleContinue}
                    />
                    <View style={styles.leadingIcon} pointerEvents="none">
                      <Ionicons name="lock-closed-outline" size={20} color={PRIMARY} />
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
                        color={PLACEHOLDER}
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
            </View>

            {/* Sign In band */}
            <WaveDivider fill={PRIMARY_SOFT} style={styles.footerWave} />
            <View style={[styles.signinRow, { paddingBottom: insets.bottom + 24 }]}>
              <Text style={styles.signinText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                <Text style={styles.signinLink}>Sign In</Text>
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
  formColumn: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 8,
  },
  formColumnWide: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },

  // Heading
  heading: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 28,
    color: PRIMARY,
    textAlign: 'center',
    marginBottom: 28,
    marginTop: 20,
    lineHeight: 36,
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
  inputError: {
    borderColor: ERROR,
  },
  errorText: {
    fontFamily: FONT_REGULAR,
    color: ERROR,
    fontSize: 12,
    marginTop: 5,
    marginLeft: 14,
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

  // Continue button
  continueBtn: {
    height: 58,
    backgroundColor: PRIMARY,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  continueBtnText: {
    fontFamily: FONT_BOLD,
    color: WHITE,
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

  // Sign in
  footerWave: {
    marginTop: 16,
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PRIMARY_SOFT,
    paddingTop: 10,
  },
  signinText: {
    fontFamily: FONT_REGULAR,
    fontSize: 14,
    color: '#5B6B63',
  },
  signinLink: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 14,
    color: PRIMARY,
  },
});
